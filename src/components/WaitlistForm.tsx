/**
 * WaitlistForm.tsx
 *
 * Purpose:
 * Interactive waitlist registration form for the Pack website with comprehensive
 * validation, reCAPTCHA protection, and smooth user experience. Handles email collection,
 * form validation, bot protection, and provides visual feedback throughout the submission process.
 *
 * Key Features:
 * - Real-time email validation with regex checking
 * - Google reCAPTCHA v3 integration for bot protection
 * - Animated form states (loading, success, error)
 * - Responsive design with theme integration
 * - Comprehensive error handling and user feedback
 * - Privacy policy and terms of service integration
 *
 * Key Components:
 * - WaitlistForm: Main form component with validation and submission
 * - Form input with validation states
 * - Success and error state animations
 * - Privacy policy links and compliance features
 *
 * Dependencies:
 * - React: Component state and lifecycle management
 * - styled-components: CSS-in-JS styling with theme integration
 * - lucide-react: Icon components
 * - react-router-dom: Navigation and linking
 * - Google reCAPTCHA v3: Bot protection and validation
 *
 * Usage:
 * Used on the main landing page to collect user email addresses for the waitlist.
 * Integrates with backend API for email storage and validation.
 */

import React, { useState } from "react";
import styled, {
  createGlobalStyle,
  ThemeProps,
  useTheme,
  css,
} from "styled-components";
import { Loader2, Check, AlertCircle, Twitter, Shield } from "lucide-react";
import { useConversionTracking } from "../hooks/useConversionTracking";
import { useMountEffect } from "../hooks/useMountEffect";
import { env } from '../utils/env';
import { submitToEncryptedWaitlist, checkEncryptedWaitlistStatus } from "../services/encryptedWaitlistService";
import { executeRecaptchaAction, loadRecaptchaScript } from "../utils/recaptcha";
import { getCookie } from '../utils/cookies';
import { usePerformance } from "./PerformanceProvider";
import {
  ConsentStatusSchema,
  deriveConsentState,
  parseConsentPreferences,
  type ConsentStatus,
} from '../tracking/consent';
import {
  CONSENT_COOKIE_KEY,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_TIMESTAMP_COOKIE_KEY,
} from '../constants/consent';
import { apiEndpoints } from "../config/appConfig";
import { useI18n } from "../i18n/I18nProvider";
import { getAcceptanceNoticeLegalCopy } from "../legal/legalUiCopy";
import { initiateLogin } from "@/auth/cognito";

