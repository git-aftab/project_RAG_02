import { embed } from "./embedder.js";
import { CHAT_MODEL, GROQ_BASE_URL } from "../config/constant.js";

async function callLLM(prompt) {
  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function rewriteQuery(rawQuery) {
  const prompt = `Rewrite this search query to be more technical and precise. Return ONLY the rewritten query, nothing else.

Query: "${rawQuery}"

Rewritten query:`;

  try {
    const rewritten = await callLLM(prompt);
    return rewritten;
  } catch (error) {
    console.warn("Query rewrite failed, using original:", error.message);
    return rawQuery;
  }
}

// HyDE 
export async function generateHyDE(query) {
  const prompt = `You are a code expert. Generate a short code snippet that would answer this query: "${query}"

Return ONLY the code snippet, no explanations.`;

  try {
    const hypotheticalAnswer = await callLLM(prompt);
    const hydeEmbedding = await embed(hypotheticalAnswer);
    return hydeEmbedding;
  } catch (error) {
    console.warn("HyDE failed, using query embedding:", error.message);
    return await embed(query);
  }
}

// Process Query 
export async function processQuery(rawQuery) {
  const [rewrittenQuery, hydeEmbedding] = await Promise.all([
    rewriteQuery(rawQuery),
    generateHyDE(rawQuery),
  ]);

  return { rewrittenQuery, hydeEmbedding };
}