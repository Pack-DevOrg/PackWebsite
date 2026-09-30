import {expect, test} from "@playwright/test";

const APP_ID = "GW8YNJQZCK.com.packai.app";

test("serves apple-app-site-association as json with no redirect", async ({request}) => {
  const response = await request.get("/.well-known/apple-app-site-association", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  expect(new URL(response.url()).pathname).toBe("/.well-known/apple-app-site-association");
  const body = (await response.json()) as {
    applinks: {details: Array<{appIDs: string[]; components: Array<{"/": string}>}>};
    appclips: {apps: string[]};
  };
  expect(body.appclips.apps).toEqual([`${APP_ID}.Clip`]);
  expect(body.applinks.details[0]?.appIDs).toEqual([APP_ID]);
  expect(body.applinks.details[0]?.components.map((component) => component["/"])).toEqual(
    expect.arrayContaining(["/i/*", "/lv/*"]),
  );
});
