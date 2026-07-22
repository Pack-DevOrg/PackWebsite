import manifest from "../../public/videos/features/features.json";
import { SITE_ORIGIN, buildAbsoluteUrl } from "./pageSeo";
import { FEATURE_MEDIA_BASE } from "@/components/FeaturePhone";

/**
 * VideoObject structured data for the feature demo clips, built from the
 * demo pipeline's export manifest so the SEO facts (duration, upload date,
 * file and poster URLs) can never drift from the files actually shipped.
 * Google's video indexing reads these; the sitemap's <video:video> entries
 * are generated from the same manifest at prerender time.
 */
interface FeatureClipManifestEntry {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  readonly file: string;
  readonly poster: string;
  readonly duration: number;
}

const clips: readonly FeatureClipManifestEntry[] = manifest.features;

const isoDuration = (seconds: number) => `PT${Math.max(1, Math.round(seconds))}S`;

/** `pagePath` anchors the schema `@id` to the page embedding the clip. */
export function createFeatureVideoSchema(
  screenId: string,
  pagePath: string,
): Record<string, unknown> | null {
  const clip = clips.find((entry) => entry.id === screenId);
  if (!clip) return null;
  return {
    "@type": "VideoObject",
    "@id": `${buildAbsoluteUrl(pagePath)}#video-${clip.id}`,
    name: `Pack app demo — ${clip.title}`,
    description: clip.blurb,
    thumbnailUrl: `${SITE_ORIGIN}${FEATURE_MEDIA_BASE}/${clip.poster}`,
    contentUrl: `${SITE_ORIGIN}${FEATURE_MEDIA_BASE}/${clip.file}`,
    uploadDate: manifest.recordedAt,
    duration: isoDuration(clip.duration),
    inLanguage: "en",
    isFamilyFriendly: true,
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
  };
}

export function createAllFeatureVideoSchemas(
  pagePath: string,
): readonly Record<string, unknown>[] {
  return clips
    .map((clip) => createFeatureVideoSchema(clip.id, pagePath))
    .filter((schema): schema is Record<string, unknown> => schema !== null);
}
