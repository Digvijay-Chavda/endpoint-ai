import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { unstable_cache } from 'next/cache';

const SYSTEM_INSTRUCTION = `You are a JSON API mock data generator. 
The user will describe what kind of API response they want.
You MUST respond with ONLY valid JSON — no prose, no markdown code fences, no explanation.
The output should be a realistic, detailed mock payload that exactly what a real REST API would return.
If the user asks for a list, return a JSON array. If they ask for a single object, return a JSON object.
Use realistic values: real-sounding names, plausible prices, real URL structures, proper UUIDs where appropriate.
Never truncate — always provide the full requested quantity.`;

async function generateWithGemini(prompt: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured. Add it to your .env file and restart the server.' },
      { status: 503 }
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
    console.error('[AI Generate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate payload';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
