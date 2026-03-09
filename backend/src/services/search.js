import { supabase } from "../config/supabase.js";
import { RETRIEVAL_COUNT } from "../config/constant.js";

export async function search(rewrittenQuery, hydeEmbedding, options = {}) {
  const {
    language = null, //null = no filter
    tags = null, //null = no filter
    count = RETRIEVAL_COUNT,
  } = options;
  console.log(
    `\n Hybrid search (language: ${language ?? "any"}, tags: ${tags ?? "any"})`,
  );

  const { data, error } = await supabase.rpc("hybrid_search", {
    query_text: rewrittenQuery,
    query_embedding: hydeEmbedding,
    match_count: count,
    filter_language: language,
    filter_tags: tags,
  });

  if (error) {
    throw new Error(`Search failed`);
  }

  console.log(`Found ${data.length} chunk(s):`);
  data.forEach((chunk, i) => {
    console.log(
      `   ${i + i}. [${chunk.language}] ${chunk.source} > "${chunk.section}" (score: ${chunk.rrf_score.toFixed(4)})`,
    );
  });
  return data;
}
