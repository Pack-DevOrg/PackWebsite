/**
 * Linked Trip Invite Landing Page
 *
 * Handles web visits to /trip/:linkedTripId invite URLs.
 * This page avoids falling back to the marketing home screen and gives
 * recipients a direct "Open in Pack" action.
 */

import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Download, ExternalLink, Sparkles } from "lucide-react";
import { appConfig } from "@/config/appConfig";
import { useI18n } from "@/i18n/I18nProvider";

const WEBSITE_URL = appConfig.publicSiteUrl;
const APPLE_APP_ID = import.meta.env.VITE_APPLE_APP_ID || "";
const APP_STORE_URL = APPLE_APP_ID
  ? `https://apps.apple.com/app/pack/id${APPLE_APP_ID}`
  : "https://apps.apple.com/search/app/pack";

const palette = {
  bg: "#0e0d0c",
  panel: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.12)",
  text: "#f5f5f5",
  textMuted: "#c2c2c2",
  accent: "#f0c62d",
  accentSecondary: "#e72340",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: `
      radial-gradient(120% 140% at 20% 20%, rgba(240, 198, 45, 0.06), transparent),
      radial-gradient(120% 140% at 80% 0%, rgba(231, 35, 64, 0.08), transparent),
      ${palette.bg}
    `,
    color: palette.text,
    position: "relative" as const,
    padding: "clamp(1.25rem, 4vw, 2rem)",
  },
  content: {
    position: "relative" as const,
    zIndex: 1,
    maxWidth: 780,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    gap: "clamp(1rem, 3vw, 1.5rem)",
  },
  card: {
    background: palette.panel,
    border: `1px solid ${palette.border}`,
    borderRadius: 18,
    padding: "clamp(1.25rem, 4vw, 1.75rem)",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
  },
  buttonBase: {
    border: "none",
    outline: "none",
    cursor: "pointer",
    borderRadius: 12,
    padding: "0.85rem 1rem",
    fontWeight: 700,
    fontSize: "1rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
  },
};

