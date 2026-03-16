import {
  CHAT_MODEL,
  FINAL_CONTEXT_COUNT,
  GROQ_BASE_URL,
} from "../config/constant.js";

export async function generateAnswer(originalQuery, chunks) {
  const topChunks = chunks.slice(0, FINAL_CONTEXT_COUNT);

  const context = topChunks
    .map((chunk, i) => {
      return `[${i + 1}] Source: ${chunk.source} | Section: ${chunk.section} | Language: ${chunk.language}
${chunk.content}`;
    })
    .join("\n\n");

  const prompt = `You are a helpful coding assistant. Answer the user's question using ONLY the code snippets provided below. If the snippets don't contain the answer, say so.

Question: ${originalQuery}

Code Snippets:
${context}

Answer:`;

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Answer generation failed: ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
