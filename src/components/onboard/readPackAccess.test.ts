
const request = jest.fn();
const createApiClient = jest.fn();

jest.mock("@/api/client", () => ({
  createApiClient: (...args: unknown[]) => createApiClient(...args),
}));

import {
  packAccessBecauseInformationPayload,
  readPackAccessBecauseSession,
} from "./readPackAccess";

describe("packAccessBecauseInformationPayload", () => {
  it("reads waitlisted from a data envelope", () => {
    expect(
      packAccessBecauseInformationPayload({ data: { access: "waitlisted" } }),
    ).toBe("waitlisted");
  });
  it("reads waitlisted from a bare payload", () => {
    expect(packAccessBecauseInformationPayload({ access: "waitlisted" })).toBe(
      "waitlisted",
    );
  });
  it("treats a missing field as active", () => {
    expect(packAccessBecauseInformationPayload({})).toBe("active");
  });
  it("treats null as active", () => {
    expect(packAccessBecauseInformationPayload(null)).toBe("active");
  });
  it("treats other values as active", () => {
    expect(packAccessBecauseInformationPayload({ access: "active" })).toBe(
      "active",
    );
  });
});

describe("readPackAccessBecauseSession", () => {
  beforeEach(() => {
    request.mockReset();
    createApiClient.mockReset();
    createApiClient.mockReturnValue({ request });
  });

  it("GETs /user/information and returns waitlisted", async () => {
    request.mockResolvedValue({ access: "waitlisted" });
    const getAccessToken = jest.fn().mockResolvedValue("tok");
    const result = await readPackAccessBecauseSession({
      getAccessToken,
      tokenType: "Bearer",
    });
    expect(result).toBe("waitlisted");
    expect(request).toHaveBeenCalledWith({
      path: "/user/information",
      method: "GET",
    });
    const [tokenFn, typeFn] = createApiClient.mock.calls[0];
    expect(await tokenFn()).toBe("tok");
    expect(typeFn()).toBe("Bearer");
  });

  it("returns active when the field is missing", async () => {
    request.mockResolvedValue({ data: {} });
    expect(
      await readPackAccessBecauseSession({
        getAccessToken: async () => null,
        tokenType: "Bearer",
      }),
    ).toBe("active");
  });
});
