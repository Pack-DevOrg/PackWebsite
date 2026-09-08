import React, {useCallback, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import styled from 'styled-components';
import {Check, Copy, Download, ExternalLink, Mail} from 'lucide-react';
import {copyTextToClipboard} from '../utils/clipboard';
import {PRIVACY_FORWARDING_TRAVEL_DOMAINS} from '../data/privacyForwardingTravelDomains';
import {
  buildExchangeOnlineInboxRulesScript,
  buildGmailFiltersXml,
} from '../utils/privacyForwardingUtils';
import gmailFilterImportScreenshot from '../assets/email-forwarding/gmail-filter-import.png';
import {useI18n} from '@/i18n/I18nProvider';
import PageSeo from '@/seo/pageSeo';
import {AuthProvider} from '@/auth/AuthContext';
import {useApiClient} from '@/api/useApiClient';
import {useMountEffect} from '@/hooks/useMountEffect';
import {
  Button,
  Card,
  IconDisc,
  MicroLabel,
  PageHeader,
} from '@/components/ui/Chrome';

type Provider = 'gmail' | 'outlook';
type StepState = 'done' | 'active' | 'upcoming';
type CopyState = 'idle' | 'copied' | 'error';

type VerificationCodePayload = {
  readonly success: boolean;
  readonly data?: {
    readonly forwardTo?: string;
    readonly code?: string;
    readonly expiresAt?: string;
    readonly receivedAt?: string;
  };
};

const DEFAULT_FORWARD_TO = 'trips@trypackai.com';
const GMAIL_FORWARDING_URL =
  'https://mail.google.com/mail/u/0/#settings/fwdandpop';
const GMAIL_FILTERS_URL = 'https://mail.google.com/mail/u/0/#settings/filters';
const OUTLOOK_RULES_CONSUMER_URL =
  'https://outlook.live.com/mail/0/options/mail/rules';
const OUTLOOK_RULES_M365_URL =
  'https://outlook.office.com/mail/options/mail/rules';
const VERIFICATION_CODE_PATH =
  '/user/accounts/privacy-forwarding/verification-code';
const POLL_MS = 8000;

function documentOrMissing(): Document | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return document;
}

function windowOrMissing(): Window | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window;
}

function useQueryParam(name: string): string | null {
  const location = useLocation();
  return useMemo(
    () => new URLSearchParams(location.search).get(name),
    [location.search, name],
  );
}

function isPackForwardingAddress(candidate: string): boolean {
  const trimmed = candidate.trim().toLowerCase();
  return Boolean(trimmed) && /^[^\s@]+@trypackai\.com$/.test(trimmed);
}

function providerFromQueryBecauseGmailDefault(raw: string | null): Provider {
  if (raw === 'outlook') {
    return 'outlook';
  }
  return 'gmail';
}

function forwardingAddressFromQueryBecauseDefault(raw: string | null): string {
  if (raw !== null && isPackForwardingAddress(raw)) {
    return raw;
  }
  return DEFAULT_FORWARD_TO;
}

function capturedCodeBecausePayload(
  payload: VerificationCodePayload,
): string | undefined {
  if (payload.success !== true) {
    return undefined;
  }
  const data = payload.data;
  if (data === undefined) {
    return undefined;
  }
  if (typeof data.code !== 'string' || data.code.length === 0) {
    return undefined;
  }
  return data.code;
}

function forwardToFromPayloadBecauseQueryDefault(
  payload: VerificationCodePayload,
  queryDefault: string,
): string {
  if (payload.success !== true) {
    return queryDefault;
  }
  const data = payload.data;
  if (data === undefined) {
    return queryDefault;
  }
  const candidate = data.forwardTo;
  if (typeof candidate === 'string' && isPackForwardingAddress(candidate)) {
    return candidate;
  }
  return queryDefault;
}

function emptyCapturedCodeBecauseNone(): undefined {
  return undefined;
}

const Page = styled.div`
  padding: var(--space-4) 0 var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Lead = styled.p`
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin: 0;
  text-align: left;
`;

const Surface = styled(Card)`
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  box-shadow: none;
  backdrop-filter: none;
`;

const CardTitle = styled.h2`
  font-size: var(--font-size-lg);
  margin: 0;
  color: var(--color-text-primary);
`;

const SmallText = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
`;

