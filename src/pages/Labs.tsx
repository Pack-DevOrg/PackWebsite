import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { useI18n } from "@/i18n/I18nProvider";

export type LabVideo = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  localPath: string;
};

type ComparisonPair = {
  slug: string;
  title: string;
  description: string;
  leftVideoSlug: LabVideo["slug"];
  rightVideoSlug: LabVideo["slug"];
};

type LabSection = {
  slug: string;
  title: string;
  description: string;
  href: string;
  kicker: string;
};

const labVideos: LabVideo[] = [
  {
    slug: "book-cabo-dachshund",
    title: "Book Cabo Dachshund POV",
    description:
      "First-person dachshund booking concept with a real Pack booking visual and a readable Book Cabo query.",
    tags: ["Cabo", "POV", "Dachshund", "Real app base"],
    localPath:
      "/Users/noahmitsuhashi/Desktop/Projects/windsurf/DoneAll/RouteAds/demo_project/exports/reels_15s_book_cabo_dachshund_v1/ad_001.mp4",
  },
  {
    slug: "book-japan-pov-chaos",
    title: "Book Japan POV Chaos",
    description:
      "Earlier POV proof built through the same template pipeline, centered on Book Japan with a cute-hand chaos setup.",
    tags: ["Japan", "POV", "Cute hand", "Chaos"],
    localPath:
      "/Users/noahmitsuhashi/Desktop/Projects/windsurf/DoneAll/RouteAds/demo_project/exports/reels_15s_book_japan_pov_chaos_v1/ad_001.mp4",
  },
  {
    slug: "dog-book-japan-poc",
    title: "Dog Book Japan POC",
    description:
      "Initial proof-of-concept export used to validate the ad render path before the reusable labs pipeline was added.",
    tags: ["POC", "Japan", "Dog paw"],
    localPath:
      "/Users/noahmitsuhashi/Desktop/Projects/windsurf/DoneAll/RouteAds/demo_project/exports/poc_dog_book_japan.mp4",
  },
];

const comparisonPairs: ComparisonPair[] = [
  {
    slug: "cabo-vs-japan",
    title: "Current Best vs Previous POV",
    description:
      "Compare the stronger Cabo dachshund execution against the earlier Book Japan POV concept.",
    leftVideoSlug: "book-cabo-dachshund",
    rightVideoSlug: "book-japan-pov-chaos",
  },
  {
    slug: "pipeline-evolution",
    title: "POC vs Structured Pipeline",
    description:
      "See the jump from the first proof-of-concept to the later pipeline-driven ad render.",
    leftVideoSlug: "dog-book-japan-poc",
    rightVideoSlug: "book-cabo-dachshund",
  },
];

const labSections: LabSection[] = [
  {
    slug: "live-activities",
    title: "Live Activities",
    description:
      "Inspect the live activity concepts and existing notification-style experiments.",
    href: "/labs/live-activities",
    kicker: "iOS surfaces",
  },
  {
    slug: "videos",
    title: "Videos",
    description:
      "Review exported ad renders, stream them in-browser, or open the original local files.",
    href: "/labs/videos",
    kicker: "Exports and source files",
  },
  {
    slug: "comparisons",
    title: "Comparisons",
    description:
      "Put variants next to each other so it is obvious what improved and what regressed.",
    href: "/labs/comparisons",
    kicker: "Creative review",
  },
];

const videoBySlug = new Map(labVideos.map((video) => [video.slug, video]));

const toFileUrl = (absolutePath: string): string =>
  encodeURI(`file://${absolutePath}`);

const toViteFsUrl = (absolutePath: string): string =>
  `/@fs${encodeURI(absolutePath)}`;

const Page = styled.section`
  min-height: 100vh;
  padding: clamp(1.25rem, 3vw, 2.5rem) 0 clamp(3rem, 6vw, 5rem);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Hero = styled.header`
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 28px;
  padding: clamp(1.5rem, 4vw, 3rem);
  background:
    radial-gradient(circle at top right, rgba(243, 210, 122, 0.18), transparent 28%),
    radial-gradient(circle at 12% 78%, rgba(231, 35, 64, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(23, 19, 16, 0.94), rgba(15, 13, 11, 0.98));
  box-shadow: ${({ theme }) => theme.colors.shadow.dark};
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 1rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.primary.main};
`;

const Title = styled.h1`
  margin: 0;
  max-width: 12ch;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(2.4rem, 7vw, 4.8rem);
  line-height: 0.92;
  letter-spacing: -0.05em;