// Add global styles for animations
const GlobalStyle = createGlobalStyle`
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @keyframes skeleton {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Styled spinning loader component
const SpinningLoader = styled(Loader2)`
  animation: spin 1.2s linear infinite;
  margin-right: 10px;
  
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Skeleton loading component
const SkeletonLoader = styled.div`
  height: 50px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  background-size: 200px 100%;
  animation: skeleton 1.5s ease-in-out infinite;
  border-radius: var(--border-radius);
  margin-bottom: ${(props) => props.theme.spacing[3]};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const fadeSequence = css`
  opacity: 0;
  transform: translateY(18px);
  animation: waitlistFadeUp 420ms ease-out both;

  @keyframes waitlistFadeUp {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  [data-reduce-motion='true'] & {
    animation: none;
    opacity: 1;
    transform: none;
  }
`;

const generateMarketingEventId = (): string =>
  `evt_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const getAttributionParams = () => {
  if (typeof window === 'undefined') {
    return {gclid: undefined, wbraid: undefined, gbraid: undefined, ttclid: undefined};
  }

  const params = new URLSearchParams(window.location.search);
  return {
    gclid: params.get('gclid') ?? undefined,
    wbraid: params.get('wbraid') ?? undefined,
    gbraid: params.get('gbraid') ?? undefined,
    ttclid: params.get('ttclid') ?? undefined,
  };
};

const getMetaClickId = (cookieKey: '_fbc' | '_fbp'): string | undefined => {
  try {
    const value = getCookie(cookieKey);
    return value ?? undefined;
  } catch (error) {
    if (env.DEV) {
      console.warn('Unable to read Meta attribution cookie', { cookieKey, error });
    }
    return undefined;
  }
};

const getTikTokCookie = (): string | undefined => {
  try {
    const value = getCookie('_ttp');
    return value ?? undefined;
  } catch (error) {
    if (env.DEV) {
      console.warn('Unable to read TikTok attribution cookie', {error});
    }
    return undefined;
  }
};

const readMarketingTrackingConsent = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const gpcEnabled =
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

  let storedStatusRaw: string | null = null;
  let storedTimestampRaw: string | null = null;
  let storedPreferencesJson: string | null = null;

  try {
    storedStatusRaw =
      getCookie(CONSENT_COOKIE_KEY) ??
      (typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('tracking-consent')
        : null);

    storedTimestampRaw =
      getCookie(CONSENT_TIMESTAMP_COOKIE_KEY) ??
      (typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('tracking-consent-timestamp')
        : null);

    storedPreferencesJson =
      typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('tracking-preferences')
        : null;
  } catch (error) {
    if (env.DEV) {
      console.warn('Unable to read stored tracking consent', error);
    }
    return false;
  }

  const parsedStatus: ConsentStatus | null = storedStatusRaw
    ? ConsentStatusSchema.safeParse(storedStatusRaw).success
      ? (storedStatusRaw as ConsentStatus)
      : null
    : null;

  if (!parsedStatus) {
    return false;
  }

  const timestampValue = storedTimestampRaw ? Number.parseInt(storedTimestampRaw, 10) : Number.NaN;
  const isExpired =
    Number.isFinite(timestampValue) &&
    Date.now() - timestampValue > CONSENT_MAX_AGE_SECONDS * 1000;

  if (isExpired) {
    return false;
  }

  const preferences = parseConsentPreferences(storedPreferencesJson);

  const derived = deriveConsentState({
    status: parsedStatus,
    preferences,
    gpcEnabled,
  });

  return derived.hasMarketingConsent;
};

type WaitlistFormVariant = 'default' | 'hero' | 'embedded';

interface WaitlistFormProps {
  variant?: WaitlistFormVariant;
  onSuccess?: (email: string) => void;
  showLegalNotice?: boolean;
  showTitle?: boolean;
}

const FormContainer = styled.section<{ $variant: WaitlistFormVariant }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 640px);
  max-width: 640px;
  margin: ${({ $variant, theme }) =>
    $variant === 'hero'
      ? `${theme.spacing[1]} auto ${theme.spacing[3]}`
      : $variant === 'embedded'
        ? '0 auto'
        : `${theme.spacing[5]} auto`};
  padding: ${({ $variant, theme }) =>
    $variant === 'hero'
      ? `${theme.spacing[3]} ${theme.spacing[4]} ${theme.spacing[4]}`
      : $variant === 'embedded'
        ? `${theme.spacing[1]} 0 0`
      : `${theme.spacing[4]} ${theme.spacing[4]} ${theme.spacing[5]}`};
  border-radius: var(--border-radius);
  background-color: ${({ $variant, theme }) =>
    $variant === 'hero'
      ? 'rgba(12, 12, 15, 0.85)'
      : $variant === 'embedded'
        ? 'transparent'
        : theme.colors.background.card};
  box-shadow: ${({ $variant, theme }) =>
    $variant === 'hero'
      ? theme.colors.shadow.medium
      : $variant === 'embedded'
        ? 'none'
        : theme.colors.shadow.dark};
  border: ${({ $variant, theme }) =>
    $variant === 'hero'
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : $variant === 'embedded'
        ? '0'
      : `1px solid ${theme.colors.border.medium}`};
  position: relative;
  overflow: ${({ $variant }) => ($variant === 'embedded' ? 'visible' : 'hidden')};
  backdrop-filter: ${({ $variant }) => ($variant === 'hero' ? 'blur(16px)' : 'none')};
  ${fadeSequence};

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.gradients.primaryAccent};
    background-size: 200% 200%;
    animation: gradientShift 4s ease infinite;
    opacity: ${({ $variant }) =>
      $variant === 'hero' ? 0.6 : $variant === 'embedded' ? 0 : 1};
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

