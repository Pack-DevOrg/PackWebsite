import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { env } from "../utils/env";
import { loadRecaptchaScript, executeRecaptchaAction } from "../utils/recaptcha";
import { useTracking } from "../components/TrackingProvider";
import { apiEndpoints } from "../config/appConfig";
import { useMountEffect } from "../hooks/useMountEffect";
import { useI18n } from "@/i18n/I18nProvider";

type PrivacyRequestType =
  | "access"
  | "delete"
  | "opt_out"
  | "correction"
  | "limit_processing";

type PrivacyRelationship = "customer" | "prospect" | "visitor" | "authorized_agent";

interface PrivacyRequestSubmissionPayload {
  requestType: PrivacyRequestType;
  email: string;
  firstName?: string;
  lastName?: string;
  relationship?: PrivacyRelationship;
  jurisdiction?: string;
  details?: string;
  agentVerificationProvided?: boolean;
  recaptchaToken: string;
  source?: string;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  relationship: PrivacyRelationship;
  jurisdiction: string;
  details: string;
  agentVerificationProvided: boolean;
}

type MessageState =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

const REQUEST_TYPE_BY_SLUG = {
  access: "access",
  correction: "correction",
  delete: "delete",
  limit: "limit_processing",
  limit_processing: "limit_processing",
  "opt-out": "opt_out",
  opt_out: "opt_out",
} as const satisfies Record<string, PrivacyRequestType>;

const DEFAULT_REQUEST_TYPE: PrivacyRequestType = "access";
const REQUEST_TYPE_SLUG_BY_VALUE: Record<PrivacyRequestType, string> = {
  access: "access",
  correction: "correction",
  delete: "delete",
  limit_processing: "limit",
  opt_out: "opt-out",
};

const resolveRequestTypeFromSlug = (
  requestTypeSlug: string | undefined,
): PrivacyRequestType =>
  requestTypeSlug
    ? REQUEST_TYPE_BY_SLUG[requestTypeSlug as keyof typeof REQUEST_TYPE_BY_SLUG] ??
      DEFAULT_REQUEST_TYPE
    : DEFAULT_REQUEST_TYPE;

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 1rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #e5e5e5;

  @media (max-width: 768px) {
    gap: 1.25rem;
  }
`;

const Section = styled.section`
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
`;

const SectionDescription = styled.p`
  margin: 0 0 1.5rem;
  color: rgba(229, 229, 229, 0.75);
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #f5f5f5;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 0.85rem 1rem;
  border-radius: 10px;
  border: 1px solid
    ${({ $hasError }) => ($hasError ? "rgba(244, 67, 54, 0.65)" : "rgba(255, 255, 255, 0.12)")};
  background: rgba(255, 255, 255, 0.03);
  color: #ffffff;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(249, 47, 96, 0.9);
    box-shadow: 0 0 0 3px rgba(249, 47, 96, 0.25);
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  ${Input}
  min-height: 3.35rem;
  padding-top: 0.95rem;
  padding-bottom: 0.95rem;
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  ${Input};
  min-height: 140px;
  resize: vertical;
  line-height: 1.5;
`;

const HelperText = styled.span<{ $isError?: boolean }>`
  font-size: 0.85rem;
  color: ${({ $isError }) => ($isError ? "rgba(244, 67, 54, 0.85)" : "rgba(229, 229, 229, 0.6)")};
`;

const ToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  cursor: pointer;

  input {
    width: 20px;
    height: 20px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  padding: 0.85rem 1.75rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #0f0f0f;
  background: linear-gradient(135deg, #f0c62d 0%, #f92f60 100%);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;

  ${({ disabled }) =>
    disabled
      ? `
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  `
      : `
    box-shadow: 0 12px 40px rgba(249, 47, 96, 0.35);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 18px 45px rgba(249, 47, 96, 0.45);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 12px 35px rgba(249, 47, 96, 0.35);
    }
  `}
`;

