import React from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { apiEndpoints, publicContactConfig } from '../config/appConfig';
import { useMountEffect } from '../hooks/useMountEffect';
import { useTracking } from '../components/TrackingProvider';
import { useI18n } from '../i18n/I18nProvider';

const PageContainer = styled.main`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Card = styled.section`
  max-width: 520px;
  width: 100%;
  padding: 2.5rem;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.background.card};
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Body = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1.5rem;
`;

const StatusMessage = styled.div<{ $status: 'success' | 'error' | 'loading' }>`
  border-radius: 16px;
  padding: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ $status, theme }) =>
    $status === 'success'
      ? 'rgba(34, 197, 94, 0.12)'
      : $status === 'error'
        ? 'rgba(244, 63, 94, 0.12)'
        : theme.colors.background.input};
`;

const SupportLink = styled.a`
  display: inline-block;
  margin-top: 1.5rem;
  color: ${({ theme }) => theme.colors.primary.main};
  text-decoration: none;
  font-weight: 600;
`;

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';

const shouldRevokeTrackingConsent = (
  verificationResult: { requestType?: string; message?: string } | undefined,
  responseMessage: string | undefined,
): boolean => {
  if (verificationResult?.requestType === 'opt_out') {
    return true;
  }

  // Fall back to the confirmation copy if an older or degraded payload omits the typed result.
  const message = verificationResult?.message ?? responseMessage;
  return typeof message === 'string' && /privacy opt-out request has been confirmed and applied/i.test(message);
};

const PrivacyRequestVerificationPageInstance: React.FC<{
  readonly requestId: string | null;
  readonly token: string | null;
}> = ({ requestId, token }) => {
  const { locale } = useI18n();
  const [status, setStatus] = React.useState<VerificationStatus>('idle');
  const [message, setMessage] = React.useState('');
  const { revokeConsent } = useTracking();
  const localizedContent =
    locale === 'es'
      ? {
          missingDetails:
            'Faltan detalles de verificación de privacidad. Usa el enlace completo de tu correo o contacta a soporte.',
          loadingMessage: 'Confirmando tu solicitud de privacidad…',
          defaultError: 'No pudimos confirmar tu solicitud.',
          successFallback:
            'Hemos confirmado la propiedad de tu solicitud de privacidad y nuestro equipo ha empezado a procesarla.',
          unexpectedError: 'Ocurrió un problema mientras confirmábamos tu solicitud.',
          title: 'Confirmar solicitud de privacidad',
          body:
            'Esta página confirma que el correo electrónico que recibió el enlace controla esta solicitud de privacidad antes de que Pack la procese.',
          successLabel: 'Solicitud enviada',
          errorLabel: 'Hubo un problema',
          captchaLabel: 'Verificación de seguridad no disponible',
          supportLabel: '¿Necesitas ayuda? Contacta a soporte',
        }
      : {
          missingDetails:
            'Missing privacy verification details. Please use the full link from your email or contact support.',
          loadingMessage: 'Confirming your privacy request…',
          defaultError: 'We could not confirm your request.',
          successFallback:
            'We confirmed ownership of your privacy request and our team has started processing it.',
          unexpectedError: 'Something went wrong while confirming your request.',
          title: 'Confirm Privacy Request',
          body:
            'This page confirms that the email address which received the link controls this privacy request before Pack processes it.',
          successLabel: 'Request Submitted',
          errorLabel: 'There was a problem',
          captchaLabel: 'Security Verification Unavailable',
          supportLabel: 'Need help? Contact support',
        };

  useMountEffect(() => {
    if (!requestId || !token) {
      setStatus('error');
      setMessage(localizedContent.missingDetails);
      return;
    }

    const abortController = new AbortController();

    const run = async () => {
      setStatus('loading');
      setMessage(localizedContent.loadingMessage);

      try {
        const response = await fetch(apiEndpoints.privacyRequestsVerify, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestId,
            verificationToken: token,
          }),
          signal: abortController.signal,
        });

        const data = await response.json().catch(() => ({}));
        const errorMessage =
          data?.error?.message ||
          data?.message ||
          localizedContent.defaultError;

        if (!response.ok) {
          throw new Error(errorMessage);
        }

        const verificationResult = data?.data as
          | { requestType?: string; message?: string }
          | undefined;

        setStatus('success');
        if (shouldRevokeTrackingConsent(verificationResult, data?.message)) {
          revokeConsent('revoked');
        }
        setMessage(
          verificationResult?.message ||
            data?.message ||
            localizedContent.successFallback,
        );
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : localizedContent.unexpectedError,
        );
      }
    };

    void run();

    return () => abortController.abort();
  });

  return (
    <PageContainer>
      <Card>
        <Title>{localizedContent.title}</Title>
        <Body>{localizedContent.body}</Body>
        <StatusMessage
          $status={status === 'loading' || status === 'idle' ? 'loading' : status}
        >
          {message || localizedContent.loadingMessage}
        </StatusMessage>
        <SupportLink href={`mailto:${publicContactConfig.supportEmail}`}>
          {localizedContent.supportLabel}
        </SupportLink>
      </Card>
    </PageContainer>
  );
};

const PrivacyRequestVerificationPage: React.FC = () => {
  const query = new URLSearchParams(useLocation().search);
  const requestId = query.get('requestId');
  const token = query.get('token');

  return (
    <PrivacyRequestVerificationPageInstance
      key={`${requestId ?? '__missing__'}:${token ?? '__missing__'}`}
      requestId={requestId}
      token={token}
    />
  );
};

export default PrivacyRequestVerificationPage;