const TabsRow = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
`;

const TabLink = styled.a<{$active: boolean}>`
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-disc);
  border: 1px solid
    ${(props) =>
      props.$active ? 'var(--color-accent)' : 'var(--color-border)'};
  background: ${(props) =>
    props.$active ? 'var(--color-accent)' : 'var(--color-background-subtle)'};
  color: ${(props) =>
    props.$active
      ? 'var(--color-text-on-accent)'
      : 'var(--color-text-primary)'};
  font-weight: 700;
  text-decoration: none;
`;

const StepCard = styled.div<{$state: StepState}>`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  opacity: ${(props) => (props.$state === 'upcoming' ? 0.55 : 1)};
`;

const StepHeaderRow = styled.div`
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
`;

const StepText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const StepTitle = styled.div`
  font-weight: 700;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
`;

const StepDescription = styled.p`
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
  font-size: var(--font-size-small);
`;

const StepActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  padding-left: calc(32px + var(--space-2));
`;

const FilledDisc = styled.span`
  display: inline-flex;
  & > div {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-text-on-accent);
  }
`;

const AddressValue = styled.code`
  font-family: var(--font-mono);
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
`;

const CodeValue = styled.span`
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-eyebrow);
  color: var(--color-accent);
`;

const InlineLink = styled.a`
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: none;
`;

const Screenshot = styled.img`
  width: 100%;
  height: auto;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-border);
  background: var(--color-background-subtle);
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-l);
  border: 1px solid var(--color-border);
  background: var(--color-background-subtle);
  overflow: auto;
  max-height: 320px;
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  line-height: 1.55;
`;

