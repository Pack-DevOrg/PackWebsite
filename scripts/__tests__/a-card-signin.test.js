import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { after as afterAll, describe, it } from 'node:test';
import vm from 'node:vm';

/* "Sign in to view" on /a/<token>: the 401 gate, Hosted UI PKCE, the in-memory ID token, 403, expiry, live refresh. */
const here = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = fs.readFileSync(path.join(here, '../../public/a-card.v4.js'), 'utf8');
const sandbox = { module: { exports: {} }, URL };
vm.runInNewContext(SCRIPT, sandbox);
const raw = sandbox.module.exports;

const AGENDA = (extra = {}) => ({
  kind: 'agenda', version: 1, title: 'Tech Week LA', rows: [], source: 'Pack', asOf: '2099-10-14T00:00:00.000Z', actions: [],
  blocks: [{
    kind: 'agenda', title: 'Tech Week LA', timeZone: 'America/Los_Angeles', asOf: '2099-10-14T00:00:00.000Z', source: 'Pack',
    members: [{ id: 'm1', name: 'Test User', role: 'owner', events: 'shared' }, { id: 'm2', name: 'Sam Synthetic', role: 'member', events: 'shared' }],
    viewer: { memberId: 'm1', needsConsent: false },
    events: [
      { id: 'e1', title: 'Tech Week Breakfast', startIso: '2099-10-14T16:00:00.000Z', venue: 'Cafe Gratitude', lat: 34.08, lon: -118.32, attendees: [{ memberId: 'm1', status: 'going' }] },
      { id: 'e2', title: 'Demo Night', startIso: '2099-10-16T02:00:00.000Z', attendees: [{ memberId: 'm2', status: 'waitlist' }] },
    ],
    ...extra,
  }],
});

const opened = [];
afterAll(() => opened.forEach((w) => w.close()));

async function page({ pathname = '/a/tok', responses, session = {}, interval, userAgent } = {}) {
  const { JSDOM } = await import('jsdom');
  const html = fs.readFileSync(path.join(here, '../../public/a/index.html'), 'utf8').replace(/<script src="[^"]*"><\/script>/, '');
  const dom = new JSDOM(html, { url: `https://www.trypackai.com${pathname}`, runScripts: 'outside-only', ...(userAgent ? { userAgent } : {}) });
  const w = dom.window;
  Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
  w.TextEncoder = TextEncoder;
  Object.defineProperty(w.document, 'hidden', { value: false, configurable: true });
  for (const [k, v] of Object.entries(session)) w.sessionStorage.setItem(k, v);
  const calls = [];
  w.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    const r = typeof next === 'function' ? next(String(url), init) : next;
    return { ok: r.status === 200, status: r.status, json: async () => r.body };
  };
  if (interval) w.setInterval = (fn) => { interval.fn = fn; return 7; };
  w.eval(SCRIPT);
  await new Promise((r) => setTimeout(r, 30));
  opened.push(w);
  return { w, doc: w.document, calls, text: () => w.document.getElementById('card').textContent };
}

describe('anonymous private card', () => {
  it('shows the private state with a Sign in to view button, and sends no credentials', async () => {
    const { doc, calls, text } = await page({ responses: [{ status: 401, body: { unlock: 'otp' } }] });
    assert.match(text(), /This card is private/);
    assert.equal(doc.getElementById('signin').textContent, 'Sign in to view');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].init.headers.authorization, undefined);
    assert.ok(doc.querySelector('a.cta[href^="com.packai.app://a/"]'), 'Open in Pack stays');
  });

  it('Sign in goes to the Hosted UI of the app user pool with PKCE (S256) and returns to /a/callback', async () => {
    const { w } = await page({ responses: [{ status: 401, body: {} }] });
    const url = new URL(await w.PackCard.beginSignIn(w, 'tok', false));
    assert.equal(url.origin + url.pathname, 'https://auth.trypackai.com/oauth2/authorize');
    const q = url.searchParams;
    assert.equal(q.get('client_id'), '4h8pha61va6n081674mdrc0m7');
    assert.equal(q.get('response_type'), 'code');
    assert.equal(q.get('redirect_uri'), 'https://www.trypackai.com/a/callback');
    assert.equal(q.get('scope'), 'openid email profile');
    assert.equal(q.get('code_challenge_method'), 'S256');
    assert.equal(q.get('identity_provider'), null, 'the Hosted UI offers Apple, Google and email');
    const pending = JSON.parse(w.sessionStorage.getItem('pack.card.pkce'));
    assert.equal(pending.token, 'tok');
    assert.equal(q.get('state'), pending.state);
    const digest = new Uint8Array(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(pending.verifier)));
    assert.equal(q.get('code_challenge'), Buffer.from(digest).toString('base64url'));
  });
});

