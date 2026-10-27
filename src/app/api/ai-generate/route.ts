import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getOwnerId, unauthorized } from '@/lib/owner';
import {
  SYSTEM_INSTRUCTION,
  cleanJsonText,
  generateWithFallback,
  getModelName,
  isBusyError,
  isModelUnavailableError,
  realDeps,
} from '@/lib/gemini';

// Retries add a few seconds on top of generation time
export const maxDuration = 60;

const API_KEY_HEADER = 'x-gemini-api-key';

function isUsableKey(key: string | undefined): key is string {
  return !!key && key !== 'your_gemini_api_key_here';
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const { text, model } = await generateWithFallback(
    [
      { text: SYSTEM_INSTRUCTION },
      { text: `Generate a mock API JSON response for: ${prompt}` },
    ],
    realDeps(apiKey)
  );
  if (model !== getModelName()) console.warn(`[AI Generate] used fallback model ${model}`);
  return cleanJsonText(text);
}

// Wrap with Next.js unstable_cache keyed by prompt so identical prompts
// are served from the framework cache without a new LLM call (cached 1 hour).
function getCachedGenerate(apiKey: string) {
  return unstable_cache(
    async (prompt: string) => generateWithGemini(prompt, apiKey),
    ['ai-generate'],
    { revalidate: 3600 }
  );
}

function isInvalidKeyError(message: string) {
  return /API key not valid|API_KEY_INVALID|\[40[013] /i.test(message);
}

// Lets the UI know whether it has to ask the user for a key.
export async function GET() {
  if (!(await getOwnerId())) return unauthorized();
  return NextResponse.json({ serverKeyConfigured: isUsableKey(process.env.GEMINI_API_KEY) });
}

export async function POST(request: Request) {
  if (!(await getOwnerId())) return unauthorized();
  const headerKey = request.headers.get(API_KEY_HEADER)?.trim();
  const apiKey = isUsableKey(headerKey) ? headerKey : process.env.GEMINI_API_KEY;
  if (!isUsableKey(apiKey)) {
    return NextResponse.json(
      { error: 'No Gemini API key found. Add your key in the AI generator settings.', code: 'NO_API_KEY' },
      { status: 401 }
    );
  }

  let prompt: string;
  try {
    const body = await request.json();
    prompt = body.prompt?.trim();
    if (!prompt) throw new Error('Missing prompt');
  } catch {
    return NextResponse.json({ error: 'Request body must have a "prompt" string.' }, { status: 400 });
  }

  try {
    const cachedGenerate = getCachedGenerate(apiKey);
    const cleaned = await cachedGenerate(prompt);

    // Validate JSON before sending back
    JSON.parse(cleaned);

    return NextResponse.json({ result: cleaned });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate payload';
    if (isInvalidKeyError(errorMessage)) {
      return NextResponse.json(
        { error: 'Your Gemini API key is not valid. Check it and try again.', code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }
    if (isModelUnavailableError(errorMessage)) {
      return NextResponse.json(
        { error: 'The AI model is unavailable right now. Please try again later.', code: 'MODEL_UNAVAILABLE' },
        { status: 503 }
      );
    }
    if (isBusyError(errorMessage)) {
      return NextResponse.json(
        { error: 'Gemini is busy right now. Please try again in a moment.', code: 'MODEL_BUSY' },
        { status: 503 }
      );
    }
    console.error('[AI Generate] Error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