`;

const Intro = styled.p`
  margin: 1rem 0 0;
  max-width: 56rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: clamp(1rem, 2.2vw, 1.1rem);
  line-height: 1.7;
`;

const HeroNote = styled.div`
  margin-top: 1.35rem;
  display: inline-flex;
  max-width: 54rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 20px;
  padding: 0.9rem 1rem;
  background: rgba(255, 248, 236, 0.05);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SectionCard = styled.article`
  grid-column: span 4;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1.1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const VideoCard = styled.article`
  grid-column: span 6;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};

  @media (max-width: 900px) {
    grid-column: span 1;
  }
`;

const ComparisonCard = styled.article`
  grid-column: span 12;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  border-radius: 24px;
  padding: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 248, 236, 0.06), rgba(255, 248, 236, 0.03)),
    rgba(15, 13, 11, 0.72);
  box-shadow: ${({ theme }) => theme.colors.shadow.medium};
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Meta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const Kicker = styled.span`
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.08);
  padding: 0.35rem 0.7rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: clamp(1.12rem, 2.5vw, 1.35rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
`;

const CardBody = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.96rem;
  line-height: 1.65;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(243, 210, 122, 0.18);
  background: rgba(243, 210, 122, 0.08);
  padding: 0.36rem 0.7rem;
  color: ${({ theme }) => theme.colors.primary.light};
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const BaseAction = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const LinkAction = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8.5rem;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 700;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

const PrimaryLink = styled(BaseAction)`
  color: #14110d;
  background: ${({ theme }) => theme.colors.primary.gradient};
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);
`;

const SecondaryLink = styled(BaseAction)`
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  background: rgba(255, 248, 236, 0.04);
`;

const SectionLink = styled(LinkAction)`
  color: #14110d;
  background: ${({ theme }) => theme.colors.primary.gradient};
  box-shadow: 0 16px 34px rgba(243, 210, 122, 0.2);
`;

const BreadcrumbRow = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const BreadcrumbLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.88rem;
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const PathLabel = styled.code`
  display: block;
  overflow-wrap: anywhere;
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  background: rgba(0, 0, 0, 0.22);
  padding: 0.8rem 0.95rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.84rem;
  line-height: 1.5;
`;

const buildVideoTitle = (title: string) => `Pack Labs | ${title}`;