const AddressRow = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`;

const WizardColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  @media (min-width: 960px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const Step: React.FC<{
  readonly index: number;
  readonly title: string;
  readonly description?: string;
  readonly state: StepState;
  readonly testId?: string;
  readonly children?: React.ReactNode;
}> = ({index, title, description, state, testId, children}) => {
  const disc =
    state === 'done' ? (
      <IconDisc>
        <span role="img" aria-label="Done">
          <Check size={14} aria-hidden="true" />
        </span>
      </IconDisc>
    ) : state === 'active' ? (
      <FilledDisc>
        <IconDisc>{index}</IconDisc>
      </FilledDisc>
    ) : (
      <IconDisc>{index}</IconDisc>
    );

  return (
    <StepCard $state={state} data-testid={testId} data-state={state}>
      <StepHeaderRow>
        {disc}
        <StepText>
          <StepTitle>{title}</StepTitle>
          {description !== undefined ? (
            <StepDescription>{description}</StepDescription>
          ) : null}
        </StepText>
      </StepHeaderRow>
      {children !== undefined ? <StepActions>{children}</StepActions> : null}
    </StepCard>
  );
};

const emailForwardingContent = {
  en: {
    copied: 'Copied',
    copyFailed: 'Copy failed',
    copy: 'Copy',
    download: 'Download',
    pastePlaceholder: 'Paste your forwarding address above, then generate.',
    title: 'Email forwarding setup',
    seoDescription:
      'Step-by-step guide for forwarding travel confirmations only to Pack from Gmail or Outlook.',
    leadPrefix: 'Forward ',
    leadBold: 'travel confirmations only',
    leadSuffix:
      ' to Pack (no full mailbox access). This guide walks you through the exact clicks in ',
    desktopTitle: 'Use a desktop browser',
    desktopBody1:
      'This page is the manual (desktop) checklist. Forwarding settings and filter import are easiest on desktop. If you’re currently on your phone, open Pack and tap Send desktop guide.',
    desktopBody2:
      'If you want Pack to create rules automatically, use Automatic (mobile) inside the app.',
    emailProviderAria: 'Email provider',
    gmail: 'Gmail',
    outlook: 'Outlook',
    forwardingAddressLabel: 'Forwarding address',
    gmailStep1Title: 'Add Pack’s address in Gmail',
    gmailStep1DescriptionSuffix:
      ' in Gmail’s forwarding settings. Gmail then emails a confirmation code — it appears in the card above automatically.',
    openGmailForwarding: 'Open Gmail forwarding settings',
    gmailStep2Title: 'Enter the code in Gmail to confirm',
    gmailStep2Description:
      'Paste the code from the card above into Gmail’s confirmation dialog — Google requires this proof before any forwarding.',
    gmailStep3Title: 'Create filters for travel domains',
    gmailStep3DescriptionPrefix: 'Download the Pack travel filter file (',
    gmailStep3DescriptionSuffix:
      ' domains) and import it in Gmail after the address is confirmed.',
    downloadFiltersXml: 'Download filters XML',
    openGmailFilters: 'Open Gmail filters',
    gmailStep3NotePrefix:
      'After import, click Edit on the Pack filter and confirm it forwards to ',
    verificationCodeTitle: 'Gmail verification code',
    verificationCodeHint:
      'Enter this code in Gmail settings to confirm the address',
    outlookStep2Title: 'Create a rule (Outlook)',
    outlookStep2Body:
      'Create a rule that forwards travel emails to the Pack forwarding address you copied from the app. Some work/school accounts may block external auto-forwarding.',
    outlookHelpConsumer: 'Outlook.com rules',
    outlookHelpWeb: 'Outlook web rules',
    outlookHelpForwarding: 'Automatic forwarding',
    openOutlookConsumer: 'Open Outlook.com rules',
    openOutlookM365: 'Open Microsoft 365 rules',
    outlookStep3Title: 'Optional: create rules in bulk (work/school)',
    outlookStep3Body:
      'If your org allows Exchange Online PowerShell, you can generate bulk travel-domain rules quickly:',
    powershellTitle: 'Microsoft 365 / Exchange Online inbox rules (PowerShell)',
    powershellDescription:
      'Work/school accounts only. Requires Exchange Online PowerShell. Fill in the mailbox placeholder, then run.',
    outlookStep4Title: 'Confirm it’s working',
    outlookStep4Body:
      'Forwarding applies to new incoming emails. After setup, new travel confirmations should start appearing in Pack shortly.',
    olderEmailsAria: 'Older emails',
    olderEmailsTitle: 'Send older travel emails',
    olderEmailsBody:
      'Filters generally apply to new incoming mail. To ingest older confirmations, forward your past travel emails to your Pack forwarding address.',
    olderEmailsItems: [
      'Search for your travel confirmations (flights, hotels, rentals).',
      'Select the emails you want Pack to ingest.',
    ],
    gmailOlderItem1Prefix: 'Go to ',
    gmailOlderItem1Suffix:
      ' and click Edit on the Pack filter (look for the label Pack/TravelProviderDomains).',
    gmailOlderItem2: 'Search for your travel confirmations (flights, hotels, rentals).',
    gmailOlderItem3: 'Select all.',
    troubleshootingAria: 'Troubleshooting (quick)',
    troubleshootingTitle: 'Troubleshooting (quick)',
    troubleshootingItems: [
      {
        strong: 'I don’t have the Gmail verification code.',
        text: ' Add Pack’s address in Gmail first. The code appears in the card above once Gmail emails it to Pack.',
      },
      {
        strong: 'I haven’t enabled Gmail forwarding yet.',
        textPrefix: ' Use ',
        linkLabel: 'Gmail forwarding settings',
        textSuffix: ' and complete the address step before creating filters.',
      },
      {
        strong: 'Work/school email won’t forward.',
        textPrefix:
          ' Many companies block external auto-forwarding. Ask IT to allow forwarding to ',
      },
    ],
  },
  es: {
    copied: 'Copiado',
    copyFailed: 'Error al copiar',
    copy: 'Copiar',
    download: 'Descargar',
    pastePlaceholder: 'Pega arriba tu dirección de reenvío y luego genera.',
    title: 'Configuración de reenvío de correo',
    seoDescription:
      'Guía paso a paso para reenviar solo confirmaciones de viaje a Pack desde Gmail u Outlook.',
    leadPrefix: 'Reenvía ',
    leadBold: 'solo confirmaciones de viaje',
    leadSuffix:
      ' a Pack (sin acceso completo al buzón). Esta guía te muestra los clics exactos en ',
    desktopTitle: 'Usa un navegador de escritorio',
    desktopBody1:
      'Esta página es la guía manual para escritorio. La configuración del reenvío y la importación de filtros es más fácil en desktop. Si estás en el teléfono, abre Pack y toca Enviar guía de escritorio.',
    desktopBody2:
      'Si quieres que Pack cree reglas automáticamente, usa Automático (móvil) dentro de la app.',
    emailProviderAria: 'Proveedor de correo',
    gmail: 'Gmail',
    outlook: 'Outlook',
    forwardingAddressLabel: 'Dirección de reenvío',
    gmailStep1Title: 'Add Pack’s address in Gmail',
    gmailStep1DescriptionSuffix:
      ' in Gmail’s forwarding settings. Gmail then emails a confirmation code — it appears in the card above automatically.',
    openGmailForwarding: 'Open Gmail forwarding settings',
    gmailStep2Title: 'Enter the code in Gmail to confirm',
    gmailStep2Description:
      'Paste the code from the card above into Gmail’s confirmation dialog — Google requires this proof before any forwarding.',
    gmailStep3Title: 'Create filters for travel domains',
    gmailStep3DescriptionPrefix: 'Descarga el archivo de filtro de viajes de Pack (',
    gmailStep3DescriptionSuffix:
      ' dominios) e impórtalo en Gmail después de confirmar la dirección.',
    downloadFiltersXml: 'Download filters XML',
    openGmailFilters: 'Open Gmail filters',
    gmailStep3NotePrefix:
      'Después de importar, haz clic en Edit en el filtro de Pack y confirma que reenvía a ',
    verificationCodeTitle: 'Gmail verification code',
    verificationCodeHint:
      'Enter this code in Gmail settings to confirm the address',
    outlookStep2Title: 'Crea una regla (Outlook)',
    outlookStep2Body:
      'Crea una regla que reenvíe los correos de viaje a la dirección de Pack que copiaste desde la app. Algunas cuentas de trabajo o escuela pueden bloquear el auto-forwarding externo.',
    outlookHelpConsumer: 'Reglas de Outlook.com',
    outlookHelpWeb: 'Reglas de Outlook web',
    outlookHelpForwarding: 'Reenvío automático',
    openOutlookConsumer: 'Abrir reglas de Outlook.com',
    openOutlookM365: 'Abrir reglas de Microsoft 365',
    outlookStep3Title: 'Opcional: crear reglas en lote (trabajo/escuela)',
    outlookStep3Body:
      'Si tu organización permite Exchange Online PowerShell, puedes generar reglas de dominios de viaje en lote rápidamente:',
    powershellTitle: 'Reglas de bandeja para Microsoft 365 / Exchange Online (PowerShell)',
    powershellDescription:
      'Solo para cuentas de trabajo o escuela. Requiere Exchange Online PowerShell. Completa el placeholder del buzón y luego ejecútalo.',
    outlookStep4Title: 'Confirma que funciona',
    outlookStep4Body:
      'El reenvío se aplica a correos nuevos. Después de la configuración, las nuevas confirmaciones de viaje deberían empezar a aparecer en Pack pronto.',
    olderEmailsAria: 'Correos antiguos',
    olderEmailsTitle: 'Enviar correos antiguos de viaje',
    olderEmailsBody:
      'Los filtros generalmente se aplican a correos nuevos. Para ingerir confirmaciones antiguas, reenvía tus correos pasados a tu dirección de reenvío de Pack.',
    olderEmailsItems: [
      'Busca tus confirmaciones de viaje (vuelos, hoteles, rentas).',
      'Selecciona los correos que quieres que Pack ingiera.',
    ],
    gmailOlderItem1Prefix: 'Ve a ',
    gmailOlderItem1Suffix:
      ' y haz clic en Edit en el filtro de Pack (busca la etiqueta Pack/TravelProviderDomains).',
    gmailOlderItem2: 'Busca tus confirmaciones de viaje (vuelos, hoteles, rentas).',
    gmailOlderItem3: 'Selecciona todo.',
    troubleshootingAria: 'Solución de problemas (rápida)',
    troubleshootingTitle: 'Solución de problemas (rápida)',
    troubleshootingItems: [
      {
        strong: 'No tengo el código de verificación de Gmail.',
        text: ' Add Pack’s address in Gmail first. The code appears in the card above once Gmail emails it to Pack.',
      },
      {
        strong: 'Todavía no activé el reenvío en Gmail.',
        textPrefix: ' Usa ',
        linkLabel: 'Gmail forwarding settings',
        textSuffix: ' and complete the address step before creating filters.',
      },
      {
        strong: 'El correo de trabajo o escuela no reenvía.',
        textPrefix:
          ' Muchas empresas bloquean el auto-forwarding externo. Pide a TI que permita reenviar a ',
      },
    ],
  },
} as const;

function downloadTextFile({
  filename,
  mimeType,
  content,
}: {
  filename: string;
  mimeType: string;
  content: string;
}): void {
  const doc = documentOrMissing();
  const win = windowOrMissing();
  if (doc === undefined || win === undefined) {
    return;
  }
  const blob = new Blob([content], {type: mimeType});
  const url = URL.createObjectURL(blob);
  const anchor = doc.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  doc.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function openExternalUrl(url: string): void {
  const win = windowOrMissing();
  if (win === undefined) {
    return;
  }
  win.open(url, '_blank', 'noopener,noreferrer');
}

const CopyableArtifact: React.FC<{
  readonly title: string;
  readonly description?: string;
  readonly content: string;
  readonly download?: {filename: string; mimeType: string};
}> = ({title, description, content, download}) => {
  const {locale} = useI18n();
  const localizedContent = emailForwardingContent[locale];
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const hasContent = content.length > 0;

  const handleCopy = useCallback(async () => {
    try {
      await copyTextToClipboard(content);
      setCopyState('copied');
      const win = windowOrMissing();
      if (win !== undefined) {
        win.setTimeout(() => setCopyState('idle'), 1500);
      }
    } catch {
      setCopyState('error');
      const win = windowOrMissing();
      if (win !== undefined) {
        win.setTimeout(() => setCopyState('idle'), 2000);
      }
    }
  }, [content]);

  const copyLabel =
    copyState === 'copied'
      ? localizedContent.copied
      : copyState === 'error'
        ? localizedContent.copyFailed
        : localizedContent.copy;

  return (
    <Surface aria-label={title}>
      <AddressRow>
        <CardTitle>{title}</CardTitle>
        <StepActions style={{paddingLeft: 0, margin: 0}}>
          <Button type="button" variant="ghost" onClick={handleCopy} disabled={!hasContent}>
            {copyState === 'copied' ? <Check size={18} /> : <Copy size={18} />}
            {copyLabel}
          </Button>
          {download !== undefined ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                downloadTextFile({
                  filename: download.filename,
                  mimeType: download.mimeType,
                  content,
                })
              }
              disabled={!hasContent}>
              <Download size={18} />
              {localizedContent.download}
            </Button>
          ) : null}
        </StepActions>
      </AddressRow>
      {description !== undefined ? <SmallText>{description}</SmallText> : null}
      <CodeBlock>
        {hasContent ? content : localizedContent.pastePlaceholder}
      </CodeBlock>
    </Surface>
  );
};

function EmailForwardingSetupInner(): React.JSX.Element {
  const {locale} = useI18n();
  const localizedContent = emailForwardingContent[locale];
  const rawProvider = useQueryParam('provider');
  const provider = providerFromQueryBecauseGmailDefault(rawProvider);
  const [forwardingCopyState, setForwardingCopyState] =
    useState<CopyState>('idle');
  const [hasOpenedGmailForwardingSettings, setHasOpenedGmailForwardingSettings] =
    useState(false);
  const [verificationCode, setVerificationCode] = useState<
    string | undefined
  >(emptyCapturedCodeBecauseNone);
  const apiClient = useApiClient();

  const isGmail = provider === 'gmail';
  const rawForwardTo = useQueryParam('forwardTo');
  const queryForwardingAddress =
    forwardingAddressFromQueryBecauseDefault(rawForwardTo);
  const [forwardingAddress, setForwardingAddress] = useState(
    queryForwardingAddress,
  );

  const outlookComRulesHelp =
    'https://support.microsoft.com/office/use-inbox-rules-in-outlook-com-0b1652b0-856e-4fbd-bfa9-01936d9f5d14';
  const outlookWebRulesHelp =
    'https://support.microsoft.com/office/manage-email-messages-by-using-rules-in-outlook-on-the-web-71eb0120-6040-4d5f-8f1f-5946d6b07536';
  const outlookForwardingHelp =
    'https://support.microsoft.com/office/turn-on-automatic-forwarding-in-outlook-1b8b0f40-5b8b-4a2f-87b5-8c7b1c1b6f6b';

  const pastEmailsAnchorId = 'past-emails';
  const forwardToAnchorId = 'forward-to-address';

  const canGenerate = isPackForwardingAddress(forwardingAddress);
  const isFilterSetupDone = false;
  const isGmailAddressAdded =
    Boolean(verificationCode) || isFilterSetupDone;
  const filtersUnlocked = isGmailAddressAdded;

  const gmailChecklistUrl = useMemo(() => {
    const params = new URLSearchParams({provider: 'gmail'});
    if (rawForwardTo) {
      params.set('forwardTo', rawForwardTo);
    }
    return `/setup/email-forwarding?${params.toString()}`;
  }, [rawForwardTo]);

  const outlookChecklistUrl = useMemo(() => {
    const params = new URLSearchParams({provider: 'outlook'});
    if (rawForwardTo) {
      params.set('forwardTo', rawForwardTo);
    }
    return `/setup/email-forwarding?${params.toString()}`;
  }, [rawForwardTo]);

  const {domainCount: gmailFiltersDomainCount} = useMemo(() => {
    return buildGmailFiltersXml({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      label: 'Pack/TravelProviderDomains',
      mode: 'single',
    });
  }, []);

  const outlookRulesScript = useMemo(() => {
    return buildExchangeOnlineInboxRulesScript({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      forwardTo: forwardingAddress.trim(),
      mailboxPlaceholder: '<YOUR_MAILBOX_UPN_OR_EMAIL>',
      action: 'redirect',
    });
  }, [forwardingAddress]);

  const loadData = useCallback(async () => {
    try {
      const payload = await apiClient.request<VerificationCodePayload>({
        path: VERIFICATION_CODE_PATH,
        method: 'GET',
      });
      setVerificationCode(capturedCodeBecausePayload(payload));
      setForwardingAddress(
        forwardToFromPayloadBecauseQueryDefault(payload, queryForwardingAddress),
      );
    } catch {
      setVerificationCode(emptyCapturedCodeBecauseNone());
    }
  }, [apiClient, queryForwardingAddress]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;
  const shouldPollRef = useRef(false);
  shouldPollRef.current = hasOpenedGmailForwardingSettings;

  useMountEffect(() => {
    void loadDataRef.current();
    const doc = documentOrMissing();
    const onVisible = () => {
      if (doc === undefined) {
        return;
      }
      if (doc.visibilityState === 'visible') {
        void loadDataRef.current();
      }
    };
    if (doc !== undefined) {
      doc.addEventListener('visibilitychange', onVisible);
    }
    const win = windowOrMissing();
    const intervalId =
      win === undefined
        ? undefined
        : win.setInterval(() => {
            if (shouldPollRef.current) {
              void loadDataRef.current();
            }
          }, POLL_MS);
    return () => {
      if (doc !== undefined) {
        doc.removeEventListener('visibilitychange', onVisible);
      }
      if (win !== undefined && intervalId !== undefined) {
        win.clearInterval(intervalId);
      }
    };
  });

  const handleCopyForwardingAddress = useCallback(async () => {
    try {
      await copyTextToClipboard(forwardingAddress);
      setForwardingCopyState('copied');
      const win = windowOrMissing();
      if (win !== undefined) {
        win.setTimeout(() => setForwardingCopyState('idle'), 1500);
      }
    } catch {
      setForwardingCopyState('error');
      const win = windowOrMissing();
      if (win !== undefined) {
        win.setTimeout(() => setForwardingCopyState('idle'), 2000);
      }
    }
  }, [forwardingAddress]);

  const forwardingCopyLabel =
    forwardingCopyState === 'copied'
      ? localizedContent.copied
      : forwardingCopyState === 'error'
        ? localizedContent.copyFailed
        : localizedContent.copy;

  const handleOpenGmailForwardingSettings = useCallback(() => {
    setHasOpenedGmailForwardingSettings(true);
    openExternalUrl(GMAIL_FORWARDING_URL);
  }, []);

  const handleDownloadGmailFiltersXml = useCallback(() => {
    if (!canGenerate || !filtersUnlocked) {
      return;
    }

    const {xml} = buildGmailFiltersXml({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      label: 'Pack/TravelProviderDomains',
      forwardTo: forwardingAddress.trim(),
      mode: 'single',
    });

    downloadTextFile({
      filename: 'pack-gmail-filters.xml',
      mimeType: 'application/xml',
      content: xml,
    });
  }, [canGenerate, filtersUnlocked, forwardingAddress]);

  const handleOpenGmailFilters = useCallback(() => {
    if (!filtersUnlocked) {
      return;
    }
    openExternalUrl(GMAIL_FILTERS_URL);
  }, [filtersUnlocked]);

  const addressStepState: StepState = isGmailAddressAdded ? 'done' : 'active';
  const codeStepState: StepState = isFilterSetupDone
    ? 'done'
    : isGmailAddressAdded
      ? 'active'
      : 'upcoming';
  const filtersStepState: StepState = isFilterSetupDone
    ? 'done'
    : isGmailAddressAdded
      ? 'active'
      : 'upcoming';

  return (
    <Page>
      <PageSeo
        title={`${localizedContent.title} | Pack`}
        description={localizedContent.seoDescription}
        path="/setup/email-forwarding"
        robots="noindex, follow"
      />
      <PageHeader title={localizedContent.title}>
        <Mail size={16} aria-hidden="true" />
      </PageHeader>
      <Lead>
        {localizedContent.leadPrefix}
        <strong>{localizedContent.leadBold}</strong>
        {localizedContent.leadSuffix}
        {isGmail ? localizedContent.gmail : localizedContent.outlook}.
      </Lead>

      <Surface>
        <CardTitle>{localizedContent.desktopTitle}</CardTitle>
        <SmallText>{localizedContent.desktopBody1}</SmallText>
        <SmallText>{localizedContent.desktopBody2}</SmallText>
      </Surface>

      <TabsRow role="tablist" aria-label={localizedContent.emailProviderAria}>
        <TabLink
          role="tab"
          aria-selected={provider === 'gmail'}
          $active={provider === 'gmail'}
          href={gmailChecklistUrl}>
          {localizedContent.gmail}
        </TabLink>
        <TabLink
          role="tab"
          aria-selected={provider === 'outlook'}
          $active={provider === 'outlook'}
          href={outlookChecklistUrl}>
          {localizedContent.outlook}
        </TabLink>
      </TabsRow>

      <WizardColumn>
        <Stack>
          <Surface>
            <AddressRow>
              <div>
                <MicroLabel>{localizedContent.forwardingAddressLabel}</MicroLabel>
                <div id={forwardToAnchorId}>
                  <AddressValue>{forwardingAddress}</AddressValue>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCopyForwardingAddress}
                disabled={forwardingAddress.trim().length === 0}>
                {forwardingCopyState === 'copied' ? (
                  <Check size={18} />
                ) : (
                  <Copy size={18} />
                )}
                {forwardingCopyLabel}
              </Button>
            </AddressRow>
          </Surface>

          {verificationCode !== undefined ? (
            <Surface data-testid="gmail-verification-code" aria-label="Gmail verification code">
              <CardTitle>{localizedContent.verificationCodeTitle}</CardTitle>
              <SmallText>{localizedContent.verificationCodeHint}</SmallText>
              <CodeValue>{verificationCode}</CodeValue>
            </Surface>
          ) : null}
        </Stack>

        <Surface>
          {isGmail ? (
            <>
              <Step
                index={1}
                testId="gmail-step-address"
                state={addressStepState}
                title={localizedContent.gmailStep1Title}
                description={`Add ${forwardingAddress}${localizedContent.gmailStep1DescriptionSuffix}`}>
                <Button
                  type="button"
                  variant={isGmailAddressAdded ? 'ghost' : 'primary'}
                  onClick={handleOpenGmailForwardingSettings}>
                  <ExternalLink size={16} aria-hidden="true" />
                  {localizedContent.openGmailForwarding}
                </Button>
              </Step>

              <Step
                index={2}
                testId="gmail-step-confirm"
                state={codeStepState}
                title={localizedContent.gmailStep2Title}
                description={localizedContent.gmailStep2Description}
              />

              <Step
                index={3}
                testId="gmail-step-filters"
                state={filtersStepState}
                title={localizedContent.gmailStep3Title}
                description={`${localizedContent.gmailStep3DescriptionPrefix}${gmailFiltersDomainCount}${localizedContent.gmailStep3DescriptionSuffix}`}>
                <Button
                  type="button"
                  variant={filtersUnlocked ? 'primary' : 'ghost'}
                  onClick={handleDownloadGmailFiltersXml}
                  disabled={!filtersUnlocked || !canGenerate}>
                  <Download size={16} aria-hidden="true" />
                  {localizedContent.downloadFiltersXml}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleOpenGmailFilters}
                  disabled={!filtersUnlocked}>
                  <ExternalLink size={16} aria-hidden="true" />
                  {localizedContent.openGmailFilters}
                </Button>
              </Step>

              <Screenshot
                src={gmailFilterImportScreenshot}
                alt="Gmail import filters location in Settings (Filters and Blocked Addresses)"
                loading="lazy"
              />
              <SmallText>
                {localizedContent.gmailStep3NotePrefix}
                <strong>{forwardingAddress.trim()}</strong>.
              </SmallText>
            </>
          ) : (
            <>
              <Step
                index={1}
                state="active"
                title={localizedContent.outlookStep2Title}
                description={localizedContent.outlookStep2Body}>
                <InlineLink href={outlookComRulesHelp} target="_blank" rel="noreferrer">
                  {localizedContent.outlookHelpConsumer}
                </InlineLink>
                <InlineLink href={outlookWebRulesHelp} target="_blank" rel="noreferrer">
                  {localizedContent.outlookHelpWeb}
                </InlineLink>
                <InlineLink href={outlookForwardingHelp} target="_blank" rel="noreferrer">
                  {localizedContent.outlookHelpForwarding}
                </InlineLink>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => openExternalUrl(OUTLOOK_RULES_CONSUMER_URL)}>
                  <ExternalLink size={16} />
                  {localizedContent.openOutlookConsumer}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => openExternalUrl(OUTLOOK_RULES_M365_URL)}>
                  <ExternalLink size={16} />
                  {localizedContent.openOutlookM365}
                </Button>
              </Step>

              <Step
                index={2}
                state="upcoming"
                title={localizedContent.outlookStep3Title}
                description={localizedContent.outlookStep3Body}
              />
            </>
          )}
        </Surface>
      </WizardColumn>

      {isGmail ? null : (
        <CopyableArtifact
          title={localizedContent.powershellTitle}
          description={localizedContent.powershellDescription}
          content={outlookRulesScript}
          download={{filename: 'pack-m365-inbox-rules.ps1', mimeType: 'text/plain'}}
        />
      )}

      {isGmail ? null : (
        <Step
          index={3}
          state="upcoming"
          title={localizedContent.outlookStep4Title}
          description={localizedContent.outlookStep4Body}
        />
      )}

      <Surface aria-label={localizedContent.olderEmailsAria} id={pastEmailsAnchorId}>
        <CardTitle>{localizedContent.olderEmailsTitle}</CardTitle>
        <SmallText>{localizedContent.olderEmailsBody}</SmallText>
        <ul style={{marginTop: 'var(--space-2)', marginBottom: 0, paddingLeft: '1.25rem', lineHeight: 1.7}}>
          {isGmail ? (
            <>
              <li>
                {localizedContent.gmailOlderItem1Prefix}
                <InlineLink href={GMAIL_FILTERS_URL} target="_blank" rel="noreferrer">
                  {localizedContent.openGmailFilters}
                </InlineLink>{' '}
                {localizedContent.gmailOlderItem1Suffix}
              </li>
              <li>{localizedContent.gmailOlderItem2}</li>
              <li>{localizedContent.gmailOlderItem3}</li>
            </>
          ) : (
            localizedContent.olderEmailsItems.map((item) => (
              <li key={item}>{item}</li>
            ))
          )}
          <li>
            Forward them to <strong>{forwardingAddress.trim()}</strong>.
          </li>
        </ul>
      </Surface>

      <Surface aria-label={localizedContent.troubleshootingAria}>
        <CardTitle>{localizedContent.troubleshootingTitle}</CardTitle>
        <ul style={{marginTop: 'var(--space-1)', marginBottom: 0, paddingLeft: '1.25rem', lineHeight: 1.7}}>
          <li>
            <strong>{localizedContent.troubleshootingItems[0].strong}</strong>
            {localizedContent.troubleshootingItems[0].text}
          </li>
          <li>
            <strong>{localizedContent.troubleshootingItems[1].strong}</strong>
            {localizedContent.troubleshootingItems[1].textPrefix}
            <InlineLink href={GMAIL_FORWARDING_URL} target="_blank" rel="noreferrer">
              {localizedContent.troubleshootingItems[1].linkLabel}
            </InlineLink>
            {localizedContent.troubleshootingItems[1].textSuffix}
          </li>
          <li>
            <strong>{localizedContent.troubleshootingItems[2].strong}</strong>
            {localizedContent.troubleshootingItems[2].textPrefix}
            <strong>trypackai.com</strong>.
          </li>
        </ul>
      </Surface>
    </Page>
  );
}

export default function EmailForwardingSetup(): React.JSX.Element {
  return (
    <AuthProvider>
      <EmailForwardingSetupInner />
    </AuthProvider>
  );
}
