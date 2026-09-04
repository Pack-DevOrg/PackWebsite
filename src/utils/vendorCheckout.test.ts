/**
 * Vendor checkout URL builder: https-only host pin, allowlisted prefill,
 * payment-shaped and unknown keys dropped.
 */

import {
  PREFILL_ALLOWLIST,
  buildVendorCheckoutUrl,
  openVendorCheckout,
} from './vendorCheckout';

const VENDOR_BASE = 'https://vendor.example/checkout';

describe('PREFILL_ALLOWLIST', () => {
  it('pins trip-schema prefill keys', () => {
    expect(PREFILL_ALLOWLIST).toEqual([
      'checkInDate',
      'checkOutDate',
      'origin',
      'destination',
      'guests',
      'rooms',
      'confirmationCode',
      'travelerName',
    ]);
  });
});

describe('buildVendorCheckoutUrl', () => {
  it('returns null for a non-https vendor base', () => {
    expect(
      buildVendorCheckoutUrl('http://vendor.example/checkout', {
        checkInDate: '2026-10-01',
      })
    ).toBeNull();
  });

  it('returns null when the base is not a URL', () => {
    expect(buildVendorCheckoutUrl('not a url', { checkInDate: '2026-10-01' })).toBeNull();
  });

  it('returns null for javascript: bases', () => {
    expect(
      buildVendorCheckoutUrl('javascript:alert(1)', { checkInDate: '2026-10-01' })
    ).toBeNull();
  });

  it('keeps allowlisted checkInDate verbatim and drops unknown keys', () => {
    const url = buildVendorCheckoutUrl(VENDOR_BASE, {
      checkInDate: '2026-10-01',
      foo: 'bar',
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect(parsed.searchParams.get('checkInDate')).toBe('2026-10-01');
    expect(parsed.searchParams.has('foo')).toBe(false);
  });

  it('drops payment-shaped keys from the output query', () => {
    const url = buildVendorCheckoutUrl(VENDOR_BASE, {
      checkInDate: '2026-10-01',
      cardNumber: '4111111111111111',
      cvv: '123',
      expiry: '12/29',
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    const keys = [...parsed.searchParams.keys()];
    expect(keys).toEqual(['checkInDate']);
    expect(parsed.search).not.toMatch(/cardNumber|cvv|expiry/i);
  });

  it('output host strictly equals the vendor base host', () => {
    const url = buildVendorCheckoutUrl(VENDOR_BASE, {
      origin: 'SFO',
      destination: 'NRT',
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    const base = new URL(VENDOR_BASE);
    expect(parsed.host).toBe(base.host);
    expect(parsed.hostname).toBe('vendor.example');
    expect(parsed.protocol).toBe('https:');
  });

  it('drops cc*, cvc, and pan even when mixed with allowlisted fields', () => {
    const url = buildVendorCheckoutUrl(VENDOR_BASE, {
      travelerName: 'Alex Traveler',
      ccNumber: '4111111111111111',
      cvc: '999',
      pan: '4111111111111111',
      cardholder: 'Alex',
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect([...parsed.searchParams.keys()]).toEqual(['travelerName']);
    expect(parsed.searchParams.get('travelerName')).toBe('Alex Traveler');
  });

  it('preserves vendor path and only allowlisted query keys', () => {
    const url = buildVendorCheckoutUrl('https://vendor.example/book/now', {
      checkOutDate: '2026-10-05',
      guests: '2',
      rooms: '1',
      confirmationCode: 'ABC123',
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url as string);
    expect(parsed.pathname).toBe('/book/now');
    expect(parsed.searchParams.get('checkOutDate')).toBe('2026-10-05');
    expect(parsed.searchParams.get('guests')).toBe('2');
    expect(parsed.searchParams.get('rooms')).toBe('1');
    expect(parsed.searchParams.get('confirmationCode')).toBe('ABC123');
    expect([...parsed.searchParams.keys()].every((k) => PREFILL_ALLOWLIST.includes(k))).toBe(
      true
    );
  });
});

describe('openVendorCheckout', () => {
  const opened: Array<{ url: string; target: string; features: string }> = [];

  beforeEach(() => {
    opened.length = 0;
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      opened.push({
        url: String(url ?? ''),
        target: target ?? '',
        features: features ?? '',
      });
      return null;
    }) as typeof window.open;
  });

  it('opens a valid https vendor url in a new browsing context', () => {
    const built = buildVendorCheckoutUrl(VENDOR_BASE, { checkInDate: '2026-10-01' });
    expect(built).not.toBeNull();
    openVendorCheckout(built as string);
    expect(opened).toEqual([
      { url: built as string, target: '_blank', features: 'noopener,noreferrer' },
    ]);
  });

  it('is a no-op for http urls', () => {
    openVendorCheckout('http://vendor.example/checkout');
    expect(opened).toEqual([]);
  });

  it('is a no-op when the query still has payment-shaped keys', () => {
    openVendorCheckout('https://vendor.example/checkout?cardNumber=4111&cvv=123');
    expect(opened).toEqual([]);
  });
});
