export interface HttpRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: HttpRequest;
}

export interface HttpInterceptor {
  onRequest?: (config: HttpRequest) => HttpRequest | Promise<HttpRequest>;
  onResponse?: <T>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
  onError?: (error: HttpError) => HttpError | Promise<HttpError>;
}

export interface CancelToken {
  signal: AbortSignal;
  cancel(reason?: string): void;
  isCancelled(): boolean;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
    public config?: HttpRequest
  ) {
    super(message);
    this.name = 'HttpError';
    Object.setPrototypeOf(this, HttpError.prototype);
  }

  static isHttpError(error: any): error is HttpError {
    return error instanceof HttpError;
  }
}

export function createCancelToken(): CancelToken {
  const controller = new AbortController();
  let cancelled = false;

  return {
    signal: controller.signal,
    cancel(reason = 'Request cancelled') {
      if (!cancelled) {
        cancelled = true;
        controller.abort(reason);
      }
    },
    isCancelled() {
      return cancelled;
    }
  };
}