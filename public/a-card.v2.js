/* Web fallback for /a/<token>: the same typed artifact the App Clip renders, from GET /api/artifact/<token>.
   viewModelBecausePayload is pure (tested in scripts/__tests__/a-card.test.js (loads public/a-card.v1.js)); render() only touches the DOM
   with textContent, so card text is never parsed as HTML. */
(function (root) {
  'use strict';
  var API = 'https://api.trypackai.com';
  var APP_STORE = 'https://apps.apple.com/app/id6761626050';
  var PLAYER_ROW = /^(.*) \((hitter|pitcher|skater|goalie|player)\)$/;
  var GROUP_TITLE = { hitter: 'Hitters', pitcher: 'Pitchers', skater: 'Skaters', goalie: 'Goalies', player: 'Players' };

  function tokenBecausePath(pathname) {
    var parts = String(pathname || '').split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === 'a' ? parts[parts.length - 1] : '';
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
  var MAP_H = 276;
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
  var MAX_PLAYER_ROWS = 7;
  var MAX_PLACES = 6;

  function ordinal(v) {
    var n = Number(v);
    if (!isFinite(n) || n <= 0 || Math.floor(n) !== n) return String(v);
    var t = n % 100;
    var suffix = t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return n + suffix;
  }

  /** sports_team: header (name, season, record, logo, accent), stat tiles, hitters/pitchers columns. */
  function teamBecausePayload(payload) {
    var m = /^(.*\S)\s+(\d{4})$/.exec(payload.title || '');
    var team = { name: m ? m[1] : payload.title || '', season: m ? m[2] : '', record: '', tiles: [], hitters: [], pitchers: [],
      logo: typeof payload.imageUrl === 'string' && /^https:\/\//i.test(payload.imageUrl) ? payload.imageUrl : '',
      accent: typeof payload.accent === 'string' && /^#[0-9a-fA-F]{6}$/.test(payload.accent) ? payload.accent : '', provenance: '' };
    (payload.rows || []).forEach(function (row) {
      if (row.label === 'Player stats') { team.provenance = row.value; return; }
      var pm = PLAYER_ROW.exec(row.label || '');
      if (pm) {
        (pm[2] === 'pitcher' || pm[2] === 'goalie' ? team.pitchers : team.hitters).push({ name: pm[1], line: row.value });
        return;
      }
      var label = String(row.label || '').replace(/\s*\(incl\. postseason\)$/, '');
      if (label === 'Record') team.record = row.value;
      team.tiles.push({ label: label, value: label === 'Place' ? ordinal(row.value) : row.value });
    });
    team.hitters = team.hitters.slice(0, MAX_PLAYER_ROWS);
    team.pitchers = team.pitchers.slice(0, MAX_PLAYER_ROWS);
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

  function viewModelBecausePayload(payload) {
    var kind = payload && payload.kind ? String(payload.kind) : '';
    var model = { kind: kind, label: kindLabel(kind), title: '', team: null, sections: [], steps: [], places: [], pins: [], items: [], source: '', host: '', asOf: '' };
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
        return { rank: p.rank || i + 1, name: p.name, detail: placeLine(p), category: p.category || '', away: awayLine(p), hours: hoursLine(p), open: p.openState === 'open', why: p.why || '', url: url, photo: typeof p.photoUrl === 'string' && /^https:\/\//i.test(p.photoUrl) ? p.photoUrl : '' };
      });
      model.pins = pinsBecauseItems(items.slice(0, MAX_PLACES), list.center);
    } else if (kind === 'sports_team') {
      model.team = teamBecausePayload(payload);
      model.sections = sectionsBecauseRows(payload.rows);
    } else {
      model.sections = sectionsBecauseRows(payload.rows);
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
    if (status === 401) return 'This card is private. Open it in the Pack app.';
    return 'This card could not be loaded right now.';
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

  function renderMap(doc, pins) {
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
    text.appendChild(el('h1', 'teamName', team.season ? team.name + ' ' + team.season : team.name));
    if (team.record) text.appendChild(el('p', 'teamRecord', team.record));
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
    if (team.hitters.length || team.pitchers.length) {
      var cols = el('div', 'players');
      [['Hitters', team.hitters], ['Pitchers', team.pitchers]].forEach(function (g) {
        var col = el('div', 'playerCol');
        col.appendChild(el('h2', 'colHead', g[0]));
        g[1].forEach(function (pl) {
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

  function render(doc, model) {
    function el(tag, cls, text) {
      var n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }
    var card = doc.getElementById('card');
    card.textContent = '';
    card.className = model.team ? 'dense team' : model.places.length ? 'dense placesCard' : '';
    if (model.team) {
      renderTeam(doc, card, model.team, el);
      renderSource(doc, card, model, el);
      if (model.title) doc.title = model.title + ' | Pack';
      return;
    }
    if (!model.places.length) card.appendChild(el('p', 'kind', model.label));
    card.appendChild(el('h1', 'title', model.title));
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
      if (model.pins.length) card.appendChild(renderMap(doc, model.pins));
      var ul = el('ul', 'places grid');
      model.places.forEach(function (p) {
        var li = el('li', 'place');
        var inner = p.url ? el('a', 'placeCard') : el('div', 'placeCard');
        if (p.url) { inner.href = p.url; inner.rel = 'noopener noreferrer'; }
        var band = el('div', 'band');
        if (p.photo) { var img = doc.createElement('img'); img.className = 'placePhoto'; img.src = p.photo; img.alt = ''; img.loading = 'lazy'; band.appendChild(img); }
        band.appendChild(el('span', 'rank', String(p.rank)));
        if (!p.photo && p.category) band.appendChild(el('span', 'bandCategory', p.category));
        inner.appendChild(band);
        inner.appendChild(el('span', 'placeName', p.name));
        inner.appendChild(el('span', 'placeDetail', p.away));
        inner.appendChild(el('span', p.open ? 'placeDetail open' : 'placeDetail', p.hours));
        inner.appendChild(el('span', 'placeWhy', p.why));
        li.appendChild(inner);
        ul.appendChild(li);
      });
      card.appendChild(ul);
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

  function start(win) {
    var doc = win.document;
    var token = tokenBecausePath(win.location.pathname);
    var card = doc.getElementById('card');
    if (!token) { card.textContent = messageBecauseStatus(404); return; }
    win.fetch(API + '/api/artifact/' + encodeURIComponent(token), { headers: { accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) { card.textContent = messageBecauseStatus(res.status); return null; }
        return res.json();
      })
      .then(function (payload) { if (payload) render(doc, viewModelBecausePayload(payload)); })
      .catch(function () { card.textContent = messageBecauseStatus(0); });
  }

  var api = { tokenBecausePath: tokenBecausePath, viewModelBecausePayload: viewModelBecausePayload, sectionsBecauseRows: sectionsBecauseRows, pinsBecauseItems: pinsBecauseItems, placeLine: placeLine, awayLine: awayLine, hoursLine: hoursLine, teamBecausePayload: teamBecausePayload, actionHref: actionHref, messageBecauseStatus: messageBecauseStatus, render: render, start: start, APP_STORE: APP_STORE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.PackCard = api; if (root.document) start(root); }
})(typeof window !== 'undefined' ? window : this);
