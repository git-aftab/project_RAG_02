// One job: retrieved chunks + original query → LLM answer
// Key improvements over basic version:
//   1. Chunks ordered by rrf_score (most relevant first)
//      → fixes "lost in the middle" problem where LLMs ignore
//        content buried in the middle of long context
//   2. Source attribution in prompt → LLM can cite which doc
//   3. Original query used (not rewritten) → more natural answer
import {
  CHAT_MODEL,
  FINAL_CONTEXT_COUNT,
  OPENROUTER_BASE_URL,
} from "../config/constant.js";

export async function generateAnswer(originalQuery, chunks) {
  const topChunks = chunks.slice(0, FINAL_CONTEXT_COUNT);

  const context = topChunks
    .map((chunk, i) =>
      `[Chunk ${i + 1}] Source: ${chunk.source} > ${chunk.section}
  Language: ${chunk.language}
  ---
  ${chunk.content}`.trim(),
    )
    .join();

  const systemPrompt = `You are a helpful coding assistant with deep knowledge of Programming.
    Answer the user's question using ONLY the code documentation chunks provided.
    Always include relevent code examples from the chunks.
    If the exact answer isn't in the chunks, say so clearly - do not make up code.
    Keep the answer concise and practical.`;

  const userPrompt = `Question: ${originalQuery}
    Here are the most relevant documentation chunks retrieved for your question: 
    ${context}
    Please answer the question based on these chunks. Include code examples.`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM Call failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].messages.content;
}
