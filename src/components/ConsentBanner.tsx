/**
 * ConsentBanner - Privacy-compliant consent management for tracking
 * 
 * Features:
 * - GDPR and CCPA compliant consent collection
 * - Granular consent options
 * - Persistent consent storage
 * - Smooth animations and UX
 * - Mobile-optimized design
 * 
 * Integrates with TrackingProvider for comprehensive tracking management
 */

import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTracking } from './TrackingProvider';

import {getCookie} from '../utils/cookies';
import {env} from '../utils/env';
import {CONSENT_COOKIE_KEY, CONSENT_MAX_AGE_SECONDS, CONSENT_TIMESTAMP_COOKIE_KEY} from '../constants/consent';
import {DEFAULT_CONSENT_PREFERENCES, type ConsentPreferences} from '../tracking/consent';
import {useMountEffect} from '../hooks/useMountEffect';
import {useI18n} from '../i18n/I18nProvider';
import {
  getAcceptanceNoticeLegalCopy,
  getConsentBannerLegalCopy,
} from '../legal/legalUiCopy';
import {OPEN_PRIVACY_PREFERENCES_EVENT} from './TrackingProvider';

// Animations
const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
`;

// Styled components
const BannerContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible' && prop !== 'isClosing',
})<{ isVisible: boolean; isClosing: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-top: 2px solid #f92f60;
  padding: 1.5rem;
  z-index: 10000;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  
  animation: ${props => 
    props.isClosing 
      ? slideDown 
      : props.isVisible 
        ? slideUp 
        : 'none'
  } 0.3s ease-out forwards;
  
  display: ${props => props.isVisible || props.isClosing ? 'block' : 'none'};

  @media (max-width: 768px) {
    padding: 0.85rem 0.9rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
    max-height: min(48svh, 28rem);
    overflow-y: auto;
    border-top-width: 1px;
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
  }

  @media (max-width: 430px) {
    padding: 0.7rem 0.75rem calc(0.7rem + env(safe-area-inset-bottom, 0px));
    max-height: min(39svh, 18.5rem);
    border-top-left-radius: 0.9rem;
    border-top-right-radius: 0.9rem;
  }
`;

const BannerContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  @media (max-width: 430px) {
    gap: 0.55rem;
  }
`;

const TextContent = styled.div`
  flex: 1;
  color: #ffffff;

  @media (max-width: 430px) {
    display: grid;
    gap: 0.3rem;
  }
`;

const BannerTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #f92f60;

  @media (max-width: 768px) {
    margin-bottom: 0.35rem;
    font-size: 0.95rem;
  }

  @media (max-width: 430px) {
    margin-bottom: 0;
    font-size: 0.85rem;
    line-height: 1.1;
  }
`;

const BannerText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #cccccc;
  
  a {
    color: #f92f60;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
    line-height: 1.4;
  }

  @media (max-width: 430px) {
    font-size: 0.75rem;
    line-height: 1.32;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  @media (max-width: 430px) {
    gap: 0.5rem;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'minimal'; disabled?: boolean }>`
  padding: ${props => props.$variant === 'minimal' ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;

  ${({ disabled }) =>
    disabled
      ? `
        opacity: 0.55;
        cursor: not-allowed;
        pointer-events: none;
      `
      : ''}

  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #f92f60 0%, #e91e63 100%);
          color: white;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(249, 47, 96, 0.4);
          }
        `;
      case 'secondary':
        return `
          background: transparent;
          color: #ffffff;
          border: 2px solid #444444;
          
          &:hover {
            border-color: #f92f60;
            color: #f92f60;
          }
        `;
      case 'minimal':
      default:
        return `
          background: transparent;
          color: #cccccc;
          text-decoration: underline;
          
          &:hover {
            color: #f92f60;
          }
        `;
    }
  }}

  @media (max-width: 768px) {
    width: 100%;
    min-width: 0;
    padding: ${({ $variant }) => ($variant === 'minimal' ? '0.55rem 0.8rem' : '0.75rem 0.95rem')};
    font-size: 0.82rem;
  }

  @media (max-width: 430px) {
    padding: ${({ $variant }) => ($variant === 'minimal' ? '0.46rem 0.65rem' : '0.68rem 0.75rem')};
    font-size: 0.76rem;
    border-radius: 0.85rem;
  }
