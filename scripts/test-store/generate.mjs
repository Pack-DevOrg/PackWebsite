#!/usr/bin/env node
/**
 * Writes the Pack Test Store: static, deterministic mock shop pages under
 * public/test-store/ (v1 at /test-store/, v2 at /test-store/v2/, broken at /test-store/broken/).
 * No real commerce. The final "Place order" link goes to the Stripe TEST payment link
 * (env PACK_TEST_STORE_PAY_URL, default the stored test link). That is the one-way door.
 *
 *   node scripts/test-store/generate.mjs           write public/test-store/**
 *   node scripts/test-store/generate.mjs --check   exit 1 when committed output is stale
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  ALL_COLORS,
  ALL_SIZES,
  ARTICLES,
  AVAILABILITY_TEXT,
  CATEGORIES,
  PICKUP_TEXT,
  PRODUCTS,
  SCHEMA_AVAILABILITY,
  STORE,
  VERSIONS,
} from './data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outRoot = path.join(root, 'public', 'test-store');
export const DEFAULT_PAY_URL = 'https://buy.stripe.com/test_cNi7sNgof1U03n6bEc3gk00';
const payUrl = process.env.PACK_TEST_STORE_PAY_URL?.trim() || DEFAULT_PAY_URL;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => `$${n.toFixed(2)}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const effective = (p) => p.salePrice ?? p.price;

/** Layout vocabulary per version: same data, different DOM and selectors. */
const LAYOUTS = {
  v1: {
    searchName: 'q', searchId: 'search-input', header: 'site-header', list: 'product-list', card: 'product-card',
    title: 'product-title', price: 'price', sale: 'price price--sale', was: 'price--was', stock: 'availability',
    pickup: 'pickup', rating: 'rating', add: 'add-to-cart', sizeId: 'size', colorId: 'color', pdp: 'product-detail',
  },
  v2: {
    searchName: 'q', searchId: 'site-search', header: 'masthead', list: 'tiles', card: 'tile',
    title: 'pdp__name', price: 'pdp__amount', sale: 'pdp__amount pdp__amount--now', was: 'pdp__was', stock: 'stock-badge',
    pickup: 'fulfilment', rating: 'stars', add: 'btn-buy', sizeId: 'opt-size', colorId: 'opt-colour', pdp: 'pdp',
  },
};
LAYOUTS.broken = {...LAYOUTS.v1, searchName: 'keyword', searchId: 'kw'};

