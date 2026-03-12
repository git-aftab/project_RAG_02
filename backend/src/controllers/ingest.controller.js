import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";
import { ingest } from "../services/ingest.js";

export const ingestController = AsyncHandler(async (req, res) => {
  // we have nothing to get form the frontend, so just call the func
  const result = await ingest();

  if (!result) {
    throw new ApiError(404, "Something went wrong with Ingestion.");
  }

  res.status(200).json(new ApiResponse(200, result, "Ingestion Successful."));
});
