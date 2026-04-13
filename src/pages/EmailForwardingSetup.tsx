import React, { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { copyTextToClipboard } from "../utils/clipboard";
import { PRIVACY_FORWARDING_TRAVEL_DOMAINS } from "../data/privacyForwardingTravelDomains";
import {
  buildExchangeOnlineInboxRulesScript,
  buildGmailFiltersXml,
} from "../utils/privacyForwardingUtils";
import gmailFilterImportScreenshot from "../assets/email-forwarding/gmail-filter-import.png";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo from "@/seo/pageSeo";

type Provider = "gmail" | "outlook";

function useQueryParam(name: string): string | null {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search).get(name), [location.search, name]);
}

const Page = styled.div`
  padding: ${(props) => props.theme.spacing[4]} 0 ${(props) => props.theme.spacing[5]};
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing[4]};
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 0;
`;

const Lead = styled.p`
  color: ${(props) => props.theme.colors.text.secondary};
  line-height: 1.7;
  margin: 0;
  text-align: center;
`;

const Card = styled.section`
  border: 1px solid ${(props) => props.theme.colors.border.medium};
  border-radius: ${(props) => props.theme.design.borderRadius.xl};
  background: ${(props) => props.theme.colors.background.card};
  padding: ${(props) => props.theme.spacing[4]};
`;

const CardTitle = styled.h2`
  font-size: ${(props) => props.theme.typography.fontSizes.lg};
  margin: 0 0 ${(props) => props.theme.spacing[2]} 0;
`;

const SmallText = styled.p`
  margin: 0;
  color: ${(props) => props.theme.colors.text.secondary};
  line-height: 1.7;
`;

const TabsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: ${(props) => props.theme.spacing[2]};
  flex-wrap: wrap;
`;

const TabLink = styled.a<{ $active: boolean }>`
  padding: 0.65rem 0.95rem;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$active ? "rgba(240, 198, 45, 0.65)" : props.theme.colors.border.medium};
  background: ${(props) =>
    props.$active ? "rgba(240, 198, 45, 0.15)" : "rgba(255,255,255,0.04)"};
  color: ${(props) => props.theme.colors.text.primary};
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  &:hover {
    transform: translateY(-1px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StepCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing[3]};
`;

const StepHeaderRow = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing[2]};
  align-items: baseline;
`;

const StepNumber = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.09);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
`;

const StepTitle = styled.div`
  font-weight: 800;
  font-size: 1rem;
`;

const StepBody = styled.div`
  color: ${(props) => props.theme.colors.text.primary};
  opacity: 0.92;
  line-height: 1.7;
`;

const Step: React.FC<{
  readonly index: number;
  readonly title: string;
  readonly illustration?: React.ReactNode;
  readonly children: React.ReactNode;
}> = ({ index, title, illustration, children }) => (
  <StepCard>
    <StepHeaderRow>
      <StepNumber>{index}</StepNumber>
      <StepTitle>{title}</StepTitle>
    </StepHeaderRow>
    {illustration ? <div>{illustration}</div> : null}
    <StepBody>{children}</StepBody>
  </StepCard>
);

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spacing[2]};
  margin-top: ${(props) => props.theme.spacing[2]};
  align-items: center;
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: ${(props) => props.theme.design.borderRadius.large};
  background: rgba(231, 35, 64, 0.16);
  border: 1px solid rgba(231, 35, 64, 0.55);
  color: ${(props) => props.theme.colors.text.white};
  text-decoration: none;
  font-weight: 800;
  width: fit-content;
  transition: transform 120ms ease, background 120ms ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(231, 35, 64, 0.22);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const InlineLink = styled.a`
  color: ${(props) => props.theme.colors.primary.main};
  font-weight: 800;
  text-decoration: none;
`;

const Screenshot = styled.img`
  width: 100%;
  height: auto;
  border-radius: ${(props) => props.theme.design.borderRadius.xl};
  border: 1px solid ${(props) => props.theme.colors.border.medium};
  background: rgba(0, 0, 0, 0.25);
