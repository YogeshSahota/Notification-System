export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id '${id}' not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'INVALID_INPUT', message, details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded', { retryAfter });
  }
}

export class DuplicateRequestError extends AppError {
  constructor() {
    super(409, 'DUPLICATE_REQUEST', 'A notification with this idempotency key already exists');
  }
}

export class ChannelUnavailableError extends AppError {
  constructor(channel: string, error: string) {
    super(503, 'CHANNEL_UNAVAILABLE', `Channel '${channel}' is unavailable: ${error}`);
  }
}
