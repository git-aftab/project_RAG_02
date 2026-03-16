// test-rag-api.js
// ═══════════════════════════════════════════════════════════════════
// Complete test suite for RAG API endpoints
// Run with: node test-rag-api.js
// ═══════════════════════════════════════════════════════════════════

const BASE_URL = "http://localhost:3000/api/v1";

// ── Test Utilities ─────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;

function pass(msg) {
  console.log(`✅ ${msg}`);
  passCount++;
}

function fail(msg) {
  console.log(`❌ ${msg}`);
  failCount++;
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

function section(title) {
  console.log("\n" + "═".repeat(70));
  console.log(`  ${title}`);
  console.log("═".repeat(70));
}

async function apiCall(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 1: Health Check
// ═══════════════════════════════════════════════════════════════════
async function testHealthCheck() {
  section("TEST 1: Health Check");

  const { status, data } = await apiCall("/healthcheck");

  if (status === 200) {
    pass("Server is running");
    info(`Response: ${JSON.stringify(data)}`);
  } else {
    fail("Server health check failed");
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 2: Ingest Endpoint
// ═══════════════════════════════════════════════════════════════════
async function testIngest() {
  section("TEST 2: Ingest Endpoint");

  info("Running ingest (this may take 10-20 seconds)...");

  const { status, data } = await apiCall("/ingest", "POST");

  if (status === 200 && data.success) {
    pass("Ingest completed successfully");
    info(`Total chunks ingested: ${data.data?.totalChunks || "unknown"}`);
    if (data.data?.documents) {
      info(`Documents: ${data.data.documents.join(", ")}`);
    }
  } else {
    fail(`Ingest failed: ${data.message || "unknown error"}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 3: Basic Search Queries
// ═══════════════════════════════════════════════════════════════════
async function testBasicSearch() {
  section("TEST 3: Basic Search Queries");

  const queries = [
    {
      name: "Simple Python query",
      body: { query: "how to reverse a string in python" },
      expectLanguage: "python",
      expectInAnswer: "reverse",
    },
    {
      name: "Simple JavaScript query",
      body: { query: "how to sort an array in javascript" },
      expectLanguage: "javascript",
      expectInAnswer: "sort",
    },
    {
      name: "Vague query (tests query rewriting)",
      body: { query: "how do i remove duplicate things from a list" },
      expectInAnswer: "duplicate",
    },
    {
      name: "Concept-based query (tests HyDE)",
      body: { query: "add up all numbers in a collection" },
      expectInAnswer: ["sum", "reduce", "total"],
    },
  ];

  for (const test of queries) {
    console.log(`\n📋 ${test.name}`);
    const { status, data } = await apiCall("/search", "POST", test.body);

    if (status === 200 && data.success) {
      pass("Query executed successfully");

      const answer = data.data?.answer || "";
      const chunks = data.data?.chunks || [];

      // Check if answer contains expected terms
      const expectTerms = Array.isArray(test.expectInAnswer)
        ? test.expectInAnswer
        : [test.expectInAnswer];

      const hasExpectedTerm = expectTerms.some((term) =>
        answer.toLowerCase().includes(term.toLowerCase()),
      );

      if (hasExpectedTerm) {
        pass(`Answer contains expected content`);
      } else {
        fail(`Answer missing expected terms: ${expectTerms.join(" or ")}`);
      }

      // Check language if specified
      if (test.expectLanguage && chunks.length > 0) {
        const hasLanguage = chunks.some(
          (c) => c.language === test.expectLanguage,
        );
        if (hasLanguage) {
          pass(`Found ${test.expectLanguage} snippets`);
        } else {
          fail(
            `Expected ${test.expectLanguage} snippets but got: ${chunks[0]?.language}`,
          );
        }
      }

      // Show metadata
      if (data.data?.metadata) {
        info(`Rewritten: "${data.data.metadata.rewrittenQuery}"`);
        info(`Chunks found: ${data.data.metadata.totalChunks}`);
      }

      info(`Answer preview: ${answer.substring(0, 100)}...`);
    } else {
      fail(`Query failed: ${data.message || "unknown error"}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 4: Search with Language Filter
// ═══════════════════════════════════════════════════════════════════
async function testLanguageFilter() {
  section("TEST 4: Search with Language Filter");

  const tests = [
    {
      name: "Filter for Python only",
      body: { query: "remove duplicates", language: "python" },
      expectLanguage: "python",
      rejectLanguage: "javascript",
    },
    {
      name: "Filter for JavaScript only",
      body: { query: "reverse", language: "javascript" },
      expectLanguage: "javascript",
      rejectLanguage: "python",
    },
  ];

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    const { status, data } = await apiCall("/search", "POST", test.body);

    if (status === 200 && data.success) {
      pass("Query executed successfully");

      const chunks = data.data?.chunks || [];

      if (chunks.length > 0) {
        const allCorrectLanguage = chunks.every(
          (c) => c.language === test.expectLanguage,
        );
        const hasWrongLanguage = chunks.some(
          (c) => c.language === test.rejectLanguage,
        );

        if (allCorrectLanguage) {
          pass(`All chunks are ${test.expectLanguage}`);
        } else {
          fail(`Found non-${test.expectLanguage} chunks`);
        }

        if (hasWrongLanguage) {
          fail(`Found ${test.rejectLanguage} chunks (should be filtered out)`);
        } else {
          pass(`No ${test.rejectLanguage} chunks (filter working)`);
        }
      } else {
        fail("No chunks returned");
      }
    } else {
      fail(`Query failed: ${data.message || "unknown error"}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 5: Search with Tag Filter
// ═══════════════════════════════════════════════════════════════════
async function testTagFilter() {
  section("TEST 5: Search with Tag Filter");

  const tests = [
    {
      name: "Filter by 'sort' tag",
      body: { query: "array operations", tags: ["sort"] },
      expectTag: "sort",
    },
    {
      name: "Filter by 'map' tag",
      body: { query: "transform data", tags: ["map"] },
      expectTag: "map",
    },
  ];

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    const { status, data } = await apiCall("/search", "POST", test.body);

    if (status === 200 && data.success) {
      pass("Query executed successfully");

      const chunks = data.data?.chunks || [];

      if (chunks.length > 0) {
        const allHaveTag = chunks.every((c) =>
          c.tags?.includes(test.expectTag),
        );

        if (allHaveTag) {
          pass(`All chunks have '${test.expectTag}' tag`);
        } else {
          fail(`Some chunks missing '${test.expectTag}' tag`);
        }
      } else {
        info("No chunks returned (tags might be too restrictive)");
      }
    } else {
      fail(`Query failed: ${data.message || "unknown error"}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 6: Complex Filter Combinations
// ═══════════════════════════════════════════════════════════════════
async function testComplexFilters() {
  section("TEST 6: Complex Filter Combinations");

  const test = {
    name: "Language + Tag filter",
    body: {
      query: "transform data",
      language: "javascript",
      tags: ["map"],
    },
  };

  console.log(`\n📋 ${test.name}`);
  const { status, data } = await apiCall("/search", "POST", test.body);

  if (status === 200 && data.success) {
    pass("Complex filter query executed");

    const chunks = data.data?.chunks || [];

    if (chunks.length > 0) {
      const allMatch = chunks.every(
        (c) => c.language === "javascript" && c.tags?.includes("map"),
      );

      if (allMatch) {
        pass("All chunks match both filters");
      } else {
        fail("Some chunks don't match filters");
      }
    } else {
      info("No chunks found (filters may be too strict)");
    }
  } else {
    fail(`Query failed: ${data.message || "unknown error"}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 7: Edge Cases
// ═══════════════════════════════════════════════════════════════════
async function testEdgeCases() {
  section("TEST 7: Edge Cases");

  const tests = [
    {
      name: "Empty query",
      body: { query: "" },
      expectStatus: 400,
      expectError: true,
    },
    {
      name: "Query with only spaces",
      body: { query: "   " },
      expectStatus: 400,
      expectError: true,
    },
    {
      name: "No matching results",
      body: { query: "how to connect to a database with SQL" },
      expectStatus: 404,
      expectError: true,
    },
    {
      name: "Invalid language filter",
      body: { query: "sort array", language: "ruby" },
      expectStatus: 404, // No ruby snippets exist
      expectError: true,
    },
  ];

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    const { status, data } = await apiCall("/search", "POST", test.body);

    if (status === test.expectStatus) {
      pass(`Got expected status ${test.expectStatus}`);
    } else {
      fail(`Expected status ${test.expectStatus}, got ${status}`);
    }

    if (test.expectError) {
      if (!data || data.success === false || data.error) {
        pass("Error handled correctly");
        info(`Error message: ${data?.message || data?.error || "unknown"}`);
      } else if (data && data.success) {
        fail("Expected error but got success");
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 8: Hybrid Search Effectiveness
// ═══════════════════════════════════════════════════════════════════
async function testHybridSearch() {
  section("TEST 8: Hybrid Search Effectiveness");

  const tests = [
    {
      name: "Keyword-heavy query",
      body: { query: "split join delimiter" },
      description: "Should score high on keyword matching",
    },
    {
      name: "Semantic-heavy query",
      body: { query: "calculate total sum of all items" },
      description:
        "Should find 'reduce' via semantic similarity (no exact keywords)",
    },
  ];

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    info(test.description);

    const { status, data } = await apiCall("/search", "POST", test.body);

    if (status === 200 && data.success) {
      pass("Query executed successfully");

      const chunks = data.data?.chunks || [];

      if (chunks.length > 0) {
        pass(`Found ${chunks.length} relevant chunks`);

        // Show RRF scores
        chunks.forEach((chunk, i) => {
          info(
            `Chunk ${i + 1}: [${chunk.language}] ${chunk.section} (score: ${chunk.rrf_score.toFixed(4)})`,
          );
        });

        // Check if top result has significantly higher score
        if (chunks.length > 1) {
          const scoreRatio = chunks[0].rrf_score / chunks[1].rrf_score;
          if (scoreRatio > 1.5) {
            pass("Clear winner in hybrid scoring");
          } else {
            info("Close scores between top results");
          }
        }
      } else {
        fail("No chunks found");
      }
    } else {
      fail(`Query failed: ${data.message || "unknown error"}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST 9: Response Structure Validation
// ═══════════════════════════════════════════════════════════════════
async function testResponseStructure() {
  section("TEST 9: Response Structure Validation");

  const { status, data } = await apiCall("/search", "POST", {
    query: "reverse string",
  });

  if (status === 200) {
    pass("Got 200 status");

    // Check top-level structure
    const hasSuccess = "success" in data;
    const hasData = "data" in data;
    const hasMsg = "msg" in data;

    if (hasSuccess && hasData && hasMsg) {
      pass("Response has correct top-level structure");
    } else {
      fail("Missing top-level fields in response");
    }

    // Check data structure
    if (data.data) {
      const hasAnswer = "answer" in data.data;
      const hasChunks = "chunks" in data.data;
      const hasMetadata = "metadata" in data.data;

      if (hasAnswer) pass("Has 'answer' field");
      else fail("Missing 'answer' field");

      if (hasChunks) pass("Has 'chunks' field");
      else fail("Missing 'chunks' field");

      if (hasMetadata) pass("Has 'metadata' field");
      else fail("Missing 'metadata' field");

      // Check chunk structure
      if (data.data.chunks && data.data.chunks.length > 0) {
        const chunk = data.data.chunks[0];
        const chunkFields = [
          "id",
          "content",
          "source",
          "section",
          "language",
          "tags",
          "rrf_score",
        ];

        const missingFields = chunkFields.filter((field) => !(field in chunk));

        if (missingFields.length === 0) {
          pass("Chunks have all required fields");
        } else {
          fail(`Chunks missing fields: ${missingFields.join(", ")}`);
        }
      }

      // Check metadata structure
      if (data.data.metadata) {
        const meta = data.data.metadata;

        if ("rewrittenQuery" in meta) pass("Metadata has 'rewrittenQuery'");
        else fail("Metadata missing 'rewrittenQuery'");

        if ("totalChunks" in meta) pass("Metadata has 'totalChunks'");
        else fail("Metadata missing 'totalChunks'");
      }
    }
  } else {
    fail("Did not get 200 status for structure test");
  }
}

// ═══════════════════════════════════════════════════════════════════
// Main Test Runner
// ═══════════════════════════════════════════════════════════════════
async function runAllTests() {
  console.log("\n🧪 RAG API Test Suite");
  console.log("Testing against: " + BASE_URL);
  console.log("Started at: " + new Date().toLocaleString());

  await testHealthCheck();
  // await testIngest();  // ← Uncomment if you want to test ingest (slow)
  await testBasicSearch();
  await testLanguageFilter();
  await testTagFilter();
  await testComplexFilters();
  await testEdgeCases();
  await testHybridSearch();
  await testResponseStructure();

  // Summary
  section("TEST SUMMARY");
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total:  ${passCount + failCount}`);

  if (failCount === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log(`\n⚠️  ${failCount} test(s) failed. Review output above.`);
  }

  console.log("\nCompleted at: " + new Date().toLocaleString());
}

// Run tests
runAllTests().catch(console.error);
