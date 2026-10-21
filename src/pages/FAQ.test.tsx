import React from "react";
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../styles/ThemeProvider";
import TrackingProvider from "../components/TrackingProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import FAQ from "./FAQ";

// Spanish is not a publicly routed locale yet (config.test.ts), but its FAQ copy
// ships in the module, so the test forces the locale to render it.
let mockLocaleOverride: "es" | null = null;
jest.mock("../i18n/I18nProvider", () => {
  const actual = jest.requireActual("../i18n/I18nProvider");
  return {
    ...actual,
    useI18n: () => {
      const value = actual.useI18n();
      return mockLocaleOverride ? { ...value, locale: mockLocaleOverride } : value;
    },
  };
});

type Support =
  | { kind: "policy"; heading: string; policy: string[] }
  | { kind: "product"; sourceId: string }
  | { kind: "absence"; absent: string[] };

type Claim = { en: string; es: string; support: Support };

const SAFEGUARDS =
  "We use reasonable administrative, technical, and organizational safeguards designed to protect personal information.";
const NO_GUARANTEE =
  "However, no method of transmission, storage, or processing is completely secure, and we cannot guarantee absolute security.";
const SECURITY: Support = {
  kind: "policy",
  heading: "Data Security and Retention",
  policy: [SAFEGUARDS, NO_GUARANTEE],
};

