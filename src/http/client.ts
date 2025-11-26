import type {
  HttpRequest,
  HttpResponse,
  HttpInterceptor,
  CancelToken
} from './types';
import { HttpError, createCancelToken } from './types';

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  validateStatus?: (status: number) => boolean;
}

export interface HttpClient {
  get<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  post<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  put<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, body?: any, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, config?: Partial<HttpRequest>): Promise<HttpResponse<T>>;
  request<T = any>(config: HttpRequest): Promise<HttpResponse<T>>;
  addInterceptor(interceptor: HttpInterceptor): () => void;
  createCancelToken(): CancelToken;
}

export function createHttpClient(config: HttpConfig = {}): HttpClient {
  const {
    baseURL = '',
    timeout = 30000,
    headers: defaultHeaders = {},
    retries = 0,
    retryDelay = 1000,
    validateStatus = (status) => status >= 200 && status < 300
  } = config;

  const interceptors: HttpInterceptor[] = [];

  async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function request<T>(req: HttpRequest, attemptNum = 0): Promise<HttpResponse<T>> {
    let currentRequest = { ...req };

    // Apply request interceptors
    for (const interceptor of interceptors) {
      if (interceptor.onRequest) {
        try {
          currentRequest = await interceptor.onRequest(currentRequest);
        } catch (error) {
          throw new HttpError(
            `Request interceptor error: ${error}`,
            0,
            null,
            currentRequest
          );
        }
      }
    }

    // Build URL
    const urlObj = new URL(
      currentRequest.url.startsWith('http')
        ? currentRequest.url
        : baseURL + currentRequest.url,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    );

    if (currentRequest.params) {
      Object.entries(currentRequest.params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, String(value));
      });
    }

    // Setup timeout
    const controller = new AbortController();
    const requestTimeout = currentRequest.timeout || timeout;
    const timeoutId = setTimeout(() => controller.abort('Timeout'), requestTimeout);

    // Combine signals if provided
    if (currentRequest.signal) {
      currentRequest.signal.addEventListener('abort', () => {
        controller.abort(currentRequest.signal?.reason);
      });
    }

    try {
      const response = await fetch(urlObj.toString(), {
        method: currentRequest.method,
        headers: {
          'Content-Type': 'application/json',
          ...defaultHeaders,
          ...currentRequest.headers
        },
        body: currentRequest.body ? JSON.stringify(currentRequest.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      // Check status
      if (!validateStatus(response.status)) {
        const error = new HttpError(
          `Request failed with status ${response.status}`,
          response.status,
          data,
          currentRequest
        );

        // Apply error interceptors
        let currentError: HttpError = error;
        for (const interceptor of interceptors) {
          if (interceptor.onError) {
            try {
              currentError = await interceptor.onError(currentError);
            } catch (interceptorError) {
              currentError = interceptorError as HttpError;
            }
          }
        }

        // Retry logic
        if (attemptNum < retries && response.status >= 500) {
          await sleep(retryDelay * (attemptNum + 1));
          return request<T>(req, attemptNum + 1);
        }

        throw currentError;
      }

      let result: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: currentRequest
      };

      // Apply response interceptors
      for (const interceptor of interceptors) {
        if (interceptor.onResponse) {
          try {
            result = await interceptor.onResponse(result);
          } catch (error) {
            throw new HttpError(
              `Response interceptor error: ${error}`,
              response.status,
              data,
              currentRequest
            );
          }
        }
      }

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle abort
      if (error.name === 'AbortError') {
        const abortError = new HttpError(
          error.message || 'Request cancelled',
          0,
          null,
          currentRequest
        );
        throw abortError;
      }

      // Handle network errors
      const httpError = HttpError.isHttpError(error)
        ? error
        : new HttpError(
            error.message || 'Network error',
            0,
            null,
            currentRequest
          );

      // Apply error interceptors
      let currentError = httpError;
      for (const interceptor of interceptors) {
        if (interceptor.onError) {
          try {
            currentError = await interceptor.onError(currentError);
          } catch (interceptorError) {
            currentError = interceptorError as HttpError;
          }
        }
      }

      throw currentError;
    }
  }

  return {
    get: <T>(url: string, config?: Partial<HttpRequest>) =>
      request<T>({ ...config, url, method: 'GET' } as HttpRequest),

    post: <T>(url: string, body?: any, config?: Partial<HttpRequest>) =>
      request<T>({ ...config, url, method: 'POST', body } as HttpRequest),

    put: <T>(url: string, body?: any, config?: Partial<HttpRequest>) =>
      request<T>({ ...config, url, method: 'PUT', body } as HttpRequest),

    patch: <T>(url: string, body?: any, config?: Partial<HttpRequest>) =>
      request<T>({ ...config, url, method: 'PATCH', body } as HttpRequest),

    delete: <T>(url: string, config?: Partial<HttpRequest>) =>
      request<T>({ ...config, url, method: 'DELETE' } as HttpRequest),

    request: <T>(config: HttpRequest) => request<T>(config),

    addInterceptor(interceptor: HttpInterceptor) {
      interceptors.push(interceptor);
      return () => {
        const index = interceptors.indexOf(interceptor);
        if (index > -1) {
          interceptors.splice(index, 1);
        }
      };
    },

    createCancelToken
  };
}