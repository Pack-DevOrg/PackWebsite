/* Web fallback for /a/<token>: the same typed artifact the App Clip renders, from GET /api/artifact/<token>.
   A private card (401) offers "Sign in to view": Cognito Hosted UI (Apple, Google, email) with PKCE, back at /a/callback. The ID token lives in
   memory only (never storage, never a cookie we set); the server serves the card only to its owner or an active member.
   viewModelBecausePayload is pure (tested in scripts/__tests__/a-card.test.js (loads public/a-card.v5.js)); render() only touches the DOM
   with textContent, so card text is never parsed as HTML. */
(function (root) {
  'use strict';
  var API = 'https://api.trypackai.com';
  var APP_STORE = 'https://apps.apple.com/app/id6761626050';
  var APP_SCHEME = 'com.packai.app';
  var APP_WAIT_MS = 1500;
  /* Same user pool as the app (us-east-1_QuNk9AZqk), the website's own client (pack-web), Hosted UI, authorization code + PKCE. */
  var COGNITO_DOMAIN = 'https://auth.trypackai.com';
  var COGNITO_CLIENT_ID = '4h8pha61va6n081674mdrc0m7';
  var SIGNIN_SCOPE = 'openid email profile';
  var PKCE_KEY = 'pack.card.pkce';
  var HINT_KEY = 'pack.card.signedin';
  var REAUTH_KEY = 'pack.card.reauth';
  var REAUTH_GUARD_MS = 60000;
  var LIVE_REFRESH_MS = 30000;
  var SIGN_IN_PRIVATE = 'This card is private. Sign in to view it, or open it in the Pack app.';
  var MOBILE_UA = /iPhone|iPad|iPod|Android/i;
  var SIGN_IN_ENDED = 'Your sign-in ended. Sign in again to view this card.';
  var NO_ACCESS = 'You do not have access to this card.';
  var STATUS_LABEL = { host: 'Hosting', going: 'Going', pending_approval: 'Pending approval', waitlist: 'Waitlist', invited: 'Invited', maybe: 'Maybe' };
  /* The product page 404s until 1.0 ships, and iOS renders that as a blank white sheet. Flip when the app is live. */
  var APP_STORE_LIVE = false;
  var NOT_OPENED = 'Pack did not open. Pack may not be installed on this phone, or it is not on the App Store yet. Install the Pack beta from TestFlight, then tap Open in Pack again.';
  var PLAYER_ROW = /^(.*) \((hitter|pitcher|skater|goalie|player)\)$/;
  var GROUP_TITLE = { hitter: 'Hitters', pitcher: 'Pitchers', skater: 'Skaters', goalie: 'Goalies', player: 'Players' };

  function tokenBecausePath(pathname) {
    var parts = String(pathname || '').split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === 'a' ? parts[parts.length - 1] : '';
  }

  function isLocalFixtureHost(win) {
    if (!win) return false;
    if (typeof win.__PACK_CARD_DEV__ === 'boolean') return win.__PACK_CARD_DEV__;
    var host = String((win.location && win.location.hostname) || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  }

  function fixtureBecauseSearch(win) {
    if (!isLocalFixtureHost(win)) return '';
    var search = String((win.location && win.location.search) || '').replace(/^\?/, '');
    var raw = '';
    search.split('&').forEach(function (pair) {
      var eq = pair.indexOf('=');
      var k = eq >= 0 ? pair.slice(0, eq) : pair;
      if (k === 'fixture' && !raw) {
        try { raw = decodeURIComponent(eq >= 0 ? pair.slice(eq + 1) : ''); } catch (e) { raw = ''; }
      }
    });
    return /^[a-z0-9_-]+$/i.test(raw) ? raw : '';
  }

  /* /a/onboard/<token> is the texted connect/admit link, not a card: /api/artifact has no such token and answered 404. The web fallback is the onboarding page. */
  function onboardRedirectBecausePath(pathname) {
    var parts = String(pathname || '').split('/').filter(Boolean);
    return parts.length >= 3 && parts[0] === 'a' && parts[1] === 'onboard' ? '/onboard' : '';
  }

  function hostOf(url) {
    try { return new URL(url).host; } catch (e) { return ''; }
  }

  function dayOf(iso) {
    return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : '';
  }

  function kindLabel(kind) {
    var base = String(kind || '').replace(/_card$/, '').replace(/_/g, ' ');
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  /** Rows split into plain facts and grouped player lines ("Name (hitter)"). */
  function sectionsBecauseRows(rows) {
    var facts = [];
    var groups = {};
    var order = [];
    (rows || []).forEach(function (row) {
      var m = PLAYER_ROW.exec(row.label || '');
      if (m) {
        if (!groups[m[2]]) { groups[m[2]] = []; order.push(m[2]); }
        groups[m[2]].push({ label: m[1], value: row.value });
      } else {
        facts.push({ label: row.label, value: row.value });
      }
    });
    var sections = [];
    if (facts.length) sections.push({ title: '', rows: facts });
    order.forEach(function (g) { sections.push({ title: GROUP_TITLE[g] || 'Players', rows: groups[g] }); });
    return sections;
  }

  var MAP_W = 358;
  var MAP_H = 300;
  var PAD = 26;

  function block(payload, kind) {
    var blocks = payload && payload.blocks;
    if (!blocks) return null;
    for (var i = 0; i < blocks.length; i++) if (blocks[i] && blocks[i].kind === kind) return blocks[i];
    return null;
  }

  function directionsUrl(p) {
    return typeof p.lat === 'number' && typeof p.lon === 'number' ? 'https://maps.apple.com/?daddr=' + p.lat + ',' + p.lon + '&dirflg=w' : '';
  }

  function clock12(hhmm) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm));
    if (!m) return String(hhmm);
    var h = Number(m[1]);
    return (h % 12 === 0 ? 12 : h % 12) + ':' + m[2] + ' ' + (h >= 12 ? 'PM' : 'AM');
  }

  /** Category -> header art on the CDN (closed registry; anything else is local.places). */
  var PLACE_ART = [[/restaurant|cafe|coffee|bar\b|pub|bakery|diner|eatery|food/i, 'dining.restaurant'], [/gym|fitness|yoga|pilates|studio/i, 'health.fitness'], [/barber|salon|spa|laundry|repair|service/i, 'local.services']];
  function placeArtUrl(category) {
    var id = 'local.places';
    for (var i = 0; i < PLACE_ART.length; i++) if (PLACE_ART[i][0].test(category || '')) { id = PLACE_ART[i][1]; break; }
    return '/assets/clip-headers/' + id + '.jpg';
  }

  function awayLine(p) {
    return [
      typeof p.distanceM === 'number' ? Math.round(p.distanceM) + ' m' : '',
      typeof p.etaMin === 'number' ? Math.max(1, Math.round(p.etaMin)) + ' min ' + (p.etaMode === 'drive' ? 'drive' : 'walk') : ''
    ].filter(Boolean).join(', ');
  }

  function hoursLine(p) {
    return p.openState === 'open' ? (p.closesAtLocal ? 'Open until ' + p.closesAtLocal : 'Open now')
      : p.openState === 'closed' ? (p.opensAtLocal ? 'Opens ' + p.opensAtLocal : 'Closed') : '';
  }

  /** One-screen caps: the card never scrolls on a 390x844 phone. */
  var MAX_PLAYER_ROWS = 9;
  var MAX_TILES = 6;
  var LINE_MAX_CHARS = 28;
  var MAX_PLACES = 6;

  /** One-row stat lines: past LINE_MAX_CHARS, drop OPS, then WHIP. */
  function compactStatLine(line) {
    var parts = String(line || '').split(', ');
    [/\bOPS$/, /\bWHIP$/].forEach(function (drop) {
      if (parts.join(', ').length <= LINE_MAX_CHARS) return;
      var kept = parts.filter(function (p) { return !drop.test(p); });
      if (kept.length) parts = kept;
    });
    while (parts.length > 2 && parts.join(', ').length > LINE_MAX_CHARS) parts = parts.slice(0, -1);
    return parts.join(', ');
  }

  function ordinal(v) {
    var n = Number(v);
    if (!isFinite(n) || n <= 0 || Math.floor(n) !== n) return String(v);
    var t = n % 100;
    var suffix = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return n + suffix;
  }

  /** sports_team: header (name, season, record, logo, accent), stat tiles, hitters/pitchers columns. */
  var SCOPE_SUFFIX = /\s*\(incl\. postseason\)$/;
  var TEAM_PLAYER_ROW = /^(.*) \(([^)]+)\)$/;
  var PLACE_LABEL = /^(place|rank|seed|standing)$/i;

  function groupTitle(group) {
    var t = String(group).trim();
    var cap = t.charAt(0).toUpperCase() + t.slice(1);
    return /s$/i.test(cap) ? cap : cap + 's';
  }

  /** Header title font: shrinks to a floor so any team name plus season fits two lines at most (same rule as the clip). */
  function headerTitleFit(text) {
    var avail = 358 - 32 - 56 - 8;
    var oneLine = avail / (String(text).length * 0.56);
    return oneLine >= 15 ? { fontSize: Math.min(18, Math.floor(oneLine)), lines: 1 } : { fontSize: 14, lines: 2 };
  }

  /** sports_team: league-agnostic. Groups, tile labels, units and seasons come from the rows; layout (Anvil) picks tiles, lead group, header. */
  function teamBecausePayload(payload) {
    var m = /^(.*\S)\s+(\d{4}(?:[-\u2013/]\d{2,4})?)$/.exec(payload.title || '');
    var layout = payload.layout && typeof payload.layout === 'object' ? payload.layout : {};
    var team = { name: m ? m[1] : payload.title || '', season: m ? m[2] : '', record: '', subline: '', tiles: [], columns: [],
      logo: typeof payload.imageUrl === 'string' && /^https:\/\//i.test(payload.imageUrl) ? payload.imageUrl : '',
      accent: typeof payload.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(payload.accent) ? payload.accent : '', provenance: '' };
    var stats = [];
    var groups = {};
    var order = [];
    // Typed groups are the contract; only cards with no typed group anywhere read the old "(tag)" suffix.
    var typed = (payload.rows || []).some(function (r) { return typeof r.group === 'string' && r.group; });
    (payload.rows || []).forEach(function (row) {
      if (row.label === 'Player stats') { team.provenance = row.value; return; }
      var pm = typed || SCOPE_SUFFIX.test(row.label || '') ? null : TEAM_PLAYER_ROW.exec(row.label || '');
      var group = typeof row.group === 'string' && row.group ? row.group : pm ? pm[2] : '';
      if (group) {
        var key = group.toLowerCase();
        var name = pm ? pm[1] : String(row.label).replace(' (' + row.group + ')', '');
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push({ name: name, line: compactStatLine(row.value) });
        return;
      }
      var label = String(row.label || '').replace(SCOPE_SUFFIX, '');
      if (label === 'Record') { team.record = row.value; return; }
      stats.push({ label: label, value: PLACE_LABEL.test(label) ? ordinal(row.value) : row.value });
    });
    var featured = Array.isArray(layout.featured) ? layout.featured : [];
    var picked = featured.map(function (f) { return stats.filter(function (x) { return x.label === f; })[0]; }).filter(Boolean);
    team.tiles = (picked.length >= 2 ? picked : stats).slice(0, MAX_TILES);
    var emphasis = typeof layout.emphasis === 'string' ? layout.emphasis.toLowerCase() : '';
    order.sort(function (a, b) { return (b === emphasis ? 1 : 0) - (a === emphasis ? 1 : 0); });
    if (order.length === 1) {
      var only = groups[order[0]].slice(0, MAX_PLAYER_ROWS * 2);
      var half = Math.ceil(only.length / 2);
      team.columns = [{ group: order[0], title: groupTitle(order[0]), players: only.slice(0, half) }, { group: order[0], title: '', players: only.slice(half) }];
    } else {
      team.columns = order.slice(0, 2).map(function (g) { return { group: g, title: groupTitle(g), players: groups[g].slice(0, MAX_PLAYER_ROWS) }; });
    }
    var variant = layout.header === 'plain' || layout.header === 'matchup' ? layout.header : 'record';
    if (variant === 'matchup') {
      var next = stats.filter(function (x) { return /^(next|opponent|vs\b)/i.test(x.label); })[0];
      team.subline = next ? next.label + ': ' + next.value : team.record;
    } else if (variant === 'record') {
      team.subline = team.record;
    }
    return team;
  }

  /** "Coffee shop · 43 m, 1 min walk · Open until 18:00 · $$ · 4.5": only what the row carries. */
  function placeLine(p) {
    var away = [
      typeof p.distanceM === 'number' ? Math.round(p.distanceM) + ' m' : '',
      typeof p.etaMin === 'number' ? Math.max(1, Math.round(p.etaMin)) + ' min ' + (p.etaMode === 'drive' ? 'drive' : 'walk') : ''
    ].filter(Boolean).join(', ');
    var hours = p.openState === 'open' ? (p.closesAtLocal ? 'Open until ' + p.closesAtLocal : 'Open now')
      : p.openState === 'closed' ? (p.opensAtLocal ? 'Opens ' + p.opensAtLocal : 'Closed') : '';
    var price = p.priceLevel ? new Array(p.priceLevel + 1).join('$') : '';
    var rating = typeof p.rating === 'number' ? p.rating.toFixed(1) : '';
    return [p.category || '', away, hours, price, rating].filter(Boolean).join(' · ');
  }

  /** Pin positions in a 360x200 box: the items' bounds (plus the center), longitude scaled by latitude. */
  function pinsBecauseItems(items, center) {
    var pts = items.filter(function (i) { return typeof i.lat === 'number' && typeof i.lon === 'number'; });
    if (!pts.length) return [];
    var lats = pts.map(function (i) { return i.lat; });
    var lons = pts.map(function (i) { return i.lon; });
    if (center) { lats.push(center.lat); lons.push(center.lon); }
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLon = Math.min.apply(null, lons), maxLon = Math.max.apply(null, lons);
    var midLat = (minLat + maxLat) / 2, midLon = (minLon + maxLon) / 2;
    var k = Math.cos(midLat * Math.PI / 180);
    var spanLat = (maxLat - minLat) || 0.001;
    var spanLon = ((maxLon - minLon) || 0.001) * k;
    var scale = Math.min((MAP_W - 2 * PAD) / spanLon, (MAP_H - 2 * PAD) / spanLat);
    return pts.map(function (i, idx) {
      return { n: i.rank || idx + 1, x: MAP_W / 2 + (i.lon - midLon) * k * scale, y: MAP_H / 2 - (i.lat - midLat) * scale };
    });
  }

  function httpsUrl(raw) { var s = typeof raw === 'string' ? raw.trim() : ''; return /^https:\/\//i.test(s) ? s : ''; }
  function titleWords(raw) { return String(raw || '').trim().split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); }).join(' '); }
  var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function formatTripDates(rawDates, startIso, endIso, cardYear) {
    var dObj = rawDates && typeof rawDates === 'object' ? rawDates : null, sRaw = typeof rawDates === 'string' ? rawDates.trim() : String((dObj && (dObj.start || dObj.startDate)) || startIso || '').trim();
    if (dObj && typeof dObj.label === 'string' && dObj.label.trim()) return dObj.label.trim();
    var eRaw = String((dObj && (dObj.end || dObj.endDate)) || endIso || '').trim(), a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sRaw);
    var y1 = a ? a[1] : '', m1 = a ? MONTHS_SHORT[Number(a[2]) - 1] : '', d1 = a ? Number(a[3]) : 0, yr = (!cardYear || String(cardYear) !== y1) ? ', ' + y1 : '';
    var b = a && eRaw && eRaw !== sRaw ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(eRaw) : null, y2 = b ? b[1] : '', m2 = b ? MONTHS_SHORT[Number(b[2]) - 1] : '', d2 = b ? Number(b[3]) : 0;
    return !a ? sRaw : !b ? m1 + ' ' + d1 + yr : (y1 === y2 && a[2] === b[2] ? m1 + ' ' + d1 + '\u2013' + d2 + yr : y1 === y2 ? m1 + ' ' + d1 + '\u2013' + m2 + ' ' + d2 + yr : m1 + ' ' + d1 + ', ' + y1 + '\u2013' + m2 + ' ' + d2 + ', ' + y2);
  }
  function tripHistoryBecausePayload(payload) {
    var b = block(payload, 'trip_history') || payload.tripHistory || payload, countries = {}, cities = {}, year = b.year != null ? String(b.year).trim() : payload.year != null ? String(payload.year).trim() : '';
    var rawRows = Array.isArray(b.trips) ? b.trips : Array.isArray(payload.trips) ? payload.trips : Array.isArray(b.rows) ? b.rows : Array.isArray(payload.rows) ? payload.rows : [];
    (Array.isArray(b.countryCodes) ? b.countryCodes : []).forEach(function (c) { if (c) countries[String(c).trim().toUpperCase()] = 1; });
    var trips = rawRows.map(function (r) {
      var legs = Array.isArray(r.legs) ? r.legs : [], flightLegs = [], flights = [], stays = [], cityLabels = [], legAirports = [];
      var firstFrom = legs[0] && typeof (legs[0].from || legs[0].departureAirport || legs[0].origin) === 'string' ? String(legs[0].from || legs[0].departureAirport || legs[0].origin).trim() : '';
      var rowCountries = Array.isArray(r.countryCodes) ? r.countryCodes : Array.isArray(r.destinationCountryCodes) ? r.destinationCountryCodes : Array.isArray(r.countries) ? r.countries : r.country ? [r.country] : [];
      var rowCities = Array.isArray(r.cityCodes) ? r.cityCodes : Array.isArray(r.destinationCityCodes) ? r.destinationCityCodes : Array.isArray(r.cities) ? r.cities : (r.cityCode || r.city) ? [r.cityCode || r.city] : [];
      rowCountries.forEach(function (c) { if (c) countries[String(c).trim().toUpperCase()] = 1; }); rowCities.forEach(function (c) { if (c) cities[String(c).trim().toUpperCase()] = 1; });
      legs.forEach(function (l, idx) {
        if (!l || typeof l !== 'object') return;
        if (l.countryCode || l.country) countries[String(l.countryCode || l.country).trim().toUpperCase()] = 1;
        var from = String(l.from || l.departureAirport || l.origin || '').trim(), to = String(l.to || l.arrivalAirport || l.destination || '').trim();
        var fl = typeof l.flight === 'string' && l.flight.trim() ? l.flight.trim() : (l.airlineCode && l.flightNumber ? String(l.airlineCode).trim() + ' ' + String(l.flightNumber).trim() : '');
        if (from && to) flightLegs.push({ from: from, to: to, roundTrip: Boolean(l.roundTrip) }); else if (to && legAirports.indexOf(to) < 0) legAirports.push(to); if (fl && flights.indexOf(fl) < 0) flights.push(fl);
        var stay = typeof (l.hotel || l.stay || l.hotelName) === 'string' ? String(l.hotel || l.stay || l.hotelName).trim() : ''; if (stay && stays.indexOf(stay) < 0) stays.push(stay);
        var cName = typeof l.city === 'string' ? l.city.trim() : '', cQual = typeof (l.state || l.region || l.country) === 'string' ? String(l.state || l.region || l.country).trim() : '';
        var cDisp = cName ? (cQual && cName.indexOf(cQual) < 0 ? cName + ', ' + cQual : cName) : '', cityKey = String(l.cityCode || (idx > 0 && firstFrom && to === firstFrom ? '' : to) || cName).trim().toUpperCase();
        if (cDisp && cityLabels.indexOf(cDisp) < 0) cityLabels.push(cDisp); if (cityKey && !rowCities.length) cities[cityKey] = 1;
      });
      var isRtPair = flightLegs.length === 2 && flightLegs[0].from === flightLegs[1].to && flightLegs[0].to === flightLegs[1].from, multiRoute = flightLegs.length >= 2 ? [flightLegs[0].from].concat(flightLegs.map(function (fl) { return fl.to; })).join(' \u2192 ') : '';
      var route = flightLegs.length === 1 ? flightLegs[0].from + (flightLegs[0].roundTrip ? ' \u2194 ' : ' \u2192 ') + flightLegs[0].to : (isRtPair ? flightLegs[0].from + ' \u2194 ' + flightLegs[0].to : multiRoute);
      var loc = typeof r.location === 'string' && r.location.trim() ? r.location.trim() : (route || cityLabels.join(' \u2192 ') || legAirports[0] || (typeof r.cityCode === 'string' ? r.cityCode.trim() : ''));
      var detailParts = (flights.length ? [flights.join(' / ')] : []).concat(stays.length ? [stays.join(' \u00B7 ')] : (route && cityLabels.length ? [cityLabels.join(' \u00B7 ')] : (!route && cityLabels.length && legAirports.length ? [legAirports.join(', ')] : [])));
      return {
        title: typeof r.title === 'string' && r.title.trim() ? r.title.trim() : String(r.label || '').trim(), dates: formatTripDates(r.dates, r.startDate || r.start, r.endDate || r.end, year),
        location: loc, detail: typeof r.detail === 'string' && r.detail.trim() ? r.detail.trim() : detailParts.join(' \u00B7 '), id: String(r.id || r.tripId || (r.ref && r.ref.id) || '')
      };
    });
    var tripCount = typeof b.tripCount === 'number' ? b.tripCount : trips.length;
    var countriesCount = typeof b.countriesCount === 'number' ? b.countriesCount : Object.keys(countries).length, citiesCount = typeof b.citiesCount === 'number' ? b.citiesCount : Object.keys(cities).length;
    var stats = [{ key: 'trips', value: String(tripCount), label: tripCount === 1 ? 'Trip' : 'Trips' }, { key: 'countries', value: String(countriesCount), label: countriesCount === 1 ? 'Country' : 'Countries' }]
      .concat([{ key: 'cities', value: String(citiesCount), label: citiesCount === 1 ? 'City' : 'Cities' }], year ? [{ key: 'year', value: year, label: 'Year' }] : []);
    return { title: payload.title || b.title || 'Trips', tripCount: tripCount, countriesCount: countriesCount, citiesCount: citiesCount, year: year, stats: stats, trips: trips };
  }
  function placeDetailBecausePayload(payload) {
    var b = block(payload, 'place_detail') || payload.placeDetail || payload, links = Array.isArray(b.links) ? b.links : [], h = b.hours && typeof b.hours === 'object' ? b.hours : { state: 'unknown' };
    function linkUrl(k) { for (var i = 0; i < links.length; i++) if (links[i] && links[i].kind === k && httpsUrl(links[i].url)) return httpsUrl(links[i].url); return ''; }
    var hero = (b.heroImage && httpsUrl(b.heroImage.url)) || (b.photos && b.photos[0] && httpsUrl(b.photos[0].url)) || (b.art && httpsUrl(b.art.url)) || '', art = placeArtUrl((b.cuisine || b.menu) ? 'restaurant' : (b.category || payload.subtitle || ''));
    var hoursState = h.state === 'open' ? 'Open now' : h.state === 'closed' ? 'Closed' : 'Hours', hoursWeek = Array.isArray(b.hoursWeek) ? b.hoursWeek.filter(function (w) { return w && w.day && w.text; }) : [];
    var hoursDetail = h.text ? h.text : h.state === 'open' && h.closesAtLocal ? 'Until ' + clock12(h.closesAtLocal) : h.state === 'closed' && h.opensAtLocal ? 'Opens at ' + clock12(h.opensAtLocal) : 'Check website for today\u2019s hours';
    var phone = typeof b.phone === 'string' && /^[0-9+() \-./]+$/.test(b.phone.trim()) && /\d/.test(b.phone) ? b.phone.trim() : '', callUrl = phone ? 'tel:' + phone.replace(/[^0-9+]/g, '') : '', mapUrl = b.mapUrl ? httpsUrl(b.mapUrl) : directionsUrl(b.location || b);
    var websiteUrl = linkUrl('website') || httpsUrl(b.website), menuUrl = linkUrl('menu') || httpsUrl((b.menu && b.menu.url) || b.menuUrl), actions = [];
    if (callUrl) actions.push({ id: 'call', label: 'Call', url: callUrl, primary: b.primaryAction === 'call' }); if (mapUrl) actions.push({ id: 'directions', label: 'Directions', url: mapUrl, primary: b.primaryAction !== 'call' });
    if (websiteUrl) actions.push({ id: 'website', label: 'Website', url: websiteUrl, primary: false }); if (menuUrl && menuUrl !== websiteUrl) actions.push({ id: 'menu', label: 'Menu', url: menuUrl, primary: false });
    return {
      name: b.name || payload.title || '', category: titleWords(b.cuisine || b.category || payload.subtitle || ''), rating: typeof b.rating === 'number' ? '\u2605 ' + b.rating.toFixed(1) : '',
      price: typeof b.priceLevel === 'number' && b.priceLevel > 0 ? new Array(b.priceLevel + 1).join('$') : '', neighborhood: b.neighborhood || awayLine(b) || '', address: typeof b.address === 'string' ? b.address.trim() : '',
      hero: hero, art: art, hoursState: hoursState, hoursOpen: h.state === 'open', hoursClosed: h.state === 'closed', hoursDetail: hoursDetail, hoursWeek: hoursWeek, callUrl: callUrl, mapUrl: mapUrl, websiteUrl: websiteUrl, menuUrl: menuUrl, actions: actions
    };
  }
  function calendarEventBecausePayload(payload) {
    var b = block(payload, 'calendar_event') || payload.calendarEvent || payload, w = b.when && typeof b.when === 'object' ? b.when : {};
    var startLocal = typeof w.startLocal === 'string' ? w.startLocal : '', endLocal = typeof w.endLocal === 'string' ? w.endLocal : '', tz = w.tz && typeof w.tz.iana === 'string' ? w.tz.iana : 'UTC';
    var dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(startLocal), dt = dm ? new Date(Date.UTC(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), 12, 0, 0)) : null;
    var monthShort = dt ? new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' }).format(dt).toUpperCase() : '', dayNum = dm ? String(Number(dm[3])) : '';
    var dateLine = dt ? new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(dt) : startLocal.slice(0, 10);
    var st = startLocal.slice(11, 16), et = endLocal.slice(11, 16), timeLine = w.allDay ? 'All day' : (st ? clock12(st) + (et ? ' \u2013 ' + clock12(et) : '') : '');
    var title = b.title || payload.title || 'Event', location = typeof b.location === 'string' ? b.location.trim() : '';
    function compactIso(iso, allDay) { var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || ''); return m ? (allDay ? m[1] + m[2] + m[3] : m[1] + m[2] + m[3] + 'T' + (m[4] || '09') + (m[5] || '00') + '00') : ''; }
    var cStart = compactIso(startLocal, w.allDay), cEnd = compactIso(endLocal || startLocal, w.allDay), dtProp = w.allDay ? ';VALUE=DATE:' : (tz ? ';TZID=' + tz + ':' : ':');
    var icsText = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pack//Web Card//EN', 'BEGIN:VEVENT', 'SUMMARY:' + title, 'DTSTART' + dtProp + cStart, 'DTEND' + dtProp + cEnd].concat(location ? ['LOCATION:' + location] : [], ['END:VEVENT', 'END:VCALENDAR']).join('\r\n');
    var defaultGoogleUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) +
      '&dates=' + encodeURIComponent(cStart + '/' + cEnd) + (tz ? '&ctz=' + encodeURIComponent(tz) : '') + (location ? '&location=' + encodeURIComponent(location) : '');
    var googleUrl = (b.url || b.calendarUrl || b.googleUrl) ? httpsUrl(b.url || b.calendarUrl || b.googleUrl) : defaultGoogleUrl;
    var attendees = (Array.isArray(b.attendees) ? b.attendees : []).map(function (a) { return a && (a.name || a.email) ? (a.name ? a.name + ' (' + a.email + ')' : a.email) : ''; }).filter(Boolean);
    return {
      title: title, statusLabel: b.state === 'created' ? 'Added to calendar' : 'Calendar invite', calendarName: b.calendar && b.calendar.name ? b.calendar.name : '',
      monthShort: monthShort, dayNum: dayNum, dateLine: dateLine, timeLine: timeLine, tz: tz, location: location, attendees: attendees, icsText: icsText, googleUrl: googleUrl
    };
  }
  function fmtMoney(p, cur) {
    if (p == null || p === '') return '';
    if (typeof p === 'string') return p.trim();
    var c = String((p && p.currency) || cur || 'USD').toUpperCase(), sym = c === 'USD' ? '$' : c + ' ';
    if (typeof p === 'number') return sym + p;
    if (typeof p.total === 'number') return sym + p.total + ' total';
    if (typeof p.avgNightly === 'number') return sym + p.avgNightly + '/night';
    if (typeof p.amount === 'number') return sym + p.amount;
    return Array.isArray(p.perNight) && p.perNight.length ? sym + Math.round(p.perNight.reduce(function (s, n) { return s + (Number(n && n.amount) || 0); }, 0) / p.perNight.length) + '/night' : '';
  }
  function fmtIsoShort(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(String(iso || '').trim());
    return !m ? String(iso || '').trim() : MONTHS_SHORT[Number(m[2]) - 1] + ' ' + Number(m[3]) + (m[4] ? ' \u00B7 ' + clock12(m[4]) : '');
  }
  function composedBlockBecauseRaw(b, payload, out) {
    if (!b || typeof b !== 'object') return;
    var k = String(b.kind || '').trim();
    if (k === 'options_deck') {
      (Array.isArray(b.options) ? b.options : []).forEach(function (o) { if (o && o.item && typeof o.item === 'object') composedBlockBecauseRaw(Object.assign({}, o.item, { recommended: !!(o.recommended || o.item.recommended) }), payload, out); });
    } else if (k === 'day_brief') {
      var w = b.weather && typeof b.weather === 'object' ? b.weather : null;
      out.push({
        kind: 'day_brief', title: String(b.title || payload.title || ''), dateLabel: String(b.dateLabel || ''),
        weather: w ? { summary: String(w.summary || ''), temp: typeof w.tempF === 'number' ? Math.round(w.tempF) + '\u00B0F' : '', hiLo: (typeof w.highF === 'number' && typeof w.lowF === 'number') ? 'H ' + Math.round(w.highF) + '\u00B0 \u00B7 L ' + Math.round(w.lowF) + '\u00B0' : '', aqi: w.aqi && typeof w.aqi.value === 'number' ? 'AQI ' + w.aqi.value + (w.aqi.category ? ' (' + w.aqi.category + ')' : '') : '' } : null,
        facts: (Array.isArray(b.facts) ? b.facts : []).filter(function (f) { return f && f.text && !(w && f.group === 'conditions'); }).map(function (f) { return { text: String(f.text), needsYou: !!f.needsYou }; }),
        today: (Array.isArray(b.today) ? b.today : []).map(function (r) {
          var acts = (Array.isArray(r.actions) ? r.actions : []).filter(function (a) { return a && httpsUrl(a.url); }).map(function (a) { return { label: String(a.label || a.kind || 'Open'), url: httpsUrl(a.url) }; });
          if (httpsUrl(r.meetingUrl)) acts.unshift({ label: 'Join', url: httpsUrl(r.meetingUrl) });
          var trv = r.travel ? (r.travel.label || (typeof r.travel.minutes === 'number' ? r.travel.minutes + ' min ' + (r.travel.mode || 'drive') : '')) : '';
          return { title: String(r.title || r.line || ''), when: String(r.when || ''), where: String(r.where || r.address || ''), leaveBy: String(r.leaveBy || trv || ''), needsYou: !!r.needsYou, pending: !!r.pending, actions: acts };
        })
      });
    } else if (k === 'flight_option' || k === 'flight_outline') {
      var stops = typeof b.stops === 'number' ? (b.stops === 0 ? 'Nonstop' : b.stops + (b.stops === 1 ? ' stop' : ' stops')) : '', tm = [fmtIsoShort(b.departIso || b.departureTime || b.depart), fmtIsoShort(b.arriveIso || b.arrivalTime || b.arrive)].filter(Boolean).join(' \u2192 ');
      out.push({ kind: 'flight_option', title: [b.carrier || b.airline, b.flightNo || b.flightNumber].filter(Boolean).join(' ') || String(b.title || 'Flight'), line1: [b.origin || b.from || b.departureAirport, b.destination || b.to || b.arrivalAirport].filter(Boolean).join(' \u2192 '), line2: [tm, stops, b.cabin || ''].filter(Boolean).join(' \u00B7 '), price: fmtMoney(b.price != null ? b.price : b.total, b.currency), why: String(b.why || ''), tags: Array.isArray(b.tags) ? b.tags.map(String) : [], url: httpsUrl(b.bookingUrl || b.url), btn: 'Book' });
    } else if (k === 'hotel_option' || k === 'hotel_outline') {
      var rt = typeof b.rating === 'number' ? '\u2605 ' + b.rating.toFixed(1) : '', nt = typeof b.nights === 'number' ? b.nights + (b.nights === 1 ? ' night' : ' nights') : '';
      out.push({ kind: 'hotel_option', title: String(b.name || b.title || 'Stay'), line1: [b.area || b.neighborhood || b.city || '', rt, nt].filter(Boolean).join(' \u00B7 '), line2: formatTripDates(b.dates, b.checkInIso || b.checkIn, b.checkOutIso || b.checkOut, ''), price: fmtMoney(b.price || b.nightlyPrice || b.total, b.currency), why: String(b.why || ''), tags: Array.isArray(b.tags) ? b.tags.map(String) : [], url: httpsUrl(b.bookingUrl || b.url), btn: 'Book' });
    } else if (k === 'event_ticket') {
      var seat = [b.section ? 'Sec ' + b.section : '', b.row ? 'Row ' + b.row : '', b.seat ? 'Seat ' + b.seat : ''].filter(Boolean).join(' \u00B7 ') || String(b.seatInfo || ''), qty = typeof (b.quantity || b.tickets) === 'number' ? (b.quantity || b.tickets) + 'x' : '';
      out.push({ kind: 'event_ticket', title: String(b.title || b.eventName || b.name || 'Ticket'), line1: [b.venue || b.venueName || b.location || '', qty].filter(Boolean).join(' \u00B7 '), line2: [b.when || fmtIsoShort(b.startIso || b.startLocal || b.date), seat, b.confirmationCode || b.orderId || b.barcode || ''].filter(Boolean).join(' \u00B7 '), price: fmtMoney(b.price != null ? b.price : b.total, b.currency), why: String(b.why || ''), tags: [], url: httpsUrl(b.url || b.ticketUrl), btn: 'View ticket' });
    } else if (k === 'trip_leg' || k === 'trip_option') {
      var legs = [];
      function pushLeg(lg, lbl) {
        if (lg && typeof lg === 'object') legs.push({ code: [lg.carrier || lg.airline, lg.flightNo || lg.flightNumber].filter(Boolean).join(' ') || String(lg.flight || lg.mode || lbl || ''), route: [lg.origin || lg.from || lg.departureAirport, lg.destination || lg.to || lg.arrivalAirport].filter(Boolean).join(' \u2192 '), time: [fmtIsoShort(lg.departIso || lg.startIso || lg.when), fmtIsoShort(lg.arriveIso || lg.endIso)].filter(Boolean).join(' \u2192 ') });
      }
      if (b.outbound || b.stay || b.return) { pushLeg(b.outbound, 'Outbound'); pushLeg(b.return, 'Return'); } else pushLeg(b, b.title || 'Leg');
      var st = b.stay && typeof b.stay === 'object' ? { name: String(b.stay.name || ''), meta: [b.stay.area || '', formatTripDates(null, b.stay.checkInIso, b.stay.checkOutIso, ''), typeof b.stay.nights === 'number' ? b.stay.nights + (b.stay.nights === 1 ? ' night' : ' nights') : '', fmtMoney(b.stay.nightlyPrice || b.stay.price, b.stay.currency)].filter(Boolean).join(' \u00B7 ') } : null;
      out.push({ kind: 'trip_leg', title: String(b.title || (st && st.name) || ''), legs: legs, stay: st, price: fmtMoney(b.total != null ? b.total : b.price, b.currency), why: String(b.why || b.detail || ''), url: httpsUrl(b.bookingUrl || b.url || (b.outbound && b.outbound.bookingUrl) || (b.stay && b.stay.bookingUrl)) });
    } else if (k === 'price_breakdown' || k === 'key_value') {
      var rawRows = (Array.isArray(b.lines) ? b.lines : Array.isArray(b.rows) ? b.rows : Array.isArray(b.items) ? b.items : Array.isArray(b.fields) ? b.fields : []).concat(Array.isArray(b.fees) ? b.fees : []);
      var rows = rawRows.map(function (r) {
        return { label: String((r && (r.label || r.key || r.name || r.title)) || '') + (r && typeof r.quantity === 'number' && r.quantity > 1 ? ' (' + r.quantity + 'x)' : ''), value: k === 'price_breakdown' ? fmtMoney(r && (r.amount != null ? r.amount : r.price != null ? r.price : r.value), b.currency) : String((r && r.value != null) ? r.value : '') };
      }).filter(function (r) { return r.label || r.value; });
      out.push({ kind: k, title: String(b.title || b.heading || (k === 'price_breakdown' ? 'Price breakdown' : '')), rows: rows, total: k === 'price_breakdown' ? fmtMoney(b.total, b.currency) : '', note: String(b.note || b.caption || '') });
    } else if (k === 'text_note') {
      out.push({ kind: 'text_note', title: String(b.title || b.heading || ''), lines: Array.isArray(b.lines) ? b.lines.map(String) : [String(b.text || b.body || b.note || b.summary || '')].filter(Boolean), tone: String(b.tone || b.variant || 'info') });
    } else if (k === 'steps') {
      out.push({ kind: 'steps', title: String(b.title || b.heading || ''), summary: String(b.summary || ''), steps: (Array.isArray(b.steps) ? b.steps : []).map(function (s, i) { return typeof s === 'string' ? { n: i + 1, title: s, detail: '', duration: '', state: 'todo' } : { n: s.n || s.step || i + 1, title: String(s.title || s.label || s.text || ''), detail: String((s.title && s.text ? s.text : '') || s.detail || s.note || ''), duration: String(s.duration || ''), state: String(s.state || 'todo') }; }) });
    } else if (k === 'standings') {
      var sRows = Array.isArray(b.rows) ? b.rows : Array.isArray(b.teams) ? b.teams : [];
      out.push({ kind: 'standings', title: String(b.title || b.heading || b.division || 'Standings'), subtitle: [b.division && b.title && b.division !== b.title ? b.division : '', b.season != null ? String(b.season) : ''].filter(Boolean).join(' \u00B7 '), rows: sRows.map(function (r, i) { var wv = r.w != null ? r.w : r.wins != null ? r.wins : r.won, lv = r.l != null ? r.l : r.losses != null ? r.losses : r.lost, tv = r.t != null ? r.t : r.ties; return { rank: r.rank || r.position || i + 1, team: String(r.team || r.name || r.abbr || ''), value: [[wv, lv, tv].filter(function (v) { return v != null; }).join('-'), r.pct || '', r.gb ? 'GB ' + r.gb : '', r.streak || ''].filter(Boolean).join(' \u00B7 '), highlight: !!r.highlight }; }) });
    } else if (k === 'order_confirm') {
      var ch = b.choice && Array.isArray(b.choice.options) ? { label: String(b.choice.label || 'Option'), options: b.choice.options.map(String), selected: String(b.choice.selected || b.choice.options[0] || '') } : null;
      out.push({ kind: 'order_confirm', item: String(b.item || b.itemName || payload.title || 'Order').trim(), qty: typeof (b.qty || b.quantity) === 'number' ? (b.qty || b.quantity) : 1, meta: [b.store || b.merchant || b.storeHost || '', b.fulfillment || 'delivery', b.eta || b.deliveryEta || ''].filter(Boolean).join(' \u00B7 '), deliverTo: String(b.deliverTo || b.deliveryAddress || ''), total: fmtMoney(b.total, b.currency) || 'At checkout', button: String(b.button || b.doorLabel || 'Review & pay'), choice: ch });
    } else if (k === 'permission_request') {
      var dr = b.draft && typeof b.draft === 'object' ? { to: String(b.draft.to || ''), subject: String(b.draft.subject || ''), body: String(b.draft.body || '') } : null;
      out.push({ kind: 'permission_request', title: String(b.title || payload.title || 'Permission request'), badge: [b.provider, b.capability].filter(Boolean).join(' \u00B7 '), draft: dr, options: (Array.isArray(b.options) ? b.options : []).map(function (o) { return { label: String(o.label || o.id || ''), description: String(o.description || ''), selected: o.id === b.defaultOptionId }; }) });
    } else {
      if (typeof console !== 'undefined' && console.warn) console.warn('[a-card] block fallback', { kind: k });
      var fbRows = (Array.isArray(b.rows) ? b.rows : Array.isArray(b.items) ? b.items : Array.isArray(b.facts) ? b.facts : []).map(function (r) { return { label: String((r && (r.label || r.title || r.name || r.kind)) || ''), value: String((r && (r.value != null ? r.value : r.text != null ? r.text : r.subtitle || '')) || '') }; }).filter(function (r) { return r.label || r.value; });
      if (!fbRows.length && Array.isArray(b.cells) && b.cells.length) fbRows.push({ label: String(b.title || 'Total'), value: b.cells.length + ' days' });
      out.push({ kind: 'key_value', title: String(b.title || b.heading || b.label || kindLabel(k || 'section')), rows: fbRows, total: '', note: '' });
    }
  }

  function viewModelBecausePayload(payload) {
    var kind = payload && payload.kind ? String(payload.kind) : '';
    var model = { kind: kind, label: kindLabel(kind), title: '', team: null, agenda: null, tripHistory: null, placeDetail: null, calendarEvent: null, composedBlocks: [], mapImage: '', mapPins: [], sections: [], steps: [], places: [], pins: [], items: [], source: '', host: '', asOf: '' };
    if (!payload) return model;
    if (kind === 'trip' && payload.data) {
      model.title = payload.data.title || 'Trip';
      model.items = (payload.data.items || []).map(function (i) {
        return { title: i.title || i.type || '', detail: [i.date, i.time].filter(Boolean).join(' ') };
      });
      return model;
    }
    model.title = payload.title || '';
    if (kind === 'guide' && payload.guide) {
      model.title = payload.guide.title || model.title;
      model.steps = (payload.guide.steps || []).map(function (s) { return { n: s.n, text: s.text, action: s.action || null }; });
    } else if (kind === 'place_list' && (payload.placeList || block(payload, 'place_list'))) {
      var list = block(payload, 'place_list') || payload.placeList;
      var items = list.items || [];
      model.places = items.slice(0, MAX_PLACES).map(function (p, i) {
        var url = typeof p.url === 'string' && /^https:\/\//i.test(p.url) ? p.url : directionsUrl(p);
        return { rank: p.rank || i + 1, name: p.name, detail: placeLine(p), category: p.category || '', away: awayLine(p), hours: hoursLine(p), open: p.openState === 'open', hoursState: p.openState === 'open' ? 'Open' : p.openState === 'closed' ? 'Closed' : '', hoursDetail: p.openState === 'open' && p.closesAtLocal ? 'Closes at ' + clock12(p.closesAtLocal) : p.openState === 'closed' && p.opensAtLocal ? 'Opens at ' + clock12(p.opensAtLocal) : '', rating: typeof p.rating === 'number' ? p.rating.toFixed(1) : '', price: p.priceLevel ? new Array(p.priceLevel + 1).join('$') : '', art: placeArtUrl(p.category), why: p.why || '', url: url, photo: typeof p.photoUrl === 'string' && /^https:\/\//i.test(p.photoUrl) ? p.photoUrl : '' };
      });
      model.pins = pinsBecauseItems(items.slice(0, MAX_PLACES), list.center);
      model.mapPins = Array.isArray(list.mapPins) ? list.mapPins.filter(function (q) { return q && typeof q.x === 'number' && typeof q.y === 'number'; }) : [];
      var mapUrl = list.mapImageUrl || payload.mapImageUrl;
      model.mapImage = typeof mapUrl === 'string' && /^https:\/\//i.test(mapUrl) ? mapUrl : '';
    } else if (kind === 'agenda' && block(payload, 'agenda')) {
      model.agenda = agendaBecauseBlock(block(payload, 'agenda'));
      model.title = model.agenda.title || model.title;
    } else if (kind === 'sports_team') {
      model.team = teamBecausePayload(payload);
      model.sections = sectionsBecauseRows(payload.rows);
    } else if (kind === 'trip_history') { model.tripHistory = tripHistoryBecausePayload(payload);
    } else if (kind === 'place_detail') { model.placeDetail = placeDetailBecausePayload(payload); model.title = model.placeDetail.name || model.title;
    } else if (kind === 'calendar_event') { model.calendarEvent = calendarEventBecausePayload(payload); model.title = model.calendarEvent.title || model.title;
    } else {
      (Array.isArray(payload.blocks) ? payload.blocks : Array.isArray(payload.sections) ? payload.sections : []).forEach(function (rb) { composedBlockBecauseRaw(rb, payload, model.composedBlocks); });
      if (!model.composedBlocks.length && payload.item && typeof payload.item === 'object') composedBlockBecauseRaw(payload.item, payload, model.composedBlocks);
      if (!model.composedBlocks.length) model.sections = sectionsBecauseRows(payload.rows);
    }
    var source = payload.source || (payload.guide && payload.guide.source) || '';
    model.source = /^https:\/\//i.test(source) ? source : '';
    model.host = hostOf(model.source);
    model.asOf = dayOf(payload.asOf || (payload.guide && payload.guide.asOf));
    return model;
  }

  function actionHref(action) {
    if (!action || typeof action.url !== 'string') return '';
    if (action.kind === 'open_url' && /^https:\/\//i.test(action.url)) return action.url;
    if (action.kind === 'webcal' && /^webcal:\/\//i.test(action.url)) return action.url;
    return '';
  }

  function messageBecauseStatus(status) {
    if (status === 404) return 'This link has expired or does not exist.';
    if (status === 401) return SIGN_IN_PRIVATE;
    if (status === 403) return NO_ACCESS;
    return 'This card could not be loaded right now.';
  }

  /** place_list: a dark map frame (server tiles or pin plot) with photo pins and a swipeable card floating over it. Swiping selects the pin. */
  function renderPlaceFrame(doc, model, el) {
    var frame = el('div', 'placeFrame');
    var mapArea = el('div', 'mapArea');
    var pinEls = [];
    function drawPlot() {
      var NS = 'http://www.w3.org/2000/svg';
      var svg = renderMap(doc, model.pins.map(function (p) { return { n: p.n, x: p.x, y: p.y }; }), true);
      mapArea.appendChild(svg);
    }
    if (model.mapImage) {
      var img = doc.createElement('img');
      img.className = 'mapImage';
      img.src = model.mapImage;
      img.alt = 'Map of the places';
      img.addEventListener('error', function () {
        if (img.parentNode) img.parentNode.removeChild(img);
        pinEls.forEach(function (p) { p.remove ? p.remove() : p.parentNode && p.parentNode.removeChild(p); });
        pinEls = [];
        drawPlot();
      });
      mapArea.appendChild(img);
      model.places.forEach(function (p, i) {
        var q = model.mapPins[i];
        if (!q) return;
        var pin = el('button', 'pin');
        pin.type = 'button';
        pin.setAttribute('aria-label', 'Show ' + p.name);
        pin.style.left = (q.x * 100) + '%';
        pin.style.top = (q.y * 100) + '%';
        if (p.photo) { var pi = doc.createElement('img'); pi.src = p.photo; pi.alt = ''; pin.appendChild(pi); } else pin.textContent = String(p.rank);
        pin.addEventListener('click', function () { select(i, true); });
        mapArea.appendChild(pin);
        pinEls.push(pin);
      });
    } else if (model.pins.length) drawPlot();
    frame.appendChild(mapArea);
    var rail = el('div', 'rail');
    var cards = [];
    model.places.forEach(function (p, i) {
      var c = p.url ? el('a', 'placeCard') : el('div', 'placeCard');
      if (p.url) { c.href = p.url; c.rel = 'noopener noreferrer'; }
      var ph = el('div', 'placePhotoWrap');
      var im = doc.createElement('img');
      im.src = p.photo || p.art;
      im.alt = '';
      im.loading = 'lazy';
      ph.appendChild(im);
      ph.appendChild(el('span', 'rank', String(p.rank)));
      if (p.rating) ph.appendChild(el('span', 'ratingBadge', '\u2605 ' + p.rating));
      var dots = el('div', 'dots');
      model.places.forEach(function (_, d) { dots.appendChild(el('i', d === i ? 'on' : '')); });
      ph.appendChild(dots);
      c.appendChild(ph);
      c.appendChild(el('span', 'placeName', p.name));
      c.appendChild(el('span', 'placeMeta', [p.category, p.away, p.price].filter(Boolean).join(' \u00B7 ')));
      if (p.hoursState) {
        var hr = el('span', 'placeMeta');
        hr.appendChild(el('b', p.open ? 'open' : 'closed', p.hoursState));
        if (p.hoursDetail) hr.appendChild(doc.createTextNode(' \u00B7 ' + p.hoursDetail));
        c.appendChild(hr);
      }
      if (p.why) c.appendChild(el('span', 'chip', p.why));
      rail.appendChild(c);
      cards.push(c);
    });
    function select(i, scroll) {
      pinEls.forEach(function (p, j) { p.className = j === i ? 'pin on' : 'pin'; });
      if (scroll && cards[i] && rail.scrollTo) rail.scrollTo({ left: cards[i].offsetLeft - 12, behavior: 'smooth' });
    }
    rail.addEventListener('scroll', function () {
      var w = cards[0] ? cards[0].offsetWidth + 8 : 1;
      select(Math.max(0, Math.min(cards.length - 1, Math.round(rail.scrollLeft / w))), false);
    });
    select(0, false);
    frame.appendChild(rail);
    return frame;
  }


  /** agenda: the living shared agenda, grouped by day in its own time zone. Names only (the server serves opaque member ids). */
  function dayKeyIn(iso, tz) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); }
  }
  function dayLabelIn(iso, tz) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); }
  }
  function clockIn(iso, tz) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(iso)).replace(':00', ''); } catch (e) { return ''; }
  }

  function agendaBecauseBlock(b) {
    var tz = typeof b.timeZone === 'string' && b.timeZone ? b.timeZone : 'UTC';
    var names = {};
    var members = (b.members || []).map(function (m) { names[m.id] = m.name; return { name: m.name, role: m.role, shared: m.events === 'shared', waiting: m.events === 'pending' }; });
    var viewerId = b.viewer && b.viewer.memberId;
    var days = [];
    var byKey = {};
    var placed = 0;
    var pins = [];
    (b.events || []).forEach(function (e) {
      var key = dayKeyIn(e.startIso, tz);
      if (!byKey[key]) { byKey[key] = { label: dayLabelIn(e.startIso, tz), events: [] }; days.push(byKey[key]); }
      var mine = (e.attendees || []).filter(function (a) { return a.memberId === viewerId; })[0];
      var hasPlace = typeof e.lat === 'number' && typeof e.lon === 'number';
      if (hasPlace) placed += 1;
      var time = e.allDay ? 'All day' : clockIn(e.startIso, tz) + (e.endIso ? '–' + clockIn(e.endIso, tz) : '');
      byKey[key].events.push({
        title: e.title, time: time, venue: e.venue || '', pin: hasPlace ? placed : 0,
        host: e.host || '', status: mine ? STATUS_LABEL[mine.status] || '' : '',
        who: (e.attendees || []).map(function (a) { return a.memberId === viewerId ? 'You' : names[a.memberId] || ''; }).filter(Boolean),
        rsvp: typeof e.rsvpUrl === 'string' && /^https:\/\//i.test(e.rsvpUrl) ? e.rsvpUrl : '',
        directions: hasPlace ? directionsUrl(e) : '',
        image: typeof e.imageUrl === 'string' && /^https:\/\//i.test(e.imageUrl) ? e.imageUrl : ''
      });
    });
    var mapUrl = typeof b.mapImageUrl === 'string' && /^https:\/\//i.test(b.mapImageUrl) ? b.mapImageUrl : '';
    return {
      title: b.title || 'Agenda', members: members, days: days, count: (b.events || []).length,
      needsConsent: !!(b.viewer && b.viewer.needsConsent), asOf: b.asOf || '', source: b.source || '',
      mapImage: mapUrl,
      mapPins: Array.isArray(b.mapPins) ? b.mapPins.filter(function (q) { return q && typeof q.x === 'number' && typeof q.y === 'number'; }) : []
    };
  }

  function renderAgenda(doc, card, agenda, el) {
    var head = el('header', 'agendaHead');
    head.appendChild(el('p', 'kind', 'Shared agenda'));
    head.appendChild(el('h1', 'title', agenda.title));
    var count = agenda.count + (agenda.count === 1 ? ' event' : ' events') + ' · ' + agenda.members.length + (agenda.members.length === 1 ? ' person' : ' people');
    head.appendChild(el('p', 'agendaCount', count));
    var chips = el('div', 'agendaMembers');
    agenda.members.forEach(function (m) { chips.appendChild(el('span', m.shared ? 'memberChip' : 'memberChip quiet', m.name + (m.waiting ? ' (not shared yet)' : ''))); });
    head.appendChild(chips);
    card.appendChild(head);
    if (agenda.needsConsent) card.appendChild(el('p', 'agendaNote', 'Your events are not in this agenda yet. Open Pack to choose what to share.'));
    if (agenda.mapImage) {
      var frame = el('div', 'agendaMap');
      var img = doc.createElement('img');
      img.src = agenda.mapImage; img.alt = 'Map of the events'; img.className = 'mapImage';
      img.addEventListener('error', function () { if (frame.parentNode) frame.parentNode.removeChild(frame); });
      frame.appendChild(img);
      agenda.mapPins.forEach(function (q, i) {
        var pin = el('span', 'pin static', String(i + 1));
        pin.style.left = (q.x * 100) + '%';
        pin.style.top = (q.y * 100) + '%';
        frame.appendChild(pin);
      });
      card.appendChild(frame);
    }
    if (!agenda.days.length) card.appendChild(el('p', 'agendaNote', 'Nothing on the agenda yet.'));
    agenda.days.forEach(function (day) {
      var sec = el('section', 'agendaDay');
      sec.appendChild(el('h2', 'dayLabel', day.label));
      day.events.forEach(function (ev) {
        var row = el('div', 'agendaEvent');
        row.appendChild(el('span', 'agendaTime', ev.time));
        var body = el('div', 'agendaBody');
        if (ev.rsvp) { var a = el('a', 'agendaTitle', ev.title); a.href = ev.rsvp; a.target = '_blank'; a.rel = 'noopener noreferrer'; body.appendChild(a); }
        else body.appendChild(el('span', 'agendaTitle', ev.title));
        var meta = [ev.venue, ev.host ? 'Hosted by ' + ev.host : ''].filter(Boolean).join(' · ');
        if (meta) body.appendChild(el('span', 'agendaMeta', meta));
        if (ev.who.length) body.appendChild(el('span', 'agendaMeta', ev.who.join(', ')));
        if (ev.status || ev.pin || ev.directions) {
          var tags = el('span', 'agendaTags');
          if (ev.pin) tags.appendChild(el('span', 'rank', String(ev.pin)));
          if (ev.status) tags.appendChild(el('span', 'chip', ev.status));
          if (ev.directions) { var d = el('a', 'agendaDirections', 'Directions'); d.href = ev.directions; d.target = '_blank'; d.rel = 'noopener noreferrer'; tags.appendChild(d); }
          body.appendChild(tags);
        }
        row.appendChild(body);
        sec.appendChild(row);
      });
      card.appendChild(sec);
    });
  }

  function renderSource(doc, card, model, el) {
    var line = model.team && model.team.provenance ? model.team.provenance : '';
    if (!model.source && !line) return;
    var src = el('p', 'source');
    if (line) src.appendChild(doc.createTextNode(line + (model.source ? ' · ' : '')));
    if (model.source) {
      var link = el('a', '', 'Source: ' + model.host);
      link.href = model.source;
      link.rel = 'noopener noreferrer';
      src.appendChild(link);
      if (model.asOf) src.appendChild(doc.createTextNode(', as of ' + model.asOf));
    }
    card.appendChild(src);
  }

  function renderMap(doc, pins, plot) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + MAP_W + ' ' + MAP_H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('class', 'map');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Map of the places');
    pins.forEach(function (pin) {
      var c = doc.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(pin.x)); c.setAttribute('cy', String(pin.y)); c.setAttribute('r', '13'); c.setAttribute('fill', '#f0c62d');
      var t = doc.createElementNS(NS, 'text');
      t.setAttribute('x', String(pin.x)); t.setAttribute('y', String(pin.y + 4)); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '13'); t.setAttribute('font-weight', '700'); t.setAttribute('fill', '#1e1e1e');
      t.textContent = String(pin.n);
      svg.appendChild(c); svg.appendChild(t);
    });
    return svg;
  }

  function renderTeam(doc, card, team, el) {
    var head = el('header', 'teamHead');
    if (team.accent) head.style.background = team.accent;
    var text = el('div', 'teamText');
    var fullTitle = team.season ? team.name + ' ' + team.season : team.name;
    var fit = headerTitleFit(fullTitle);
    var h1 = el('h1', fit.lines === 2 ? 'teamName two' : 'teamName', fullTitle);
    h1.style.fontSize = fit.fontSize + 'px';
    text.appendChild(h1);
    if (team.subline) text.appendChild(el('p', 'teamRecord', team.subline));
    head.appendChild(text);
    if (team.logo) { var logo = doc.createElement('img'); logo.className = 'teamLogo'; logo.src = team.logo; logo.alt = team.name + ' logo'; head.appendChild(logo); }
    card.appendChild(head);
    if (team.tiles.length) {
      var tiles = el('div', 'tiles');
      team.tiles.forEach(function (t) {
        var tile = el('div', 'tile');
        tile.appendChild(el('span', 'tileValue', t.value));
        tile.appendChild(el('span', 'tileLabel', t.label));
        tiles.appendChild(tile);
      });
      card.appendChild(tiles);
    }
    if (team.columns.some(function (c) { return c.players.length; })) {
      var cols = el('div', 'players');
      team.columns.forEach(function (g) {
        var col = el('div', 'playerCol');
        col.appendChild(el('h2', 'colHead', g.title));
        g.players.forEach(function (pl) {
          var row = el('div', 'player');
          row.appendChild(el('span', 'playerName', pl.name));
          row.appendChild(el('span', 'playerLine', pl.line));
          col.appendChild(row);
        });
        cols.appendChild(col);
      });
      card.appendChild(cols);
    }
  }

  function renderTripHistory(doc, card, th, el) {
    var stats = el('div', 'tripStats'), ul = el('ul', 'tripList'); card.appendChild(el('p', 'kind', 'Trip history')); card.appendChild(el('h1', 'title', th.title));
    th.stats.forEach(function (s) { var st = el('div', 'tripStat'); st.appendChild(el('span', 'tripStatVal', s.value)); st.appendChild(el('span', 'tripStatLbl', s.label)); stats.appendChild(st); });
    card.appendChild(stats);
    th.trips.forEach(function (t) {
      var li = el('li', 'tripRow'), top = el('div', 'tripTop'), sub = el('div', 'tripSub');
      top.appendChild(el('span', 'tripTitle', t.title)); if (t.dates) top.appendChild(el('span', 'tripDates', t.dates));
      if (t.location) sub.appendChild(el('span', 'tripLoc', t.location)); if (t.detail) sub.appendChild(el('span', 'tripDetail', t.detail));
      li.appendChild(top); li.appendChild(sub); ul.appendChild(li);
    });
    card.appendChild(ul);
  }
  function renderPlaceDetail(doc, card, pd, el) {
    var hero = el('div', 'placeHero'), scrim = el('div', 'placeHeroScrim'), heroSrc = typeof pd.hero === 'string' && /^https:\/\//i.test(pd.hero) ? pd.hero : pd.art;
    if (heroSrc) { var img = doc.createElement('img'); img.className = 'placeHeroImg'; img.src = heroSrc; img.alt = pd.name; hero.appendChild(img); }
    if (pd.category) scrim.appendChild(el('span', 'placeHeroBadge', pd.category));
    scrim.appendChild(el('h1', 'placeHeroTitle', pd.name)); hero.appendChild(scrim); card.appendChild(hero);
    var meta = (pd.rating || pd.price || pd.neighborhood) ? [pd.category, pd.rating, pd.price, pd.neighborhood].filter(Boolean).join(' \u00B7 ') : '', hrs = el('div', 'placeDetailHours');
    if (meta) card.appendChild(el('p', 'placeDetailMeta', meta)); if (pd.address) card.appendChild(el('p', 'placeAddress', pd.address));
    hrs.appendChild(el('b', pd.hoursOpen ? 'open' : pd.hoursClosed ? 'closed' : '', pd.hoursState)); if (pd.hoursDetail) hrs.appendChild(doc.createTextNode(' \u00B7 ' + pd.hoursDetail));
    if (pd.hoursWeek.length) {
      var wk = el('div', 'placeWeek');
      pd.hoursWeek.forEach(function (w) { var r = el('div', 'placeWeekRow'); r.appendChild(el('span', 'label', w.day)); r.appendChild(el('span', 'value', w.text)); wk.appendChild(r); });
      hrs.appendChild(wk);
    }
    card.appendChild(hrs);
    if (pd.actions.length) {
      var act = el('div', 'placeActions');
      pd.actions.forEach(function (a) {
        if (!a || typeof a.url !== 'string' || !(/^https:\/\//i.test(a.url) || (a.id === 'call' && /^tel:\+?[0-9]+$/.test(a.url)))) return;
        var btn = el('a', a.primary ? 'placeActionBtn primary' : 'placeActionBtn', a.label); btn.href = a.url;
        if (/^https:\/\//i.test(a.url)) { btn.target = '_blank'; btn.rel = 'noopener noreferrer'; } act.appendChild(btn);
      });
      if (act.childNodes.length) card.appendChild(act);
    }
  }
  function renderCalendarEvent(doc, card, cal, el) {
    var head = el('div', 'calHead'), tb = el('div', 'calTimeBlock'), tm = el('div', 'calTimeMeta'), acts = el('div', 'calActions');
    head.appendChild(el('span', 'calBadge', cal.statusLabel)); if (cal.calendarName) head.appendChild(el('span', 'kind', cal.calendarName));
    card.appendChild(head); card.appendChild(el('h1', 'calTitle', cal.title));
    if (cal.monthShort && cal.dayNum) { var db = el('div', 'calDateBox'); db.appendChild(el('span', 'calMonth', cal.monthShort)); db.appendChild(el('span', 'calDay', cal.dayNum)); tb.appendChild(db); }
    if (cal.dateLine) tm.appendChild(el('span', 'calDateLine', cal.dateLine)); if (cal.timeLine) tm.appendChild(el('span', 'calTimePrimary', cal.timeLine)); if (cal.tz) tm.appendChild(el('span', 'calTz', cal.tz));
    tb.appendChild(tm); card.appendChild(tb);
    if (cal.location) { var lr = el('div', 'row'); lr.appendChild(el('span', 'label', 'Location')); lr.appendChild(el('span', 'value', cal.location)); card.appendChild(lr); }
    if (cal.attendees.length) { var ar = el('div', 'row'); ar.appendChild(el('span', 'label', 'Guests')); ar.appendChild(el('span', 'value', cal.attendees.join(', '))); card.appendChild(ar); }
    if (typeof cal.googleUrl === 'string' && /^https:\/\//i.test(cal.googleUrl)) { var add = el('a', 'calAddBtn', 'Add to Calendar'); add.href = cal.googleUrl; add.target = '_blank'; add.rel = 'noopener noreferrer'; acts.appendChild(add); card.appendChild(acts); }
  }
  function renderComposedBlock(doc, card, b, el) {
    var sec = el('section', 'cBlock c-' + b.kind);
    function addLink(parent, cls, label, url) {
      if (!httpsUrl(url)) return;
      var a = el('a', cls, label); a.href = httpsUrl(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; parent.appendChild(a);
    }
    if (b.kind === 'day_brief') {
      if (b.dateLabel) sec.appendChild(el('p', 'cMuted', b.dateLabel));
      if (b.weather) {
        var wx = el('div', 'cHeroRow'), wm = el('div', 'cCol'), sub = [b.weather.hiLo, b.weather.aqi].filter(Boolean).join(' \u00B7 ');
        wx.appendChild(el('span', 'cHeroVal', b.weather.temp)); if (b.weather.summary) wm.appendChild(el('span', 'cStrong', b.weather.summary)); if (sub) wm.appendChild(el('span', 'cMuted', sub));
        wx.appendChild(wm); sec.appendChild(wx);
      }
      b.facts.forEach(function (f) { sec.appendChild(el('p', f.needsYou ? 'cCallout warn' : 'cCallout', f.text)); });
      b.today.forEach(function (r) {
        var row = el('div', 'cItem'), top = el('div', 'cRowTop'), meta = [r.where, r.leaveBy].filter(Boolean).join(' \u00B7 ');
        top.appendChild(el('span', 'cTime', r.when)); top.appendChild(el('span', 'cStrong', r.title)); if (r.pending) top.appendChild(el('span', 'cPill', 'Pending'));
        row.appendChild(top); if (meta) row.appendChild(el('p', 'cMuted', meta));
        if (r.actions.length) { var acts = el('div', 'cActions'); r.actions.forEach(function (a) { addLink(acts, 'cBtn', a.label, a.url); }); row.appendChild(acts); }
        sec.appendChild(row);
      });
    } else if (b.kind === 'flight_option' || b.kind === 'hotel_option' || b.kind === 'event_ticket') {
      var head = el('div', 'cRowTop'); head.appendChild(el('span', 'cStrong', b.title)); if (b.price) head.appendChild(el('span', 'cPrice', b.price)); sec.appendChild(head);
      if (b.line1) sec.appendChild(el('p', 'cMeta', b.line1)); if (b.line2) sec.appendChild(el('p', 'cMuted', b.line2)); if (b.why) sec.appendChild(el('p', 'cWhy', b.why));
      if (b.tags && b.tags.length) { var tg = el('div', 'cChips'); b.tags.forEach(function (t) { tg.appendChild(el('span', 'cPill', t)); }); sec.appendChild(tg); }
      addLink(sec, 'cBtn', b.btn, b.url);
    } else if (b.kind === 'trip_leg') {
      var th = el('div', 'cRowTop'); if (b.title) th.appendChild(el('span', 'cStrong', b.title)); if (b.price) th.appendChild(el('span', 'cPrice', b.price)); if (th.childNodes.length) sec.appendChild(th);
      b.legs.forEach(function (lg) { var lr = el('div', 'cSubItem'); lr.appendChild(el('span', 'cStrong', [lg.code, lg.route].filter(Boolean).join(' \u00B7 '))); if (lg.time) lr.appendChild(el('span', 'cMuted', lg.time)); sec.appendChild(lr); });
      if (b.stay && b.stay.name) { var sr = el('div', 'cSubItem'); sr.appendChild(el('span', 'cStrong', b.stay.name)); if (b.stay.meta) sr.appendChild(el('span', 'cMuted', b.stay.meta)); sec.appendChild(sr); }
      if (b.why) sec.appendChild(el('p', 'cWhy', b.why)); addLink(sec, 'cBtn', 'Open', b.url);
    } else if (b.kind === 'price_breakdown' || b.kind === 'key_value') {
      if (b.title) sec.appendChild(el('h2', 'sectionTitle', b.title));
      b.rows.forEach(function (r) { var rw = el('div', 'row'); rw.appendChild(el('span', 'label', r.label)); rw.appendChild(el('span', 'value', r.value)); sec.appendChild(rw); });
      if (b.total) { var tr = el('div', 'row cTotalRow'); tr.appendChild(el('span', 'label', 'Total')); tr.appendChild(el('span', 'value', b.total)); sec.appendChild(tr); }
      if (b.note) sec.appendChild(el('p', 'cMuted', b.note));
    } else if (b.kind === 'text_note') {
      var box = el('div', b.tone === 'warning' ? 'cCallout warn' : 'cCallout'); if (b.title) box.appendChild(el('p', 'cStrong', b.title));
      b.lines.forEach(function (ln) { box.appendChild(el('p', 'cNoteText', ln)); }); sec.appendChild(box);
    } else if (b.kind === 'steps') {
      if (b.title) sec.appendChild(el('h2', 'sectionTitle', b.title)); if (b.summary) sec.appendChild(el('p', 'cMuted', b.summary));
      b.steps.forEach(function (s) {
        var sr = el('div', 'cItem'), st = el('div', 'cRowTop'); st.appendChild(el('span', 'cPill', s.state === 'done' ? '\u2713' : String(s.n))); st.appendChild(el('span', 'cStrong', s.title));
        if (s.duration) st.appendChild(el('span', 'cMuted', s.duration)); sr.appendChild(st); if (s.detail) sr.appendChild(el('p', 'cMuted', s.detail)); sec.appendChild(sr);
      });
    } else if (b.kind === 'standings') {
      if (b.title) sec.appendChild(el('h2', 'sectionTitle', b.title)); if (b.subtitle) sec.appendChild(el('p', 'cMuted', b.subtitle));
      b.rows.forEach(function (r) { var rw = el('div', r.highlight ? 'row cHighlight' : 'row'); rw.appendChild(el('span', 'label', r.rank + '. ' + r.team)); rw.appendChild(el('span', 'value', r.value)); sec.appendChild(rw); });
    } else if (b.kind === 'order_confirm') {
      var oh = el('div', 'cRowTop'); oh.appendChild(el('span', 'cStrong', (b.qty > 1 ? b.qty + 'x ' : '') + b.item)); if (b.total) oh.appendChild(el('span', 'cPrice', b.total)); sec.appendChild(oh);
      if (b.meta) sec.appendChild(el('p', 'cMeta', b.meta)); if (b.deliverTo) sec.appendChild(el('p', 'cMuted', b.deliverTo));
      if (b.choice) { var ch = el('div', 'cChips'); ch.appendChild(el('span', 'cMuted', b.choice.label + ':')); b.choice.options.forEach(function (opt) { ch.appendChild(el('span', opt === b.choice.selected ? 'cPill on' : 'cPill', opt)); }); sec.appendChild(ch); }
      sec.appendChild(el('div', 'cPrimaryBanner', b.button));
    } else if (b.kind === 'permission_request') {
      var ph = el('div', 'cRowTop'); ph.appendChild(el('span', 'cStrong', b.title)); if (b.badge) ph.appendChild(el('span', 'cPill', b.badge)); sec.appendChild(ph);
      if (b.draft) { var db = el('div', 'cCallout'); if (b.draft.to) db.appendChild(el('p', 'cMuted', 'To: ' + b.draft.to)); if (b.draft.subject) db.appendChild(el('p', 'cStrong', b.draft.subject)); if (b.draft.body) db.appendChild(el('p', 'cNoteText', b.draft.body)); sec.appendChild(db); }
      b.options.forEach(function (o) { var op = el('div', o.selected ? 'cItem cSelected' : 'cItem'); op.appendChild(el('p', 'cStrong', o.label)); if (o.description) op.appendChild(el('p', 'cMuted', o.description)); sec.appendChild(op); });
    }
    card.appendChild(sec);
  }

  function render(doc, model) {
    function el(tag, cls, text) {
      var n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }
    var card = doc.getElementById('card');
    setGateTheme(doc, !!model.agenda);
    card.textContent = '';
    card.className = model.agenda ? 'agendaCard' : model.team ? 'dense team' : model.places.length ? 'dense placesCard' : '';
    if (model.agenda) {
      renderAgenda(doc, card, model.agenda, el);
      renderSource(doc, card, model, el);
      if (model.title) doc.title = model.title + ' | Pack';
      return;
    }
    if (model.team) {
      renderTeam(doc, card, model.team, el);
      renderSource(doc, card, model, el);
      if (model.title) doc.title = model.title + ' | Pack';
      return;
    }
    if (model.tripHistory || model.placeDetail || model.calendarEvent) {
      if (model.tripHistory) renderTripHistory(doc, card, model.tripHistory, el); else if (model.placeDetail) renderPlaceDetail(doc, card, model.placeDetail, el); else renderCalendarEvent(doc, card, model.calendarEvent, el);
      renderSource(doc, card, model, el); if (model.title) doc.title = model.title + ' | Pack'; return;
    }
    if (!model.places.length) card.appendChild(el('p', 'kind', model.label));
    card.appendChild(el('h1', 'title', model.title));
    if (model.composedBlocks && model.composedBlocks.length) {
      model.composedBlocks.forEach(function (blk) { renderComposedBlock(doc, card, blk, el); });
      renderSource(doc, card, model, el);
      if (model.title) doc.title = model.title + ' | Pack';
      return;
    }
    model.sections.forEach(function (section) {
      var wrap = el('section', 'section');
      if (section.title) wrap.appendChild(el('h2', 'sectionTitle', section.title));
      section.rows.forEach(function (row) {
        var r = el('div', 'row');
        r.appendChild(el('span', 'label', row.label));
        r.appendChild(el('span', 'value', row.value));
        wrap.appendChild(r);
      });
      card.appendChild(wrap);
    });
    if (model.steps.length) {
      var list = el('ol', 'steps');
      var count = el('p', 'progress', '0 of ' + model.steps.length + ' done');
      card.appendChild(count);
      model.steps.forEach(function (step) {
        var li = el('li', 'step');
        var label = el('label', 'stepLabel');
        var box = doc.createElement('input');
        box.type = 'checkbox';
        box.addEventListener('change', function () {
          li.className = box.checked ? 'step done' : 'step';
          count.textContent = list.querySelectorAll('input:checked').length + ' of ' + model.steps.length + ' done';
        });
        label.appendChild(box);
        label.appendChild(el('span', 'stepText', step.n + '. ' + step.text));
        li.appendChild(label);
        var action = step.action;
        if (action && action.kind === 'copy' && typeof action.value === 'string') {
          var b = el('button', 'action', action.label);
          b.type = 'button';
          b.addEventListener('click', function () {
            var nav = doc.defaultView && doc.defaultView.navigator;
            if (nav && nav.clipboard) nav.clipboard.writeText(action.value).then(function () { b.textContent = 'Copied'; });
          });
          li.appendChild(b);
        } else if (actionHref(action)) {
          var a = el('a', 'action', action.label);
          a.href = actionHref(action);
          if (action.kind === 'open_url') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
          li.appendChild(a);
        }
        list.appendChild(li);
      });
      card.appendChild(list);
    }
    if (model.places.length) {
      card.appendChild(renderPlaceFrame(doc, model, el));
    }
    if (model.items.length) {
      var il = el('ul', 'places');
      model.items.forEach(function (i) {
        var li = el('li', 'place');
        li.appendChild(el('span', 'placeName', i.title));
        if (i.detail) li.appendChild(el('span', 'placeDetail', i.detail));
        il.appendChild(li);
      });
      card.appendChild(il);
    }
    renderSource(doc, card, model, el);
    if (model.title) doc.title = model.title + ' | Pack';
  }

  /** scheme://a/<token>: the installed full app's own door to this card. */
  function appLinkBecauseToken(token) {
    return APP_SCHEME + '://a/' + encodeURIComponent(token);
  }

  /** Try the installed app first; if the page is still visible after a beat, go to the App Store (clip / install). Never a dead end. */
  function openInPack(win, token) {
    var doc = win.document;
    var left = false;
    function note() { if (doc.hidden || doc.visibilityState === 'hidden') left = true; }
    doc.addEventListener('visibilitychange', note);
    win.addEventListener('pagehide', function () { left = true; });
    win.location.href = appLinkBecauseToken(token);
    win.setTimeout(function () {
      doc.removeEventListener('visibilitychange', note);
      if (left) return;
      if (APP_STORE_LIVE) { win.location.href = APP_STORE; return; }
      var note = doc.getElementById('openNote');
      if (note) note.textContent = NOT_OPENED;
    }, APP_WAIT_MS);
  }

  function wireOpenButton(win, token) {
    var cta = win.document.getElementById('open');
    if (!cta || !token) return;
    cta.addEventListener('click', function (e) { e.preventDefault(); openInPack(win, token); });
  }

  /* ---- Sign in to view: Cognito Hosted UI, authorization code + PKCE. The ID token is kept in memory only. ---- */
  function store(win, area) {
    try { return win[area] || null; } catch (e) { return null; }
  }
  function remember(win, key, value) {
    var st = store(win, 'sessionStorage');
    try { if (st) { if (value === null) st.removeItem(key); else st.setItem(key, value); } } catch (e) { /* private mode: fine */ }
  }
  function recall(win, key) {
    var st = store(win, 'sessionStorage');
    try { return st ? st.getItem(key) : null; } catch (e) { return null; }
  }
  function b64url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return root.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function randomString(win, n) {
    var bytes = new Uint8Array(n);
    win.crypto.getRandomValues(bytes);
    return b64url(bytes);
  }
  function redirectUriFor(win) { return win.location.origin + '/a/callback'; }

  /** Send the browser to the Hosted UI (Apple, Google or email). `fresh` asks for the account picker. */
  function beginSignIn(win, token, fresh, provider) {
    var verifier = randomString(win, 32);
    var state = randomString(win, 16);
    return win.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then(function (digest) {
      var challenge = b64url(new Uint8Array(digest));
      remember(win, PKCE_KEY, JSON.stringify({ state: state, verifier: verifier, token: token, provider: provider || '', at: Date.now() }));
      remember(win, REAUTH_KEY, String(Date.now()));
      var q = [
        ['client_id', COGNITO_CLIENT_ID], ['response_type', 'code'], ['scope', SIGNIN_SCOPE], ['redirect_uri', redirectUriFor(win)],
        ['state', state], ['code_challenge', challenge], ['code_challenge_method', 'S256']
      ];
      // identity_provider sends the browser straight to Google or Apple: the Cognito login page is never shown.
      if (provider) q.push(['identity_provider', provider]);
      if (fresh) q.push(['prompt', 'login']);
      var url = COGNITO_DOMAIN + '/oauth2/authorize?' + q.map(function (kv) { return kv[0] + '=' + encodeURIComponent(kv[1]); }).join('&');
      win.location.assign(url);
      return url;
    });
  }

  /** At /a/callback: trade the code for the ID token, then go back to the card. Resolves {token, idToken} or {token, error}. */
  function completeSignIn(win) {
    var params = new URLSearchParams(win.location.search);
    var pending = null;
    try { pending = JSON.parse(recall(win, PKCE_KEY) || 'null'); } catch (e) { pending = null; }
    remember(win, PKCE_KEY, null);
    var token = pending && typeof pending.token === 'string' ? pending.token : '';
    if (!pending || params.get('error') || !params.get('code') || params.get('state') !== pending.state || Date.now() - pending.at > 600000) {
      return Promise.resolve({ token: token, error: true });
    }
    var form = new URLSearchParams();
    form.set('grant_type', 'authorization_code');
    form.set('client_id', COGNITO_CLIENT_ID);
    form.set('code', params.get('code'));
    form.set('redirect_uri', redirectUriFor(win));
    form.set('code_verifier', pending.verifier);
    return win.fetch(COGNITO_DOMAIN + '/oauth2/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form.toString() })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) { return body && typeof body.id_token === 'string' ? { token: token, idToken: body.id_token, provider: pending.provider || '' } : { token: token, error: true }; })
      .catch(function () { return { token: token, error: true }; });
  }

  var LOCK_SVG = 'M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h1zm2 0h6V8a3 3 0 0 0-6 0v2z';

  function lockIcon(doc, size) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('aria-hidden', 'true');
    var path = doc.createElementNS(NS, 'path');
    path.setAttribute('d', LOCK_SVG);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  function setGateTheme(doc, on) {
    doc.body.className = on ? 'gateBody' : '';
  }


  /* The app's own sign-in buttons (AuthProviderButtons: Google white, Apple black, same copy and order), straight to the provider. */
  var GOOGLE_PATHS = [['M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z', '#4285F4'], ['M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z', '#34A853'], ['M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z', '#FBBC05'], ['M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z', '#EA4335']];
  var APPLE_PATH = 'M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z';

  function providerIcon(doc, which) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', which === 'google' ? '0 0 18 18' : '0 0 24 24');
    svg.setAttribute('width', '20'); svg.setAttribute('height', '20'); svg.setAttribute('aria-hidden', 'true');
    var paths = which === 'google' ? GOOGLE_PATHS : [[APPLE_PATH, '#FFFFFF']];
    paths.forEach(function (pc) {
      var path = doc.createElementNS(NS, 'path');
      path.setAttribute('d', pc[0]); path.setAttribute('fill', pc[1]);
      svg.appendChild(path);
    });
    return svg;
  }

  function openSheet(win, token, fresh) {
    var doc = win.document;
    function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
    var old = doc.getElementById('signinSheet');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var backdrop = el('div', 'sheetBackdrop');
    backdrop.id = 'signinSheet';
    var sheet = el('div', 'sheet');
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Sign in to view');
    sheet.appendChild(el('span', 'sheetGrip'));
    sheet.appendChild(el('h2', 'sheetTitle', 'Sign in to view'));
    sheet.appendChild(el('p', 'sheetSub', 'Use the account you use in Pack. New to Pack? Continuing creates your account.'));
    function provider(cls, which, label, idp) {
      var b = el('button', 'authBtn ' + cls);
      b.type = 'button';
      b.id = 'continue-' + which;
      b.appendChild(providerIcon(doc, which));
      b.appendChild(el('span', '', label));
      b.addEventListener('click', function () { b.disabled = true; beginSignIn(win, token, fresh, idp); });
      return b;
    }
    sheet.appendChild(provider('google', 'google', 'Continue with Google', 'Google'));
    sheet.appendChild(provider('apple', 'apple', 'Continue with Apple', 'SignInWithApple'));
    var close = el('button', 'gateText', 'Not now');
    close.type = 'button';
    close.addEventListener('click', function () { if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); });
    sheet.appendChild(close);
    backdrop.appendChild(sheet);
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop); });
    doc.body.appendChild(backdrop);
    return backdrop;
  }

  /** The locked state of a private card: the Pack mark, what the card is (kind, title: the same public preview the link unfurl shows), a blurred body, one primary action and one text action. */
  function showGate(win, token, opts) {
    var doc = win.document;
    function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
    var card = doc.getElementById('card');
    setGateTheme(doc, true);
    card.className = 'gate';
    card.textContent = '';
    var mark = el('img', 'gateMark');
    mark.src = '/logo.png'; mark.alt = 'Pack'; mark.width = 44; mark.height = 44;
    card.appendChild(mark);
    var locked = el('div', 'locked');
    var art = el('div', 'lockedArt');
    for (var i = 0; i < 4; i++) art.appendChild(el('i', 'bar b' + i));
    var badge = el('span', 'lockBadge');
    badge.appendChild(lockIcon(doc, 26));
    locked.appendChild(art);
    locked.appendChild(badge);
    var meta = el('div', 'lockedMeta');
    if (opts.kind) meta.appendChild(el('span', 'kindChip', kindLabel(opts.kind) === 'Agenda' ? 'Shared agenda' : kindLabel(opts.kind)));
    // What the page may say about a card the viewer cannot open: its kind and whose it is. Never its title.
    if (opts.owner) meta.appendChild(el('h1', 'lockedTitle', 'Shared by ' + opts.owner));
    locked.appendChild(meta);
    card.appendChild(locked);
    card.appendChild(el('h2', 'gateHeading', opts.heading));
    card.appendChild(el('p', 'gateSub', opts.sub));
    var mobile = MOBILE_UA.test((win.navigator && win.navigator.userAgent) || '');
    if (opts.request) { opts.request(card, el); }
    var signIn = el('button', opts.requestGate ? 'gateText' : mobile && !opts.noApp ? 'gateText' : 'gatePrimary', opts.button);
    signIn.type = 'button'; signIn.id = 'signin';
    if (opts.noSignIn) signIn.style.display = 'none';
    signIn.addEventListener('click', function () {
      // ?signin=cognito is the test door to the password page (the E2E account has no Google or Apple login); users get the sheet.
      if (/[?&]signin=cognito\b/.test(win.location.search)) beginSignIn(win, token, !!opts.fresh, '');
      else openSheet(win, token, !!opts.fresh);
    });
    var open = el('button', mobile ? 'gatePrimary' : 'gateText', 'Open in Pack');
    open.type = 'button'; open.id = 'gateOpen';
    open.addEventListener('click', function () { openInPack(win, token); });
    if (opts.requestGate) { card.appendChild(signIn); }
    else if (mobile) { card.appendChild(open); card.appendChild(signIn); } else { card.appendChild(signIn); card.appendChild(open); }
    if (!opts.requestGate) card.appendChild(el('p', 'gateNote', 'Sign in with Apple, Google or email.'));
  }

  var REQUEST_POLL_MS = 6000;
  var REQUEST_POLL_MAX = 100;
  var DENIED = 'This card is not available.';

  /** The first name a signed-in account gave its provider, to prefill the one optional field. Display only. */
  function givenNameBecauseToken(token) {
    try {
      var part = String(token || '').split('.')[1] || '';
      var json = decodeURIComponent(escape(atob(part.replace(/-/g, '+').replace(/_/g, '/'))));
      var claims = JSON.parse(json);
      var name = claims.given_name || claims.name || '';
      return typeof name === 'string' ? name.split(/\s+/)[0].slice(0, 30) : '';
    } catch (e) { return ''; }
  }

  /** POST the ask for a card the signed-in viewer is not on. Agendas and cards take different taps; both answer { requested, state } or { alreadyHasAccess }. */
  function postAccessRequest(win, state, kind, name) {
    var action = { type: kind === 'agenda' ? 'agenda_request' : 'share_request' };
    if (name) action.name = name;
    return win.fetch(API + '/api/i/' + encodeURIComponent(state.token) + '/actions', {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', authorization: 'Bearer ' + state.idToken },
      body: JSON.stringify({ actions: [action] })
    }).then(function (res) {
      return (res.json ? res.json() : Promise.resolve({})).catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body || {} }; });
    });
  }

  /**
   * Signed in, not on the card: the locked state offers Request access. Only the kind and the owner's first name are shown.
   * Sent: the page asks the card again every few seconds, so it opens by itself when the owner approves, and says
   * "not available" (and nothing else) if the owner declines.
   */
  function showRequestGate(win, state, out) {
    var preview = out.preview || {};
    var owner = typeof preview.ownerFirstName === 'string' ? preview.ownerFirstName : '';
    var asked = out.requestState === 'pending' || state.requestSent === true;
    if (state.pollTimer) { win.clearTimeout(state.pollTimer); state.pollTimer = 0; }
    if (out.requestState === 'denied') {
      showGate(win, state.token, { kind: preview.kind, owner: '', heading: 'Not available', sub: DENIED, button: 'Sign in with a different account', fresh: true, requestGate: true });
      return;
    }
    var line = asked
      ? (owner ? 'You will get in when ' + owner + ' approves. This page opens the card by itself.' : 'You will get in when the owner approves. This page opens the card by itself.')
      : (owner ? 'Ask ' + owner + ' to let you in.' : 'Ask the owner to let you in.');
    showGate(win, state.token, {
      kind: preview.kind, owner: owner, heading: asked ? 'Request sent' : 'You need access', sub: line,
      button: 'Sign in with a different account', fresh: true, requestGate: true,
      request: asked ? null : function (card, el) {
        var input = el('input', 'gateInput');
        input.type = 'text'; input.id = 'reqName'; input.maxLength = 60; input.autocomplete = 'given-name';
        input.setAttribute('aria-label', 'Your name (optional)');
        input.placeholder = 'Your name (optional)';
        input.value = givenNameBecauseToken(state.idToken);
        var btn = el('button', 'gatePrimary', 'Request access');
        btn.type = 'button'; btn.id = 'requestAccess';
        var note = el('p', 'gateNote'); note.id = 'requestNote'; note.setAttribute('role', 'status');
        btn.addEventListener('click', function () {
          btn.disabled = true; btn.textContent = 'Sending...'; note.textContent = '';
          postAccessRequest(win, state, preview.kind, input.value.trim()).then(function (r) {
            if (r.status === 200 && r.body.alreadyHasAccess) { load(win, state); return; }
            if (r.status === 200 && r.body.requested) {
              state.requestSent = true;
              if (r.body.state === 'denied') { showRequestGate(win, state, { preview: preview, requestState: 'denied' }); return; }
              showRequestGate(win, state, { preview: preview, requestState: 'pending' });
              schedulePoll(win, state);
              return;
            }
            btn.disabled = false; btn.textContent = 'Request access';
            if (r.status === 401) { note.textContent = 'Sign in again to ask.'; return; }
            note.textContent = r.status === 429 ? 'Too many requests. Try again later.' : 'Could not send the request. Try again.';
          }).catch(function () { btn.disabled = false; btn.textContent = 'Request access'; note.textContent = 'Could not send the request. Try again.'; });
        });
        card.appendChild(input); card.appendChild(btn); card.appendChild(note);
      }
    });
    if (asked) schedulePoll(win, state);
  }

  function schedulePoll(win, state) {
    if (state.pollTimer || (state.pollCount || 0) >= REQUEST_POLL_MAX) return;
    state.pollTimer = win.setTimeout(function () {
      state.pollTimer = 0;
      state.pollCount = (state.pollCount || 0) + 1;
      if (!win.document.hidden) load(win, state, true); else schedulePoll(win, state);
    }, REQUEST_POLL_MS);
  }

  function showLoading(win) {
    var doc = win.document;
    setGateTheme(doc, true);
    var card = doc.getElementById('card');
    card.className = 'gate';
    card.textContent = '';
    var mark = doc.createElement('img');
    mark.className = 'gateMark'; mark.src = '/logo.png'; mark.alt = 'Pack'; mark.width = 44; mark.height = 44;
    card.appendChild(mark);
    var p = doc.createElement('p');
    p.className = 'gateSub';
    p.textContent = 'Signing you in...';
    card.appendChild(p);
  }

  function liveKind(payload) { return payload && (payload.kind === 'agenda' || payload.kind === 'composed'); }

  function start(win) {
    var doc = win.document;
    var card = doc.getElementById('card');
    var state = { idToken: '', last: '', timer: 0, token: tokenBecausePath(win.location.pathname) };
    var onboard = onboardRedirectBecausePath(win.location.pathname);
    if (onboard) { win.location.replace(onboard); return; }
    if (win.location.pathname === '/a/callback') {
      showLoading(win);
      completeSignIn(win).then(function (done) {
        if (!done.token) { card.textContent = messageBecauseStatus(404); return; }
        if (done.error) { remember(win, HINT_KEY, null); }
        else { state.idToken = done.idToken; remember(win, HINT_KEY, done.provider || '1'); }
        try { win.history.replaceState(null, '', '/a/' + encodeURIComponent(done.token)); } catch (e) { /* the page still works */ }
        state.token = done.token;
        wireOpenButton(win, state.token);
        if (done.error) showGate(win, state.token, { heading: 'Sign-in did not finish', sub: 'Try again.', button: 'Sign in to view' });
        else load(win, state);
      });
      return;
    }
    wireOpenButton(win, state.token);
    if (!state.token) {
      var fixture = fixtureBecauseSearch(win);
      if (fixture) { loadFixture(win, fixture); return; }
      card.textContent = messageBecauseStatus(404);
      return;
    }
    load(win, state);
  }

  function loadFixture(win, fixture) {
    var doc = win.document;
    var card = doc.getElementById('card');
    return win.fetch('/a/fixtures/' + encodeURIComponent(fixture) + '.json', { headers: { accept: 'application/json' } })
      .then(function (res) { return res.ok ? res.json().then(function (payload) { return { payload: payload }; }) : { status: res.status }; })
      .then(function (out) {
        if (out.payload) { render(doc, viewModelBecausePayload(out.payload)); return; }
        card.textContent = messageBecauseStatus(out.status);
      })
      .catch(function () { card.textContent = messageBecauseStatus(0); });
  }

  /** One fetch of the card (with the ID token when signed in). `quiet` = a live refresh: keep what is on screen unless it changed. */
  function load(win, state, quiet) {
    var doc = win.document;
    var card = doc.getElementById('card');
    var headers = { accept: 'application/json' };
    if (state.idToken) headers.authorization = 'Bearer ' + state.idToken;
    return win.fetch(API + '/api/artifact/' + encodeURIComponent(state.token), { headers: headers })
      .then(function (res) {
        if (res.ok) return res.json().then(function (payload) { return { payload: payload }; });
        if (res.status === 401) {
          return (res.json ? res.json() : Promise.resolve({})).catch(function () { return {}; }).then(function (body) { return { status: 401, ended: !!(body && body.signIn), preview: body && body.preview && typeof body.preview.kind === 'string' ? body.preview : null }; });
        }
        if (res.status === 403) {
          return (res.json ? res.json() : Promise.resolve({})).catch(function () { return {}; }).then(function (body) {
            return { status: 403, request: !!(body && body.requestAccess === true && body.preview && typeof body.preview.kind === 'string'), preview: body && body.preview, requestState: body && body.requestState };
          });
        }
        return { status: res.status };
      })
      .then(function (out) {
        if (out.payload) {
          var text = JSON.stringify(out.payload);
          if (!quiet || text !== state.last) render(doc, viewModelBecausePayload(out.payload));
          state.last = text;
          if (state.idToken && liveKind(out.payload) && !state.timer) {
            state.timer = win.setInterval(function () { if (!doc.hidden) load(win, state, true); }, LIVE_REFRESH_MS);
          }
          return;
        }
        if (state.timer) { win.clearInterval(state.timer); state.timer = 0; }
        if (out.status === 401) {
          state.idToken = '';
          var ago = Date.now() - Number(recall(win, REAUTH_KEY) || 0);
          // Signed in earlier in this tab and the Hosted UI session is still there: go straight round, once a minute at most.
          var hint = recall(win, HINT_KEY);
          if (hint && ago > REAUTH_GUARD_MS) { beginSignIn(win, state.token, false, hint === '1' ? '' : hint); return; }
          showGate(win, state.token, {
            kind: out.preview ? out.preview.kind : '', owner: out.preview && typeof out.preview.ownerFirstName === 'string' ? out.preview.ownerFirstName : '',
            heading: out.ended ? 'Your sign-in ended' : 'This card is private',
            sub: out.ended ? 'Sign in again to view this card.' : 'Sign in to view it, or open it in the Pack app.', button: 'Sign in to view'
          });
          return;
        }
        if (out.status === 403 && out.request && state.idToken) { showRequestGate(win, state, out); return; }
        if (out.status === 403) { showGate(win, state.token, { heading: NO_ACCESS, sub: 'This card belongs to someone else. Try a different account.', button: 'Sign in with a different account', fresh: true }); return; }
        card.textContent = messageBecauseStatus(out.status);
      })
      .catch(function () { if (!quiet) card.textContent = messageBecauseStatus(0); });
  }

  var api = { showRequestGate: showRequestGate, agendaBecauseBlock: agendaBecauseBlock, beginSignIn: beginSignIn, completeSignIn: completeSignIn, tokenBecausePath: tokenBecausePath, onboardRedirectBecausePath: onboardRedirectBecausePath, viewModelBecausePayload: viewModelBecausePayload, sectionsBecauseRows: sectionsBecauseRows, pinsBecauseItems: pinsBecauseItems, placeLine: placeLine, clock12: clock12, placeArtUrl: placeArtUrl, awayLine: awayLine, hoursLine: hoursLine, teamBecausePayload: teamBecausePayload, headerTitleFit: headerTitleFit, compactStatLine: compactStatLine, actionHref: actionHref, messageBecauseStatus: messageBecauseStatus, render: render, start: start, appLinkBecauseToken: appLinkBecauseToken, openInPack: openInPack, APP_STORE: APP_STORE, NOT_OPENED: NOT_OPENED };
  api.fixtureBecauseSearch = fixtureBecauseSearch;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.PackCard = api; if (root.document) start(root); }
})(typeof window !== 'undefined' ? window : this);