`;

const MobileButtonSpan = styled.div`
  @media (max-width: 768px) {
    grid-column: 1 / -1;
  }
`;

const GpcNotice = styled.div`
  margin: 0 0 0.9rem 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #ffecb3;
  font-size: 0.85rem;
  line-height: 1.5;

  @media (max-width: 430px) {
    margin-bottom: 0.45rem;
    padding: 0.55rem 0.7rem;
    font-size: 0.75rem;
    line-height: 1.35;
  }
`;

const SettingsModal = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
`;

const SettingsContent = styled.div`
  background: #2d2d2d;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const SettingsTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #f92f60;
  font-size: 1.5rem;
`;

const SettingItem = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #444444;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  color: #ffffff;
`;

const SettingCheckbox = styled.input`
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  accent-color: #f92f60;
`;

const SettingText = styled.div`
  flex: 1;
`;

const SettingName = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
`;

const SettingDescription = styled.div`
  font-size: 0.85rem;
  color: #cccccc;
  line-height: 1.4;
`;

const ConsentBanner: React.FC = () => {
  const {locale, pathFor, t} = useI18n();
  const legalCopy = getConsentBannerLegalCopy(locale);
  const acceptanceNotice = getAcceptanceNoticeLegalCopy(locale);
  const {applyConsentDecision, gpcApplies} = useTracking();
  const [showBanner, setShowBanner] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    ...DEFAULT_CONSENT_PREFERENCES,
  });

  const isTestEnv =
    (typeof globalThis !== 'undefined' && Boolean((globalThis as {__TEST_ENV__?: unknown}).__TEST_ENV__)) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test');

  // Check if user has made a consent decision
  useMountEffect(() => {
    let storedStatus: string | null = null;
    let storedTimestamp: string | null = null;

    try {
      storedStatus =
        getCookie(CONSENT_COOKIE_KEY) ??
        (typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('tracking-consent')
          : null);

      storedTimestamp =
        getCookie(CONSENT_TIMESTAMP_COOKIE_KEY) ??
        (typeof window !== 'undefined' && window.localStorage
          ? window.localStorage.getItem('tracking-consent-timestamp')
          : null);
    } catch (error) {
      if (env.DEV && !isTestEnv) {
        console.warn('Unable to read stored consent preferences', error);
      }
    }

    const timestampValue = storedTimestamp ? Number.parseInt(storedTimestamp, 10) : Number.NaN;
    const isExpired =
      storedStatus &&
      Number.isFinite(timestampValue) &&
      Date.now() - timestampValue > CONSENT_MAX_AGE_SECONDS * 1000;

    if (!storedStatus || isExpired) {
      setShowBanner(true);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedPreferences = window.localStorage.getItem('tracking-preferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences) as ConsentPreferences);
        }
      }
    } catch (error) {
      if (env.DEV && !isTestEnv) {
        console.warn('Unable to restore consent preferences', error);
      }
    }
  });

  useMountEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOpenPrivacyPreferences = () => {
      setIsClosing(false);
      setShowBanner(false);
      setShowSettings(true);
    };

    window.addEventListener(
      OPEN_PRIVACY_PREFERENCES_EVENT,
      handleOpenPrivacyPreferences,
    );

    return () => {
      window.removeEventListener(
        OPEN_PRIVACY_PREFERENCES_EVENT,
        handleOpenPrivacyPreferences,
      );
    };
  });

  const handleAcceptAll = () => {
    if (gpcApplies) {
      applyConsentDecision({status: 'gpc', preferences: DEFAULT_CONSENT_PREFERENCES});
      closeBanner();
      return;
    }

    const newPreferences = {
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    setPreferences(newPreferences);
    applyConsentDecision({status: 'granted', preferences: newPreferences});
    closeBanner();
  };

  const handleRejectAll = () => {
    const newPreferences = {
      analytics: false,
      marketing: false,
      functional: true,
    };
    
    setPreferences(newPreferences);
    applyConsentDecision({status: 'rejected', preferences: newPreferences});
    closeBanner();
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  const handleSavePreferences = () => {
    const hasTrackingConsent = preferences.analytics || preferences.marketing;
    const normalizedPreferences: ConsentPreferences = {
      ...preferences,
      functional: true,
    };

    const status = hasTrackingConsent ? 'partial' : 'rejected';
    applyConsentDecision({status, preferences: normalizedPreferences});

    setShowSettings(false);
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowBanner(false);
      setIsClosing(false);
    }, 300);
  };

  const handlePreferenceChange = (key: keyof ConsentPreferences, value: boolean) => {
    if (key === 'functional') {
      return;
    }
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!showBanner && !isClosing && !showSettings) {
    return null;
  }

  return (
    <>
      <BannerContainer 
        isVisible={showBanner} 
        isClosing={isClosing}
        data-testid="consent-banner"
      >
        <BannerContent>
          <TextContent>
            <BannerTitle>{legalCopy.title}</BannerTitle>
            {gpcApplies && (
              <GpcNotice>
                {legalCopy.gpcNotice}
              </GpcNotice>
            )}
            <BannerText>
              {legalCopy.bannerPart1}{' '}
              <a href={pathFor('/terms')} target="_blank" rel="noopener noreferrer">
                {acceptanceNotice.termsLabel}
              </a>{' '}
              {legalCopy.bannerPart2}{' '}
              <a href={pathFor('/privacy')} target="_blank" rel="noopener noreferrer">
                {acceptanceNotice.privacyLabel}
              </a>.
            </BannerText>
          </TextContent>
          
          <ButtonGroup>
            <MobileButtonSpan>
              <Button $variant="minimal" onClick={handleCustomize}>
                {t('consent.customize')}
              </Button>
            </MobileButtonSpan>
            <Button $variant="secondary" onClick={handleRejectAll}>
              {t('consent.rejectAll')}
            </Button>
            <Button $variant="primary" onClick={handleAcceptAll} disabled={gpcApplies}>
              {t('consent.acceptAll')}
            </Button>
          </ButtonGroup>
        </BannerContent>
      </BannerContainer>

      <SettingsModal isOpen={showSettings}>
        <SettingsContent>
          <SettingsTitle>{legalCopy.settingsTitle}</SettingsTitle>
          {gpcApplies && (
            <GpcNotice>
              {legalCopy.settingsGpcNotice}
            </GpcNotice>
          )}
          
          <SettingItem>
            <SettingLabel>
              <SettingCheckbox
                type="checkbox"
                checked={preferences.functional}
                disabled
                onChange={() => undefined}
              />
              <SettingText>
                <SettingName>{legalCopy.functionalName}</SettingName>
                <SettingDescription>
                  {legalCopy.functionalDescription}
                </SettingDescription>
              </SettingText>
            </SettingLabel>
          </SettingItem>

          <SettingItem>
            <SettingLabel>
              <SettingCheckbox
                type="checkbox"
                checked={preferences.analytics}
                disabled={gpcApplies}
                onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
              />
              <SettingText>
                <SettingName>{legalCopy.analyticsName}</SettingName>
                <SettingDescription>
                  {legalCopy.analyticsDescription}
                </SettingDescription>
              </SettingText>
            </SettingLabel>
          </SettingItem>

          <SettingItem>
            <SettingLabel>
              <SettingCheckbox
                type="checkbox"
                checked={preferences.marketing}
                disabled={gpcApplies}
                onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
              />
              <SettingText>
                <SettingName>{legalCopy.marketingName}</SettingName>
                <SettingDescription>
                  {legalCopy.marketingDescription}
                </SettingDescription>
              </SettingText>
            </SettingLabel>
          </SettingItem>

          <ButtonGroup>
            <Button $variant="secondary" onClick={() => setShowSettings(false)}>
              {legalCopy.cancel}
            </Button>
            <Button $variant="primary" onClick={handleSavePreferences}>
              {legalCopy.savePreferences}
            </Button>
          </ButtonGroup>
        </SettingsContent>
      </SettingsModal>
    </>
  );
};

export default ConsentBanner;
