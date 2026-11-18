// Wandelbuddy · app
// De koppeling met Firebase staat in firebase-config.js.
import { firebaseConfig } from './firebase-config.js';
import { pushConfig } from './push-config.js';
const FB_VER = '10.12.2';

// ---------- constants ----------
const ICON = {
  wandelen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M9 21l2.4-6.2 2.6 2.4V21M10.5 9.5l-2.5 3.2H5.5M11.4 14.8l1-6 3.6 3H19"/></svg>',
  lopen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="4" r="2"/><path d="M5 21l4-5 3 2 2-6M8 10l3-3h4l2 4 3 1M14 12l-2 6"/></svg>',
  padel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="10" cy="9" rx="6" ry="6.5"/><path d="M14 14l5.5 6"/><circle cx="19" cy="5" r="1.6"/></svg>',
  fietsen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="16" r="3.6"/><circle cx="18" cy="16" r="3.6"/><path d="M6 16l4-7h5l3 7M10 9l3 7h-3M14 6h2.5"/></svg>',
  stretch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M4 9l8 2 8-2M12 11v4M12 15l-4 6M12 15l4 6"/></svg>',
};
const TYPES = {
  wandelen: { label: 'Wandelen', spm: 100, durs: [15, 20, 30, 45], dur: 20 },
  lopen: { label: 'Lopen', spm: 160, durs: [20, 30, 45], dur: 30 },
  padel: { label: 'Padel', spm: 80, durs: [45, 60, 90], dur: 60, max: 4 },
  fietsen: { label: 'Fietsen', spm: 0, durs: [20, 30, 45], dur: 30 },
  stretch: { label: 'Stretchen', spm: 0, durs: [10, 15, 20], dur: 15 },
};
const TIMES = ['11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:45'];
const PLACES = ['Inkom', 'Parking', 'Refter'];
const COLORS = ['#2E7D5B', '#2B6CB0', '#B23E73', '#7B5BB5', '#C2571B', '#3F7F8C', '#8A6A1F'];
const PACKS = [100, 150, 200];
const BADGES = [
  { id: 'first', name: 'Eerste stap', how: 'Doe één keer mee' },
  { id: 'lead', name: 'Trekker', how: 'Organiseer zelf een activiteit' },
  { id: 'connect', name: 'Verbinder', how: 'Beweeg met 5 verschillende collega\'s' },
  { id: 'habit', name: 'Vaste gewoonte', how: 'Doe mee in 3 verschillende weken' },
  { id: 'mix', name: 'Allrounder', how: 'Probeer 2 soorten activiteiten' },
  { id: 'steps', name: '10.000 samen', how: 'Zet in totaal 10.000 stappen' },
];

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const hhmm = (t) => t.replace(':', 'u');
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => `${Math.floor(m / 60)}u${pad(m % 60)}`;
const todayStr = () => ymd(new Date());
const monthKey = (s) => s.slice(0, 7);
const weekKey = (s) => { const d = parseDate(s); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-' + Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const dayLabel = (s) => { const t = todayStr(); if (s === t) return 'Vandaag'; if (s === ymd(addDays(new Date(), 1))) return 'Morgen'; return parseDate(s).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' }); };
const shortDay = (s) => { const t = todayStr(); if (s === t) return 'Vandaag'; if (s === ymd(addDays(new Date(), 1))) return 'Morgen'; return parseDate(s).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'numeric' }); };
const isPast = (a) => { const t = todayStr(); if (a.date < t) return true; if (a.date > t) return false; const n = new Date(); return n.getHours() * 60 + n.getMinutes() >= toMin(a.time) + a.dur; };
const colorFor = (id) => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
const initials = (n) => (n || '?').split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const fmtN = (n) => Number(n || 0).toLocaleString('nl-BE');
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
function nextSlot() { const n = new Date(); const now = n.getHours() * 60 + n.getMinutes(); const wd = n.getDay() % 6 !== 0; const t = TIMES.find((x) => toMin(x) > now + 5); if (wd && t) return { date: todayStr(), time: t }; let d = addDays(n, 1); while (d.getDay() % 6 === 0) d = addDays(d, 1); return { date: ymd(d), time: '12:15' }; }
const estSteps = (a) => Math.round((TYPES[a.type]?.spm || 0) * a.dur / 100) * 100;
// Voorbeeld: stappen komen "automatisch binnen" na afloop. In de echte app komen ze van de gsm zelf.
const hashN = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const stepsOf = (j) => stepsOfAct(j, actById(j.act));
const stepsOfAct = (j, a) => { if (!a || !isPast(a)) return 0; if (j.steps) return j.steps; const base = estSteps(a); return base ? Math.round(base * (0.85 + (hashN(j.act + j.uid) % 31) / 100) / 10) * 10 : 0; };
const AUTO_NOTE = 'Stappen worden automatisch gekoppeld';
const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const rid = (n = 14) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''); };
let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }

