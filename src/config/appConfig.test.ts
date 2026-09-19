import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appConfig,
  isTryPackHostname,
  publicContactConfig,
  requirePackSmsE164BecausePublicConfig,
  shouldExposeTsaForHostname,
} from "./appConfig";

const IOS_COGNITO_CLIENT_ID = "6qjkv282db2701o9m0uroh6c9k";
const PRODUCTION_CALLBACK = "https://www.trypackai.com/auth/callback";
const appConfigSource = readFileSync(
  join(process.cwd(), "src/config/appConfig.ts"),
  "utf8",
);

describe("appConfig domain helpers", () => {
  it("recognizes trypack hosts", () => {
    expect(isTryPackHostname("trypackai.com")).toBe(true);
    expect(isTryPackHostname("www.trypackai.com")).toBe(true);
    expect(isTryPackHostname("app.trypackai.com")).toBe(true);
    expect(isTryPackHostname("example.com")).toBe(false);
  });

  it("exposes public TSA routes for trypack hosts and localhost", () => {
    expect(shouldExposeTsaForHostname("trypackai.com")).toBe(true);
    expect(shouldExposeTsaForHostname("tsa.trypackai.com")).toBe(true);
    expect(shouldExposeTsaForHostname("localhost")).toBe(true);
    expect(shouldExposeTsaForHostname("127.0.0.1")).toBe(true);
    expect(shouldExposeTsaForHostname("example.com")).toBe(false);
    expect(shouldExposeTsaForHostname("www.trypackai.com")).toBe(true);
  });
});

describe("appConfig website cognito web client", () => {
  it("does not pin the iOS Cognito client id on the website hosted-UI path", () => {
    expect(appConfigSource).not.toContain(IOS_COGNITO_CLIENT_ID);
    expect(appConfig.cognitoClientId).not.toBe(IOS_COGNITO_CLIENT_ID);
  });

  it("resolves the hosted-UI client id from VITE_COGNITO_WEB_CLIENT_ID", () => {
    expect(appConfigSource).toContain("VITE_COGNITO_WEB_CLIENT_ID");
    expect(appConfigSource).not.toContain("VITE_COGNITO_CLIENT_ID");
  });

  it("keeps the parked fallback behind __DEV__ so prod dist can drop parked-awaiting", () => {
    expect(appConfigSource).toMatch(/if \(__DEV__\) \{/);
    expect(appConfigSource).toContain("parked-awaiting-CognitoWebUserPoolClientId");
  });

  it("keeps the production hosted-UI callback at trypackai auth/callback", () => {
    expect(appConfig.cognitoRedirectUri).toBe(PRODUCTION_CALLBACK);
  });
});

describe("appConfig public Pack SMS number", () => {
  const envProduction = readFileSync(
    join(process.cwd(), ".env.production"),
    "utf8",
  );

  function envProductionValue(name: string): string | undefined {
    const line = envProduction.split("\n").find((row) =>
      row.startsWith(`${name}=`),
    );
    if (line === undefined) {
      return undefined;
    }
    return line.slice(name.length + 1).trim();
  }

  it("exposes the configured Sendblue E.164 on publicContactConfig", () => {
    expect(publicContactConfig.packSmsE164).toMatch(/^\+[1-9]\d{7,14}$/);
    expect(appConfigSource).toContain("VITE_PACK_SMS_E164");
    expect(appConfigSource).not.toContain("+13054392989");
  });

  it("fails closed when the public SMS number is missing or a placeholder", () => {
    expect(() => requirePackSmsE164BecausePublicConfig(undefined)).toThrow(
      /VITE_PACK_SMS_E164 is required/,
    );
    expect(() => requirePackSmsE164BecausePublicConfig("")).toThrow(
      /VITE_PACK_SMS_E164 is required/,
    );
    expect(() => requirePackSmsE164BecausePublicConfig("placeholder")).toThrow(
      /VITE_PACK_SMS_E164 is required/,
    );
    expect(() => requirePackSmsE164BecausePublicConfig("parked")).toThrow(
      /VITE_PACK_SMS_E164 is required/,
    );
    expect(() => requirePackSmsE164BecausePublicConfig("TODO")).toThrow(
      /VITE_PACK_SMS_E164 is required/,
    );
    expect(() => requirePackSmsE164BecausePublicConfig("15555550100")).toThrow(
      /Invalid packSmsE164/,
    );
  });

  it("prod env ships a real E.164, not a placeholder", () => {
    const value = envProductionValue("VITE_PACK_SMS_E164");
    expect(value).toBeDefined();
    expect(requirePackSmsE164BecausePublicConfig(value)).toMatch(
      /^\+[1-9]\d{7,14}$/,
    );
  });
});

