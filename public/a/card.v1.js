/* Web fallback for /a/<token>: the same typed artifact the App Clip renders, from GET /api/artifact/<token>.
   viewModelBecausePayload is pure (tested in scripts/__tests__/a-card.test.js (loads public/a/card.v1.js)); render() only touches the DOM
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

  function viewModelBecausePayload(payload) {
    var kind = payload && payload.kind ? String(payload.kind) : '';
    var model = { kind: kind, label: kindLabel(kind), title: '', sections: [], steps: [], places: [], items: [], source: '', host: '', asOf: '' };
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
    } else if (kind === 'place_list' && payload.placeList && payload.placeList.items) {
      model.places = payload.placeList.items.map(function (p) {
        var url = typeof p.url === 'string' && /^https:\/\//i.test(p.url) ? p.url : '';
        return { name: p.name, detail: [p.category, typeof p.distanceM === 'number' ? Math.round(p.distanceM) + ' m' : ''].filter(Boolean).join(' · '), url: url };
      });
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

  function render(doc, model) {
    function el(tag, cls, text) {
      var n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text !== undefined) n.textContent = text;
      return n;
    }
    var card = doc.getElementById('card');
    card.textContent = '';
    card.appendChild(el('p', 'kind', model.label));
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
      var ul = el('ul', 'places');
      model.places.forEach(function (p) {
        var li = el('li', 'place');
        if (p.url) { var a = el('a', 'placeName', p.name); a.href = p.url; a.rel = 'noopener noreferrer'; li.appendChild(a); }
        else li.appendChild(el('span', 'placeName', p.name));
        if (p.detail) li.appendChild(el('span', 'placeDetail', p.detail));
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
    if (model.source) {
      var src = el('p', 'source');
      var link = el('a', '', 'Source: ' + model.host);
      link.href = model.source;
      link.rel = 'noopener noreferrer';
      src.appendChild(link);
      if (model.asOf) src.appendChild(doc.createTextNode(', as of ' + model.asOf));
      card.appendChild(src);
    }
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

  var api = { tokenBecausePath: tokenBecausePath, viewModelBecausePayload: viewModelBecausePayload, sectionsBecauseRows: sectionsBecauseRows, actionHref: actionHref, messageBecauseStatus: messageBecauseStatus, render: render, start: start, APP_STORE: APP_STORE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.PackCard = api; if (root.document) start(root); }
})(typeof window !== 'undefined' ? window : this);
