export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export const CHAT_MODEL = "google/gemini-2.0-flash-exp:free";

export const EMBEDDING_DIMENSIONS  = 1536;  // text-embedding-3-small uses 1536

// ── Chunking constants ────────────────────────────────────────────
// Max tokens per chunk — keeping well under 8192 model limit
export const CHUNK_SIZE            = 400;   // tokens (approx chars/4)
// How many tokens the next chunk repeats from the previous one
// Prevents losing context at chunk boundaries
export const CHUNK_OVERLAP         = 80;

// ── Retrieval constants ───────────────────────────────────────────
// How many chunks to retrieve before reranking
export const RETRIEVAL_COUNT       = 8;
// How many chunks to send to LLM after retrieval
export const FINAL_CONTEXT_COUNT   = 3;

// ── OpenRouter ────────────────────────────────────────────────────
export const OPENROUTER_BASE_URL   = "https://openrouter.ai/api/v1";