async function loadFirebase(cfg) {
  const A = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`);
  const F = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`);
  const Au = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth.js`);
  const app = A.initializeApp(cfg);
  return { A, F, db: F.getFirestore(app), Au, auth: Au.getAuth(app) };
}
// Anoniem aanmelden bij Firebase (gratis). Blijft bewaard op dit toestel.
async function signInAnon(Au, auth) {
  const go = (async () => { await auth.authStateReady(); if (!auth.currentUser) await Au.signInAnonymously(auth); return auth.currentUser.uid; })();
  try { return await Promise.race([go, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 8000))]); }
  catch (e) { console.warn('Anoniem aanmelden bij Firebase lukt niet:', (e && e.code) || e); return null; }
}
// Vergelijken zonder hoofdletters, spaties, leestekens of accenten: "U Hasselt" = "uhasselt".
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const userNameKey = (u) => (u && (u.nameKey || norm(u.name))) || '';
const companies = () => (S.companies || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'nl'));

// ---------- sound ----------
let audioCtx = null;
function unlockAudio() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {} }
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });
function chime() {
  try {
    if (!audioCtx) return; const t = audioCtx.currentTime;
    [[784, 0], [1047, .16], [1319, .32]].forEach(([f, d]) => {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.45);
      o.connect(g).connect(audioCtx.destination); o.start(t + d); o.stop(t + d + 0.5);
    });
  } catch (e) {}
}

// ---------- state ----------
const S = { mode: 'loading', me: null, users: {}, acts: [], joins: [], views: [], events: [], cfg: null, loadedActs: false,
  tab: 'agenda', detail: null, draft: null, offline: false, denied: false, confirmDel: false, justAdded: null,
  period: '7', filter: 'all', notifQ: [], reminded: new Set(JSON.parse(ls.get('wb-reminded') || '[]')), seen: new Set(JSON.parse(ls.get('wb-seen') || '[]')), cfgFile: firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId ? firebaseConfig : null };
let store = null;
const BASE_TITLE = document.title;

// ---------- local demo store (zonder Firebase) ----------
function localStore() {
  const KEY = 'wandelbuddy-fb-demo-v1';
  const seed = () => {
    const d = (n) => { const out = []; const x = new Date(); for (let i = 0; out.length < 12; i++) { const y = addDays(x, i); if (y.getDay() % 6) out.push(ymd(y)); } const back = []; for (let i = 1; back.length < 12; i++) { const y = addDays(x, -i); if (y.getDay() % 6) back.push(ymd(y)); } return n >= 0 ? out[n] : back[-n - 1]; };
    const now = Date.now();
    const users = { me: { name: 'Jij', company: 'Jouw bedrijf' }, u_sarah: { name: 'Sarah Peeters', company: 'Bureau Noord' }, u_tom: { name: 'Tom Claes', company: 'Bureau Noord' },
      u_lien: { name: 'Lien Jacobs', company: 'Studio Lindeboom' }, u_jan: { name: 'Jan Wouters', company: 'Studio Lindeboom' }, u_ines: { name: 'Ines Maes', company: 'Bureau Noord' }, u_bram: { name: 'Bram Verhoeven', company: 'Studio Lindeboom' } };
    const acts = [
      { id: 'a1', type: 'wandelen', date: d(0), time: '12:15', dur: 20, place: 'Inkom', note: '', by: 'u_sarah', createdAt: now - 864e5 },
      { id: 'a2', type: 'lopen', date: d(0), time: '12:30', dur: 30, place: 'Parking', note: 'Rustig tempo, iedereen welkom', by: 'u_ines', createdAt: now - 7e7 },
      { id: 'a3', type: 'padel', date: d(1), time: '12:00', dur: 60, place: 'Padelclub om de hoek', note: 'Ik breng ballen mee', by: 'u_tom', createdAt: now - 6e7, max: 4 },
      { id: 'a4', type: 'wandelen', date: d(2), time: '12:45', dur: 15, place: 'Refter', note: '', by: 'u_jan', createdAt: now - 5e7 },
      { id: 'p1', type: 'wandelen', date: d(-8), time: '12:15', dur: 20, place: 'Inkom', note: '', by: 'u_sarah', createdAt: now - 12 * 864e5 },
      { id: 'p2', type: 'wandelen', date: d(-2), time: '12:15', dur: 20, place: 'Inkom', note: '', by: 'u_tom', createdAt: now - 4 * 864e5 },
      { id: 'p3', type: 'stretch', date: d(-3), time: '13:00', dur: 15, place: 'Refter', note: '', by: 'u_lien', createdAt: now - 5 * 864e5 },
    ];
    const j = (a, u, steps) => ({ id: `${a}__${u}`, act: a, uid: u, steps: steps ?? null, at: now });
    const joins = [j('a1', 'u_sarah'), j('a1', 'u_tom'), j('a1', 'u_lien'), j('a1', 'u_jan'), j('a2', 'u_ines'), j('a3', 'u_tom'), j('a3', 'u_lien'), j('a4', 'u_jan'),
      j('p1', 'u_sarah', 2100), j('p1', 'me', 2000), j('p1', 'u_tom', 2300), j('p2', 'u_tom', 1900), j('p2', 'me', 2200), j('p2', 'u_lien', 2000), j('p2', 'u_bram', 2400),
      j('p3', 'u_lien'), j('p3', 'u_jan')];
    const uids = Object.keys(users); const views = []; const events = [];
    acts.forEach((a, i) => uids.forEach((u, k) => { if ((i + k) % 4 !== 0 || joins.some((x) => x.act === a.id && x.uid === u)) views.push({ id: `${a.id}__${u}`, act: a.id, uid: u, at: Math.min(now, a.createdAt + 36e5) }); }));
    for (let n = 0; n < 9; n++) uids.forEach((u, k) => { if ((n + k) % 3 !== 2) events.push({ id: `o${n}_${k}`, kind: 'open', uid: u, at: now - n * 864e5 - k * 9e5 }); });
    ['a1', 'a2', 'a3'].forEach((a, i) => uids.slice(0, 5).forEach((u, k) => events.push({ id: `n${i}_${k}`, kind: 'notif_shown', act: a, uid: u, at: now - 7e7 + i * 1e6 })));
    events.push({ id: 'nj1', kind: 'notif_join', act: 'a1', uid: 'u_tom', at: now - 6e7 }, { id: 'nj2', kind: 'notif_join', act: 'a3', uid: 'u_lien', at: now - 5e7 });
    return { users, acts, joins, views, events, cfg: { goal: 40, stepGoal: 50000, reward: 'Het bedrijf trakteert iedereen op een ontbijt' } };
  };
  let data; try { data = JSON.parse(ls.get(KEY) || 'null'); } catch (e) { data = null; }
  if (!data || !data.users) data = seed();
  const persist = () => ls.set(KEY, JSON.stringify(data));
  const push = () => { S.users = { ...data.users }; S.acts = data.acts.slice(); S.joins = data.joins.slice(); S.views = data.views.slice(); S.events = data.events.slice(); S.cfg = data.cfg; S.loadedActs = true; persist(); refresh(); };
  return {
    start() { S.me = 'me'; push(); },
    async profile(p) { data.users.me = { ...data.users.me, ...p }; push(); },
    touch() {},
    async create(a) { const id = 'l' + Date.now(); data.acts.push({ ...a, id, by: 'me', createdAt: Date.now() }); data.joins.push({ id: `${id}__me`, act: id, uid: 'me', steps: null, at: Date.now() }); push(); return id; },
    async join(act) { if (!data.joins.find((x) => x.id === `${act}__me`)) data.joins.push({ id: `${act}__me`, act, uid: 'me', steps: null, at: Date.now() }); push(); },
    async leave(act) { data.joins = data.joins.filter((x) => x.id !== `${act}__me`); push(); },
    async remove(act) { data.acts = data.acts.filter((x) => x.id !== act); data.joins = data.joins.filter((x) => x.act !== act); push(); },
    async config(c) { data.cfg = { ...data.cfg, ...c }; push(); },
    async view(act) { if (!data.views.find((v) => v.id === `${act}__me`)) { data.views.push({ id: `${act}__me`, act, uid: 'me', at: Date.now() }); persist(); S.views = data.views.slice(); } },
    async track(kind, extra = {}) { data.events.push({ id: 'e' + Date.now() + rid(4), kind, uid: 'me', at: Date.now(), ...extra }); persist(); S.events = data.events.slice(); },
    async reset() { data = seed(); push(); },
    simulate() { // een collega plant iets: toont de melding zoals op een echt tweede toestel
      const ns = nextSlot(); const id = 'sim' + Date.now();
      const a = { id, type: 'wandelen', date: ns.date, time: ns.time === '12:15' ? '12:20' : ns.time, dur: 20, place: 'Inkom', note: 'Wie gaat er mee een frisse neus halen?', by: 'u_sarah', createdAt: Date.now() };
      data.acts.push(a); data.joins.push({ id: `${id}__u_sarah`, act: id, uid: 'u_sarah', steps: null, at: Date.now() }); push(); notify(a);
    },
  };
}

// ---------- gedeelde store (Firebase Firestore) ----------
// Elk bedrijf heeft een eigen map: companies/{bedrijf}/activities, joins, users, views, events, config.
// companies/{bedrijf}/auth/{firebase-uid} zegt dat dit toestel bij dat bedrijf hoort (nodig voor de databaseregels).
// De oude mappen bovenaan (activities, users, ...) blijven voor de oude link en worden hier niet gebruikt.
function sharedStore(F, db) {
  const { collection, doc, setDoc, getDocs, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, arrayUnion } = F;
  const authExtra = () => (S.authUid ? { authUids: arrayUnion(S.authUid) } : {});
  let t0 = Date.now(); let timer = null; let ck = null; let stops = [];
  const col = (n) => collection(db, 'companies', ck, n);
  const dref = (n, id) => doc(db, 'companies', ck, n, id);
  const fail = (e) => { console.error(e); if (e && e.code === 'permission-denied') S.denied = true; S.offline = true; refresh(); };
  const wrap = async (p) => { try { return await p; } catch (e) { console.error(e); toast(e && e.code === 'permission-denied' ? 'De database weigert dit. Vernieuw de pagina en probeer opnieuw.' : 'Dat lukte niet. Controleer je verbinding en probeer opnieuw.'); throw e; } };
  const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
  const markMember = (key, pid) => (S.authUid ? setDoc(doc(db, 'companies', key, 'auth', S.authUid), { at: Date.now(), ...(pid ? { pid } : {}) }, { merge: true }) : Promise.resolve());
  return {
    start() {
      // lijst met bedrijven: alleen de namen, voor de voorstellen bij het aanmelden
      onSnapshot(collection(db, 'companies'), (s) => { S.companies = s.docs.map((d) => ({ key: d.id, name: (d.data().name || d.id).trim() })); refresh(); }, (e) => console.error(e));
      if (S.ck) this.open(S.ck);
    },
    // luisteren naar de gegevens van één bedrijf
    open(key) {
      stops.forEach((f) => f()); stops = []; ck = key; t0 = Date.now();
      S.loadedActs = false; S.acts = []; S.joins = []; S.users = {}; S.views = []; S.events = []; S.cfg = null;
      clearTimeout(timer); timer = setTimeout(() => { if (!S.loadedActs) { S.offline = true; refresh(); } }, 10000);
      stops.push(onSnapshot(query(col('activities'), orderBy('date', 'desc'), limit(500)), (s) => {
        S.acts = rows(s);
        if (S.loadedActs) for (const ch of s.docChanges()) {
          if (ch.type !== 'added') continue;
          const a = { id: ch.doc.id, ...ch.doc.data() };
          if (a.by !== S.me && (a.createdAt || 0) > t0 - 60000 && !isPast(a)) notify(a);
        }
        S.loadedActs = true; S.offline = false; S.denied = false; clearTimeout(timer); refresh();
      }, fail));
      stops.push(onSnapshot(col('joins'), (s) => { S.joins = rows(s); refresh(); }, fail));
      stops.push(onSnapshot(col('users'), (s) => { const u = {}; s.docs.forEach((d) => { u[d.id] = d.data(); }); S.users = u; refresh(); }, fail));
      // "gezien" en gebeurtenissen kan alleen een beheerder lezen (zie adminStore)
      stops.push(onSnapshot(dref('config', 'main'), (d) => { S.cfg = d.exists() ? d.data() : null; refresh(); }, () => {}));
    },
    // wie er al bestaat bij een bedrijf (voor "Ben jij dit?")
    async members(key) {
      await wrap(markMember(key));
      const s = await wrap(getDocs(collection(db, 'companies', key, 'users')));
      const u = {}; s.docs.forEach((d) => { u[d.id] = d.data(); }); return u;
    },
    // nieuw profiel maken, of een bestaand profiel overnemen op dit toestel
    async signup(p, pid, id, key, isNewCompany) {
      if (isNewCompany) { try { await setDoc(doc(db, 'companies', key), { name: p.company, createdAt: Date.now() }); } catch (e) { console.warn('bedrijf bestond al', e && e.code); } }
      await wrap(markMember(key, id)); // eerst het kaartje: de regels laten je alleen je eigen profiel schrijven
      const ref = doc(db, 'companies', key, 'users', id);
      await wrap(pid ? setDoc(ref, { ...p, lastSeen: Date.now(), ...authExtra() }, { merge: true }) : setDoc(ref, { ...p, joinedAt: Date.now(), lastSeen: Date.now(), ...authExtra() }));
    },
    async touch() { if (!ck) return; try { await markMember(ck, S.me); await setDoc(dref('users', S.me), { lastSeen: Date.now(), ...authExtra() }, { merge: true }); } catch (e) {} },
    async profile(p) { await wrap(setDoc(dref('users', S.me), p, { merge: true })); },
    async create(a) {
      const ref = doc(col('activities')); const data = { ...a, by: S.me, createdAt: Date.now() };
      await wrap(setDoc(ref, data));
      if (!S.acts.some((x) => x.id === ref.id)) S.acts = [...S.acts, { id: ref.id, ...data }];
      const jid = `${ref.id}__${S.me}`;
      try { await wrap(setDoc(dref('joins', jid), { act: ref.id, uid: S.me, steps: null, at: Date.now() })); if (!S.joins.some((x) => x.id === jid)) S.joins = [...S.joins, { id: jid, act: ref.id, uid: S.me, steps: null }]; } catch (e) {}
      return ref.id;
    },
    async join(act) { await wrap(setDoc(dref('joins', `${act}__${S.me}`), { act, uid: S.me, steps: null, at: Date.now() })); },
    async leave(act) { await wrap(deleteDoc(dref('joins', `${act}__${S.me}`))); },
    async remove(act) {
      // eerst de deelnames, dan de activiteit (de regels kijken naar de activiteit om te zien wie dat mag)
      for (const j of S.joins.filter((x) => x.act === act)) { try { await deleteDoc(dref('joins', j.id)); } catch (e) {} }
      await wrap(deleteDoc(dref('activities', act)));
    },
    // meldingsadres van dit toestel bewaren (de Cloudflare Worker leest het als robot-beheerder)
    async savePush(j) {
      if (!ck || !S.me || !j || !j.endpoint || !j.keys) return;
      const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(j.endpoint)));
      const id = 'p_' + Array.from(h.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
      await setDoc(dref('push', id), { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, pid: S.me, at: Date.now(), ios: isIOS() });
    },
    async view(act) { if (!ck) return; try { await setDoc(dref('views', `${act}__${S.me}`), { act, uid: S.me, at: Date.now() }); } catch (e) {} },
    async track(kind, extra = {}) { if (!ck) return; try { await addDoc(col('events'), { kind, uid: S.me, at: Date.now(), ...extra }); } catch (e) {} },
  };
}

// ---------- beheerders (managementdashboard) ----------
// Elke beheerderscode is het wachtwoord van een e-mail/wachtwoord-account in Firebase Authentication.
// Het e-mailadres zit verborgen in de app: beheer-<bedrijf>@… voor een bedrijf, team@… voor de hoofdcode.
// Of een account echt beheerder is, staat in admins/{uid} (alleen aan te passen in de Firebase-console).
// De beheerder gebruikt een aparte Firebase-sessie, zodat de gewone aanmelding op dit toestel blijft bestaan.
const ADMIN_DOMAIN = '@wandelbuddy-9c08c.firebaseapp.com';
function adminStore(A, F, Au, cfg) {
  const app = A.initializeApp(cfg, 'beheer'); const auth = Au.getAuth(app); const db = F.getFirestore(app);
  let stops = [];
  const rows = (s) => s.docs.map((d) => ({ id: d.id, ...d.data() }));
  const check = async () => {
    const u = auth.currentUser; if (!u || u.isAnonymous) throw new Error('geen beheerder');
    const d = await F.getDoc(F.doc(db, 'admins', u.uid)); if (!d.exists()) throw new Error('geen beheerder');
    return { uid: u.uid, company: String(d.data().company || '') };
  };
  return {
    async restore() { try { await auth.authStateReady(); return auth.currentUser ? await check() : null; } catch (e) { return null; } },
    async login(code, ck) {
      const emails = [ck ? `beheer-${ck}${ADMIN_DOMAIN}` : null, `team${ADMIN_DOMAIN}`].filter(Boolean);
      for (const email of emails) {
        try {
          await Au.signInWithEmailAndPassword(auth, email, code);
          const a = await check(); if (a.company === '*' || a.company === ck) return a;
          await Au.signOut(auth);
        } catch (e) { if (e && (e.code === 'auth/too-many-requests' || e.code === 'auth/network-request-failed')) throw e; }
      }
      const err = new Error('code'); err.code = 'wb/wrong-code'; throw err;
    },
    async logout() { this.close(); S.adm = null; try { await Au.signOut(auth); } catch (e) {} },
    close() { stops.forEach((f) => f()); stops = []; },
    // alle gegevens van één bedrijf voor het dashboard
    open(key) {
      this.close(); S.adm = { key, acts: [], joins: [], users: {}, views: [], events: [], cfg: null, loaded: false, denied: false };
      const col = (n) => F.collection(db, 'companies', key, n);
      const mine = () => S.adm && S.adm.key === key;
      const err = (e) => { console.error(e); if (mine()) { S.adm.denied = true; refresh(); } };
      const set = (k, v) => { if (!mine()) return; S.adm[k] = v; S.adm.loaded = true; refresh(); };
      stops.push(F.onSnapshot(F.query(col('activities'), F.orderBy('date', 'desc'), F.limit(1000)), (s) => set('acts', rows(s)), err));
      stops.push(F.onSnapshot(col('joins'), (s) => set('joins', rows(s)), err));
      stops.push(F.onSnapshot(col('users'), (s) => { const u = {}; s.docs.forEach((d) => { u[d.id] = d.data(); }); set('users', u); }, err));
      stops.push(F.onSnapshot(col('views'), (s) => set('views', rows(s)), err));
      stops.push(F.onSnapshot(F.query(col('events'), F.orderBy('at', 'desc'), F.limit(5000)), (s) => set('events', rows(s)), err));
      stops.push(F.onSnapshot(F.doc(db, 'companies', key, 'config', 'main'), (d) => set('cfg', d.exists() ? d.data() : null), err));
    },
    async companies() { const s = await F.getDocs(F.collection(db, 'companies')); return s.docs.map((d) => ({ key: d.id, name: (d.data().name || d.id).trim() })).sort((a, b) => a.name.localeCompare(b.name, 'nl')); },
    async config(c) { await F.setDoc(F.doc(db, 'companies', S.adm.key, 'config', 'main'), c, { merge: true }); },
    raw: { db, F }, // voor het opruimen van testgegevens met de hoofdcode
  };
}
let admStore = null;
async function openAdmin(a) {
  S.admin = a;
  const key = a.company === '*' ? (S.admKey || S.ck) : a.company;
  if (a.company === '*') { try { S.admCompanies = await admStore.companies(); } catch (e) { S.admCompanies = []; } }
  const pick = key || (S.admCompanies && S.admCompanies[0] && S.admCompanies[0].key);
  if (pick) { S.admKey = pick; admStore.open(pick); }
  render();
}

// ---------- afgeleide cijfers ----------
const actById = (id) => S.acts.find((a) => a.id === id);
const goingOf = (id) => S.joins.filter((j) => j.act === id && actById(id));
const iJoined = (id) => S.joins.some((j) => j.act === id && j.uid === S.me);
const nameOf = (u) => (u === S.me ? 'Jij' : (S.users[u] && S.users[u].name) || 'Collega');
const realName = (u) => (S.users[u] && S.users[u].name) || (u === S.me ? 'Jij' : 'Collega');
function mine() {
  const myJoins = S.joins.filter((j) => j.uid === S.me && actById(j.act));
  const done = myJoins.filter((j) => isPast(actById(j.act)));
  const mk = monthKey(todayStr());
  const mates = new Set();
  for (const j of done) for (const o of S.joins) if (o.act === j.act && o.uid !== S.me) mates.add(o.uid);
  return {
    done, mates,
    stepsAll: done.reduce((s, j) => s + stepsOf(j), 0),
    stepsMonth: done.filter((j) => monthKey(actById(j.act).date) === mk).reduce((s, j) => s + stepsOf(j), 0),
    monthCount: done.filter((j) => monthKey(actById(j.act).date) === mk).length,
    weeks: new Set(done.map((j) => weekKey(actById(j.act).date))).size,
    types: new Set(done.map((j) => actById(j.act).type)).size,
    led: S.acts.filter((a) => a.by === S.me).length,
  };
}
function together() {
  const mk = monthKey(todayStr());
  const js = S.joins.filter((j) => { const a = actById(j.act); return a && isPast(a) && monthKey(a.date) === mk; });
  return { moments: js.length, steps: js.reduce((s, j) => s + stepsOf(j), 0), people: new Set(js.map((j) => j.uid)).size };
}

// ---------- meldingen ----------
function notify(a) {
  if (S.notifQ.some((q) => q.id === a.id && q.kind === 'new')) return;
  S.notifQ.push({ id: a.id, kind: 'new' }); showPop(); chime();
  try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
  if (document.hidden) {
    document.title = '🔔 Nieuwe activiteit · ' + BASE_TITLE;
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(`${realName(a.by)} gaat ${(TYPES[a.type] || TYPES.wandelen).label.toLowerCase()}`, { body: `${dayLabel(a.date)} om ${hhmm(a.time)} · ${a.place}`, tag: a.id }); } catch (e) {}
  }
  store.track('notif_shown', { act: a.id });
}
function showPop() {
  const w = $('#pop'); const q = S.notifQ[0]; const a = q && actById(q.id);
  if (!a || (q.kind === 'remind' && isPast(a))) { if (q) { S.notifQ.shift(); return showPop(); } w.hidden = true; w.innerHTML = ''; return; }
  const t = TYPES[a.type] || TYPES.wandelen; const g = goingOf(a.id); const more = S.notifQ.length - 1;
  if (q.kind === 'remind') {
    const mins = Math.max(1, Math.ceil(toMin(a.time) - (new Date().getHours() * 60 + new Date().getMinutes())));
    w.innerHTML = `<div class="pop" role="alertdialog" aria-labelledby="poptitle">
      <div class="bell">⏰ Herinnering${more > 0 ? ` · nog ${more}` : ''}</div>
      <div class="ptop"><div class="ticon" style="background:var(--t-${a.type})">${ICON[a.type] || ICON.wandelen}</div>
        <div><b id="poptitle" style="font-size:17px">Over ${mins} ${mins === 1 ? 'minuut' : 'minuten'}: ${esc(t.label.toLowerCase())}</b>
        <div class="muted small">Om ${hhmm(a.time)} · vertrek aan ${esc(a.place)} · terug om ${fromMin(toMin(a.time) + a.dur)}</div></div></div>
      <div class="cgoing">${avatars(g.map((j) => j.uid))}${g.length === 1 ? 'Jij gaat' : g.length + ' mensen gaan mee'}</div>
      <div class="pbtns"><button class="primary" type="button" data-pop="open" style="grid-column:auto">Bekijk</button><button class="secondary" type="button" data-pop="cancel" style="color:#B3402A">Ik kan toch niet</button></div></div>`;
    w.hidden = false; return;
  }
  w.innerHTML = `<div class="pop" role="alertdialog" aria-labelledby="poptitle">
    <div class="bell">🔔 Nieuwe activiteit${more > 0 ? ` · nog ${more}` : ''}</div>
    <div class="ptop"><div class="ticon" style="background:var(--t-${a.type})">${ICON[a.type] || ICON.wandelen}</div>
      <div><b id="poptitle" style="font-size:17px">${esc(realName(a.by))} gaat ${esc(t.label.toLowerCase())}</b>
      <div class="muted small">${esc(dayLabel(a.date))} om ${hhmm(a.time)} · ${a.dur} min · vertrek: ${esc(a.place)}</div></div></div>
    ${a.note ? `<p class="small">${esc(a.note)}</p>` : ''}
    <div class="cgoing">${avatars(g.map((j) => j.uid))}${g.length === 1 ? '1 doet mee' : g.length + ' doen mee'}</div>
    <div class="pbtns"><button class="primary" type="button" data-pop="join">Ik ga mee</button>
      <button class="secondary" type="button" data-pop="open">Bekijk</button><button class="secondary" type="button" data-pop="later">Later</button></div></div>`;
  w.hidden = false;
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { document.title = BASE_TITLE; if (S.mode === 'shared' && S.me && Date.now() - (S.lastOpen || 0) > 30 * 60000) trackOpen(); refresh(); }
});
function trackOpen() { if (!S.me) return; S.lastOpen = Date.now(); store.track('open'); store.touch(); }

// ---------- web-app op het beginscherm ----------
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /Android/i.test(navigator.userAgent);
let installEvt = null; // Android/Chrome: hiermee kan de app zelf de installeervraag tonen
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (S.mode !== 'loading') refresh(); });
window.addEventListener('appinstalled', () => { installEvt = null; ls.set('wb-install-hidden', '1'); toast('Wandelbuddy staat nu op je beginscherm.'); if (S.mode !== 'loading') refresh(); });
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch((e) => console.warn('service worker', e));
const SHARE_ICON = '<svg class="inl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11v9h12v-9"/></svg>';
function installHtml(withLater) {
  if (isStandalone()) return '';
  const os = S.installOs || (isAndroid() ? 'android' : 'ios');
  const ios = `<ol class="steps"><li>Open deze pagina in <b>Safari</b>.</li><li>Tik onderaan op de knop <b>Deel</b> ${SHARE_ICON} (vierkantje met een pijl omhoog).</li><li>Scrol naar beneden en tik op <b>Zet op beginscherm</b>.</li><li>Tik rechtsboven op <b>Voeg toe</b>.</li></ol>`;
  const android = (installEvt ? '<button class="primary" type="button" data-act="install">Installeer Wandelbuddy</button><p class="small muted">Lukt dat niet? Doe het dan zo:</p>' : '')
    + '<ol class="steps"><li>Open deze pagina in <b>Chrome</b>.</li><li>Tik rechtsboven op de drie puntjes <b>⋮</b>.</li><li>Tik op <b>App installeren</b> of <b>Toevoegen aan startscherm</b>.</li><li>Bevestig met <b>Installeren</b>.</li></ol>';
  return `<div class="box install">
    <div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>Zet Wandelbuddy op je beginscherm</b>${withLater ? '<button class="linkbtn" type="button" data-act="install-hide">Later</button>' : ''}</div>
    <p class="small muted">Dan open je de app met één tik, zonder adresbalk, net als een gewone app.</p>
    <div class="chips" role="group" aria-label="Toestel"><button type="button" class="chip" data-installos="ios" aria-pressed="${os === 'ios'}">iPhone</button><button type="button" class="chip" data-installos="android" aria-pressed="${os === 'android'}">Android</button></div>
    ${os === 'ios' ? ios : android}
  </div>`;
}

// ---------- pushmeldingen (ook als de app dicht is) ----------
// iPhone: alleen vanaf iOS 16.4 en alleen als de app op het beginscherm staat.
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const pushPossible = () => S.mode === 'shared' && !!S.me && !!pushConfig.vapidPublicKey && pushSupported() && !(isIOS() && !isStandalone());
const keyBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
async function pushSubscribe(ask) {
  if (!pushPossible()) return false;
  if (ask) { if ((await Notification.requestPermission()) !== 'granted') return false; }
  else if (Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(pushConfig.vapidPublicKey) });
  await store.savePush(sub.toJSON());
  return true;
}
const PUSH_WHAT = 'Je krijgt een melding als een collega iets plant, en 10 minuten voor een activiteit waaraan je meedoet. Ook als de app dicht is.';
function pushCard() {
  return `<div class="box install">
    <div class="row" style="justify-content:space-between;flex-wrap:nowrap"><b>Zet meldingen aan</b><button class="linkbtn" type="button" data-act="push-hide">Later</button></div>
    <p class="small muted">${PUSH_WHAT}</p>
    <button class="primary" type="button" data-act="pushon">Zet meldingen aan</button></div>`;
}
function pushSettingsHtml() {
  if (S.mode !== 'shared' || !pushConfig.vapidPublicKey) return '';
  if (isIOS() && !isStandalone()) return '<p class="note">Meldingen op je iPhone: zet Wandelbuddy eerst op je beginscherm (vanaf iOS 16.4), open de app van daaruit en zet ze dan hier aan.</p>';
  if (!pushSupported()) return '<p class="note">Deze browser kan geen meldingen tonen als de app dicht is. In de app zelf krijg je ze wel.</p>';
  if (Notification.permission === 'denied') return '<p class="note">Meldingen zijn geblokkeerd voor Wandelbuddy. Zet ze aan in de instellingen van je toestel.</p>';
  if (S.pushOn) return '<div class="status ok">✓ Meldingen staan aan op dit toestel</div>';
  return `<button class="secondary" type="button" data-act="pushon">Zet meldingen aan</button><p class="note" style="margin-top:-8px">${PUSH_WHAT}</p>`;
}

// ---------- profielfoto ----------
// Alleen een kleine JPEG als data-URL wordt getoond (andere tekst in de database wordt genegeerd).
const photoOf = (u, src) => { const p = ((src || S.users)[u] || {}).photo; return typeof p === 'string' && p.length < 150000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) ? p : null; };
const face = (u, name, src) => { const p = photoOf(u, src); return p ? `<img src="${p}" alt="">` : esc(initials(name)); };
async function handlePhoto(file) {
  if (!file || !S.me) return;
  toast('Foto verwerken…');
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(w, h);
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 128, 128);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 128, 128); // vierkant uit het midden
    URL.revokeObjectURL(url);
    let data = c.toDataURL('image/jpeg', 0.82);
    if (data.length > 60000) data = c.toDataURL('image/jpeg', 0.6);
    S.users[S.me] = { ...(S.users[S.me] || {}), photo: data }; render();
    await store.profile({ photo: data }); toast('Foto opgeslagen.');
  } catch (e) { console.error(e); toast('Deze foto lukt niet. Probeer een andere foto.'); }
}

// ---------- schermen ----------
function avatars(uids) {
  return `<span class="avs">${uids.slice(0, 4).map((u) => `<span style="background:${colorFor(u)}">${face(u, nameOf(u))}</span>`).join('')}</span>`;
}
function card(a) {
  const g = goingOf(a.id); const t = TYPES[a.type] || TYPES.wandelen; const joined = iJoined(a.id); const past = isPast(a);
  const max = a.max || t.max; const full = max && g.length >= max && !joined;
  const count = max ? `${g.length}/${max} spelers` : g.length === 1 ? '1 doet mee' : `${g.length} doen mee`;
  let btn = '';
  if (!past) btn = joined ? '<span class="pill in">Je doet mee</span>' : full ? '<span class="pill full">Volzet</span>' : `<button class="pill join" type="button" data-join="${a.id}">Doe mee</button>`;
  return `<div class="card ${past ? 'past' : ''} ${a.by === S.me ? 'mine' : ''} ${a.id === S.justAdded ? 'new' : ''}" role="button" tabindex="0" data-open="${a.id}">
    <div class="ticon" style="background:var(--t-${a.type})">${ICON[a.type] || ICON.wandelen}</div>
    <div class="cmeta"><span class="ctitle">${hhmm(a.time)} · ${t.label} · ${a.dur} min</span>
      <span class="csub">${esc(a.place)} · door ${esc(nameOf(a.by))}</span>
      <span class="cgoing">${avatars(g.map((j) => j.uid))}${count}</span></div>
    <div>${btn}</div></div>`;
}
function banner() {
  if (S.denied) return `<div class="banner"><b>Database geeft geen toegang</b>Vernieuw de pagina. Lukt het dan nog niet, laat het weten aan het Wandelbuddy-team.</div>`;
  if (S.offline) return `<div class="banner"><b>Geen verbinding</b>De activiteiten zijn nog niet geladen. Wat je ziet, is misschien niet actueel.</div>`;
  return '';
}
// ---------- aanmelden ----------
function suggHtml() {
  const typed = (S.signup && S.signup.company) || ''; const q = norm(typed);
  if (!q) return '';
  const list = companies().filter((c) => c.key.includes(q)).slice(0, 6);
  if (!list.length || (list.length === 1 && list[0].key === q && list[0].name === typed.trim())) return '';
  return `<span class="sugg-h">Bestaande bedrijven</span>` + list.map((c) => `<button type="button" class="sugg-i" data-comp="${esc(c.name)}">${esc(c.name)}</button>`).join('');
}
function vWelcome() {
  if (S.claim) {
    const pid = S.claim.pid; const u = (S.pendingMembers || {})[pid] || {};
    const since = u.joinedAt ? 'aangemeld sinds ' + new Date(u.joinedAt).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' }) : '';
    const info = [esc(u.company || ''), since].filter(Boolean).join(' · ');
    return `<div class="welcome">
      <div class="logo">${ICON.wandelen}</div>
      <div><h1>Ben jij dit?</h1><p class="muted" style="margin-top:6px">Er bestaat al een profiel met deze naam bij dit bedrijf.</p></div>
      <div class="me-row"><div class="av" style="background:${colorFor(pid)}">${face(pid, u.name, S.pendingMembers)}</div>
        <div class="grow"><b>${esc(u.name || '')}</b><small class="muted" style="display:block">${info}</small></div></div>
      <button class="primary" type="button" data-act="claim-yes">Ja, dat ben ik</button>
      <button class="secondary" type="button" data-act="claim-no">Nee, ik ben iemand anders</button>
      <button class="back" type="button" data-act="claim-back" style="align-self:center">‹ Terug</button>
    </div>`;
  }
  const f = S.signup || (S.signup = { first: '', last: '', company: '' });
  return `<div class="welcome">
    <div class="logo">${ICON.wandelen}</div>
    <div><h1>Welkom bij Wandelbuddy</h1>
      <p class="muted" style="margin-top:6px">Plan een middagwandeling of zie wie er vandaag gaat, en doe met één tik mee. Vul je naam en je bedrijf in, een wachtwoord is niet nodig.</p></div>
    <label class="field"><span>Voornaam</span><input class="text" id="wfirst" type="text" maxlength="30" autocomplete="given-name" autocapitalize="words" placeholder="bv. Sarah" value="${esc(f.first)}"></label>
    <label class="field"><span>Achternaam</span><input class="text" id="wlast" type="text" maxlength="40" autocomplete="family-name" autocapitalize="words" placeholder="bv. Peeters" value="${esc(f.last)}"></label>
    <div class="field"><span id="wcomp-l">Bedrijf</span>
      <input class="text" id="wcomp" aria-labelledby="wcomp-l" type="text" maxlength="60" autocomplete="off" autocapitalize="words" placeholder="bv. UHasselt" value="${esc(f.company)}">
      <div class="sugg" id="sugg">${suggHtml()}</div></div>
    <button class="primary" type="button" data-act="welcome">Start</button>
    <p class="note">Je blijft aangemeld op dit toestel. Je collega's zien je naam bij de activiteiten waaraan je meedoet.</p>
  </div>`;
}
const cleanTxt = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
async function submitSignup() {
  const f = S.signup || {};
  const first = cleanTxt(f.first, 30), last = cleanTxt(f.last, 40), compIn = cleanTxt(f.company, 60);
  if (!first) { toast('Vul je voornaam in.'); $('#wfirst')?.focus(); return; }
  if (!last) { toast('Vul je achternaam in.'); $('#wlast')?.focus(); return; }
  if (!norm(compIn)) { toast('Vul je bedrijf in.'); $('#wcomp')?.focus(); return; }
  const companyKey = norm(compIn); const known = companies().find((c) => c.key === companyKey);
  const nameKey = norm(first + last);
  let members; try { members = await store.members(companyKey); } catch (e) { return; }
  S.pendingMembers = members; S.pendingNewCompany = !known;
  S.pendingProfile = { name: `${first} ${last}`, first, last, company: known ? known.name : compIn, nameKey, companyKey };
  const match = Object.entries(members).filter(([, u]) => userNameKey(u) === nameKey)
    .sort((a, b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0))[0];
  if (match) { S.claim = { pid: match[0] }; render(); window.scrollTo(0, 0); return; }
  await finishSignup(null);
}
async function finishSignup(pid) {
  const p = S.pendingProfile; if (!p) return;
  const old = pid ? (S.pendingMembers || {})[pid] || {} : null;
  // bij een bestaand profiel blijft de oorspronkelijke schrijfwijze van naam en bedrijf bewaard
  const data = pid ? { nameKey: p.nameKey, companyKey: p.companyKey, ...(old.first ? {} : { first: p.first, last: p.last }), ...(old.company ? {} : { company: p.company }), ...(old.name ? {} : { name: p.name }) } : p;
  // meteen binnenlaten; het bewaren gebeurt op de achtergrond
  const id = pid || 'u_' + rid(); const key = p.companyKey;
  const saving = store.signup(data, pid, id, key, S.pendingNewCompany);
  ls.set('wb-pid', id); ls.set('wb-ck', key); S.me = id; S.ck = key;
  store.open(key); S.users[id] = { ...(old || {}), ...data, ...(pid ? {} : { joinedAt: Date.now() }) };
  S.claim = null; S.signup = null; S.pendingProfile = null; S.pendingMembers = null;
  render(); window.scrollTo(0, 0);
  toast(pid ? `Welkom terug, ${p.first}!` : `Welkom, ${p.first}!`);
  try { await saving; trackOpen(); }
  catch (e) { try { localStorage.removeItem('wb-pid'); localStorage.removeItem('wb-ck'); } catch (x) {} S.me = null; S.ck = null; S.signup = { first: p.first, last: p.last, company: p.company }; render(); }
}
function vAgenda() {
  const t = todayStr();
  const all = S.acts.filter((a) => a.date >= t && !isPast(a));
  const upcoming = (S.filter === 'mine' ? all.filter((a) => iJoined(a.id)) : all).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
  const days = [...new Set(upcoming.map((a) => a.date))];
  const first = (realName(S.me) || '').split(' ')[0];
  let html = `<div><div class="eyebrow">${esc(dayLabel(t))}${S.mode === 'shared' && first ? ' · Hoi ' + esc(first) : ''}</div><h1>Samen bewegen over de middag</h1></div>`;
  html += banner();
  const loading = S.mode === 'shared' && !S.loadedActs && !S.offline;
  if (loading) html += '<p class="loading">Activiteiten laden…</p>';
  if (!loading && !ls.get('wb-install-hidden')) html += installHtml(true);
  else if (!loading && pushPossible() && Notification.permission === 'default' && !S.pushOn && !ls.get('wb-push-hidden')) html += pushCard();
  if (all.length && !loading) html += `<div class="chips" role="group" aria-label="Filter"><button type="button" class="chip" data-filter="all" aria-pressed="${S.filter !== 'mine'}">Alles · ${all.length}</button><button type="button" class="chip" data-filter="mine" aria-pressed="${S.filter === 'mine'}">Mijn activiteiten · ${all.filter((a) => iJoined(a.id)).length}</button></div>`;
  if (!days.length && !loading && S.filter === 'mine' && all.length) {
    html += `<div class="empty"><b>Nog geen activiteiten voor jou</b><p class="muted small">Bekijk alle activiteiten en tik op Doe mee bij iets dat je past.</p><button class="secondary" type="button" data-filter="all" style="width:auto;padding:10px 16px">Toon alles</button></div>`;
  } else if (!days.length && !loading) {
    html += `<div class="empty"><b>Nog niets gepland</b><p class="muted small">Plan de eerste wandeling of padelmatch. Je collega's zien het meteen en kunnen met één tik meedoen.</p>
      <button class="primary" type="button" data-act="new" style="width:auto;padding:12px 18px">Plan een activiteit</button></div>`;
  }
  for (const d of days) html += `<section class="day"><h2>${esc(dayLabel(d))}</h2>${upcoming.filter((a) => a.date === d).map(card).join('')}</section>`;
  return html;
}
function vDetail() {
  const a = actById(S.detail);
  if (!a) { if (S.mode === 'shared' && !S.loadedActs) return '<p class="loading">Activiteit laden…</p>'; S.detail = null; return vAgenda(); }
  const t = TYPES[a.type] || TYPES.wandelen; const g = goingOf(a.id); const joined = iJoined(a.id); const past = isPast(a); const isMine = a.by === S.me;
  const max = a.max || t.max; const full = max && g.length >= max && !joined;
  const ppl = g.map((j) => `<div class="person"><div class="av" style="background:${colorFor(j.uid)}">${face(j.uid, nameOf(j.uid))}</div><div><b>${esc(nameOf(j.uid))}</b><small>${j.uid === a.by ? 'organiseert' : 'doet mee'}${past && stepsOf(j) ? ' · ' + fmtN(stepsOf(j)) + ' stappen' : ''}</small></div></div>`).join('');
  let actions = '';
  if (!past) {
    if (isMine) actions = `<button class="secondary" type="button" data-act="share">Kopieer uitnodiging</button>`;
    else if (joined) actions = `<button class="secondary" type="button" data-act="share">Kopieer uitnodiging</button><button class="danger" type="button" data-act="leave">Toch niet meedoen</button>`;
    else if (full) actions = '<p class="muted">Deze activiteit is volzet.</p>';
    else actions = `<button class="primary" type="button" data-act="join">Doe mee</button>`;
  }
  let steps = '';
  if (past && joined) {
    const mineJ = S.joins.find((j) => j.act === a.id && j.uid === S.me); const n = stepsOf(mineJ);
    steps = n ? `<div class="box"><b>Je zette ${fmtN(n)} stappen</b><p class="muted small">${AUTO_NOTE}. Ze tellen mee voor de longen en het teamdoel.</p></div>`
      : `<div class="box"><b>${a.dur} beweegminuten</b><p class="muted small">${t.label} telt in beweegminuten in plaats van stappen.</p></div>`;
  }
  const del = isMine ? `<button class="danger" type="button" data-act="del">${S.confirmDel ? 'Tik nog eens om te verwijderen' : 'Activiteit verwijderen'}</button>` : '';
  return `<button class="back" type="button" data-act="home">‹ Terug</button>
    <div class="hero"><div class="ticon" style="background:var(--t-${a.type})">${ICON[a.type] || ICON.wandelen}</div>
      <div><div class="eyebrow">${esc(dayLabel(a.date))} · ${t.label}</div><div class="bigtime">${hhmm(a.time)}</div></div></div>
    ${a.note ? `<p>${esc(a.note)}</p>` : ''}
    <div class="facts">
      <div class="fact"><small>Waar</small><b>${esc(a.place)}</b></div>
      <div class="fact"><small>Duur</small><b>${a.dur} min</b></div>
      <div class="fact"><small>Terug om</small><b>${fromMin(toMin(a.time) + a.dur)}</b></div>
      <div class="fact"><small>${max ? 'Spelers' : 'Doen mee'}</small><b>${g.length}${max ? ' / ' + max : ''}</b></div>
    </div>
    ${steps}
    <h2>Wie doet er mee</h2><div class="people">${ppl || '<p class="muted small">Nog niemand.</p>'}</div>
    ${actions}${del}`;
}
function draftDays() { const out = []; for (let n = 0; out.length < 5 && n < 14; n++) { const x = addDays(new Date(), n); const w = x.getDay(); if (w !== 0 && w !== 6) out.push(ymd(x)); } return out; }
function vCreate() {
  const d = S.draft; const t = TYPES[d.type];
  const days = draftDays();
  if (!days.includes(d.date)) d.date = days[0];
  const chip = (key, val, label, extra = '') => `<button type="button" class="chip" data-set="${key}" data-val="${esc(val)}" aria-pressed="${String(d[key]) === String(val)}">${extra}${label}</button>`;
  return `<button class="back" type="button" data-act="home">‹ Annuleren</button>
    <div><h1>Nieuwe activiteit</h1><p class="muted">Kies iets kleins. Een kwartier wandelen is al genoeg.</p></div>
    <div class="field"><span>Wat</span><div class="chips">${Object.entries(TYPES).map(([k, v]) => chip('type', k, v.label, ICON[k])).join('')}</div></div>
    <div class="field"><span>Wanneer</span><div class="chips">${days.map((s) => chip('date', s, esc(shortDay(s)))).join('')}</div></div>
    <div class="field"><span>Hoe laat</span><div class="chips">${TIMES.map((x) => chip('time', x, hhmm(x))).join('')}
      <label class="chip othertime${TIMES.includes(d.time) ? '' : ' on'}">Ander uur <input type="time" id="ctime" value="${TIMES.includes(d.time) ? '' : d.time}" min="06:00" max="22:00" aria-label="Ander uur"></label></div></div>
    <div class="field"><span>Hoe lang</span><div class="chips">${t.durs.map((x) => chip('dur', x, x + ' min')).join('')}</div></div>
    <div class="field"><span>Vertrekpunt</span><div class="chips">${PLACES.map((x) => chip('place', x, x)).join('')}</div>
      <input class="text" id="cplace" type="text" maxlength="60" placeholder="Of typ een andere plek" value="${PLACES.includes(d.place) ? '' : esc(d.place)}" autocomplete="off"></div>
    <div class="field"><span>Extra info (optioneel)</span><input class="text" id="cnote" type="text" maxlength="100" placeholder="${d.type === 'padel' ? 'bv. terrein 2, ik breng ballen mee' : 'bv. rustig tempo, iedereen welkom'}" value="${esc(d.note)}" autocomplete="off"></div>
    ${t.max ? `<p class="muted small">${t.label}: maximaal ${t.max} spelers, jij inbegrepen.</p>` : ''}
    <p class="muted small">Terug om ${fromMin(toMin(d.time) + d.dur)}. Iedereen die de app open heeft, krijgt meteen een melding.</p>
    <button class="primary" type="button" data-act="post">Plaatsen</button>`;
}
function lungsSvg(p) {
  const bottom = 166, h = (bottom - 34) * p / 100;
  const L = 'M90 52 C72 38 40 52 28 88 C17 120 22 152 42 160 C60 167 84 160 91 146 C95 120 95 78 90 52 Z';
  const R = 'M110 52 C128 38 160 52 172 88 C183 120 178 152 158 160 C140 167 116 160 109 146 C105 120 105 78 110 52 Z';
  return `<svg viewBox="0 0 200 172" aria-hidden="true"><defs>
      <clipPath id="lungclip"><path d="${L}"/><path d="${R}"/></clipPath>
      <linearGradient id="lunggrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--orange)"/><stop offset="1" style="stop-color:var(--t-stretch)"/></linearGradient></defs>
    <g class="breathe">
      <path d="M100 6 V62 M100 62 Q92 72 80 80 M100 62 Q108 72 120 80" style="fill:none;stroke:var(--muted)" stroke-width="7" stroke-linecap="round"/>
      <g clip-path="url(#lungclip)"><rect x="0" y="0" width="200" height="172" style="fill:var(--green-soft)"/>
        <rect class="lfill" x="0" y="${bottom - h}" width="200" height="${h}" fill="url(#lunggrad)"/></g>
      <path d="${L}" style="fill:none;stroke:var(--green)" stroke-width="3"/><path d="${R}" style="fill:none;stroke:var(--green)" stroke-width="3"/>
      <path d="M70 92 Q60 110 62 132 M130 92 Q140 110 138 132" style="fill:none;stroke:var(--surface)" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
    </g></svg>`;
}
function vLungs(tg, m) {
  const goal = Math.max(1000, Number(S.cfg?.stepGoal) || 50000);
  const p = Math.min(100, pct(tg.steps, goal)); const left = Math.max(0, goal - tg.steps);
  const msg = p >= 100 ? 'Volle longen! Het stappendoel is gehaald.' : p >= 75 ? `Bijna vol: nog ${fmtN(left)} stappen.` : p >= 50 ? `Over de helft. Nog ${fmtN(left)} stappen.` : p >= 25 ? `Goed op weg. Nog ${fmtN(left)} stappen.` : `Elke wandeling vult de longen. Nog ${fmtN(left)} stappen.`;
  const myPct = pct(m.stepsMonth, tg.steps);
  return `<div class="lungs" role="img" aria-label="Longen ${p}% gevuld: ${fmtN(tg.steps)} van ${fmtN(goal)} stappen">
    ${lungsSvg(p)}
    <div class="lmeta"><div class="eyebrow">Stappendoel van het team</div>
      <div><span class="pct">${p}%</span> <span class="muted small">gevuld</span></div>
      <p class="small muted">${fmtN(tg.steps)} / ${fmtN(goal)} stappen · ${AUTO_NOTE.toLowerCase()}</p>
      <p class="lnext">${msg}</p>
      <p class="small muted">Jouw bijdrage: ${fmtN(m.stepsMonth)} stappen${myPct ? ` (${myPct}%)` : ''}</p>
      <div class="mine-bar" aria-hidden="true"><i style="width:${Math.min(100, myPct)}%"></i></div>
    </div></div>`;
}
function vSamen() {
  const m = mine(); const tg = together();
  const goal = Math.max(1, Number(S.cfg?.goal) || 40); const reward = S.cfg?.reward || 'Stel een beloning in via het managementdashboard';
  const p = Math.min(100, pct(tg.moments, goal));
  const month = new Date().toLocaleDateString('nl-BE', { month: 'long' });
  const earned = { first: m.done.length >= 1, lead: m.led >= 1, connect: m.mates.size >= 5, habit: m.weeks >= 3, mix: m.types >= 2, steps: m.stepsAll >= 10000 };
  const medal = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.5 3l3.5 5 3.5-5M12 11.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z"/></svg>';
  const u = S.users[S.me] || {};
  return `<div><div class="eyebrow">${esc(month)}</div><h1>Samen</h1><p class="muted">Geen ranglijst. Hier telt hoe vaak jullie samen bewegen.</p></div>
    ${banner()}
    <div class="goal"><div class="eyebrow" style="color:inherit;opacity:.8">Samen-doel van het team</div>
      <div><span class="num">${tg.moments}</span> <span style="opacity:.85">/ ${goal} samen-momenten</span></div>
      <div class="bar" role="progressbar" aria-valuenow="${tg.moments}" aria-valuemin="0" aria-valuemax="${goal}"><i style="width:${p}%"></i></div>
      <p><b>Beloning:</b> ${esc(reward)}</p>
      <p class="small" style="opacity:.85">${tg.people} collega's bewogen deze maand samen en zetten ${fmtN(tg.steps)} stappen.</p></div>
    ${vLungs(tg, m)}
    <h2>Jij deze maand</h2><p class="note" style="margin-top:-8px">${AUTO_NOTE}.</p>
    <div class="stats">
      <div class="stat"><b>${m.monthCount}</b><small>keer meegedaan</small></div>
      <div class="stat"><b>${fmtN(m.stepsMonth)}</b><small>stappen</small></div>
      <div class="stat"><b>${m.mates.size}</b><small>collega's samen mee bewogen</small></div>
    </div>
    <h2>Jouw profiel</h2>
    <div class="me-row"><label class="av av-lg" style="background:${colorFor(S.me)}" for="photo-in">${face(S.me, realName(S.me))}</label>
      <div class="grow"><b>${esc(realName(S.me))}</b><small class="muted" style="display:block">${esc(u.company || 'Geen bedrijf ingevuld')}</small></div>
      <label class="pill in" for="photo-in" role="button">${photoOf(S.me) ? 'Foto wijzigen' : 'Foto toevoegen'}</label>
      <input class="vh" type="file" id="photo-in" accept="image/*" aria-label="Profielfoto kiezen"></div>
    <p class="note" style="margin-top:-8px">Je naam en bedrijf liggen vast. Je foto zien je collega's bij de activiteiten.</p>
    <h2>Jouw badges</h2>
    <div class="badges">${BADGES.map((b) => `<div class="badge ${earned[b.id] ? 'on' : ''}"><div class="medal">${medal}</div><div><b>${b.name}</b><span>${earned[b.id] ? 'Behaald' : b.how}</span></div></div>`).join('')}</div>
    <h2>Instellingen</h2>
    ${isStandalone() ? '' : `<details id="dinstall" class="box"><summary style="cursor:pointer;font-weight:800">Zet de app op je beginscherm</summary><div style="margin-top:10px">${installHtml(false)}</div></details>`}
    ${pushSettingsHtml()}
    ${S.mode === 'local' ? '<button class="secondary" type="button" data-act="simulate">Simuleer: een collega plant een wandeling</button>' : ''}
    <button class="secondary" type="button" data-tab="dash">Management</button>
    ${S.mode === 'local' ? '<button class="danger" type="button" data-act="reset" style="align-self:flex-start">Demo opnieuw beginnen</button>' : ''}`;
}

// ---------- werkgeversdashboard ----------
// Bron van het dashboard: in de demo de eigen gegevens, online alleen wat de beheerder mag lezen.
const dashSrc = () => (S.mode === 'local' ? S : S.adm || { acts: [], joins: [], users: {}, views: [], events: [], cfg: null });
function dashData() {
  const src = dashSrc();
  const actById = (id) => src.acts.find((a) => a.id === id);
  const realName = (u) => (src.users[u] && src.users[u].name) || 'Collega';
  const stepsOf = (j) => stepsOfAct(j, actById(j.act));
  const now = Date.now(); const d0 = new Date(); const monthStart = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
  const since = S.period === 'all' ? 0 : S.period === 'month' ? monthStart : now - 7 * 864e5;
  const sinceDate = since ? ymd(new Date(since)) : '0000-00-00';
  const acts = src.acts.filter((a) => a.date >= sinceDate);
  const ids = new Set(acts.map((a) => a.id));
  const joins = src.joins.filter((j) => ids.has(j.act));
  const extraJoins = joins.filter((j) => j.uid !== actById(j.act).by); // op "Doe mee" getikt (organisator niet meegeteld)
  const views = src.views.filter((v) => ids.has(v.act) && v.uid !== actById(v.act).by);
  const ev = src.events.filter((e) => (e.at || 0) >= since);
  const opens = ev.filter((e) => e.kind === 'open');
  const pastJoins = joins.filter((j) => isPast(actById(j.act)));
  const pastActs = acts.filter(isPast);
  const users = Object.keys(src.users);
  const active = new Set([...opens.map((e) => e.uid), ...joins.map((j) => j.uid), ...acts.map((a) => a.by)]);
  const saw = new Set(views.map((v) => v.uid)); const tapped = new Set(extraJoins.map((j) => j.uid)); const planners = new Set(acts.map((a) => a.by));
  const groupSizes = pastActs.map((a) => joins.filter((j) => j.act === a.id).length).filter((n) => n > 0);
  const count = (arr, key) => { const m = {}; arr.forEach((x) => { const k = key(x); m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]; };
  const topTime = count(acts, (a) => a.time); const topType = count(joins, (j) => actById(j.act).type);
  const perAct = acts.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).map((a) => {
    const v = views.filter((x) => x.act === a.id).length; const jn = extraJoins.filter((x) => x.act === a.id).length;
    return { a, seen: v, joined: jn, total: joins.filter((x) => x.act === a.id).length, conv: pct(jn, v) };
  });
  const perUser = users.map((u) => ({
    u, name: realName(u), company: src.users[u]?.company || '',
    opens: opens.filter((e) => e.uid === u).length, seen: views.filter((v) => v.uid === u).length,
    joined: extraJoins.filter((j) => j.uid === u).length, planned: acts.filter((a) => a.by === u).length,
    steps: pastJoins.filter((j) => j.uid === u).reduce((s, j) => s + stepsOf(j), 0),
    minutes: pastJoins.filter((j) => j.uid === u).reduce((s, j) => s + actById(j.act).dur, 0),
  })).sort((a, b) => (b.joined + b.planned) - (a.joined + a.planned) || b.opens - a.opens);
  return {
    users, active, opens, acts, joins, extraJoins, views, saw, tapped, planners, perAct, perUser,
    steps: pastJoins.reduce((s, j) => s + stepsOf(j), 0), minutes: pastJoins.reduce((s, j) => s + actById(j.act).dur, 0),
    avgGroup: groupSizes.length ? (groupSizes.reduce((s, n) => s + n, 0) / groupSizes.length) : 0,
    notifShown: ev.filter((e) => e.kind === 'notif_shown').length, notifJoin: ev.filter((e) => e.kind === 'notif_join').length,
    topTime, topType,
    activeToday: new Set(src.events.filter((e) => e.kind === 'open' && ymd(new Date(e.at || 0)) === todayStr()).map((e) => e.uid)).size,
    realName, cfg: src.cfg,
  };
}
function vDash() {
  const D = dashData(); const seats = D.users.length; const pack = PACKS.find((n) => seats <= n) || PACKS[PACKS.length - 1];
  const per = (k, l) => `<button type="button" class="chip" data-period="${k}" aria-pressed="${S.period === k}">${l}</button>`;
  const fr = (label, n, of, note) => `<div class="frow"><span>${label}</span><b>${n} <em>${note ?? (of ? pct(n, of) + '%' : '')}</em></b><div class="ftrack"><i style="width:${of ? Math.max(2, pct(n, of)) : 0}%"></i></div></div>`;
  const total = D.users.length;
  const conv = pct(D.extraJoins.length, D.views.length);
  const cfg = D.cfg || {}; const realName = D.realName;
  const isMaster = S.admin && S.admin.company === '*';
  const coName = S.mode === 'local' ? '' : ((S.admCompanies || []).find((c) => c.key === S.admKey) || {}).name || (S.admKey === S.ck ? (S.users[S.me] || {}).company : '') || '';
  const picker = isMaster && (S.admCompanies || []).length ? `<div class="field"><span>Bedrijf (hoofdcode: je ziet alle bedrijven)</span><div class="chips">${S.admCompanies.map((c) => `<button type="button" class="chip" data-admco="${esc(c.key)}" aria-pressed="${c.key === S.admKey}">${esc(c.name)}</button>`).join('')}</div></div>` : '';
  const admBanner = S.adm && S.adm.denied ? '<div class="banner"><b>Geen toegang tot deze gegevens</b>Dit beheerdersaccount mag de gegevens van dit bedrijf niet lezen.</div>' : '';
  return `<button class="back" type="button" data-tab="samen">‹ Terug</button>
    <div><div class="eyebrow">Voor het management${coName ? ' · ' + esc(coName) : ''}</div><h1>Managementdashboard</h1>
      <p class="muted">Hier ziet het management of de app gebruikt wordt en hoeveel mensen samen bewegen. Voor jullie test zijn dit meteen de inzichten.</p></div>
    ${picker}${admBanner}${banner()}
    <div class="seat"><div class="eyebrow" style="color:inherit;opacity:.8">Abonnement</div>
      <div><span style="font-size:22px;font-weight:800">Pakket ${pack} medewerkers</span></div>
      <div class="bar"><i style="width:${Math.min(100, pct(seats, pack))}%"></i></div>
      <p class="small" style="opacity:.9">${seats} van ${pack} plaatsen in gebruik · pakketten: ${PACKS.join(' / ')} medewerkers</p></div>
    <div class="chips">${per('7', 'Laatste 7 dagen')}${per('month', 'Deze maand')}${per('all', 'Alles')}</div>
    <div class="kpis">
      <div class="kpi"><b>${D.active.size}</b><small>actieve gebruikers</small><span class="sub">${pct(D.active.size, total)}% van ${total}</span></div>
      <div class="kpi"><b>${D.acts.length}</b><small>activiteiten gepland</small><span class="sub">door ${D.planners.size} ${D.planners.size === 1 ? 'persoon' : 'personen'}</span></div>
      <div class="kpi"><b>${D.joins.length}</b><small>deelnames</small><span class="sub">gem. groep ${D.avgGroup ? D.avgGroup.toFixed(1).replace('.', ',') : '–'}</span></div>
      <div class="kpi"><b>${fmtN(D.steps)}</b><small>stappen samen</small></div>
      <div class="kpi"><b>${fmtN(D.minutes)}</b><small>beweegminuten</small><span class="sub">${fmtN(Math.round(D.minutes / Math.max(1, D.active.size)))} per actieve persoon</span></div>
      <div class="kpi"><b>${D.opens.length}</b><small>keer de app geopend</small><span class="sub">${D.activeToday} vandaag actief</span></div>
    </div>
    <h2>Van zien naar meedoen</h2>
    <p class="note">Telt mensen, niet klikken. Iemand telt als "gezien" zodra een activiteit van een ander op zijn scherm verscheen.</p>
    <div class="box funnel">
      ${fr('Testers die zich aanmeldden', total, total, '')}
      ${fr('Zagen minstens één activiteit', D.saw.size, total)}
      ${fr('Tikten minstens één keer op Doe mee', D.tapped.size, total)}
      ${fr('Planden zelf iets', D.planners.size, total)}
    </div>
    <div class="kpis">
      <div class="kpi"><b>${conv}%</b><small>van de keren dat iemand een activiteit zag, deed die mee</small><span class="sub">${D.extraJoins.length} van ${D.views.length}</span></div>
      <div class="kpi"><b>${D.notifShown}</b><small>meldingen getoond</small><span class="sub">${D.notifJoin} keer meteen "Ik ga mee"</span></div>
      <div class="kpi"><b>${D.topTime ? hhmm(D.topTime[0]) : '–'}</b><small>populairste uur</small><span class="sub">${D.topType ? esc(TYPES[D.topType[0]]?.label || '') + ' is favoriet' : ''}</span></div>
    </div>
    <h2>Per activiteit</h2>
    <div class="tablewrap"><table class="t"><thead><tr><th>Wanneer</th><th>Wat</th><th>Door</th><th class="n">Gezien</th><th class="n">Doe mee</th><th class="n">%</th></tr></thead><tbody>
      ${D.perAct.map((r) => `<tr><td>${esc(shortDay(r.a.date))} ${hhmm(r.a.time)}</td><td>${esc(TYPES[r.a.type]?.label || r.a.type)}</td><td>${esc(realName(r.a.by))}</td><td class="n">${r.seen}</td><td class="n">${r.joined}</td><td class="n">${r.seen ? r.conv + '%' : '–'}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nog geen activiteiten in deze periode.</td></tr>'}
    </tbody></table></div>
    <h2>Per tester</h2>
    <p class="note">Alleen voor jullie test. In het echte product zou een werkgever enkel totalen zien, niet wat elke medewerker apart doet (privacy).</p>
    <div class="tablewrap"><table class="t"><thead><tr><th>Naam</th><th>Bedrijf</th><th class="n">Geopend</th><th class="n">Gezien</th><th class="n">Mee</th><th class="n">Gepland</th><th class="n">Stappen</th></tr></thead><tbody>
      ${D.perUser.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.company)}</td><td class="n">${r.opens}</td><td class="n">${r.seen}</td><td class="n">${r.joined}</td><td class="n">${r.planned}</td><td class="n">${fmtN(r.steps)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Nog niemand aangemeld.</td></tr>'}
    </tbody></table></div>
    <div class="row"><button class="secondary" type="button" data-act="csv-users" style="flex:1">Download testers (CSV)</button><button class="secondary" type="button" data-act="csv-acts" style="flex:1">Download activiteiten (CSV)</button></div>
    <details id="dcfg" class="box"><summary style="cursor:pointer;font-weight:800">Doelen en beloning aanpassen</summary>
      <div class="field" style="margin-top:10px"><span>Samen-momenten deze maand</span><input class="text" id="cgoal" type="number" min="1" max="10000" value="${Math.max(1, Number(cfg.goal) || 40)}"></div>
      <div class="field"><span>Stappendoel deze maand (vult de longen)</span><input class="text" id="cstepgoal" type="number" min="1000" max="10000000" step="1000" value="${Math.max(1000, Number(cfg.stepGoal) || 50000)}"></div>
      <div class="field"><span>Beloning</span><input class="text" id="creward" type="text" maxlength="100" value="${esc(cfg.reward || '')}" placeholder="bv. ontbijt voor iedereen"></div>
      <button class="pill join" type="button" data-act="cfg" style="align-self:flex-start">Opslaan</button></details>
    ${S.mode === 'shared' ? '<button class="danger" type="button" data-act="admlogout" style="align-self:flex-start">Afmelden als beheerder</button>' : ''}`;
}
function vAdminLogin() {
  return `<button class="back" type="button" data-tab="samen">‹ Terug</button>
    <div><div class="eyebrow">Alleen voor beheerders</div><h1>Management</h1>
      <p class="muted">Geef je beheerderscode in om het managementdashboard van je bedrijf te openen.</p></div>
    <label class="field"><span>Beheerderscode</span><input class="text" id="admcode" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" maxlength="80"></label>
    <button class="primary" type="button" data-act="admlogin">Open dashboard</button>
    <p class="note">Geen code? Het dashboard is alleen voor het management. Je collega's zien hier niets van.</p>`;
}
function csvDownload(name, rows) {
  const txt = '﻿' + rows.map((r) => r.map((c) => { const s = String(c ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(';')).join('\r\n');
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Download gestart. Open het bestand in Excel.'); }
  catch (e) { toast('Downloaden lukte niet in deze browser.'); }
}

// ---------- render ----------
let lastKey = '';
const viewKey = () => (needsWelcome() ? (S.claim ? 'claim' : 'welcome') : S.draft ? 'draft' : S.detail ? 'detail:' + S.detail : 'tab:' + S.tab);
const needsWelcome = () => S.mode === 'shared' && !S.me;
function render(preserve = false) {
  if (S.mode === 'loading') return;
  const main = $('#main'); const key = viewKey();
  const keep = {}; let focusId = null, selS = null, selE = null; let openD = [];
  if (preserve && key === lastKey) {
    main.querySelectorAll('input[id]:not([type="file"]),textarea[id]').forEach((el) => { keep[el.id] = el.value; });
    openD = [...main.querySelectorAll('details[id]')].filter((d) => d.open).map((d) => d.id);
    const ae = document.activeElement; if (ae && ae.id && main.contains(ae)) { focusId = ae.id; try { selS = ae.selectionStart; selE = ae.selectionEnd; } catch (e) {} }
  }
  let html;
  if (needsWelcome()) html = vWelcome();
  else if (S.draft) html = vCreate();
  else if (S.detail) html = vDetail();
  else html = S.tab === 'samen' ? vSamen() : S.tab === 'dash' ? (S.mode === 'local' || S.admin ? vDash() : vAdminLogin()) : vAgenda();
  main.innerHTML = html;
  for (const id in keep) { const el = document.getElementById(id); if (el) el.value = keep[id]; }
  openD.forEach((id) => { const d = document.getElementById(id); if (d) d.open = true; });
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus({ preventScroll: true }); try { if (selS != null) el.setSelectionRange(selS, selE); } catch (e) {} } }
  lastKey = key;
  const bare = needsWelcome();
  $('.nav').hidden = bare;
  document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-current', !S.draft && !S.detail && b.dataset.tab === (S.tab === 'dash' ? 'samen' : S.tab) ? 'page' : 'false'));
  if (S.notifQ.length) showPop();
  if (!bare) checkReminders();
  // "gezien" bijhouden: welke activiteiten van anderen verschenen op dit scherm
  if (!bare && document.visibilityState === 'visible') {
    const ids = key.startsWith('detail:') ? [S.detail] : key === 'tab:agenda' ? [...main.querySelectorAll('[data-open]')].map((e) => e.dataset.open) : [];
    for (const id of ids) { const a = actById(id); if (a && a.by !== S.me && !S.seen.has(id)) { S.seen.add(id); ls.set('wb-seen', JSON.stringify([...S.seen].slice(-300))); store.view(id); } }
  }
}
const refresh = () => render(true);

// ---------- events ----------
async function handle(el) {
  if (el.dataset.tab || el.dataset.open || el.dataset.act === 'new') S.justAdded = null;
  if (el.dataset.pop) {
    const q = S.notifQ.shift() || {}; const id = q.id; const k = el.dataset.pop;
    if (k === 'ok' && id) store.track('reminder_ok', { act: id });
    if (k === 'cancel' && id) { try { await store.leave(id); store.track('leave', { act: id, from: 'reminder' }); toast('Je bent afgemeld. De anderen zien het meteen.'); } catch (e) {} }
    if (k === 'join' && id) { try { await store.join(id); store.track('notif_join', { act: id }); toast('Je doet mee. Tot straks!'); } catch (e) {} }
    if (k === 'open' && id) { store.track('notif_open', { act: id }); S.detail = id; S.draft = null; S.tab = 'agenda'; render(); window.scrollTo(0, 0); }
    if (!S.notifQ.length) document.title = BASE_TITLE;
    showPop(); return;
  }
  if (el.dataset.comp) { S.signup = { ...(S.signup || {}), company: el.dataset.comp }; const c = $('#wcomp'); if (c) c.value = el.dataset.comp; const sg = $('#sugg'); if (sg) sg.innerHTML = suggHtml(); return; }
  if (el.dataset.installos) { S.installOs = el.dataset.installos; render(); return; }
  if (el.dataset.act === 'install-hide') { ls.set('wb-install-hidden', '1'); render(); toast('Je vindt de uitleg ook in het tabblad Samen.'); return; }
  if (el.dataset.act === 'install') { if (installEvt) { const ev = installEvt; installEvt = null; try { await ev.prompt(); await ev.userChoice; } catch (e) {} render(); } return; }
  if (el.dataset.admco) { S.admKey = el.dataset.admco; admStore.open(S.admKey); render(); return; }
  if (el.dataset.filter) { S.filter = el.dataset.filter; render(); return; }
  if (el.dataset.period) { S.period = el.dataset.period; render(); return; }
  if (el.dataset.tab) { S.tab = el.dataset.tab; S.detail = null; S.draft = null; history.replaceState(null, '', S.tab === 'dash' ? '#dashboard' : location.pathname + location.search); render(); window.scrollTo(0, 0); return; }
  if (el.dataset.join) { try { await store.join(el.dataset.join); toast('Je doet mee. Tot straks!'); } catch (e) {} return; }
  if (el.dataset.open) { S.detail = el.dataset.open; S.confirmDel = false; render(); window.scrollTo(0, 0); return; }
  if (el.dataset.set) {
    const k = el.dataset.set; let v = el.dataset.val;
    if (k === 'dur') v = Number(v);
    if (k === 'type') { S.draft.dur = TYPES[v].dur; if (v === 'padel' && PLACES.includes(S.draft.place)) S.draft.place = 'Padelclub'; if (v !== 'padel' && S.draft.place === 'Padelclub') S.draft.place = 'Inkom'; }
    if (k === 'place') { const ip = $('#cplace'); if (ip) ip.value = ''; }
    if (k === 'time') { const ct = $('#ctime'); if (ct) ct.value = ''; }
    readDraftInputs(); S.draft[k] = v; render(); return;
  }
  const act = el.dataset.act;
  if (act === 'home') { S.detail = null; S.draft = null; render(); return; }
  if (act === 'new') { const ns = nextSlot(); S.draft = { type: 'wandelen', date: ns.date, time: ns.time, dur: 20, place: 'Inkom', note: '' }; S.detail = null; render(); window.scrollTo(0, 0); return; }
  if (act === 'welcome') { el.disabled = true; el.textContent = 'Even geduld…'; try { await submitSignup(); } finally { el.disabled = false; el.textContent = 'Start'; } return; }
  if (act === 'claim-yes') { el.disabled = true; await finishSignup(S.claim && S.claim.pid); return; }
  if (act === 'claim-no') { el.disabled = true; await finishSignup(null); return; }
  if (act === 'claim-back') { S.claim = null; render(); return; }
  if (act === 'post') {
    readDraftInputs(); const d = S.draft;
    if (!d.place.trim()) { toast('Kies of typ een vertrekpunt.'); return; }
    if (isPast({ date: d.date, time: d.time, dur: 0 })) { toast('Dat uur is al voorbij. Kies een later uur of een andere dag.'); return; }
    const payload = { type: d.type, date: d.date, time: d.time, dur: d.dur, place: d.place.trim().slice(0, 60), note: d.note.trim().slice(0, 100) };
    if (TYPES[d.type].max) payload.max = TYPES[d.type].max;
    el.disabled = true;
    try {
      const id = await store.create(payload); store.track('create', { act: id });
      // seintje aan de push-Worker: collega's krijgen meteen een melding (en niet pas binnen de minuut)
      if (S.mode === 'shared' && pushConfig.workerUrl) fetch(`${pushConfig.workerUrl}/run?c=${encodeURIComponent(S.ck)}`, { mode: 'no-cors' }).catch(() => {});
      S.draft = null; S.detail = null; S.tab = 'agenda'; S.filter = 'all'; S.justAdded = id; render();
      const c = document.querySelector(`[data-open="${id}"]`);
      if (c) c.scrollIntoView({ block: 'center', behavior: 'smooth' }); else window.scrollTo(0, 0);
      toast(`Geplaatst: ${dayLabel(payload.date).toLowerCase()} om ${hhmm(payload.time)}. Iedereen ziet het nu.`);
    } catch (e) { el.disabled = false; }
    return;
  }
  if (act === 'join') { try { await store.join(S.detail); toast('Je doet mee. Tot straks!'); } catch (e) {} return; }
  if (act === 'leave') { try { await store.leave(S.detail); store.track('leave', { act: S.detail }); toast('Je bent afgemeld.'); } catch (e) {} return; }
  if (act === 'del') { if (!S.confirmDel) { S.confirmDel = true; render(); return; } try { await store.remove(S.detail); S.detail = null; S.confirmDel = false; render(); toast('Activiteit verwijderd.'); } catch (e) {} return; }
  if (act === 'share') {
    const a = actById(S.detail); const t = TYPES[a.type]; const link = /^https?:/.test(location.href) ? ' ' + location.href.split('#')[0] : '';
    const txt = `${t.label} ${dayLabel(a.date).toLowerCase()} om ${hhmm(a.time)}, ${a.dur} min, vertrek: ${a.place}.${a.note ? ' ' + a.note + '.' : ''} Wie doet mee? Zet je erbij in Wandelbuddy:${link}`;
    try { await navigator.clipboard.writeText(txt); toast('Uitnodiging gekopieerd.'); } catch (e) { toast(txt); }
    return;
  }
  if (act === 'cfg') {
    const goal = Math.max(1, Math.min(10000, Math.round(Number($('#cgoal').value) || 40)));
    const stepGoal = Math.max(1000, Math.min(10000000, Math.round(Number($('#cstepgoal').value) || 50000)));
    const reward = $('#creward').value.trim().slice(0, 100);
    if (S.mode === 'local') { try { await store.config({ goal, stepGoal, reward }); toast('Doelen opgeslagen.'); } catch (e) {} return; }
    if (!S.admin || !S.adm) { toast('Alleen een beheerder kan dit aanpassen.'); return; }
    try { await admStore.config({ goal, stepGoal, reward }); toast('Doelen opgeslagen.'); } catch (e) { console.error(e); toast('Opslaan lukte niet. Probeer opnieuw.'); } return;
  }
  if (act === 'admlogin') {
    const code = ($('#admcode') || {}).value || '';
    if (!code) { toast('Vul je beheerderscode in.'); return; }
    el.disabled = true; el.textContent = 'Even geduld…';
    try { const a = await admStore.login(code, S.ck); toast('Welkom in het managementdashboard.'); await openAdmin(a); }
    catch (e) {
      toast(e && e.code === 'auth/too-many-requests' ? 'Te veel pogingen. Probeer het over een paar minuten opnieuw.' : e && e.code === 'auth/network-request-failed' ? 'Geen verbinding. Probeer opnieuw.' : 'Deze code is niet juist.');
      el.disabled = false; el.textContent = 'Open dashboard'; const i = $('#admcode'); if (i) { i.value = ''; i.focus(); }
    }
    return;
  }
  if (act === 'admlogout') { await admStore.logout(); S.admin = null; S.tab = 'samen'; history.replaceState(null, '', location.pathname + location.search); render(); toast('Je bent afgemeld als beheerder.'); return; }
  if (act === 'csv-users') { const D = dashData(); csvDownload('wandelbuddy-testers.csv', [['Naam', 'Bedrijf', 'Keer geopend', 'Activiteiten gezien', 'Doe mee getikt', 'Zelf gepland', 'Stappen', 'Beweegminuten'], ...D.perUser.map((r) => [r.name, r.company, r.opens, r.seen, r.joined, r.planned, r.steps, r.minutes])]); return; }
  if (act === 'csv-acts') { const D = dashData(); csvDownload('wandelbuddy-activiteiten.csv', [['Datum', 'Uur', 'Activiteit', 'Duur (min)', 'Vertrek', 'Georganiseerd door', 'Gezien door', 'Doe mee getikt', 'Totaal deelnemers', 'Conversie %'], ...D.perAct.map((r) => [r.a.date, r.a.time, TYPES[r.a.type]?.label || r.a.type, r.a.dur, r.a.place, D.realName(r.a.by), r.seen, r.joined, r.total, r.seen ? r.conv : ''])]); return; }
  if (act === 'pushon') {
    el.disabled = true;
    try { S.pushOn = await pushSubscribe(true); toast(S.pushOn ? 'Meldingen staan aan op dit toestel.' : Notification.permission === 'denied' ? 'Meldingen zijn niet toegestaan. Je kunt ze aanzetten in de instellingen van je toestel.' : 'Meldingen aanzetten lukte niet.'); }
    catch (e) { console.error(e); toast('Meldingen aanzetten lukte niet op dit toestel.'); }
    render(); return;
  }
  if (act === 'push-hide') { ls.set('wb-push-hidden', '1'); render(); toast('Je kunt meldingen later aanzetten in het tabblad Samen.'); return; }
  if (act === 'simulate') { S.tab = 'agenda'; render(); store.simulate(); return; }
  if (act === 'reset') { await store.reset(); S.detail = null; S.notifQ = []; S.reminded = new Set(); ls.set('wb-reminded', '[]'); showPop(); toast('Demo opnieuw gestart.'); return; }
}
function readDraftInputs() {
  if (!S.draft) return;
  const p = $('#cplace'); if (p && p.value.trim()) S.draft.place = p.value;
  const n = $('#cnote'); if (n) S.draft.note = n.value;
  const t = $('#ctime'); if (t && t.value) S.draft.time = t.value;
}
document.addEventListener('click', (e) => { const el = e.target.closest('[data-tab],[data-join],[data-open],[data-set],[data-act],[data-pop],[data-period],[data-filter],[data-comp],[data-admco],[data-installos]'); if (el) { e.stopPropagation(); handle(el); } });
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-open]')) { e.preventDefault(); handle(e.target); }
  if (e.key === 'Enter' && ['wfirst', 'wlast', 'wcomp'].includes(e.target.id)) { e.preventDefault(); handle($('[data-act="welcome"]')); }
  if (e.key === 'Enter' && e.target.id === 'admcode') { e.preventDefault(); handle($('[data-act="admlogin"]')); }
});
// aanmeldvelden bijhouden terwijl je typt (en de bedrijfsvoorstellen bijwerken)
document.addEventListener('input', (e) => {
  const k = { wfirst: 'first', wlast: 'last', wcomp: 'company' }[e.target.id]; if (!k) return;
  S.signup = { ...(S.signup || {}), [k]: e.target.value };
  if (k === 'company') { const sg = $('#sugg'); if (sg) sg.innerHTML = suggHtml(); }
});
document.addEventListener('change', (e) => { if (e.target.id === 'photo-in') { const f = e.target.files && e.target.files[0]; e.target.value = ''; handlePhoto(f); return; } if ((e.target.id === 'ctime' || e.target.id === 'cplace') && S.draft) { readDraftInputs(); render(); } });
window.addEventListener('hashchange', () => { if (location.hash === '#dashboard') { S.tab = 'dash'; S.detail = null; S.draft = null; render(); } else openFromHash(); });
// tik op een melding → de app opent bij die activiteit (#a=<id>)
function openFromHash() {
  const m = /^#a=([A-Za-z0-9_-]+)/.exec(location.hash); if (!m) return;
  S.detail = m[1]; S.draft = null; S.tab = 'agenda'; history.replaceState(null, '', location.pathname + location.search);
  if (S.mode !== 'loading') { render(); window.scrollTo(0, 0); }
}
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'open' && e.data.hash) { location.hash = e.data.hash; } });
// herinnering 10 minuten voor de start van iets waaraan je meedoet
function checkReminders() {
  if (S.mode === 'loading' || !S.me || !store) return;
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes(); const t = todayStr();
  for (const a of S.acts) {
    if (a.date !== t || !iJoined(a.id) || S.reminded.has(a.id)) continue;
    const left = toMin(a.time) - nowMin;
    if (left > 0 && left <= 10) {
      S.reminded.add(a.id); ls.set('wb-reminded', JSON.stringify([...S.reminded].slice(-200)));
      S.notifQ.push({ id: a.id, kind: 'remind' }); showPop(); chime();
      try { if (navigator.vibrate) navigator.vibrate([200, 80, 200]); } catch (e) {}
      if (document.hidden) { document.title = '⏰ Over ' + left + ' min · ' + BASE_TITLE; try { if ('Notification' in window && Notification.permission === 'granted') new Notification(`Over ${left} minuten: ${(TYPES[a.type] || TYPES.wandelen).label.toLowerCase()}`, { body: `Vertrek aan ${a.place}`, tag: 'r' + a.id }); } catch (e) {} }
      store.track('reminder_shown', { act: a.id });
    }
  }
}
// elke dag schuiven de datums mee: na middernacht (of als de app lang open staat) alles opnieuw berekenen
let lastDay = todayStr();
setInterval(() => {
  if (S.mode === 'loading') return;
  checkReminders();
  const day = todayStr();
  if (day !== lastDay) { lastDay = day; if (S.draft) { S.draft.date = draftDays()[0]; render(); return; } }
  if (!S.draft) refresh();
}, 20000);

