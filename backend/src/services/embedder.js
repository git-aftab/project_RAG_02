import { EMBEDDING_MODEL, OPENROUTER_BASE_URL } from "../config/constant.js";

// Sanitizing the text to prevent JSON parsing error
function sanitize(text) {
  return text.replace(/\r\n/g, " ").replace(/\t/g, " ").trim();
}

// Single text -> single vector
// used for: embedding a user query at search time
export async function embed(text) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: sanitize(text),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding failed ${response.status}: ${err}`);
  }

  const data = await response.json();
  console.log(data);
  return data.data[0].embedding;
}

// Array of texts => array of vectors (ONE API CALL)
// USED for : Batch embedding all chunks during ingest
export async function embedMany(texts) {
  const clean = texts.map(sanitize);

  const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: clean,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Batch embedding failed: ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  // ✅ DEBUG: Log the response structure
  console.log(
    "🔍 OpenRouter embedMany response:",
    JSON.stringify(data, null, 2),
  );

  // ✅ FIXED: Check if data.data exists and is an array
  if (!data.data || !Array.isArray(data.data)) {
    console.error("❌ Unexpected response structure:", data);
    throw new Error("Invalid embedding response: missing data.data array");
  }

  // Sort by index and return embeddings
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}
