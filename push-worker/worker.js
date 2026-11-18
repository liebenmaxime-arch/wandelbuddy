// Wandelbuddy · pushmeldingen (Cloudflare Worker, gratis plan)
//
// Wat doet dit?
// - Elke minuut (Cron Trigger) kijkt de Worker in de database:
//     1. nieuwe activiteiten  → melding naar alle collega's van hetzelfde bedrijf (niet naar de organisator)
//     2. activiteiten die binnen 10 minuten beginnen → herinnering naar wie meedoet
// - De app roept ook /run?c=<bedrijf> aan net na het plannen, zodat nieuwe activiteiten meteen gemeld worden.
// - Elke persoon krijgt elke melding maar één keer (bijgehouden in companies/<bedrijf>/pushlog).
//   Per keer vertrekken er hoogstens MAX_SENDS meldingen; de rest volgt de minuut erna.
//
// Geheimen (NIET in deze code, maar in Cloudflare → Settings → Variables and Secrets):
//   VAPID_PRIVATE_JWK  de private VAPID-sleutel (JSON)
//   ROBOT_PASSWORD     het wachtwoord van robot@wandelbuddy-9c08c.firebaseapp.com
//
// Alles hieronder is publiek en mag in de openbare repository staan.

const PROJECT = 'wandelbuddy-9c08c';
const API_KEY = 'AIzaSyAZvONuUmHcZpHdAqp0t8EZJh96SYlIPDI'; // publieke Firebase web-sleutel
const ROBOT_EMAIL = 'robot@wandelbuddy-9c08c.firebaseapp.com';
const APP_URL = 'https://liebenmaxime-arch.github.io/wandelbuddy/';
const TZ = 'Europe/Brussels';
const DB = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const LABELS = { wandelen: 'Wandelen', lopen: 'Lopen', padel: 'Padel', fietsen: 'Fietsen', stretch: 'Yoga' };
const MAX_SENDS = 30; // gratis plan: max 50 externe oproepen per keer; de rest is voor de database. Wie erbuiten valt, krijgt zijn melding de minuut erna.

// ---------- hulpjes ----------
const enc = new TextEncoder();
export const b64u = (buf) => { const a = new Uint8Array(buf); let s = ''; for (const x of a) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
export const concat = (...arrs) => { const n = arrs.reduce((s, x) => s + x.length, 0); const o = new Uint8Array(n); let i = 0; for (const x of arrs) { o.set(x, i); i += x.length; } return o; };
const pad = (n) => String(n).padStart(2, '0');

// tijd in België
function nowBE() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute), hour: Number(p.hour) };
}
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const hhmm = (t) => String(t || '').replace(':', 'u');
function dayLabel(date, today) {
  if (date === today) return 'Vandaag';
  const d = new Date(date + 'T12:00:00Z'); const t = new Date(today + 'T12:00:00Z');
  if (Math.round((d - t) / 864e5) === 1) return 'Morgen';
  const s = d.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- Web Push-versleuteling (RFC 8291, aes128gcm) ----------
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}
export async function encryptPayload(payload, uaPubB64, authB64) {
  const uaPub = unb64u(uaPubB64); const auth = unb64u(authB64);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const localPub = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(auth, shared, concat(enc.encode('WebPush: info\0'), uaPub, localPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(payload, new Uint8Array([2]))));
  return concat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([localPub.length]), localPub, ct); // rs = 4096
}

// ---------- VAPID (wie verstuurt de melding) ----------
export async function makeVapid(jwkText) {
  const jwk = JSON.parse(jwkText);
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: jwk.d, x: jwk.x, y: jwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { key, pub: b64u(concat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y))), cache: new Map() };
}
export async function vapidAuth(endpoint, vapid) {
  const aud = new URL(endpoint).origin;
  let jwt = vapid.cache.get(aud);
  if (!jwt) {
    const h = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const p = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, vapid.key, enc.encode(`${h}.${p}`));
    jwt = `${h}.${p}.${b64u(sig)}`; vapid.cache.set(aud, jwt);
  }
  return `vapid t=${jwt}, k=${vapid.pub}`;
}
async function sendPush(sub, message, vapid) {
  const body = await encryptPayload(enc.encode(JSON.stringify(message)), sub.p256dh, sub.auth);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '3600', Urgency: 'high', Authorization: await vapidAuth(sub.endpoint, vapid) },
    body,
  });
  return { status: res.status, text: await res.text().catch(() => '') };
}