const FormTitle = styled.h2<{ $variant: WaitlistFormVariant }>`
  font-size: ${({ theme, $variant }) =>
    $variant === 'hero' ? theme.typography.fontSizes['2xl'] : theme.typography.fontSizes.xl};
  margin-bottom: ${({ theme, $variant }) =>
    $variant === 'hero' ? theme.spacing[2] : theme.spacing[3]};
  line-height: 1.08;
  text-align: center;
  background: ${({ theme }) => theme.colors.gradients.primaryAccent};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  font-weight: ${({ theme }) => theme.typography.fontWeights.bold};
  padding-bottom: 0.08em;
  ${fadeSequence};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: ${(props) => props.theme.spacing[3]};
  width: 100%;
  min-width: 0;
`;

const EmailInput = styled.input`
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: ${(props) => props.theme.spacing[2]}
    ${(props) => props.theme.spacing[3]};
  background-color: ${(props) => props.theme.colors.background.input};
  border: 1px solid ${(props) => props.theme.colors.border.input};
  border-radius: var(--border-radius); /* Kept as CSS var for now */
  color: ${(props) => props.theme.colors.text.primary};
  transition: all 0.3s ease;
  height: 50px;
  font-size: 16px;
  line-height: 1.2;
  letter-spacing: 0.01em;
  box-shadow: ${(props) => props.theme.colors.shadow.light};
  appearance: none;
  -webkit-appearance: none;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary.main};
    background-color: ${(props) => props.theme.colors.background.inputFocus};
    box-shadow: ${(props) => props.theme.colors.shadow.primary};
    transform: translateY(-2px);
  }

  &::placeholder {
    color: ${(props) => props.theme.colors.text.placeholder};
    transition: all 0.3s ease;
  }

  &:focus::placeholder {
    opacity: 0.7;
    transform: translateX(4px);
  }

  &:focus-visible {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary.main};
    box-shadow:
      ${(props) => props.theme.colors.shadow.primary},
      0 0 0 3px rgba(243, 210, 122, 0.18);
  }

  &.error {
    border-color: ${(props) => props.theme.colors.error.main};
    animation: shake 0.4s ease-in-out;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-5px);
    }
    40%,
    80% {
      transform: translateX(5px);
    }
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: ${(props) => props.theme.spacing[1]};
  margin-bottom: ${(props) => props.theme.spacing[3]};
  width: 100%;
`;

const Checkbox = styled.input`
  accent-color: ${(props) => props.theme.colors.primary.main};
  align-self: center;
`;

const CheckboxLabel = styled.label`
  display: block;
  font-size: ${(props) => props.theme.typography.fontSizes.small};
  color: ${(props) => props.theme.colors.text.secondary};
  text-align: center;
`;

const CollectionNotice = styled.p`
  margin: ${(props) => props.theme.spacing[2]} 0 0;
  font-size: ${(props) => props.theme.typography.fontSizes.small};
  line-height: 1.5;
  color: ${(props) => props.theme.colors.text.primary};
  opacity: 0.78;
  text-align: center;

  a {
    color: ${(props) => props.theme.colors.primary.main};
    text-decoration: none;
  }

  a:hover,
  a:focus-visible {
    text-decoration: underline;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: ${(props) => props.theme.spacing[2]};
  background: ${(props) => props.theme.colors.gradients.primaryAccent};
  background-size: 200% auto;
  color: white;
  border-radius: var(--border-radius);
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  letter-spacing: 0.03em;
  transition: all 0.3s ease;
  height: 50px;
  box-shadow: ${(props) => props.theme.colors.shadow.primary};
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
  appearance: none;
  -webkit-appearance: none;
  outline: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: all 0.6s ease;
  }

  &:hover:not(:disabled) {
    background-position: right center;
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.colors.shadow.primaryHover};

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
    box-shadow: ${(props) => props.theme.colors.shadow.primaryActive};
  }

  &:focus-visible {
    border-color: rgba(243, 210, 122, 0.42);
    box-shadow:
      ${(props) => props.theme.colors.shadow.primary},
      0 0 0 3px rgba(243, 210, 122, 0.18);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    filter: grayscale(40%);
  }
`;

const GoogleLoginButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 1rem;
  border: 1px solid transparent;
  background:
    linear-gradient(#131314, #131314) padding-box,
    linear-gradient(
        135deg,
        rgba(243, 210, 122, 0.92) 0%,
        rgba(231, 35, 64, 0.9) 62%,
        rgba(248, 230, 179, 0.9) 100%
      )
      border-box;
  color: #e3e3e3;
  font-weight: 800;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  font-family:
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
  font-size: 0.875rem;
  line-height: 1.25rem;
  letter-spacing: 0.01em;
  text-align: center;
  transition: background 180ms ease, transform 180ms ease, opacity 180ms ease;

  &:hover:not(:disabled) {
    background:
      linear-gradient(#1e1f20, #1e1f20) padding-box,
      linear-gradient(
          135deg,
          rgba(243, 210, 122, 0.96) 0%,
          rgba(231, 35, 64, 0.94) 62%,
          rgba(248, 230, 179, 0.94) 100%
        )
        border-box;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 12px 28px rgba(0, 0, 0, 0.28),
      0 0 0 3px rgba(243, 210, 122, 0.18);
  }

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }
`;

const GoogleLogoWrap = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
`;

const ButtonDivider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  margin: ${({ theme }) => `${theme.spacing[3]} 0`};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.small};
  text-align: center;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.12);
  }
`;

const ErrorMessage = styled.div`
  color: ${(props) => props.theme.colors.error.main};
  font-size: ${(props) => props.theme.typography.fontSizes.small};
  margin-top: ${(props) => props.theme.spacing[1]};
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spacing[1]};
`;

const SuccessMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${(props) => props.theme.spacing[3]};
  padding: ${(props) => props.theme.spacing[3]};
  width: 100%;
  ${fadeSequence};
`;

const SuccessHeading = styled.h3`
  font-size: ${(props) => props.theme.typography.fontSizes.xl};
  font-weight: ${(props) => props.theme.typography.fontWeights.bold};
  background: ${(props) => props.theme.colors.success.gradient};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  margin: 0;
`;

const SuccessCopy = styled.p`
  color: ${(props) => props.theme.colors.text.secondary};
  font-size: ${(props) => props.theme.typography.fontSizes.base};
  margin: 0;
`;

const ShareContainer = styled.div`
  margin-top: ${(props) => props.theme.spacing[3]};
  ${fadeSequence};
`;

const SuccessIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${(props) => props.theme.colors.gradients.success};
  color: white; /* Direct white for icon */
  margin-bottom: ${(props) => props.theme.spacing[2]};
  box-shadow: ${(props) => props.theme.colors.shadow.success};