const labsContent = {
  en: {
    eyebrow: "Pack Labs",
    heroNote:
      "Labs is only available on localhost in Vite dev mode. Video pages use direct file-system paths from your local repo and are not mirrored into deployable public assets.",
    openSection: "Open section",
    openLocalFile: "Open local file",
    openPreview: "Open preview",
    downloadLocalCopy: "Download local copy",
    crumbs: {
      labs: "Labs",
      videos: "Videos",
      comparisons: "Comparisons",
    },
    home: {
      title: "A directory for live activities, videos, and comparisons.",
      description:
        "Use labs as the internal review surface for creative output. Each section is separated so you can inspect surfaces, review exports, and compare variants without mixing contexts.",
      sections: [
        {
          slug: "live-activities",
          title: "Live Activities",
          description:
            "Inspect the live activity concepts and existing notification-style experiments.",
          href: "/labs/live-activities",
          kicker: "iOS surfaces",
        },
        {
          slug: "videos",
          title: "Videos",
          description:
            "Review exported ad renders, stream them in-browser, or open the original local files.",
          href: "/labs/videos",
          kicker: "Exports and source files",
        },
        {
          slug: "comparisons",
          title: "Comparisons",
          description:
            "Put variants next to each other so it is obvious what improved and what regressed.",
          href: "/labs/comparisons",
          kicker: "Creative review",
        },
      ],
    },
    videos: {
      title: "Video exports and original local files.",
      description:
        "Review the mirrored preview, then click through to the original local export path. If your browser does not hand the file off to QuickTime automatically, the same path can still be opened directly in Finder or QuickTime.",
      videos: labVideos,
    },
    comparisons: {
      title: "Side-by-side creative comparisons.",
      description:
        "Keep comparisons explicit. This section is for judging hooks, realism, motion, framing, and which version is closer to a scalable ad system.",
      pairs: comparisonPairs,
    },
  },
  es: {
    eyebrow: "Labs de Pack",
    heroNote:
      "Labs solo está disponible en localhost dentro del modo de desarrollo de Vite. Las páginas de video usan rutas directas al sistema de archivos local y no se copian a assets públicos desplegables.",
    openSection: "Abrir sección",
    openLocalFile: "Abrir archivo local",
    openPreview: "Abrir vista previa",
    downloadLocalCopy: "Descargar copia local",
    crumbs: {
      labs: "Labs",
      videos: "Videos",
      comparisons: "Comparaciones",
    },
    home: {
      title: "Un directorio para live activities, videos y comparaciones.",
      description:
        "Usa labs como la superficie interna de revisión para el trabajo creativo. Cada sección está separada para que puedas inspeccionar superficies, revisar exports y comparar variantes sin mezclar contextos.",
      sections: [
        {
          slug: "live-activities",
          title: "Live Activities",
          description:
            "Inspecciona los conceptos de live activity y los experimentos existentes con estilo de notificación.",
          href: "/labs/live-activities",
          kicker: "Superficies iOS",
        },
        {
          slug: "videos",
          title: "Videos",
          description:
            "Revisa los renders exportados, míralos en el navegador o abre los archivos locales originales.",
          href: "/labs/videos",
          kicker: "Exports y archivos fuente",
        },
        {
          slug: "comparisons",
          title: "Comparaciones",
          description:
            "Pon las variantes una junto a otra para ver con claridad qué mejoró y qué empeoró.",
          href: "/labs/comparisons",
          kicker: "Revisión creativa",
        },
      ],
    },
    videos: {
      title: "Exports de video y archivos locales originales.",
      description:
        "Revisa la vista previa reflejada y luego abre la ruta original del export local. Si el navegador no entrega el archivo a QuickTime automáticamente, la misma ruta se puede abrir directamente en Finder o QuickTime.",
      videos: [
        {
          ...labVideos[0],
          title: "Reserva Cabo POV Dachshund",
          description:
            "Concepto POV en primera persona con un dachshund, una visual real de reserva en Pack y una consulta Book Cabo legible.",
          tags: ["Cabo", "POV", "Dachshund", "Base real de app"],
        },
        {
          ...labVideos[1],
          title: "Caos POV Book Japan",
          description:
            "Prueba POV anterior construida con el mismo pipeline de plantillas, centrada en Book Japan con una configuración caótica de mano tierna.",
          tags: ["Japón", "POV", "Mano tierna", "Caos"],
        },
        {
          ...labVideos[2],
          title: "POC perro Book Japan",
          description:
            "Export inicial de prueba de concepto usado para validar la ruta de render del anuncio antes de agregar el pipeline reutilizable de labs.",
          tags: ["POC", "Japón", "Pata de perro"],
        },
      ],
    },
    comparisons: {
      title: "Comparaciones creativas lado a lado.",
      description:
        "Mantén las comparaciones explícitas. Esta sección sirve para juzgar ganchos, realismo, movimiento, encuadre y qué versión está más cerca de un sistema de anuncios escalable.",
      pairs: [
        {
          ...comparisonPairs[0],
          title: "Mejor actual vs POV anterior",
          description:
            "Compara la ejecución más fuerte de Cabo con dachshund frente al concepto POV anterior de Book Japan.",
        },
        {
          ...comparisonPairs[1],
          title: "POC vs pipeline estructurado",
          description:
            "Observa el salto entre la primera prueba de concepto y el render posterior impulsado por pipeline.",
        },
      ],
    },
  },
} as const;