// ---------- database (Firestore REST, als robot-beheerder) ----------
let token = null;
async function robotToken(env) {
  if (token && token.exp > Date.now() + 60000) return token.id;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ROBOT_EMAIL, password: String(env.ROBOT_PASSWORD || '').trim(), returnSecureToken: true }),
  });
  if (!r.ok) {
    const why = ((await r.json().catch(() => ({}))).error || {}).message || r.status;
    throw new Error('robot kan niet aanmelden: ' + why + (env.ROBOT_PASSWORD ? ' (wachtwoord van ' + String(env.ROBOT_PASSWORD).trim().length + ' tekens)' : ' (geen wachtwoord ingesteld)'));
  }
  const j = await r.json(); token = { id: j.idToken, exp: Date.now() + Number(j.expiresIn) * 1000 };
  return token.id;
}
function val(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('mapValue' in v) { const o = {}; for (const k in v.mapValue.fields || {}) o[k] = val(v.mapValue.fields[k]); return o; }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  return null;
}
const docOut = (d) => { const o = { id: d.name.split('/').pop() }; for (const k in d.fields || {}) o[k] = val(d.fields[k]); return o; };
async function fs(env, path, opts = {}) {
  const t = await robotToken(env);
  return fetch(DB + path, { ...opts, headers: { authorization: 'Bearer ' + t, 'content-type': 'application/json' } });
}
async function listDocs(env, path) { const r = await fs(env, path + '?pageSize=300'); if (!r.ok) throw new Error(path + ' ' + r.status); return ((await r.json()).documents || []).map(docOut); }
async function getDoc(env, path) { const r = await fs(env, path); return r.ok ? docOut(await r.json()) : null; }
async function query(env, c, coll, field, op, value) {
  const v = typeof value === 'number' ? { integerValue: String(Math.round(value)) } : { stringValue: String(value) };
  const r = await fs(env, `/companies/${c}:runQuery`, { method: 'POST', body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: field }, op, value: v } } } }) });
  if (!r.ok) throw new Error(`query ${coll} ${r.status}`);
  return (await r.json()).filter((x) => x.document).map((x) => docOut(x.document));
}
// Wie krijgt deze melding nu? (key = "n_<activiteit>" of "r_<activiteit>")
// 1) in één oproep opvragen wie ze al kreeg, 2) de rest kiezen binnen de grens, 3) in één oproep noteren.
// Het noteren lukt alleen als niemand anders net hetzelfde deed; anders volgende minuut opnieuw (nooit dubbel).
async function claimBatch(env, c, key, candidates, byPid, budget) {
  if (!candidates.length) return [];
  const done = new Set((await query(env, c, 'pushlog', 'act', 'EQUAL', key)).map((d) => d.pid));
  const todo = fitBudget(candidates.filter((p) => !done.has(p)), byPid, budget);
  if (!todo.length) return [];
  const writes = todo.map((p) => ({ update: { name: `projects/${PROJECT}/databases/(default)/documents/companies/${c}/pushlog/${key}_${p}`, fields: { act: { stringValue: key }, pid: { stringValue: p }, at: { integerValue: String(Date.now()) } } }, currentDocument: { exists: false } }));
  const r = await fs(env, ':commit', { method: 'POST', body: JSON.stringify({ writes }) });
  if (!r.ok) { budget.log.push({ c, stap: 'logboek bezet, volgende minuut opnieuw', key, status: r.status }); return []; }
  return todo;
}
// meldingsadressen van een bedrijf, per persoon gegroepeerd (één keer per run opgehaald)
async function subsByPid(env, c, cache) {
  if (!cache.has(c)) {
    const m = new Map();
    for (const s of await listDocs(env, `/companies/${c}/push`)) { if (!m.has(s.pid)) m.set(s.pid, []); m.get(s.pid).push(s); }
    cache.set(c, m);
  }
  return cache.get(c);
}
// kies zoveel personen als er nog meldingen mogen vertrekken in deze run; de rest komt de volgende minuut
function fitBudget(pids, byPid, budget) {
  const out = []; let n = 0;
  for (const p of pids) { const k = (byPid.get(p) || []).length; if (!k) continue; if (n + k > budget.left) break; out.push(p); n += k; }
  return out;
}

