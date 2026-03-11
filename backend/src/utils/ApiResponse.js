class ApiResponse {
  constructor(statusCode, data, msg = "success") {
    this.statusCode = statusCode;
    this.data = data;
    this.msg = msg;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
