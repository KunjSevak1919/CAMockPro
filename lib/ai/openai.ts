// ============================================================
// MockCA.ai — OpenAI Client (text-embedding-ada-002)
// All OpenAI embedding calls must go through this module only.
// ============================================================

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embed(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.trim().toLowerCase(),
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("embed() failed:", err);
    throw err;
  }
}
