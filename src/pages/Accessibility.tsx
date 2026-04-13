import styled from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";
import PageSeo from "@/seo/pageSeo";

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

const AccessibilityPage = () => {
  const { locale } = useI18n();
  const localizedContent =
    locale === "es"
      ? {
          title: "Accesibilidad",
          intro:
            "Pack se compromete a ofrecer una experiencia accesible para personas con discapacidad en nuestro sitio web y app.",
          standardsTitle: "Estándares",
          standardsBody:
            "Buscamos cumplir con WCAG 2.2 Nivel AA en nuestras experiencias web y móviles, y revisamos problemas de accesibilidad como parte de las actualizaciones continuas del producto.",
          supportTitle: "Soporte actual",
          supportBody1:
            "Diseñamos con estructura clara, contenido legible, acceso por teclado en el sitio web y compatibilidad con tecnologías de asistencia comunes, como lectores de pantalla. En la app móvil, muchos controles incluyen etiquetas, ayudas y roles semánticos para VoiceOver y TalkBack.",
          supportBody2:
            "Si una función no funciona con tu tecnología de asistencia, queremos saberlo para corregirlo. Si necesitas ayuda con una tarea relacionada con viajes o con un flujo de reserva, nuestro equipo de soporte también puede ayudarte directamente.",
          reportTitle: "Cómo reportar un problema",
          reportBody:
            "Si encuentras una barrera de accesibilidad, escribe a support@trypackai.com con:",
          reportItems: [
            "la página o pantalla y lo que intentabas hacer",
            "tu dispositivo y versión del navegador o app",
            "cualquier tecnología de asistencia que uses (lector de pantalla, control por voz)",
          ],
          responseTitle: "Tiempos de respuesta",
          responseBody:
            "Buscamos responder a reportes de accesibilidad dentro de un día hábil y priorizamos problemas urgentes relacionados con viajes.",
        }
      : {
          title: "Accessibility",
          intro:
            "Pack is committed to providing an accessible experience for people with disabilities across our website and app.",
          standardsTitle: "Standards",
          standardsBody:
            "We aim to meet WCAG 2.2 Level AA for our website and app experiences and we review accessibility issues as part of ongoing product updates.",
          supportTitle: "Current support",
          supportBody1:
            "We design for clear structure, readable content, keyboard access on the website, and compatibility with common assistive technologies such as screen readers. In the mobile app, many controls include accessibility labels, hints, and semantic roles to support VoiceOver and TalkBack.",
          supportBody2:
            "If a feature does not work with your assistive technology, we want to know so we can fix it. If you need help completing a travel-related task or booking flow, our support team can also assist directly.",
          reportTitle: "How to report an issue",
          reportBody:
            "If you encounter an accessibility barrier, email support@trypackai.com with:",
          reportItems: [
            "the page/screen and what you were trying to do",
            "your device + browser/app version",
            "any assistive technology you use (screen reader, voice control)",
          ],
          responseTitle: "Response times",
          responseBody:
            "We aim to respond to accessibility reports within one business day and prioritize urgent travel-related issues.",
        };

  return (
    <Container>
      <PageSeo
        title="Accessibility | Pack"
        description="Learn how Pack supports accessible web and mobile experiences and how to report accessibility issues."
        path="/accessibility"
      />
      <h1>{localizedContent.title}</h1>
      <p>{localizedContent.intro}</p>

      <h2>{localizedContent.standardsTitle}</h2>
      <p>{localizedContent.standardsBody}</p>

      <h2>{localizedContent.supportTitle}</h2>
      <p>{localizedContent.supportBody1}</p>
      <p>{localizedContent.supportBody2}</p>

      <h2>{localizedContent.reportTitle}</h2>
      <p>
        {localizedContent.reportBody.replace("support@trypackai.com", "")}
        <a href="mailto:support@trypackai.com">support@trypackai.com</a>
        :
      </p>
      <ul>
        {localizedContent.reportItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2>{localizedContent.responseTitle}</h2>
      <p>{localizedContent.responseBody}</p>
    </Container>
  );
};

export default AccessibilityPage;
