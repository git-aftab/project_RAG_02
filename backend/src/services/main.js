// Full RAG pipeline:
//
//   raw query
//     → processQuery()     [queryProcessor.js]
//         → rewriteQuery()   parallel  ─┐
//         → generateHyDE()   parallel  ─┘
//     → search()           [search.js]
//         → hybrid_search() SQL function
//         → metadata filter (optional)
//     → generateAnswer()   [rag.js]
//         → LLM with top chunks as context
//     → print answer

import { processQueery } from "./queryProcessor.js";
import { search } from "./search.js";
import { generateAnswer } from "./rag.js";

async function ask(query, searchOptions = {}) {
  console.log("\n" + "=".repeat(65));
  console.log(`query: "${query}"`);

  if (Object.keys(searchOptions).length > 0) {
    console.log(`Filter: ${JSON.stringify(searchOptions)}`);
  }
  console.log("═".repeat(65));
  const { reWrittenQuery, hydeEmbedding } = await processQueery(query);
  const chunks = await search(reWrittenQuery, hydeEmbedding, searchOptions);

  if (chunks.length === 0) {
    console.log("\n No relevent chunks found.");
    return;
  }

  console.log("\n Generating answer...");
  const answer = await generateAnswer(query, chunks);
  console.log("\n💬 Answer:");
  console.log("─".repeat(65));
  console.log(answer);
  console.log("─".repeat(65));

  return answer;

  // ── Test queries ──────────────────────────────────────────────────
  // Designed to test each feature of our pipeline:
  //
  //   Q1 → vague query   → tests query rewriting
  //   Q2 → exact keyword → tests keyword search leg
  //   Q3 → lang filter   → tests metadata filtering
  //   Q4 → concept query → tests HyDE (no exact keywords match)
  //   Q5 → lang filter   → tests JS-specific filter
  async function main() {
    console.log(
      "🚀 Code RAG — Hybrid Search + Chunking + HyDE + Query Rewriting\n",
    );

    // Q1: Vague query — query rewriter should fix this
    await ask("how do i do the reverse thing for strings in python");

    // Q2: Keyword-heavy query — keyword search leg should dominate
    await ask("split and join string python");

    // Q3: Language-filtered search — only Python results
    await ask("how to remove duplicates", { language: "python" });

    // Q4: Concept query — HyDE shines here (no exact keyword match)
    await ask("add up all values in a collection");

    // Q5: Language-filtered — only JS results
    await ask("find an element in a collection", { language: "javascript" });
  }

  main().catch(console.error);
}
