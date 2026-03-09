// One job: retrieved chunks + original query → LLM answer
// Key improvements over basic version:
//   1. Chunks ordered by rrf_score (most relevant first)
//      → fixes "lost in the middle" problem where LLMs ignore
//        content buried in the middle of long context
//   2. Source attribution in prompt → LLM can cite which doc
//   3. Original query used (not rewritten) → more natural answer

import {
  CHAT_MODEL,
  OPENROUTER_BASE_URL,
  FINAL_CONTEXT_COUNT,
} from "./config.js";

// originalQuery : the user's raw question (before rewriting)
// chunks        : array from search.js, already sorted by rrf_score
export async function generateAnswer(originalQuery, chunks) {
  // Take only the top N chunks for the LLM context
  // More chunks = more tokens = slower + sometimes worse answers
  // FINAL_CONTEXT_COUNT (default 3) is the sweet spot
  const topChunks = chunks.slice(0, FINAL_CONTEXT_COUNT);

  // Build context block
  // Chunks are already sorted best-first from search.js
  // → most relevant chunk at position 1 (LLM pays most attention here)
  const context = topChunks
    .map((chunk, i) =>
      `
[Chunk ${i + 1}] Source: ${chunk.source} › ${chunk.section}
Language: ${chunk.language}
---
${chunk.content}
    `.trim(),
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful coding assistant with deep knowledge of programming.
Answer the user's question using ONLY the code documentation chunks provided.
Always include relevant code examples from the chunks.
If the exact answer isn't in the chunks, say so clearly — do not make up code.
Keep answers concise and practical.`;

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
    throw new Error(`LLM call failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
