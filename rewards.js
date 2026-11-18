// Wandelbuddy · tekeningen voor de beloning van het team
// Eigen SVG-tekeningen (geen afbeeldingen van het internet, geen merken of logo's).
// - body:   de vorm die zich van onder naar boven vult (ook gebruikt als omtrek)
// - detail: extra lijnen bovenop
// - box:    [bovenkant, onderkant] van de vorm, zodat 0% leeg en 100% helemaal vol is
// - re:     trefwoorden (hoofdletters en meervoud maken niet uit)

export const REWARDS = [
  { key: 'smoothie', name: 'Smoothie', re: /smoothie/, done: 'De smoothies komen eraan.', colors: ['#D9467E', '#F59E5B'], box: [34, 172],
    body: '<path d="M60 58H140L129 162Q128 172 118 172H82Q72 172 71 162Z"/><path d="M54 58Q54 34 100 34Q146 34 146 58Z"/>',
    detail: '<path d="M112 34L126 6L138 9"/><path d="M65 100H135"/>' },
  { key: 'pizza', name: 'Pizza', re: /pizza/, done: 'De pizza komt eraan.', colors: ['#E0602A', '#F6C343'], box: [20, 168],
    body: '<circle cx="100" cy="94" r="74"/>',
    detail: '<circle cx="100" cy="94" r="60"/><path d="M100 34V154M48 64L152 124M48 124L152 64"/><circle cx="78" cy="72" r="7"/><circle cx="124" cy="80" r="7"/><circle cx="90" cy="122" r="7"/><circle cx="130" cy="116" r="6"/>' },
  { key: 'ontbijt', name: 'Ontbijt', re: /ontbijt|croissant|brunch|koffiekoek/, done: 'Het ontbijt komt eraan.', colors: ['#C98A2E', '#F3C66B'], box: [46, 128],
    body: '<path d="M22 122C28 72 68 46 100 46C132 46 172 72 178 122C168 114 154 116 146 128C136 102 120 92 100 92C80 92 64 102 54 128C46 116 32 114 22 122Z"/>',
    detail: '<path d="M68 58L80 94M100 46V92M132 58L120 94"/><path d="M14 150H186"/>' },
  { key: 'koffie', name: 'Koffie', re: /koffie|cappuccino|latte|espresso|thee/, done: 'De koffie komt eraan.', colors: ['#6B3F22', '#B9854F'], box: [64, 164],
    body: '<path d="M44 64H138V118C138 148 118 164 91 164C64 164 44 148 44 118Z"/>',
    detail: '<path d="M138 82C164 80 168 122 136 126"/><path d="M24 172H158"/><path d="M70 50C62 38 78 30 70 16M94 50C86 38 102 30 94 16M118 50C110 38 126 30 118 16"/>' },
  { key: 'ijs', name: 'Ijsje', re: /\bijs(je|jes|co|coupe)?\b|gelato|roomijs|softijs/, done: 'De ijsjes komen eraan.', colors: ['#E77FA6', '#F8D3A1'], box: [16, 174],
    body: '<path d="M62 88H70.6A42 42 0 1 1 129.4 88H138L100 174Z"/>',
    detail: '<path d="M62 88Q72 99 82 88T102 88T122 88T138 88"/><path d="M76 104L112 150M124 104L90 146"/><path d="M84 40Q92 30 104 32"/>' },
  { key: 'taart', name: 'Taart', re: /taart|gebak|cake|cupcake|verjaardag/, done: 'De taart komt eraan.', colors: ['#E4789F', '#F7D9A8'], box: [30, 166],
    body: '<rect x="28" y="104" width="144" height="62" rx="10"/><rect x="52" y="62" width="96" height="46" rx="10"/><rect x="94" y="30" width="12" height="32" rx="3"/>',
    detail: '<path d="M100 6C109 15 107 24 100 24C93 24 91 15 100 6Z"/><path d="M28 122Q40 134 52 122T76 122T100 122T124 122T148 122T172 122M52 80Q64 92 76 80T100 80T124 80T148 80"/>' },
  { key: 'friet', name: 'Frietjes', re: /friet|frieten|frietjes|frites|frituur|patat/, done: 'De frietjes komen eraan.', colors: ['#E8A321', '#F7D35A'], box: [16, 172],
    body: '<path d="M50 88H150L138 172H62Z"/><rect x="58" y="30" width="14" height="66" rx="4"/><rect x="76" y="18" width="14" height="78" rx="4"/><rect x="94" y="28" width="14" height="68" rx="4"/><rect x="112" y="16" width="14" height="80" rx="4"/><rect x="130" y="34" width="14" height="62" rx="4"/>',
    detail: '<path d="M56 112H144"/>' },
  { key: 'uitstap', name: 'Teamuitstap', re: /uitstap|uitje|excursie|teambuilding|reisje|daguitstap/, done: 'De teamuitstap komt eraan.', colors: ['#E26A1F', '#F2B63D'], box: [40, 168],
    body: '<rect x="20" y="40" width="160" height="108" rx="18"/><circle cx="58" cy="150" r="17"/><circle cx="142" cy="150" r="17"/>',
    detail: '<rect x="34" y="54" width="36" height="34" rx="6"/><rect x="82" y="54" width="36" height="34" rx="6"/><rect x="130" y="54" width="36" height="34" rx="6"/><path d="M20 112H180"/><circle cx="58" cy="150" r="6"/><circle cx="142" cy="150" r="6"/>' },
  { key: 'broodje', name: 'Broodjes', re: /broodje|broodjes|lunch|sandwich|belegde/, done: 'De broodjes komen eraan.', colors: ['#C98A2E', '#F0C46A'], box: [44, 162],
    body: '<path d="M24 114C24 66 60 44 100 44C140 44 176 66 176 114Z"/><rect x="24" y="128" width="152" height="34" rx="14"/>',
    detail: '<path d="M22 121Q36 111 50 121T78 121T106 121T134 121T162 121T178 121"/><path d="M68 72l7-4M100 62l7-4M132 74l7-4M84 92l7-4M118 90l7-4"/>' },
  { key: 'donut', name: 'Donuts', re: /donut|doughnut/, done: 'De donuts komen eraan.', colors: ['#E06C9F', '#F2A3C4'], box: [24, 164],
    body: '<path fill-rule="evenodd" clip-rule="evenodd" d="M30 94a70 70 0 1 0 140 0a70 70 0 1 0-140 0ZM74 94a26 26 0 1 0 52 0a26 26 0 1 0-52 0Z"/>',
    detail: '<path d="M40 86Q52 70 68 80Q84 60 100 72Q118 58 132 78Q150 70 160 86"/><path d="M64 108l7 4M136 106l-6 5M100 140v7M122 132l5 5M78 134l-5 5"/>' },
  { key: 'wafel', name: 'Wafels', re: /wafel|wafels|pannenkoek/, done: 'De wafels komen eraan.', colors: ['#C9852B', '#EFC46B'], box: [24, 164],
    body: '<rect x="30" y="24" width="140" height="140" rx="22"/>',
    detail: '<path d="M65 24V164M100 24V164M135 24V164M30 59H170M30 94H170M30 129H170"/>' },
  { key: 'drankje', name: 'Drankje', re: /drankje|drankjes|aperitief|cocktail|mocktail|borrel|bubbels|cava|receptie/, done: 'Het drankje komt eraan.', colors: ['#F0703A', '#F7C04A'], box: [30, 104],
    body: '<path d="M34 30H166L100 104Z"/>',
    detail: '<path d="M100 104V156M62 166Q100 150 138 166Z"/><circle cx="152" cy="30" r="14"/><path d="M118 54L140 8"/>' },
];