const MessageBanner = styled.div<{ $variant: "success" | "error" }>`
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid
    ${({ $variant }) => ($variant === "success" ? "rgba(76, 175, 80, 0.45)" : "rgba(244, 67, 54, 0.45)")};
  background: ${({ $variant }) =>
    $variant === "success" ? "rgba(76, 175, 80, 0.18)" : "rgba(244, 67, 54, 0.2)"};
  color: #ffffff;
`;

const GuidanceList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 0.75rem;
  color: rgba(229, 229, 229, 0.82);
  line-height: 1.6;
`;

const GuidanceLead = styled.p`
  margin: 0 0 1rem;
  color: rgba(229, 229, 229, 0.78);
  line-height: 1.6;
`;

const PrivacyRequestPage: React.FC = () => {
  const { requestType: requestTypeSlug } = useParams<{ requestType?: string }>();
  const navigate = useNavigate();
  const { locale, pathFor } = useI18n();
  const selectedRequestType = resolveRequestTypeFromSlug(requestTypeSlug);
  const [formState, setFormState] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    relationship: "customer",
    jurisdiction: "",
    details: "",
    agentVerificationProvided: false,
  });
  const [message, setMessage] = useState<MessageState>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const { trackEvent } = useTracking();
  const localizedContent =
    locale === "es"
      ? {
          relationshipOptions: [
            { value: "customer" as const, label: "Cliente actual" },
            { value: "prospect" as const, label: "Cliente potencial" },
            { value: "visitor" as const, label: "Visitante del sitio" },
            { value: "authorized_agent" as const, label: "Agente autorizado" },
          ],
          requestTypeOptions: [
            { value: "access" as const, label: "Acceder a mis datos personales" },
            { value: "delete" as const, label: "Eliminar mi cuenta de Pack" },
            { value: "opt_out" as const, label: "Excluirme del intercambio de datos" },
            { value: "correction" as const, label: "Corregir datos inexactos" },
            { value: "limit_processing" as const, label: "Limitar el procesamiento de datos sensibles" },
          ],
          recaptchaMissing: "reCAPTCHA no está configurado. Contacta a soporte.",
          recaptchaInitFailed: "La verificación de seguridad no está disponible. Actualiza la página.",
          emailRequired: "El correo electrónico es obligatorio.",
          detailsRequired: "Describe tu solicitud.",
          securityUnavailable: "La verificación de seguridad no está disponible.",
          securityRetry: "La verificación de seguridad no está disponible. Inténtalo más tarde.",
          submitError:
            "No pudimos enviar tu solicitud. Inténtalo de nuevo o escribe a support@trypackai.com.",
          optOutSuccess:
            "Hemos recibido tu solicitud de exclusión. Revisa tu correo para confirmarla antes de aplicar el cambio.",
          requestSuccess:
            "Hemos recibido tu solicitud de privacidad. Revisa tu correo para confirmarla antes de que empecemos a procesarla.",
          genericFailure: "No pudimos enviar tu solicitud. Inténtalo de nuevo.",
          title: "Tus derechos de privacidad",
          description:
            "Envía una solicitud para acceder, corregir o gestionar ciertas preferencias de privacidad relacionadas con Pack. Te escribiremos por correo para confirmar tu identidad y darte una actualización dentro del plazo legal aplicable.",
          accountDeletionTitle: "Eliminar una cuenta de Pack",
          accountDeletionLead:
            "Para evitar eliminaciones fraudulentas, las cuentas de Pack deben eliminarse desde una sesión autenticada dentro de la app.",
          accountDeletionGuidance: [
            "Si tienes una cuenta de Pack, elimina la cuenta dentro de la app para completar la eliminación usando tu sesión autenticada.",
            "Ruta: App Menu > Settings > Account > Delete Account.",
            "Si solo te apuntaste a la lista de espera o recibes correos de marketing, usa el enlace de unsubscribe en esos correos o escribe a support@trypackai.com.",
          ],
          successTitle: "Solicitud enviada",
          errorTitle: "Hubo un problema",
          securityTitle: "Verificación de seguridad no disponible",
          emailLabel: "Correo electrónico *",
          emailPlaceholder: "tu@ejemplo.com",
          requestTypeLabel: "Tipo de solicitud *",
          relationshipLabel: "Relación con Pack *",
          relationshipHelp:
            "Si envías la solicitud en nombre de otra persona, selecciona “Agente autorizado” y agrega abajo tu documentación de autorización.",
          jurisdictionLabel: "Estado o país (opcional)",
          jurisdictionPlaceholder: "ej. California, EE. UU.",
          firstNameLabel: "Nombre (opcional)",
          lastNameLabel: "Apellido (opcional)",
          detailsLabel: "Detalles de la solicitud *",
          detailsPlaceholder: "Describe tu solicitud para que nuestro equipo de privacidad pueda ayudarte más rápido.",
          detailsHelp:
            "Incluye identificadores como correo de cuenta o fechas que nos ayuden a localizar tus registros.",
          agentLabel:
            "Presento esta solicitud como agente autorizado y tengo documentación de respaldo.",
          submitIdle: "Enviar solicitud de privacidad",
          submitBusy: "Enviando...",
        }
      : {
          relationshipOptions: [
            { value: "customer" as const, label: "Current customer" },
            { value: "prospect" as const, label: "Prospective customer" },
            { value: "visitor" as const, label: "Website visitor" },
            { value: "authorized_agent" as const, label: "Authorized agent" },
          ],
          requestTypeOptions: [
            { value: "access" as const, label: "Access my personal data" },
            { value: "delete" as const, label: "Delete my Pack account" },
            {
              value: "opt_out" as const,
              label: "Do Not Sell or Share My Personal Information",
            },
            { value: "correction" as const, label: "Correct inaccurate data" },
            {
              value: "limit_processing" as const,
              label: "Limit the Use of My Sensitive Personal Information",
            },
          ],
          recaptchaMissing: "reCAPTCHA is not configured. Please contact support.",
          recaptchaInitFailed: "Security verification unavailable. Please refresh the page.",
          emailRequired: "Email is required.",
          detailsRequired: "Please provide details about your request.",
          securityUnavailable: "Security verification is unavailable.",
          securityRetry: "Security verification unavailable. Please try again later.",
          submitError:
            "We were unable to submit your request. Please try again or reach out to support@trypackai.com.",
          optOutSuccess:
            "Your opt-out request has been received. Check your email to confirm it before we apply the change.",
          requestSuccess:
            "Your privacy request has been received. Check your email to confirm it before we start processing the request.",
          genericFailure: "We were unable to submit your request. Please try again.",
          title: "Your Privacy Choices",
          description:
            "Submit a request to access, delete, correct, or manage your privacy rights related to Pack, including the right to opt out of the sale or sharing of personal information and to limit our use of certain sensitive personal information. We’ll follow up by email to confirm your identity and provide an update within the legally required timeframe.",
          accountDeletionTitle: "Deleting a Pack account",
          accountDeletionLead:
            "To avoid fraudulent deletion requests, Pack accounts must be deleted from an authenticated in-app session.",
          accountDeletionGuidance: [
            "If you have a Pack account, delete it inside the app so we can rely on your authenticated session.",
            "Path: App Menu > Settings > Account > Delete Account.",
            "If you only joined the waitlist or receive marketing emails, use the unsubscribe link in those emails or contact support@trypackai.com.",
          ],
          successTitle: "Request Submitted",
          errorTitle: "There was a problem",
          securityTitle: "Security Verification Unavailable",
          emailLabel: "Email Address *",
          emailPlaceholder: "you@example.com",
          requestTypeLabel: "Request Type *",
          relationshipLabel: "Relationship to Pack *",
          relationshipHelp:
            "If you are submitting on behalf of someone else, please select “Authorized agent” and provide your authorization documentation below.",
          jurisdictionLabel: "State or Country (Optional)",
          jurisdictionPlaceholder: "e.g., California, USA",
          firstNameLabel: "First Name (Optional)",
          lastNameLabel: "Last Name (Optional)",
          detailsLabel: "Request Details *",
          detailsPlaceholder: "Please describe your request so our privacy team can assist quickly.",
          detailsHelp:
            "Include any identifiers (account email, timelines, etc.) that will help us locate your records.",
          agentLabel:
            "I am submitting this request as an authorized agent and have supporting documentation.",
          submitIdle: "Submit Privacy Request",
          submitBusy: "Submitting...",
        };

  const siteKey = useMemo(
    () => (env.VITE_RECAPTCHA_SITE_KEY as string) || "",
    []
  );

  const requestTypeOptions = useMemo<Array<{ value: PrivacyRequestType; label: string }>>(
    () => localizedContent.requestTypeOptions,
    [localizedContent.requestTypeOptions]
  );
  const relationshipOptions = useMemo<Array<{ value: PrivacyRelationship; label: string }>>(
    () => localizedContent.relationshipOptions,
    [localizedContent.relationshipOptions]
  );

  useMountEffect(() => {
    if (!siteKey) {
      setCaptchaError(localizedContent.recaptchaMissing);
      return;
    }

    loadRecaptchaScript(siteKey).catch((error) => {
      if (env.DEV) {
        console.error("Failed to initialise reCAPTCHA", error);
      }
      setCaptchaError(localizedContent.recaptchaInitFailed);
    });
  });

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((errors) => {
      if (!errors[field as string]) return errors;
      const { [field as string]: _removed, ...rest } = errors;
      return rest;
    });
  };

  const handleRequestTypeChange = (requestType: PrivacyRequestType) => {
    navigate(
      pathFor(`/privacy-request/${REQUEST_TYPE_SLUG_BY_VALUE[requestType]}`),
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formState.email.trim()) {
      errors.email = localizedContent.emailRequired;
    }

    if (!formState.details.trim()) {
      errors.details = localizedContent.detailsRequired;
    }

    if (!siteKey) {
      errors.recaptcha = localizedContent.securityUnavailable;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildEndpoint = (): string => apiEndpoints.privacyRequests;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setCaptchaError(null);

    if (selectedRequestType === "delete") {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!siteKey) {
      setCaptchaError(localizedContent.securityRetry);
      return;
    }

    setIsSubmitting(true);

    try {
      const recaptchaToken = await executeRecaptchaAction("submit_privacy_request", siteKey);

      const submissionPayload: PrivacyRequestSubmissionPayload = {
        requestType: selectedRequestType,
        email: formState.email.trim(),
        firstName: formState.firstName.trim() || undefined,
        lastName: formState.lastName.trim() || undefined,
        relationship: formState.relationship,
        jurisdiction: formState.jurisdiction.trim() || undefined,
        details: formState.details.trim() || undefined,
        agentVerificationProvided: formState.agentVerificationProvided,
        recaptchaToken,
        source: "web_portal",
      };

      const response = await fetch(buildEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionPayload),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        const errorMessage =
          payload?.error?.message ||
          localizedContent.submitError;
        throw new Error(errorMessage);
      }

      const acknowledgement = payload.data as {
        requestId?: string;
        requiresVerification?: boolean;
      };

      setMessage({
        type: "success",
        text:
          acknowledgement.requiresVerification && submissionPayload.requestType === "opt_out"
            ? localizedContent.optOutSuccess
            : localizedContent.requestSuccess,
      });
      setFormState({
        firstName: "",
        lastName: "",
        email: "",
        relationship: "customer",
        jurisdiction: "",
        details: "",
        agentVerificationProvided: false,
      });
      trackEvent("privacy_request_submitted", {
        request_type: submissionPayload.requestType,
        request_id: acknowledgement?.requestId,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : localizedContent.genericFailure;
      setMessage({
        type: "error",
        text: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Section>
        <SectionTitle>{localizedContent.title}</SectionTitle>
        <SectionDescription>{localizedContent.description}</SectionDescription>

        {message && (
          <MessageBanner $variant={message.type}>
            <strong>
              {message.type === "success"
                ? localizedContent.successTitle
                : localizedContent.errorTitle}
            </strong>
            <span>{message.text}</span>
          </MessageBanner>
        )}

        {captchaError && (
          <MessageBanner $variant="error">
            <strong>{localizedContent.securityTitle}</strong>
            <span>{captchaError}</span>
          </MessageBanner>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Label htmlFor="requestType">{localizedContent.requestTypeLabel}</Label>
            <Select
              id="requestType"
              value={selectedRequestType}
              onChange={(event) =>
                handleRequestTypeChange(event.target.value as PrivacyRequestType)
              }
            >
              {requestTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FieldGroup>

          {selectedRequestType === "delete" ? (
            <>
              <SectionTitle as="h3">{localizedContent.accountDeletionTitle}</SectionTitle>
              <GuidanceLead>{localizedContent.accountDeletionLead}</GuidanceLead>
              <GuidanceList>
                {localizedContent.accountDeletionGuidance.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </GuidanceList>
            </>
          ) : (
            <>
              <FieldGroup>
                <Label htmlFor="email">{localizedContent.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={localizedContent.emailPlaceholder}
                  value={formState.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  $hasError={Boolean(fieldErrors.email)}
                />
                {fieldErrors.email && <HelperText $isError>{fieldErrors.email}</HelperText>}
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="relationship">{localizedContent.relationshipLabel}</Label>
                <Select
                  id="relationship"
                  value={formState.relationship}
                  onChange={(event) =>
                    handleChange("relationship", event.target.value as PrivacyRelationship)}
                >
                  {relationshipOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <HelperText>
                  {localizedContent.relationshipHelp}
                </HelperText>
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="jurisdiction">{localizedContent.jurisdictionLabel}</Label>
                <Input
                  id="jurisdiction"
                  placeholder={localizedContent.jurisdictionPlaceholder}
                  value={formState.jurisdiction}
                  onChange={(event) => handleChange("jurisdiction", event.target.value)}
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="firstName">{localizedContent.firstNameLabel}</Label>
                <Input
                  id="firstName"
                  value={formState.firstName}
                  onChange={(event) => handleChange("firstName", event.target.value)}
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="lastName">{localizedContent.lastNameLabel}</Label>
                <Input
                  id="lastName"
                  value={formState.lastName}
                  onChange={(event) => handleChange("lastName", event.target.value)}
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="details">{localizedContent.detailsLabel}</Label>
                <TextArea
                  id="details"
                  placeholder={localizedContent.detailsPlaceholder}
                  value={formState.details}
                  onChange={(event) => handleChange("details", event.target.value)}
                  $hasError={Boolean(fieldErrors.details)}
                />
                <HelperText>{localizedContent.detailsHelp}</HelperText>
                {fieldErrors.details && <HelperText $isError>{fieldErrors.details}</HelperText>}
              </FieldGroup>

              <ToggleRow>
                <input
                  type="checkbox"
                  checked={formState.agentVerificationProvided}
                  onChange={(event) => handleChange("agentVerificationProvided", event.target.checked)}
                />
                {localizedContent.agentLabel}
              </ToggleRow>

              <ButtonRow>
                <SubmitButton type="submit" disabled={isSubmitting || Boolean(captchaError)}>
                  {isSubmitting ? localizedContent.submitBusy : localizedContent.submitIdle}
                </SubmitButton>
              </ButtonRow>
            </>
          )}
        </Form>
      </Section>
    </Container>
  );
};

export default PrivacyRequestPage;
