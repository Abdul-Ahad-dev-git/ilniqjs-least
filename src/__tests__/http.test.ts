import { createHttpClient } from '../http/client';
import { HttpError } from '../http/types';

// Helper function to create properly mocked Response objects
function createMockResponse(
  data: any,
  options: { status?: number; ok?: boolean; statusText?: string; contentType?: string } = {}
): Response {
  const { 
    status = 200, 
    ok = true, 
    statusText = ok ? 'OK' : 'Error',
    contentType = 'application/json'
  } = options;
  
  const body = JSON.stringify(data);
  
  return {
    ok,
    status,
    statusText,
    headers: new Headers({ 'content-type': contentType }),
    text: async () => body,  // Critical: Add text() method
    json: async () => data,
    blob: async () => new Blob([body]),
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    formData: async () => new FormData(),
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: ''
  } as Response;
}

describe('HTTP Client', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should make GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      createMockResponse(mockData, { status: 200, ok: true })
    );

    const client = createHttpClient({ baseURL: 'https://api.test.com' });
    const response = await client.get('/users/1');

    expect(response.data).toEqual(mockData);
    expect(response.status).toBe(200);
  });

  it('should handle errors', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ error: 'Not found' }, { 
        status: 404, 
        ok: false, 
        statusText: 'Not Found' 
      })
    );

    const client = createHttpClient();

    await expect(client.get('/users/999')).rejects.toThrow(HttpError);
  });

  it('should apply interceptors', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ id: 1 }, { status: 200, ok: true })
    );

    const client = createHttpClient();
    const onRequest = jest.fn(config => config);
    const onResponse = jest.fn(response => response);

    client.addInterceptor({ onRequest, onResponse });

    await client.get('/test');

    expect(onRequest).toHaveBeenCalled();
    expect(onResponse).toHaveBeenCalled();
  });

  it('should cancel requests', async () => {
    const client = createHttpClient();
    const cancelToken = client.createCancelToken();

    (globalThis.fetch as jest.Mock).mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
      })
    );

    const promise = client.get('/test', { signal: cancelToken.signal });
    cancelToken.cancel();

    await expect(promise).rejects.toThrow();
  });

  it('should retry on server errors', async () => {
    let attempts = 0;
    (globalThis.fetch as jest.Mock).mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.resolve(
          createMockResponse({ error: 'Server Error' }, { 
            status: 500, 
            ok: false, 
            statusText: 'Server Error' 
          })
        );
      }
      return Promise.resolve(
        createMockResponse({ success: true }, { 
          status: 200, 
          ok: true 
        })
      );
    });

    const client = createHttpClient({ retries: 2, retryDelay: 10 });
    const response = await client.get('/test');

    expect(attempts).toBe(3);
    expect(response.data).toEqual({ success: true });
  });
});