class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong",
    errors = [],
    stack = "",
    errorCode = null, // ← add this for frontend handling
  ) {
    super(message); //calling the constructor of the prent class
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.data = null;
    this.errors = errors;
    this.errorCode = errorCode; // e.g., "INVALID_QUERY", "EMBEDDING_FAILED"

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