export const LinkedTripInviteLanding: React.FC = () => {
  const { locale } = useI18n();
  const { linkedTripId: linkedTripIdFromParams } =
    useParams<{ linkedTripId: string }>();
  const location = useLocation();
  const [actionFeedback, setActionFeedback] = useState("");
  const localizedContent =
    locale === "es"
      ? {
          feedback:
            "Si Pack está instalado, la app se abrirá para que puedas aceptar esta invitación de viaje.",
          invalidTitle: "Invitación de viaje inválida",
          invalidBody: "A este enlace le falta un identificador de viaje.",
          returnHome: "Volver a Pack",
          pageTitle: "Invitación de viaje compartido - Pack",
          metaDescription:
            "Abre esta invitación de viaje compartido en Pack para aceptarla o importarla.",
          shareTitle: "Invitación de viaje compartido",
          shareDescription: "Abre esta invitación de viaje compartido en Pack.",
          intro:
            "Abre esta invitación en Pack para aceptar el viaje vinculado o importarlo como tu propio borrador.",
          openInApp: "Abrir en Pack",
          downloadApp: "Descargar Pack",
          learnMore: "Más información sobre Pack",
          ogLocale: "es_ES",
        }
      : {
          feedback:
            "If Pack is installed, the app will open so you can accept this trip invite.",
          invalidTitle: "Invalid Trip Invite",
          invalidBody: "This invite link is missing a trip ID.",
          returnHome: "Return to Pack",
          pageTitle: "Shared Trip Invite - Pack",
          metaDescription:
            "Open this shared trip invite in Pack to accept or import it.",
          shareTitle: "Shared Trip Invite",
          shareDescription: "Open this shared trip invite in Pack.",
          intro:
            "Open this invite in Pack to accept the linked trip or import it as your own outline.",
          openInApp: "Open in Pack",
          downloadApp: "Download Pack",
          learnMore: "Learn more about Pack",
          ogLocale: "en_US",
        };

  const linkedTripId = linkedTripIdFromParams ?? "";
  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const rawToken = params.get("t") ?? params.get("token") ?? "";
    const trimmedToken = rawToken.trim();
    return trimmedToken.length > 0 ? trimmedToken : "";
  }, [location.search]);

  const encodedLinkedTripId = linkedTripId ? encodeURIComponent(linkedTripId) : "";
  const encodedInviteToken = inviteToken ? encodeURIComponent(inviteToken) : "";
  const inviteQuery = encodedInviteToken ? `?t=${encodedInviteToken}` : "";
  const universalInviteUrl = encodedLinkedTripId
    ? `${WEBSITE_URL}/trip/${encodedLinkedTripId}${inviteQuery}`
    : `${WEBSITE_URL}/trip`;
  const appSchemeInviteUrl = encodedLinkedTripId
    ? `com.packai.app://trip/${encodedLinkedTripId}${inviteQuery}`
    : "com.packai.app://trip";

  const handleOpenInApp = useCallback(() => {
    if (!encodedLinkedTripId) {
      return;
    }

    window.location.href = appSchemeInviteUrl;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = appSchemeInviteUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 900);

    setTimeout(() => {
      window.location.href = universalInviteUrl;
    }, 1400);

    if (APPLE_APP_ID) {
      setTimeout(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (
          userAgent.includes("iphone") ||
          userAgent.includes("ipad")
        ) {
          window.location.href = APP_STORE_URL;
        }
      }, 2400);
    }

    setActionFeedback(
      localizedContent.feedback,
    );
  }, [
    appSchemeInviteUrl,
    encodedLinkedTripId,
    localizedContent.feedback,
    universalInviteUrl,
  ]);

  const handleDownloadApp = useCallback(() => {
    window.location.href = APP_STORE_URL;
  }, []);

  if (!encodedLinkedTripId) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <div style={{ ...styles.card, textAlign: "center", margin: "2rem auto" }}>
            <h2>{localizedContent.invalidTitle}</h2>
            <p>{localizedContent.invalidBody}</p>
            <a
              href={WEBSITE_URL}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                marginTop: "0.75rem",
                padding: "0.65rem 1rem",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.05)",
                color: palette.accentSecondary,
                textDecoration: "none",
              }}
            >
              {localizedContent.returnHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{localizedContent.pageTitle}</title>
        <meta
          name="description"
          content={localizedContent.metaDescription}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={universalInviteUrl} />
        <meta property="og:title" content={localizedContent.shareTitle} />
        <meta
          property="og:description"
          content={localizedContent.shareDescription}
        />
        <meta property="og:image" content={`${WEBSITE_URL}/images/share-card.png?v=20260410a`} />
        <meta property="og:site_name" content="Pack" />
        <meta property="og:locale" content={localizedContent.ogLocale} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={universalInviteUrl} />
        <meta name="twitter:title" content={localizedContent.shareTitle} />
        <meta
          name="twitter:description"
          content={localizedContent.shareDescription}
        />
        <meta name="twitter:image" content={`${WEBSITE_URL}/images/share-card.png?v=20260410a`} />
        {APPLE_APP_ID && (
          <meta
            name="apple-itunes-app"
            content={`app-id=${APPLE_APP_ID}, app-argument=${universalInviteUrl}`}
          />
        )}
        <link rel="canonical" href={universalInviteUrl} />
      </Helmet>

      <div style={styles.page}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 40%)",
            pointerEvents: "none",
          }}
        />
        <div style={styles.content}>
          <div style={styles.card}>
            <h1
              style={{
                margin: "0.35rem 0 0.3rem 0",
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                letterSpacing: "-0.02em",
                color: palette.text,
              }}
            >
              {localizedContent.shareTitle}
            </h1>
            <p
              style={{
                margin: "0.75rem 0 1.5rem 0",
                color: palette.text,
                lineHeight: 1.7,
                maxWidth: 720,
              }}
            >
              {localizedContent.intro}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
                marginBottom: "0.75rem",
              }}
            >
              <button
                onClick={handleOpenInApp}
                style={{
                  ...styles.buttonBase,
                  background: `linear-gradient(90deg, ${palette.accent}, #ffdd67)`,
                  color: "#0e0d0c",
                  boxShadow: "0 10px 30px rgba(240, 198, 45, 0.25)",
                }}
              >
                <Sparkles size={18} />
                {localizedContent.openInApp}
              </button>
              <button
                onClick={handleDownloadApp}
                style={{
                  ...styles.buttonBase,
                  background: "rgba(255, 255, 255, 0.03)",
                  color: palette.textMuted,
                  border: `1px dashed ${palette.border}`,
                }}
              >
                <Download size={18} />
                {localizedContent.downloadApp}
              </button>
            </div>
            {actionFeedback && (
              <div
                style={{
                  marginTop: "0.5rem",
                  color: palette.textMuted,
                  fontSize: "0.9rem",
                }}
              >
                {actionFeedback}
              </div>
            )}
            <a
              href={WEBSITE_URL}
              style={{
                marginTop: "1.25rem",
                display: "inline-flex",
                gap: "0.4rem",
                alignItems: "center",
                color: palette.accentSecondary,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {localizedContent.learnMore}
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
