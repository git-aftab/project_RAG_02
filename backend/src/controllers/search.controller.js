import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { processQueery } from "../services/queryProcessor.js";
import { search } from "../services/search.js";
import { generateAnswer } from "../services/rag.js";

export const searchController = AsyncHandler(async (req, res) => {
  const { query, language, tags } = req.body;

  if (!query || query.trim().length === 0) {
    throw new ApiError(404, "Please enter a Query to search.");
  }

  const { rewrittenQuery, hydeEmbedding } = await processQueery(query);

  //   search with optional filter
  if (language) searchOptions.language = language;
  if (tags) searchOptions.tags = tags;

  const chunks = await search(rewrittenQuery, hydeEmbedding, searchOptions);

  if (!chunks || chunks.length === 0) {
    throw new ApiError(404, "No relevant code snippets found for your query");
  }

  const answer = await generateAnswer(query, chunks);

  if (!answer || answer.trim().length === 0) {
    throw new ApiError(404, "Failed to get the answer");
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        answer,
        chunks: chunks.slice(0, 3), //top 3 chunks used
        metadata: {
          rewrittenQuery,
          totalChunksFound: chunks.length,
        },
      },
      "Search Successful",
    ),
  );
});
