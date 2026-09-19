import {
  VaultCredentialPublicSchema,
  VirtualCardListSchema,
  VirtualCardUseKindSchema,
} from "@/schemas/wallet-vault";
import {
  createVaultCredential,
  listVaultCredentials,
  listVirtualCards,
} from "./walletVault";
import { ApiRequestError, type ApiClient } from "./client";

function okEnvelope(data: unknown) {
  return {
    success: true as const,
    data,
  };
}

function clientThatReturns(payload: unknown): ApiClient {
  return {
    request: async () => payload,
  };
}

const PUBLIC_CREDENTIAL = {
  id: "cred_e2e_1",
  site: "https://hotels.example",
  username: "pack-e2e",
  secretPresent: true as const,
};

describe("walletVault secret never round-trips", () => {
  it("lists credentials without a secret field", async () => {
    const listed = await listVaultCredentials(
      clientThatReturns(
        okEnvelope({
          credentials: [PUBLIC_CREDENTIAL],
        }),
      ),
    );

    expect(listed).toEqual([PUBLIC_CREDENTIAL]);
    expect(Object.keys(listed[0])).not.toContain("secret");
  });

  it("refuses a list row that still carries secret", async () => {
    await expect(
      listVaultCredentials(
        clientThatReturns(
          okEnvelope({
            credentials: [
              {
                ...PUBLIC_CREDENTIAL,
                secret: "hunter2",
              },
            ],
          }),
        ),
      ),
    ).rejects.toBeInstanceOf(ApiRequestError);
  });

  it("create response is public-only; secretPresent is true", async () => {
    const created = await createVaultCredential(
      clientThatReturns(okEnvelope(PUBLIC_CREDENTIAL)),
      {
        site: "https://hotels.example",
        username: "pack-e2e",
        secret: "hunter2",
      },
    );

    expect(created).toEqual(PUBLIC_CREDENTIAL);
    expect(VaultCredentialPublicSchema.safeParse({
      ...created,
      secret: "hunter2",
    }).success).toBe(false);
  });

  it("virtual card uses are typed issue/authorization/decline rows", async () => {
    const cards = await listVirtualCards(
      clientThatReturns(
        okEnvelope({
          cards: [
            {
              id: "ic_e2e_1",
              surrogate: "card_e2e_1",
              merchant: "Example Air",
              amountCents: 18400,
              currency: "usd",
              status: "issued",
              issuedAt: "2026-09-18T12:00:00.000Z",
              uses: [
                {
                  id: "use_issue",
                  cardId: "ic_e2e_1",
                  kind: "issue",
                  amountCents: 18400,
                  merchant: "Example Air",
                  at: "2026-09-18T12:00:00.000Z",
                },
                {
                  id: "use_auth",
                  cardId: "ic_e2e_1",
                  kind: "authorization",
                  amountCents: 18400,
                  merchant: "Example Air",
                  at: "2026-09-18T12:01:00.000Z",
                },
                {
                  id: "use_decl",
                  cardId: "ic_e2e_1",
                  kind: "decline",
                  amountCents: 200,
                  merchant: "Other Mart",
                  at: "2026-09-18T12:02:00.000Z",
                },
              ],
            },
          ],
        }),
      ),
    );

    expect(VirtualCardListSchema.parse({ cards }).cards).toHaveLength(1);
    expect(cards[0].uses.map((use) => use.kind)).toEqual([
      "issue",
      "authorization",
      "decline",
    ]);
    for (const kind of cards[0].uses.map((use) => use.kind)) {
      expect(VirtualCardUseKindSchema.parse(kind)).toBe(kind);
    }
  });
});