// zoek de tekening die bij de beloningstekst past (het eerste trefwoord in de tekst wint, bv. "koffie en taart" → koffie)
export function findReward(text) {
  const t = String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (!t.trim()) return null;
  let best = null; let at = Infinity;
  for (const r of REWARDS) { const m = r.re.exec(t); if (m && m.index < at) { best = r; at = m.index; } }
  return best;
}

let uid = 0;
// de tekening, p% gevuld (0–100)
export function rewardSvg(r, p) {
  const id = `rw${++uid}`; const [top, bottom] = r.box;
  const y = bottom - ((bottom - top) * Math.max(0, Math.min(100, p))) / 100;
  return `<svg viewBox="0 0 200 180" class="rart" aria-hidden="true"><defs>
      <clipPath id="${id}c" clip-rule="evenodd">${r.body}</clipPath>
      <linearGradient id="${id}g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${r.colors[0]}"/><stop offset="1" stop-color="${r.colors[1]}"/></linearGradient></defs>
    <g clip-path="url(#${id}c)"><rect width="200" height="180" style="fill:var(--green-soft)"/><rect class="lfill" x="0" y="${y.toFixed(1)}" width="200" height="${(180 - y).toFixed(1)}" fill="url(#${id}g)"/></g>
    <g fill="none" style="stroke:var(--green)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${r.body}${r.detail}</g></svg>`;
}
