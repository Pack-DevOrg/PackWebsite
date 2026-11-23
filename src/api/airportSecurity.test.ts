import {
  fetchPublicAirportSecuritySummary,
} from './airportSecurity';
import {appConfig, isLocalhostHostname} from '@/config/appConfig';
import {env} from '@/utils/env';
import {executeRecaptchaAction} from '@/utils/recaptcha';

jest.mock('@/config/appConfig', () => ({
  appConfig: {
    apiBaseUrl: 'https://api.example.com/prod',
    environment: 'dev',
  },
  isLocalhostHostname: jest.fn(),
}));

jest.mock('@/utils/env', () => ({
  env: {
    VITE_RECAPTCHA_SITE_KEY: 'test-site-key',
    VITE_PUBLIC_TSA_BOARD_URL: undefined,
  },
}));

jest.mock('@/utils/recaptcha', () => ({
  executeRecaptchaAction: jest.fn(),
}));

describe('fetchPublicAirportSecuritySummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
    (isLocalhostHostname as jest.Mock).mockReturnValue(false);
    (executeRecaptchaAction as jest.Mock).mockResolvedValue('test-recaptcha-token');
  });

  afterEach(() => {
    env.VITE_PUBLIC_TSA_BOARD_URL = undefined;
    appConfig.environment = 'dev';
  });

  it('sends the reCAPTCHA token on the public TSA request for non-localhost traffic', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          generatedAt: '2026-03-23T12:00:00.000Z',
          refreshIntervalMinutes: 15,
          airports: [],
        },
        requestId: 'req-tsa-test',
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).toHaveBeenCalledWith(
      'tsa_wait_times_public_lookup',
      'test-site-key',
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/prod/airport-security/public-current',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-Recaptcha-Token': 'test-recaptcha-token',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('uses the prod public board on localhost without browser-side reCAPTCHA', async () => {
    (isLocalhostHostname as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          generatedAt: '2026-03-23T12:00:00.000Z',
          refreshIntervalMinutes: 15,
          airports: [],
        },
        requestId: 'req-tsa-localhost',
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://tsa-board.trypackai.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('prefers the explicit public board URL on localhost when it is configured', async () => {
    (isLocalhostHostname as jest.Mock).mockReturnValue(true);
    env.VITE_PUBLIC_TSA_BOARD_URL =
      'https://tsa-board.trypackai.com/airport-wait-times/public/current.json';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: '2026-03-23T12:00:00.000Z',
        refreshIntervalMinutes: 15,
        airports: [],
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://tsa-board.trypackai.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('uses the direct edge board URL without reCAPTCHA when configured', async () => {
    env.VITE_PUBLIC_TSA_BOARD_URL =
      'https://cdn.example.com/airport-wait-times/public/current.json';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: '2026-03-23T12:00:00.000Z',
        refreshIntervalMinutes: 15,
        airports: [],
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cdn.example.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        cache: 'no-store',
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('ignores raw cloudfront board URLs in production and uses the stable board host instead', async () => {
    appConfig.environment = 'prod';
    env.VITE_PUBLIC_TSA_BOARD_URL =
      'https://d3063a7vb003az.cloudfront.net/airport-wait-times/public/current.json';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: '2026-03-24T12:00:00.000Z',
        refreshIntervalMinutes: 15,
        airports: [],
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://tsa-board.trypackai.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        cache: 'no-store',
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('falls back to the API path when the direct edge board URL is unavailable', async () => {
    (isLocalhostHostname as jest.Mock).mockReturnValue(true);
    env.VITE_PUBLIC_TSA_BOARD_URL =
      'https://cdn.example.com/airport-wait-times/public/current.json';
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            generatedAt: '2026-03-24T12:00:00.000Z',
            refreshIntervalMinutes: 15,
            airports: [],
          },
          requestId: 'req-tsa-api-fallback',
        }),
      });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://cdn.example.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      `${window.location.origin}/dev/airport-security/public-current`,
      expect.objectContaining({
        cache: 'no-store',
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('falls back to the API path for non-localhost traffic when the direct edge board URL fails', async () => {
    env.VITE_PUBLIC_TSA_BOARD_URL =
      'https://cdn.example.com/airport-wait-times/public/current.json';
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            generatedAt: '2026-03-24T12:00:00.000Z',
            refreshIntervalMinutes: 15,
            airports: [],
          },
          requestId: 'req-tsa-prod-api-fallback',
        }),
      });

    const response = await fetchPublicAirportSecuritySummary();

    expect(executeRecaptchaAction).toHaveBeenCalledWith(
      'tsa_wait_times_public_lookup',
      'test-site-key',
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://cdn.example.com/airport-wait-times/public/current.json',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/prod/airport-security/public-current',
      expect.objectContaining({
        cache: 'no-store',
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-Recaptcha-Token': 'test-recaptcha-token',
        }),
      }),
    );
    expect(response.airports).toEqual([]);
  });

  it('fails closed when reCAPTCHA is unavailable outside localhost', async () => {
    (executeRecaptchaAction as jest.Mock).mockRejectedValue(
      new Error('Security verification is unavailable right now.'),
    );

    await expect(fetchPublicAirportSecuritySummary()).rejects.toThrow(
      'Security verification is unavailable right now.',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls back to cached airports with unknown waits when the backend request fails', async () => {
    window.localStorage.setItem(
      'tsa-public-board-cache-v1',
      JSON.stringify({
        generatedAt: '2026-03-23T12:00:00.000Z',
        refreshIntervalMinutes: 15,
        airports: [
          {
            airportCode: 'JFK',
            airportName: 'John F. Kennedy International Airport',
            cityName: 'New York City',
            regionName: 'NY',
            countryName: 'United States',
            latitude: 40.6413,
            longitude: -73.7781,
            snapshot: null,
          },
        ],
      })
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
    });

    const response = await fetchPublicAirportSecuritySummary();

    expect(response.airports).toEqual([
      expect.objectContaining({
        airportCode: 'JFK',
        snapshot: null,
      }),
    ]);
  });

  it('normalizes sentinel and non-numeric displayWaitText values to Unavailable and preserves countryCode and officialUrl', async () => {
    (isLocalhostHostname as jest.Mock).mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedAt: '2026-11-22T18:00:00.000Z',
        refreshIntervalMinutes: 15,
        airports: [
          {
            airportCode: 'DEN',
            airportName: 'Denver International Airport',
            cityName: 'Denver',
            regionName: 'CO',
            countryCode: 'US',
            countryName: 'United States',
            officialUrl: 'https://www.flydenver.com/',
            latitude: 39.8561,
            longitude: -104.6737,
            snapshot: {
              fetchStatus: 'available',
              observedAt: '2026-11-22T17:58:00.000Z',
              fetchedAt: '2026-11-22T17:59:00.000Z',
              refreshIntervalMinutes: 15,
              observations: [
                {
                  locationDisplayName: 'South Security',
                  screeningProgram: 'general',
                  laneStatus: 'open',
                  displayWaitText: '12 min',
                  exactWaitMinutes: 12,
                },
                {
                  locationDisplayName: 'North Security Standard',
                  screeningProgram: 'general',
                  laneStatus: 'open',
                  displayWaitText: 'Do not show',
                },
                {
                  locationDisplayName: 'Bridge Security',
                  screeningProgram: 'general',
                  laneStatus: 'open',
                  displayWaitText: 'n/a',
                },
                {
                  locationDisplayName: 'A-Bridge',
                  screeningProgram: 'general',
                  laneStatus: 'open',
                  displayWaitText: '--',
                },
                {
                  locationDisplayName: 'Closed Lane',
                  screeningProgram: 'tsa_precheck',
                  laneStatus: 'closed',
                  displayWaitText: 'Temporarily closed',
                },
              ],
            },
          },
        ],
      }),
    });

    const response = await fetchPublicAirportSecuritySummary();
    const den = response.airports[0];
    expect(den?.countryCode).toBe('US');
    expect(den?.officialUrl).toBe('https://www.flydenver.com/');
    expect(
      den?.snapshot?.observations.map((obs) => ({
        location: obs.locationDisplayName,
        laneStatus: obs.laneStatus,
        displayWaitText: obs.displayWaitText,
      })),
    ).toEqual([
      {
        location: 'South Security',
        laneStatus: 'open',
        displayWaitText: '12 min',
      },
      {
        location: 'North Security Standard',
        laneStatus: 'unavailable',
        displayWaitText: 'Unavailable',
      },
      {
        location: 'Bridge Security',
        laneStatus: 'unavailable',
        displayWaitText: 'Unavailable',
      },
      {
        location: 'A-Bridge',
        laneStatus: 'unavailable',
        displayWaitText: 'Unavailable',
      },
      {
        location: 'Closed Lane',
        laneStatus: 'closed',
        displayWaitText: 'Closed',
      },
    ]);
  });
});
