import {
  QUERY_WEB_VITALS_HOGQL,
  SITE_WEB_VITALS_SERIES,
  buildWebVitalsLakeRows,
} from './query-web-vitals';

describe('query-web-vitals', () => {
  it('names the lake series and HogQL event', () => {
    expect(SITE_WEB_VITALS_SERIES).toBe('site.web-vitals');
    expect(QUERY_WEB_VITALS_HOGQL).toContain("event = '$web_vitals'");
    expect(QUERY_WEB_VITALS_HOGQL).toContain('properties.$web_vital_name');
  });

  it('maps a PostHog daily query row onto the lake series', () => {
    const rows = buildWebVitalsLakeRows(
      [
        {
          day: '2026-09-17',
          vital: 'INP',
          avg_value: 48.2,
          p75_value: 64,
          samples: 12,
        },
      ],
      {env: 'prod', commit: 'abc1234'},
    );
    expect(rows).toEqual([
      {
        seriesName: 'site.web-vitals',
        ts: '2026-09-17T00:00:00.000Z',
        commit: 'abc1234',
        env: 'prod',
        dimensions: {vital: 'INP'},
        values: {avg: 48.2, p75: 64, samples: 12},
      },
    ]);
  });
});
