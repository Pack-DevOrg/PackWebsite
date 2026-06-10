import styled from "styled-components";
import {Link} from "react-router-dom";
import {useI18n} from "@/i18n/I18nProvider";
import PageSeo from "@/seo/pageSeo";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 1.25rem 5rem;
  text-align: center;

  h1 {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }

  p {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
  }
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem 1.5rem;

  a {
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const notFoundContent = {
  en: {
    title: "Page not found",
    body: "The page you are looking for does not exist or may have moved. Here are some useful places to go next.",
    links: [
      {href: "/", label: "Home"},
      {href: "/features", label: "Features"},
      {href: "/how-it-works", label: "How It Works"},
      {href: "/faq", label: "FAQ"},
      {href: "/support", label: "Support"},
    ],
  },
  es: {
    title: "Página no encontrada",
    body: "La página que buscas no existe o se ha movido. Aquí tienes algunos lugares útiles para continuar.",
    links: [
      {href: "/", label: "Inicio"},
      {href: "/features", label: "Funciones"},
      {href: "/how-it-works", label: "Cómo funciona"},
      {href: "/faq", label: "Preguntas frecuentes"},
      {href: "/support", label: "Soporte"},
    ],
  },
} as const;

const NotFoundPage = () => {
  const {locale, pathFor} = useI18n();
  const content = notFoundContent[locale === "es" ? "es" : "en"];

  return (
    <Container>
      <PageSeo
        title="Page Not Found | Pack"
        description="The page you are looking for does not exist. Explore Pack's AI trip planning features, FAQ, and support resources."
        path="/404"
        robots="noindex, nofollow"
      />
      <h1>{content.title}</h1>
      <p>{content.body}</p>
      <LinkList>
        {content.links.map((link) => (
          <li key={link.href}>
            <Link to={pathFor(link.href)}>{link.label}</Link>
          </li>
        ))}
      </LinkList>
    </Container>
  );
};

export default NotFoundPage;
