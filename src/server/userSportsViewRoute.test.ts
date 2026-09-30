import {createServer, request as httpRequest, type Server} from "node:http";
import type {AddressInfo} from "node:net";
import {ApiRequestError, type ApiClient} from "@/api/client";
import {readUserSportsView, USER_SPORTS_VIEW_PATH, type SportsViewSource} from "@/api/sportsView";
import {writeUserSportsViewRoute} from "./userSportsViewRoute";

function getJson(
  url: string,
  headers: Record<string, string>,
): Promise<{readonly status: number; readonly body: unknown}> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, {method: "GET", headers}, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: response.statusCode ?? 0,
          body: JSON.parse(text) as unknown,
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

const AS_OF = "2026-09-30T20:00:00.000Z";

function source(): SportsViewSource {
  return {
    asOf: AS_OF,
    occasions: [
      {
        kind: "game",
        identityKey: "game-ended",
        start: "2026-09-30T16:00:00.000Z",
        end: "2026-09-30T19:00:00.000Z",
        participants: ["Seahawks", "49ers"],
        facts: [
          {
            role: "result",
            value: "Seahawks won",
            asOf: "2026-09-30T19:05:00.000Z",
            sourceUrl: "https://example.com/result",
          },
        ],
        validFrom: "2026-09-30T16:00:00.000Z",
        validUntil: "2026-10-01T19:00:00.000Z",
      },
    ],
    interests: [{occasionId: "game-ended"}],
    teams: [],
    fantasyMatchups: [],
  };
}

function listen(): Promise<{server: Server; origin: string}> {
  const sports = source();
  const server = createServer((request, response) => {
    writeUserSportsViewRoute(request, response, () => sports);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({server, origin: `http://127.0.0.1:${address.port}`});
    });
  });
}

describe("GET /user/sports-view", () => {
  it("serves the logged-in sports read over HTTP and rolls the ended game into one recap", async () => {
    const {server, origin} = await listen();
    try {
      const client: ApiClient = {
        request: async (options) => {
          const response = await getJson(`${origin}${options.path}`, {"x-pack-user": "user-1"});
          if (response.status < 200 || response.status >= 300) {
            const error = (response.body as {error?: {message?: string}}).error;
            throw new ApiRequestError(response.status, error?.message ?? "Request failed.", error);
          }
          return response.body;
        },
      };

      const view = await readUserSportsView(client);

      expect(view.games).toEqual([]);
      expect(view.recaps).toEqual([
        {
          identityKey: "game-ended",
          title: "Seahawks vs 49ers",
          recap: "Seahawks won",
        },
      ]);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("returns 401 with the published code when the user header is missing", async () => {
    const {server, origin} = await listen();
    try {
      const response = await getJson(`${origin}${USER_SPORTS_VIEW_PATH}`, {});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        status: 401,
        error: {message: "Authentication required.", code: "UNAUTHENTICATED"},
      });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});
