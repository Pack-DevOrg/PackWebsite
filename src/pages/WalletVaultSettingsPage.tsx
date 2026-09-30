import React, { useState, type FormEvent } from "react";
import styled from "styled-components";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, KeyRound, MapPin, Wallet } from "lucide-react";
import { useApiClient } from "@/api/useApiClient";
import {
  createVaultAddress,
  createVaultCredential,
  createWalletLinkSession,
  deleteVaultAddress,
  deleteVaultCredential,
  fetchWalletLinkStatus,
  listVaultAddresses,
  listVaultCredentials,
  listVirtualCards,
  openLinkUrlBecauseStripeSession,
  updateVaultAddress,
  updateVaultCredential,
  type VaultAddress,
  type VaultAddressWrite,
  type VaultCredentialPublic,
  type VirtualCard,
  type VirtualCardUse,
  type WalletLinkStatus,
} from "@/api/walletVault";
import {
  VaultAddressLabelSchema,
  VaultAddressWriteSchema,
  type VaultAddressLabel,
} from "@/schemas/wallet-vault";
import { useAuth } from "@/auth/AuthContext";
import {
  Button,
  Card,
  IconDisc,
  MicroLabel,
  PageHeader,
} from "@/components/ui/Chrome";

const WALLET_QUERY_KEY = ["wallet-vault-settings"] as const;

export type WalletVaultSettingsPageProps = {
  readonly openLinkUrl?: (url: string) => void;
};

function emptyTextBecauseBlankField(): string {
  return "";
}

function idleRemoveIdBecauseNoneOpen(): string | null {
  return null;
}

function idleEditIdBecauseNoneOpen(): string | null {
  return null;
}

function disconnectedLinkStatusBecauseUnsigned(): WalletLinkStatus {
  return { connected: false };
}

function emptyCredentialsBecauseUnsigned(): VaultCredentialPublic[] {
  return [];
}

function emptyCardsBecauseUnsigned(): VirtualCard[] {
  return [];
}

function emptyAddressesBecauseUnsigned(): VaultAddress[] {
  return [];
}

function defaultAddressLabelBecauseHome(): VaultAddressLabel {
  return "home";
}

function defaultCountryBecauseUs(): string {
  return "US";
}

function blankOptionalBecauseEmpty(value: string): string | undefined {
  if (value.length === 0) {
    return undefined;
  }
  return value;
}

function assignLinkUrlBecausePropOrDefault(
  openLinkUrl: ((url: string) => void) | undefined,
): (url: string) => void {
  if (openLinkUrl === undefined) {
    return openLinkUrlBecauseStripeSession;
  }
  return openLinkUrl;
}

function walletSnapshotBecauseQuery(
  data:
    | {
        readonly link: WalletLinkStatus;
        readonly credentials: readonly VaultCredentialPublic[];
        readonly cards: readonly VirtualCard[];
        readonly addresses: readonly VaultAddress[];
      }
    | undefined,
): {
  readonly link: WalletLinkStatus;
  readonly credentials: readonly VaultCredentialPublic[];
  readonly cards: readonly VirtualCard[];
  readonly addresses: readonly VaultAddress[];
} {
  if (data === undefined) {
    return {
      link: disconnectedLinkStatusBecauseUnsigned(),
      credentials: emptyCredentialsBecauseUnsigned(),
      cards: emptyCardsBecauseUnsigned(),
      addresses: emptyAddressesBecauseUnsigned(),
    };
  }
  return data;
}

function addressWriteBecauseFields(fields: {
  readonly label: string;
  readonly line1: string;
  readonly line2: string;
  readonly city: string;
  readonly region: string;
  readonly postalCode: string;
  readonly country: string;
  readonly deliveryNotes: string;
  readonly isDefaultDelivery: boolean;
}): VaultAddressWrite {
  const label = VaultAddressLabelSchema.parse(fields.label);
  const line2 = blankOptionalBecauseEmpty(fields.line2);
  const deliveryNotes = blankOptionalBecauseEmpty(fields.deliveryNotes);
  return {
    label,
    line1: fields.line1,
    ...(line2 === undefined ? {} : { line2 }),
    city: fields.city,
    region: fields.region,
    postalCode: fields.postalCode,
    country: fields.country,
    ...(deliveryNotes === undefined ? {} : { deliveryNotes }),
    isDefaultDelivery: fields.isDefaultDelivery,
  };
}

