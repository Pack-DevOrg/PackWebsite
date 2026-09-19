/**
 * 2026-09-19: prod shipped with the parked web client id, so every Continue with Google/Apple
 * hit Cognito's hosted UI with client_id=parked-awaiting-… → 400 → /error (Matt could not onboard).
 * The prod env file must carry the real pack-web client id, and it must not be the iOS client.
 */
import fs from "node:fs";
import path from "node:path";

const envProduction = fs.readFileSync(path.resolve(__dirname, "../../.env.production"), "utf8");

function envValue(name: string): string | undefined {
  const line = envProduction.split("\n").find((row) => row.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim();
}

describe(".env.production Cognito web client", () => {
  it("sets VITE_COGNITO_WEB_CLIENT_ID to a real client id", () => {
    const value = envValue("VITE_COGNITO_WEB_CLIENT_ID");
    expect(value).toBeDefined();
    expect(value).toMatch(/^[a-z0-9]{20,}$/);
    expect(value).not.toContain("parked");
  });
  it("is not the iOS app client", () => {
    expect(envValue("VITE_COGNITO_WEB_CLIENT_ID")).not.toBe(envValue("VITE_COGNITO_CLIENT_ID"));
  });
});
