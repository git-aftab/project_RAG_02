// MODEL 
export const EMBEDDING_MODEL = "qwen/qwen3-embedding-0.6b";
export const CHAT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";
export const EMBEDDING_DIMESION = "1024";

// Chunking constants
export const CHUNK_SIZE = 400;
export const CHUNK_OVERLAP = 80;

// RETRIEVEL CONSTANTS
// how many chunks to retrieve before retrieval
export const RETRIEVEL_COUNT = 8
export const FINAL_CONTEXT_COUNT = 3

// OpenRouter
export const OPENROUTER_BASE_URL = "Https://openrouter.ai/api/v1"