// ---------- start ----------
async function boot() {
  if (location.hash === '#dashboard') S.tab = 'dash'; else openFromHash();
  const cfg = S.cfgFile;
  if (cfg) {
    try {
      const { A, F, db, Au, auth } = await loadFirebase(cfg);
      S.authUid = await signInAnon(Au, auth);
      S.ck = ls.get('wb-ck') || null; S.me = (S.ck && ls.get('wb-pid')) || null;
      S.mode = 'shared'; store = sharedStore(F, db); store.start();
      admStore = adminStore(A, F, Au, cfg);
      render();
      trackOpen();
      // was dit toestel al aangemeld als beheerder? dan meteen terug in het dashboard
      admStore.restore().then((a) => { if (a && (a.company === '*' || a.company === S.ck)) openAdmin(a); });
      // staan meldingen al aan op dit toestel? dan het meldingsadres stil bijwerken
      if (pushPossible() && Notification.permission === 'granted') pushSubscribe(false).then((ok) => { S.pushOn = ok; refresh(); }).catch(() => {});
      return;
    } catch (e) {
      console.error(e);
      $('#main').innerHTML = `<div class="banner"><b>Firebase laadt niet</b>Controleer je internetverbinding en vernieuw de pagina. (${esc(e && e.message || e)})</div>`;
      return;
    }
  }
  S.mode = 'local'; store = localStore(); store.start(); render();
}
boot();