// ---------- het eigenlijke werk ----------
async function deliver(env, c, subs, message, vapid, budget) {
  let sent = 0;
  for (const s of subs) {
    if (budget.left <= 0) break;
    if (!s.endpoint || !s.p256dh || !s.auth) { budget.log.push({ c, stap: 'adres onvolledig' }); continue; }
    budget.left--;
    try {
      const { status, text } = await sendPush(s, message, vapid);
      budget.log.push({ c, stap: 'verstuurd', dienst: new URL(s.endpoint).host, status, antwoord: text.slice(0, 120) });
      if (status === 404 || status === 410) await fs(env, `/companies/${c}/push/${s.id}`, { method: 'DELETE' }); // toestel bestaat niet meer
      else if (status < 300) sent++;
    } catch (e) { budget.log.push({ c, stap: 'versturen mislukt', fout: String(e).slice(0, 120) }); }
  }
  return sent;
}
async function nameOf(env, c, pid) { const u = await getDoc(env, `/companies/${c}/users/${pid}`); return (u && u.name) || 'Een collega'; }
const labelOf = (a) => a.label || LABELS[a.type] || 'Sporten';

// nieuwe activiteit → melding naar elke collega met meldingen aan (niet naar de organisator).
// Per persoon bijgehouden: wie deze keer buiten de grens valt, krijgt de melding de minuut erna.
async function newActivities(env, c, now, vapid, budget, cache) {
  const recent = await query(env, c, 'activities', 'createdAt', 'GREATER_THAN', Date.now() - 15 * 60000);
  budget.log.push({ c, stap: 'nieuwe activiteiten', aantal: recent.length });
  let sent = 0;
  for (const a of recent) {
    if (budget.left <= 0) { budget.log.push({ c, stap: 'grens bereikt, rest volgende minuut' }); break; }
    if (a.date < now.date || (a.date === now.date && toMin(a.time) + (a.dur || 0) <= now.min)) continue; // al voorbij
    const byPid = await subsByPid(env, c, cache);
    const todo = await claimBatch(env, c, 'n_' + a.id, [...byPid.keys()].filter((p) => p !== a.by), byPid, budget);
    budget.log.push({ c, stap: 'nieuwe activiteit', act: a.id, personen: todo.length });
    if (!todo.length) continue;
    const who = await nameOf(env, c, a.by);
    const msg = { title: `${who} gaat ${labelOf(a).toLowerCase()}`, body: `${dayLabel(a.date, now.date)} om ${hhmm(a.time)} · ${a.dur} min · vertrek: ${a.place}`, tag: a.id, url: `./#a=${a.id}` };
    for (const p of todo) sent += await deliver(env, c, byPid.get(p), msg, vapid, budget);
  }
  return sent;
}
// herinnering 10 minuten vooraf → naar elke deelnemer (ook wie pas later op "Doe mee" tikt), per persoon één keer
async function reminders(env, c, now, vapid, budget, cache) {
  const today = await query(env, c, 'activities', 'date', 'EQUAL', now.date);
  let sent = 0;
  for (const a of today) {
    if (budget.left <= 0) { budget.log.push({ c, stap: 'grens bereikt, rest volgende minuut' }); break; }
    const left = toMin(a.time) - now.min;
    if (left <= 0 || left > 10) continue;
    const joined = [...new Set((await query(env, c, 'joins', 'act', 'EQUAL', a.id)).map((j) => j.uid))];
    const byPid = await subsByPid(env, c, cache);
    const todo = await claimBatch(env, c, 'r_' + a.id, joined, byPid, budget);
    if (!todo.length) continue;
    budget.log.push({ c, stap: 'herinnering', act: a.id, minuten: left, personen: todo.length });
    const msg = { title: `Over ${left} ${left === 1 ? 'minuut' : 'minuten'}: ${labelOf(a).toLowerCase()}`, body: `Om ${hhmm(a.time)} · vertrek aan ${a.place}`, tag: 'r' + a.id, url: `./#a=${a.id}` };
    for (const p of todo) sent += await deliver(env, c, byPid.get(p), msg, vapid, budget);
  }
  return sent;
}
async function run(env, onlyCompany) {
  const now = nowBE();
  const vapid = await makeVapid(env.VAPID_PRIVATE_JWK);
  const budget = { left: MAX_SENDS, log: [] }; const cache = new Map();
  const companies = onlyCompany ? [onlyCompany] : (await listDocs(env, '/companies')).map((x) => x.id);
  let sent = 0;
  for (const c of companies) {
    try {
      // eerst herinneringen (die zijn tijdgebonden), dan nieuwe activiteiten
      if (!onlyCompany) sent += await reminders(env, c, now, vapid, budget, cache);
      sent += await newActivities(env, c, now, vapid, budget, cache);
    } catch (e) { budget.log.push({ c, stap: 'fout', fout: String(e).slice(0, 160) }); }
  }
  for (const l of budget.log) console.log(JSON.stringify(l));
  return { sent, companies: companies.length, log: budget.log };
}