const LabsShell: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => {
  const { locale } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <Page>
      <Helmet>
        <title>{buildVideoTitle(title)}</title>
        <meta name="description" content={description} />
      </Helmet>

      <Stack>
        <Hero>
          <Eyebrow>{localizedContent.eyebrow}</Eyebrow>
          <Title>{title}</Title>
          <Intro>{description}</Intro>
          <HeroNote>{localizedContent.heroNote}</HeroNote>
        </Hero>
        {children}
      </Stack>
    </Page>
  );
};

export const LabsHomePage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.home.title}
      description={localizedContent.home.description}
    >
      <Grid>
        {localizedContent.home.sections.map((section) => (
          <SectionCard key={section.slug}>
            <Kicker>{section.kicker}</Kicker>
            <CardTitle>{section.title}</CardTitle>
            <CardBody>{section.description}</CardBody>
            <LinkRow>
              <SectionLink to={pathFor(section.href)}>{localizedContent.openSection}</SectionLink>
            </LinkRow>
          </SectionCard>
        ))}
      </Grid>
    </LabsShell>
  );
};

export const LabsVideosPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];

  return (
    <LabsShell
      title={localizedContent.videos.title}
      description={localizedContent.videos.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/videos")}>{localizedContent.crumbs.videos}</BreadcrumbLink>
      </BreadcrumbRow>
      <Grid>
        {localizedContent.videos.videos.map((video) => (
          <VideoCard key={video.slug}>
            <Meta>
              <CardTitle>{video.title}</CardTitle>
              <CardBody>{video.description}</CardBody>
              <TagRow>
                {video.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </TagRow>
              <LinkRow>
                <PrimaryLink
                  href={toFileUrl(video.localPath)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {localizedContent.openLocalFile}
                </PrimaryLink>
                <SecondaryLink
                  href={toViteFsUrl(video.localPath)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {localizedContent.openPreview}
                </SecondaryLink>
                <SecondaryLink href={toViteFsUrl(video.localPath)} download>
                  {localizedContent.downloadLocalCopy}
                </SecondaryLink>
              </LinkRow>
              <PathLabel>{video.localPath}</PathLabel>
            </Meta>
          </VideoCard>
        ))}
      </Grid>
    </LabsShell>
  );
};

export const LabsComparisonsPage: React.FC = () => {
  const { locale, pathFor } = useI18n();
  const localizedContent = labsContent[locale];
  const localizedVideos = new Map(localizedContent.videos.videos.map((video) => [video.slug, video]));

  return (
    <LabsShell
      title={localizedContent.comparisons.title}
      description={localizedContent.comparisons.description}
    >
      <BreadcrumbRow aria-label="Labs breadcrumb">
        <BreadcrumbLink to={pathFor("/labs")}>{localizedContent.crumbs.labs}</BreadcrumbLink>
        <BreadcrumbLink to={pathFor("/labs/comparisons")}>{localizedContent.crumbs.comparisons}</BreadcrumbLink>
      </BreadcrumbRow>
      <Grid>
        {localizedContent.comparisons.pairs.map((pair) => {
          const leftVideo = localizedVideos.get(pair.leftVideoSlug);
          const rightVideo = localizedVideos.get(pair.rightVideoSlug);

          if (!leftVideo || !rightVideo) {
            return null;
          }

          return (
            <ComparisonCard key={pair.slug}>
              <Meta>
                <CardTitle>{pair.title}</CardTitle>
                <CardBody>{pair.description}</CardBody>
              </Meta>
              <ComparisonGrid>
                {[leftVideo, rightVideo].map((video) => (
                  <div key={video.slug}>
                    <Meta>
                      <CardTitle>{video.title}</CardTitle>
                      <TagRow>
                        {video.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </TagRow>
                      <LinkRow>
                        <PrimaryLink
                          href={toFileUrl(video.localPath)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {localizedContent.openLocalFile}
                        </PrimaryLink>
                      </LinkRow>
                    </Meta>
                  </div>
                ))}
              </ComparisonGrid>
            </ComparisonCard>
          );
        })}
      </Grid>
    </LabsShell>
  );
};

const LabsPage: React.FC = () => {
  return <LabsHomePage />;
};

export default LabsPage;
