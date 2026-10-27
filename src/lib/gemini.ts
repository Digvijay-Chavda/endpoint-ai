import { GoogleGenerativeAI } from '@google/generative-ai';

export const SYSTEM_INSTRUCTION = `You are a JSON API mock data generator. 
The user will describe what kind of API response they want.
You MUST respond with ONLY valid JSON — no prose, no markdown code fences, no explanation.
The output should be a realistic, detailed mock payload that exactly what a real REST API would return.
If the user asks for a list, return a JSON array. If they ask for a single object, return a JSON object.
Use realistic values: real-sounding names, plausible prices, real URL structures, proper UUIDs where appropriate.
Never truncate — always provide the full requested quantity.`;

// Google retires Gemini models over time, so the model can be changed without a code change.
export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const getModelName = () => process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

// 503 (overloaded) and 429 (rate limited) are temporary conditions on Google's side
export function isBusyError(message: string) {
  return /\[(503|429) |high demand|overloaded|RESOURCE_EXHAUSTED/i.test(message);
}

// 404: the model name is retired or not available to this key
export function isModelUnavailableError(message: string) {
  return /\[404 /.test(message);
}

export interface GeminiDeps {
  generate(model: string, input: { text: string }[]): Promise<string>;
  listModels(): Promise<{ name: string; methods: string[] }[]>;
  sleep(ms: number): Promise<void>;
}

export function realDeps(apiKey: string): GeminiDeps {
  const genAI = new GoogleGenerativeAI(apiKey);
  return {
    async generate(model, input) {
      const result = await genAI.getGenerativeModel({ model }).generateContent(input);
      return result.response.text();
    },
    async listModels() {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
        headers: { 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models ?? []).map((m: { name: string; supportedGenerationMethods?: string[] }) => ({
        name: String(m.name).replace(/^models\//, ''),
        methods: m.supportedGenerationMethods ?? [],
      }));
    },
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
  };
}

const EXCLUDED = /(tts|image|live|audio|embed|robotics|computer|native|vision|veo|imagen|aqa|learnlm|gemma|thinking)/i;

/** Text-capable Flash models for this key, stable releases before previews/experiments. */
export function pickFallbackModels(models: { name: string; methods: string[] }[], exclude: string): string[] {
  return models
    .filter(m => m.methods.includes('generateContent') && /flash/i.test(m.name) && !EXCLUDED.test(m.name) && m.name !== exclude)
    .map(m => m.name)
    .sort((a, b) => Number(/preview|exp/i.test(a)) - Number(/preview|exp/i.test(b)) || b.localeCompare(a))
    .slice(0, 3);
}

const RETRY_DELAYS_MS = [1000, 2500];

/**
 * Generates with the configured model, retrying while Google reports it busy. If it stays busy or
 * unavailable, tries other Flash models that the key can use before giving up.
 */
export async function generateWithFallback(
  input: { text: string }[],
  deps: GeminiDeps,
  primary = getModelName()
): Promise<{ text: string; model: string }> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return { text: await deps.generate(primary, input), model: primary };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : '';
      if (isModelUnavailableError(message)) break; // retrying a missing model is pointless
      if (!isBusyError(message)) throw error;
      if (attempt < RETRY_DELAYS_MS.length) await deps.sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  const message = lastError instanceof Error ? lastError.message : '';
  if (!isBusyError(message) && !isModelUnavailableError(message)) throw lastError;

  let fallbacks: string[] = [];
  try {
    fallbacks = pickFallbackModels(await deps.listModels(), primary);
  } catch {
    // listing is best-effort; fall through to the original error
  }
  for (const model of fallbacks) {
    try {
      return { text: await deps.generate(model, input), model };
    } catch (error) {
      lastError = error;
      const m = error instanceof Error ? error.message : '';
      if (!isBusyError(m) && !isModelUnavailableError(m)) throw error;
    }
  }
  throw lastError;
}

export function cleanJsonText(rawText: string) {
  return rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}
