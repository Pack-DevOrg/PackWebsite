import {createApiClient} from './client';

jest.mock('@/config/appConfig', () => ({
  appConfig: {
    apiBaseUrl: 'https://api.example.com/dev',
    environment: 'dev',
    apiKey: undefined,
  },
}));

describe('createApiClient', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'https://trypackai.com',
        hostname: 'itsdoneai.com',
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ok: true}),
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('uses the local dev proxy on localhost', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: 'http://localhost:5173',
        hostname: 'localhost',
      },
    });
    const client = createApiClient(
      async () => 'test-token',
      () => 'Bearer',
    );

    await client.request({
      path: '/user/information',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5173/dev/user/information',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          Accept: 'application/json',
        }),
      }),
    );
  });
});
