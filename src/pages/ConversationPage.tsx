import { FormEvent, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plane,
  RefreshCw,
  Save,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Hotel,
} from "lucide-react";
import { useApiClient } from "@/api/useApiClient";
import { useMountEffect } from "@/hooks/useMountEffect";
import { ApiRequestError } from "@/api/client";
import {
  getJobStatus,
  submitTravelPlanningJob,
  type JobStatus,
} from "@/api/jobs";
import { createTrip } from "@/api/trips";
import { createSharedTravelPlan } from "@/api/share";
import {
  buildSharePayload,
  buildTripPayloadFromTimeline,
  splitTimeline,
} from "@/utils/planner";
import { createEncryptedStorage } from "@/utils/encryptedBrowserStorage";
import type { TimelineChunk } from "@/schemas/travel";
import { useAuth } from "@/auth/AuthContext";
import { useI18n } from "@/i18n/I18nProvider";
import type { SupportedLocale } from "@/i18n/config";

type Message = {
  id: string;
  text: string;
  role: "user" | "ai";
  timestamp: Date;
};

type PlannerState = {
  status: "idle" | "queued" | "processing" | "completed" | "failed";
  jobId?: string;
  progress?: JobStatus["progressItems"];
  error?: string;
};

const conversationStorage = createEncryptedStorage({
  namespace: "pack-web-conversation",
  area: "local",
});

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const Page = styled.div`
  display: grid;
  gap: clamp(1rem, 2vw, 1.5rem);
  padding: clamp(0.25rem, 1vw, 0.7rem) 0 clamp(1rem, 2.4vw, 1.5rem);

  @media (min-width: 1101px) {
    gap: 1rem;
    padding: 0 0 1rem;
    margin-top: -8px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: clamp(1rem, 2.2vw, 1.35rem);
  border-radius: 28px;
  border: 1px solid var(--color-border);
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.12), transparent 28%),
    radial-gradient(circle at 100% 0%, rgba(243, 210, 122, 0.1), transparent 40%),
    linear-gradient(135deg, rgba(22, 17, 13, 0.84), rgba(27, 21, 16, 0.78));
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);

  @media (min-width: 1101px) {
    gap: 0.75rem;
  }
`;

const TitleGroup = styled.div`
  display: grid;
  gap: 0.4rem;

  h2 {
    margin: 0;
    font-size: clamp(1.5rem, 2.6vw, 2.3rem);
    letter-spacing: -0.03em;
    line-height: 0.98;
  }

  p {
    margin: 0;
    color: var(--color-text-secondary);
  }

  @media (min-width: 1101px) {
    gap: 0.25rem;

    h2 {
      font-size: clamp(1.35rem, 2vw, 1.9rem);
    }

    p {
      font-size: 0.95rem;
    }
  }
`;

