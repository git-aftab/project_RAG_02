import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { addSnippet } from "../services/snippetServices.js";

export const addSnippetController = AsyncHandler(async (req, res) => {
  const { code, description, language, tags, section } = req.body;

  //   validate required field
  if (!code || !description || !language) {
    throw new ApiError(
      400,
      "Missing required fields: code, description, and language are required",
    );
  }

  if (typeof code !== "string" || typeof description !== "string") {
    throw new ApiError(400, "Code and description must be strings");
  }

  if (tags && !Array.isArray(tags)) {
    throw new ApiError(400, "Tags must be array");
  }

  const snippetData = await addSnippet({
    code,
    description,
    language,
    tags,
    section,
  });

  if (!snippetData) {
    new ApiError(404, "Error Adding Snippet.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, snippetData, "Snippet Added Successfull."));
});
