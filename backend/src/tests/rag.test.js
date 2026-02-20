// test-models.js
// ─────────────────────────────────────────────────────────────────
// Standalone test file — no Supabase needed.
// Tests BOTH models before running the full project.
//
// Run with:  node test-models.js
// ─────────────────────────────────────────────────────────────────

import "dotenv/config"
const OPENROUTER_BASE_URL  = "https://openrouter.ai/api/v1";
const EMBEDDING_MODEL      = "openai/text-embedding-3-small";
const CHAT_MODEL           = "google/gemini-2.0-flash-001";
const API_KEY              = process.env.OPENROUTER_API_KEY;

// ── Helpers ───────────────────────────────────────────────────────
function pass(msg) { console.log(`   ✅ ${msg}`); }
function fail(msg) { console.log(`   ❌ ${msg}`); }
function info(msg) { console.log(`   ℹ️  ${msg}`); }

// ═══════════════════════════════════════════════════════════════════
// TEST 1: API Key Check
// ═══════════════════════════════════════════════════════════════════
function testApiKey() {
  console.log("\n" + "─".repeat(55));
  console.log("TEST 1: API Key");
  console.log("─".repeat(55));

  if (!API_KEY) {
    fail("OPENROUTER_API_KEY is not set in environment");
    fail("Make sure you ran: export OPENROUTER_API_KEY=your_key");
    fail("Or on Windows:     set OPENROUTER_API_KEY=your_key");
    process.exit(1);
  }

  // Show partial key so you can confirm it's the right one
  const masked = API_KEY.substring(0, 8) + "..." + API_KEY.slice(-4);
  pass(`API key found: ${masked}`);
  info(`Key length: ${API_KEY.length} characters`);
}