const StatusBadge = styled.span<{ $variant?: "ok" | "warn" | "info" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  font-weight: 600;
  background: ${({ $variant }) => {
    switch ($variant) {
      case "ok":
        return "rgba(46, 204, 113, 0.12)";
      case "warn":
        return "rgba(231, 76, 60, 0.12)";
      default:
        return "var(--color-accent-soft)";
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case "ok":
        return "#2ecc71";
      case "warn":
        return "#e74c3c";
      default:
        return "var(--color-text-primary)";
    }
  }};
  border: 1px solid
    ${({ $variant }) => {
      switch ($variant) {
        case "ok":
          return "rgba(46, 204, 113, 0.2)";
        case "warn":
          return "rgba(231, 76, 60, 0.3)";
      default:
        return "var(--color-border)";
      }
    }};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Layout = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1.5fr 1fr;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (min-width: 1101px) {
    gap: 1rem;
    align-items: start;
  }
`;

const Card = styled.div`
  background:
    radial-gradient(circle at 0% 0%, rgba(231, 35, 64, 0.12), transparent 24%),
    radial-gradient(circle at 100% 0%, rgba(243, 210, 122, 0.12), transparent 38%),
    linear-gradient(135deg, rgba(27, 21, 16, 0.78), rgba(32, 25, 19, 0.72));
  border: 1px solid var(--color-border);
  border-radius: 26px;
  box-shadow: var(--shadow-soft);
  padding: clamp(1rem, 2vw, 1.5rem);
  backdrop-filter: blur(16px);

  @media (min-width: 1101px) {
    padding: 0.9rem 1rem;
  }
`;

const ChatWindow = styled(Card)`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 1rem;
  min-height: 440px;

  @media (min-width: 1101px) {
    gap: 0.8rem;
    min-height: min(66vh, 520px);
    max-height: min(66vh, 520px);
  }
`;

const ChatWindowHeader = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-primary);
  }
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);

  svg {
    width: 18px;
    height: 18px;
    color: currentColor;
  }
`;

const PanelBody = styled.div`
  min-height: 0;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
`;

const Messages = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-width: none;
  -ms-overflow-style: none;

  @media (min-width: 1101px) {
    gap: 0.6rem;
  }

  &::-webkit-scrollbar {
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(243, 210, 122, 0.18);
    border-radius: 12px;
  }
`;

const Bubble = styled.div<{ $role: "user" | "ai" }>`
  align-self: ${({ $role }) => ($role === "user" ? "flex-end" : "flex-start")};
  max-width: 76%;
  background: ${({ $role, theme }) =>
    $role === "user"
      ? `linear-gradient(135deg, ${theme?.colors?.brand?.primary ?? "#f0c62d"} 0%, ${
          theme?.colors?.brand?.primaryStrong ?? "#f59f0b"
        } 100%)`
      : "var(--color-surface)"};
  color: ${({ $role, theme }) =>
    $role === "user"
      ? theme?.colors?.neutral?.gray950 ?? "#05030b"
      : theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  border-radius: ${({ $role }) =>
    $role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px"};
  padding: 0.9rem 1.1rem;
  border: 1px solid
    ${({ $role }) =>
      $role === "user" ? "rgba(240, 198, 45, 0.32)" : "var(--color-border)"};
  backdrop-filter: blur(14px);
  box-shadow: ${({ $role }) =>
    $role === "user" ? "0 12px 24px rgba(240, 198, 45, 0.2)" : "0 16px 36px rgba(0, 0, 0, 0.35)"};
  line-height: 1.55;
  font-weight: 500;
`;

const Timestamp = styled.div`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray300 ?? "#cdd0d5"};
  opacity: 0.8;
`;

const InputRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding-top: 0.25rem;

  @media (min-width: 1101px) {
    gap: 0.6rem;
    padding-top: 0;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 248, 236, 0.06);
  color: ${({ theme }) => theme?.colors?.neutral?.gray050 ?? "#ffffff"};
  font-size: 1rem;
  box-shadow: inset 0 1px 10px rgba(0, 0, 0, 0.16);

  &:focus {
    outline: none;
    border-color: var(--color-border-medium);
    box-shadow: 0 0 0 3px rgba(240, 198, 45, 0.12),
      inset 0 1px 12px rgba(0, 0, 0, 0.25);
  }
`;

const PrimaryButton = styled.button<{ $ghost?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.85rem 1.2rem;
  border-radius: 999px;
  border: ${({ $ghost }) => ($ghost ? "1px solid rgba(243, 210, 122, 0.14)" : "none")};
  background: ${({ $ghost, theme }) =>
    $ghost
      ? "var(--color-surface)"
      : `linear-gradient(135deg, ${theme?.colors?.brand?.primary ?? "#f3d27a"} 0%, ${
          theme?.colors?.brand?.primaryStrong ?? "#ebbe58"
        } 100%)`};
  color: ${({ $ghost, theme }) =>
    $ghost ? theme?.colors?.neutral?.gray050 ?? "#ffffff" : "#05030b"};
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.12s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $ghost }) =>
      $ghost
        ? "var(--shadow-soft)"
        : "0 16px 32px rgba(243, 210, 122, 0.22)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ProgressBar = styled.div`
  display: grid;
  gap: 0.4rem;

  @media (min-width: 1101px) {
    gap: 0.3rem;
  }
`;

const ProgressRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.45rem;

  @media (min-width: 1101px) {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.35rem;
  }
`;

const ProgressItem = styled.div<{ $status: "pending" | "processing" | "completed" | "failed" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.7rem;
  border-radius: 12px;
  border: 1px solid
    ${({ $status }) => {
      switch ($status) {
        case "completed":
          return "rgba(46, 204, 113, 0.3)";
        case "failed":
          return "rgba(231, 76, 60, 0.3)";
        case "processing":
          return "rgba(240, 198, 45, 0.35)";
        default:
          return "var(--color-border)";
      }
    }};
  background: var(--color-surface);
  color: var(--color-text-primary);

  @media (min-width: 1101px) {
    padding: 0.5rem 0.6rem;
    font-size: 0.9rem;
  }
`;

const TimelineCard = styled.div`
  padding: 0.85rem 0.95rem;
  background: var(--color-surface);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  display: grid;
  gap: 0.35rem;
`;

const TimelineGrid = styled.div`
  display: grid;
  gap: 0.75rem;

  @media (min-width: 1101px) {
    gap: 0.55rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
  align-items: center;
  margin-top: 0.5rem;

  @media (max-width: 720px) {
    flex-wrap: wrap;
  }

  @media (min-width: 1101px) {
    gap: 0.55rem;
    margin-top: 0.2rem;
  }
`;

const Meta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
  }
`;

const EmptyState = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  height: auto;
  width: 100%;
  padding: 1.5rem 1.3rem;
  border-radius: 28px;
  background: rgba(255, 248, 236, 0.035);
  border: 1px dashed var(--color-border);
  text-align: center;
  color: ${({ theme }) => theme?.colors?.neutral?.gray100 ?? "#f6f6f6"};
  display: grid;
  gap: 0.55rem;
  align-content: center;
  justify-items: center;

  @media (min-width: 1101px) {
    padding: 1.25rem 1.1rem;
    gap: 0.25rem;
    font-size: 0.95rem;
  }
`;

const PromptEmptyState = styled(EmptyState)`
  width: calc(100% - 2rem);
  margin-inline: auto;

  @media (min-width: 1101px) {
    width: calc(100% - 2.6rem);
  }
`;

const OutlineEmptyState = styled(EmptyState)`
  flex: 0 0 auto;
  width: calc(100% - 2rem);
  min-height: 15rem;
  margin-inline: auto;

  @media (min-width: 1101px) {
    width: calc(100% - 2.6rem);
    min-height: 16.5rem;
  }
`;

const EmptyStateLead = styled.div`
  min-height: 2.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
`;

const EmptyStateDetail = styled.div`
  min-height: 3.4rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  text-align: center;
  max-width: 38ch;
  line-height: 1.45;

  @media (min-width: 1101px) {
    min-height: 3rem;
  }
`;

const DiscoveryList = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const DiscoveryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: ${({ theme }) => theme?.colors?.neutral?.gray100 ?? "#f6f6f6"};
  font-size: 0.95rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: ${({ theme }) => theme?.colors?.neutral?.gray200 ?? "#d5d6dc"};
  font-size: 0.95rem;
`;

const PlannerPanel = styled(Card)`
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 1rem;

  @media (min-width: 1101px) {
    gap: 0.7rem;
    min-height: min(66vh, 520px);
    max-height: min(66vh, 520px);
    overflow-y: auto;
    scrollbar-gutter: stable;
  }
`;

const SectionTitle = styled(PanelHeading)`
  letter-spacing: 0.01em;

  @media (min-width: 1101px) {
    gap: 0.4rem;
    font-size: 0.95rem;
  }
`;

const Pill = styled.span`
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-text-primary);
  font-size: 0.85rem;
  font-weight: 600;
`;

const TextLink = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme?.colors?.brand?.primary ?? "#f0c62d"};
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
`;

const PlannerActionButton = styled(PrimaryButton)`
  padding: 0.72rem 1rem;
  font-size: 0.92rem;
  gap: 0.38rem;
  white-space: nowrap;
  flex: 0 0 auto;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const formatTime = (date: Date, locale: SupportedLocale) =>
  date.toLocaleTimeString(locale === "es" ? "es-ES" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatDate = (value: string | undefined, locale: SupportedLocale, fallback: string) => {
  if (!value) return fallback;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    locale === "es" ? "es-ES" : "en-US",
    {
    month: "short",
    day: "numeric",
    year: "numeric",
    }
  );
};

const normalizePlannerErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (error instanceof ApiRequestError && error.status === 401) {
    return fallbackMessage;
  }

  if (error instanceof Error) {
    const message = error.message?.trim();
    if (!message) {
      return fallbackMessage;
    }
    // Never surface schema/validation internals to end users.
    if (
      /invalid_type|zod|expected .* received|unexpected response format/i.test(
        message
      ) ||
      message.startsWith("[")
    ) {
      return fallbackMessage;
    }
    if (/failed to fetch/i.test(message)) {
      return fallbackMessage;
    }
    return message;
  }

  return fallbackMessage;
};

export const ConversationPage: React.FC = () => {
  const apiClient = useApiClient();
  const { user, status, login } = useAuth();
  const { locale } = useI18n();
  const localizedContent =
    locale === "es"
      ? {
          loginRedirectPath: "/es/app",
          plannerIntroTitle: "Planea tu viaje",
          plannerIntroBody:
            "Pide destinos, fechas, restricciones o sube detalles y construiremos el esquema.",
          planReady: "Plan listo",
          plannerIssue: "Problema del planificador",
          livePlanner: "Planificador en vivo",
          planAndBook: "Planea y reserva tu viaje",
          emptyLead: "Cuéntanos sobre tu viaje.",
          emptyDetail:
            '“Fin de semana en Austin con música en vivo”, “Viaje de trabajo a NYC, llegada el domingo”',
          inputPlaceholder: "¿A dónde? Agrega fechas, restricciones o el tipo de viaje…",
          planning: "Planeando",
          send: "Enviar",
          buildingPlan: "Construyendo tu plan…",
          planOutline: "Esquema del plan",
          segments: "segmentos",
          noPlanYet: "Todavía no hay plan.",
          sendPrompt: "Envía un mensaje para generar un esquema.",
          flightOption: "Opción de vuelo",
          stay: "Estancia",
          outlineHolds: "Reservas del esquema",
          alreadyBooked: "Ya reservado",
          saveToTrips: "Guardar en Trips",
          sharePlan: "Compartir plan",
          copyLink: "Copiar enlace",
          processingInfo:
            "Estamos alineando vuelos, hoteles y preferencias. Esto puede tardar unos segundos.",
          plannerIssueRetry: "El planificador encontró un problema. Inténtalo de nuevo.",
          planReadyToReview: "Plan listo para revisar",
          surfacingBestOptions:
            "Mostrando las mejores opciones según tu perfil e historial.",
          prioritizedResults:
            "Priorizamos resultados según lealtad, horario y balance de precio.",
          gotIt: "Entendido. Estoy armando tu viaje…",
          authFallback: "Lo siento, estoy de vacaciones en este momento",
          generateBeforeSave: "Genera un plan antes de guardarlo en Trips.",
          aiTrip: "Viaje con IA",
          savedToTrips: "Guardado en tus Trips.",
          saveFailed: "No se pudo guardar el viaje.",
          generateBeforeShare: "Genera un plan antes de compartirlo.",
          travelPlan: "Plan de viaje",
          plannedWithDoneAi: "Planeado con Pack",
          shareCreated: "Se creó un enlace para compartir este plan.",
          shareFailed: "No se pudo crear el enlace para compartir.",
          yourPlanReady: "Tu plan está listo. Revisa el esquema abajo.",
          dateTbd: "Fecha por definir",
        }
      : {
          loginRedirectPath: "/app",
          plannerIntroTitle: "Plan your trip",
          plannerIntroBody:
            "Ask for destinations, dates, constraints, or upload details and we’ll build the outline.",
          planReady: "Plan ready",
          plannerIssue: "Planner issue",
          livePlanner: "Live planner",
          planAndBook: "Plan and book your trip",
          emptyLead: "Tell us about your trip.",
          emptyDetail:
            '“Austin weekend with live music”, “NYC work trip, Sunday arrival”',
          inputPlaceholder: "Where to? Add dates, constraints, or vibe…",
          planning: "Planning",
          send: "Send",
          buildingPlan: "Building your plan…",
          planOutline: "Plan outline",
          segments: "segments",
          noPlanYet: "No plan yet.",
          sendPrompt: "Send a prompt to generate an outline.",
          flightOption: "Flight option",
          stay: "Stay",
          outlineHolds: "Outline holds",
          alreadyBooked: "Already booked",
          saveToTrips: "Save to Trips",
          sharePlan: "Share plan",
          copyLink: "Copy link",
          processingInfo:
            "We’re aligning flights, hotels, and preferences. This can take a few seconds.",
          plannerIssueRetry: "Planner encountered an issue. Try again.",
          planReadyToReview: "Plan ready to review",
          surfacingBestOptions:
            "Surfacing the best options based on your profile and history.",
          prioritizedResults:
            "We prioritized results based on loyalty, timing, and price balance.",
          gotIt: "Got it. I’m building your trip now…",
          authFallback: "sorry I'm on vacation right now",
          generateBeforeSave: "Generate a plan before saving to Trips.",
          aiTrip: "AI trip",
          savedToTrips: "Saved to your Trips.",
          saveFailed: "Could not save the trip.",
          generateBeforeShare: "Generate a plan before sharing.",
          travelPlan: "Travel plan",
          plannedWithDoneAi: "Planned with Pack",
          shareCreated: "Created a share link for this plan.",
          shareFailed: "Could not create share link.",
          yourPlanReady: "Your plan is ready. Review the outline below.",
          dateTbd: "Date tbd",
        };
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [plannerState, setPlannerState] = useState<PlannerState>({ status: "idle" });
  const [timelineItems, setTimelineItems] = useState<TimelineChunk[]>([]);
  const [planTitle, setPlanTitle] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useMountEffect(() => {
    if (conversationId || typeof window === "undefined") return;

    let cancelled = false;

    void (async () => {
      const stored = await conversationStorage.getItem();
      if (cancelled) {
        return;
      }

      if (stored) {
        setConversationId(stored);
        return;
      }

      const legacyStored = conversationStorage.readPlaintextFallback();
      if (legacyStored) {
        await conversationStorage.setItem(legacyStored);
        if (!cancelled) {
          setConversationId(legacyStored);
        }
        return;
      }

      const fallback =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `web-${Date.now()}`;
      const derived = user?.sub ? `${user.sub}-web` : fallback;
      await conversationStorage.setItem(derived);
      if (!cancelled) {
        setConversationId(derived);
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  const addMessage = (text: string, role: "user" | "ai") => {
    const normalizedText =
      typeof text === "string" && text.trim().length > 0
        ? text
        : localizedContent.authFallback;
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}`,
        text: normalizedText,
        role,
        timestamp: new Date(),
      },
    ]);
    scrollToBottom();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      const message = localizedContent.authFallback;
      setError(message);
      addMessage(message, "ai");
      void login({ redirectPath: localizedContent.loginRedirectPath });
      return;
    }

    if (!conversationId) {
      setError(localizedContent.authFallback);
      addMessage(localizedContent.authFallback, "ai");
      return;
    }
    const trimmed = inputValue.trim();
    if (!trimmed || plannerState.status === "processing" || plannerState.status === "queued") {
      return;
    }

    setError(null);
    setShareUrl(null);
    setPlanTitle(trimmed);
    addMessage(trimmed, "user");
    setInputValue("");
    setPlannerState({ status: "queued", jobId: "", progress: [] });
    setTimelineItems([]);

    try {
      const submission = await submitTravelPlanningJob(apiClient, {
        message: trimmed,
        conversationId,
        sessionId: conversationId,
        context: {},
      });

      addMessage(localizedContent.gotIt, "ai");
      setPlannerState({
        status: "processing",
        jobId: submission.jobId,
        progress: submission.progressItems,
      });
    } catch (err) {
      console.error("[Planner] submitTravelPlanningJob failed", err);
      const message = normalizePlannerErrorMessage(err, localizedContent.authFallback);
      setError(message);
      addMessage(message, "ai");
      setPlannerState({ status: "failed", jobId: "", error: message });
    }
  };

  const { outlines, planChunks } = useMemo(
    () => splitTimeline(timelineItems),
    [timelineItems]
  );

  const hasPlan = outlines.length > 0 || planChunks.length > 0;

  const handleSaveTrip = async () => {
    if (!hasPlan) {
      setError(localizedContent.generateBeforeSave);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const payload = buildTripPayloadFromTimeline(
        timelineItems,
        planTitle || localizedContent.aiTrip
      );
      await createTrip(apiClient, payload);
      setPlannerState((prev) =>
        prev.status === "completed"
          ? { ...prev }
          : { status: "completed", jobId: (prev as any).jobId ?? "" }
      );
      addMessage(localizedContent.savedToTrips, "ai");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : localizedContent.saveFailed;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!hasPlan) {
      setError(localizedContent.generateBeforeShare);
      return;
    }
    setIsSharing(true);
    setError(null);
    try {
      const payload = buildSharePayload(
        timelineItems,
        planTitle || localizedContent.travelPlan,
        localizedContent.plannedWithDoneAi
      );
      const response = await createSharedTravelPlan(apiClient, payload);
      setShareUrl(response.shareUrl);
      addMessage(localizedContent.shareCreated, "ai");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : localizedContent.shareFailed;
      setError(message);
    } finally {
      setIsSharing(false);
    }
  };

  const progressItems = plannerState.status === "processing" || plannerState.status === "queued"
    ? plannerState.progress ?? []
    : [];
  const shouldPollPlanner =
    (plannerState.status === "processing" || plannerState.status === "queued") &&
    Boolean(plannerState.jobId);

  return (
    <Page>
      {shouldPollPlanner ? (
        <PlannerStatusPoller
          key={`${plannerState.jobId}:${plannerState.status}`}
          apiClient={apiClient}
          jobId={plannerState.jobId}
          localizedContent={localizedContent}
          onError={setError}
          onMessage={addMessage}
          onStatusUpdate={setPlannerState}
          onTimelineUpdate={setTimelineItems}
        />
      ) : null}
      <Header>
        <TitleGroup>
          <h2>{localizedContent.plannerIntroTitle}</h2>
          <p>{localizedContent.plannerIntroBody}</p>
        </TitleGroup>
        <StatusBadge $variant={plannerState.status === "failed" ? "warn" : "info"}>
          {plannerState.status === "completed" ? <CheckCircle2 /> : plannerState.status === "failed" ? <AlertCircle /> : <Sparkles />}
          {plannerState.status === "completed"
            ? localizedContent.planReady
            : plannerState.status === "failed"
              ? localizedContent.plannerIssue
              : localizedContent.livePlanner}
        </StatusBadge>
      </Header>

      <Layout>
        <ChatWindow>
          <PanelHeading as={ChatWindowHeader}>
            <Sparkles />
            <span>{localizedContent.planAndBook}</span>
          </PanelHeading>
          <PanelBody>
            <Messages>
            {messages.length === 0 && (
              <PromptEmptyState>
                <EmptyStateLead>{localizedContent.emptyLead}</EmptyStateLead>
                <EmptyStateDetail>
                  {localizedContent.emptyDetail}
                </EmptyStateDetail>
              </PromptEmptyState>
            )}
              {messages.map((msg) => (
                <div key={msg.id}>
                  <Bubble $role={msg.role}>{msg.text}</Bubble>
                  <Timestamp>{formatTime(msg.timestamp, locale)}</Timestamp>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </Messages>
          </PanelBody>

          <InputRow onSubmit={handleSubmit}>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={localizedContent.inputPlaceholder}
              disabled={plannerState.status === "processing" || plannerState.status === "queued"}
            />
            <PrimaryButton
              type="submit"
              disabled={
                !inputValue.trim() ||
                plannerState.status === "processing" ||
                plannerState.status === "queued"
              }
            >
              {(plannerState.status === "processing" || plannerState.status === "queued") ? (
                <>
                  <Spinner />
                  {localizedContent.planning}
                </>
              ) : (
                <>
                  <Send />
                  {localizedContent.send}
                </>
              )}
            </PrimaryButton>
          </InputRow>

          {progressItems.length > 0 && (
            <ProgressBar>
              <InfoRow>
                <RefreshCw size={16} />
                {localizedContent.buildingPlan}
              </InfoRow>
              <ProgressRow>
                {progressItems.map((item) => (
                  <ProgressItem key={item.id} $status={item.status}>
                    {item.status === "completed" && <CheckCircle2 size={16} />}
                    {item.status === "failed" && <AlertCircle size={16} />}
                    {item.status === "processing" && <Spinner size={16} />}
                    {item.status === "pending" && <Clock size={16} />}
                    <span>{item.label}</span>
                  </ProgressItem>
                ))}
              </ProgressRow>
            </ProgressBar>
          )}

          {error && (
            <InfoRow style={{ color: "#e74c3c" }}>
              <AlertCircle size={18} />
              {error}
            </InfoRow>
          )}
        </ChatWindow>

        <PlannerPanel>
          <SectionTitle>
            <ShieldCheck />
            {localizedContent.planOutline}
            {hasPlan && <Pill>{timelineItems.length} {localizedContent.segments}</Pill>}
          </SectionTitle>

          <PanelBody>
          {!hasPlan ? (
            <OutlineEmptyState>
              <EmptyStateLead>{localizedContent.noPlanYet}</EmptyStateLead>
              <EmptyStateDetail>
                {localizedContent.sendPrompt}
              </EmptyStateDetail>
            </OutlineEmptyState>
          ) : (
              <TimelineGrid>
                {planChunks.map((item) => {
                  if (item.type === "flight") {
                    return (
                      <TimelineCard key={item.id}>
                        <SectionTitle>
                          <Plane />
                          {localizedContent.flightOption}
                        </SectionTitle>
                        <div style={{ fontWeight: 700 }}>
                          {item.origin} → {item.destination}
                        </div>
                        <Meta>
                          <CalendarIcon />
                          {formatDate(item.date, locale, localizedContent.dateTbd)}
                        </Meta>
                        {(item.departureTime || item.arrivalTime) && (
                          <Meta>
                            <Clock />
                            {[item.departureTime, item.arrivalTime].filter(Boolean).join(" → ")}
                          </Meta>
                        )}
                        {(item.airline || item.flightNumber) && (
                          <Meta>
                            <Plane />
                            {[item.airline, item.flightNumber].filter(Boolean).join(" · ")}
                          </Meta>
                        )}
                      </TimelineCard>
                    );
                  }
                  return (
                    <TimelineCard key={item.id}>
                        <SectionTitle>
                          <Hotel />
                          {localizedContent.stay}
                        </SectionTitle>
                      <div style={{ fontWeight: 700 }}>{item.location}</div>
                      <Meta>
                        <CalendarIcon />
                        {formatDate(item.checkIn, locale, localizedContent.dateTbd)} — {formatDate(item.checkOut, locale, localizedContent.dateTbd)}
                      </Meta>
                      <Meta>
                        <MapPin />
                        {item.cityCode}
                      </Meta>
                    </TimelineCard>
                  );
                })}

                {outlines.length > 0 && (
                  <div>
                    <SectionTitle>
                      <Sparkles />
                      {localizedContent.outlineHolds}
                    </SectionTitle>
                      <TimelineGrid>
                      {outlines.map((item) =>
                        item.type === "flightOutline" ? (
                          <TimelineCard key={item.id}>
                            <div style={{ fontWeight: 700 }}>
                              {item.origin} → {item.destination}
                            </div>
                            <Meta>
                              <CalendarIcon />
                              {formatDate(item.date, locale, localizedContent.dateTbd)}
                            </Meta>
                            {item.alreadyBooked && (
                              <Meta>
                                <CheckCircle2 />
                                {localizedContent.alreadyBooked}
                              </Meta>
                            )}
                          </TimelineCard>
                        ) : (
                          <TimelineCard key={item.id}>
                            <div style={{ fontWeight: 700 }}>{item.location}</div>
                            <Meta>
                              <CalendarIcon />
                              {formatDate(item.checkIn, locale, localizedContent.dateTbd)} — {formatDate(item.checkOut ?? item.checkIn, locale, localizedContent.dateTbd)}
                            </Meta>
                            {item.alreadyBooked && (
                              <Meta>
                                <CheckCircle2 />
                                {localizedContent.alreadyBooked}
                              </Meta>
                            )}
                          </TimelineCard>
                        )
                      )}
                    </TimelineGrid>
                  </div>
                )}
              </TimelineGrid>
            )}
          </PanelBody>

          <Actions>
            <PlannerActionButton onClick={handleSaveTrip} disabled={!hasPlan || isSaving}>
              {isSaving ? <Spinner /> : <Save />}
              {localizedContent.saveToTrips}
            </PlannerActionButton>
            <PlannerActionButton $ghost onClick={handleShare} disabled={!hasPlan || isSharing}>
              {isSharing ? <Spinner /> : <Share2 />}
              {localizedContent.sharePlan}
            </PlannerActionButton>
            {shareUrl && (
              <TextLink
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl);
                }}
              >
                {localizedContent.copyLink}
              </TextLink>
            )}
          </Actions>

          {plannerState.status === "processing" && (
            <InfoRow>
              <Spinner />
              {localizedContent.processingInfo}
            </InfoRow>
          )}

          {plannerState.status === "failed" && (
            <InfoRow style={{ color: "#e74c3c" }}>
              <AlertCircle size={18} />
              {plannerState.error ?? localizedContent.plannerIssueRetry}
            </InfoRow>
          )}

          {plannerState.status === "completed" && hasPlan && (
            <StatusBadge $variant="ok">
              <CheckCircle2 />
              {localizedContent.planReadyToReview}
            </StatusBadge>
          )}

          {plannerState.status !== "idle" &&
            plannerState.status !== "failed" &&
            (plannerState.status === "processing" || plannerState.status === "completed") &&
            plannerState.progress &&
            plannerState.progress.length === 0 && (
              <InfoRow>
                <Sparkles />
                {localizedContent.surfacingBestOptions}
              </InfoRow>
            )}

          {plannerState.status !== "idle" &&
            plannerState.status !== "failed" &&
            (plannerState as any).progress?.length === 0 &&
            timelineItems.length > 0 && (
              <DiscoveryList>
                <DiscoveryItem>
                  <Sparkles />
                  {localizedContent.prioritizedResults}
                </DiscoveryItem>
              </DiscoveryList>
            )}
        </PlannerPanel>
      </Layout>
    </Page>
  );
};

const PlannerStatusPoller: React.FC<{
  readonly apiClient: ReturnType<typeof useApiClient>;
  readonly jobId: string;
  readonly localizedContent: {
    authFallback: string;
    yourPlanReady: string;
  };
  readonly onError: React.Dispatch<React.SetStateAction<string | null>>;
  readonly onMessage: (text: string, role: "user" | "ai") => void;
  readonly onStatusUpdate: React.Dispatch<React.SetStateAction<PlannerState>>;
  readonly onTimelineUpdate: React.Dispatch<React.SetStateAction<TimelineChunk[]>>;
}> = ({
  apiClient,
  jobId,
  localizedContent,
  onError,
  onMessage,
  onStatusUpdate,
  onTimelineUpdate,
}) => {
  useMountEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const status = await getJobStatus(apiClient, jobId);
        if (cancelled) return;

        onStatusUpdate(() => ({
          status: status.status === "failed"
            ? "failed"
            : status.status === "completed"
              ? "completed"
              : "processing",
          jobId,
          progress: status.progressItems,
          error: status.error ?? undefined,
        }));

        const parsedTimeline = status.result?.timelineItems;
        if (parsedTimeline && Array.isArray(parsedTimeline)) {
          onTimelineUpdate(parsedTimeline as TimelineChunk[]);
        }

        if (status.status === "completed") {
          onMessage(localizedContent.yourPlanReady, "ai");
          return;
        }

        if (status.status === "failed") {
          const message =
            typeof status.error === "string" && status.error.trim().length > 0
              ? status.error.trim()
              : localizedContent.authFallback;
          onError(message);
          onMessage(message, "ai");
          return;
        }

        const nextDelay = status.status === "processing" ? 2800 : 4200;
        window.setTimeout(poll, nextDelay);
      } catch (err) {
        if (cancelled) return;
        console.error("[Planner] getJobStatus failed", err);
        const message = normalizePlannerErrorMessage(err, localizedContent.authFallback);
        onError(message);
        onMessage(message, "ai");
        window.setTimeout(poll, 5000);
      }
    };

    void poll();

    return () => {
      cancelled = true;
    };
  });

  return null;
};

const CalendarIcon = () => <Clock size={16} />;
