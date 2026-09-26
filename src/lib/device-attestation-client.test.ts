import { executeRecaptchaAction } from "@/utils/recaptcha";
import { appConfig } from "@/config/appConfig";
import {
  ensureWebDeviceAttestationSession,
  getDeviceAttestationToken,
  WEB_ATTESTATION_HEADER,
} from "./device-attestation-client";

jest.mock("@/utils/recaptcha", () => ({
  executeRecaptchaAction: jest.fn(),
}));

describe("device-attestation-client", () => {
  const originalTurnstile = appConfig.turnstileSiteKey;
  const originalRecaptcha = appConfig.recaptchaSiteKey;

  afterEach(() => {
    (appConfig as { turnstileSiteKey?: string }).turnstileSiteKey =
      originalTurnstile;
    (appConfig as { recaptchaSiteKey?: string }).recaptchaSiteKey =
      originalRecaptcha;
    jest.clearAllMocks();
  });

  it("does not skip: missing site keys throw instead of returning null", async () => {
    (appConfig as { turnstileSiteKey?: string }).turnstileSiteKey = undefined;
    (appConfig as { recaptchaSiteKey?: string }).recaptchaSiteKey = undefined;

    await expect(getDeviceAttestationToken()).rejects.toThrow(
      "Web attestation site key is not configured",
    );
  });

  it("fetches a reCAPTCHA token when Turnstile is not configured", async () => {
    (appConfig as { turnstileSiteKey?: string }).turnstileSiteKey = undefined;
    (appConfig as { recaptchaSiteKey?: string }).recaptchaSiteKey =
      "test-recaptcha-site-key";
    (executeRecaptchaAction as jest.Mock).mockResolvedValue("recaptcha-token");

    await expect(getDeviceAttestationToken()).resolves.toBe("recaptcha-token");
    expect(executeRecaptchaAction).toHaveBeenCalledWith(
      "web_attestation",
      "test-recaptcha-site-key",
    );
  });

  it("posts the token as x-pack-web-attestation to mint a web session", async () => {
    (appConfig as { turnstileSiteKey?: string }).turnstileSiteKey = undefined;
    (appConfig as { recaptchaSiteKey?: string }).recaptchaSiteKey =
      "test-recaptcha-site-key";
    (executeRecaptchaAction as jest.Mock).mockResolvedValue("fresh-token");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "",
    }) as unknown as typeof fetch;

    await ensureWebDeviceAttestationSession("access-token", "Bearer");

    expect(global.fetch).toHaveBeenCalledWith(
      `${appConfig.apiBaseUrl}/user/device-attestation/web`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          [WEB_ATTESTATION_HEADER]: "fresh-token",
          "x-pack-platform": "web",
          "x-pack-source": "website",
        }),
      }),
    );
  });
});
