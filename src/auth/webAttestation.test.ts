import {appConfig} from '@/config/appConfig';
import {createApiClient} from '@/api/client';
import {isWebAttestationRefusal, WEB_ATTESTATION_HEADER} from './webAttestation';

jest.mock('@/config/appConfig', () => ({
  appConfig: {apiBaseUrl: 'https://api.example.com/prod', environment: 'prod', apiKey: undefined},
}));
jest.mock('@/utils/env', () => ({env: {VITE_RECAPTCHA_SITE_KEY: 'site-key'}}));
jest.mock('@/utils/recaptcha', () => ({executeRecaptchaAction: jest.fn(async () => 'one-time-token')}));

const reply = (status: number, body: unknown) => ({
  ok: status < 400,
  status,
  text: async () => JSON.stringify(body),
  clone() {
    return reply(status, body);
  },
});

describe('web attestation (2026-09-23: every web sign-in failed WEB_ATTESTATION_REQUIRED)', () => {
  beforeEach(() => {
    appConfig.environment = 'prod';
  });

  it('recognises only the typed WEB_ATTESTATION_* refusals', () => {
    expect(isWebAttestationRefusal(401, '{"error":{"code":"WEB_ATTESTATION_REQUIRED"}}')).toBe(true);
    expect(isWebAttestationRefusal(401, '{"error":{"code":"AUTH_REQUIRED"}}')).toBe(false);
    expect(isWebAttestationRefusal(500, '{"error":{"code":"WEB_ATTESTATION_REQUIRED"}}')).toBe(false);
  });

  it('answers a WEB_ATTESTATION_REQUIRED refusal once with a fresh token on the same access token', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(reply(401, {success: false, error: {code: 'WEB_ATTESTATION_REQUIRED'}}))
      .mockResolvedValueOnce(reply(200, {ok: true}));
    global.fetch = fetchMock as unknown as typeof fetch;
    const tokens = jest.fn(async () => 'access-token');
    const client = createApiClient(tokens, () => 'Bearer');

    await client.request({path: '/user/information'});

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, second] = fetchMock.mock.calls[1];
    expect(second.headers[WEB_ATTESTATION_HEADER]).toBe('one-time-token');
    expect(second.headers.Authorization).toBe('Bearer access-token');
    expect(tokens).not.toHaveBeenCalledWith({forceRefresh: true});
  });
});
