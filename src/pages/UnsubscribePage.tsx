import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useI18n } from '../i18n/I18nProvider';
import { apiEndpoints } from '../config/appConfig';
import { useMountEffect } from '../hooks/useMountEffect';

const PageContainer = styled.main`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Card = styled.section`
  max-width: 480px;
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

type UnsubscribeStatus = 'idle' | 'loading' | 'success' | 'error';

const UnsubscribePageInstance: React.FC<{readonly token: string | null}> = ({
  token,
}) => {
  const { locale } = useI18n();
  const [status, setStatus] = React.useState<UnsubscribeStatus>('idle');
  const [message, setMessage] = React.useState<string>('');
  const localizedContent =
    locale === 'es'
      ? {
          missingToken:
            'Falta el token de cancelación. Revisa el enlace o contacta al soporte.',
          processing: 'Procesando tu solicitud…',
          unableToUnsubscribe: 'No fue posible cancelar la suscripción.',
          success: 'Tu suscripción fue cancelada correctamente.',
          genericError: 'Ocurrió un problema al procesar tu solicitud.',
          title: 'Administra tus preferencias',
          body:
            'Respetamos tus decisiones. Puedes volver a suscribirte en cualquier momento desde la configuración de tu cuenta o uniéndote de nuevo a la lista de espera.',
          support: '¿Necesitas ayuda? Contacta al soporte',
        }
      : {
          missingToken:
            'Missing unsubscribe token. Please check your link or contact support.',
          processing: 'Processing your request…',
          unableToUnsubscribe: 'Unable to unsubscribe.',
          success: 'You have been unsubscribed successfully.',
          genericError: 'Something went wrong while processing your request.',
          title: 'Manage Your Preferences',
          body:
            'We respect your choices. You can resubscribe at any time from your account settings or by joining the waitlist again.',
          support: 'Need help? Contact support',
        };

  useMountEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(localizedContent.missingToken);
      return;
    }

    const abortController = new AbortController();

    const run = async () => {
      setStatus('loading');
      setMessage(localizedContent.processing);

      try {
        const response = await fetch(apiEndpoints.waitlistUnsubscribe, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unsubscribeToken: token }),
          signal: abortController.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || localizedContent.unableToUnsubscribe);
        }

        setStatus('success');
        setMessage(data.message || localizedContent.success);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : localizedContent.genericError,
        );
      }
    };

    void run();

    return () => abortController.abort();
  });

  return (
    <>
      <Helmet>
        <title>{localizedContent.title} | Pack</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <PageContainer>
        <Card>
          <Title>{localizedContent.title}</Title>
          <Body>{localizedContent.body}</Body>
          <StatusMessage
            $status={status === 'loading' || status === 'idle' ? 'loading' : status}
          >
            {message || localizedContent.processing}
          </StatusMessage>
          <SupportLink href="mailto:support@trypackai.com">
            {localizedContent.support}
          </SupportLink>
        </Card>
      </PageContainer>
    </>
  );
};

const UnsubscribePage: React.FC = () => {
  const { locale } = useI18n();
  const query = new URLSearchParams(useLocation().search);
  const token = query.get('token');

  return (
    <UnsubscribePageInstance
      key={`${locale}:${token ?? '__missing__'}`}
      token={token}
    />
  );
};

export default UnsubscribePage;