function formatAmountBecauseCents(amountCents: number, currency: string): string {
  const amount = amountCents / 100;
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}

function linkCopyBecauseStatus(status: WalletLinkStatus): string {
  if (status.connected === false) {
    return "Not connected.";
  }
  if (status.last4 !== undefined && status.brand !== undefined) {
    return `${status.brand} ending ${status.last4}`;
  }
  return "Stripe Link connected.";
}

const Page = styled.div`
  display: grid;
  gap: var(--space-4);
  padding: var(--space-2) 0 var(--space-4);
`;

const Layout = styled.div`
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1.5fr 1fr;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled(Card)`
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
`;

const SignedOutCard = styled(Panel)`
  max-width: 42rem;
`;

const SignedOutCopy = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ServiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border);
  background: var(--color-background-subtle);
`;

const ServiceCopy = styled.div`
  display: grid;
  gap: var(--space-1);
  min-width: 0;
`;

const ServiceTitle = styled.div`
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const LastSync = styled.span`
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
`;

const ActionRow = styled.div`
  display: inline-flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
`;

const DiscGlyph = styled.span`
  display: inline-flex;

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const BackLink = styled(Link)`
  color: var(--color-accent);
  font-weight: 700;
  font-size: var(--font-size-small);
  text-decoration: none;
`;

const FieldGrid = styled.form`
  display: grid;
  gap: var(--space-3);
`;

const Field = styled.label`
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
`;

const TextInput = styled.input`
  min-height: 2.5rem;
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
`;

const ChoiceInput = styled.select`
  min-height: 2.5rem;
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-base);
`;

const CheckField = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const TypedTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-small);

  th,
  td {
    text-align: left;
    padding: var(--space-2);
    border-bottom: 1px solid var(--color-border);
    color: var(--color-text-primary);
  }

  th {
    color: var(--color-text-secondary);
    font-weight: 700;
    letter-spacing: var(--tracking-eyebrow);
    text-transform: uppercase;
  }
