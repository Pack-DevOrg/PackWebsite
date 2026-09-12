import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  appConfig,
  isTryPackHostname,
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

  it("keeps the production hosted-UI callback at trypackai auth/callback", () => {
    expect(appConfig.cognitoRedirectUri).toBe(PRODUCTION_CALLBACK);
  });
});

