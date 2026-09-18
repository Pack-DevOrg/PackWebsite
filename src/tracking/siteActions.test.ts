import {siteActionProperties, SITE_ACTION_NAMES} from './siteActions';

describe('site_action names', () => {
  it('accepts the closed CTA set', () => {
    expect(SITE_ACTION_NAMES).toEqual(['text_me', 'waitlist_submit', 'deep_link']);
    expect(siteActionProperties('text_me', 12)).toEqual({
      action: 'text_me',
      duration_ms: 12,
    });
    expect(siteActionProperties('waitlist_submit', 0).action).toBe('waitlist_submit');
    expect(siteActionProperties('deep_link', 4.4).duration_ms).toBe(4);
  });

  it('throws on an unknown action name', () => {
    expect(() => siteActionProperties('text-me')).toThrow(/unknown site_action name/);
    expect(() => siteActionProperties('click')).toThrow(/unknown site_action name/);
  });
});
