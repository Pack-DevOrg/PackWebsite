import {appConfig} from '@/config/appConfig';
import {
  ApiRequestError,
  createApiClient,
  mintPhoneVerificationStart,
  startVerificationRefusalCopy,
  typedApiRefusalReason,
} from './client';

jest.mock('@/config/appConfig', () => ({
  appConfig: {
    apiBaseUrl: 'https://api.example.com/dev',
    environment: 'prod',
    apiKey: undefined,
  },
}));

describe('createApiClient', () => {
  beforeEach(() => {
    appConfig.environment = 'prod';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ok: true}),
    });
  });

  it('uses the local dev proxy on localhost', async () => {
    appConfig.environment = 'dev';
    const client = createApiClient(
      async () => 'test-token',
      () => 'Bearer',
    );

    await client.request({
      path: '/user/information',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${window.location.origin}/dev/user/information`,
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

describe('mintPhoneVerificationStart', () => {
  const mintBody = {
    code: 'A1b2C3d4E5',
    smsHref: 'sms:+13054392989?body=A1b2C3d4E5',
    expiresAt: 1_714_000_600_000,
  };

  beforeEach(() => {
    appConfig.environment = 'prod';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mintBody),
    });
  });

  it('posts platform web without phoneNumber and includes credentials on the public path', async () => {
    const minted = await mintPhoneVerificationStart();

    expect(minted).toEqual(mintBody);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/dev/user/information/phone-verification/start',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({platform: 'web'}),
      }),
    );
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).not.toHaveProperty('phoneNumber');
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it('sends Authorization when an authed client is provided', async () => {
    const client = createApiClient(
      async () => 'synth-access-token',
      () => 'Bearer',
    );

    await mintPhoneVerificationStart(client);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/dev/user/information/phone-verification/start',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer synth-access-token',
        }),
        body: JSON.stringify({platform: 'web'}),
      }),
    );
  });

  it('throws the B93 typed reason when start is a 403 attestation deny', async () => {
    const attestationBody = {
      success: false,
      error: {
        message:
          'Device attestation policy cannot be resolved for this Cognito client',
        code: 'DEVICE_ATTESTATION_CLIENT_UNKNOWN',
        details: {
          reason: 'cognito client_id is not in the attestation policy map',
        },
      },
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => JSON.stringify(attestationBody),
    });
    const client = createApiClient(
      async () => 'synth-access-token',
      () => 'Bearer',
    );

    await expect(mintPhoneVerificationStart(client)).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiRequestError',
        status: 403,
        message:
          'DEVICE_ATTESTATION_CLIENT_UNKNOWN: cognito client_id is not in the attestation policy map',
      }),
    );
  });
});

describe('typedApiRefusalReason', () => {
  it('joins attestation code and details.reason', () => {
    expect(
      typedApiRefusalReason({
        success: false,
        error: {
          message: 'Device attestation policy cannot be resolved for this Cognito client',
          code: 'DEVICE_ATTESTATION_CLIENT_UNKNOWN',
          details: {
            reason: 'cognito client_id is not in the attestation policy map',
          },
        },
      }),
    ).toBe(
      'DEVICE_ATTESTATION_CLIENT_UNKNOWN: cognito client_id is not in the attestation policy map',
    );
  });
});

describe('startVerificationRefusalCopy', () => {
  it('uses the typed ApiRequestError message', () => {
    expect(
      startVerificationRefusalCopy(
        new ApiRequestError(
          403,
          'DEVICE_ATTESTATION_CLIENT_UNKNOWN: cognito client_id is not in the attestation policy map',
        ),
      ),
    ).toBe(
      'DEVICE_ATTESTATION_CLIENT_UNKNOWN: cognito client_id is not in the attestation policy map',
    );
  });
});
