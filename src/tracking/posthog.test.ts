/**
 * @jest-environment jsdom
 */

import {
  captureInpSample,
  capturePageview,
  capturePosthog,
  captureSiteAction,
  initPostHog,
  resetPostHogForTests,
} from './posthog';

describe('posthog website capture', () => {
  beforeEach(() => {
    resetPostHogForTests();
    document.body.innerHTML = '';
    (globalThis as {__TEST_ENV__?: Record<string, unknown>}).__TEST_ENV__ = {
      ...(globalThis as {__TEST_ENV__?: Record<string, unknown>}).__TEST_ENV__,
      VITE_POSTHOG_KEY: 'phc_test_site',
      VITE_POSTHOG_HOST: 'https://us.i.posthog.com',
    };
  });

  afterEach(() => {
    resetPostHogForTests();
  });

  it('queues $pageview and flushes after init', async () => {
    capturePageview('/');
    await initPostHog();
    expect(window.__packPosthogInit).toBe(true);
    expect(window.__packReplayStarted).toBe(true);
    expect(window.__packPhEvents?.some((row) => row.event === '$pageview')).toBe(true);
  });

  it('captures an INP web-vital sample', async () => {
    await initPostHog();
    captureInpSample(48);
    expect(
      window.__packPhEvents?.some(
        (row) =>
          row.event === '$web_vitals' &&
          row.properties.$web_vital_name === 'INP' &&
          row.properties.$web_vital_value === 48,
      ),
    ).toBe(true);
  });

  it('first pointerdown emits an INP sample', async () => {
    await initPostHog();
    window.dispatchEvent(new Event('pointerdown', {bubbles: true}));
    expect(
      window.__packPhEvents?.some(
        (row) =>
          row.event === '$web_vitals' && row.properties.$web_vital_name === 'INP',
      ),
    ).toBe(true);
  });

  it('clicking a text-me control emits site_action', async () => {
    await initPostHog();
    const button = document.createElement('button');
    button.setAttribute('data-site-action', 'text_me');
    button.textContent = 'Text me';
    document.body.appendChild(button);
    button.click();
    expect(
      window.__packPhEvents?.some(
        (row) =>
          row.event === 'site_action' &&
          row.properties.action === 'text_me' &&
          typeof row.properties.duration_ms === 'number',
      ),
    ).toBe(true);
  });

  it('capturePosthog records custom events', () => {
    capturePosthog('site_action', {action: 'waitlist_submit', duration_ms: 9});
    captureSiteAction('deep_link', 3);
    expect(window.__packPhEvents?.[0]).toEqual({
      event: 'site_action',
      properties: {action: 'waitlist_submit', duration_ms: 9},
    });
    expect(window.__packPhEvents?.[1]?.properties).toEqual({
      action: 'deep_link',
      duration_ms: 3,
    });
  });
});
