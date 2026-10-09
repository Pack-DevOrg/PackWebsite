import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(fs.readFileSync(path.join(here, '../../public/a-card.v1.js'), 'utf8'), sandbox);
const raw = sandbox.module.exports;
const plain = (x) => JSON.parse(JSON.stringify(x));
const card = { ...raw, viewModelBecausePayload: (p) => plain(raw.viewModelBecausePayload(p)) };

const YANKEES = {
  kind: 'sports_team', version: 1, title: 'New York Yankees 2026',
  rows: [
    { label: 'Record', value: '93-68' }, { label: 'Place', value: '2' },
    { label: 'Games (incl. postseason)', value: '166' },
    { label: 'Ben Rice (hitter)', value: '.264 AVG, 41 HR, 97 RBI' },
    { label: 'Cam Schlittler (pitcher)', value: '14-6, 1.95 ERA, 239 K' },
    { label: 'Player stats', value: 'MLB Stats API, 2026-10-09' },
  ],
  source: 'https://api-sports.io', asOf: '2026-10-09T19:24:20.714Z',
};

describe('web card for /a/<token>', () => {
  it('reads the token from the path', () => {
    assert.equal(card.tokenBecausePath('/a/L2ofNLC4kpZPk7OVtMxy5A'), 'L2ofNLC4kpZPk7OVtMxy5A');
    assert.equal(card.tokenBecausePath('/a/sports/team/abc'), 'abc');
    assert.equal(card.tokenBecausePath('/pricing'), '');
  });

  it('a sports team card shows record and place, hitters and pitchers apart, then source and as-of', () => {
    const m = card.viewModelBecausePayload(YANKEES);
    assert.equal(m.title, 'New York Yankees 2026');
    assert.deepEqual(m.sections.map((s) => s.title), ['', 'Hitters', 'Pitchers']);
    assert.deepEqual(m.sections[0].rows.map((r) => r.label), ['Record', 'Place', 'Games (incl. postseason)', 'Player stats']);
    assert.deepEqual(m.sections[1].rows, [{ label: 'Ben Rice', value: '.264 AVG, 41 HR, 97 RBI' }]);
    assert.equal(m.host, 'api-sports.io');
    assert.equal(m.asOf, '2026-10-09');
  });

  it('a guide shows numbered steps with only safe actions (https open_url, webcal, copy)', () => {
    const m = card.viewModelBecausePayload({
      kind: 'guide', title: 't',
      guide: { title: 'Add Partiful events', source: 'https://help.partiful.com/x', asOf: '2026-10-09T17:00:00.000Z', steps: [
        { n: 1, text: 'Copy.', action: { kind: 'copy', value: 'v', label: 'Copy' } },
        { n: 2, text: 'Open.', action: { kind: 'open_url', url: 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl', label: 'Open' } },
        { n: 3, text: 'Bad.', action: { kind: 'open_url', url: 'javascript:alert(1)', label: 'x' } },
      ] },
    });
    assert.equal(m.title, 'Add Partiful events');
    assert.equal(m.steps.length, 3);
    assert.equal(card.actionHref(m.steps[1].action), 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl');
    assert.equal(card.actionHref(m.steps[2].action), '');
    assert.equal(card.actionHref({ kind: 'webcal', url: 'webcal://x.com/f.ics', label: 'S' }), 'webcal://x.com/f.ics');
    assert.equal(m.host, 'help.partiful.com');
  });

  it('a place list links only https place urls; a trip lists its items', () => {
    const p = card.viewModelBecausePayload({ kind: 'place_list', title: 'Coffee', placeList: { items: [
      { name: 'Alma', category: 'coffee', distanceM: 41.2, url: 'https://alma.example' }, { name: 'Odd', url: 'javascript:1' },
    ] } });
    assert.deepEqual(p.places, [
      { name: 'Alma', detail: 'coffee · 41 m', url: 'https://alma.example' },
      { name: 'Odd', detail: '', url: '' },
    ]);
    const t = card.viewModelBecausePayload({ kind: 'trip', version: 1, data: { title: 'Lisbon', items: [{ type: 'flight', title: 'SFO to LIS', date: '2026-11-01' }] } });
    assert.deepEqual(t.items, [{ title: 'SFO to LIS', detail: '2026-11-01' }]);
  });

  it('any other kind falls back to its rows', () => {
    const m = card.viewModelBecausePayload({ kind: 'place_card', title: 'Bancarella', rows: [{ label: 'Name', value: 'Bancarella' }] });
    assert.equal(m.label, 'Place');
    assert.deepEqual(m.sections[0].rows, [{ label: 'Name', value: 'Bancarella' }]);
  });

  it('says what happened for 404, 401 and everything else', () => {
    assert.match(card.messageBecauseStatus(404), /expired/);
    assert.match(card.messageBecauseStatus(401), /private/);
    assert.match(card.messageBecauseStatus(500), /could not be loaded/);
  });
});

describe('web card renders into the page', () => {
  async function load(payload, status = 200, pathname = '/a/L2ofNLC4kpZPk7OVtMxy5A') {
    const { JSDOM } = await import('jsdom');
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
    const dom = new JSDOM(html, { url: `https://www.trypackai.com${pathname}`, runScripts: 'outside-only' });
    const calls = [];
    dom.window.fetch = async (url) => {
      calls.push(String(url));
      return { ok: status === 200, status, json: async () => payload };
    };
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v1.js'), 'utf8'));
    await new Promise((r) => setTimeout(r, 20));
    return { dom, calls, text: dom.window.document.getElementById('card').textContent };
  }

  it('the Yankees link fetches its artifact and shows title, record, hitters, pitchers, source and as-of', async () => {
    const { dom, calls, text } = await load(YANKEES);
    assert.deepEqual(calls, ['https://api.trypackai.com/api/artifact/L2ofNLC4kpZPk7OVtMxy5A']);
    for (const bit of ['New York Yankees 2026', '93-68', 'Hitters', 'Ben Rice', '.264 AVG, 41 HR, 97 RBI', 'Pitchers', 'Cam Schlittler', 'Source: api-sports.io', 'as of 2026-10-09']) {
      assert.ok(text.includes(bit), `missing ${bit}`);
    }
    assert.equal(dom.window.document.title, 'New York Yankees 2026 | Pack');
    assert.ok(dom.window.document.querySelector('a.cta[href*="apps.apple.com"]'));
  });

  it('a guide ticks steps and counts progress; an expired link says so', async () => {
    const guide = { kind: 'guide', title: 't', guide: { title: 'Add Partiful events', source: 'https://help.partiful.com/x', asOf: '2026-10-09T17:00:00.000Z', steps: [
      { n: 1, text: 'Open it.' }, { n: 2, text: 'Add by URL.', action: { kind: 'open_url', url: 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl', label: 'Open Google Calendar' } },
    ] } };
    const { dom } = await load(guide);
    const doc = dom.window.document;
    assert.equal(doc.querySelector('.progress').textContent, '0 of 2 done');
    const box = doc.querySelector('input[type=checkbox]');
    box.checked = true;
    box.dispatchEvent(new dom.window.Event('change'));
    assert.equal(doc.querySelector('.progress').textContent, '1 of 2 done');
    assert.equal(doc.querySelector('a.action').href, 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl');
    const gone = await load({}, 404);
    assert.match(gone.text, /expired/);
  });
});

describe('the card script is reachable', () => {
  it('its path is not swallowed by the /a/<token> rewrite (which would serve the page HTML as JS)', () => {
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8');
    const src = /<script src="([^"]+)"><\/script>/.exec(html)?.[1];
    assert.ok(src, 'index.html loads a script');
    const sandbox2 = { require: () => ({ updateRequestOrigin() {} }) };
    vm.runInNewContext(fs.readFileSync(path.join(here, '../cloudfront/app-origin-viewer-request.js'), 'utf8'), sandbox2);
    const out = sandbox2.handler({ request: { uri: src, headers: { host: { value: 'www.trypackai.com' } }, querystring: {} } });
    assert.equal(out.uri, src);
    assert.ok(fs.existsSync(path.join(here, '../../public', src)), `${src} exists in public/`);
  });
});