function shell({version, title, description, canonicalPath, body, meta = '', jsonLd = []}) {
  const L = LAYOUTS[version];
  const base = STORE.base + VERSIONS[version];
  const ld = jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en" data-test-store-version="${version}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${STORE.name}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${STORE.origin}${canonicalPath}">
${meta}
${ld}
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;color:#1a1a1a}header,main,footer{max-width:960px;margin:0 auto;padding:12px 16px}nav a{margin-right:12px}ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}li,.tile{border:1px solid #ddd;padding:8px;border-radius:6px}button,.btn-buy,.add-to-cart,a.cta{background:#1a1a1a;color:#fff;border:0;padding:10px 16px;border-radius:6px;cursor:pointer;text-decoration:none;display:inline-block}.price--was,.pdp__was{text-decoration:line-through;color:#777}</style>
</head>
<body data-ts-version="${version}" data-ts-base="${base}">
<header class="${L.header}">
<a href="${base}/" class="brand">${STORE.name}</a>
<nav>
${CATEGORIES.map((c) => `<a href="${base}/category/${c}">${cap(c)}</a>`).join('\n')}
<a href="${base}/store-hours">Store hours</a>
<a href="${base}/news">News</a>
<a href="${base}/cart">Cart (<span data-ts-cart-count>0</span>)</a>
</nav>
<form action="${base}/search" method="get" role="search">
<input type="search" name="${L.searchName}" id="${L.searchId}" placeholder="Search the store" aria-label="Search">
<button type="submit">Search</button>
</form>
</header>
<main>
${body}
</main>
<footer><p>Mock store for automated tests. Nothing here is for sale. ${STORE.name}, ${STORE.address.street}, ${STORE.address.city}.</p></footer>
<script src="${STORE.base}/store.js"></script>
</body>
</html>
`;
}

function card(version, p) {
  const L = LAYOUTS[version];
  const base = STORE.base + VERSIONS[version];
  const tag = version === 'v2' ? 'div' : 'li';
  const priceHtml = version === 'broken'
    ? ''
    : `<span class="${p.salePrice ? L.sale : L.price}">${money(effective(p))}</span>${p.salePrice ? ` <s class="${L.was}">${money(p.price)}</s>` : ''}`;
  return `<${tag} class="${L.card}" data-ts-item data-sku="${p.slug}" data-name="${esc(p.name.toLowerCase())}" data-category="${p.category}" data-color="${p.colors.join(' ')}" data-size="${p.sizes.join(' ')}" data-price="${effective(p)}">
<a href="${base}/p/${p.slug}">${esc(p.name)}</a>
${priceHtml}
<span class="${L.stock}">${AVAILABILITY_TEXT[p.availability]}</span>
</${tag}>`;
}

function listHtml(version, products) {
  const L = LAYOUTS[version];
  const wrap = version === 'v2' ? 'section' : 'ul';
  return `<${wrap} class="${L.list}" data-ts-list>
${products.map((p) => card(version, p)).join('\n')}
</${wrap}>`;
}

function productJsonLd(p, version) {
  const base = STORE.origin + STORE.base + VERSIONS[version];
  const offer = {
    '@type': 'Offer',
    url: `${base}/p/${p.slug}`,
    priceCurrency: 'USD',
    availability: SCHEMA_AVAILABILITY[p.availability],
    itemCondition: 'https://schema.org/NewCondition',
  };
  if (version !== 'broken') offer.price = effective(p).toFixed(2);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.slug,
    description: p.blurb,
    category: p.category,
    color: p.colors,
    offers: offer,
    aggregateRating: {'@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews},
  };
}

function pdp(version, p) {
  const L = LAYOUTS[version];
  const base = STORE.base + VERSIONS[version];
  const hook = (n) => (version === 'v2' ? '' : `data-ts-${n}`);
  const stars = `${p.rating.toFixed(1)} out of 5 (${p.reviews} reviews)`;
  const priceBlock = version === 'broken'
    ? ''
    : p.salePrice
      ? `<p class="${version === 'v2' ? 'pdp__price' : 'price-block'}"><span class="${L.sale}" ${hook('price')}>${money(p.salePrice)}</span> <s class="${L.was}">${money(p.price)}</s> <span class="badge">Sale</span></p>`
      : `<p class="${version === 'v2' ? 'pdp__price' : 'price-block'}"><span class="${L.price}" ${hook('price')}>${money(p.price)}</span></p>`;
  const sizes = p.sizes.map((s) => `<option value="${s}">${s}</option>`).join('');
  const colors = p.colors.map((c) => `<option value="${c}">${cap(c)}</option>`).join('');
  const disabled = p.availability === 'out' ? ' disabled' : '';
  const heading = version === 'v2'
    ? `<div class="pdp__heading"><h1 class="${L.title}">${esc(p.name)}</h1></div>`
    : `<h1 class="${L.title}">${esc(p.name)}</h1>`;
  const body = `<article class="${L.pdp}"${version === 'v2' ? '' : ` data-ts-sku="${p.slug}"`}>
${heading}
<p class="${L.rating}" ${hook('rating')}>Rated ${stars}</p>
${priceBlock}
<p class="${L.stock}" ${hook('availability')}>${AVAILABILITY_TEXT[p.availability]}</p>
<p class="${L.pickup}">${PICKUP_TEXT[p.availability]}</p>
<p>${esc(p.blurb)}</p>
<div class="options">
<label for="${L.sizeId}">Size</label> <select id="${L.sizeId}" name="size" data-ts-size>${sizes}</select>
<label for="${L.colorId}">Color</label> <select id="${L.colorId}" name="color" data-ts-color>${colors}</select>
</div>
<button type="button" class="${L.add}" data-ts-add data-sku="${p.slug}" data-name="${esc(p.name)}" data-price="${effective(p)}"${disabled}>${p.availability === 'out' ? 'Sold out' : 'Add to cart'}</button>
</article>`;
  const meta = `<meta property="og:type" content="product">
<meta property="og:title" content="${esc(p.name)}">
<meta property="article:published_time" content="${p.published}">
<meta property="article:modified_time" content="${p.modified}">
<meta name="dateModified" content="${p.modified}">`;
  return shell({
    version, title: p.name, description: p.blurb, canonicalPath: `${base}/p/${p.slug}`, body, meta,
    jsonLd: [productJsonLd(p, version)],
  });
}

function home(version) {
  const base = STORE.base + VERSIONS[version];
  const body = `<h1>${STORE.name}</h1>
<p>A mock shop for shoes, bags and jackets. Store layout version: ${version}.</p>
<p>${CATEGORIES.map((c) => `<a href="${base}/category/${c}">${cap(c)}</a>`).join(' | ')}</p>
<h2>Featured</h2>
${listHtml(version, PRODUCTS.slice(0, 4))}`;
  return shell({version, title: 'Home', description: 'Pack Test Store home', canonicalPath: `${base}/`, body});
}

function search(version) {
  const base = STORE.base + VERSIONS[version];
  const body = `<h1>Search results</h1>
<p data-ts-search-summary>Filter with ?q=</p>
${listHtml(version, PRODUCTS)}
<noscript><p>Enable JavaScript to filter by ?q=. All products are listed above.</p></noscript>`;
  return shell({version, title: 'Search', description: 'Search the Pack Test Store', canonicalPath: `${base}/search`, body});
}

function category(version, cat) {
  const base = STORE.base + VERSIONS[version];
  const items = PRODUCTS.filter((p) => p.category === cat);
  const colors = [...new Set(items.flatMap((p) => p.colors))].sort();
  const sizes = [...new Set(items.flatMap((p) => p.sizes))];
  const body = `<h1>${cap(cat)}</h1>
<nav class="filters" aria-label="Filters">
<p>Color: ${colors.map((c) => `<a href="${base}/category/${cat}?color=${c}">${cap(c)}</a>`).join(' ')}</p>
<p>Size: ${sizes.map((s) => `<a href="${base}/category/${cat}?size=${encodeURIComponent(s)}">${s}</a>`).join(' ')}</p>
<p>Sort: <a href="${base}/category/${cat}?sort=price-asc">Price low to high</a> <a href="${base}/category/${cat}?sort=price-desc">Price high to low</a></p>
</nav>
<div data-ts-category="${cat}">
${listHtml(version, items)}
</div>`;
  return shell({version, title: cap(cat), description: `${cap(cat)} at Pack Test Store`, canonicalPath: `${base}/category/${cat}`, body});
}

function cart(version) {
  const base = STORE.base + VERSIONS[version];
  const body = `<h1>Your cart</h1>
<div data-ts-cart><p>Your cart is empty.</p></div>
<p><a class="cta" href="${base}/checkout" data-ts-checkout>Checkout</a></p>`;
  return shell({version, title: 'Cart', description: 'Your cart', canonicalPath: `${base}/cart`, body});
}

function checkout(version) {
  const base = STORE.base + VERSIONS[version];
  const body = `<h1>Checkout</h1>
<p>This is a test checkout. Placing the order opens the Stripe TEST payment page. No real card is charged.</p>
<div data-ts-cart data-ts-summary></div>
<p><a class="cta" id="place-order" data-ts-pay data-one-way-door="pay" href="${esc(payUrl)}" rel="nofollow">Place order</a></p>
<p><a href="${base}/cart">Back to cart</a></p>`;
  return shell({version, title: 'Checkout', description: 'Test checkout', canonicalPath: `${base}/checkout`, body});
}

function hours(version) {
  const base = STORE.base + VERSIONS[version];
  const a = STORE.address;
  const spec = STORE.hours.map((h) => ({'@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes}));
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: STORE.name,
    telephone: STORE.phone,
    address: {'@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.city, addressRegion: a.region, postalCode: a.postal, addressCountry: a.country},
    openingHoursSpecification: spec,
  };
  const rows = STORE.hours.map((h) => `<tr><td>${h.days.length > 1 ? `${h.days[0]} to ${h.days[h.days.length - 1]}` : h.days[0]}</td><td>${h.opens} - ${h.closes}</td></tr>`).join('\n');
  const body = `<h1>Store hours</h1>
<p>${STORE.name}, ${a.street}, ${a.city}, ${a.region} ${a.postal}. Phone ${STORE.phone}.</p>
<table class="hours"><tbody>
${rows}
</tbody></table>
<p>Closed on public holidays.</p>`;
  return shell({version, title: 'Store hours', description: 'Opening hours of the Pack Test Store', canonicalPath: `${base}/store-hours`, body, jsonLd: [ld]});
}

function newsIndex(version) {
  const base = STORE.base + VERSIONS[version];
  const body = `<h1>News</h1>
<ul class="news">
${ARTICLES.map((a) => `<li><a href="${base}/news/${a.slug}">${esc(a.title)}</a> <time datetime="${a.published}">${a.published.slice(0, 10)}</time></li>`).join('\n')}
</ul>`;
  return shell({version, title: 'News', description: 'Store news', canonicalPath: `${base}/news`, body});
}

function article(version, a) {
  const base = STORE.base + VERSIONS[version];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    datePublished: a.published,
    dateModified: a.modified,
    author: {'@type': 'Organization', name: STORE.name},
  };
  const meta = `<meta property="article:published_time" content="${a.published}">
<meta property="article:modified_time" content="${a.modified}">`;
  const body = `<article><h1>${esc(a.title)}</h1>
<p>Published <time datetime="${a.published}">${a.published.slice(0, 10)}</time></p>
<p>${esc(a.body)}</p></article>`;
  return shell({version, title: a.title, description: a.body, canonicalPath: `${base}/news/${a.slug}`, body, meta, jsonLd: [ld]});
}

const STORE_JS = `/* Pack Test Store client script: filters, sort, cart in localStorage. Mock only. */
(function () {
  var KEY = 'pack-test-store-cart';
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function write(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ } }
  function count() { return read().reduce(function (n, i) { return n + i.qty; }, 0); }
  function add(item) {
    var items = read();
    var hit = items.filter(function (i) { return i.sku === item.sku && i.size === item.size && i.color === item.color; })[0];
    if (hit) { hit.qty += 1; } else { item.qty = 1; items.push(item); }
    write(items);
  }
  function paint() {
    var c = document.querySelector('[data-ts-cart-count]');
    if (c) { c.textContent = String(count()); }
  }
  var params = new URLSearchParams(location.search);
  var base = document.body.getAttribute('data-ts-base') || '/test-store';
  // filters on any list page
  var list = document.querySelector('[data-ts-list]');
  if (list) {
    var q = (params.get('q') || params.get('keyword') || '').toLowerCase().trim();
    var color = params.get('color'); var size = params.get('size'); var sort = params.get('sort');
    var items = Array.prototype.slice.call(list.querySelectorAll('[data-ts-item]'));
    var shown = 0;
    items.forEach(function (el) {
      var ok = true;
      if (q) { ok = ok && (el.getAttribute('data-name') + ' ' + el.getAttribute('data-category') + ' ' + el.getAttribute('data-color')).indexOf(q) >= 0; }
      if (color) { ok = ok && (' ' + el.getAttribute('data-color') + ' ').indexOf(' ' + color + ' ') >= 0; }
      if (size) { ok = ok && (' ' + el.getAttribute('data-size') + ' ').indexOf(' ' + size + ' ') >= 0; }
      el.hidden = !ok; if (ok) { shown += 1; }
    });
    if (sort) {
      items.sort(function (a, b) { var d = Number(a.getAttribute('data-price')) - Number(b.getAttribute('data-price')); return sort === 'price-desc' ? -d : d; })
        .forEach(function (el) { list.appendChild(el); });
    }
    var summary = document.querySelector('[data-ts-search-summary]');
    if (summary) { summary.textContent = shown + ' results' + (q ? ' for ' + q : ''); }
  }
  // add to cart on a product page
  var btn = document.querySelector('[data-ts-add]');
  if (btn) {
    btn.addEventListener('click', function () {
      var s = document.querySelector('[data-ts-size]'); var c = document.querySelector('[data-ts-color]');
      add({sku: btn.getAttribute('data-sku'), name: btn.getAttribute('data-name'), price: Number(btn.getAttribute('data-price')), size: s ? s.value : '', color: c ? c.value : ''});
      location.href = base + '/cart?added=' + encodeURIComponent(btn.getAttribute('data-sku'));
    });
  }
  // cart and checkout summaries
  var box = document.querySelector('[data-ts-cart]');
  if (box) {
    var rows = read();
    if (rows.length) {
      var total = 0;
      box.innerHTML = '<ul class="cart-lines">' + rows.map(function (i) {
        total += i.price * i.qty;
        return '<li data-ts-line data-sku="' + i.sku + '">' + i.name + ' (' + i.color + ', ' + i.size + ') x' + i.qty + ' - $' + (i.price * i.qty).toFixed(2) + '</li>';
      }).join('') + '</ul><p class="cart-total" data-ts-total>Total: $' + total.toFixed(2) + '</p>';
    }
  }
  paint();
})();
`;

function pagesFor(version) {
  const prefix = VERSIONS[version];
  const pages = new Map();
  const put = (route, html) => pages.set(`${prefix}${route}/index.html`.replace(/^\//, ''), html);
  pages.set(`${prefix}/index.html`.replace(/^\//, ''), home(version));
  put('/search', search(version));
  for (const c of CATEGORIES) put(`/category/${c}`, category(version, c));
  for (const p of PRODUCTS) put(`/p/${p.slug}`, pdp(version, p));
  put('/cart', cart(version));
  put('/checkout', checkout(version));
  put('/store-hours', hours(version));
  put('/news', newsIndex(version));
  for (const a of ARTICLES) put(`/news/${a.slug}`, article(version, a));
  return pages;
}

export function buildAll() {
  const files = new Map([['store.js', STORE_JS]]);
  for (const version of Object.keys(VERSIONS)) {
    for (const [rel, html] of pagesFor(version)) files.set(rel, html);
  }
  return files;
}

function main(argv) {
  const files = buildAll();
  if (argv.includes('--check')) {
    const stale = [...files].filter(([rel, content]) => {
      const file = path.join(outRoot, rel);
      return !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content;
    });
    if (stale.length > 0) {
      process.stderr.write(`test-store output is stale: ${stale.map(([r]) => r).slice(0, 5).join(', ')} (run node scripts/test-store/generate.mjs)\n`);
      return 1;
    }
    return 0;
  }
  for (const [rel, content] of files) {
    const file = path.join(outRoot, rel);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, content);
  }
  process.stdout.write(`wrote ${files.size} files under public/test-store (pay target ${payUrl})\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

export {ALL_COLORS, ALL_SIZES};