describe('locked state', () => {
  const PRIVATE = { status: 401, body: { unlock: 'otp', preview: { kind: 'agenda', title: 'Tech Week LA' } } };

  it('names what is locked (kind and title), with the Pack mark, one primary and one text action', async () => {
    const { doc } = await page({ responses: [PRIVATE] });
    assert.equal(doc.querySelector('.gateMark').getAttribute('src'), '/logo.png');
    assert.equal(doc.querySelector('.kindChip').textContent, 'Shared agenda');
    assert.equal(doc.querySelector('.lockedTitle').textContent, 'Tech Week LA');
    assert.equal(doc.querySelectorAll('.gatePrimary').length, 1);
    assert.equal(doc.querySelectorAll('.gateText').length, 1);
    assert.equal(doc.querySelector('.gatePrimary').textContent, 'Sign in to view');
    assert.equal(doc.body.className, 'gateBody');
  });

  it('on a phone the primary action is Open in Pack and Sign in to view is the text action', async () => {
    const { doc } = await page({ responses: [PRIVATE], userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' });
    assert.equal(doc.querySelector('.gatePrimary').textContent, 'Open in Pack');
    assert.equal(doc.querySelector('.gateText').textContent, 'Sign in to view');
    assert.equal(doc.getElementById('signin').textContent, 'Sign in to view');
  });

  it('a 403 shows no preview of the card', async () => {
    const { doc } = await page({ responses: [{ status: 403, body: { error: 'No access' } }] });
    assert.equal(doc.querySelector('.lockedTitle'), null);
    assert.match(doc.getElementById('card').textContent, /do not have access/);
  });
});

describe('after sign-in', () => {
  const callbackSession = (extra = {}) => ({ 'pack.card.pkce': JSON.stringify({ state: 'S', verifier: 'V'.repeat(43), token: 'tok', at: Date.now(), ...extra }) });

  it('/a/callback trades the code (PKCE verifier), keeps the ID token in memory, and shows the card', async () => {
    const { w, doc, calls } = await page({
      pathname: '/a/callback?code=CODE&state=S',
      session: callbackSession(),
      responses: [{ status: 200, body: { id_token: 'ID.TOKEN.X', access_token: 'a', refresh_token: 'r' } }, { status: 200, body: AGENDA() }],
    });
    assert.equal(calls[0].url, 'https://auth.trypackai.com/oauth2/token');
    const form = new URLSearchParams(calls[0].init.body);
    assert.equal(form.get('grant_type'), 'authorization_code');
    assert.equal(form.get('client_id'), '4h8pha61va6n081674mdrc0m7');
    assert.equal(form.get('code'), 'CODE');
    assert.equal(form.get('code_verifier'), 'V'.repeat(43));
    assert.equal(form.get('redirect_uri'), 'https://www.trypackai.com/a/callback');
    assert.equal(calls[1].url, 'https://api.trypackai.com/api/artifact/tok');
    assert.equal(calls[1].init.headers.authorization, 'Bearer ID.TOKEN.X');
    assert.equal(w.location.pathname, '/a/tok');
    for (const area of [w.sessionStorage, w.localStorage]) {
      for (let i = 0; i < area.length; i++) assert.equal(String(area.getItem(area.key(i))).includes('ID.TOKEN'), false, 'token never stored');
    }
    assert.equal(w.document.cookie.includes('ID.TOKEN'), false);
    assert.equal(w.sessionStorage.getItem('pack.card.pkce'), null, 'PKCE state is single use');
    const text = doc.getElementById('card').textContent;
    for (const bit of ['Tech Week LA', 'Tech Week Breakfast', 'Cafe Gratitude', 'Demo Night', 'Sam Synthetic', 'Going']) assert.ok(text.includes(bit), `missing ${bit}`);
    assert.ok(doc.getElementById('card').classList.contains('agendaCard'));
    assert.equal(doc.querySelectorAll('.dayLabel').length, 2);
  });

  it('a callback whose state does not match shows a retry, and never calls the token endpoint', async () => {
    const { calls, doc, text } = await page({ pathname: '/a/callback?code=CODE&state=EVIL', session: callbackSession(), responses: [] });
    assert.equal(calls.length, 0);
    assert.match(text(), /did not finish/);
    assert.ok(doc.getElementById('signin'));
  });

  it('a signed-in non-member sees "You do not have access" with no card content', async () => {
    const { text, doc } = await page({
      pathname: '/a/callback?code=CODE&state=S', session: callbackSession(),
      responses: [{ status: 200, body: { id_token: 'ID' } }, { status: 403, body: { error: 'No access' } }],
    });
    assert.match(text(), /do not have access/);
    assert.equal(text().includes('Tech Week'), false);
    assert.equal(doc.getElementById('signin').textContent, 'Sign in with a different account');
  });

  it('an expired token asks to sign in again', async () => {
    const { text } = await page({
      pathname: '/a/callback?code=CODE&state=S', session: { ...callbackSession(), 'pack.card.reauth': String(Date.now()) },
      responses: [{ status: 200, body: { id_token: 'ID' } }, { status: 401, body: { signIn: 'expired' } }],
    });
    assert.match(text(), /sign-in ended/);
  });

  it('live: the open page refetches on a timer and re-renders only when the agenda changed', async () => {
    const interval = {};
    const changed = AGENDA();
    changed.blocks[0].events.push({ id: 'e3', title: 'Founders Brunch', startIso: '2099-10-17T18:00:00.000Z', attendees: [{ memberId: 'm2', status: 'going' }] });
    const { text, calls } = await page({
      pathname: '/a/callback?code=CODE&state=S', session: callbackSession(), interval,
      responses: [{ status: 200, body: { id_token: 'ID' } }, { status: 200, body: AGENDA() }, { status: 200, body: AGENDA() }, { status: 200, body: changed }],
    });
    assert.equal(text().includes('Founders Brunch'), false);
    await interval.fn();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(calls[2].init.headers.authorization, 'Bearer ID');
    assert.equal(text().includes('Founders Brunch'), false);
    await interval.fn();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(text().includes('Founders Brunch'), true);
  });
});

describe('agenda view model', () => {
  it('groups events by day in the agenda time zone, names people, and keeps only https links', () => {
    const p = AGENDA();
    p.blocks[0].events[0].rsvpUrl = 'javascript:alert(1)';
    p.blocks[0].events[1].rsvpUrl = 'https://lu.ma/x';
    const m = JSON.parse(JSON.stringify(raw.viewModelBecausePayload(p)));
    assert.deepEqual(m.agenda.days.map((d) => d.label), ['Wed, Oct 14', 'Thu, Oct 15']);
    assert.equal(m.agenda.days[0].events[0].time, '9 AM');
    assert.deepEqual(m.agenda.days[0].events[0].who, ['You']);
    assert.equal(m.agenda.days[0].events[0].rsvp, '');
    assert.equal(m.agenda.days[1].events[0].rsvp, 'https://lu.ma/x');
    assert.equal(m.agenda.days[0].events[0].pin, 1);
  });

  it('tells a viewer whose events are not shared yet', () => {
    const m = JSON.parse(JSON.stringify(raw.viewModelBecausePayload(AGENDA({ viewer: { memberId: 'm2', needsConsent: true } }))));
    assert.equal(m.agenda.needsConsent, true);
  });
});
