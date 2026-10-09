/**
 * Pack Test Store: deterministic mock catalog. No real commerce. Used by generate.mjs
 * to write static pages under public/test-store/. All dates are fixed so output is stable.
 */
export const STORE = Object.freeze({
  name: 'Pack Test Store',
  base: '/test-store',
  origin: 'https://www.trypackai.com',
  address: {street: '100 Mock Street', city: 'San Francisco', region: 'CA', postal: '94103', country: 'US'},
  phone: '+1-415-555-0100',
  hours: [
    {days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '19:00'},
    {days: ['Saturday'], opens: '10:00', closes: '18:00'},
    {days: ['Sunday'], opens: '11:00', closes: '17:00'},
  ],
});

const P = (slug, name, category, price, salePrice, availability, colors, sizes, rating, reviews, published, modified, blurb) => ({
  slug, name, category, price, salePrice, availability, colors, sizes, rating, reviews, published, modified, blurb,
});

export const PRODUCTS = Object.freeze([
  P('trail-runner', 'Trail Runner Shoe', 'shoes', 89.0, 69.0, 'in_stock', ['blue', 'black'], ['8', '9', '10', '11'], 4.6, 212, '2026-03-02T09:00:00Z', '2026-09-20T12:00:00Z', 'Lightweight trail shoe with a grippy outsole.'),
  P('road-racer', 'Road Racer Shoe', 'shoes', 120.0, null, 'in_stock', ['red', 'white'], ['7', '8', '9', '10'], 4.4, 98, '2026-02-11T09:00:00Z', '2026-08-30T12:00:00Z', 'Fast road shoe for race day.'),
  P('city-sneaker', 'City Sneaker', 'shoes', 74.5, null, 'low', ['black', 'white'], ['8', '9', '10'], 4.1, 64, '2026-01-20T09:00:00Z', '2026-09-02T12:00:00Z', 'Everyday sneaker for walking the city.'),
  P('summit-boot', 'Summit Hiking Boot', 'shoes', 159.0, 129.0, 'out', ['brown'], ['9', '10', '11', '12'], 4.8, 301, '2025-11-05T09:00:00Z', '2026-07-14T12:00:00Z', 'Waterproof boot for long climbs.'),
  P('day-pack', 'Day Pack 20L', 'bags', 59.0, null, 'in_stock', ['blue', 'green', 'black'], ['one-size'], 4.5, 187, '2026-04-01T09:00:00Z', '2026-09-11T12:00:00Z', 'Twenty liters for the essentials.'),
  P('weekender', 'Weekender Duffel', 'bags', 98.0, 79.0, 'low', ['green', 'brown'], ['one-size'], 4.3, 73, '2026-03-15T09:00:00Z', '2026-09-18T12:00:00Z', 'Carry-on sized duffel.'),
  P('tote-classic', 'Classic Tote', 'bags', 34.0, null, 'in_stock', ['white', 'black', 'red'], ['one-size'], 4.0, 41, '2026-05-09T09:00:00Z', '2026-08-01T12:00:00Z', 'Canvas tote with an inner pocket.'),
  P('sling-mini', 'Mini Sling', 'bags', 28.0, 22.0, 'out', ['black'], ['one-size'], 3.9, 29, '2026-06-01T09:00:00Z', '2026-09-25T12:00:00Z', 'Pocket-sized sling bag.'),
  P('rain-shell', 'Rain Shell Jacket', 'jackets', 135.0, null, 'in_stock', ['blue', 'yellow'], ['S', 'M', 'L', 'XL'], 4.7, 256, '2026-02-02T09:00:00Z', '2026-09-05T12:00:00Z', 'Packable waterproof shell.'),
  P('fleece-half-zip', 'Fleece Half-Zip', 'jackets', 65.0, 49.0, 'in_stock', ['green', 'black', 'red'], ['S', 'M', 'L'], 4.5, 142, '2025-10-10T09:00:00Z', '2026-09-08T12:00:00Z', 'Warm midlayer fleece.'),
  P('puffer-vest', 'Puffer Vest', 'jackets', 110.0, null, 'low', ['black', 'blue'], ['M', 'L', 'XL'], 4.2, 55, '2025-12-12T09:00:00Z', '2026-09-22T12:00:00Z', 'Light insulation for cool mornings.'),
  P('wind-breaker', 'Windbreaker', 'jackets', 82.0, 62.0, 'out', ['red', 'white'], ['S', 'M'], 4.0, 37, '2026-04-18T09:00:00Z', '2026-06-30T12:00:00Z', 'Ultralight wind layer.'),
]);

export const ARTICLES = Object.freeze([
  {
    slug: 'fall-sale-announced',
    title: 'Fall sale starts October 1',
    published: '2026-10-01T08:00:00Z',
    modified: '2026-10-01T08:00:00Z',
    body: 'Pack Test Store marks down shoes, bags and jackets through October 31. Sale prices appear on each product page.',
  },
  {
    slug: 'spring-pop-up-recap',
    title: 'Spring pop-up recap',
    published: '2025-03-14T08:00:00Z',
    modified: '2025-03-14T08:00:00Z',
    body: 'Our spring pop-up ran March 14 to March 16, 2025. It has ended and the pop-up prices no longer apply.',
  },
]);

export const CATEGORIES = Object.freeze(['shoes', 'bags', 'jackets']);
export const ALL_COLORS = Object.freeze([...new Set(PRODUCTS.flatMap((p) => p.colors))].sort());
export const ALL_SIZES = Object.freeze([...new Set(PRODUCTS.flatMap((p) => p.sizes))]);
export const VERSIONS = Object.freeze({v1: '', v2: '/v2', broken: '/broken'});

export const AVAILABILITY_TEXT = Object.freeze({in_stock: 'In stock', low: 'Only a few left', out: 'Out of stock'});
export const SCHEMA_AVAILABILITY = Object.freeze({
  in_stock: 'https://schema.org/InStock',
  low: 'https://schema.org/LimitedAvailability',
  out: 'https://schema.org/OutOfStock',
});
export const PICKUP_TEXT = Object.freeze({
  in_stock: 'Free store pickup today at Pack Test Store, 100 Mock Street, San Francisco.',
  low: 'Store pickup in 2 to 3 days at Pack Test Store, 100 Mock Street, San Francisco.',
  out: 'Not available for store pickup.',
});
