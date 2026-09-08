import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Generates academic text with resilient exponential backoff retry and model fallback.
 * Handles 503 (high demand), 429 (rate limit), and temporary network fluctuations gracefully.
 */
export async function generateAcademicText(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return '';
  }

  const ai = getGeminiAI();

  // Models to attempt in sequence if temporary spikes or 503 errors occur
  const models = ['gemini-3.7-flash', 'gemini-3.1-flash-lite'];
  const maxAttemptsPerModel = 2;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are an authoritative Senior Professor and IGNOU Project Evaluator. Write in-depth, rigorous, mathematically sound academic project content with comprehensive subsections, quantitative examples, literature references, and clear analytical prose.',
            temperature: 0.7
          }
        });

        if (response && response.text && response.text.trim()) {
          return response.text.trim();
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTemporary =
          errMsg.includes('503') ||
          err?.status === 503 ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          err?.status === 429;

        // If temporary error and retries are available, apply exponential backoff with jitter
        if (isTemporary) {
          const backoffMs = attempt * 1200 + Math.floor(Math.random() * 400);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // For non-temporary errors on this model, break inner loop to try next fallback model
        break;
      }
    }
  }

  return '';
}

