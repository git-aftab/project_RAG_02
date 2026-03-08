// this program has 2 jobs:
// 1. query rewriting -> clean up the vague user queries (fixes poorly worded queries)
// 2. HyDE -> generate hypothetical answer -> embed that (makes embedding much closer to stored chunks)

import { CHAT_MODEL, OPENROUTER_BASE_URL } from "../config/constant";
import { embed } from "./embedder";

// call LLM() for query and HyDE generation
async function callLLM(prompt) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      module: CHAT_MODEL,
      message: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, //Low = deterministic, good for query rewriting,
      max_token: 200,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM call failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  console.log(data);
  return data.choices[0].message.content.trim();
}

// Takes a raw user query → returns a cleaner, more precise version
//
// Examples:
//   "how do i do the reverse thing for strings" → "reverse a string"
//   "remove same items from list"               → "remove duplicates from array"
//   "add numbers together javascript"           → "sum array of numbers javascript"
//
// Why this helps:
//   The embedding model performs much better on clean technical
//   queries than on casual conversational language.
export async function rewriteQuery(rawQuery) {
  const prompt = `You are a search query optimizer for a code documentation search engine.
Rewrite the following user query to be more precise, technical, and searchable.
Return ONLY the rewritten query — no explanation, no quotes, no punctuation at the end.

User query: "${rawQuery}"`;

  try {
    const reWritten = await callLLM(prompt);
    console.log(`Query reWrite: ${rawQuery}     ->      ${reWritten}`);
    return reWritten;
  } catch (error) {
    // if reWrite fails, fall back to original query - don't block the search
    console.warn("Query reWrite failed, Using original search!!");
    return rawQuery;
  }
}

// HyDE = Hypothetical Document Embedding
//
// The problem with embedding a query directly:
//   Query: "how to reverse a string?"
//   This QUESTION lives in a different vector space than
//   ANSWERS like "def reverse_string(s): return s[::-1]"
//   So cosine similarity is lower than it should be.
//
// HyDE solution:
//   1. Ask LLM to write a SHORT hypothetical answer (code snippet)
//   2. Embed THAT instead of the original query
//   3. The hypothetical answer looks like stored chunks → closer vectors
//      → higher cosine similarity → better retrieval
//
// Returns: the embedding vector of the hypothetical answer

export async function generateHyDE(query) {
  const prompt = `Write a SHORT code snippet and one-line explaination that answers this question.Be concise. Use Proper code formatting. 2-5 lines of code maximum.
    
    Question: ${query}`;

  try {
    const hypotheticalAnswer = await callLLM(prompt);
    console.log(`HyDE Answer: ${hypotheticalAnswer.subString(0, 80)}....`);
    // embed the hypothectical answer.
    const embedHypoAns = await embed(hypotheticalAnswer);
    return embedHypoAns;
  } catch (error) {
    console.warn("HyDE failed, FAlling back to the original query");
    return await embed(query);
  }
}

// processQuery()
// Main export — runs BOTH techniques in parallel
//
// Returns:
// {
//   rewrittenQuery: "reverse a string",     ← for keyword search leg
//   hydeEmbedding:  [0.23, -0.81, ...]      ← for semantic search leg
// }
//
// The two results are used separately in search.js:
//   rewrittenQuery → goes into the keyword (FTS) leg
//   hydeEmbedding  → goes into the semantic (vector) leg

export async function processQueery(rawQuery) {
  console.log("\n processing Query....");

  //   Run both the function in parallel - no reason to wait for one before the other.
  const [rewrittenQuery, hydeEmbedding] = await Promise.all([
    rewriteQuery(rawQuery),
    generateHyDE(rawQuery),
  ]);

  return { rewrittenQuery, hydeEmbedding };
}