`;

const MessageArea = styled.div<{ $type: "error" | "success" | "info" }>`
  padding: ${(props) => props.theme.spacing[3]};
  margin-top: ${(props) => props.theme.spacing[3]};
  border-radius: var(--border-radius);
  font-size: ${(props) => props.theme.typography.fontSizes.small};
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${(props) => props.theme.spacing[2]};
  background-color: ${(props) => {
    if (props.$type === "error") return `rgba(239, 68, 68, 0.15)`;
    if (props.$type === "success") return `rgba(16, 185, 129, 0.15)`;
    return `rgba(240, 198, 45, 0.15)`;
  }};
  color: ${(props) => {
    if (props.$type === "error") return props.theme.colors.error.main;
    if (props.$type === "success") return props.theme.colors.success.main;
    return props.theme.colors.secondary.main;
  }};
  border: 1px solid
    ${(props) => {
      if (props.$type === "error") return props.theme.colors.error.main;
      if (props.$type === "success") return props.theme.colors.success.main;
      return props.theme.colors.secondary.main;
    }};
  box-shadow: ${(props) => {
    if (props.$type === "error") return "0 4px 12px rgba(239, 68, 68, 0.2)";
    if (props.$type === "success") return "0 4px 12px rgba(16, 185, 129, 0.2)";
    return "0 4px 12px rgba(240, 198, 45, 0.2)";
  }};
  
  /* Animation for error shake */
  ${(props) => props.$type === "error" && `
    animation: errorPulse 0.6s ease-in-out;
    @keyframes errorPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  [data-reduce-motion='true'] & {
    animation: none;
  }
`;

// Lightweight ambient glow that gives the card depth without shipping extra assets.
const CircleDecoration = styled.div`
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.primary.main} 0%,
    rgba(255, 255, 255, 0) 70%
  );
  opacity: 0.1;
  z-index: -1;
`;

const GoogleMark: React.FC = () => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#4285F4"
      d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2582h2.9086c1.7018-1.5668 2.6837-3.8741 2.6837-6.6155Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1791l-2.9086-2.2582c-.8059.54-1.8368.8591-3.0478.8591-2.3441 0-4.3282-1.5823-5.0364-3.7091H.9568v2.3318A8.9997 8.9997 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.9636 10.7127A5.4108 5.4108 0 0 1 3.6818 9c0-.5945.1023-1.1727.2818-1.7127V4.9555H.9568A8.9996 8.9996 0 0 0 0 9c0 1.4518.3477 2.8268.9568 4.0445l3.0068-2.3318Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.5782c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5814C13.4632.8918 11.426 0 9 0A8.9997 8.9997 0 0 0 .9568 4.9555l3.0068 2.3318C4.6718 5.1605 6.6559 3.5782 9 3.5782Z"
    />
  </svg>
);

/**
 * WaitlistForm Component
 *
 * Interactive form component for collecting email addresses for the Pack waitlist.
 * Provides comprehensive validation, bot protection, and smooth user experience.
 *
 * Features:
 * - Real-time email validation with visual feedback
 * - Google reCAPTCHA v3 integration for security
 * - Animated loading, success, and error states
 * - Click-through privacy and terms notice with links
 * - Responsive design with theme integration
 *
 * @returns JSX element containing the complete waitlist form
 */
