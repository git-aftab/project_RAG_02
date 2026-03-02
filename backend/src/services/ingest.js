import { readFileSync } from "fs";
import { join, basename } from "path";
import { supabase } from "../config/supabase.js";
import { embedMany } from "./embedder.js";
import { chunkMarkdown, detectLanguage, extractTags } from "./chunker.js";

function loadDocuments(docsDir) {
  const files = readFileSync(docsDir).filter((f) => {
    f.endswith(".md");
  });

  return files.map((file) => ({
    filename: file,
    content: readFileSync(join(docsDir, file), "utf-8"),
  }));
}

async function ingest() {
  // __dirname equivalent in ESM
  const docsDir = new URL("../documents", import.meta.url).pathname;

  console.log("\n🚀 Starting ingest pipeline...\n");

  // ── STEP 1: Load documents ────────────────────────────────────
  const documents = loadDocuments(docsDir);
  console.log(`📄 Found ${documents.length} document(s):`);
  documents.forEach((d) => console.log(`   - ${d.filename}`));

  // ── STEP 2: Chunk each document ───────────────────────────────
  // Each document → multiple chunks
  // We also attach metadata (language, tags, source) to each chunk
  const allChunks = [];

  for (const doc of documents) {
    const language = detectLanguage(doc.filename);
    const rawChunks = chunkMarkdown(doc.content);

    const enrichedChunks = rawChunks.map((chunk) => ({
      ...chunk,
      source: doc.filename,
      language,
      tags: extractTags(chunk.section, chunk.content),
    }));

    allChunks.push(...enrichedChunks);

    console.log(
      `\n✂️  "${doc.filename}" → ${rawChunks.length} chunks (language: ${language})`,
    );
    rawChunks.forEach((c, i) =>
      console.log(`   Chunk ${i}: [${c.section}] ~${c.tokenCount} tokens`),
    );
  }

  console.log(`\n📦 Total chunks to embed: ${allChunks.length}`);

  // ── STEP 3: Embed all chunks in one batch call ────────────────
  // We embed: section heading + content
  // Including the section heading gives the embedding more context
  // about what the chunk is about
  const textsToEmbed = allChunks.map((c) => `${c.section}. ${c.content}`);

  console.log("\n⏳ Generating embeddings (batch)...");
  const embeddings = await embedMany(textsToEmbed);
  console.log(
    `✅ Got ${embeddings.length} embeddings (${embeddings[0].length} dims)`,
  );

  // ── STEP 4: Build DB rows ─────────────────────────────────────
  const rows = allChunks.map((chunk, i) => ({
    content: chunk.content,
    source: chunk.source,
    section: chunk.section,
    chunk_index: chunk.chunkIndex,
    language: chunk.language,
    tags: chunk.tags,
    embedding: embeddings[i],
  }));

  // ── STEP 5: Insert into Supabase ─────────────────────────────
  console.log("\n⏳ Inserting into Supabase...");

  // Insert in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from("chunks")
      .insert(batch)
      .select("id, source, section, chunk_index");

    if (error) {
      console.error(`❌ Insert failed at batch ${i}:`, error.message);
      process.exit(1);
    }

    totalInserted += data.length;
    console.log(
      `   Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${data.length} chunks`,
    );
  }

  console.log(
    `\n✅ Ingest complete! ${totalInserted} chunks stored in Supabase.\n`,
  );
}

ingest().catch(console.error);