// Support map: every factual sentence in a privacy answer -> the policy section and the
// policy text that backs it. The test reads public/PrivacyPolicy.md and asserts each
// mapped policy text exists under that heading, and that the answer shows the sentence.
const SUPPORT: Record<string, Claim[]> = {
  "data-privacy": [
    {
      en: "We use reasonable administrative, technical, and organizational safeguards designed to protect your personal information, but no method of transmission, storage, or processing is completely secure, so we cannot guarantee absolute security.",
      es: "Usamos medidas de protección administrativas, técnicas y organizativas razonables, pensadas para proteger tu información personal, pero ningún método de transmisión, almacenamiento o procesamiento es completamente seguro, así que no podemos garantizar una seguridad absoluta.",
      support: SECURITY,
    },
    {
      en: "We keep personal information for as long as reasonably necessary for the purposes described in our Privacy Policy.",
      es: "Conservamos la información personal durante el tiempo razonablemente necesario para los fines descritos en nuestra Política de Privacidad.",
      support: {
        kind: "policy",
        heading: "Data Security and Retention",
        policy: [
          "We retain personal information for as long as reasonably necessary for the purposes described in this Privacy Policy",
        ],
      },
    },
    {
      en: "If you delete your account, disconnect a data source, or ask us to delete information, we will delete or anonymize it within a reasonable period, subject to backup, legal, fraud-prevention, audit, and similar retention needs.",
      es: "Si eliminas tu cuenta, desconectas una fuente de datos o nos pides eliminar información, la eliminaremos o la anonimizaremos en un plazo razonable, sujeto a necesidades de respaldo, legales, de prevención de fraude, de auditoría y similares.",
      support: {
        kind: "policy",
        heading: "Data Security and Retention",
        policy: [
          "If you delete your account, disconnect a data source, or ask us to delete information, we will delete or anonymize it within a reasonable period subject to backup, legal, fraud-prevention, audit, and similar retention needs.",
        ],
      },
    },
    {
      en: "Depending on where you live, you may also have the right to ask for access to, correction of, or deletion of your personal information, and you can make those requests through our privacy request page.",
      es: "Según dónde vivas, también puedes tener derecho a pedir acceso a tu información personal, su corrección o su eliminación, y puedes hacer esas solicitudes desde nuestra página de solicitudes de privacidad.",
      support: {
        kind: "policy",
        heading: "Your Privacy Rights",
        policy: [
          "Depending on where you live, you may have rights to:",
          "request access to personal information we hold about you",
          "request correction of inaccurate personal information",
          "request deletion of personal information, subject to legal exceptions",
          "To exercise privacy rights, contact support@trypackai.com or use our [privacy request page](/privacy-request).",
        ],
      },
    },
  ],
  "data-usage": [
    {
      en: "Depending on how you use Pack, we may collect contact and account details such as your name, email address, and phone number, plus information you choose to provide or connect, such as travel confirmations, itineraries, calendar data, and the contents of emails.",
      es: "Según cómo uses Pack, podemos recopilar datos de contacto y de cuenta, como tu nombre, correo electrónico y número de teléfono, además de la información que decidas proporcionar o conectar, como confirmaciones de viaje, itinerarios, datos del calendario y el contenido de correos electrónicos.",
      support: {
        kind: "policy",
        heading: "Information You Provide Directly",
        policy: [
          "Depending on how you use the Services, we may collect:",
          "such as your name, email address, phone number",
          "information you choose to provide or connect through the Services",
          "travel confirmations, itineraries, traveler details, contents of emails, calendar data",
        ],
      },
    },
    {
      en: "That can include sensitive details like government-issued ID or precise geolocation if you choose to provide or enable them.",
      es: "Eso puede incluir datos sensibles, como un documento de identidad oficial o tu ubicación precisa, si decides proporcionarlos o activarlos.",
      support: {
        kind: "policy",
        heading: "Information You Provide Directly",
        policy: [
          "government-issued ID (e.g., passport, driver’s license, Social Security number)",
          "location signals you enable (including precise geolocation)",
        ],
      },
    },
    {
      en: "We and our service providers may also automatically collect technical information such as your browser, operating system, device type, and approximate location based on IP, along with usage details like pages viewed, searches, and clicks.",
      es: "Nosotros y nuestros proveedores de servicios también podemos recopilar automáticamente información técnica, como tu navegador, sistema operativo, tipo de dispositivo y ubicación aproximada según la IP, además de datos de uso, como páginas vistas, búsquedas y clics.",
      support: {
        kind: "policy",
        heading: "Information Collected Automatically",
        policy: [
          "We and our service providers may automatically collect:",
          "such as browser type, operating system, device type, language, approximate geolocation based on IP",
          "such as pages or screens viewed, searches, clicks",
        ],
      },
    },
    {
      en: "We use sensitive information only to provide, secure, support, and improve our services, or as otherwise permitted by law.",
      es: "Usamos la información sensible solo para ofrecer, proteger, respaldar y mejorar nuestros servicios, o según lo permita la ley.",
      support: {
        kind: "policy",
        heading: "Sensitive Information",
        policy: [
          "Some information you provide or connect may be considered sensitive under certain laws",
          "We use this information only to provide, secure, support, and improve the Services, or as otherwise permitted by law.",
        ],
      },
    },
  ],
  "booking-security": [
    {
      en: "Pack helps coordinate flights and hotels, then lets you complete the booking flow inside Pack.",
      es: "Pack ayuda a coordinar vuelos y hoteles, y te permite completar todo el flujo de reserva dentro de Pack.",
      support: { kind: "product", sourceId: "what-can-pack-book" },
    },
    {
      en: "Our Privacy Policy says we share personal information with travel suppliers and partners if and when you ask us to help facilitate a travel booking, booking inquiry, or related travel service.",
      es: "Nuestra Política de Privacidad dice que compartimos información personal con proveedores y socios de viaje si y cuando nos pides ayuda con una reserva de viaje, una consulta de reserva o un servicio de viaje relacionado.",
      support: {
        kind: "policy",
        heading: "How We Share Information",
        policy: [
          "We may disclose personal information in the following circumstances:",
          "if and when you ask us to help facilitate a travel booking, booking inquiry, or related travel service.",
        ],
      },
    },
    {
      en: "It also says we use reasonable administrative, technical, and organizational safeguards designed to protect personal information, and that no method of transmission, storage, or processing is completely secure.",
      es: "También dice que usamos medidas de protección administrativas, técnicas y organizativas razonables, pensadas para proteger la información personal, y que ningún método de transmisión, almacenamiento o procesamiento es completamente seguro.",
      support: SECURITY,
    },
    {
      en: "The policy does not describe how payment cards are handled, so we will not say more here than it does.",
      es: "La política no describe cómo se manejan las tarjetas de pago, así que aquí no diremos más de lo que dice ella.",
      support: {
        kind: "absence",
        absent: ["credit card", "debit card", "card number", "payment card"],
      },
    },
  ],
  "technology-security": [
    {
      en: "Our Privacy Policy speaks to how we protect personal information, not to how reliable the app is, so we will not make reliability claims here.",
      es: "Nuestra Política de Privacidad habla de cómo protegemos la información personal, no de qué tan confiable es la app, así que aquí no haremos afirmaciones sobre confiabilidad.",
      support: { kind: "absence", absent: ["reliab", "uptime"] },
    },
    {
      en: "In it, we say we use reasonable administrative, technical, and organizational safeguards designed to protect personal information.",
      es: "En ella decimos que usamos medidas de protección administrativas, técnicas y organizativas razonables, pensadas para proteger la información personal.",
      support: { kind: "policy", heading: "Data Security and Retention", policy: [SAFEGUARDS] },
    },
    {
      en: "We also say that no method of transmission, storage, or processing is completely secure, and that we cannot guarantee absolute security.",
      es: "También decimos que ningún método de transmisión, almacenamiento o procesamiento es completamente seguro y que no podemos garantizar una seguridad absoluta.",
      support: { kind: "policy", heading: "Data Security and Retention", policy: [NO_GUARANTEE] },
    },
  ],
};

