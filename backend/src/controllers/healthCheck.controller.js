import { ApiResponse } from "../utils/ApiResponse.js";
import { AsyncHandler } from "../utils/AsyncHandler.js";

const healthCheck = AsyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, { message: "Api Running Successfully" }));
});

export { healthCheck };