const WaitlistForm: React.FC<WaitlistFormProps> = ({
  variant = 'default',
  onSuccess,
  showLegalNotice = true,
  showTitle = true,
}) => {
  const { locale, pathFor, t } = useI18n();
  const acceptanceNotice = getAcceptanceNoticeLegalCopy(locale);
  const isHeroVariant = variant === 'hero';
  const { reduceAnimations } = usePerformance();
  const formId = React.useId();
  const [email, setEmail] = useState("");
  const [marketingEmailOptIn, setMarketingEmailOptIn] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [message, setMessage] = useState<{
    type: "error" | "success" | "info";
    text: string;
  } | null>(null);
  const hasTrackedFormStartRef = React.useRef(false);
  const theme = useTheme();
  
  // Conversion tracking
  const { trackCTAClick, trackFormStart, trackFormSubmit, trackConversion } = useConversionTracking();
  
  // Check if encrypted waitlist is available
  const encryptedStatus = checkEncryptedWaitlistStatus();

  const trackInitialFormIntent = React.useCallback(() => {
    if (hasTrackedFormStartRef.current) {
      return;
    }

    hasTrackedFormStartRef.current = true;
    trackFormStart('waitlist_form', {
      form_name: 'waitlist_signup',
      page_section: isHeroVariant ? 'hero_cta' : 'main_cta',
      event_category: 'engagement',
    });
  }, [isHeroVariant, trackFormStart]);

  /**
   * Validates email format using RFC 5322 compliant regex
   * @param email - Email address to validate
   * @returns True if email format is valid, false otherwise
   */
  const validateEmail = (email: string): boolean => {
    // Use a more permissive regex that follows RFC 5322 standard
    const regex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return regex.test(email);
  };

  // Prime reCAPTCHA only after explicit user intent.
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const recaptchaPrimePromiseRef = React.useRef<Promise<void> | null>(null);

  const primeRecaptcha = async (): Promise<void> => {
    if (recaptchaLoaded) {
      return;
    }

    if (recaptchaPrimePromiseRef.current) {
      return recaptchaPrimePromiseRef.current;
    }

    const siteKey = (env.VITE_RECAPTCHA_SITE_KEY as string) || '';
    if (!siteKey) {
      if (env.DEV) {
        console.warn("reCAPTCHA site key not found");
      }
      throw new Error("reCAPTCHA site key not configured");
    }

    const primePromise = loadRecaptchaScript(siteKey)
      .then(() => {
        setRecaptchaLoaded(true);
      })
      .catch((error) => {
        if (env.DEV) {
          console.error("Failed to load reCAPTCHA", error);
        }
        setCaptchaError("Security verification unavailable. Please refresh the page.");
        throw error;
      })
      .finally(() => {
        recaptchaPrimePromiseRef.current = null;
      });

    recaptchaPrimePromiseRef.current = primePromise;
    return primePromise;
  };

  /**
   * Executes Google reCAPTCHA v3 challenge for bot protection
   * @returns Promise resolving to reCAPTCHA token or null if failed
   * @throws Error if reCAPTCHA is not loaded or execution fails
   */
  const executeRecaptcha = async (): Promise<string | null> => {
    const siteKey = (env.VITE_RECAPTCHA_SITE_KEY as string) || '';
    if (!siteKey) {
      throw new Error("reCAPTCHA site key not configured");
    }
    await primeRecaptcha();
    return executeRecaptchaAction("submit_waitlist", siteKey);
  };

  /**
   * Handles form submission with validation, reCAPTCHA, and API integration
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackInitialFormIntent();

    // Reset errors
    setEmailError("");
    setCaptchaError("");
    setSubmitError("");

    // Validate email
    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Execute reCAPTCHA v3 and submit form
    setIsLoading(true);

    try {
      // Execute reCAPTCHA
      let recaptchaToken = null;
      try {
        recaptchaToken = await executeRecaptcha();
      } catch (error) {
        if (env.DEV) {
          console.error("Error executing reCAPTCHA:", error);
        }
        setCaptchaError(
          "Failed to verify you are human. Please refresh and try again."
        );
        setIsLoading(false);
        return;
      }

      const hasMarketingTrackingConsent = readMarketingTrackingConsent();

      const marketingEventId = hasMarketingTrackingConsent ? generateMarketingEventId() : undefined;
      const {gclid, wbraid, gbraid, ttclid} = getAttributionParams();
      const fbc = hasMarketingTrackingConsent ? getMetaClickId('_fbc') : undefined;
      const fbp = hasMarketingTrackingConsent ? getMetaClickId('_fbp') : undefined;
      const ttp = hasMarketingTrackingConsent ? getTikTokCookie() : undefined;

      // Prepare request data
      const requestData = {
        email,
        timestamp: new Date().toISOString(),
        source: window.location.hostname,
        ...(typeof recaptchaToken === 'string' && recaptchaToken.length > 0
          ? {recaptchaToken}
          : {}),
        marketingConsent: hasMarketingTrackingConsent,
        marketingEmailConsent: marketingEmailOptIn,
        ageConfirmed: true,
        ...(marketingEventId ? {eventId: marketingEventId} : {}),
        ...(hasMarketingTrackingConsent ? {gclid, wbraid, gbraid, ttclid, ttp, fbc, fbp} : {}),
      };

      // Check if we should use encrypted waitlist (dev mode)
      let data;
      if (encryptedStatus.available) {
        if (env.DEV) {
          console.log('Using encrypted waitlist for development');
        }
        
        // Use encrypted waitlist service
        const encryptedResult = await submitToEncryptedWaitlist(requestData);
        
        if (!encryptedResult.success) {
          throw new Error(encryptedResult.message);
        }
        
        // Format response to match existing structure
        data = {
          success: encryptedResult.success,
          message: encryptedResult.message,
          encrypted: encryptedResult.encrypted,
          ccpaCompliant: encryptedResult.ccpaCompliant,
        };
      } else {
        // Use encrypted waitlist (production mode with PII encryption)
        const API_ENDPOINT = apiEndpoints.waitlistSubscribe;

        // Request options
        const requestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        };

        // Call the API endpoint
        let response;
        try {
          response = await fetch(API_ENDPOINT, requestOptions);
          data = await response.json();
        } catch (error) {
          if (env.DEV) {
            console.error("API endpoint call failed:", error);
          }
          throw new Error("Failed to connect to server");
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to submit form");
        }
      }

      setIsSubmitted(true);
      
      // Track successful form completion
      trackFormSubmit('waitlist_form', {
        form_name: 'waitlist_signup',
        page_section: isHeroVariant ? 'hero_cta' : 'main_cta',
        event_category: 'conversion',
        value: 1,
        event_id: marketingEventId,
        gclid: hasMarketingTrackingConsent ? gclid : undefined,
        wbraid: hasMarketingTrackingConsent ? wbraid : undefined,
        gbraid: hasMarketingTrackingConsent ? gbraid : undefined,
        ttclid: hasMarketingTrackingConsent ? ttclid : undefined,
        ttp: hasMarketingTrackingConsent ? ttp : undefined,
      });

      // Track waitlist join conversion
      trackConversion('generate_lead', {
        event_category: 'conversion',
        event_label: 'waitlist_signup_success',
        value: 1,
        conversion_type: 'lead_generation',
        event_id: marketingEventId,
        form_name: 'waitlist_signup',
        page_section: isHeroVariant ? 'hero_cta' : 'main_cta',
        gclid: hasMarketingTrackingConsent ? gclid : undefined,
        wbraid: hasMarketingTrackingConsent ? wbraid : undefined,
        gbraid: hasMarketingTrackingConsent ? gbraid : undefined,
        ttclid: hasMarketingTrackingConsent ? ttclid : undefined,
        ttp: hasMarketingTrackingConsent ? ttp : undefined,
      });
      
      // Show success message
      setMessage({
        type: "success",
        text: "✅ Success! Welcome to the waitlist."
      });
      onSuccess?.(email);
    } catch (error) {
      if (env.DEV) {
        console.error("Error submitting form:", error);
      }
      const errorMessage = error instanceof Error
        ? error.message
        : "An error occurred. Please try again.";
      setSubmitError(errorMessage);
      
      // Set message area for better visibility
      setMessage({
        type: "error",
        text: `❌ ${errorMessage} Please check your connection and try again.`
      });
      
      // Clear message after 8 seconds
      setTimeout(() => setMessage(null), 8000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isGoogleLoading || isLoading) {
      return;
    }

    trackInitialFormIntent();
    setSubmitError("");
    setCaptchaError("");
    setMessage(null);
    setIsGoogleLoading(true);

    trackCTAClick(
      isHeroVariant ? "Hero Waitlist Google Login" : "Waitlist Google Login",
      isHeroVariant ? "hero_waitlist_google_login" : "waitlist_google_login"
    );

    try {
      const redirectPath =
        typeof window === "undefined"
          ? pathFor("/")
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;

      await initiateLogin({
        redirectPath,
        useCanonicalOrigin: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to start Google sign-in. Please try again.";
      setSubmitError(errorMessage);
      setMessage({
        type: "error",
        text: `❌ ${errorMessage}`,
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      <FormContainer
        $variant={variant}
      >
        {!isSubmitted ? (
          <>
            {!isHeroVariant && !reduceAnimations && (
              <>
                <CircleDecoration
                  style={{
                    width: '200px',
                    height: '200px',
                    top: '-100px',
                    left: '-50px',
                    opacity: 0.05,
                  }}
                />
                <CircleDecoration
                  style={{
                    width: '150px',
                    height: '150px',
                    bottom: '-50px',
                    right: '-50px',
                    opacity: 0.05,
                  }}
                />
              </>
            )}

          {showTitle ? (
            <FormTitle $variant={variant}>
              {t("waitlist.title")}
            </FormTitle>
          ) : null}
          <Form onSubmit={handleSubmit}>
              <GoogleLoginButton
                type="button"
                onClick={() => {
                  void handleGoogleSignup();
                }}
                disabled={isGoogleLoading || isLoading}
              >
                <GoogleLogoWrap>
                  <GoogleMark />
                </GoogleLogoWrap>
                {isGoogleLoading ? t("common.redirectingGoogle") : t("waitlist.googleCta")}
              </GoogleLoginButton>

              <ButtonDivider>{t("waitlist.useEmailInstead")}</ButtonDivider>

              <InputGroup>
                <EmailInput
                  type="email"
                  placeholder={t("waitlist.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? "error" : ""}
                  aria-label={t("waitlist.emailPlaceholder")}
                  required
                  onFocus={(e) => {
                    e.target.placeholder = "";
                    void primeRecaptcha().catch(() => undefined);
                    trackInitialFormIntent();
                  }}
                  onBlur={(e) => (e.target.placeholder = t("waitlist.emailPlaceholder"))}
                />
                {emailError && (
                  <ErrorMessage>
                    <AlertCircle size={14} style={{ minWidth: "14px" }} />
                    {emailError}
                  </ErrorMessage>
                )}
              </InputGroup>

              <CheckboxGroup>
                <Checkbox
                  type="checkbox"
                  id={`marketing-${formId}`}
                  checked={marketingEmailOptIn}
                  onChange={(e) => setMarketingEmailOptIn(e.target.checked)}
                  aria-label="Marketing email consent"
                />
                <CheckboxLabel htmlFor={`marketing-${formId}`}>
                  {t("waitlist.marketingOptIn")}
                  <br />
                  {t("waitlist.unsubscribeAnytime")}
                </CheckboxLabel>
              </CheckboxGroup>

              {/* reCAPTCHA v3 is invisible - no UI element needed */}
              {captchaError && (
                <ErrorMessage style={{ margin: theme.spacing[3] + " 0" }}>
                  <AlertCircle size={14} style={{ minWidth: "14px" }} />
                  {captchaError}
                </ErrorMessage>
              )}

              <SubmitButton type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <SpinningLoader size={20} />
                    {t("waitlist.processing")}
                  </>
                ) : (
                  t("waitlist.done")
                )}
              </SubmitButton>

              {showLegalNotice ? (
                <CollectionNotice>
                  {acceptanceNotice.prefix}{" "}
                  <a href={pathFor("/terms")}>{acceptanceNotice.termsLabel}</a>{" "}
                  {acceptanceNotice.middle}{" "}
                  <a href={pathFor("/privacy")}>{acceptanceNotice.privacyLabel}</a>.{" "}
                  {acceptanceNotice.suffix}{" "}
                  <a href={pathFor("/privacy-request")}>
                    {acceptanceNotice.privacyChoicesLabel}
                  </a>.
                </CollectionNotice>
              ) : null}

              {submitError && (
                <ErrorMessage
                  style={{
                    marginTop: theme.spacing[2],
                    justifyContent: "center",
                  }}
                >
                  <AlertCircle size={14} style={{ minWidth: "14px" }} />
                  {submitError}
                </ErrorMessage>
              )}
              {message && (
                <MessageArea $type={message.type}>{message.text}</MessageArea>
              )}
            </Form>
          </>
        ) : (
          <SuccessMessage>
            <SuccessIconContainer>
              <Check size={32} />
            </SuccessIconContainer>
            <SuccessHeading>
              You're on the list!
            </SuccessHeading>
            <SuccessCopy>
              We'll email you at {email} with updates. Follow us for more news!
            </SuccessCopy>
            <ShareContainer>
              <a
                href="https://twitter.com/intent/tweet?text=I%20just%20joined%20the%20waitlist%20for%20Route%2C%20the%20future%20of%20travel%20planning!%20Check%20it%20out%20at%20https://trypackai.com%20%40trypackai"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                  background: theme.colors.background.secondary,
                  borderRadius: "var(--border-radius)",
                  color: theme.colors.text.primary,
                  textDecoration: "none",
                  fontSize: theme.typography.fontSizes.small,
                  transition: "all 0.3s ease",
                }}
              >
                <Twitter size={16} style={{ marginRight: theme.spacing[1] }} />
                Share the excitement
              </a>
            </ShareContainer>
          </SuccessMessage>
        )}
      </FormContainer>
    </>
  );
};

export default WaitlistForm;