// Closing lines are navigation, not facts.
const CLOSING = {
  en: {
    base: "You can read the full Privacy Policy here.",
    choices: " To ask about or delete your information, visit Your Privacy Choices.",
    link: "Privacy Policy",
    choicesLink: "Your Privacy Choices",
  },
  es: {
    base: "Puedes leer la Política de Privacidad completa aquí.",
    choices: " Para consultar o eliminar tu información, visita Tus opciones de privacidad.",
    link: "Política de Privacidad",
    choicesLink: "Tus opciones de privacidad",
  },
} as const;
const CHOICES_IDS = ["data-privacy", "data-usage"];

// Claims that are not sentences of the legally reviewed policy.
const NON_POLICY_CLAIMS =
  /encrypt|cifrad|industry-standard|est[áa]ndar de la industria|gdpr|rgpd|complian|cumplimiento|secure payment|pagos seguros|stored safely|almacenad\w+ de forma segura|top priorit|principales prioridades|privacy-focused|enfoque en privacidad|bank-level|100%|\bsafe(ly)?\b|never sell|nunca vendemos/i;

const norm = (text: string) => text.replace(/\s+/g, " ").trim();

const policyText = norm(
  fs.readFileSync(path.resolve(__dirname, "../../public/PrivacyPolicy.md"), "utf8"),
);
const policyRaw = fs.readFileSync(
  path.resolve(__dirname, "../../public/PrivacyPolicy.md"),
  "utf8",
);

const sectionText = (heading: string): string => {
  const lines = policyRaw.split("\n");
  const start = lines.findIndex((line) => /^#{2,3} /.test(line) && line.replace(/^#+ /, "") === heading);
  if (start < 0) return "";
  const level = lines[start].match(/^#+/)![0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const m = lines[i].match(/^(#+) /);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return norm(lines.slice(start, end).join("\n"));
};

const renderFaq = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <HelmetProvider>
        <ThemeProvider>
          <TrackingProvider>
            <I18nProvider>
              <FAQ />
            </I18nProvider>
          </TrackingProvider>
        </ThemeProvider>
      </HelmetProvider>
    </MemoryRouter>,
  );

const openAll = () => {
  for (const button of screen.getAllByRole("button", { expanded: false })) {
    if (button.getAttribute("aria-controls")?.startsWith("faq-answer-")) {
      fireEvent.click(button);
    }
  }
};

const answerText = (id: string) =>
  norm(document.getElementById(`faq-answer-${id}`)?.textContent ?? "");

describe("FAQ privacy answers summarise the Privacy Policy", () => {
  it("every mapped claim is backed by text under its heading in PrivacyPolicy.md", () => {
    for (const [id, claims] of Object.entries(SUPPORT)) {
      for (const claim of claims) {
        const s = claim.support;
        if (s.kind === "policy") {
          const section = sectionText(s.heading);
          expect(section).not.toBe("");
          for (const snippet of s.policy) {
            expect([id, snippet, section.includes(norm(snippet))]).toEqual([id, snippet, true]);
          }
        } else if (s.kind === "absence") {
          for (const term of s.absent) {
            expect([id, term, policyText.toLowerCase().includes(term)]).toEqual([id, term, false]);
          }
        }
      }
      expect(claims.length).toBeGreaterThanOrEqual(2);
      expect(claims.length).toBeLessThanOrEqual(4);
    }
  });

  it.each(["en", "es"] as const)("%s: each answer is exactly its mapped sentences plus the policy link", (locale) => {
    mockLocaleOverride = locale === "es" ? "es" : null;
    renderFaq("/faq");
    openAll();
    const closing = CLOSING[locale];

    for (const [id, claims] of Object.entries(SUPPORT)) {
      const answer = document.getElementById(`faq-answer-${id}`)!;
      expect(answer).not.toBeNull();
      let remaining = answerText(id);

      for (const claim of claims) {
        const sentence = norm(claim[locale]);
        expect([id, sentence, remaining.includes(sentence)]).toEqual([id, sentence, true]);
        if (claim.support.kind === "product") {
          const source = answerText(claim.support.sourceId);
          expect(source).toContain(sentence);
        }
        remaining = norm(remaining.replace(sentence, ""));
      }

      // Nothing but the closing navigation lines may remain.
      const expectedClosing = norm(closing.base + (CHOICES_IDS.includes(id) ? closing.choices : ""));
      expect(remaining).toBe(expectedClosing);

      expect(answerText(id)).not.toMatch(NON_POLICY_CLAIMS);

      expect(within(answer).getByRole("link", { name: closing.link })).toHaveAttribute("href", "/privacy");
      if (CHOICES_IDS.includes(id)) {
        expect(within(answer).getByRole("link", { name: closing.choicesLink })).toHaveAttribute(
          "href",
          "/privacy-request",
        );
      }
    }
  });
});
