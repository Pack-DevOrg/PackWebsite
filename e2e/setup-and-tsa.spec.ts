import { expect, test } from "playwright/test";
import {
  assertNoHorizontalOverflow,
  dismissConsentBannerIfVisible,
  makeE2EEmail,
  mockTsaPublicBoard,
} from "./helpers";

type WaitlistPayload = {
  marketingConsent?: boolean;
  marketingEmailConsent?: boolean;
};

const mockWaitlistSubscribe = async (
  page: import("playwright/test").Page,
): Promise<{ getPayload: () => WaitlistPayload | null }> => {
  let payload: WaitlistPayload | null = null;

  await page.route("**/*subscribe*", async (route) => {
    const raw = route.request().postData() ?? "{}";
    payload = JSON.parse(raw) as WaitlistPayload;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Successfully joined waitlist",
      }),
    });
  });

  return {
    getPayload: () => payload,
  };
};

test.describe("Setup and TSA journeys", () => {
  test("email forwarding setup supports provider switching and generated artifacts", async ({
    page,
  }) => {
    await page.goto(
      "/setup/email-forwarding?provider=gmail&forwardTo=trips@itsdoneai.com",
      { waitUntil: "domcontentloaded" },
    );
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("heading", { name: /email forwarding setup/i }),
    ).toBeVisible();
    await expect(
      page.locator("code").filter({ hasText: "trips@itsdoneai.com" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /download filters xml/i }),
    ).toBeEnabled();

    await page.getByRole("tab", { name: /outlook/i }).click();
    await expect(page).toHaveURL(/provider=outlook/);
    await expect(page.getByRole("tab", { name: /outlook/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByLabel(/microsoft 365 \/ exchange online inbox rules/i),
    ).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("tsa board filters airports locally with mocked live board data", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    await page.goto("/tsa", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(
      page.getByRole("textbox", { name: /search airport wait times/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /john f. kennedy international airport/i }),
    ).toBeVisible();

    const search = page.getByRole("textbox", {
      name: /search airport wait times/i,
    });
    await search.fill("SFO");
    await expect(
      page.getByRole("button", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /san francisco international airport/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /san francisco international airport/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /john f. kennedy international airport/i }),
    ).not.toBeVisible();
    await expect(page.getByText(/showing .* of .* tracked airports/i)).toBeVisible();
  });

  test("forced tsa waitlist modal links privacy choices to the privacy request portal", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    await page.goto("/tsa?forceModal=1", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("link", { name: /your privacy choices/i }).click();

    await expect(page).toHaveURL(/\/privacy-request$/);
    await expect(
      page.getByRole("heading", { name: /your privacy choices/i }),
    ).toBeVisible();
  });

  test("forced tsa waitlist modal launches Google auth with Pack callback", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    const authorizeRequestPromise = page.waitForRequest((request) =>
      request.url().includes("auth.itsdoneai.com/oauth2/authorize"),
    );

    await page.goto("/tsa?forceModal=1", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    await page.getByRole("button", { name: /continue with google/i }).click();

    const authorizeRequest = await authorizeRequestPromise;
    const authorizeUrl = new URL(authorizeRequest.url());
    const redirectUri = authorizeUrl.searchParams.get("redirect_uri");

    expect(redirectUri).toBeTruthy();

    const parsedRedirectUri = new URL(redirectUri as string);
    expect(parsedRedirectUri.origin).toBe("http://127.0.0.1:4173");
    expect(parsedRedirectUri.pathname).toBe("/auth/callback");
    expect(authorizeUrl.searchParams.get("identity_provider")).toBe("Google");
  });

  test("forced tsa waitlist modal can be dismissed by existing waitlist users", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);

    await page.goto("/tsa?forceModal=1", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page
      .getByRole("button", { name: /i'm already on the waitlist/i })
      .click();

    await expect(dialog).toBeHidden();
  });

  test("forced tsa waitlist modal submits the embedded waitlist form", async ({
    page,
  }) => {
    await mockTsaPublicBoard(page);
    const waitlistMock = await mockWaitlistSubscribe(page);

    await page.goto("/tsa?forceModal=1", { waitUntil: "domcontentloaded" });
    await dismissConsentBannerIfVisible(page);

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("textbox", { name: /your email address/i }).fill(
      makeE2EEmail(),
    );
    await dialog
      .getByRole("checkbox", { name: /marketing email consent/i })
      .check();
    await dialog.getByRole("button", { name: /pack it\./i }).click();

    await expect
      .poll(() => waitlistMock.getPayload(), {
        message: "tsa waitlist payload should be captured",
      })
      .not.toBeNull();

    const payload = waitlistMock.getPayload() as WaitlistPayload;
    expect(payload.marketingEmailConsent).toBe(true);
    await expect(dialog).toBeHidden();
    await expect
      .poll(() =>
        page.evaluate(() => {
          return window.localStorage.getItem("tsa-waits-email-modal-completed");
        }),
      )
      .toBe("1");
  });
});