const lastRun = new Map();
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
// bijhouden wanneer de minuutcontrole (Cron Trigger) voor het laatst liep, zodat /status dat kan tonen
async function markCron(env, info) {
  try { await fs(env, '/config/pushworker', { method: 'PATCH', body: JSON.stringify({ fields: { lastCron: { integerValue: String(Date.now()) }, lastResult: { stringValue: String(info).slice(0, 200) } } }) }); } catch (e) {}
}
export default {
  // elke minuut (Cron Trigger "* * * * *"); 's nachts doet hij niets
  async scheduled(event, env, ctx) {
    const h = nowBE().hour; if (h < 6 || h >= 21) return;
    ctx.waitUntil(run(env)
      .then((r) => markCron(env, `${r.sent} verstuurd, ${r.companies} bedrijven`))
      .catch((e) => markCron(env, 'fout: ' + String(e))));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/run') { // seintje van de app net na het plannen
      const c = (url.searchParams.get('c') || '').replace(/[^a-z0-9]/g, '').slice(0, 60);
      if (!c) return new Response('{"ok":false}', { status: 400, headers: cors });
      if (Date.now() - (lastRun.get(c) || 0) < 5000) return new Response('{"ok":true,"skip":true}', { headers: cors });
      lastRun.set(c, Date.now());
      const job = run(env, c);
      ctx.waitUntil(job.catch(() => {})); // ook afwerken als de app de verbinding al verbrak
      try { const r = await job; return new Response(JSON.stringify({ ok: true, ...r }), { headers: cors }); }
      catch (e) { return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: cors }); }
    }
    if (url.pathname === '/status') { // controle: staan de geheimen goed, en loopt de minuutcontrole?
      const out = { ok: true, tijd: nowBE() };
      try { await makeVapid(env.VAPID_PRIVATE_JWK); out.vapid = 'in orde'; } catch (e) { out.vapid = 'ontbreekt of fout'; out.ok = false; }
      try { await robotToken(env); out.robot = 'in orde'; } catch (e) { out.robot = String(e.message || e); out.ok = false; }
      try {
        const m = await getDoc(env, '/config/pushworker');
        if (m && m.lastCron) { const ago = Math.round((Date.now() - m.lastCron) / 60000); out.minuutcontrole = ago <= 2 ? `loopt (laatst ${ago} min geleden: ${m.lastResult})` : `laatst ${ago} min geleden (staat de Cron Trigger aan? 's nachts rust hij)`; }
        else out.minuutcontrole = 'nog nooit gelopen: zet de Cron Trigger "* * * * *" aan';
      } catch (e) { out.minuutcontrole = 'onbekend'; }
      return new Response(JSON.stringify(out, null, 2), { headers: cors });
    }
    return new Response('Wandelbuddy pushmeldingen. Alles in orde.', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
};