`;

function DisconnectConfirmPair({
  onCancel,
  onConfirm,
}: {
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  return (
    <>
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="button" variant="destructive" onClick={onConfirm}>
        Confirm
      </Button>
    </>
  );
}

function CredentialRow({
  credential,
  editingId,
  removeId,
  onEdit,
  onRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  readonly credential: VaultCredentialPublic;
  readonly editingId: string | null;
  readonly removeId: string | null;
  readonly onEdit: (credential: VaultCredentialPublic) => void;
  readonly onRemove: (id: string) => void;
  readonly onCancelRemove: () => void;
  readonly onConfirmRemove: (id: string) => void;
}) {
  const isEditing = editingId === credential.id;
  const isRemoving = removeId === credential.id;
  return (
    <ServiceRow>
      <ServiceCopy>
        <ServiceTitle>{credential.site}</ServiceTitle>
        <LastSync>{credential.username}</LastSync>
      </ServiceCopy>
      <ActionRow>
        {isRemoving ? (
          <DisconnectConfirmPair
            onCancel={onCancelRemove}
            onConfirm={() => {
              onConfirmRemove(credential.id);
            }}
          />
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onEdit(credential);
              }}
            >
              {isEditing ? "Editing" : "Edit"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onRemove(credential.id);
              }}
            >
              Remove
            </Button>
          </>
        )}
      </ActionRow>
    </ServiceRow>
  );
}

function addressSubtitleBecauseRow(address: VaultAddress): string {
  const street =
    address.line2 === undefined ? address.line1 : `${address.line1}, ${address.line2}`;
  const place = `${address.city}, ${address.region} ${address.postalCode}`;
  if (address.isDefaultDelivery) {
    return `${street}, ${place}. Default delivery`;
  }
  return `${street}, ${place}`;
}

function AddressRow({
  address,
  editingId,
  removeId,
  onEdit,
  onRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  readonly address: VaultAddress;
  readonly editingId: string | null;
  readonly removeId: string | null;
  readonly onEdit: (address: VaultAddress) => void;
  readonly onRemove: (id: string) => void;
  readonly onCancelRemove: () => void;
  readonly onConfirmRemove: (id: string) => void;
}) {
  const isEditing = editingId === address.id;
  const isRemoving = removeId === address.id;
  return (
    <ServiceRow>
      <ServiceCopy>
        <ServiceTitle>{address.label}</ServiceTitle>
        <LastSync>{addressSubtitleBecauseRow(address)}</LastSync>
      </ServiceCopy>
      <ActionRow>
        {isRemoving ? (
          <DisconnectConfirmPair
            onCancel={onCancelRemove}
            onConfirm={() => {
              onConfirmRemove(address.id);
            }}
          />
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onEdit(address);
              }}
            >
              {isEditing ? "Editing" : "Edit"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onRemove(address.id);
              }}
            >
              Remove
            </Button>
          </>
        )}
      </ActionRow>
    </ServiceRow>
  );
}

function CardUseRows({ uses }: { readonly uses: readonly VirtualCardUse[] }) {
  if (uses.length === 0) {
    return (
      <tr>
        <td colSpan={5}>No uses yet.</td>
      </tr>
    );
  }
  return (
    <>
      {uses.map((use) => (
        <tr key={use.id}>
          <td>{use.kind}</td>
          <td>{use.cardId}</td>
          <td>{use.merchant}</td>
          <td>{formatAmountBecauseCents(use.amountCents, "usd")}</td>
          <td>{use.at}</td>
        </tr>
      ))}
    </>
  );
}

export const WalletVaultSettingsPage: React.FC<
  WalletVaultSettingsPageProps
> = ({ openLinkUrl }) => {
  const { status } = useAuth();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const isAuthenticated = status === "authenticated";
  const assignLinkUrl = assignLinkUrlBecausePropOrDefault(openLinkUrl);

  const [site, setSite] = useState(emptyTextBecauseBlankField);
  const [username, setUsername] = useState(emptyTextBecauseBlankField);
  const [secret, setSecret] = useState(emptyTextBecauseBlankField);
  const [editingId, setEditingId] = useState(idleEditIdBecauseNoneOpen);
  const [removeId, setRemoveId] = useState(idleRemoveIdBecauseNoneOpen);
  const [addressLabel, setAddressLabel] = useState(defaultAddressLabelBecauseHome);
  const [line1, setLine1] = useState(emptyTextBecauseBlankField);
  const [line2, setLine2] = useState(emptyTextBecauseBlankField);
  const [city, setCity] = useState(emptyTextBecauseBlankField);
  const [region, setRegion] = useState(emptyTextBecauseBlankField);
  const [postalCode, setPostalCode] = useState(emptyTextBecauseBlankField);
  const [country, setCountry] = useState(defaultCountryBecauseUs);
  const [deliveryNotes, setDeliveryNotes] = useState(emptyTextBecauseBlankField);
  const [isDefaultDelivery, setIsDefaultDelivery] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(idleEditIdBecauseNoneOpen);
  const [removeAddressId, setRemoveAddressId] = useState(idleRemoveIdBecauseNoneOpen);
  const [addressFormError, setAddressFormError] = useState(emptyTextBecauseBlankField);

  const walletQuery = useQuery({
    queryKey: WALLET_QUERY_KEY,
    enabled: isAuthenticated,
    queryFn: async () => {
      const [link, credentials, cards, addresses] = await Promise.all([
        fetchWalletLinkStatus(apiClient),
        listVaultCredentials(apiClient),
        listVirtualCards(apiClient),
        listVaultAddresses(apiClient),
      ]);
      return { link, credentials, cards, addresses };
    },
  });

  const invalidateWallet = () => {
    void queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId !== null) {
        const patch: {
          site: string;
          username: string;
          secret?: string;
        } = { site, username };
        if (secret.length > 0) {
          patch.secret = secret;
        }
        return updateVaultCredential(apiClient, editingId, patch);
      }
      return createVaultCredential(apiClient, { site, username, secret });
    },
    onSuccess: () => {
      setSite(emptyTextBecauseBlankField());
      setUsername(emptyTextBecauseBlankField());
      setSecret(emptyTextBecauseBlankField());
      setEditingId(idleEditIdBecauseNoneOpen());
      invalidateWallet();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteVaultCredential(apiClient, id),
    onSuccess: () => {
      setRemoveId(idleRemoveIdBecauseNoneOpen());
      invalidateWallet();
    },
  });

  const clearAddressForm = () => {
    setAddressLabel(defaultAddressLabelBecauseHome());
    setLine1(emptyTextBecauseBlankField());
    setLine2(emptyTextBecauseBlankField());
    setCity(emptyTextBecauseBlankField());
    setRegion(emptyTextBecauseBlankField());
    setPostalCode(emptyTextBecauseBlankField());
    setCountry(defaultCountryBecauseUs());
    setDeliveryNotes(emptyTextBecauseBlankField());
    setIsDefaultDelivery(false);
    setEditingAddressId(idleEditIdBecauseNoneOpen());
    setAddressFormError(emptyTextBecauseBlankField());
  };

  const saveAddressMutation = useMutation({
    mutationFn: async () => {
      let payload: VaultAddressWrite;
      try {
        payload = VaultAddressWriteSchema.parse(
          addressWriteBecauseFields({
            label: addressLabel,
            line1,
            line2,
            city,
            region,
            postalCode,
            country,
            deliveryNotes,
            isDefaultDelivery,
          }),
        );
      } catch {
        throw new Error("Address was not saved.");
      }
      if (editingAddressId !== null) {
        return updateVaultAddress(apiClient, editingAddressId, payload);
      }
      return createVaultAddress(apiClient, payload);
    },
    onSuccess: () => {
      clearAddressForm();
      invalidateWallet();
    },
    onError: () => {
      setAddressFormError("Address was not saved.");
    },
  });

  const removeAddressMutation = useMutation({
    mutationFn: (id: string) => deleteVaultAddress(apiClient, id),
    onSuccess: () => {
      setRemoveAddressId(idleRemoveIdBecauseNoneOpen());
      invalidateWallet();
    },
  });

  const linkMutation = useMutation({
    mutationFn: () => createWalletLinkSession(apiClient),
    onSuccess: (session) => {
      assignLinkUrl(session.url);
    },
  });

  const snapshot = walletSnapshotBecauseQuery(walletQuery.data);
  const linkStatus = snapshot.link;
  const credentials = snapshot.credentials;
  const cards = snapshot.cards;
  const addresses = snapshot.addresses;
  const uses = cards.flatMap((card) => card.uses);

  const onSubmitCredential = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  const onSubmitAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressFormError(emptyTextBecauseBlankField());
    saveAddressMutation.mutate();
  };

  const saveLabel = editingId === null ? "Save credential" : "Update credential";
  const saveAddressLabel =
    editingAddressId === null ? "Save address" : "Update address";
  const secretHint =
    editingId === null
      ? "Secret is stored in the vault. It never comes back to this page."
      : "Leave blank to keep the stored secret. A new value never round-trips after save.";

  return (
    <>
      <Helmet>
        <title>Wallet & Vault | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Page>
        <MicroLabel>Account</MicroLabel>
        <PageHeader
          title="Wallet & Vault"
          subtitle="Connect Stripe Link, keep site credentials and delivery addresses in the vault, and read every virtual card as typed rows."
        >
          <DiscGlyph>
            <Wallet aria-hidden="true" />
          </DiscGlyph>
        </PageHeader>
        <BackLink to="/app/settings">Back to settings</BackLink>

        {isAuthenticated ? (
          <Layout>
            <div>
              <Panel aria-label="Payment method">
                <PageHeader title="Payment method">
                  <DiscGlyph>
                    <CreditCard aria-hidden="true" />
                  </DiscGlyph>
                </PageHeader>
                <ServiceRow>
                  <ServiceCopy>
                    <ServiceTitle>Stripe Link</ServiceTitle>
                    <LastSync>{linkCopyBecauseStatus(linkStatus)}</LastSync>
                  </ServiceCopy>
                  <ActionRow>
                    {linkStatus.connected ? (
                      <LastSync>Connected</LastSync>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          linkMutation.mutate();
                        }}
                      >
                        Connect with Stripe Link
                      </Button>
                    )}
                  </ActionRow>
                </ServiceRow>
              </Panel>

              <Panel aria-label="Vault credentials">
                <PageHeader title="Vault credentials">
                  <DiscGlyph>
                    <KeyRound aria-hidden="true" />
                  </DiscGlyph>
                </PageHeader>
                <FieldGrid onSubmit={onSubmitCredential}>
                  <Field>
                    Site
                    <TextInput
                      name="site"
                      autoComplete="url"
                      value={site}
                      onChange={(event) => {
                        setSite(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Username
                    <TextInput
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Secret
                    <TextInput
                      name="secret"
                      type="password"
                      autoComplete="new-password"
                      value={secret}
                      onChange={(event) => {
                        setSecret(event.target.value);
                      }}
                    />
                  </Field>
                  <LastSync>{secretHint}</LastSync>
                  <ActionRow>
                    <Button type="submit" variant="primary">
                      {saveLabel}
                    </Button>
                  </ActionRow>
                </FieldGrid>
                {credentials.map((credential) => (
                  <CredentialRow
                    key={credential.id}
                    credential={credential}
                    editingId={editingId}
                    removeId={removeId}
                    onEdit={(next) => {
                      setEditingId(next.id);
                      setSite(next.site);
                      setUsername(next.username);
                      setSecret(emptyTextBecauseBlankField());
                    }}
                    onRemove={(id) => {
                      setRemoveId(id);
                    }}
                    onCancelRemove={() => {
                      setRemoveId(idleRemoveIdBecauseNoneOpen());
                    }}
                    onConfirmRemove={(id) => {
                      removeMutation.mutate(id);
                    }}
                  />
                ))}
                {credentials.length === 0 ? (
                  <LastSync>No vault credentials yet.</LastSync>
                ) : null}
              </Panel>

              <Panel aria-label="Addresses">
                <PageHeader title="Addresses">
                  <DiscGlyph>
                    <MapPin aria-hidden="true" />
                  </DiscGlyph>
                </PageHeader>
                <FieldGrid onSubmit={onSubmitAddress}>
                  <Field>
                    Label
                    <ChoiceInput
                      name="label"
                      value={addressLabel}
                      onChange={(event) => {
                        const next = VaultAddressLabelSchema.safeParse(event.target.value);
                        if (next.success) {
                          setAddressLabel(next.data);
                        }
                      }}
                    >
                      <option value="home">home</option>
                      <option value="work">work</option>
                      <option value="delivery">delivery</option>
                      <option value="other">other</option>
                    </ChoiceInput>
                  </Field>
                  <Field>
                    Street
                    <TextInput
                      name="line1"
                      autoComplete="address-line1"
                      value={line1}
                      onChange={(event) => {
                        setLine1(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Line 2
                    <TextInput
                      name="line2"
                      autoComplete="address-line2"
                      value={line2}
                      onChange={(event) => {
                        setLine2(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    City
                    <TextInput
                      name="city"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(event) => {
                        setCity(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Region
                    <TextInput
                      name="region"
                      autoComplete="address-level1"
                      value={region}
                      onChange={(event) => {
                        setRegion(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Postal code
                    <TextInput
                      name="postalCode"
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(event) => {
                        setPostalCode(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Country
                    <TextInput
                      name="country"
                      autoComplete="country"
                      value={country}
                      onChange={(event) => {
                        setCountry(event.target.value);
                      }}
                    />
                  </Field>
                  <Field>
                    Delivery notes
                    <TextInput
                      name="deliveryNotes"
                      value={deliveryNotes}
                      onChange={(event) => {
                        setDeliveryNotes(event.target.value);
                      }}
                    />
                  </Field>
                  <CheckField>
                    <input
                      type="checkbox"
                      name="isDefaultDelivery"
                      checked={isDefaultDelivery}
                      onChange={(event) => {
                        setIsDefaultDelivery(event.target.checked);
                      }}
                    />
                    Default delivery address
                  </CheckField>
                  {addressFormError.length > 0 ? (
                    <LastSync>{addressFormError}</LastSync>
                  ) : null}
                  <ActionRow>
                    <Button type="submit" variant="primary">
                      {saveAddressLabel}
                    </Button>
                  </ActionRow>
                </FieldGrid>
                {addresses.map((address) => (
                  <AddressRow
                    key={address.id}
                    address={address}
                    editingId={editingAddressId}
                    removeId={removeAddressId}
                    onEdit={(next) => {
                      setEditingAddressId(next.id);
                      setAddressLabel(next.label);
                      setLine1(next.line1);
                      setLine2(next.line2 ?? emptyTextBecauseBlankField());
                      setCity(next.city);
                      setRegion(next.region);
                      setPostalCode(next.postalCode);
                      setCountry(next.country);
                      setDeliveryNotes(next.deliveryNotes ?? emptyTextBecauseBlankField());
                      setIsDefaultDelivery(next.isDefaultDelivery);
                      setAddressFormError(emptyTextBecauseBlankField());
                    }}
                    onRemove={(id) => {
                      setRemoveAddressId(id);
                    }}
                    onCancelRemove={() => {
                      setRemoveAddressId(idleRemoveIdBecauseNoneOpen());
                    }}
                    onConfirmRemove={(id) => {
                      removeAddressMutation.mutate(id);
                    }}
                  />
                ))}
                {addresses.length === 0 ? (
                  <LastSync>No addresses yet.</LastSync>
                ) : null}
              </Panel>
            </div>

            <Panel aria-label="Virtual cards">
              <PageHeader title="Virtual cards" />
              <TableWrap>
                <TypedTable aria-label="Issued virtual cards">
                  <thead>
                    <tr>
                      <th>Card</th>
                      <th>Merchant</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={5}>No virtual cards issued.</td>
                      </tr>
                    ) : (
                      cards.map((card) => (
                        <tr key={card.id}>
                          <td>{card.surrogate}</td>
                          <td>{card.merchant}</td>
                          <td>
                            {formatAmountBecauseCents(
                              card.amountCents,
                              card.currency,
                            )}
                          </td>
                          <td>{card.status}</td>
                          <td>{card.issuedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </TypedTable>
              </TableWrap>
              <PageHeader title="Card uses" />
              <TableWrap>
                <TypedTable aria-label="Virtual card uses">
                  <thead>
                    <tr>
                      <th>Kind</th>
                      <th>Card</th>
                      <th>Merchant</th>
                      <th>Amount</th>
                      <th>At</th>
                    </tr>
                  </thead>
                  <tbody>
                    <CardUseRows uses={uses} />
                  </tbody>
                </TypedTable>
              </TableWrap>
            </Panel>
          </Layout>
        ) : (
          <SignedOutCard>
            <PageHeader title="No account on this session" />
            <SignedOutCopy>
              Wallet, vault credentials, addresses, and virtual cards stay hidden until you
              are signed in.
            </SignedOutCopy>
          </SignedOutCard>
        )}
      </Page>
    </>
  );
};

export default WalletVaultSettingsPage;