`;

const ActionButton = styled.button<{ $tone?: "neutral" | "accent" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  border-radius: ${(props) => props.theme.design.borderRadius.medium};
  border: 1px solid
    ${(props) =>
      props.$tone === "accent" ? "rgba(240, 198, 45, 0.55)" : props.theme.colors.border.medium};
  background: ${(props) =>
    props.$tone === "accent" ? "rgba(240, 198, 45, 0.14)" : "rgba(255,255,255,0.05)"};
  color: ${(props) => props.theme.colors.text.primary};
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: ${(props) => props.theme.spacing[3]};
  border-radius: ${(props) => props.theme.design.borderRadius.large};
  border: 1px solid ${(props) => props.theme.colors.border.medium};
  background: rgba(0, 0, 0, 0.35);
  overflow: auto;
  max-height: 320px;
  font-family: ${(props) => props.theme.typography.fontFamily.code};
  font-size: 0.875rem;
  line-height: 1.55;
`;

type CopyState = "idle" | "copied" | "error";

function isPackForwardingAddress(candidate: string): boolean {
  const trimmed = candidate.trim().toLowerCase();
  return Boolean(trimmed) && /^[^\s@]+@trypackai\.com$/.test(trimmed);
}

const DEFAULT_FORWARD_TO = "trips@trypackai.com";

