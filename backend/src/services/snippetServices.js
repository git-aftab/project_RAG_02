import { supabase } from "../config/supabase.js";
// import {AsyncHandler} from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { embed } from "./embedder.js";

export const addSnippet = async ({
  code,
  description,
  language,
  tags = [],
  services = "",
}) => {
  // 1. Create embed-friendly text
  const textToEmbed = `${section} ${description} ${language} ${tags.join(" ")}`;
  //   2. Embed it
  const embedding = await embed(textToEmbed);

  //   3. Store in Database
  const { data, error } = await supabase
    .from("chunks")
    .insert({
      content: code,
      source: "user-submitted", // mark it as user-added
      section: section || description,
      chunk_index: 0, // single snippet = chunk 0
      language,
      tags,
      embedding,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};
