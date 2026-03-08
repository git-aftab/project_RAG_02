import { supabase } from "../config/supabase.js";
import { RETRIEVAL_COUNT } from "../config/constant.js";

export async function search(rewrittenQuery, hydeEmbedding, options = {}) {
  const {
    language = null, //null = no filter
    tags = null, //null = no filter
    count = RETRIEVAL_COUNT,
  } = options;
  console.log(``);
}
