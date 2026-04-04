import React from "react";
import styled from "styled-components";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { useTracking } from "./TrackingProvider";
import PrefetchLink from "./PrefetchLink";

const FooterContainer = styled.footer`
  width: 100%;
  margin-top: auto;
  padding-top: 1.5rem;
`;

const FooterPanel = styled.div`
  display: grid;
  gap: 1.4rem;
  padding: 1.45rem 1.45rem 1.1rem;
  border-radius: 1.6rem;
  border: 1px solid rgba(243, 210, 122, 0.12);
  background: rgba(255, 248, 236, 0.04);
`;

const Brand = styled.div`
  display: grid;
  gap: 0.4rem;
`;

const BrandLabel = styled.p`
  margin: 0;
  color: var(--color-accent);
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`;

const BrandText = styled.p`
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1rem;
`;

const AddressText = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
`;

const Meta = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const TopRow = styled.div`
  display: grid;
  gap: 1.2rem;
`;

const BottomRow = styled.div`
  display: grid;
  gap: 0.85rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(243, 210, 122, 0.1);
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 0.7rem;
  justify-content: flex-start;
`;

const SocialLink = styled.a`
  width: 2.6rem;
  height: 2.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.14);
  color: var(--color-text-secondary);

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--color-accent);
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.9rem;
  align-items: center;
`;

const FooterLink = styled(PrefetchLink)`
  color: var(--color-text-muted);
  font-size: 0.77rem;
  letter-spacing: 0.06em;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--color-text-primary);
  }
`;

const FooterButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.77rem;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    opacity: 1;
    color: var(--color-text-primary);
  }
`;

const Copyright = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.76rem;
  letter-spacing: 0.04em;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { openPrivacyPreferences } = useTracking();
  const { pathFor, t } = useI18n();

  return (
    <FooterContainer>
      <FooterPanel>
        <TopRow>
          <Brand>
            <BrandLabel>{t("footer.brandLabel")}</BrandLabel>
            <BrandText>{t("footer.brandText")}</BrandText>
            <AddressText>
              Pack
              <br />
              584 Castro St, Suite #4036
              <br />
              San Francisco, CA 94114
            </AddressText>
          </Brand>

          <Meta>
            <SocialLinks>
              <SocialLink href="https://x.com/trypackai" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                {React.createElement(Twitter, { size: 18 })}
              </SocialLink>
              <SocialLink
                href="https://www.instagram.com/trypackai/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                {React.createElement(Instagram, { size: 18 })}
              </SocialLink>
              <SocialLink
                href="https://www.linkedin.com/company/106734468/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                {React.createElement(Linkedin, { size: 18 })}
              </SocialLink>
            </SocialLinks>
          </Meta>
        </TopRow>

        <BottomRow>
          <FooterLinks>
            <FooterLink to={pathFor("/terms")}>{t("nav.terms")}</FooterLink>
            <FooterLink to={pathFor("/privacy")}>{t("nav.privacy")}</FooterLink>
            <FooterLink to={pathFor("/accessibility")}>{t("nav.accessibility")}</FooterLink>
            <FooterLink to={pathFor("/support")}>{t("nav.support")}</FooterLink>
            <FooterButton type="button" onClick={openPrivacyPreferences}>
              {t("footer.privacyChoices")}
            </FooterButton>
            <FooterLink to={pathFor("/privacy-request")}>{t("nav.privacyRequest")}</FooterLink>
          </FooterLinks>

          <Copyright>{t("footer.copyright", { year: currentYear })}</Copyright>
        </BottomRow>
      </FooterPanel>
    </FooterContainer>
  );
};

export default Footer;
