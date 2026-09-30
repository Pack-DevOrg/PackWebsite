import { type ApiClient } from "@/api/client";
import {
  VAULT_ADDRESSES_PATH,
  VaultAddressSchema,
  createVaultAddress,
  deleteVaultAddress,
  listVaultAddresses,
  updateVaultAddress,
} from "./vaultAddresses";

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

const OWNER_ADDRESS = {
  id: "addr_owner_1",
  label: "home" as const,
  line1: "742 Evergreen Terrace",
  line2: "Unit 2",
  city: "Springfield",
  region: "OR",
  postalCode: "97403",
  country: "US",
  deliveryNotes: "gate 221B",
  isDefaultDelivery: true,
};

describe("vault addresses stay on the owner vault", () => {
  it("adds, edits, and deletes an address and returns the default only from the owner list", async () => {
    let stored: typeof OWNER_ADDRESS | undefined;
    const requests: Array<{ path: string; method?: string; body?: unknown }> = [];
    const client: ApiClient = {
      request: async (options) => {
        requests.push(options);
        if (options.path === VAULT_ADDRESSES_PATH && options.method === "POST") {
          stored = { ...OWNER_ADDRESS, ...(options.body as object) };
          return okEnvelope(stored);
        }
        if (options.path === `${VAULT_ADDRESSES_PATH}/addr_owner_1` && options.method === "PATCH") {
          stored = { ...stored!, line1: "744 Evergreen Terrace" };
          return okEnvelope(stored);
        }
        if (options.path === `${VAULT_ADDRESSES_PATH}/addr_owner_1` && options.method === "DELETE") {
          stored = undefined;
          return okEnvelope({});
        }
        return okEnvelope({ addresses: stored === undefined ? [] : [stored] });
      },
    };

    const created = await createVaultAddress(client, {
      label: "home",
      line1: OWNER_ADDRESS.line1,
      line2: OWNER_ADDRESS.line2,
      city: OWNER_ADDRESS.city,
      region: OWNER_ADDRESS.region,
      postalCode: OWNER_ADDRESS.postalCode,
      country: OWNER_ADDRESS.country,
      deliveryNotes: OWNER_ADDRESS.deliveryNotes,
      isDefaultDelivery: true,
    });
    expect(created.isDefaultDelivery).toBe(true);
    expect(await listVaultAddresses(client)).toEqual([created]);

    const edited = await updateVaultAddress(client, created.id, {
      line1: "744 Evergreen Terrace",
    });
    expect(edited.line1).toBe("744 Evergreen Terrace");
    expect((await listVaultAddresses(client))[0]?.isDefaultDelivery).toBe(true);

    await deleteVaultAddress(client, created.id);
    expect(await listVaultAddresses(client)).toEqual([]);
    expect(requests.every((call) => call.path.startsWith(VAULT_ADDRESSES_PATH))).toBe(true);
    expect(JSON.stringify(requests)).not.toContain("user-2");
  });

  it("does not log the address and refuses a region outside the shared US shape", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const client = clientThatReturns(okEnvelope({ addresses: [OWNER_ADDRESS] }));
    const listed = await listVaultAddresses(client);
    expect(listed[0]).toEqual(OWNER_ADDRESS);
    expect(VaultAddressSchema.safeParse({ ...OWNER_ADDRESS, secret: "hunter2" }).success).toBe(false);

    await expect(
      createVaultAddress(client, {
        label: "home",
        line1: OWNER_ADDRESS.line1,
        city: OWNER_ADDRESS.city,
        region: "ZZ",
        postalCode: OWNER_ADDRESS.postalCode,
        country: "US",
        isDefaultDelivery: false,
      }),
    ).rejects.toThrow();

    const logged = [log, info, warn, error]
      .flatMap((spy) => spy.mock.calls.flat().map((part) => String(part)))
      .join("\n");
    expect(logged).not.toContain(OWNER_ADDRESS.line1);
    expect(logged).not.toContain(OWNER_ADDRESS.deliveryNotes);
    log.mockRestore();
    info.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
});
