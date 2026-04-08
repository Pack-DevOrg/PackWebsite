import { isTryPackHostname, shouldExposeTsaForHostname } from "./appConfig";

describe("appConfig domain helpers", () => {
  it("recognizes trypack hosts", () => {
    expect(isTryPackHostname("trypackai.com")).toBe(true);
    expect(isTryPackHostname("www.trypackai.com")).toBe(true);
    expect(isTryPackHostname("app.trypackai.com")).toBe(true);
    expect(isTryPackHostname("itsdoneai.com")).toBe(false);
  });

  it("only exposes public TSA routes for trypack and localhost", () => {
    expect(shouldExposeTsaForHostname("trypackai.com")).toBe(true);
    expect(shouldExposeTsaForHostname("tsa.trypackai.com")).toBe(true);
    expect(shouldExposeTsaForHostname("localhost")).toBe(true);
    expect(shouldExposeTsaForHostname("127.0.0.1")).toBe(true);
    expect(shouldExposeTsaForHostname("itsdoneai.com")).toBe(false);
    expect(shouldExposeTsaForHostname("www.trypackai.com")).toBe(true);
  });
});
