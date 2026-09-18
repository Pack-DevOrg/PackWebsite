/**
 * Daily lake series `site.web-vitals` from PostHog HogQL (query-web-vitals).
 * The analytics export calls `buildWebVitalsLakeRow` with the query result.
 */

export const SITE_WEB_VITALS_SERIES = 'site.web-vitals' as const;

export const QUERY_WEB_VITALS_HOGQL = `
SELECT
  toStartOfDay(timestamp) AS day,
  properties.$web_vital_name AS vital,
  avg(toFloat(properties.$web_vital_value)) AS avg_value,
  quantile(0.75)(toFloat(properties.$web_vital_value)) AS p75_value,
  count() AS samples
FROM events
WHERE event = '$web_vitals'
  AND timestamp >= now() - INTERVAL 1 DAY
GROUP BY day, vital
ORDER BY day, vital
`.trim();

export type WebVitalQueryRow = {
  readonly day: string;
  readonly vital: 'LCP' | 'INP' | 'CLS' | string;
  readonly avg_value: number;
  readonly p75_value: number;
  readonly samples: number;
};

export type SiteWebVitalsLakeRow = {
  readonly seriesName: typeof SITE_WEB_VITALS_SERIES;
  readonly ts: string;
  readonly commit: string | null;
  readonly env: 'dev' | 'prod' | 'local';
  readonly dimensions: {readonly vital: string};
  readonly values: {
    readonly avg: number;
    readonly p75: number;
    readonly samples: number;
  };
};

export const buildWebVitalsLakeRows = (
  rows: readonly WebVitalQueryRow[],
  options: {readonly env: SiteWebVitalsLakeRow['env']; readonly commit: string | null},
): SiteWebVitalsLakeRow[] =>
  rows.map((row) => ({
    seriesName: SITE_WEB_VITALS_SERIES,
    ts: new Date(`${row.day}T00:00:00.000Z`).toISOString(),
    commit: options.commit,
    env: options.env,
    dimensions: {vital: row.vital},
    values: {
      avg: row.avg_value,
      p75: row.p75_value,
      samples: row.samples,
    },
  }));
