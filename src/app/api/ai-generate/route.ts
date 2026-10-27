import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';
import { getOwnerId, unauthorized } from '@/lib/owner';

const SYSTEM_INSTRUCTION = `You are a JSON API mock data generator.
The user will describe what kind of API response they want.
You MUST respond with ONLY valid JSON — no prose, no markdown code fences, no explanation.
The output should be a realistic, detailed mock payload that exactly what a real REST API would return.
If the user asks for a list, return a JSON array. If they ask for a single object, return a JSON object.
Use realistic values: real-sounding names, plausible prices, real URL structures, proper UUIDs where appropriate.
Never truncate — always provide the full requested quantity.`;

const API_KEY_HEADER = 'x-gemini-api-key';

// Google retires Gemini models over time, so the model can be changed without a code change.
const DEFAULT_MODEL = 'gemini-3.8-flash';
const getModelName = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

function isUsableKey(key: string | undefined): key is string {
  return !!key && key !== 'your_gemini_api_key_here';
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: getModelName() });
  const result = await model.generateContent([
    { text: SYSTEM_INSTRUCTION },
    { text: `Generate a mock API JSON response for: ${prompt}` },
  ]);
  const rawText = result.response.text().trim();
  return rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
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
    console.error('[AI Generate] Error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
