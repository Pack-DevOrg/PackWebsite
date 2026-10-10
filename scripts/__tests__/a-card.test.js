import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'), sandbox);
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
    assert.deepEqual(p.places.map((x) => [x.rank, x.name, x.detail, x.category, x.away, x.url, x.photo]), [
      [1, 'Alma', 'coffee · 41 m', 'coffee', '41 m', 'https://alma.example', ''],
      [2, 'Odd', '', '', '', '', ''],
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
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'));
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

describe('place_list card', () => {
  const list = { kind: 'place_list', title: 'Coffee shop near Union Square', blocks: [{ kind: 'place_list', center: { lat: 37.788, lon: -122.4075 }, source: 'Pack place data', asOf: '2026-10-10T00:00:00.000Z', items: [
    { rank: 1, name: 'Cafe La Tazita', lat: 37.7881, lon: -122.4072, category: 'Coffee shop', distanceM: 43, etaMin: 1, etaMode: 'walk', openState: 'open', closesAtLocal: '18:00', why: 'close, open now' },
    { rank: 2, name: 'Cafe Encore', lat: 37.7886, lon: -122.4082, distanceM: 56, openState: 'closed', opensAtLocal: '07:00', url: 'https://encore.example' },
  ] }], source: 'Pack place data', asOf: '2026-10-10T00:00:00.000Z' };

  it('rows carry rank, distance, walk time, hours and why; links go to the place or walking directions; pins stay in the box', () => {
    const m = card.viewModelBecausePayload(list);
    assert.deepEqual(m.places.map((p) => [p.rank, p.name, p.detail, p.why]), [
      [1, 'Cafe La Tazita', 'Coffee shop · 43 m, 1 min walk · Open until 18:00', 'close, open now'],
      [2, 'Cafe Encore', '56 m · Opens 07:00', ''],
    ]);
    assert.equal(m.places[0].url, 'https://maps.apple.com/?daddr=37.7881,-122.4072&dirflg=w');
    assert.equal(m.places[1].url, 'https://encore.example');
    assert.equal(m.pins.length, 2);
    for (const p of m.pins) assert.ok(p.x > 0 && p.x < 358 && p.y > 0 && p.y < 300);
    assert.ok(m.pins[1].x < m.pins[0].x && m.pins[1].y < m.pins[0].y);
  });

  it('renders the list, the pins and the source line', async () => {
    const { JSDOM } = await import('jsdom');
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
    const dom = new JSDOM(html, { url: 'https://www.trypackai.com/a/tok', runScripts: 'outside-only' });
    dom.window.fetch = async () => ({ ok: true, status: 200, json: async () => list });
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'));
    await new Promise((r) => setTimeout(r, 20));
    const doc = dom.window.document;
    // no server map: the dark frame holds the pin plot and one swipeable card per place
    assert.equal(doc.querySelectorAll('.placeFrame .placeCard').length, 2);
    assert.equal(doc.querySelectorAll('svg.map circle').length, 2);
    assert.ok(doc.getElementById('card').classList.contains('dense'));
    const first = doc.querySelector('.placeCard');
    assert.deepEqual([...first.querySelectorAll('.placeName, .placeMeta, .chip')].map((n) => n.textContent), ['Cafe La Tazita', 'Coffee shop · 43 m, 1 min walk', 'Open · Closes at 6:00 PM', 'close, open now']);
    assert.ok(first.querySelector('.ratingBadge') === null);
    assert.equal(first.querySelectorAll('.dots i').length, 2);
    assert.ok(doc.getElementById('card').textContent.includes('Cafe La Tazita'));
    assert.ok(doc.getElementById('card').textContent.includes('close, open now'));
  });
});

describe('sports_team card is one dense screen', () => {
  const ROWS = [
    { label: 'Record', value: '98-64' }, { label: 'Place', value: '1' }, { label: 'Games (incl. postseason)', value: '170' },
    { label: 'Runs for (incl. postseason)', value: '842' }, { label: 'Runs against (incl. postseason)', value: '671' },
    ...Array.from({ length: 10 }, (_, i) => ({ label: `Hitter ${i} (hitter)`, value: '.300 AVG, 20 HR' })),
    ...Array.from({ length: 9 }, (_, i) => ({ label: `Pitcher ${i} (pitcher)`, value: '10-5, 3.00 ERA' })),
    { label: 'Player stats', value: 'MLB Stats API, 2026-10-09' },
  ];
  const DODGERS = { kind: 'sports_team', version: 1, title: 'Los Angeles Dodgers 2026', rows: ROWS, imageUrl: 'https://www.trypackai.com/og/logos/a.png', accent: '#005a9c', source: 'https://api-sports.io', asOf: '2026-10-09T08:00:00.000Z' };

  it('builds the header, stat tiles and capped player columns; ignores an unsafe logo or accent', () => {
    const t = plain(raw.teamBecausePayload(DODGERS));
    assert.equal(t.name, 'Los Angeles Dodgers');
    assert.equal(t.season, '2026');
    assert.equal(t.record, '98-64');
    assert.deepEqual(t.tiles.map((x) => x.label), ['Place', 'Games', 'Runs for', 'Runs against']);
    assert.equal(t.tiles[0].value, '1st');
    assert.deepEqual(t.columns.map((c) => c.players.length), [9, 9]);
    assert.equal(t.logo, DODGERS.imageUrl);
    const bad = plain(raw.teamBecausePayload({ ...DODGERS, imageUrl: 'javascript:1', accent: 'red' }));
    assert.equal(bad.logo, '');
    assert.equal(bad.accent, '');
  });

  it('renders logo at the right of the header, a tile grid, two player columns and one source line', async () => {
    const { JSDOM } = await import('jsdom');
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
    const dom = new JSDOM(html, { url: 'https://www.trypackai.com/a/tok', runScripts: 'outside-only' });
    dom.window.fetch = async () => ({ ok: true, status: 200, json: async () => DODGERS });
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'));
    await new Promise((r) => setTimeout(r, 20));
    const doc = dom.window.document;
    const card = doc.getElementById('card');
    assert.ok(card.classList.contains('dense'));
    assert.deepEqual([...card.children].map((n) => n.getAttribute('class')), ['teamHead', 'tiles', 'players', 'source']);
    const head = doc.querySelector('.teamHead');
    assert.equal(head.style.background !== '', true);
    assert.equal(head.lastElementChild.tagName, 'IMG');
    assert.equal(doc.querySelectorAll('.tile').length, 4);
    const cols = doc.querySelectorAll('.playerCol');
    assert.deepEqual([...cols].map((c) => c.querySelector('.colHead').textContent), ['Hitters', 'Pitchers']);
    assert.equal(cols[0].querySelectorAll('.player').length, 9);
    assert.ok(doc.querySelector('.source').textContent.includes('MLB Stats API, 2026-10-09'));
    assert.ok(!card.querySelector('.row'), 'no plain row list');
    // one screen: fixed heights add up under the 390x844 viewport
    const css = html.match(/<style>[\s\S]*<\/style>/)[0];
    const px = (re) => Number(re.exec(css)[1]);
    const total = 2 * 14 + px(/\.teamHead \{[^}]*height: (\d+)px/) + px(/\.tile \{[^}]*height: (\d+)px/) * 2 + 8 + 12 + 12 + px(/\.colHead \{[^}]*height: (\d+)px/) + px(/\.player \{[^}]*height: (\d+)px/) * 9 + 12 + 14;
    assert.ok(total <= 844 - 150, `team card ${total}px fits one screen`);
  });
});

describe('sports_team polish and the static map', () => {
  it('drops OPS then WHIP only when the line would wrap', () => {
    assert.equal(raw.compactStatLine('.310 AVG, 54 HR, 130 RBI, 1.036 OPS'), '.310 AVG, 54 HR, 130 RBI');
    assert.equal(raw.compactStatLine('12-8, 2.49 ERA, 201 K, 1.02 WHIP'), '12-8, 2.49 ERA, 201 K');
    assert.equal(raw.compactStatLine('3-1, 2.90 ERA, 40 K, 8 SV'), '3-1, 2.90 ERA, 40 K, 8 SV');
  });

  it('a place_list with a server map shows the image (https only) and falls back to the pin plot on error', async () => {
    const { JSDOM } = await import('jsdom');
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
    const payload = { kind: 'place_list', title: 'Coffee', blocks: [{ kind: 'place_list', mapImageUrl: 'https://www.trypackai.com/og/maps/abc.png', items: [{ rank: 1, name: 'Alma', lat: 37.7881, lon: -122.4072 }, { rank: 2, name: 'Odd', lat: 37.7886, lon: -122.4082 }] }] };
    assert.equal(plain(raw.viewModelBecausePayload(payload)).mapImage, 'https://www.trypackai.com/og/maps/abc.png');
    assert.equal(plain(raw.viewModelBecausePayload({ ...payload, blocks: [{ ...payload.blocks[0], mapImageUrl: 'http://evil.example/m.png' }] })).mapImage, '');
    const dom = new JSDOM(html, { url: 'https://www.trypackai.com/a/tok', runScripts: 'outside-only' });
    dom.window.fetch = async () => ({ ok: true, status: 200, json: async () => payload });
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'));
    await new Promise((r) => setTimeout(r, 20));
    const doc = dom.window.document;
    const img = doc.querySelector('img.mapImage');
    assert.equal(img.src, 'https://www.trypackai.com/og/maps/abc.png');
    assert.equal(doc.querySelectorAll('svg.map').length, 0);
    assert.equal(doc.querySelectorAll('button.pin').length, 0); // no server pin fractions: none drawn over the image
    img.dispatchEvent(new dom.window.Event('error'));
    assert.equal(doc.querySelectorAll('svg.map circle').length, 2);
    assert.equal(doc.querySelector('img.mapImage'), null);
  });
});

describe('sports_team is league-agnostic and follows the layout spec', () => {
  const rows = (groups) => [
    { label: 'Record', value: '58-24' }, { label: 'Place', value: '1' }, { label: 'Games (incl. postseason)', value: '82' },
    { label: 'Points for (incl. postseason)', value: '9712' }, { label: 'Points against (incl. postseason)', value: '9120' }, { label: 'Last 10', value: '8-2' },
    ...Object.entries(groups).flatMap(([g, n]) => Array.from({ length: n }, (_, i) => ({ label: `Player ${g}${i} (${g})`, value: '4120 YDS, 31 TD, 9 INT, 98.2 RTG' }))),
    { label: 'Player stats', value: 'Provider, 2026-10-09' },
  ];
  it('any group becomes a column; one group splits across two; a long stat line keeps its leading stats', () => {
    const nfl = plain(raw.teamBecausePayload({ title: 'Washington Commanders 2026', rows: rows({ passer: 3, rusher: 5, receiver: 6 }) }));
    assert.deepEqual(nfl.columns.map((c) => c.title), ['Passers', 'Rushers']);
    assert.ok(nfl.columns[0].players[0].line.length <= 28);
    assert.equal(nfl.columns[0].players[0].line, '4120 YDS, 31 TD, 9 INT');
    const nba = plain(raw.teamBecausePayload({ title: 'Oklahoma City Thunder 2025-26', rows: rows({ player: 10 }) }));
    assert.equal(nba.season, '2025-26');
    assert.deepEqual(nba.columns.map((c) => [c.title, c.players.length]), [['Players', 5], ['', 5]]);
    assert.deepEqual(nba.tiles.map((t) => t.label), ['Place', 'Games', 'Points for', 'Points against', 'Last 10']);
  });
  it('the layout picks tiles and the leading group; missing names fall back; plain hides the record line', () => {
    const t = plain(raw.teamBecausePayload({ title: 'Athletics 2026', rows: rows({ hitter: 2, pitcher: 2 }), layout: { header: 'plain', featured: ['Last 10', 'Place'], emphasis: 'pitcher' } }));
    assert.deepEqual(t.tiles.map((x) => x.label), ['Last 10', 'Place']);
    assert.deepEqual(t.columns.map((c) => c.group), ['pitcher', 'hitter']);
    assert.equal(t.subline, '');
    const f = plain(raw.teamBecausePayload({ title: 'Athletics 2026', rows: rows({ hitter: 2 }), layout: { header: 'record', featured: ['Nope', 'Nada'] } }));
    assert.ok(f.tiles.length >= 2);
    assert.equal(f.subline, '58-24');
  });
  it('every team name fits a header of two lines at most with a readable font', () => {
    const teams = ['Arizona Diamondbacks 2026', 'Oklahoma City Thunder 2025-26', 'Portland Trail Blazers 2025-26', 'Los Angeles Angels 2026', 'Toronto Maple Leafs 2025-26', 'Athletics 2026'];
    for (const title of teams) {
      const fit = raw.headerTitleFit(title);
      assert.ok(fit.fontSize >= 14 && fit.lines <= 2, title);
    }
  });
});

describe('place_list carousel', () => {
  it('draws photo pins at the server fractions over the map image and selects the pin on a pin click', async () => {
    const { JSDOM } = await import('jsdom');
    const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
    const payload = { kind: 'place_list', title: 'Coffee', blocks: [{ kind: 'place_list', mapImageUrl: 'https://www.trypackai.com/og/maps/abc.png', mapPins: [{ n: 1, x: 0.4, y: 0.3 }, { n: 2, x: 0.6, y: 0.5 }], items: [
      { rank: 1, name: 'Alma', lat: 37.7881, lon: -122.4072, category: 'Coffee shop', photoUrl: 'https://www.trypackai.com/p/a.jpg', rating: 4.6, priceLevel: 2, openState: 'open', closesAtLocal: '21:30', why: 'closest' },
      { rank: 2, name: 'Encore', lat: 37.7886, lon: -122.4082 },
    ] }] };
    const dom = new JSDOM(html, { url: 'https://www.trypackai.com/a/tok', runScripts: 'outside-only' });
    dom.window.fetch = async () => ({ ok: true, status: 200, json: async () => payload });
    dom.window.eval(fs.readFileSync(path.join(here, '../../public/a-card.v2.js'), 'utf8'));
    await new Promise((r) => setTimeout(r, 20));
    const doc = dom.window.document;
    const pins = [...doc.querySelectorAll('button.pin')];
    assert.equal(pins.length, 2);
    assert.equal(pins[0].style.left, '40%');
    assert.equal(pins[0].querySelector('img').src, 'https://www.trypackai.com/p/a.jpg');
    assert.equal(pins[1].textContent, '2');
    assert.ok(pins[0].classList.contains('on'));
    pins[1].dispatchEvent(new dom.window.Event('click'));
    assert.ok(pins[1].classList.contains('on') && !pins[0].classList.contains('on'));
    const card = doc.querySelector('.placeCard');
    assert.equal(card.querySelector('.ratingBadge').textContent, '\u2605 4.6');
    assert.equal(card.querySelector('img').src, 'https://www.trypackai.com/p/a.jpg');
    assert.match(doc.querySelectorAll('.placeCard')[1].querySelector('img').src, /clip-headers\/dining\.restaurant\.jpg$|clip-headers\/local\.places\.jpg$/);
  });
  it('category art registry and 12-hour clocks', () => {
    assert.match(raw.placeArtUrl('Coffee shop'), /dining\.restaurant\.jpg$/);
    assert.match(raw.placeArtUrl('Gym'), /health\.fitness\.jpg$/);
    assert.match(raw.placeArtUrl('Barber'), /local\.services\.jpg$/);
    assert.match(raw.placeArtUrl('Museum'), /local\.places\.jpg$/);
    assert.equal(raw.clock12('21:30'), '9:30 PM');
    assert.equal(raw.clock12('00:05'), '12:05 AM');
  });
});

describe('typed player groups', () => {
  it('a typed group makes a row a player (no tag in the label); old cards still read the suffix', () => {
    const t = plain(raw.teamBecausePayload({ title: 'Athletics 2026', rows: [
      { label: 'Record', value: '80-82' }, { label: 'Games (regular season)', value: '162' },
      { label: 'Shohei Ohtani', value: '.310 AVG', group: 'hitter' }, { label: 'Yoshinobu Yamamoto (pitcher)', value: '12-8', group: 'pitcher' },
    ] }));
    assert.deepEqual(t.tiles.map((x) => x.label), ['Games (regular season)']);
    assert.deepEqual(t.columns.map((c) => [c.group, c.players.map((p) => p.name)]), [['hitter', ['Shohei Ohtani']], ['pitcher', ['Yoshinobu Yamamoto']]]);
    const old = plain(raw.teamBecausePayload({ title: 'Athletics 2026', rows: [{ label: 'Old Row (pitcher)', value: '1-0' }] }));
    assert.equal(old.columns[0].players[0].name, 'Old Row');
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
