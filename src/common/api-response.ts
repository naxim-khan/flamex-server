class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors?: any[],
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }

  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }

  static error<T>(message: string, errors?: any[]): ApiResponse<T> {
    return new ApiResponse<T>(false, message, undefined, errors);
  }
}

export default ApiResponse;