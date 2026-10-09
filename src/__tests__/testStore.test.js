/** Pack Test Store: the committed static mock shop (public/test-store) keeps its contract. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../public/test-store');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gu)].map((m) => JSON.parse(m[1]));
const PDP_SLUGS = fs.readdirSync(path.join(root, 'p'));

describe('Pack Test Store static pages', () => {
  it('has about 12 PDPs per version and every page is noindex', () => {
    expect(PDP_SLUGS).toHaveLength(12);
    for (const prefix of ['', 'v2/', 'broken/']) {
      expect(fs.readdirSync(path.join(root, `${prefix}p`))).toHaveLength(12);
      for (const rel of ['index.html', 'search/index.html', 'cart/index.html', 'checkout/index.html', 'store-hours/index.html', 'news/index.html']) {
        expect(read(`${prefix}${rel}`)).toContain('<meta name="robots" content="noindex, nofollow">');
      }
    }
  });

  it('PDPs carry Product/Offer JSON-LD and published/modified meta', () => {
    for (const slug of PDP_SLUGS) {
      const html = read(`p/${slug}/index.html`);
      const product = jsonLd(html).find((o) => o['@type'] === 'Product');
      expect(product.offers.price).toMatch(/^\d+\.\d{2}$/u);
      expect(product.offers.availability).toMatch(/schema\.org\//u);
      expect(html).toContain('property="article:published_time"');
      expect(html).toContain('name="dateModified"');
    }
  });

  it('covers all three availabilities and a sale price', () => {
    const html = PDP_SLUGS.map((s) => read(`p/${s}/index.html`)).join('\n');
    for (const text of ['In stock', 'Only a few left', 'Out of stock', 'price--sale']) {
      expect(html).toContain(text);
    }
  });

  it('v2 uses different selectors for the same data; broken drops the price and renames the search field', () => {
    const v1 = read('p/trail-runner/index.html');
    const v2 = read('v2/p/trail-runner/index.html');
    const broken = read('broken/p/trail-runner/index.html');
    expect(v1).toContain('class="product-title"');
    expect(v2).toContain('class="pdp__name"');
    expect(v2).not.toContain('product-title');
    expect(v1).toContain('name="q"');
    expect(broken).not.toContain('data-ts-price');
    expect(broken).not.toMatch(/\$\d+\.\d{2}<\/span>/u);
    expect(jsonLd(broken).find((o) => o['@type'] === 'Product').offers.price).toBeUndefined();
    expect(broken).toContain('name="keyword"');
    expect(broken).not.toContain('name="q"');
  });

  it('checkout Place order is the one-way door to the Stripe TEST link', () => {
    for (const prefix of ['', 'v2/', 'broken/']) {
      const html = read(`${prefix}checkout/index.html`);
      expect(html).toMatch(/id="place-order"[^>]*data-one-way-door="pay"[^>]*href="https:\/\/buy\.stripe\.com\/test_/u);
    }
  });

  it('store hours carry OpeningHoursSpecification and the news has one fresh and one stale article', () => {
    const store = jsonLd(read('store-hours/index.html')).find((o) => o['@type'] === 'Store');
    expect(store.openingHoursSpecification.length).toBeGreaterThan(1);
    const dates = fs.readdirSync(path.join(root, 'news')).filter((n) => n !== 'index.html')
      .map((slug) => jsonLd(read(`news/${slug}/index.html`)).find((o) => o['@type'] === 'NewsArticle').datePublished);
    expect(dates.sort()).toEqual(['2025-03-14T08:00:00Z', '2026-10-01T08:00:00Z']);
  });
});
