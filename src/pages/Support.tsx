import styled from "styled-components";
import {useI18n} from "@/i18n/I18nProvider";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.25rem;
  line-height: 1.7;

  h1 {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  h2 {
    font-size: 1.25rem;
    margin-top: 1.75rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 0.75rem;
  }

  ul {
    padding-left: 1.25rem;
    margin-bottom: 0.75rem;
    color: var(--color-text-secondary);
  }

  li {
    margin-bottom: 0.35rem;
  }
`;

const SupportPage = () => {
  const {pathFor, t} = useI18n();
  const [contactIntro, contactOutro] = t("support.contactBody").split(
    "support@trypackai.com",
  );

  return (
    <Container>
      <h1>{t("nav.support")}</h1>
      <p>{t("support.intro")}</p>

      <h2>{t("support.contactHeading")}</h2>
      <p>
        {contactIntro}
        <a href="mailto:support@trypackai.com">
          support@trypackai.com
        </a>{" "}
        {contactOutro}
      </p>

      <h2>{t("support.includeHeading")}</h2>
      <ul>
        <li>{t("support.include1")}</li>
        <li>{t("support.include2")}</li>
        <li>{t("support.include3")}</li>
        <li>{t("support.include4")}</li>
      </ul>

      <h2>{t("support.relatedHeading")}</h2>
      <p>
        {t("support.relatedPrefix")}{" "}
        <a href={pathFor("/privacy-request")}>{t("support.privacyRequestPortal")}</a>.{" "}
        {t("support.relatedMiddle")}{" "}
        <a href={pathFor("/accessibility")}>{t("support.accessibilityPage")}</a>.
      </p>
    </Container>
  );
};

export default SupportPage;