// ═══════════════════════════════════════════════════════════════════
// TEST 2: Embedding Model
// ═══════════════════════════════════════════════════════════════════
async function testEmbeddingModel() {
  console.log("\n" + "─".repeat(55));
  console.log("TEST 2: Embedding Model");
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log("─".repeat(55));

  const testText = "reverse a string in python";
  info(`Input text: "${testText}"`);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: testText,
      }),
    });

    // ── Check HTTP status ─────────────────────────────────────
    if (!response.ok) {
      const err = await response.text();
      fail(`HTTP ${response.status}: ${err}`);
      return false;
    }

    const data = await response.json();

    // ── Check response shape ──────────────────────────────────
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      fail("Unexpected response shape — no embedding in response");
      console.log("   Raw response:", JSON.stringify(data, null, 2));
      return false;
    }

    const embedding = data.data[0].embedding;

    // ── Validate the vector ───────────────────────────────────
    pass(`Response received`);
    pass(`Embedding is an array: ${Array.isArray(embedding)}`);
    pass(`Dimensions: ${embedding.length}`);

    // Check expected dimensions
    if (embedding.length === 1536) {
      pass(`Dimensions match expected 1536 ✓`);
    } else {
      fail(`Expected 1536 dims but got ${embedding.length}`);
      fail(`Update EMBEDDING_DIMENSIONS in config.js to ${embedding.length}`);
      fail(`Update vector(1536) in supabase_setup.sql to vector(${embedding.length})`);
    }

    // Check values are actual floats (not zeros or NaN)
    const allNumbers  = embedding.every((v) => typeof v === "number");
    const hasVariance = new Set(embedding.slice(0, 10)).size > 1;
    pass(`All values are numbers: ${allNumbers}`);
    pass(`Values have variance (not all zeros): ${hasVariance}`);

    // Show first few values so you can verify it looks real
    info(`First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(", ")}]`);

    // ── Test batch embedding ──────────────────────────────────
    console.log("\n   Testing batch embedding (2 texts at once)...");

    const batchResponse = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: ["reverse a string", "sort an array"],  // array input
      }),
    });

    const batchData = await batchResponse.json();

    if (batchData.data && batchData.data.length === 2) {
      pass(`Batch embedding works — got ${batchData.data.length} vectors`);
    } else {
      fail("Batch embedding failed or returned wrong count");
    }

    // ── Test cosine similarity (sanity check) ─────────────────
    console.log("\n   Testing cosine similarity sanity check...");

    const simResponse = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: [
          "reverse a string in python",    // similar to testText
          "how to make pizza",             // very different
        ],
      }),
    });

    const simData  = await simResponse.json();
    const vec1     = simData.data[0].embedding;
    const vec2     = simData.data[1].embedding;
    const similar  = cosineSimilarity(embedding, vec1);  // same topic
    const dissimilar = cosineSimilarity(embedding, vec2); // different topic

    pass(`Cosine similarity (same topic):     ${similar.toFixed(4)} (expect high, >0.8)`);
    pass(`Cosine similarity (different topic): ${dissimilar.toFixed(4)} (expect low, <0.5)`);

    if (similar > dissimilar) {
      pass("Similarity ordering is correct ✓ — model is working as expected");
    } else {
      fail("Similarity ordering is WRONG — something may be off with the model");
    }

    return true;

  } catch (err) {
    fail(`Exception: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 3: Chat / LLM Model
// ═══════════════════════════════════════════════════════════════════
async function testChatModel() {
  console.log("\n" + "─".repeat(55));
  console.log("TEST 3: Chat Model");
  console.log(`Model: ${CHAT_MODEL}`);
  console.log("─".repeat(55));

  const testPrompt = "Say exactly: 'Chat model working.' — nothing else.";
  info(`Prompt: "${testPrompt}"`);

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{ role: "user", content: testPrompt }],
        temperature: 0,
        max_tokens:  20,
      }),
    });

    // ── Check HTTP status ─────────────────────────────────────
    if (!response.ok) {
      const err = await response.text();
      fail(`HTTP ${response.status}: ${err}`);
      return false;
    }

    const data = await response.json();

    // ── Check response shape ──────────────────────────────────
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      fail("Unexpected response shape — no choices in response");
      console.log("   Raw response:", JSON.stringify(data, null, 2));
      return false;
    }

    const reply = data.choices[0].message.content;

    pass(`Response received`);
    pass(`Reply: "${reply}"`);
    pass(`Model used: ${data.model}`);

    if (data.usage) {
      info(`Tokens used — prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens}`);
    }

    // ── Test with a RAG-style prompt ──────────────────────────
    console.log("\n   Testing RAG-style prompt (context + question)...");

    const ragResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          {
            role: "system",
            content: "Answer questions using only the provided context.",
          },
          {
            role: "user",
            content: `Context: def reverse_string(s): return s[::-1]
                      Question: How do I reverse a string in Python?`,
          },
        ],
        temperature: 0.1,
        max_tokens:  100,
      }),
    });

    const ragData  = await ragResponse.json();
    const ragReply = ragData.choices[0].message.content;

    pass(`RAG-style prompt works`);
    pass(`Reply preview: "${ragReply.substring(0, 80)}..."`);

    return true;

  } catch (err) {
    fail(`Exception: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 4: HyDE Simulation
// Tests that the chat model can generate a hypothetical answer
// and the embedding model can embed it — the full HyDE loop
// ═══════════════════════════════════════════════════════════════════
async function testHyDE() {
  console.log("\n" + "─".repeat(55));
  console.log("TEST 4: HyDE Simulation (Chat → Embed loop)");
  console.log("─".repeat(55));

  const query = "how do I sort an array in JavaScript?";
  info(`Query: "${query}"`);

  try {
    // Step 1: Generate hypothetical answer
    console.log("\n   Step 1: Generating hypothetical answer...");
    const chatResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [{
          role: "user",
          content: `Write a SHORT code snippet answering: "${query}". 2-4 lines max.`,
        }],
        temperature: 0.1,
        max_tokens:  80,
      }),
    });

    const chatData = await chatResponse.json();
    const hypotheticalAnswer = chatData.choices[0].message.content;
    pass(`Hypothetical answer: "${hypotheticalAnswer.substring(0, 80)}"`);

    // Step 2: Embed the hypothetical answer
    console.log("\n   Step 2: Embedding hypothetical answer...");
    const embedResponse = await fetch(`${OPENROUTER_BASE_URL}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: hypotheticalAnswer.replace(/\n/g, " ").trim(),
      }),
    });

    const embedData  = await embedResponse.json();
    const hydeVector = embedData.data[0].embedding;

    pass(`HyDE vector generated: ${hydeVector.length} dimensions`);
    pass(`Full HyDE loop works ✓`);

    return true;

  } catch (err) {
    fail(`Exception: ${err.message}`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════
// Utility: Cosine Similarity
// ═══════════════════════════════════════════════════════════════════
function cosineSimilarity(vecA, vecB) {
  const dot    = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA   = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB   = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// ═══════════════════════════════════════════════════════════════════
// Run all tests
// ═══════════════════════════════════════════════════════════════════
async function runAll() {
  console.log("═".repeat(55));
  console.log("  OpenRouter Model Tests");
  console.log("═".repeat(55));

  // Test 1: sync — check key exists
  testApiKey();

  // Tests 2-4: async — hit the actual APIs
  const embeddingOk = await testEmbeddingModel();
  const chatOk      = await testChatModel();
  const hydeOk      = await testHyDE();

  // ── Summary ───────────────────────────────────────────────────
  console.log("\n" + "═".repeat(55));
  console.log("  Summary");
  console.log("═".repeat(55));
  console.log(`  Embedding model : ${embeddingOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  Chat model      : ${chatOk      ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  HyDE loop       : ${hydeOk      ? "✅ PASS" : "❌ FAIL"}`);

  if (embeddingOk && chatOk && hydeOk) {
    console.log("\n  ✅ All tests passed — you're ready to run the project!");
    console.log("  Next step: npm run ingest");
  } else {
    console.log("\n  ❌ Some tests failed — fix the issues above before ingesting.");
  }

  console.log("═".repeat(55) + "\n");
}

runAll().catch(console.error);