const emailForwardingContent = {
  en: {
    copied: "Copied",
    copyFailed: "Copy failed",
    copy: "Copy",
    download: "Download",
    pastePlaceholder: "Paste your forwarding address above, then generate.",
    title: "Email forwarding setup",
    leadPrefix: "Forward ",
    leadBold: "travel confirmations only",
    leadSuffix:
      " to Pack (no full mailbox access). This guide walks you through the exact clicks in ",
    desktopTitle: "Use a desktop browser",
    desktopBody1:
      "This page is the manual (desktop) checklist. Forwarding settings and filter import are easiest on desktop. If you’re currently on your phone, open Pack and tap Send desktop guide.",
    desktopBody2:
      "If you want Pack to create rules automatically, use Automatic (mobile) inside the app.",
    emailProviderAria: "Email provider",
    gmail: "Gmail",
    outlook: "Outlook",
    step1Title: "Copy your Pack forwarding address",
    step1Body: "You’ll paste this into your email settings in Step 2:",
    step1Note:
      "Keep Pack open. You’ll come back to it in Step 3 to verify the email address you’re forwarding from (and to retrieve a Gmail verification code if needed).",
    gmailStep2Title: "Approve forwarding in Gmail (one-time)",
    gmailStep2Body1:
      "In Gmail forwarding settings, add the Pack forwarding address from Step 1. Gmail will send a one-time verification email or code, and you’ll approve it. If Gmail shows a “confirmation code” box, leave that tab open for Step 3.",
    openGmailForwarding: "Open Gmail forwarding settings",
    gmailStep2Body2:
      "After you verify the address, make sure forwarding is enabled (Forward a copy of incoming mail → your Pack address).",
    gmailStep2Body3Prefix:
      "If you don’t see an “Add a forwarding address” option, you’re likely on a Google Workspace (work/school) account where an admin has disabled external auto-forwarding. In that case you’ll need IT to allow forwarding to ",
    gmailStep3Title: "Go back to Pack",
    gmailStep3Intro: "In Pack (Settings → Connected Services → Email forwarding):",
    gmailStep3Items: [
      "Verify the email address you’re forwarding from.",
      "If Gmail requires a confirmation code, tap Check now, then paste the code back into Gmail to approve the forwarding address.",
    ],
    gmailStep4Title: "Download the Gmail filters file",
    gmailStep4BodyPrefix: "Download the Pack travel filter file (",
    gmailStep4BodySuffix: " domains).",
    downloadFiltersXml: "Download filters XML",
    gmailStep4Note: "Next you’ll import this file in Gmail.",
    gmailStep5Title: "Import into Gmail",
    gmailStep5Body:
      "In Gmail: Settings → Filters and Blocked Addresses → Import filters → select pack-gmail-filters.xml.",
    openGmailFilters: "Open Gmail filters",
    gmailStep5NotePrefix: "After import, click Edit on the Pack filter and confirm it forwards to ",
    outlookStep2Title: "Create a rule (Outlook)",
    outlookStep2Body:
      "Create a rule that forwards travel emails to the Pack forwarding address you copied from the app. Some work/school accounts may block external auto-forwarding.",
    outlookHelpConsumer: "Outlook.com rules",
    outlookHelpWeb: "Outlook on the web rules",
    outlookHelpForwarding: "Automatic forwarding",
    openOutlookConsumer: "Open Outlook.com rules",
    openOutlookM365: "Open Microsoft 365 rules",
    outlookStep3Title: "Optional: create rules in bulk (work/school)",
    outlookStep3Body:
      "If your org allows Exchange Online PowerShell, you can generate bulk travel-domain rules quickly:",
    powershellTitle: "Microsoft 365 / Exchange Online inbox rules (PowerShell)",
    powershellDescription:
      "Work/school accounts only. Requires Exchange Online PowerShell. Fill in the mailbox placeholder, then run.",
    outlookStep4Title: "Confirm it’s working",
    outlookStep4Body:
      "Forwarding applies to new incoming emails. After setup, new travel confirmations should start appearing in Pack shortly.",
    olderEmailsAria: "Older emails",
    olderEmailsTitle: "Send older travel emails",
    olderEmailsBody:
      "Filters generally apply to new incoming mail. To ingest older confirmations, forward your past travel emails to your Pack forwarding address.",
    olderEmailsItems: [
      "Search for your travel confirmations (flights, hotels, rentals).",
      "Select the emails you want Pack to ingest.",
    ],
    gmailStep6Title: "Send older travel emails",
    gmailStep6Item1Prefix: "Go to ",
    gmailStep6Item1Suffix:
      " and click Edit on the Pack filter (look for the label Pack/TravelProviderDomains).",
    gmailStep6Item2: "Search for your travel confirmations (flights, hotels, rentals).",
    gmailStep6Item3: "Select all.",
    troubleshootingAria: "Troubleshooting (quick)",
    troubleshootingTitle: "Troubleshooting (quick)",
    troubleshootingItems: [
      {
        strong: "I don’t have the Gmail verification code.",
        text: " Complete Step 2 first, then go back to Pack (Step 3) and tap “Check now”.",
      },
      {
        strong: "I haven’t enabled Gmail forwarding yet.",
        textPrefix: " Use ",
        linkLabel: "Gmail forwarding settings",
        textSuffix: " and follow Step 2.",
      },
      {
        strong: "Work/school email won’t forward.",
        textPrefix:
          " Many companies block external auto-forwarding. Ask IT to allow forwarding to ",
      },
    ],
  },
  es: {
    copied: "Copiado",
    copyFailed: "Error al copiar",
    copy: "Copiar",
    download: "Descargar",
    pastePlaceholder: "Pega arriba tu dirección de reenvío y luego genera.",
    title: "Configuración de reenvío de correo",
    leadPrefix: "Reenvía ",
    leadBold: "solo confirmaciones de viaje",
    leadSuffix:
      " a Pack (sin acceso completo al buzón). Esta guía te muestra los clics exactos en ",
    desktopTitle: "Usa un navegador de escritorio",
    desktopBody1:
      "Esta página es la guía manual para escritorio. La configuración del reenvío y la importación de filtros es más fácil en desktop. Si estás en el teléfono, abre Pack y toca Enviar guía de escritorio.",
    desktopBody2:
      "Si quieres que Pack cree reglas automáticamente, usa Automático (móvil) dentro de la app.",
    emailProviderAria: "Proveedor de correo",
    gmail: "Gmail",
    outlook: "Outlook",
    step1Title: "Copia tu dirección de reenvío de Pack",
    step1Body: "La pegarás en la configuración del correo en el Paso 2:",
    step1Note:
      "Mantén Pack abierto. Volverás en el Paso 3 para verificar la dirección desde la que reenvías el correo y, si hace falta, recuperar un código de verificación de Gmail.",
    gmailStep2Title: "Aprueba el reenvío en Gmail (una sola vez)",
    gmailStep2Body1:
      "En la configuración de reenvío de Gmail, agrega la dirección de Pack del Paso 1. Gmail enviará un correo o código de verificación único y lo aprobarás. Si Gmail muestra un cuadro de “código de confirmación”, deja esa pestaña abierta para el Paso 3.",
    openGmailForwarding: "Abrir configuración de reenvío de Gmail",
    gmailStep2Body2:
      "Después de verificar la dirección, asegúrate de que el reenvío esté activado (Forward a copy of incoming mail → tu dirección de Pack).",
    gmailStep2Body3Prefix:
      "Si no ves la opción “Add a forwarding address”, probablemente estás en una cuenta de Google Workspace (trabajo/escuela) donde un administrador desactivó el auto-forwarding externo. En ese caso, necesitarás que TI permita reenviar a ",
    gmailStep3Title: "Vuelve a Pack",
    gmailStep3Intro: "En Pack (Settings → Connected Services → Email forwarding):",
    gmailStep3Items: [
      "Verifica la dirección de correo desde la que reenviarás.",
      "Si Gmail pide un código de confirmación, toca Check now y luego pega el código de nuevo en Gmail para aprobar la dirección.",
    ],
    gmailStep4Title: "Descarga el archivo de filtros de Gmail",
    gmailStep4BodyPrefix: "Descarga el archivo de filtro de viajes de Pack (",
    gmailStep4BodySuffix: " dominios).",
    downloadFiltersXml: "Descargar XML de filtros",
    gmailStep4Note: "Luego importarás este archivo en Gmail.",
    gmailStep5Title: "Importa en Gmail",
    gmailStep5Body:
      "En Gmail: Settings → Filters and Blocked Addresses → Import filters → selecciona pack-gmail-filters.xml.",
    openGmailFilters: "Abrir filtros de Gmail",
    gmailStep5NotePrefix: "Después de importar, haz clic en Edit en el filtro de Pack y confirma que reenvía a ",
    outlookStep2Title: "Crea una regla (Outlook)",
    outlookStep2Body:
      "Crea una regla que reenvíe los correos de viaje a la dirección de Pack que copiaste desde la app. Algunas cuentas de trabajo o escuela pueden bloquear el auto-forwarding externo.",
    outlookHelpConsumer: "Reglas de Outlook.com",
    outlookHelpWeb: "Reglas de Outlook web",
    outlookHelpForwarding: "Reenvío automático",
    openOutlookConsumer: "Abrir reglas de Outlook.com",
    openOutlookM365: "Abrir reglas de Microsoft 365",
    outlookStep3Title: "Opcional: crear reglas en lote (trabajo/escuela)",
    outlookStep3Body:
      "Si tu organización permite Exchange Online PowerShell, puedes generar reglas de dominios de viaje en lote rápidamente:",
    powershellTitle: "Reglas de bandeja para Microsoft 365 / Exchange Online (PowerShell)",
    powershellDescription:
      "Solo para cuentas de trabajo o escuela. Requiere Exchange Online PowerShell. Completa el placeholder del buzón y luego ejecútalo.",
    outlookStep4Title: "Confirma que funciona",
    outlookStep4Body:
      "El reenvío se aplica a correos nuevos. Después de la configuración, las nuevas confirmaciones de viaje deberían empezar a aparecer en Pack pronto.",
    olderEmailsAria: "Correos antiguos",
    olderEmailsTitle: "Enviar correos antiguos de viaje",
    olderEmailsBody:
      "Los filtros generalmente se aplican a correos nuevos. Para ingerir confirmaciones antiguas, reenvía tus correos pasados a tu dirección de reenvío de Pack.",
    olderEmailsItems: [
      "Busca tus confirmaciones de viaje (vuelos, hoteles, rentas).",
      "Selecciona los correos que quieres que Pack ingiera.",
    ],
    gmailStep6Title: "Enviar correos antiguos de viaje",
    gmailStep6Item1Prefix: "Ve a ",
    gmailStep6Item1Suffix:
      " y haz clic en Edit en el filtro de Pack (busca la etiqueta Pack/TravelProviderDomains).",
    gmailStep6Item2: "Busca tus confirmaciones de viaje (vuelos, hoteles, rentas).",
    gmailStep6Item3: "Selecciona todo.",
    troubleshootingAria: "Solución de problemas (rápida)",
    troubleshootingTitle: "Solución de problemas (rápida)",
    troubleshootingItems: [
      {
        strong: "No tengo el código de verificación de Gmail.",
        text: " Completa primero el Paso 2 y luego vuelve a Pack (Paso 3) y toca “Check now”.",
      },
      {
        strong: "Todavía no activé el reenvío en Gmail.",
        textPrefix: " Usa ",
        linkLabel: "la configuración de reenvío de Gmail",
        textSuffix: " y sigue el Paso 2.",
      },
      {
        strong: "El correo de trabajo o escuela no reenvía.",
        textPrefix:
          " Muchas empresas bloquean el auto-forwarding externo. Pide a TI que permita reenviar a ",
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
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const CopyableArtifact: React.FC<{
  readonly title: string;
  readonly description?: string;
  readonly content: string;
  readonly download?: { filename: string; mimeType: string };
}> = ({ title, description, content, download }) => {
  const { locale } = useI18n();
  const localizedContent = emailForwardingContent[locale];
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    try {
      await copyTextToClipboard(content);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [content]);

  const copyLabel =
    copyState === "copied"
      ? localizedContent.copied
      : copyState === "error"
        ? localizedContent.copyFailed
        : localizedContent.copy;

  return (
    <Card aria-label={title}>
      <CardTitle style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <span>{title}</span>
        <ButtonRow style={{ marginTop: 0 }}>
          <ActionButton type="button" onClick={handleCopy} disabled={!content}>
            {copyState === "copied" ? <Check size={18} /> : <Copy size={18} />}
            {copyLabel}
          </ActionButton>
          {download ? (
            <ActionButton
              type="button"
              onClick={() =>
                downloadTextFile({
                  filename: download.filename,
                  mimeType: download.mimeType,
                  content,
                })
              }
              disabled={!content}
            >
              <Download size={18} />
              {localizedContent.download}
            </ActionButton>
          ) : null}
        </ButtonRow>
      </CardTitle>
      {description ? <SmallText style={{ marginBottom: "0.75rem" }}>{description}</SmallText> : null}
      <CodeBlock>{content || localizedContent.pastePlaceholder}</CodeBlock>
    </Card>
  );
};

export default function EmailForwardingSetup(): React.JSX.Element {
  const { locale } = useI18n();
  const localizedContent = emailForwardingContent[locale];
  const rawProvider = useQueryParam("provider");
  const provider: Provider = rawProvider === "outlook" ? "outlook" : "gmail";
  const [forwardingCopyState, setForwardingCopyState] = useState<CopyState>("idle");

  const isGmail = provider === "gmail";
  const rawForwardTo = useQueryParam("forwardTo");
  const forwardingAddress = useMemo(() => {
    if (rawForwardTo && isPackForwardingAddress(rawForwardTo)) {
      return rawForwardTo;
    }
    return DEFAULT_FORWARD_TO;
  }, [rawForwardTo]);

  const gmailForwardingUrl = "https://mail.google.com/mail/u/0/#settings/fwdandpop";
  const gmailFiltersUrl = "https://mail.google.com/mail/u/0/#settings/filters";
  const outlookRulesConsumerUrl = "https://outlook.live.com/mail/0/options/mail/rules";
  const outlookRulesM365Url = "https://outlook.office.com/mail/options/mail/rules";

  const outlookComRulesHelp =
    "https://support.microsoft.com/office/use-inbox-rules-in-outlook-com-0b1652b0-856e-4fbd-bfa9-01936d9f5d14";
  const outlookWebRulesHelp =
    "https://support.microsoft.com/office/manage-email-messages-by-using-rules-in-outlook-on-the-web-71eb0120-6040-4d5f-8f1f-5946d6b07536";
  const outlookForwardingHelp =
    "https://support.microsoft.com/office/turn-on-automatic-forwarding-in-outlook-1b8b0f40-5b8b-4a2f-87b5-8c7b1c1b6f6b";

  const pastEmailsAnchorId = "past-emails";
  const forwardToAnchorId = "forward-to-address";

  const canGenerate = isPackForwardingAddress(forwardingAddress);

  const gmailChecklistUrl = useMemo(() => {
    const params = new URLSearchParams({ provider: "gmail" });
    if (rawForwardTo) {
      params.set("forwardTo", rawForwardTo);
    }
    return `/setup/email-forwarding?${params.toString()}`;
  }, [rawForwardTo]);

  const outlookChecklistUrl = useMemo(() => {
    const params = new URLSearchParams({ provider: "outlook" });
    if (rawForwardTo) {
      params.set("forwardTo", rawForwardTo);
    }
    return `/setup/email-forwarding?${params.toString()}`;
  }, [rawForwardTo]);

  const { domainCount: gmailFiltersDomainCount } = useMemo(() => {
    return buildGmailFiltersXml({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      label: "Pack/TravelProviderDomains",
      mode: "single",
    });
  }, []);

  const outlookRulesScript = useMemo(() => {
    return buildExchangeOnlineInboxRulesScript({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      forwardTo: forwardingAddress.trim(),
      mailboxPlaceholder: "<YOUR_MAILBOX_UPN_OR_EMAIL>",
      action: "redirect",
    });
  }, [forwardingAddress]);

  const handleCopyForwardingAddress = useCallback(async () => {
    try {
      await copyTextToClipboard(forwardingAddress);
      setForwardingCopyState("copied");
      window.setTimeout(() => setForwardingCopyState("idle"), 1500);
    } catch {
      setForwardingCopyState("error");
      window.setTimeout(() => setForwardingCopyState("idle"), 2000);
    }
  }, [forwardingAddress]);

  const forwardingCopyLabel =
    forwardingCopyState === "copied"
      ? localizedContent.copied
      : forwardingCopyState === "error"
        ? localizedContent.copyFailed
        : localizedContent.copy;

  const handleDownloadGmailFiltersXml = useCallback(() => {
    if (!canGenerate) {
      return;
    }

    const { xml } = buildGmailFiltersXml({
      domains: PRIVACY_FORWARDING_TRAVEL_DOMAINS,
      label: "Pack/TravelProviderDomains",
      forwardTo: forwardingAddress.trim(),
      mode: "single",
    });

    downloadTextFile({
      filename: "pack-gmail-filters.xml",
      mimeType: "application/xml",
      content: xml,
    });
  }, [canGenerate, forwardingAddress]);

  return (
    <Page>
      <PageSeo
        title={`${localizedContent.title} | Pack`}
        description={
          locale === "es"
            ? "Guía paso a paso para reenviar solo confirmaciones de viaje a Pack desde Gmail u Outlook."
            : "Step-by-step guide for forwarding travel confirmations only to Pack from Gmail or Outlook."
        }
        path="/setup/email-forwarding"
        robots="noindex, follow"
      />
      <Title>{localizedContent.title}</Title>
      <Lead>
        {localizedContent.leadPrefix}
        <strong>{localizedContent.leadBold}</strong>
        {localizedContent.leadSuffix}
        {isGmail ? localizedContent.gmail : localizedContent.outlook}.
      </Lead>

      <Card>
        <CardTitle>{localizedContent.desktopTitle}</CardTitle>
        <SmallText>
          {localizedContent.desktopBody1}
        </SmallText>
        <SmallText style={{ marginTop: "0.5rem" }}>
          {localizedContent.desktopBody2}
        </SmallText>
      </Card>

      <TabsRow role="tablist" aria-label={localizedContent.emailProviderAria}>
        <TabLink
          role="tab"
          aria-selected={provider === "gmail"}
          $active={provider === "gmail"}
          href={gmailChecklistUrl}
        >
          {localizedContent.gmail}
        </TabLink>
        <TabLink
          role="tab"
          aria-selected={provider === "outlook"}
          $active={provider === "outlook"}
          href={outlookChecklistUrl}
        >
          {localizedContent.outlook}
        </TabLink>
      </TabsRow>

      <Step index={1} title={localizedContent.step1Title}>
        <div id={forwardToAnchorId} />
        {localizedContent.step1Body}
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <code style={{ fontSize: "1rem", fontWeight: 900 }}>{forwardingAddress}</code>
          <ActionButton type="button" onClick={handleCopyForwardingAddress} disabled={!forwardingAddress.trim()}>
            {forwardingCopyState === "copied" ? <Check size={18} /> : <Copy size={18} />}
            {forwardingCopyLabel}
          </ActionButton>
        </div>
        <SmallText style={{ marginTop: "0.75rem" }}>
          {localizedContent.step1Note}
        </SmallText>
      </Step>

      {isGmail ? (
        <>
          <Step index={2} title={localizedContent.gmailStep2Title}>
            {localizedContent.gmailStep2Body1}
            <ButtonRow>
              <LinkButton href={gmailForwardingUrl} target="_blank" rel="noreferrer" aria-label="Open Gmail forwarding settings">
                <ExternalLink size={18} />
                {localizedContent.openGmailForwarding}
              </LinkButton>
            </ButtonRow>
            <SmallText style={{ marginTop: "0.5rem" }}>
              {localizedContent.gmailStep2Body2}
            </SmallText>
            <SmallText style={{ marginTop: "0.5rem" }}>
              {localizedContent.gmailStep2Body3Prefix}
              <strong>trypackai.com</strong>.
            </SmallText>
          </Step>

          <Step index={3} title={localizedContent.gmailStep3Title}>
            {localizedContent.gmailStep3Intro}
            <ul style={{ marginTop: "0.75rem", marginBottom: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
              {localizedContent.gmailStep3Items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Step>

          <Step index={4} title={localizedContent.gmailStep4Title}>
            {localizedContent.gmailStep4BodyPrefix}
            <strong>{gmailFiltersDomainCount}</strong>
            {localizedContent.gmailStep4BodySuffix}
            <ButtonRow>
              <ActionButton type="button" $tone="accent" onClick={handleDownloadGmailFiltersXml} disabled={!canGenerate}>
                <Download size={18} />
                {localizedContent.downloadFiltersXml}
              </ActionButton>
            </ButtonRow>
            <SmallText style={{ marginTop: "0.5rem" }}>
              {localizedContent.gmailStep4Note}
            </SmallText>
          </Step>

          <Step index={5} title={localizedContent.gmailStep5Title}>
            {localizedContent.gmailStep5Body}
            <ButtonRow>
              <LinkButton
                href={gmailFiltersUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open Gmail filters"
              >
                <ExternalLink size={18} />
                {localizedContent.openGmailFilters}
              </LinkButton>
            </ButtonRow>

            <div style={{ marginTop: "1rem" }}>
              <Screenshot
                src={gmailFilterImportScreenshot}
                alt="Gmail import filters location in Settings (Filters and Blocked Addresses)"
                loading="lazy"
              />
            </div>

            <SmallText style={{ marginTop: "0.75rem" }}>
              {localizedContent.gmailStep5NotePrefix}
              <strong>{forwardingAddress.trim() || "…"}</strong>.
            </SmallText>
          </Step>
        </>
      ) : (
        <>
          <Step index={2} title={localizedContent.outlookStep2Title}>
            {localizedContent.outlookStep2Body}
            <ButtonRow>
              <InlineLink href={outlookComRulesHelp} target="_blank" rel="noreferrer">
                {localizedContent.outlookHelpConsumer}
              </InlineLink>
              <InlineLink href={outlookWebRulesHelp} target="_blank" rel="noreferrer">
                {localizedContent.outlookHelpWeb}
              </InlineLink>
              <InlineLink href={outlookForwardingHelp} target="_blank" rel="noreferrer">
                {localizedContent.outlookHelpForwarding}
              </InlineLink>
            </ButtonRow>
            <ButtonRow>
              <LinkButton href={outlookRulesConsumerUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={18} />
                {localizedContent.openOutlookConsumer}
              </LinkButton>
              <LinkButton href={outlookRulesM365Url} target="_blank" rel="noreferrer">
                <ExternalLink size={18} />
                {localizedContent.openOutlookM365}
              </LinkButton>
            </ButtonRow>
          </Step>

          <Step index={3} title={localizedContent.outlookStep3Title}>
            {localizedContent.outlookStep3Body}
          </Step>

          <CopyableArtifact
            title={localizedContent.powershellTitle}
            description={localizedContent.powershellDescription}
            content={outlookRulesScript}
            download={{ filename: "pack-m365-inbox-rules.ps1", mimeType: "text/plain" }}
          />

          <Step index={4} title={localizedContent.outlookStep4Title}>
            {localizedContent.outlookStep4Body}
          </Step>

          <div id={pastEmailsAnchorId} />
          <Card aria-label={localizedContent.olderEmailsAria}>
            <CardTitle>{localizedContent.olderEmailsTitle}</CardTitle>
            <SmallText>
              {localizedContent.olderEmailsBody}
            </SmallText>
            <ul style={{ marginTop: "0.75rem", marginBottom: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
              {localizedContent.olderEmailsItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>
                Forward them to <strong>{forwardingAddress.trim() || DEFAULT_FORWARD_TO}</strong>.
              </li>
            </ul>
          </Card>
        </>
      )}

      {isGmail ? (
        <Step index={6} title={localizedContent.gmailStep6Title}>
          <div id={pastEmailsAnchorId} />
          <SmallText>
            {localizedContent.olderEmailsBody}
          </SmallText>
          <ul style={{ marginTop: "0.75rem", marginBottom: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
            <li>
              {localizedContent.gmailStep6Item1Prefix}
              <InlineLink href={gmailFiltersUrl} target="_blank" rel="noreferrer">
                {localizedContent.openGmailFilters}
              </InlineLink>{" "}
              {localizedContent.gmailStep6Item1Suffix}
            </li>
            <li>{localizedContent.gmailStep6Item2}</li>
            <li>{localizedContent.gmailStep6Item3}</li>
            <li>
              Forward them to <strong>{forwardingAddress.trim() || DEFAULT_FORWARD_TO}</strong>.
            </li>
          </ul>
        </Step>
      ) : null}

      <Card aria-label={localizedContent.troubleshootingAria}>
        <CardTitle>{localizedContent.troubleshootingTitle}</CardTitle>
        <ul style={{ marginTop: "0.25rem", marginBottom: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
          <li>
            <strong>{localizedContent.troubleshootingItems[0].strong}</strong>
            {localizedContent.troubleshootingItems[0].text}
          </li>
          <li>
            <strong>{localizedContent.troubleshootingItems[1].strong}</strong>
            {localizedContent.troubleshootingItems[1].textPrefix}
            <InlineLink href={gmailForwardingUrl} target="_blank" rel="noreferrer">
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
      </Card>
    </Page>
  );
}
