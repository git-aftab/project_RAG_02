import { readFileSync } from "fs";
import { join, basename } from "path";
import { supabase } from "../config/supabase.js";
import { embedMany } from "./embedder.js";
import { chunkMarkdown, detectLanguage, extractTags } from "./chunker.js";

function loadDocuments(docsDir) {
  const files = readFileSync(docsDir).filter((f) => {
    f.endswith(".md");
  });

  return files.map((file)=>({
    filename: file,
    content: readFileSync(join(docsDir,file), "utf-8")
  }))
}
