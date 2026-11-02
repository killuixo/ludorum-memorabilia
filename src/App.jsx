import React, { useState, useEffect, useMemo, useRef, useContext, createContext } from 'react';

/* =====================================================================
   LUDORUM · MEMORABILIA
   Biblioteca de games finalizados e backlog (Google Sheets via Apps Script)
   Visual no padrão do Archimateria: Mondrian, pink/ciano/amarelo, claro e escuro.
   ===================================================================== */

// ---------------------------------------------------------------------
// TEMA
// ---------------------------------------------------------------------
const C = { cyan: '#0891b2', pink: '#db2777', amber: '#f59e0b' };
const mkTheme = (dk) => ({
  dk,
  page: dk ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-black',
  surface: dk ? 'bg-gray-900 text-white' : 'bg-white text-black',
  sunken: dk ? 'bg-gray-800' : 'bg-gray-100',
  bd: dk ? 'border-gray-300' : 'border-black',
  bdSoft: dk ? 'border-gray-700' : 'border-gray-200',
  shadow: dk ? 'shadow-[4px_4px_0px_rgba(209,213,219,1)]' : 'shadow-[4px_4px_0px_rgba(0,0,0,1)]',
  shadowSm: dk ? 'shadow-[2px_2px_0px_rgba(209,213,219,1)]' : 'shadow-[2px_2px_0px_rgba(0,0,0,1)]',
  muted: dk ? 'text-gray-400' : 'text-gray-600',
  hover: dk ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
  input: dk ? 'bg-gray-800 text-white border-gray-500 focus:border-cyan-400' : 'bg-white text-black border-gray-400 focus:border-cyan-600',
  ink: dk ? '#d1d5db' : '#111827',
  inkFg: dk ? '#000000' : '#ffffff',
  halo: dk ? '#030712' : '#ffffff',
  grid: dk ? '#374151' : '#e5e7eb',
});
const ThemeCtx = createContext(mkTheme(false));
const useT = () => useContext(ThemeCtx);
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-pink-500';

// Cores de categorias genéricas (ciano, pink, amarelo, tinta e tons)
const catColors = (T) => [C.cyan, C.pink, C.amber, T.ink, '#67e8f9', '#f9a8d4', '#fcd34d', '#9ca3af', '#0e7490', '#9d174d', '#b45309', '#4b5563'];
const textOn = (hex) => ['#f59e0b', '#67e8f9', '#f9a8d4', '#fcd34d', '#9ca3af', '#d1d5db', '#ffffff'].includes(String(hex).toLowerCase()) ? '#000000' : '#ffffff';

// ---------------------------------------------------------------------
// SONS (chiptune NES): início, acerto e erro
// ---------------------------------------------------------------------
let audioCtx = null;
let soundOn = true;
let pulseWaves = {};
let lastErrorAt = 0;

const initAudio = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
};
const getPulse = (duty) => {
  if (pulseWaves[duty]) return pulseWaves[duty];
  const N = 32; const real = new Float32Array(N); const imag = new Float32Array(N);
  for (let n = 1; n < N; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  pulseWaves[duty] = audioCtx.createPeriodicWave(real, imag);
  return pulseWaves[duty];
};
const chipNote = (freq, start, dur, vol, wave = 0.25) => {
  const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
  if (wave === 'triangle') osc.type = 'triangle'; else osc.setPeriodicWave(getPulse(wave));
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.006);
  gain.gain.setValueAtTime(vol, start + Math.max(0.008, dur * 0.55));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(start); osc.stop(start + dur + 0.02);
};
// Início: fanfarra à la Dragon Quest, escala lídia ascendente (1 2 3 #4 5 6)
const playStartup = () => {
  if (!soundOn) return;
  try {
    initAudio(); if (!audioCtx) return;
    const t = audioCtx.currentTime + 0.03; const step = 0.085;
    [523.25, 587.33, 659.25, 739.99, 783.99].forEach((f, i) => chipNote(f, t + i * step, step * 0.92, 0.05, 0.25));
    chipNote(880.0, t + 5 * step, 0.55, 0.055, 0.25);
    chipNote(440.0, t + 5 * step, 0.55, 0.03, 0.125);
    chipNote(130.81, t, step * 5, 0.07, 'triangle');
    chipNote(146.83, t + 5 * step, 0.55, 0.07, 'triangle');
  } catch (e) {}
};
// Acerto (suave) e erro (suave, mais grave e descendente)
const playBeep = (type) => {
  if (!soundOn) return;
  try {
    initAudio(); if (!audioCtx) return;
    const t = audioCtx.currentTime + 0.01;
    if (type === 'save') {
      chipNote(783.99, t, 0.07, 0.05, 'triangle');
      chipNote(1046.5, t + 0.07, 0.16, 0.05, 'triangle');
      chipNote(1046.5, t + 0.07, 0.12, 0.012, 0.125);
    } else {
      const now = Date.now(); if (now - lastErrorAt < 350) return; lastErrorAt = now;
      chipNote(329.63, t, 0.1, 0.055, 'triangle');
      chipNote(233.08, t + 0.1, 0.22, 0.055, 'triangle');
      chipNote(233.08, t + 0.1, 0.18, 0.015, 0.5);
    }
  } catch (e) {}
};

// ---------------------------------------------------------------------
// LEITURA E FORMATAÇÃO DE DADOS (mesmo contrato com o Apps Script)
// ---------------------------------------------------------------------
const stripAcc = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const getVal = (game, keys) => {
  if (!game) return '';
  for (const k of keys) { if (game[k] !== undefined && game[k] !== null && game[k] !== '') return game[k]; }
  const clean = (x) => stripAcc(x).replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
  const have = Object.keys(game);
  for (const hk of have) {
    const ck = clean(hk);
    for (const k of keys) { if (ck === clean(k) && game[hk] !== undefined && game[hk] !== null && game[hk] !== '') return game[hk]; }
  }
  return '';
};
const blank = (v) => v === undefined || v === null || v === '' || v === '-';

const parsePrice = (v) => {
  if (blank(v)) return null;
  const n = parseFloat(String(v).replace('R$', '').replace(/\s/g, '').replace(/\./g, (m, i, s) => (s.includes(',') ? '' : m)).replace(',', '.'));
  return isNaN(n) ? null : n;
};
const money = (n, dec = 2) => (n === null || n === undefined || isNaN(n)) ? '' : `R$ ${Number(n).toFixed(dec).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const moneyShort = (n) => (n === null || n === undefined || isNaN(n)) ? '' : `R$ ${Math.round(n).toLocaleString('pt-BR')}`;

const fmtDate = (str) => {
  if (blank(str)) return '';
  const s = String(str).trim();
  if (s.includes('T')) { const p = s.split('T')[0].split('-'); if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`; }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s.replace(/-/g, '/');
  return s;
};
const dateMs = (str) => {
  const p = fmtDate(str).split('/');
  if (p.length !== 3) return null;
  const t = new Date(`${p[2]}-${p[1]}-${p[0]}T12:00:00`).getTime();
  return isNaN(t) ? null : t;
};
// "56h", "22:50:00" ou data-base da planilha (1899) -> horas decimais (ou null)
const parseHours = (v) => {
  if (blank(v)) return null;
  const str = String(v).trim();
  let hrs = null;
  if (/^\d+:\d+(:\d+)?$/.test(str)) { const p = str.split(':'); hrs = (parseInt(p[0], 10) || 0) + (parseInt(p[1], 10) || 0) / 60 + (parseInt(p[2], 10) || 0) / 3600; }
  else if (str.includes('T') || str.includes('1899') || str.includes('1900')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) { let diff = d.getTime() - new Date('1899-12-30T00:00:00Z').getTime(); if (diff < 0) diff += 86400000; hrs = Math.floor(diff / 60000) / 60; }
  } else {
    const h = str.match(/(\d+(?:[.,]\d+)?)\s*h/i); const m = str.match(/(\d+)\s*m/i);
    if (h || m) hrs = (h ? parseFloat(h[1].replace(',', '.')) : 0) + (m ? parseInt(m[1], 10) / 60 : 0);
    else { const n = parseFloat(str.replace(',', '.')); if (!isNaN(n)) hrs = n; }
  }
  return hrs !== null && hrs > 0 ? hrs : null;
};
const fmtHours = (h) => {
  if (h === null || h === undefined || isNaN(h) || h <= 0) return '';
  const t = Math.round(h * 60); const hh = Math.floor(t / 60); const mm = t % 60;
  return mm ? `${hh}h ${mm}m` : `${hh}h`;
};
const fmtHoursShort = (h) => (h === null || h === undefined || isNaN(h) || h <= 0) ? '-' : (h >= 100 ? `${Math.round(h)}h` : `${(Math.round(h * 10) / 10).toString().replace('.', ',')}h`);
const toHMS = (h) => { if (!h) return ''; const t = Math.round(h * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}:00`; };
const spanText = (days) => {
  if (days === null || days < 0) return '';
  if (days === 0) return 'no mesmo dia';
  if (days === 1) return '1 dia';
  if (days < 14) return `${days} dias`;
  if (days < 60) { const w = Math.round(days / 7); return `${w} sem.`; }
  if (days < 365) { const m = Math.round(days / 30); return `${m} ${m === 1 ? 'mês' : 'meses'}`; }
  const y = Math.floor(days / 365); const m = Math.round((days % 365) / 30);
  return m === 0 || m === 12 ? `${m === 12 ? y + 1 : y} ${(m === 12 ? y + 1 : y) === 1 ? 'ano' : 'anos'}` : `${y}a ${m}m`;
};
const getYoutubeId = (url) => { if (!url) return null; const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/); return m ? m[1] : null; };

// ---------------------------------------------------------------------
// CLASSIFICAÇÃO: consoles, gêneros (classe/subclasse), suportes
// ---------------------------------------------------------------------
const FAMILY_BY_CONSOLE = {
  PlayStation: ['PS1', 'PS2', 'PS3', 'PS4', 'PS5', 'PSP', 'VITA', 'PLAYSTATION', 'PLAYSTATION 1', 'PLAYSTATION 2', 'PLAYSTATION 4', 'PLAYSTATION 5'],
  Nintendo: ['NES', 'NINTENDINHO', 'SNES', 'SUPER NINTENDO', 'N64', 'NINTENDO 64', 'GB', 'GBC', 'GAME BOY', 'GBA', 'GAME BOY ADVANCE', 'DS', '3DS', 'WII', 'WII U', 'GAMECUBE', 'GC', 'SWITCH'],
  Sega: ['MEGA DRIVE', 'GENESIS', 'MASTER SYSTEM', 'SATURN', 'DREAMCAST', 'GAME GEAR'],
  PC: ['PC', 'STEAM', 'EPIC'],
  Xbox: ['XBOX', 'XBOX 360', 'XBOX ONE', 'XBOX SERIES'],
};
const getFamily = (name) => {
  const n = String(name || '').toUpperCase().trim();
  for (const [fam, list] of Object.entries(FAMILY_BY_CONSOLE)) if (list.includes(n)) return fam;
  return n ? 'Outros' : 'Sem console';
};
const familyColor = (fam, T) => ({ PlayStation: C.cyan, Nintendo: C.pink, Sega: C.amber, PC: T.ink, Xbox: '#16a34a' }[fam] || '#9ca3af');

const MAIN_GENRES = ['RPG', 'Ação', 'Plataforma', 'Aventura', 'Luta', 'Corrida', 'Estratégia', 'Sobrevivência', 'Quebra-cabeça', 'Esporte', 'Simulação', 'Tiro', 'Terror', 'Música', 'Ritmo'];
const splitGenre = (raw) => {
  const s = String(raw || '').trim();
  if (!s || s === '-') return { main: 'Sem gênero', sub: '' };
  const parts = s.split(/\s*\/\s*/);
  let main = parts[0].trim(); let sub = parts.slice(1).join(' / ').trim();
  const low = stripAcc(main);
  if (low === 'quebra cabeca' || low === 'puzzle' || low === 'quebra-cabeca') main = 'Quebra-cabeça';
  if (!sub) {
    for (const g of MAIN_GENRES) {
      const gl = stripAcc(g);
      if (low.startsWith(gl + ' ')) { sub = main.slice(g.length).trim(); main = g; break; }
    }
  }
  return { main, sub };
};
const getSupport = (name) => {
  const o = String(name || '').trim();
  if (!o || o === '-') return { cat: 'Sem info', sub: 'Sem info' };
  const parts = o.split(/\s*[\/\-]\s*/);
  let cat = parts[0].trim(); const cl = stripAcc(cat);
  if (cl.includes('fisico')) cat = 'Físico'; else if (cl.includes('digital')) cat = 'Digital'; else if (cl.includes('loader')) cat = 'Loader';
  const sub = (parts.length > 1 ? parts.slice(1).join(' / ') : 'Outro').replace(/[¹²³]/g, '').trim();
  return { cat, sub };
};
const DIFF_COLOR = { A: '#be123c', B: '#db2777', C: '#f59e0b', D: '#67e8f9', E: '#0891b2' };

// ---------------------------------------------------------------------
// FRANQUIAS: regras padrão + equivalências suas (salvas no aparelho)
// ---------------------------------------------------------------------
const DEFAULT_FRANCHISES = [
  { name: 'Final Fantasy', terms: ['final fantasy'] },
  { name: 'Kingdom Hearts', terms: ['kingdom hearts'] },
  { name: 'Katamari', terms: ['katamari'] },
  { name: 'Yakuza / Like a Dragon', terms: ['yakuza', 'like a dragon', 'ryu ga gotoku'] },
  { name: 'Tomb Raider', terms: ['tomb raider', 'lara croft'] },
  { name: 'Super Mario', terms: ['mario', 'luigi', 'yoshi', 'peach', 'toad'] },
  { name: 'Donkey Kong', terms: ['donkey kong'] },
  { name: 'Zelda', terms: ['zelda'] },
  { name: 'Sonic The Hedgehog', terms: ['sonic'] },
  { name: 'The Last Of Us', terms: ['last of us'] },
  { name: 'Mega Man', terms: ['megaman', 'mega man', 'rockman', 'tron bonne'] },
  { name: 'Dragon Ball', terms: ['dragon ball', 'dbz'] },
  { name: 'Crash Bandicoot', terms: ['crash bandicoot', 'crash team racing', 'crash'] },
  { name: 'Spyro', terms: ['spyro'] },
  { name: 'Rayman', terms: ['rayman'] },
  { name: 'Castlevania', terms: ['castlevania', 'bloodstained'] },
  { name: 'Persona / Megami Tensei', terms: ['persona', 'shin megami tensei'] },
  { name: 'Xenoblade / Xeno', terms: ['xenoblade', 'xenogears', 'xenosaga'] },
  { name: 'Wario', terms: ['wario'] },
  { name: 'Devil May Cry', terms: ['devil may cry', 'dmc'] },
  { name: 'Dragon Quest', terms: ['dragon quest'] },
  { name: 'Resident Evil', terms: ['resident evil', 'biohazard'] },
  { name: 'GTA', terms: ['grand theft auto', 'gta'] },
  { name: 'Fallout', terms: ['fallout'] },
  { name: 'Batman Arkham', terms: ['batman'] },
  { name: 'Soulcalibur', terms: ['soul calibur', 'soulcalibur'] },
  { name: 'Catherine', terms: ['catherine'] },
  { name: 'Civilization', terms: ['civilization'] },
  { name: 'Pokémon', terms: ['pokemon'] },
  { name: 'Metal Gear', terms: ['metal gear'] },
  { name: 'Silent Hill', terms: ['silent hill'] },
  { name: 'God of War', terms: ['god of war'] },
  { name: 'Assassin\'s Creed', terms: ['assassin s creed', 'assassins creed'] },
  { name: 'Uncharted', terms: ['uncharted'] },
  { name: 'Metroid', terms: ['metroid'] },
  { name: 'Street Fighter', terms: ['street fighter'] },
  { name: 'Mortal Kombat', terms: ['mortal kombat'] },
  { name: 'Gran Turismo', terms: ['gran turismo'] },
  { name: 'Borderlands', terms: ['borderlands'] },
  { name: 'Monster Hunter', terms: ['monster hunter'] },
  { name: 'Fire Emblem', terms: ['fire emblem'] },
  { name: 'Tales of', terms: ['tales of'] },
  { name: 'Ni no Kuni', terms: ['ni no kuni'] },
];
// normaliza para comparar palavras inteiras (evita "link" dentro de "Blink")
const normTitle = (t) => ' ' + stripAcc(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const franchiseOf = (title, custom, disabled) => {
  const nt = normTitle(title);
  const test = (rules) => { for (const r of rules) for (const term of r.terms) { const nt2 = normTitle(term); if (nt2.trim() && nt.includes(nt2)) return r.name; } return null; };
  const c = test(custom || []); if (c) return c;
  return test(DEFAULT_FRANCHISES.filter(r => !(disabled || []).includes(r.name)));
};
// título-base para detectar a "mesma obra" (zeradas diferentes)
const baseKey = (title) => stripAcc(title).replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
// sugestões de franquia: sequências de palavras compartilhadas por jogos ainda sem franquia
const STOP1 = ['the', 'and', 'for', 'with', 'super', 'world', 'final', 'new', 'game', 'games', 'story', 'legend', 'edition', 'remake', 'remastered', 'collection', 'deluxe', 'battle', 'return', 'rise', 'shadow', 'dragon', 'mega', 'wars', 'ultimate', 'definitive', 'complete'];
const suggestGroups = (recs) => {
  const items = []; const seen = new Set();
  recs.filter(r => !r.franchise).forEach(r => {
    if (seen.has(r.key)) return; seen.add(r.key);
    const words = stripAcc(r.title).replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w && !/^(i{1,3}|iv|v|vi{1,3}|ix|x{1,3}|\d+)$/.test(w));
    items.push({ r, words });
  });
  const grams = new Map();
  items.forEach(({ words }, idx) => {
    const local = new Set();
    for (let i = 0; i < words.length; i++) for (let n = 1; n <= 6 && i + n <= words.length; n++) {
      const g = words.slice(i, i + n).join(' ');
      if (n === 1 && (i !== 0 || g.length < 6 || STOP1.includes(g))) continue;
      if (n > 1 && g.length < 8) continue;
      local.add(g);
    }
    local.forEach(g => { if (!grams.has(g)) grams.set(g, new Set()); grams.get(g).add(idx); });
  });
  const cands = Array.from(grams.entries()).filter(([, s]) => s.size >= 2).sort((a, b) => b[0].length - a[0].length || b[1].size - a[1].size);
  const used = new Set(); const out = [];
  cands.forEach(([g, s]) => {
    const idxs = Array.from(s).filter(i => !used.has(i)); if (idxs.length < 2) return;
    idxs.forEach(i => used.add(i)); out.push({ root: g, titles: idxs.map(i => items[i].r.title) });
  });
  return out.slice(0, 12);
};

// ---------------------------------------------------------------------
// REGISTRO NORMALIZADO (uma vez por jogo) usado em todas as análises
// ---------------------------------------------------------------------
const parseNota = (v) => {
  if (blank(v)) return { n: null, s: false };
  const s = String(v).trim().toUpperCase();
  if (s === 'S' || s === 'RANK S') return { n: null, s: true };
  const n = parseFloat(s.replace(',', '.'));
  return { n: isNaN(n) ? null : n, s: false };
};
const normalizeGame = (g, fr) => {
  const gv = (k) => getVal(g, k);
  const status = g.status === 'Backlog' ? 'Backlog' : 'Finalizado';
  const titulo = String(gv(['titulo', 'nome']) || '').trim();
  const plat = String(gv(['plataforma', 'console']) || '').trim();
  const genreRaw = String(gv(['franquia', 'genero', 'gênero']) || '').trim();
  const gen = splitGenre(genreRaw);
  const inicio = gv(['inicio', 'iniciado']); const fim = gv(['fim', 'termino']);
  const sMs = dateMs(inicio); const eMs = dateMs(fim);
  const nota = parseNota(gv(['nota']));
  const preco = parsePrice(gv(['preco', 'preco pago']));
  const orig = parsePrice(gv(['preco_original', 'preco sem desconto', 'preço sem desconto']));
  const sup = getSupport(gv(['suporte']));
  const cond = String(gv(['conquistas', 'condicao', 'condição']) || '');
  const prioN = parseInt(gv(['prioridade']), 10);
  const dif = String(gv(['dificuldade']) || '').toUpperCase().trim();
  const endDate = eMs ? new Date(eMs) : null;
  const days = sMs && eMs ? Math.max(0, Math.round(Math.abs(eMs - sMs) / 86400000)) : null;
  const hours = status === 'Finalizado' ? parseHours(gv(['tempo'])) : null;
  return {
    raw: g, id: g.id, status, num: parseInt(gv(['#', 'ordem', 'numero']), 10) || g._fallbackId || 0,
    title: titulo, key: baseKey(titulo) + '|' + stripAcc(plat),
    console: plat || 'Sem console', family: getFamily(plat),
    genre: genreRaw, genreMain: gen.main, genreSub: gen.sub,
    franchise: franchiseOf(titulo, fr.custom, fr.disabled) || '',
    startMs: sMs, endMs: eMs, startStr: fmtDate(inicio), endStr: fmtDate(fim),
    endYear: endDate ? String(endDate.getFullYear()) : '', endMonth: endDate ? endDate.getMonth() : null,
    days, hours,
    nota: nota.n, isS: nota.s, notaBucket: nota.s ? 'S' : (nota.n !== null ? String(Math.min(10, Math.floor(nota.n))) : ''),
    notaLabel: nota.s ? 'S' : (nota.n !== null ? String(nota.n).replace('.', ',') : ''),
    dif: DIFF_COLOR[dif] ? dif : '', cond, platina: stripAcc(cond).includes('platina'),
    preco, orig, hasPrice: preco !== null,
    saving: preco !== null && orig !== null && orig > preco ? orig - preco : 0,
    supRaw: String(gv(['suporte']) || '').trim(), supCat: sup.cat, supSub: sup.sub,
    prio: isNaN(prioN) ? null : prioN, started: status === 'Backlog' && !blank(inicio),
    obs: String(gv(['comentarios', 'observacao', 'observação']) || ''), link: String(gv(['midia', 'link']) || ''),
  };
};

// ---------------------------------------------------------------------
// FILTROS
// ---------------------------------------------------------------------
const FACETS = [
  { id: 'console', label: 'Console', get: r => r.console },
  { id: 'family', label: 'Família', get: r => r.family },
  { id: 'genre', label: 'Gênero', get: r => r.genreMain },
  { id: 'franchise', label: 'Franquia', get: r => r.franchise },
  { id: 'nota', label: 'Nota', get: r => r.notaBucket },
  { id: 'dif', label: 'Dificuldade', get: r => r.dif },
  { id: 'supCat', label: 'Formato', get: r => r.supCat },
  { id: 'suporte', label: 'Suporte', get: r => r.supRaw },
  { id: 'ano', label: 'Ano', get: r => r.endYear },
];
const EMPTY_FILTERS = FACETS.reduce((o, f) => ({ ...o, [f.id]: [] }), {});
const facetById = (id) => FACETS.find(f => f.id === id);

const applyFilters = (recs, filters, search) => {
  const q = stripAcc(search).trim();
  return recs.filter(r => {
    for (const f of FACETS) {
      const sel = filters[f.id];
      if (sel && sel.length && !sel.includes(f.get(r))) return false;
    }
    if (q) {
      const hay = stripAcc(`${r.title} ${r.console} ${r.genre} ${r.franchise} ${r.supRaw}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
};

// ---------------------------------------------------------------------
// ANÁLISES
// ---------------------------------------------------------------------
const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
const sumOf = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);

const aggregate = (list, keyFn) => {
  const m = new Map();
  list.forEach(r => {
    const k = keyFn(r); if (k === '' || k === null || k === undefined) return;
    if (!m.has(k)) m.set(k, { key: k, count: 0, hours: 0, hoursN: 0, notaSum: 0, notaN: 0, spent: 0, pricedN: 0, saving: 0, items: [] });
    const o = m.get(k); o.count++; o.items.push(r);
    if (r.hours) { o.hours += r.hours; o.hoursN++; }
    if (r.nota !== null) { o.notaSum += r.nota; o.notaN++; }
    if (r.hasPrice) { o.spent += r.preco; o.pricedN++; }
    o.saving += r.saving;
  });
  return Array.from(m.values()).map(o => ({ ...o, avgNota: o.notaN ? o.notaSum / o.notaN : null, avgHours: o.hoursN ? o.hours / o.hoursN : null })).sort((a, b) => b.count - a.count || b.hours - a.hours);
};

const binBy = (list, bins, valFn) => bins.map(b => {
  const items = list.filter(r => { const v = valFn(r); return v !== null && v !== undefined && v >= b.min && v < b.max; });
  return { ...b, count: items.length, items };
});

const pearson = (pts) => {
  const n = pts.length; if (n < 8) return null;
  const mx = mean(pts.map(p => p.x)); const my = mean(pts.map(p => p.y));
  let sxy = 0, sxx = 0, syy = 0;
  pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
};

const analyze = (fin, back) => {
  const all = [...fin, ...back];
  const notas = fin.filter(r => r.nota !== null);
  const withHours = fin.filter(r => r.hours);
  const both = all.filter(r => r.hasPrice && r.orig !== null && r.orig > 0);
  const A = {
    nFin: fin.length, nBack: back.length, nStarted: back.filter(r => r.started).length,
    unique: new Set(fin.map(r => r.key)).size, replays: fin.length - new Set(fin.map(r => r.key)).size,
    hours: sumOf(fin, r => r.hours), hoursN: withHours.length,
    avgHours: mean(withHours.map(r => r.hours)),
    avgNota: mean(notas.map(r => r.nota)), nNota: notas.length, sCount: fin.filter(r => r.isS).length,
    platinas: fin.filter(r => r.platina).length,
    spent: sumOf(all, r => r.hasPrice ? r.preco : 0), nPriced: all.filter(r => r.hasPrice).length, nAll: all.length,
    saved: sumOf(all, r => r.saving),
    listValue: sumOf(both, r => r.orig), discountPct: both.length ? sumOf(both, r => r.saving) / sumOf(both, r => r.orig) * 100 : null,
    free: all.filter(r => r.hasPrice && r.preco === 0).length,
    avgDays: mean(fin.filter(r => r.days !== null).map(r => r.days)),
  };
  A.byConsole = aggregate(fin, r => r.console);
  A.byFamily = aggregate(fin, r => r.family);
  A.byGenre = aggregate(fin, r => r.genreMain);
  A.bySub = aggregate(fin.filter(r => r.genreSub), r => `${r.genreMain} / ${r.genreSub}`);
  A.byFranchise = aggregate(fin, r => r.franchise);
  A.bySupCat = aggregate(fin, r => r.supCat);
  A.bySupSub = aggregate(fin, r => `${r.supCat} / ${r.supSub}`);
  A.byDif = ['A', 'B', 'C', 'D', 'E'].map(d => ({ key: d, items: fin.filter(r => r.dif === d), count: fin.filter(r => r.dif === d).length }));

  // anos (com lacunas preenchidas) e calendário mês × ano
  const yrs = fin.map(r => parseInt(r.endYear, 10)).filter(y => !isNaN(y));
  A.years = []; A.months = [];
  if (yrs.length) {
    const y0 = Math.min(...yrs); const y1 = Math.max(...yrs);
    for (let y = y0; y <= y1; y++) {
      const items = fin.filter(r => r.endYear === String(y));
      const byFam = {}; items.forEach(r => { byFam[r.family] = (byFam[r.family] || 0) + 1; });
      const byFamH = {}; items.forEach(r => { byFamH[r.family] = (byFamH[r.family] || 0) + (r.hours || 0); });
      A.years.push({ year: String(y), count: items.length, hours: sumOf(items, r => r.hours), byFam, byFamH, items, spent: sumOf(items, r => r.hasPrice ? r.preco : 0) });
      const row = Array.from({ length: 12 }, (_, m) => { const it = items.filter(r => r.endMonth === m); return { count: it.length, hours: sumOf(it, r => r.hours), items: it }; });
      if (items.length) A.months.push({ year: String(y), row });
    }
  }
  A.undatedFin = fin.filter(r => !r.endYear).length;

  // notas
  A.notaHist = ['S', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'].map(k => { const items = fin.filter(r => r.notaBucket === k); return { key: k, count: items.length, items }; });
  A.notaMissing = fin.filter(r => r.nota === null && !r.isS).length;
  A.hoursBins = binBy(fin, [{ label: 'até 10h', min: 0, max: 10 }, { label: '10–20h', min: 10, max: 20 }, { label: '20–40h', min: 20, max: 40 }, { label: '40–80h', min: 40, max: 80 }, { label: '80h+', min: 80, max: 1e9 }], r => r.hours);
  A.daysBins = binBy(fin, [{ label: 'até 3 dias', min: 0, max: 4 }, { label: '4–14 dias', min: 4, max: 15 }, { label: '15–30 dias', min: 15, max: 31 }, { label: '1–3 meses', min: 31, max: 91 }, { label: '3–12 meses', min: 91, max: 366 }, { label: '1 ano+', min: 366, max: 1e9 }], r => r.days);
  A.priceBins = binBy(all.filter(r => r.hasPrice), [{ label: 'grátis', min: 0, max: 0.01 }, { label: 'até R$ 20', min: 0.01, max: 20 }, { label: 'R$ 20–40', min: 20, max: 40 }, { label: 'R$ 40–80', min: 40, max: 80 }, { label: 'R$ 80–150', min: 80, max: 150 }, { label: 'R$ 150+', min: 150, max: 1e9 }], r => r.preco);

  // relação tempo × nota
  A.scatter = fin.filter(r => r.hours && r.nota !== null);
  A.corr = pearson(A.scatter.map(r => ({ x: r.hours, y: r.nota })));

  // custo por hora e descontos
  A.perHour = fin.filter(r => r.hasPrice && r.preco > 0 && r.hours).map(r => ({ r, cph: r.preco / r.hours })).sort((a, b) => a.cph - b.cph);
  A.cphAvg = A.perHour.length ? sumOf(A.perHour, x => x.r.preco) / sumOf(A.perHour, x => x.r.hours) : null;
  A.discounts = all.filter(r => r.saving > 0).sort((a, b) => b.saving - a.saving);
  A.spentByYear = A.years.map(y => ({ year: y.year, spent: y.spent }));
  A.spentBySup = aggregate(all.filter(r => r.hasPrice), r => r.supCat).map(o => ({ ...o, spent: o.spent }));
  A.spentByConsole = aggregate(all.filter(r => r.hasPrice), r => r.console).sort((a, b) => b.spent - a.spent);

  // backlog
  A.backByConsole = aggregate(back, r => r.console);
  A.backByGenre = aggregate(back, r => r.genreMain);
  A.backValue = sumOf(back, r => r.orig !== null ? r.orig : r.preco);
  A.backPaid = sumOf(back, r => r.hasPrice ? r.preco : 0);
  A.backFree = back.filter(r => r.hasPrice && r.preco === 0).length;
  A.backHoursEst = null;
  return A;
};

// Matriz de cruzamento
const CROSS_DIMS = {
  console: { label: 'Console', get: r => r.console },
  family: { label: 'Família', get: r => r.family },
  genre: { label: 'Gênero', get: r => r.genreMain },
  franchise: { label: 'Franquia', get: r => r.franchise },
  ano: { label: 'Ano', get: r => r.endYear },
  nota: { label: 'Nota', get: r => r.notaBucket },
  dif: { label: 'Dificuldade', get: r => r.dif },
  supCat: { label: 'Formato', get: r => r.supCat },
  suporte: { label: 'Suporte', get: r => r.supSub },
};
const buildMatrix = (recs, rowDim, colDim) => {
  const rg = CROSS_DIMS[rowDim].get; const cg = CROSS_DIMS[colDim].get;
  const cells = {}; const rowTot = {}; const colTot = {};
  recs.forEach(r => {
    const a = rg(r); const b = cg(r); if (!a || !b) return;
    const k = `${a}\u0001${b}`; (cells[k] = cells[k] || []).push(r);
    rowTot[a] = (rowTot[a] || 0) + 1; colTot[b] = (colTot[b] || 0) + 1;
  });
  const order = (dim, tot) => {
    const keys = Object.keys(tot);
    if (dim === 'ano') return keys.sort();
    if (dim === 'nota') return ['S', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'].filter(k => tot[k]);
    if (dim === 'dif') return ['A', 'B', 'C', 'D', 'E'].filter(k => tot[k]);
    return keys.sort((x, y) => tot[y] - tot[x]);
  };
  const rows = order(rowDim, rowTot).slice(0, 14); const cols = order(colDim, colTot).slice(0, 14);
  let max = 1; let best = null;
  rows.forEach(r => cols.forEach(c => { const n = (cells[`${r}\u0001${c}`] || []).length; if (n > max) max = n; if (!best || n > best.n) best = { r, c, n }; }));
  return { rows, cols, cells, rowTot, colTot, max, best };
};

// ---------------------------------------------------------------------
// COMPRAR × ASSINAR (PS4 × PS Plus)
// Preços de 12 meses no Brasil: antes e depois do reajuste de 16/04/2025
// ---------------------------------------------------------------------
const DEFAULT_PS_CFG = {
  console: 'PS4',
  date: '',
  prices: [
    { from: '2022-06-01', ess: 278.9, extra: 475.9, deluxe: 538.9 },
    { from: '2025-04-16', ess: 359.9, extra: 592.9, deluxe: 691.9 },
  ],
};
const priceAt = (prices, ms) => {
  const sorted = [...prices].map(p => ({ ...p, t: new Date(p.from + 'T12:00:00').getTime() })).filter(p => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  let cur = sorted[0];
  sorted.forEach(p => { if (p.t <= ms) cur = p; });
  return cur || { ess: 0, extra: 0, deluxe: 0 };
};
const psCompare = (all, cfg, nowMs) => {
  const target = String(cfg.console || 'PS4').toUpperCase();
  const games = all.filter(r => r.console.toUpperCase() === target);
  const priced = games.filter(r => r.hasPrice);
  const starts = games.map(r => r.startMs).filter(Boolean);
  const cfgMs = cfg.date ? new Date(cfg.date + 'T12:00:00').getTime() : null;
  const startMs = cfgMs && !isNaN(cfgMs) ? cfgMs : (starts.length ? Math.min(...starts) : null);
  const R = { games, priced, startMs, nGames: games.length, nPriced: priced.length, spent: sumOf(priced, r => r.preco), listValue: sumOf(priced.filter(r => r.orig !== null), r => r.orig), hours: sumOf(games.filter(r => r.status === 'Finalizado'), r => r.hours), hoursPaid: sumOf(priced.filter(r => r.status === 'Finalizado'), r => r.hours), points: [], totals: null };
  if (!startMs) return R;
  const d0 = new Date(startMs); const dn = new Date(nowMs);
  const monthsSpan = (dn.getFullYear() - d0.getFullYear()) * 12 + (dn.getMonth() - d0.getMonth());
  const buyAt = (ms) => sumOf(priced.filter(r => ((r.startMs || r.endMs || nowMs) <= ms)), r => r.preco);
  let ess = 0, extra = 0, deluxe = 0;
  for (let i = 0; i <= monthsSpan; i++) {
    const t = new Date(d0.getFullYear(), d0.getMonth() + i, 1, 12).getTime();
    const p = priceAt(cfg.prices, t);
    if (i > 0) { ess += p.ess / 12; extra += p.extra / 12; deluxe += p.deluxe / 12; }
    R.points.push({ t, buy: buyAt(i === monthsSpan ? nowMs : t), ess, extra, deluxe });
  }
  R.totals = { ess, extra, deluxe, years: monthsSpan / 12 };
  R.covNeeded = (c) => R.spent > 0 ? (c / R.spent) * 100 : null;
  return R;
};

// Treemap "squarified": retângulos {x,y,w,h} em um quadro W×H
const squarify = (list, W, H) => {
  const data = list.filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return [];
  let x = 0, y = 0, w = W, h = H; const scale = (W * H) / total;
  const nodes = data.map(d => ({ ...d, area: d.value * scale })); const out = [];
  const worst = (row, side) => { const s = row.reduce((a, n) => a + n.area, 0); const mx = Math.max(...row.map(n => n.area)); const mn = Math.min(...row.map(n => n.area)); return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn)); };
  const place = (row) => {
    const s = row.reduce((a, n) => a + n.area, 0);
    if (w >= h) { const cw = s / h; let cy = y; row.forEach(n => { const nh = n.area / cw; out.push({ ...n, x, y: cy, w: cw, h: nh }); cy += nh; }); x += cw; w -= cw; }
    else { const rh = s / w; let cx = x; row.forEach(n => { const nw = n.area / rh; out.push({ ...n, x: cx, y, w: nw, h: rh }); cx += nw; }); y += rh; h -= rh; }
  };
  let row = []; let i = 0;
  while (i < nodes.length) { const side = Math.min(w, h); const next = [...row, nodes[i]]; if (row.length === 0 || worst(next, side) <= worst(row, side)) { row = next; i++; } else { place(row); row = []; } }
  if (row.length) place(row);
  return out;
};

// número animado (respeita "reduzir movimento")
const useCountUp = (target, ms = 800) => {
  const [val, setVal] = useState(0); const prev = useRef(0);
  useEffect(() => {
    const to = Number(target) || 0; const from = prev.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || from === to) { setVal(to); prev.current = to; return; }
    let raf; const t0 = performance.now();
    const tick = (now) => { const p = Math.min(1, (now - t0) / ms); const e = 1 - Math.pow(1 - p, 3); setVal(from + (to - from) * e); if (p < 1) raf = requestAnimationFrame(tick); else prev.current = to; };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
};

// ---------------------------------------------------------------------
// PEÇAS DE INTERFACE
// ---------------------------------------------------------------------
const Card = ({ title, hint, right, children, className = '' }) => {
  const T = useT();
  return (
    <section className={`${T.surface} border-[2px] ${T.bd} ${T.shadow} p-3 sm:p-4 flex flex-col min-w-0 ${className}`}>
      <header className={`flex items-baseline justify-between gap-3 mb-3 pb-2 border-b-[2px] ${T.bd}`}>
        <h3 className="text-sm font-black tracking-tight leading-tight">{title}</h3>
        {right || (hint && <span className="text-[10px] font-bold opacity-60 text-right leading-tight">{hint}</span>)}
      </header>
      {children}
    </section>
  );
};

const Chip = ({ active, onClick, swatch, children, title }) => {
  const T = useT();
  return (
    <button title={title} onClick={onClick} className={`flex items-center gap-1.5 px-2 py-1 border-[2px] text-[10px] font-black transition-colors active:translate-y-0.5 ${FOCUS} ${active ? (T.dk ? 'bg-gray-200 text-black border-gray-300' : 'bg-black text-white border-black') : (T.dk ? 'bg-gray-800 text-white border-gray-500 hover:border-gray-300' : 'bg-white text-black border-gray-400 hover:border-black')}`}>
      {swatch && <span className={`w-3 h-3 border-[2px] flex-shrink-0 ${T.bd}`} style={{ backgroundColor: swatch }} />}{children}
    </button>
  );
};

const Seg = ({ value, options, onChange }) => {
  const T = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`px-3 py-1.5 border-[2px] text-[11px] font-black transition-colors ${FOCUS} ${value === o.id ? `bg-cyan-600 text-white ${T.bd}` : (T.dk ? 'bg-gray-800 text-gray-300 border-gray-600 hover:text-white' : 'bg-white text-gray-700 border-gray-300 hover:text-black')}`}>{o.label}</button>
      ))}
    </div>
  );
};

const Tile = ({ className = '', style, children, onClick }) => {
  const T = useT();
  const Tag = onClick ? 'button' : 'div';
  return <Tag onClick={onClick} className={`p-3 sm:p-4 border-r-[2px] border-b-[2px] ${T.bd} flex flex-col justify-between min-w-0 text-left ${onClick ? `transition-opacity hover:opacity-90 ${FOCUS}` : ''} ${className}`} style={style}>{children}</Tag>;
};

const ConsoleBadge = ({ name, onClick }) => {
  const T = useT(); const fam = getFamily(name); const bg = familyColor(fam, T);
  return <span onClick={onClick} className={`inline-flex items-center px-1.5 py-0.5 border-[2px] ${T.bd} font-black text-[10px] whitespace-nowrap ${onClick ? 'cursor-pointer' : ''}`} style={{ backgroundColor: bg, color: textOn(bg) }}>{name}</span>;
};
const NotaBadge = ({ r }) => {
  const T = useT();
  if (r.isS) return <span className={`inline-block px-2 py-0.5 font-black text-[11px] border-[2px] ${T.bd}`} style={{ background: `linear-gradient(90deg, ${C.pink}, ${C.amber}, ${C.cyan})`, color: '#000' }}>S</span>;
  if (r.nota === null) return null;
  const bg = r.nota >= 9 ? C.cyan : r.nota >= 7.5 ? C.amber : (T.dk ? '#4b5563' : '#e5e7eb');
  const fg = r.nota >= 9 ? '#fff' : r.nota >= 7.5 ? '#000' : (T.dk ? '#fff' : '#000');
  return <span className={`inline-block px-2 py-0.5 font-black text-[11px] border-[2px] ${T.bd}`} style={{ backgroundColor: bg, color: fg }}>{r.notaLabel}</span>;
};
const GameThumbRow = ({ r, onOpen }) => {
  const T = useT();
  return (
    <button onClick={() => onOpen && onOpen(r)} className={`w-full flex items-center gap-2 py-2 border-b text-left ${T.bdSoft} ${T.hover} ${FOCUS}`}>
      <span className="w-7 text-[10px] font-black opacity-50 tabular-nums text-right">{r.status === 'Finalizado' ? r.num : '·'}</span>
      <span className="flex-1 min-w-0"><span className="block text-xs font-black truncate">{r.title}</span><span className="block text-[10px] font-bold opacity-60 truncate">{r.genre || 'Sem gênero'}{r.franchise ? `, ${r.franchise}` : ''}</span></span>
      <ConsoleBadge name={r.console} />
      <span className="w-12 text-right text-[10px] font-black tabular-nums">{fmtHoursShort(r.hours)}</span>
      <span className="w-9 flex justify-end"><NotaBadge r={r} /></span>
    </button>
  );
};

const niceCeil = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; };

// Treemap (área = quantidade)
const Treemap = ({ items, onPick, isOn, describe }) => {
  const T = useT(); const [hov, setHov] = useState(null);
  const rects = useMemo(() => squarify(items, 100, 70), [items]);
  const hovered = items.find(i => i.key === hov);
  return (
    <div>
      <div className={`relative w-full border-t-[2px] border-l-[2px] ${T.bd}`} style={{ aspectRatio: '10 / 7' }}>
        {rects.map(r => {
          const pw = r.w; const ph = r.h / 0.7; const on = isOn && isOn(r.key); const dim = hov && hov !== r.key;
          return (
            <button key={r.key} onClick={() => onPick && onPick(r.key)} onMouseEnter={() => setHov(r.key)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(r.key)} onBlur={() => setHov(null)}
              aria-label={`${r.label}: ${r.value}`} className={`absolute text-left overflow-hidden border-r-[2px] border-b-[2px] ${T.bd} p-1.5 sm:p-2 transition-opacity duration-150 ${FOCUS} focus-visible:z-10`}
              style={{ left: `${r.x}%`, top: `${r.y / 0.7}%`, width: `${pw}%`, height: `${ph}%`, backgroundColor: r.color, color: textOn(r.color), opacity: dim ? 0.55 : 1, boxShadow: on ? `inset 0 0 0 4px ${T.halo}` : 'none' }}>
              {pw > 10 && ph > 12 && <div className="text-[10px] sm:text-xs font-black leading-tight truncate">{r.label}</div>}
              {pw > 17 && ph > 25 ? <div className="text-2xl sm:text-4xl font-black leading-none mt-1 tabular-nums">{r.value}</div> : (pw > 10 && ph > 12 && <div className="text-[10px] font-black leading-none mt-0.5">{r.value}</div>)}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] font-bold mt-3 min-h-[1.25rem] opacity-80">{hovered ? describe(hovered) : 'Passe o mouse sobre um bloco para ver os detalhes. Toque para filtrar.'}</div>
    </div>
  );
};

// Barras horizontais com valor, texto lateral e marcador opcional
const HBars = ({ rows, onPick, isOn, limit = 8, valueLabel, empty = 'Sem dados neste recorte.' }) => {
  const T = useT(); const [all, setAll] = useState(false);
  if (!rows.length) return <div className="text-xs font-bold opacity-60 py-6 text-center">{empty}</div>;
  const shown = all ? rows : rows.slice(0, limit); const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <div className="flex flex-col gap-1.5">
      {shown.map(r => {
        const on = isOn && isOn(r.key);
        return (
          <button key={r.key} onClick={() => onPick && onPick(r.key)} className={`flex items-center gap-2 text-left group ${FOCUS}`} title={r.title || r.label}>
            <span className={`w-24 sm:w-32 text-[11px] font-black truncate flex-shrink-0 ${on ? 'underline decoration-2' : ''}`}>{r.label}</span>
            <span className={`relative flex-1 h-4 border-[2px] ${T.bd} ${T.sunken}`}>
              <span className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out group-hover:opacity-80" style={{ width: `${(r.value / max) * 100}%`, backgroundColor: r.color || C.cyan, boxShadow: on ? `inset 0 0 0 2px ${T.halo}` : 'none' }} />
            </span>
            <span className="w-24 sm:w-28 text-right text-[10px] font-black tabular-nums flex-shrink-0">{valueLabel ? valueLabel(r) : <>{r.value}{r.side ? <span className="opacity-60"> {r.side}</span> : null}</>}</span>
          </button>
        );
      })}
      {rows.length > limit && <button onClick={() => setAll(!all)} className={`self-start mt-1 text-[10px] font-black underline ${FOCUS}`}>{all ? 'Mostrar menos' : `Mostrar todos (${rows.length})`}</button>}
    </div>
  );
};

// Colunas verticais (pode ser empilhada) com eixo
const VBars = ({ data, onPick, isOn, fmt = (v) => v, describe, height = 'h-44', labelEvery = 1 }) => {
  const T = useT(); const [hov, setHov] = useState(null);
  const max = Math.max(...data.map(d => d.total), 0); const top = niceCeil(max);
  const info = data.find(d => d.key === hov);
  return (
    <div>
      <div className="text-[11px] font-bold min-h-[2.25rem] mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {info ? describe(info) : <span className="opacity-60">Passe o mouse ou toque numa barra.</span>}
      </div>
      <div className="flex gap-2">
        <div className={`flex flex-col justify-between text-[9px] font-black tabular-nums text-right w-8 flex-shrink-0 ${height} pb-0`}>
          <span>{fmt(top)}</span><span>{fmt(top / 2)}</span><span>0</span>
        </div>
        <div className="flex-1 overflow-x-auto scrollbar-hide pb-6">
          <div className={`relative flex items-end gap-1 ${height} border-b-[2px] ${T.bd}`} style={{ minWidth: `${data.length * 18}px` }} onMouseLeave={() => setHov(null)}>
            <div className="absolute inset-x-0 top-0 border-t border-dashed pointer-events-none" style={{ borderColor: T.grid }} />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed pointer-events-none" style={{ borderColor: T.grid }} />
            {data.map((d, i) => (
              <button key={d.key} onMouseEnter={() => setHov(d.key)} onClick={() => { setHov(d.key); onPick && onPick(d.key); }} aria-label={`${d.label}: ${fmt(d.total)}`}
                className={`relative flex-1 min-w-[14px] h-full flex flex-col justify-end ${FOCUS}`} style={{ backgroundColor: isOn && isOn(d.key) ? `${C.pink}22` : 'transparent' }}>
                <div className="flex flex-col-reverse transition-[height] duration-700 ease-out" style={{ height: `${top ? (d.total / top) * 100 : 0}%` }}>
                  {d.segs.map((s, j) => <div key={j} title={s.name} style={{ height: `${d.total ? (s.value / d.total) * 100 : 0}%`, backgroundColor: s.color }} className={`${j ? `border-b ${T.dk ? 'border-gray-900' : 'border-white'}` : ''}`} />)}
                </div>
                {i % labelEvery === 0 && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black whitespace-nowrap">{d.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Calendário mês × ano
const CalendarHeat = ({ months, metric, onYear, isOnYear }) => {
  const T = useT(); const [hov, setHov] = useState(null);
  const MS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']; const MN = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const val = (c) => metric === 'horas' ? c.hours : c.count;
  const max = Math.max(1, ...months.flatMap(m => m.row.map(val)));
  return (
    <div>
      <div className="text-[11px] font-bold min-h-[1.25rem] mb-2">{hov ? `${MN[hov.m]}/${hov.y}: ${hov.c.count} ${hov.c.count === 1 ? 'jogo' : 'jogos'}${hov.c.hours ? `, ${fmtHours(hov.c.hours)}` : ''}${hov.c.items.length ? `. ${hov.c.items.slice(0, 3).map(i => i.title).join(', ')}${hov.c.items.length > 3 ? '…' : ''}` : ''}` : <span className="opacity-60">Cada célula é um mês. Passe o mouse ou toque.</span>}</div>
      <div className="overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: 340 }}>
          <div className="flex gap-1 mb-1 pl-11">{MS.map((m, i) => <span key={i} className="flex-1 text-center text-[9px] font-black opacity-60">{m}</span>)}</div>
          {months.map(m => (
            <div key={m.year} className="flex gap-1 mb-1 items-center">
              <button onClick={() => onYear && onYear(m.year)} className={`w-10 text-[10px] font-black text-right pr-1 ${isOnYear && isOnYear(m.year) ? 'underline decoration-2' : ''} ${FOCUS}`}>{m.year}</button>
              {m.row.map((c, i) => {
                const v = val(c); const a = v ? 0.2 + 0.8 * (v / max) : 0;
                return <button key={i} onMouseEnter={() => setHov({ y: m.year, m: i, c })} onClick={() => setHov({ y: m.year, m: i, c })} aria-label={`${MN[i]} ${m.year}: ${c.count}`} className={`flex-1 h-7 border text-[10px] font-black ${T.bdSoft} ${FOCUS}`} style={{ backgroundColor: v ? `rgba(8,145,178,${a})` : 'transparent', color: a > 0.55 ? '#fff' : 'inherit' }}>{c.count || ''}</button>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Dispersão tempo × nota
const Scatter = ({ points, onOpen, corr }) => {
  const T = useT(); const [act, setAct] = useState(null);
  if (!points.length) return <div className="text-xs font-bold opacity-60 py-6 text-center">Precisa de jogos com tempo e nota.</div>;
  const W = 880, H = 320, ml = 40, mr = 16, mt = 12, mb = 30;
  const xMax = niceCeil(Math.max(...points.map(p => p.hours))); const nMin = Math.min(5, Math.floor(Math.min(...points.map(p => p.nota)) - 0.5)); const yMin = Math.max(0, nMin); const yMax = 10;
  const sx = (h) => ml + (h / xMax) * (W - ml - mr); const sy = (n) => mt + (1 - (n - yMin) / (yMax - yMin)) * (H - mt - mb);
  // tendência (mínimos quadrados)
  const n = points.length; const mx = mean(points.map(p => p.hours)); const my = mean(points.map(p => p.nota));
  let sxy = 0, sxx = 0; points.forEach(p => { sxy += (p.hours - mx) * (p.nota - my); sxx += (p.hours - mx) ** 2; });
  const slope = sxx ? sxy / sxx : 0; const icpt = my - slope * mx;
  const yTicks = []; for (let v = yMin; v <= yMax; v += (yMax - yMin) > 6 ? 2 : 1) yTicks.push(v);
  const xTicks = [0, 1, 2, 3, 4].map(i => (xMax / 4) * i);
  return (
    <div>
      <div className="text-[11px] font-bold min-h-[2.25rem] mb-1">{act ? <span><b>{act.title}</b>, {act.console}, {fmtHours(act.hours)}, nota {act.notaLabel}. <button className={`underline ${FOCUS}`} onClick={() => onOpen && onOpen(act)}>Abrir ficha</button></span> : <span className="opacity-60">Cada ponto é um jogo. {corr !== null && corr !== undefined ? `Correlação tempo × nota: ${corr.toFixed(2).replace('.', ',')} (n=${n}).` : `Poucos jogos (n=${n}) para calcular correlação.`}</span>}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-w-4xl mx-auto block" role="img" aria-label="Dispersão entre horas jogadas e nota">
        {yTicks.map(v => <g key={v}><line x1={ml} x2={W - mr} y1={sy(v)} y2={sy(v)} stroke={T.grid} strokeDasharray="3 3" /><text x={ml - 6} y={sy(v) + 3} textAnchor="end" fontSize="10" fontWeight="800" fill="currentColor">{v}</text></g>)}
        {xTicks.map(v => <g key={v}><line x1={sx(v)} x2={sx(v)} y1={mt} y2={H - mb} stroke={T.grid} strokeDasharray="3 3" /><text x={sx(v)} y={H - mb + 14} textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{Math.round(v)}h</text></g>)}
        <rect x={ml} y={mt} width={W - ml - mr} height={H - mt - mb} fill="none" stroke={T.dk ? '#d1d5db' : '#000'} strokeWidth="2" />
        {n >= 8 && <line x1={sx(0)} y1={sy(Math.max(yMin, Math.min(yMax, icpt)))} x2={sx(xMax)} y2={sy(Math.max(yMin, Math.min(yMax, icpt + slope * xMax)))} stroke={C.pink} strokeWidth="2" strokeDasharray="6 4" />}
        {points.map((p, i) => <circle key={p.id || i} cx={sx(p.hours)} cy={sy(p.nota)} r={act && act === p ? 8 : 5} fillOpacity="0.9" fill={familyColor(p.family, T)} stroke={T.dk ? '#030712' : '#fff'} strokeWidth="1.5" onMouseEnter={() => setAct(p)} onClick={() => setAct(p)} style={{ cursor: 'pointer' }} />)}
      </svg>
    </div>
  );
};

// Acumulado: compras × assinaturas
const CumLine = ({ points, series }) => {
  const T = useT(); const [idx, setIdx] = useState(null); const ref = useRef(null);
  if (!points.length) return <div className="text-xs font-bold opacity-60 py-6 text-center">Informe a data de compra do console ou tenha jogos com data de início.</div>;
  const W = 880, H = 320, ml = 66, mr = 18, mt = 14, mb = 28;
  const t0 = points[0].t; const t1 = points[points.length - 1].t || t0 + 1;
  const vMax = niceCeil(Math.max(...points.flatMap(p => series.map(s => p[s.key] || 0)), 1));
  const sx = (t) => ml + ((t - t0) / Math.max(1, t1 - t0)) * (W - ml - mr); const sy = (v) => mt + (1 - v / vMax) * (H - mt - mb);
  const path = (k, step) => points.map((p, i) => { const x = sx(p.t); const y = sy(p[k] || 0); if (!i) return `M${x},${y}`; return step ? `L${x},${sy(points[i - 1][k] || 0)} L${x},${y}` : `L${x},${y}`; }).join(' ');
  const move = (e) => { const el = ref.current; if (!el) return; const rect = el.getBoundingClientRect(); const px = ((e.clientX - rect.left) / rect.width) * W; const t = t0 + ((px - ml) / (W - ml - mr)) * (t1 - t0); let b = 0, bd = 1e18; points.forEach((p, i) => { const d = Math.abs(p.t - t); if (d < bd) { bd = d; b = i; } }); setIdx(b); };
  const cur = points[idx === null ? points.length - 1 : idx];
  const yrTicks = []; const d0 = new Date(t0); const d1 = new Date(t1); for (let y = d0.getFullYear() + 1; y <= d1.getFullYear(); y++) yrTicks.push(new Date(y, 0, 1, 12).getTime());
  return (
    <div>
      <div className="text-[11px] font-bold min-h-[2.5rem] mb-1 flex flex-wrap gap-x-4 gap-y-1">
        <span className="font-black">{new Date(cur.t).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
        {series.map(s => <span key={s.key} className="flex items-center gap-1"><span className={`w-3 h-3 border-[2px] ${T.bd}`} style={{ backgroundColor: s.color }} />{s.label}: {moneyShort(cur[s.key])}</span>)}
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none max-w-4xl mx-auto block" onMouseMove={move} onClick={move} onMouseLeave={() => setIdx(null)} role="img" aria-label="Gasto acumulado em jogos comparado a assinaturas">
        {[0, 0.5, 1].map(f => <g key={f}><line x1={ml} x2={W - mr} y1={sy(vMax * f)} y2={sy(vMax * f)} stroke={T.grid} strokeDasharray="3 3" /><text x={ml - 6} y={sy(vMax * f) + 3} textAnchor="end" fontSize="10" fontWeight="800" fill="currentColor">{moneyShort(vMax * f)}</text></g>)}
        {yrTicks.map(t => <g key={t}><line x1={sx(t)} x2={sx(t)} y1={mt} y2={H - mb} stroke={T.grid} strokeDasharray="2 4" /><text x={sx(t)} y={H - mb + 14} textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{new Date(t).getFullYear()}</text></g>)}
        <rect x={ml} y={mt} width={W - ml - mr} height={H - mt - mb} fill="none" stroke={T.dk ? '#d1d5db' : '#000'} strokeWidth="2" />
        {series.map(s => <path key={s.key} d={path(s.key, s.step)} fill="none" stroke={s.color} strokeWidth={s.key === 'buy' ? 4 : 2.5} strokeLinejoin="round" strokeDasharray={s.dash || ''} />)}
        {idx !== null && <line x1={sx(cur.t)} x2={sx(cur.t)} y1={mt} y2={H - mb} stroke={T.dk ? '#fff' : '#000'} strokeWidth="1" />}
        {series.map(s => <circle key={s.key} cx={sx(cur.t)} cy={sy(cur[s.key] || 0)} r="4.5" fill={s.color} stroke={T.dk ? '#030712' : '#fff'} strokeWidth="1.5" />)}
      </svg>
    </div>
  );
};

// Matriz de cruzamento
const Matrix = ({ recs, rowDim, colDim, sel, onSel }) => {
  const T = useT(); const m = useMemo(() => buildMatrix(recs, rowDim, colDim), [recs, rowDim, colDim]);
  if (!m.rows.length || !m.cols.length) return <div className="text-xs font-bold opacity-60 py-8 text-center">Sem dados para cruzar.</div>;
  return (
    <div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="border-collapse w-full" style={{ minWidth: `${130 + m.cols.length * 50}px` }}>
          <thead><tr><th className={`sticky left-0 z-10 ${T.surface}`} />{m.cols.map(c => <th key={c} className="px-1 pb-1.5 text-[10px] font-black text-center whitespace-nowrap">{colDim === 'nota' ? (c === 'S' ? 'S' : `${c}`) : c}</th>)}<th className="px-2 pb-1.5 text-[10px] font-black text-right">Total</th></tr></thead>
          <tbody>
            {m.rows.map(r => (
              <tr key={r}>
                <th className={`sticky left-0 z-10 pr-2 text-left text-[11px] font-black whitespace-nowrap max-w-[150px] truncate ${T.surface}`}>{r}</th>
                {m.cols.map(c => {
                  const list = m.cells[`${r}\u0001${c}`] || []; const n = list.length; const a = n ? 0.15 + 0.85 * (n / m.max) : 0; const isSel = sel && sel.r === r && sel.c === c;
                  return <td key={c} className={`border-[2px] ${T.bd} p-0`}><button disabled={!n} onClick={() => onSel(isSel ? null : { r, c, list })} aria-label={`${r}, ${c}: ${n}`} className={`w-full h-10 text-[11px] font-black tabular-nums ${FOCUS} disabled:cursor-default`} style={{ backgroundColor: n ? `rgba(8,145,178,${a})` : 'transparent', color: a > 0.5 ? '#fff' : 'inherit', boxShadow: isSel ? `inset 0 0 0 4px ${C.pink}` : 'none' }}>{n || ''}</button></td>;
                })}
                <td className="pl-2 text-right text-[11px] font-black tabular-nums">{m.rowTot[r]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {m.best && m.best.n > 0 && <p className="text-[11px] font-bold opacity-80 mt-3">Maior concentração: {m.best.r} × {m.best.c}, com {m.best.n} {m.best.n === 1 ? 'jogo' : 'jogos'}.</p>}
    </div>
  );
};

// ---------------------------------------------------------------------
// DASHBOARD
// Seis abas: Visão geral, Acervo (classes e subclasses), Tempo, Dinheiro,
// Cruzamentos e Backlog. Clicar em qualquer elemento liga/desliga um filtro.
// ---------------------------------------------------------------------
const fmtNum1 = (n) => n === null || n === undefined ? '-' : (Math.round(n * 10) / 10).toString().replace('.', ',');
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

const StatStrip = ({ items }) => {
  const T = useT();
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 border-t-[2px] border-l-[2px] ${T.bd} ${T.surface}`}>
      {items.map(([k, v, s]) => <Tile key={k}><span className="text-[10px] font-black opacity-70">{k}</span><span className="text-xl sm:text-2xl font-black tabular-nums mt-1">{v}</span>{s && <span className="text-[10px] font-bold opacity-60 mt-0.5">{s}</span>}</Tile>)}
    </div>
  );
};

const Dashboard = ({ recs, allRecs, filters, toggle, clearFilters, onOpen, onList, psCfg, nowMs, initialSub = 'visao' }) => {
  const T = useT();
  const [sub, setSub] = useState(initialSub);
  const [yearMetric, setYearMetric] = useState('jogos');
  const [calMetric, setCalMetric] = useState('jogos');
  const [cross, setCross] = useState({ row: 'console', col: 'nota', cell: null });
  const fin = useMemo(() => recs.filter(r => r.status === 'Finalizado'), [recs]);
  const back = useMemo(() => recs.filter(r => r.status === 'Backlog'), [recs]);
  const A = useMemo(() => analyze(fin, back), [fin, back]);
  const ps = useMemo(() => psCompare(allRecs, psCfg, nowMs), [allRecs, psCfg, nowMs]);
  const pal = catColors(T);
  const on = (id) => (k) => (filters[id] || []).includes(k);
  const pick = (id) => (k) => toggle(id, k);
  const nFin = useCountUp(A.nFin); const nHours = useCountUp(Math.round(A.hours)); const nBack = useCountUp(A.nBack);
  const activeCount = Object.values(filters).reduce((s, a) => s + a.length, 0);
  const subs = [['visao', 'Visão geral'], ['acervo', 'Acervo'], ['tempo', 'Tempo'], ['dinheiro', 'Dinheiro'], ['cruzamentos', 'Cruzamentos'], ['backlog', 'Backlog']];

  const famRows = A.byFamily.map(f => ({ key: f.key, label: f.key, value: f.count, color: familyColor(f.key, T) }));
  const consoleItems = A.byConsole.map(c => ({ key: c.key, label: c.key, value: c.count, color: familyColor(getFamily(c.key), T), avg: c.avgNota, hours: c.hours, n: c.notaN }));
  const famSegs = (y, metric) => Object.keys(metric === 'horas' ? y.byFamH : y.byFam).map(f => ({ name: f, color: familyColor(f, T), value: (metric === 'horas' ? y.byFamH : y.byFam)[f] })).filter(s => s.value > 0);
  const yearData = A.years.map(y => { const segs = famSegs(y, yearMetric); return { key: y.year, label: A.years.length > 9 ? `'${y.year.slice(2)}` : y.year, total: yearMetric === 'horas' ? y.hours : y.count, segs }; });

  const kpiMosaic = () => (
    <div className={`grid grid-cols-2 md:grid-cols-6 border-t-[2px] border-l-[2px] ${T.bd} ${T.shadow}`}>
      <Tile className="col-span-2 md:col-span-3 md:row-span-2 min-h-[150px]" style={{ background: C.cyan, color: '#fff' }} onClick={onList}>
        <span className="text-xs font-black">Jogos finalizados</span>
        <div>
          <div className="text-7xl sm:text-8xl font-black leading-none tracking-tighter tabular-nums">{Math.round(nFin)}</div>
          <div className="text-[11px] font-bold mt-2 opacity-90">{A.unique} jogos diferentes{A.replays > 0 ? `, com ${A.replays} zeradas repetidas (outro final, personagem ou modo)` : ''}. Toque para ver a lista.</div>
        </div>
      </Tile>
      <Tile className="md:col-span-2" style={{ background: C.pink, color: '#fff' }}>
        <span className="text-xs font-black">Horas jogadas</span>
        <div><div className="text-4xl sm:text-5xl font-black leading-none tabular-nums">{Math.round(nHours).toLocaleString('pt-BR')}h</div><div className="text-[11px] font-bold mt-1 opacity-90">{A.hoursN ? `média de ${fmtHoursShort(A.avgHours)} em ${A.hoursN} jogos com tempo` : 'sem tempo registrado'}</div></div>
      </Tile>
      <Tile className="md:col-span-1" style={{ background: C.amber, color: '#000' }}>
        <span className="text-xs font-black">Nota média</span>
        <div><div className="text-4xl sm:text-5xl font-black leading-none tabular-nums">{A.avgNota !== null ? fmtNum1(A.avgNota) : '-'}</div><div className="text-[11px] font-bold mt-1">{A.nNota} notas{A.sCount ? `, ${A.sCount} rank S à parte` : ''}</div></div>
      </Tile>
      <Tile className={`col-span-2 md:col-span-3 ${T.surface}`}>
        <span className="text-xs font-black">Backlog</span>
        <div className="flex items-end justify-between gap-3"><div className="text-4xl sm:text-5xl font-black leading-none tabular-nums">{Math.round(nBack)}</div><div className="text-[11px] font-bold opacity-70 text-right">{A.nStarted} já iniciados.<br />{A.nBack - A.nStarted} na fila.</div></div>
      </Tile>
    </div>
  );

  // --------------------------- VISÃO GERAL
  const renderVisao = () => (
    <div className="flex flex-col gap-4">
      {kpiMosaic()}
      <StatStrip items={[['Platinas', A.platinas, 'Condição contém "platina"'], ['Rank S', A.sCount, 'obras-primas'], ['Investido', moneyShort(A.spent), `${A.nPriced} de ${A.nAll} jogos com preço`], ['Economizado', moneyShort(A.saved), A.discountPct !== null ? `${Math.round(A.discountPct)}% abaixo do preço de tabela` : 'sem preço de tabela']]} />
      <Card title="Biblioteca por console" hint="A área é o número de jogos finalizados. Cor: família do console.">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {famRows.map(f => <Chip key={f.key} active={on('family')(f.key)} swatch={f.color} onClick={() => pick('family')(f.key)}>{f.label} <span className="opacity-60">{f.value}</span></Chip>)}
        </div>
        <Treemap items={consoleItems} onPick={pick('console')} isOn={on('console')} describe={(c) => `${c.label}: ${c.value} ${c.value === 1 ? 'jogo' : 'jogos'} (${pct(c.value, A.nFin)}%), ${fmtHours(c.hours) || 'sem tempo'}${c.avg !== null ? `, nota média ${fmtNum1(c.avg)} (n=${c.n})` : ''}`} />
      </Card>
      <Card title="Finalizados por ano" right={<Seg value={yearMetric} onChange={setYearMetric} options={[{ id: 'jogos', label: 'Jogos' }, { id: 'horas', label: 'Horas' }]} />}>
        {yearData.length ? <VBars data={yearData} fmt={(v) => yearMetric === 'horas' ? `${Math.round(v)}h` : Math.round(v)} onPick={pick('ano')} isOn={on('ano')} labelEvery={1}
          describe={(d) => <><span className="text-base font-black">{d.key}</span><span>{yearMetric === 'horas' ? fmtHours(d.total) : `${d.total} ${d.total === 1 ? 'jogo' : 'jogos'}`}</span>{d.segs.map(s => <span key={s.name} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 border ${T.bd}`} style={{ backgroundColor: s.color }} />{s.name} {yearMetric === 'horas' ? fmtHoursShort(s.value) : s.value}</span>)}</>} /> : <div className="text-xs font-bold opacity-60 py-6 text-center">Nenhum jogo com data de término neste recorte.</div>}
        {A.undatedFin > 0 && <p className="text-[10px] font-bold opacity-60 mt-2">{A.undatedFin} {A.undatedFin === 1 ? 'jogo sem' : 'jogos sem'} data de término ficam fora deste gráfico.</p>}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Notas" hint="Cada barra vai de N,0 a N,9. S fica à parte.">
          <VBars data={A.notaHist.filter(n => n.count || ['10', '9', '8', '7', '6', '5', 'S'].includes(n.key)).slice().reverse().map(n => ({ key: n.key, label: n.key, total: n.count, segs: [{ name: 'jogos', color: n.key === 'S' ? C.pink : n.key >= 9 ? C.cyan : n.key >= 7 ? C.amber : T.ink, value: n.count }] }))} fmt={(v) => Math.round(v)} onPick={pick('nota')} isOn={on('nota')} height="h-36"
            describe={(d) => <><span className="text-base font-black">Nota {d.key}</span><span>{d.total} {d.total === 1 ? 'jogo' : 'jogos'}</span></>} />
          {A.notaMissing > 0 && <p className="text-[10px] font-bold opacity-60 mt-2">{A.notaMissing} {A.notaMissing === 1 ? 'jogo' : 'jogos'} sem nota.</p>}
        </Card>
        <Card title="Dificuldade" hint="A é a mais difícil">
          <HBars rows={A.byDif.map(d => ({ key: d.key, label: `Nível ${d.key}`, value: d.count, color: DIFF_COLOR[d.key], side: `${pct(d.count, A.nFin)}%` }))} onPick={pick('dif')} isOn={on('dif')} limit={5} valueLabel={(r) => r.value} />
        </Card>
      </div>
    </div>
  );

  // --------------------------- ACERVO
  const renderAcervo = () => {
    const gRows = A.byGenre.map((g, i) => ({ key: g.key, label: g.key, value: g.count, color: pal[i % pal.length], side: g.avgNota !== null ? `nota ${fmtNum1(g.avgNota)}` : '', title: `${g.key}: ${g.count} jogos, ${g.notaN} com nota` }));
    const sRows = A.bySub.map((g, i) => ({ key: g.key, label: g.key.split(' / ')[1], value: g.count, color: pal[A.byGenre.findIndex(x => x.key === g.key.split(' / ')[0]) % pal.length], side: g.key.split(' / ')[0], title: g.key }));
    const frRows = A.byFranchise.map((f, i) => ({ key: f.key, label: f.key, value: f.count, color: pal[i % pal.length], side: `${fmtHoursShort(f.hours)}`, title: `${f.key}: ${f.count} jogos, ${fmtHours(f.hours)}${f.avgNota !== null ? `, nota média ${fmtNum1(f.avgNota)}` : ''}` }));
    const inFr = fin.filter(r => r.franchise).length;
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Gêneros (classe)" hint="Barra: jogos. Ao lado: nota média"><HBars rows={gRows} onPick={pick('genre')} isOn={on('genre')} limit={9} valueLabel={(r) => `${r.value}${r.side ? ' · ' + r.side : ''}`} /></Card>
          <Card title="Subgêneros (subclasse)" hint="Cor segue a classe do gênero"><HBars rows={sRows} onPick={(k) => toggle('genre', k.split(' / ')[0])} isOn={(k) => on('genre')(k.split(' / ')[0])} limit={9} valueLabel={(r) => `${r.value} · ${r.side}`} empty="Nenhum gênero tem subclasse neste recorte (use o formato Ação / Mundo Aberto)." /></Card>
        </div>
        <Card title="Franquias" hint={`${A.byFranchise.length} franquias, ${inFr} de ${A.nFin} jogos. Regras em Config.`}>
          <HBars rows={frRows} onPick={pick('franchise')} isOn={on('franchise')} limit={10} valueLabel={(r) => `${r.value} · ${r.side}`} />
          {A.nFin - inFr > 0 && <p className="text-[10px] font-bold opacity-60 mt-2">{A.nFin - inFr} jogos sem franquia definida. Em Config, a lista de sugestões ajuda a agrupar.</p>}
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Formato" hint="Físico, digital ou loader">
            <HBars rows={A.bySupCat.map((s, i) => ({ key: s.key, label: s.key, value: s.count, color: pal[i % pal.length], side: `${pct(s.count, A.nFin)}%` }))} onPick={pick('supCat')} isOn={on('supCat')} limit={6} valueLabel={(r) => `${r.value} · ${r.side}`} />
            <div className={`border-t-[2px] ${T.bd} mt-3 pt-3`}><div className="text-[11px] font-black mb-2 opacity-70">Suportes</div>
              <HBars rows={A.bySupSub.map((s, i) => ({ key: s.key, label: s.key.split(' / ')[1], value: s.count, color: pal[(['Físico', 'Digital', 'Loader'].indexOf(s.key.split(' / ')[0]) + 12) % pal.length], side: s.key.split(' / ')[0] }))} onPick={(k) => toggle('suporte', A.bySupSub.find(s => s.key === k)?.items[0]?.supRaw || '')} isOn={(k) => on('suporte')(A.bySupSub.find(s => s.key === k)?.items[0]?.supRaw)} limit={6} valueLabel={(r) => `${r.value} · ${r.side}`} /></div>
          </Card>
          <Card title="Consoles" hint="Cor: família">
            <HBars rows={A.byConsole.map(c => ({ key: c.key, label: c.key, value: c.count, color: familyColor(getFamily(c.key), T), side: c.avgNota !== null ? `nota ${fmtNum1(c.avgNota)}` : '' }))} onPick={pick('console')} isOn={on('console')} limit={10} valueLabel={(r) => `${r.value}${r.side ? ' · ' + r.side : ''}`} />
          </Card>
        </div>
      </div>
    );
  };

  // --------------------------- TEMPO
  const renderTempo = () => {
    const longest = [...fin].filter(r => r.hours).sort((a, b) => b.hours - a.hours).slice(0, 8);
    const fastest = [...fin].filter(r => r.hours && r.hours >= 1).sort((a, b) => a.hours - b.hours).slice(0, 8);
    const byG = A.byGenre.filter(g => g.hoursN >= 1).sort((a, b) => b.avgHours - a.avgHours);
    return (
      <div className="flex flex-col gap-4">
        <StatStrip items={[['Tempo total', fmtHours(A.hours) || '-', `${A.hoursN} jogos com tempo`], ['Média por jogo', fmtHoursShort(A.avgHours), 'só jogos com tempo'], ['Dias entre início e fim', A.avgDays !== null ? `${Math.round(A.avgDays)}` : '-', 'média (calendário)'], ['Correlação tempo × nota', A.corr !== null ? A.corr.toFixed(2).replace('.', ',') : '-', A.scatter.length ? `n=${A.scatter.length}` : 'poucos dados']]} />
        <Card title="Quando você zerou" right={<Seg value={calMetric} onChange={setCalMetric} options={[{ id: 'jogos', label: 'Jogos' }, { id: 'horas', label: 'Horas' }]} />}>
          {A.months.length ? <CalendarHeat months={A.months} metric={calMetric} onYear={pick('ano')} isOnYear={on('ano')} /> : <div className="text-xs font-bold opacity-60 py-6 text-center">Sem datas de término neste recorte.</div>}
        </Card>
        <Card title="Tempo × nota" hint="Cor: família do console. Linha: tendência"><Scatter points={A.scatter} corr={A.corr} onOpen={onOpen} /></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Duração do jogo" hint="Horas jogadas"><VBars data={A.hoursBins.map(b => ({ key: b.label, label: b.label, total: b.count, segs: [{ name: 'jogos', color: C.cyan, value: b.count }] }))} fmt={(v) => Math.round(v)} height="h-36" describe={(d) => <><span className="text-base font-black">{d.key}</span><span>{d.total} jogos</span></>} /></Card>
          <Card title="Tempo até terminar" hint="Dias entre início e fim"><VBars data={A.daysBins.map(b => ({ key: b.label, label: b.label.replace(' dias', 'd').replace('1–3 meses', '1–3m').replace('3–12 meses', '3–12m').replace('1 ano+', '1a+'), total: b.count, segs: [{ name: 'jogos', color: C.pink, value: b.count }] }))} fmt={(v) => Math.round(v)} height="h-36" describe={(d) => <><span className="text-base font-black">{d.key}</span><span>{d.total} jogos</span></>} /></Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Mais longos"><HBars rows={longest.map(r => ({ key: r.id, label: r.title, value: r.hours, color: familyColor(r.family, T) }))} onPick={(id) => onOpen(fin.find(r => r.id === id))} valueLabel={(r) => fmtHoursShort(r.value)} limit={8} /></Card>
          <Card title="Mais curtos (1h ou mais)"><HBars rows={fastest.map(r => ({ key: r.id, label: r.title, value: r.hours, color: familyColor(r.family, T) }))} onPick={(id) => onOpen(fin.find(r => r.id === id))} valueLabel={(r) => fmtHoursShort(r.value)} limit={8} /></Card>
        </div>
        <Card title="Horas médias por gênero" hint="Média só entre jogos com tempo registrado"><HBars rows={byG.map((g, i) => ({ key: g.key, label: g.key, value: g.avgHours, color: pal[i % pal.length], side: `n=${g.hoursN}` }))} onPick={pick('genre')} isOn={on('genre')} limit={8} valueLabel={(r) => `${fmtHoursShort(r.value)} · ${r.side}`} /></Card>
      </div>
    );
  };

  // --------------------------- DINHEIRO
  const renderDinheiro = () => {
    const disc = A.discounts.slice(0, 12); const dMax = Math.max(...disc.map(r => r.orig), 1);
    const ph = A.perHour; const cheap = ph.slice(0, 6); const dear = [...ph].reverse().slice(0, 6);
    const sp = (ps.totals);
    const series = [{ key: 'buy', label: 'Jogos comprados', color: C.cyan, step: true }, { key: 'ess', label: 'Essential', color: T.dk ? '#9ca3af' : '#6b7280', dash: '5 4' }, { key: 'extra', label: 'Extra', color: C.pink }, { key: 'deluxe', label: 'Deluxe', color: C.amber }];
    const covs = sp ? [['Extra', sp.extra], ['Deluxe', sp.deluxe]].map(([n, c]) => ({ n, c, need: ps.covNeeded(c) })) : [];
    return (
      <div className="flex flex-col gap-4">
        <StatStrip items={[['Gasto com jogos', moneyShort(A.spent), `${A.nPriced} de ${A.nAll} jogos têm preço`], ['Valor de tabela', moneyShort(A.listValue), 'jogos com preço cheio'], ['Economia', moneyShort(A.saved), A.discountPct !== null ? `${Math.round(A.discountPct)}% de desconto médio ponderado` : ''], ['Custo por hora', A.cphAvg !== null ? money(A.cphAvg) : '-', `${ph.length} jogos com preço e tempo`]]} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Maiores descontos" hint="Pago (cheio) + economia = preço de tabela">
            <div className="flex flex-col gap-1.5">
              {disc.length === 0 && <div className="text-xs font-bold opacity-60 py-6 text-center">Nenhum jogo com preço pago e preço de tabela.</div>}
              {disc.map(r => (
                <button key={r.id} onClick={() => onOpen(r)} className={`flex items-center gap-2 text-left ${FOCUS}`}>
                  <span className="w-24 sm:w-32 text-[11px] font-black truncate flex-shrink-0">{r.title}</span>
                  <span className={`flex h-4 border-[2px] ${T.bd} ${T.sunken}`} style={{ width: `${(r.orig / dMax) * 100}%`, minWidth: 30 }}>
                    <span style={{ width: `${(r.preco / r.orig) * 100}%`, backgroundColor: C.cyan }} /><span className="flex-1" style={{ backgroundColor: C.pink }} />
                  </span>
                  <span className="text-[10px] font-black tabular-nums whitespace-nowrap">{moneyShort(r.preco)} <span className="opacity-60">(-{Math.round((r.saving / r.orig) * 100)}%)</span></span>
                </button>
              ))}
              <div className="flex gap-4 text-[10px] font-bold mt-1"><span className="flex items-center gap-1"><span className="w-3 h-3" style={{ backgroundColor: C.cyan }} />pago</span><span className="flex items-center gap-1"><span className="w-3 h-3" style={{ backgroundColor: C.pink }} />economia</span></div>
            </div>
          </Card>
          <Card title="Faixas de preço pago" hint="Só jogos com preço informado"><VBars data={A.priceBins.map(b => ({ key: b.label, label: b.label.replace('até ', '≤').replace('R$ ', ''), total: b.count, segs: [{ name: 'jogos', color: C.amber, value: b.count }] }))} fmt={(v) => Math.round(v)} height="h-36" describe={(d) => <><span className="text-base font-black">{d.key}</span><span>{d.total} jogos</span></>} /></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Custo por hora: mais em conta" hint="Preço pago ÷ horas (acima de R$ 0)"><HBars rows={cheap.map(x => ({ key: x.r.id, label: x.r.title, value: x.cph, color: C.cyan }))} onPick={(id) => onOpen(fin.find(r => r.id === id))} valueLabel={(r) => `${money(r.value)}/h`} limit={6} empty="Precisa de jogos com preço e tempo." /></Card>
          <Card title="Custo por hora: mais caro" hint="Preço pago ÷ horas"><HBars rows={dear.map(x => ({ key: x.r.id, label: x.r.title, value: x.cph, color: C.pink }))} onPick={(id) => onOpen(fin.find(r => r.id === id))} valueLabel={(r) => `${money(r.value)}/h`} limit={6} empty="Precisa de jogos com preço e tempo." /></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Gasto por ano de término" hint="Compras dos jogos finalizados"><VBars data={A.spentByYear.map(y => ({ key: y.year, label: A.years.length > 9 ? `'${y.year.slice(2)}` : y.year, total: y.spent, segs: [{ name: 'gasto', color: C.cyan, value: y.spent }] }))} fmt={(v) => v >= 1000 ? `${(v / 1000).toFixed(1).replace('.0', '').replace('.', ',')}k` : Math.round(v)} height="h-36" onPick={pick('ano')} isOn={on('ano')} describe={(d) => <><span className="text-base font-black">{d.key}</span><span>{money(d.total)}</span></>} /></Card>
          <Card title="Gasto por console" hint="Finalizados e backlog"><HBars rows={A.spentByConsole.filter(c => c.spent > 0).map(c => ({ key: c.key, label: c.key, value: c.spent, color: familyColor(getFamily(c.key), T), side: `${c.pricedN} jogos` }))} onPick={pick('console')} isOn={on('console')} limit={8} valueLabel={(r) => `${moneyShort(r.value)} · ${r.side}`} /></Card>
        </div>
        <Card title={`Comprar jogos ou assinar o PS Plus (${psCfg.console || 'PS4'})`} hint={ps.startMs ? `desde ${new Date(ps.startMs).toLocaleDateString('pt-BR')}` : ''}>
          {!ps.startMs ? <div className="text-xs font-bold opacity-70 py-4">Informe em Config a data em que você comprou o console, ou registre a data de início dos jogos.</div> : (
            <>
              <CumLine points={ps.points} series={series} />
              <div className={`grid grid-cols-2 md:grid-cols-4 border-t-[2px] border-l-[2px] ${T.bd} mt-4`}>
                <Tile style={{ background: C.cyan, color: '#fff' }}><span className="text-[10px] font-black">Você gastou em jogos</span><span className="text-xl font-black tabular-nums mt-1">{money(ps.spent)}</span><span className="text-[10px] font-bold opacity-90">{ps.nPriced} de {ps.nGames} jogos têm preço</span></Tile>
                {sp && [['Essential', sp.ess, null], ['Extra', sp.extra, C.pink], ['Deluxe', sp.deluxe, C.amber]].map(([n, v, c]) => (
                  <Tile key={n} style={c ? { background: c, color: textOn(c) } : undefined} className={c ? '' : T.surface}><span className="text-[10px] font-black">{n} por {sp.years.toFixed(1).replace('.', ',')} anos</span><span className="text-xl font-black tabular-nums mt-1">{money(v)}</span><span className="text-[10px] font-bold opacity-80">{v > ps.spent ? `${moneyShort(v - ps.spent)} a mais que as compras` : `${moneyShort(ps.spent - v)} a menos que as compras`}</span></Tile>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-2 text-[11px] font-bold">
                {covs.map(c => (
                  <p key={c.n}><b>{c.n}:</b> {c.need === null ? 'sem gastos registrados.' : c.need > 100 ? `mesmo que o catálogo tivesse todos os ${ps.nPriced} jogos que você comprou, a assinatura sairia ${money(c.c - ps.spent)} mais cara.` : `para empatar, o catálogo precisaria ter coberto ${Math.round(c.need)}% do que você gastou (${money(ps.spent * c.need / 100)}).`}</p>
                ))}
                {ps.hoursPaid > 0 && <p><b>Por hora:</b> suas compras saíram a {money(ps.spent / ps.hoursPaid)}/h (jogos pagos e finalizados). Uma assinatura Extra, se cobrisse todas as {fmtHoursShort(ps.hours)} finalizadas no {psCfg.console || 'PS4'}, sairia a {money(sp.extra / ps.hours)}/h.</p>}
                <p className="opacity-70">Como ler: o Essential dá multiplayer online e jogos mensais, mas não tem catálogo, então não substitui comprar. Só Extra e Deluxe têm catálogo, e ele muda todo mês. Jogos sem preço na planilha contam como R$ 0 e deixam o gasto menor do que o real. A data de compra de cada jogo não existe na planilha: uso a data de início. Os preços de 12 meses usam os valores de antes e depois de 16/04/2025 (editáveis em Config).</p>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  };

  // --------------------------- CRUZAMENTOS
  const renderCruzamentos = () => {
    const base = fin;
    const opts = Object.entries(CROSS_DIMS).map(([id, d]) => ({ id, label: d.label }));
    return (
      <div className="flex flex-col gap-4">
        <Card title="Cruze duas dimensões" hint="Cada célula é uma quantidade de jogos finalizados">
          <div className="flex flex-col gap-3 mb-4">
            <div><div className="text-[10px] font-black opacity-60 mb-1">Linhas</div><Seg value={cross.row} onChange={(id) => setCross({ ...cross, row: id, cell: null })} options={opts} /></div>
            <div><div className="text-[10px] font-black opacity-60 mb-1">Colunas</div><Seg value={cross.col} onChange={(id) => setCross({ ...cross, col: id, cell: null })} options={opts} /></div>
          </div>
          <Matrix recs={base} rowDim={cross.row} colDim={cross.col} sel={cross.cell} onSel={(c) => setCross({ ...cross, cell: c })} />
        </Card>
        {cross.cell && (
          <Card title={`${cross.cell.r} × ${cross.cell.c} (${cross.cell.list.length})`} right={<button onClick={() => setCross({ ...cross, cell: null })} className={`px-2 py-1 border-[2px] text-[10px] font-black ${T.bd} ${FOCUS}`}>Fechar</button>}>
            <div className="max-h-80 overflow-y-auto scrollbar-hide">{cross.cell.list.map(r => <GameThumbRow key={r.id} r={r} onOpen={onOpen} />)}</div>
          </Card>
        )}
      </div>
    );
  };

  // --------------------------- BACKLOG
  const renderBacklog = () => {
    const items = A.backByConsole.map(c => ({ key: c.key, label: c.key, value: c.count, color: familyColor(getFamily(c.key), T) }));
    const queue = [...back].sort((a, b) => (b.started - a.started) || ((a.prio ?? 9999) - (b.prio ?? 9999)));
    const stDays = (r) => r.startMs ? Math.max(0, Math.round((nowMs - r.startMs) / 86400000)) : null;
    return (
      <div className="flex flex-col gap-4">
        <StatStrip items={[['No backlog', A.nBack, `${A.nStarted} iniciados`], ['Valor de tabela', moneyShort(A.backValue), 'preço cheio, ou o pago se não houver'], ['Pago até agora', moneyShort(A.backPaid), `${back.filter(r => r.hasPrice).length} com preço`], ['Jogos grátis', A.backFree, 'preço pago R$ 0,00']]} />
        <Card title="Backlog por console" hint="Cor: família"><Treemap items={items} onPick={pick('console')} isOn={on('console')} describe={(c) => `${c.label}: ${c.value} ${c.value === 1 ? 'jogo' : 'jogos'} no backlog (${pct(c.value, A.nBack)}%)`} /></Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Backlog por gênero"><HBars rows={A.backByGenre.map((g, i) => ({ key: g.key, label: g.key, value: g.count, color: pal[i % pal.length] }))} onPick={pick('genre')} isOn={on('genre')} limit={8} /></Card>
          <Card title="Fila e jogos em andamento" hint="Iniciados primeiro, depois por prioridade">
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {queue.length === 0 && <div className="text-xs font-bold opacity-60 py-6 text-center">Backlog vazio neste recorte.</div>}
              {queue.slice(0, 40).map(r => (
                <button key={r.id} onClick={() => onOpen(r)} className={`w-full flex items-center gap-2 py-2 border-b text-left ${T.bdSoft} ${T.hover} ${FOCUS}`}>
                  <span className={`w-7 h-6 flex items-center justify-center border-[2px] ${T.bd} text-[10px] font-black flex-shrink-0`} style={r.started ? { backgroundColor: C.cyan, color: '#fff' } : r.prio ? { backgroundColor: r.prio <= 5 ? C.pink : r.prio <= 12 ? C.amber : 'transparent', color: r.prio <= 5 ? '#fff' : r.prio <= 12 ? '#000' : 'inherit' } : undefined}>{r.started ? '▶' : (r.prio || '·')}</span>
                  <span className="flex-1 min-w-0"><span className="block text-xs font-black truncate">{r.title}</span><span className="block text-[10px] font-bold opacity-60 truncate">{r.genre || 'Sem gênero'}{r.started && stDays(r) !== null ? `, iniciado há ${spanText(stDays(r))}` : ''}</span></span>
                  <ConsoleBadge name={r.console} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {subs.map(([id, label]) => <button key={id} onClick={() => setSub(id)} className={`px-3 py-2 border-[2px] text-[11px] font-black whitespace-nowrap transition-colors ${FOCUS} ${sub === id ? `bg-cyan-600 text-white ${T.bd} ${T.shadowSm}` : (T.dk ? 'bg-gray-800 border-gray-600 text-gray-400 hover:text-white' : 'bg-white border-gray-300 text-gray-600 hover:text-black')}`}>{label}</button>)}
      </div>
      {A.nFin + A.nBack === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3"><span className="text-sm font-black">Nenhum jogo neste recorte.</span>{activeCount > 0 && <button onClick={clearFilters} className={`px-3 py-2 border-[2px] text-xs font-black ${T.bd} ${T.dk ? 'bg-gray-200 text-black' : 'bg-black text-white'} ${FOCUS}`}>Limpar filtros</button>}</div>
      ) : (<>
        {sub === 'visao' && renderVisao()}
        {sub === 'acervo' && renderAcervo()}
        {sub === 'tempo' && renderTempo()}
        {sub === 'dinheiro' && renderDinheiro()}
        {sub === 'cruzamentos' && renderCruzamentos()}
        {sub === 'backlog' && renderBacklog()}
      </>)}
    </div>
  );
};

// ---------------------------------------------------------------------
// ARMAZENAMENTO LOCAL (configurações privadas deste aparelho)
// ---------------------------------------------------------------------
const loadLS = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const saveLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---------------------------------------------------------------------
// ÍCONES
// ---------------------------------------------------------------------
const Ico = ({ d, className = 'w-5 h-5', fill = 'none' }) => <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={d} /></svg>;
const ICON = {
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  check: 'M5 13l4 4L19 7',
  list: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M12 4v16m8-8H4',
  gear: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.300-4.300',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2m0 18v2M4.200 4.200l1.400 1.400m12.800 12.800l1.400 1.400M1 12h2m18 0h2M4.200 19.800l1.400-1.400M18.400 5.600l1.400-1.400',
  moon: 'M21 12.800A9 9 0 1111.200 3a7 7 0 009.800 9.800z',
  sound: 'M11 5L6 9H2v6h4l5 4V5zM15.500 8.500a5 5 0 010 7M18.500 5.500a9 9 0 010 13',
  mute: 'M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6m0-6l6 6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  x: 'M6 18L18 6M6 6l12 12',
  up: 'M5 15l7-7 7 7',
};

// ---------------------------------------------------------------------
// ORDENAÇÃO
// ---------------------------------------------------------------------
const SORTERS = {
  num: r => r.num, title: r => stripAcc(r.title), console: r => stripAcc(r.console), genre: r => stripAcc(r.genre),
  start: r => r.startMs, end: r => r.endMs, hours: r => r.hours, days: r => r.days,
  nota: r => r.isS ? 99 : r.nota, dif: r => r.dif || null, cond: r => stripAcc(r.cond) || null,
  preco: r => r.preco, orig: r => r.orig, saving: r => r.saving || null, sup: r => stripAcc(r.supRaw) || null,
};
const sortRecs = (list, cfg) => {
  const arr = [...list]; const dir = cfg.dir === 'asc' ? 1 : -1;
  if (cfg.key === 'prio') {
    return arr.sort((a, b) => {
      if (a.started !== b.started) return a.started ? -1 : 1;
      if (a.started) return ((a.startMs || 0) - (b.startMs || 0)) * -dir;
      if (a.prio === null && b.prio === null) return 0; if (a.prio === null) return 1; if (b.prio === null) return -1;
      return (a.prio - b.prio) * -dir;
    });
  }
  const get = SORTERS[cfg.key] || SORTERS.num;
  return arr.sort((a, b) => {
    const va = get(a); const vb = get(b); const na = va === null || va === undefined || va === ''; const nb = vb === null || vb === undefined || vb === '';
    if (na && nb) return 0; if (na) return 1; if (nb) return -1;
    return va < vb ? -dir : va > vb ? dir : 0;
  });
};

// ---------------------------------------------------------------------
// LISTAS: tabela e cards
// ---------------------------------------------------------------------
const CondBadge = ({ r }) => {
  const T = useT();
  if (!r.cond || r.cond === '-') return null;
  if (r.platina) return <span className={`inline-block px-2 py-0.5 font-black text-[10px] border-[2px] ${T.bd}`} style={{ background: `linear-gradient(90deg, ${C.amber}, ${C.cyan})`, color: '#000' }}>🏆 {r.cond.replace(/\.$/, '')}</span>;
  return <span>{r.cond.replace(/\.$/, '')}</span>;
};
const DiffBadge = ({ d }) => { const T = useT(); return d ? <span className={`inline-block w-6 text-center py-0.5 border-[2px] ${T.bd} font-black`} style={{ backgroundColor: DIFF_COLOR[d], color: textOn(DIFF_COLOR[d]) }}>{d}</span> : null; };
const PrioBadge = ({ r }) => {
  const T = useT();
  if (r.started) return <span className={`inline-flex items-center justify-center w-7 h-6 border-[2px] ${T.bd} text-[10px] font-black`} style={{ backgroundColor: C.cyan, color: '#fff' }} title="Iniciado">▶</span>;
  if (r.prio === null) return <span className="opacity-40">·</span>;
  const bg = r.prio <= 5 ? C.pink : r.prio <= 12 ? C.amber : 'transparent';
  return <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1 border-[2px] ${T.bd} text-[10px] font-black`} style={{ backgroundColor: bg, color: r.prio <= 5 ? '#fff' : r.prio <= 12 ? '#000' : 'inherit' }} title="Prioridade">{r.prio}</span>;
};

const GameTable = ({ list, isBack, sort, setSort, onOpen, pick }) => {
  const T = useT();
  const Th = ({ label, k, cls = '' }) => (
    <th onClick={() => setSort(k)} className={`px-2 py-2 border-r-[2px] ${T.bd} cursor-pointer select-none whitespace-nowrap text-[10px] font-black ${cls}`}>
      <span className={`inline-flex items-center gap-1 ${cls.includes('text-center') ? 'justify-center' : ''}`}>{label}{sort.key === k && <Ico d={ICON.up} className={`w-3 h-3 transition-transform ${sort.dir === 'asc' ? '' : 'rotate-180'}`} />}</span>
    </th>
  );
  const td = `px-2 py-2 border-r-[2px] ${T.bdSoft}`;
  return (
    <div className={`overflow-auto border-[2px] ${T.bd} ${T.shadow} ${T.surface} max-h-[72vh] scroll-thin`}>
      <table className="w-full text-left border-collapse text-[11px] font-bold">
        <thead className="sticky top-0 z-10"><tr style={{ backgroundColor: isBack ? C.amber : C.cyan, color: isBack ? '#000' : '#fff' }}>
          {isBack ? <Th label="!" k="prio" cls="text-center w-10" /> : <Th label="#" k="num" cls="text-center w-10" />}
          <Th label="Jogo" k="title" cls="min-w-[170px]" /><Th label="Console" k="console" /><Th label="Gênero" k="genre" />
          <Th label={isBack ? 'Iniciado' : 'Início'} k="start" cls="text-center" />
          {!isBack && <><Th label="Fim" k="end" cls="text-center" /><Th label="Tempo" k="hours" cls="text-center" /><Th label="Duração" k="days" cls="text-center" /><Th label="Nota" k="nota" cls="text-center" /><Th label="Dif." k="dif" cls="text-center" /><Th label="Condição" k="cond" /></>}
          <Th label="Pago" k="preco" cls="text-center" /><Th label="De tabela" k="orig" cls="text-center" />
          {!isBack && <Th label="Desconto" k="saving" cls="text-center" />}
          <Th label="Suporte" k="sup" cls="border-r-0" />
        </tr></thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id || r.title + r.num} className={`border-b ${T.bdSoft} ${r.started ? (T.dk ? 'bg-cyan-900/30' : 'bg-cyan-50') : ''} ${T.hover}`}>
              <td className={`${td} text-center whitespace-nowrap ${T.sunken}`}>{isBack ? <PrioBadge r={r} /> : r.num}</td>
              <td className={`${td} text-xs font-black min-w-[170px]`}><button onClick={() => onOpen(r)} className={`text-left underline decoration-dotted underline-offset-4 hover:text-cyan-600 ${FOCUS}`}>{r.title}</button>{r.franchise && <span className="block text-[9px] opacity-50 font-bold">{r.franchise}</span>}</td>
              <td className={`${td} whitespace-nowrap`}><ConsoleBadge name={r.console} onClick={() => pick('console', r.console)} /></td>
              <td className={`${td} whitespace-nowrap`}>{r.genre && <button onClick={() => pick('genre', r.genreMain)} className={`font-black ${FOCUS}`}>{r.genre}</button>}</td>
              <td className={`${td} text-center whitespace-nowrap`}>{r.startStr}</td>
              {!isBack && <>
                <td className={`${td} text-center whitespace-nowrap`}>{r.endStr}</td>
                <td className={`${td} text-center whitespace-nowrap font-black`}>{fmtHours(r.hours)}</td>
                <td className={`${td} text-center whitespace-nowrap opacity-70`}>{spanText(r.days)}</td>
                <td className={`${td} text-center`}><NotaBadge r={r} /></td>
                <td className={`${td} text-center`}><DiffBadge d={r.dif} /></td>
                <td className={`${td} min-w-[150px] max-w-[230px] whitespace-normal text-[10px]`}><CondBadge r={r} /></td>
              </>}
              <td className={`${td} text-center whitespace-nowrap tabular-nums`}>{r.hasPrice ? money(r.preco) : ''}</td>
              <td className={`${td} text-center whitespace-nowrap tabular-nums opacity-70`}>{r.orig !== null ? money(r.orig) : ''}</td>
              {!isBack && <td className={`${td} text-center whitespace-nowrap tabular-nums`}>{r.saving > 0 && <span className="font-black" style={{ color: T.dk ? '#67e8f9' : C.cyan }}>-{Math.round((r.saving / r.orig) * 100)}%</span>}</td>}
              <td className={`px-2 py-2 whitespace-nowrap`}><button onClick={() => r.supRaw && pick('suporte', r.supRaw)} className={FOCUS}>{r.supRaw}</button></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan={16} className="p-8 text-center font-black opacity-60">Nenhum jogo nesta lista.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const GameCards = ({ list, isBack, onOpen, pick }) => {
  const T = useT();
  if (!list.length) return <div className={`p-8 text-center font-black opacity-60 border-[2px] ${T.bd} ${T.surface}`}>Nenhum jogo nesta lista.</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {list.map(r => (
        <div key={r.id || r.title + r.num} className={`border-[2px] ${T.bd} ${T.shadow} ${r.started ? (T.dk ? 'bg-cyan-900/30' : 'bg-cyan-50') : T.surface} p-3 flex flex-col gap-2`}>
          <div className={`flex justify-between items-start gap-2 pb-2 border-b-[2px] ${T.bd}`}>
            <button onClick={() => onOpen(r)} className={`text-left text-sm font-black leading-tight hover:text-cyan-600 ${FOCUS}`}>{r.title}</button>
            <span className="text-[11px] font-black opacity-60 shrink-0">{isBack ? <PrioBadge r={r} /> : `#${r.num}`}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <ConsoleBadge name={r.console} onClick={() => pick('console', r.console)} />
            {r.genre && <button onClick={() => pick('genre', r.genreMain)} className={`px-1.5 py-0.5 border-[2px] ${T.bd} text-[10px] font-black ${FOCUS}`}>{r.genre}</button>}
          </div>
          <div className="text-[11px] font-bold flex flex-col gap-1 mt-auto">
            {!isBack && r.hours && <div className="flex justify-between"><span className="opacity-60">Tempo</span><span className="font-black">{fmtHours(r.hours)}</span></div>}
            {!isBack && (r.nota !== null || r.isS) && <div className="flex justify-between items-center"><span className="opacity-60">Nota</span><NotaBadge r={r} /></div>}
            {isBack && r.startStr && <div className="flex justify-between"><span className="opacity-60">Iniciado</span><span className="font-black">{r.startStr}</span></div>}
            {r.hasPrice && <div className="flex justify-between"><span className="opacity-60">Pago</span><span className="font-black tabular-nums">{money(r.preco)}{r.saving > 0 ? ` (-${Math.round((r.saving / r.orig) * 100)}%)` : ''}</span></div>}
            {!isBack && r.cond && <div className="pt-1 text-center"><CondBadge r={r} /></div>}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------
// FORMULÁRIO (usado em "Novo jogo" e na edição da ficha)
// ---------------------------------------------------------------------
const BLANK_FORM = { status: 'Finalizado', titulo: '', plataforma: '', franquia: '', inicio: '', fim: '', tempo: '', nota: '', dificuldade: '', conquistas: '', preco: '', preco_original: '', suporte: '', midia: '', comentarios: '', prioridade: '' };
const FormField = ({ label, span, children }) => <label className={`flex flex-col gap-1 ${span ? 'sm:col-span-2 md:col-span-3' : ''}`}><span className="text-[11px] font-black">{label}</span>{children}</label>;
const GameForm = ({ data, setData, uniq, prioOptions, uid }) => {
  const T = useT();
  const inp = `w-full p-2 border-[2px] ${T.input} font-bold text-sm outline-none transition-colors`;
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });
  const fin = data.status === 'Finalizado';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      <datalist id={`${uid}-con`}>{uniq.console.map(o => <option key={o} value={o} />)}</datalist>
      <datalist id={`${uid}-gen`}>{uniq.genre.map(o => <option key={o} value={o} />)}</datalist>
      <datalist id={`${uid}-sup`}>{uniq.suporte.map(o => <option key={o} value={o} />)}</datalist>
      <datalist id={`${uid}-cond`}>{uniq.cond.map(o => <option key={o} value={o} />)}</datalist>
      <FormField label="Status *"><select value={data.status} onChange={set('status')} className={inp}><option>Finalizado</option><option>Backlog</option></select></FormField>
      <FormField label="Nome *"><input required value={data.titulo} onChange={set('titulo')} className={inp} /></FormField>
      <FormField label="Console"><input list={`${uid}-con`} value={data.plataforma} onChange={set('plataforma')} className={inp} /></FormField>
      <FormField label={'Gênero (use / para subclasse)'}><input list={`${uid}-gen`} placeholder="Ação / Mundo Aberto" value={data.franquia} onChange={set('franquia')} className={inp} /></FormField>
      <FormField label={fin ? 'Início' : 'Iniciado'}><input placeholder="DD/MM/AAAA" value={data.inicio} onChange={set('inicio')} className={inp} /></FormField>
      {fin ? (<>
        <FormField label="Fim"><input placeholder="DD/MM/AAAA" value={data.fim} onChange={set('fim')} className={inp} /></FormField>
        <FormField label="Tempo"><input placeholder="Ex: 12h ou 120:00:00" value={data.tempo} onChange={set('tempo')} className={inp} /></FormField>
        <FormField label="Nota"><input placeholder="De 0 a 10 ou S" value={data.nota} onChange={set('nota')} className={inp} /></FormField>
        <FormField label="Dificuldade"><select value={data.dificuldade} onChange={set('dificuldade')} className={inp}><option value="">-</option>{['A', 'B', 'C', 'D', 'E'].map(d => <option key={d}>{d}</option>)}</select></FormField>
        <FormField label="Condição" span><input list={`${uid}-cond`} value={data.conquistas} onChange={set('conquistas')} className={inp} /></FormField>
        <FormField label="Link (YouTube)" span><input value={data.midia} onChange={set('midia')} className={inp} /></FormField>
        <FormField label="Observações" span><textarea rows={2} value={data.comentarios} onChange={set('comentarios')} className={inp} /></FormField>
      </>) : (
        <FormField label="Prioridade"><select value={data.prioridade} onChange={set('prioridade')} className={inp}><option value="">-</option>{prioOptions}</select></FormField>
      )}
      <FormField label="Preço pago"><input placeholder="69,90" value={data.preco} onChange={set('preco')} className={inp} /></FormField>
      <FormField label="Preço sem desconto"><input placeholder="132,90" value={data.preco_original} onChange={set('preco_original')} className={inp} /></FormField>
      <FormField label="Suporte"><input list={`${uid}-sup`} placeholder="Digital / PS Store" value={data.suporte} onChange={set('suporte')} className={inp} /></FormField>
    </div>
  );
};

const StatusBar = ({ s }) => {
  const T = useT();
  if (!s || s.type === 'idle') return null;
  const bg = s.type === 'success' ? C.cyan : s.type === 'error' ? C.pink : C.amber;
  return <div role="status" className={`p-2.5 mb-4 text-xs font-black text-center border-[2px] ${T.bd} ${T.shadowSm}`} style={{ backgroundColor: bg, color: textOn(bg) }}>{s.message}</div>;
};

// ---------------------------------------------------------------------
// FICHA DO JOGO
// ---------------------------------------------------------------------
const GameModal = ({ rec, editing, setEditing, form, setForm, status, onSave, onDelete, onClose, uniq, prioOptions, confirmDel, setConfirmDel }) => {
  const T = useT();
  const yt = rec.link ? getYoutubeId(rec.link) : getYoutubeId(rec.supRaw);
  const Field = ({ k, children }) => <div className="flex flex-col gap-1"><span className="text-[10px] font-black opacity-60">{k}</span><div className="text-sm font-black min-h-[1.25rem]">{children}</div></div>;
  const btn = `px-4 py-2 border-[2px] ${T.bd} font-black text-xs ${T.shadowSm} active:translate-y-0.5 transition-transform ${FOCUS}`;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" className={`ld-pop w-full max-w-3xl my-auto border-[2px] ${T.bd} ${T.surface} ${T.shadow}`}>
        <div className={`px-4 py-3 border-b-[2px] ${T.bd} flex items-center justify-between gap-3`} style={{ backgroundColor: editing ? C.pink : C.cyan, color: '#fff' }}>
          <h2 className="text-lg sm:text-xl font-black tracking-tight truncate">{editing ? 'Editar ficha' : rec.title}</h2>
          <button onClick={onClose} aria-label="Fechar" className={`p-1 border-[2px] border-transparent hover:border-white ${FOCUS}`}><Ico d={ICON.x} className="w-6 h-6" /></button>
        </div>
        <div className="p-4 sm:p-5 max-h-[78vh] overflow-y-auto scroll-thin">
          <StatusBar s={status} />
          {editing ? (
            <>
              <GameForm data={form} setData={setForm} uniq={uniq} prioOptions={prioOptions} uid="edit" />
              <div className="flex flex-wrap gap-2 mt-5"><button onClick={onSave} className={`${btn} text-white`} style={{ backgroundColor: C.cyan }}>Salvar alterações</button><button onClick={() => setEditing(false)} className={`${btn} ${T.surface}`}>Cancelar</button></div>
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field k="Console"><ConsoleBadge name={rec.console} /></Field>
                <Field k="Gênero">{rec.genre ? <span>{rec.genreMain}{rec.genreSub ? <span className="opacity-60"> / {rec.genreSub}</span> : null}</span> : ''}</Field>
                <Field k="Franquia">{rec.franchise}</Field>
                <Field k="Suporte">{rec.supRaw}</Field>
                <Field k={rec.status === 'Backlog' ? 'Iniciado em' : 'Início'}>{rec.startStr}</Field>
                {rec.status === 'Finalizado' && <>
                  <Field k="Fim">{rec.endStr}</Field>
                  <Field k="Tempo de jogo">{fmtHours(rec.hours)}</Field>
                  <Field k="Duração">{spanText(rec.days)}</Field>
                  <Field k="Nota"><NotaBadge r={rec} /></Field>
                  <Field k="Dificuldade"><DiffBadge d={rec.dif} /></Field>
                  <Field k="Horas por dia">{rec.hours && rec.days ? fmtHoursShort(rec.hours / Math.max(1, rec.days)) : ''}</Field>
                </>}
                <Field k="Preço pago">{rec.hasPrice ? money(rec.preco) : ''}</Field>
                <Field k="Preço sem desconto">{rec.orig !== null ? money(rec.orig) : ''}</Field>
                {rec.saving > 0 && <Field k="Desconto">{money(rec.saving)} ({Math.round((rec.saving / rec.orig) * 100)}%)</Field>}
                {rec.hasPrice && rec.preco > 0 && rec.hours && <Field k="Custo por hora">{money(rec.preco / rec.hours)}</Field>}
                {rec.status === 'Backlog' && <Field k="Prioridade"><PrioBadge r={rec} /></Field>}
              </div>
              {rec.status === 'Finalizado' && (rec.cond || rec.obs) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3 border-[2px] ${T.bd} ${T.sunken}`}><span className="text-[10px] font-black opacity-60 block mb-1">Condição</span><div className="text-sm font-bold"><CondBadge r={rec} /></div></div>
                  <div className={`p-3 border-[2px] ${T.bd} ${T.sunken}`}><span className="text-[10px] font-black opacity-60 block mb-1">Observações</span><p className="text-sm font-bold whitespace-pre-wrap">{rec.obs}</p></div>
                </div>
              )}
              {yt ? <div className={`w-full aspect-video border-[2px] ${T.bd} ${T.shadow}`}><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${yt}`} title="Vídeo" allow="encrypted-media; picture-in-picture" allowFullScreen /></div>
                : (rec.link && rec.link !== '-' && <a href={rec.link} target="_blank" rel="noreferrer" className="text-cyan-600 font-bold underline break-all text-sm">{rec.link}</a>)}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => setEditing(true)} className={`${btn} text-white`} style={{ backgroundColor: C.pink }}>Editar</button>
                {!confirmDel ? <button onClick={() => setConfirmDel(true)} className={`${btn} ${T.surface}`}>Excluir</button>
                  : <><button onClick={onDelete} className={`${btn} text-white`} style={{ backgroundColor: '#be123c' }}>Confirmar exclusão</button><button onClick={() => setConfirmDel(false)} className={`${btn} ${T.surface}`}>Cancelar</button></>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// PAINEL DE FILTROS (compacto, abre sob a barra)
// ---------------------------------------------------------------------
const FilterPanel = ({ options, filters, toggle, clear, onClose }) => {
  const T = useT();
  return (
    <div className={`absolute right-0 left-0 sm:left-auto sm:w-[520px] top-full mt-2 z-40 border-[2px] ${T.bd} ${T.surface} ${T.shadow} p-3 max-h-[70vh] overflow-y-auto scroll-thin ld-pop`}>
      <div className="flex items-center justify-between mb-2"><span className="text-sm font-black">Filtros</span><div className="flex gap-2"><button onClick={clear} className={`text-[10px] font-black underline ${FOCUS}`}>Limpar tudo</button><button onClick={onClose} className={`text-[10px] font-black underline ${FOCUS}`}>Fechar</button></div></div>
      {FACETS.map(f => (options[f.id] || []).length > 0 && (
        <div key={f.id} className={`py-2 border-t ${T.bdSoft}`}>
          <div className="text-[10px] font-black opacity-60 mb-1.5">{f.label}</div>
          <div className="flex flex-wrap gap-1.5">{options[f.id].map(o => <Chip key={o} active={filters[f.id].includes(o)} onClick={() => toggle(f.id, o)}>{f.id === 'nota' && o !== 'S' ? `${o}` : o}</Chip>)}</div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------
// CONFIGURAÇÕES: conexão, franquias e PS Plus
// ---------------------------------------------------------------------
const ConfigTab = ({ configUrl, setConfigUrl, saveConfig, syncStatus, fr, setFr, allRecs, psCfg, setPsCfg, dark, setDark, sound, setSound }) => {
  const T = useT();
  const [testTitle, setTestTitle] = useState('');
  const inp = `w-full p-2 border-[2px] ${T.input} font-bold text-sm outline-none transition-colors`;
  const btn = `px-3 py-2 border-[2px] ${T.bd} font-black text-xs ${T.shadowSm} active:translate-y-0.5 transition-transform ${FOCUS}`;
  const setCustom = (i, patch) => setFr({ ...fr, custom: fr.custom.map((c, j) => j === i ? { ...c, ...patch } : c) });
  const suggestions = useMemo(() => suggestGroups(allRecs), [allRecs]);
  const testResult = testTitle ? franchiseOf(testTitle, fr.custom, fr.disabled) : null;
  const toTitle = (s) => s.replace(/\b\w/g, c => c.toUpperCase());
  const setPrice = (i, patch) => setPsCfg({ ...psCfg, prices: psCfg.prices.map((p, j) => j === i ? { ...p, ...patch } : p) });
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <Card title="Conexão com a planilha">
        <StatusBar s={syncStatus} />
        <input type="url" value={configUrl} onChange={(e) => setConfigUrl(e.target.value)} placeholder="Cole a URL do Apps Script" className={`${inp} mb-3`} />
        <button onClick={saveConfig} className={`${btn} text-white w-full`} style={{ backgroundColor: C.cyan }}>Reconectar e sincronizar</button>
        <p className="text-[10px] font-bold opacity-60 mt-2">A URL fica salva só neste aparelho e não vai para o código.</p>
      </Card>
      <Card title="Aparência e sons">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDark(!dark)} className={`${btn} ${T.surface} flex items-center gap-2`}><Ico d={dark ? ICON.sun : ICON.moon} className="w-4 h-4" />{dark ? 'Modo claro' : 'Modo escuro'}</button>
          <button onClick={() => setSound(!sound)} className={`${btn} ${T.surface} flex items-center gap-2`}><Ico d={sound ? ICON.sound : ICON.mute} className="w-4 h-4" />{sound ? 'Sons ligados' : 'Sons desligados'}</button>
          <button onClick={() => { initAudio(); playStartup(); }} className={`${btn} ${T.surface}`}>Ouvir abertura</button>
          <button onClick={() => { initAudio(); playBeep('save'); }} className={`${btn} ${T.surface}`}>Ouvir acerto</button>
          <button onClick={() => { initAudio(); playBeep('error'); }} className={`${btn} ${T.surface}`}>Ouvir erro</button>
        </div>
      </Card>
      <Card title="Franquias e equivalências" hint="Regras suas valem antes das padrão">
        <p className="text-[11px] font-bold opacity-70 mb-3">Cada franquia tem uma lista de termos separados por vírgula. Um jogo entra na franquia se o título contiver algum termo como palavra inteira. Exemplo: Kingdom Hearts com o termo "kingdom hearts" reúne todos os títulos da série.</p>
        <div className="flex flex-col gap-2 mb-3">
          {fr.custom.map((c, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center">
              <input value={c.name} onChange={(e) => setCustom(i, { name: e.target.value })} placeholder="Nome da franquia" className={inp} />
              <input value={c.text ?? c.terms.join(', ')} onChange={(e) => setCustom(i, { text: e.target.value, terms: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="termo 1, termo 2" className={inp} />
              <button onClick={() => setFr({ ...fr, custom: fr.custom.filter((_, j) => j !== i) })} className={`${btn} ${T.surface}`} aria-label="Remover">Remover</button>
            </div>
          ))}
          <button onClick={() => setFr({ ...fr, custom: [...fr.custom, { name: '', terms: [], text: '' }] })} className={`${btn} ${T.surface} self-start`}>Adicionar franquia</button>
        </div>
        <div className={`border-t-[2px] ${T.bd} pt-3 mb-3`}>
          <div className="text-[11px] font-black mb-1">Testar um título</div>
          <input value={testTitle} onChange={(e) => setTestTitle(e.target.value)} placeholder="Ex.: Yakuza 0" className={inp} />
          {testTitle && <p className="text-xs font-bold mt-1">{testResult ? <>Franquia: <b>{testResult}</b></> : 'Nenhuma franquia encontrada.'}</p>}
        </div>
        {suggestions.length > 0 && (
          <div className={`border-t-[2px] ${T.bd} pt-3 mb-3`}>
            <div className="text-[11px] font-black mb-2">Sugestões: jogos que parecem da mesma série</div>
            <div className="flex flex-col gap-1.5">{suggestions.map(s => (
              <div key={s.root} className="flex items-center gap-2 text-[11px] font-bold">
                <span className="flex-1 min-w-0 truncate"><b>{toTitle(s.root)}</b> <span className="opacity-60">({s.titles.slice(0, 3).join('; ')}{s.titles.length > 3 ? '…' : ''})</span></span>
                <button onClick={() => setFr({ ...fr, custom: [...fr.custom, { name: toTitle(s.root), terms: [s.root], text: s.root }] })} className={`${btn} ${T.surface} !py-1`}>Criar</button>
              </div>))}
            </div>
          </div>
        )}
        <details className={`border-t-[2px] ${T.bd} pt-3`}>
          <summary className="text-[11px] font-black cursor-pointer">Regras padrão ({DEFAULT_FRANCHISES.length - fr.disabled.length} ativas)</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2">
            {DEFAULT_FRANCHISES.map(r => <label key={r.name} className="flex items-start gap-2 text-[11px] font-bold py-1"><input type="checkbox" checked={!fr.disabled.includes(r.name)} onChange={() => setFr({ ...fr, disabled: fr.disabled.includes(r.name) ? fr.disabled.filter(x => x !== r.name) : [...fr.disabled, r.name] })} className="mt-0.5 accent-cyan-600" /><span><b>{r.name}</b><span className="block opacity-60">{r.terms.join(', ')}</span></span></label>)}
          </div>
        </details>
      </Card>
      <Card title="Comprar × assinar (PS Plus)" hint="Usado no Dashboard, aba Dinheiro">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label className="flex flex-col gap-1"><span className="text-[11px] font-black">Console comparado</span><input value={psCfg.console} onChange={(e) => setPsCfg({ ...psCfg, console: e.target.value })} className={inp} /></label>
          <label className="flex flex-col gap-1"><span className="text-[11px] font-black">Data de compra do console</span><input type="date" value={psCfg.date} onChange={(e) => setPsCfg({ ...psCfg, date: e.target.value })} className={inp} /><span className="text-[10px] font-bold opacity-60">Vazio: usa o início do primeiro jogo desse console.</span></label>
        </div>
        <div className="text-[11px] font-black mb-1">Preços de 12 meses (R$) por período</div>
        <div className="flex flex-col gap-2">
          {psCfg.prices.map((p, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2 items-end">
              <label className="flex flex-col gap-1"><span className="text-[10px] font-bold opacity-60">A partir de</span><input type="date" value={p.from} onChange={(e) => setPrice(i, { from: e.target.value })} className={inp} /></label>
              {[['ess', 'Essential'], ['extra', 'Extra'], ['deluxe', 'Deluxe']].map(([k, l]) => <label key={k} className="flex flex-col gap-1"><span className="text-[10px] font-bold opacity-60">{l}</span><input inputMode="decimal" value={String(p[k]).replace('.', ',')} onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); setPrice(i, { [k]: isNaN(v) ? 0 : v }); }} className={inp} /></label>)}
              <button onClick={() => setPsCfg({ ...psCfg, prices: psCfg.prices.filter((_, j) => j !== i) })} className={`${btn} ${T.surface}`} aria-label="Remover período">Remover</button>
            </div>
          ))}
          <button onClick={() => setPsCfg({ ...psCfg, prices: [...psCfg.prices, { from: new Date().toISOString().slice(0, 10), ess: 0, extra: 0, deluxe: 0 }] })} className={`${btn} ${T.surface} self-start`}>Adicionar período</button>
        </div>
        <p className="text-[10px] font-bold opacity-60 mt-3">Padrão: valores anuais do Brasil antes e depois do reajuste de 16/04/2025 (Essential 278,90 → 359,90; Extra 475,90 → 592,90; Deluxe 538,90 → 691,90). O primeiro período é uma estimativa para datas anteriores. Confira no site da PlayStation.</p>
        <button onClick={() => setPsCfg(DEFAULT_PS_CFG)} className={`${btn} ${T.surface} mt-2`}>Restaurar padrão</button>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------------
// ESTILOS GLOBAIS (rolagem, animação de entrada, cores do corpo da página)
// ---------------------------------------------------------------------
const Styles = ({ dark }) => (
  <style>{`
    html, body { margin: 0; background: ${dark ? '#030712' : '#f3f4f6'}; -webkit-tap-highlight-color: transparent; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scroll-thin::-webkit-scrollbar { width: 8px; height: 8px; }
    .scroll-thin::-webkit-scrollbar-track { background: ${dark ? '#111827' : '#f3f4f6'}; }
    .scroll-thin::-webkit-scrollbar-thumb { background: ${dark ? '#d1d5db' : '#111827'}; }
    .scroll-thin::-webkit-scrollbar-corner { background: ${dark ? '#111827' : '#f3f4f6'}; }
    @keyframes ld-pop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
    .ld-pop { animation: ld-pop 160ms ease-out backwards; }
    @media (prefers-reduced-motion: reduce) { .ld-pop { animation: none; } * { transition-duration: 0.01ms !important; } }
  `}</style>
);

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: ICON.chart },
  { id: 'finished', label: 'Finalizados', icon: ICON.check },
  { id: 'backlog', label: 'Backlog', icon: ICON.list },
  { id: 'add', label: 'Novo jogo', icon: ICON.plus },
  { id: 'config', label: 'Config', icon: ICON.gear },
];
const ICON_URL = '/icon-192.png';
const ITEMS_PER_PAGE = 30;
const TEXT_SORTS = ['title', 'console', 'genre', 'sup', 'cond', 'dif'];

export default function App() {
  const [dark, setDark] = useState(() => { const v = loadLS('ludorum_dark', null); if (v !== null) return v; return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false; });
  const [sound, setSound] = useState(() => loadLS('ludorum_sound', true));
  const [appState, setAppState] = useState('booting');
  const [tab, setTab] = useState('dashboard');
  const [configUrl, setConfigUrl] = useState('');
  const [rawGames, setRawGames] = useState([]);
  const [sync, setSync] = useState({ type: 'idle', message: '' });
  const [addStatus, setAddStatus] = useState({ type: 'idle', message: '' });
  const [ficha, setFicha] = useState({ type: 'idle', message: '' });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [backFilter, setBackFilter] = useState('todos');
  const [viewMode, setViewMode] = useState(() => loadLS('ludorum_view', 'table'));
  const [page, setPage] = useState(1);
  const [sort, setSortState] = useState({ key: 'num', dir: 'desc' });
  const [modalId, setModalId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [fr, setFr] = useState(() => { const v = loadLS('ludorum_franchises', null); return { custom: (v && v.custom) || [], disabled: (v && v.disabled) || [] }; });
  const [psCfg, setPsCfg] = useState(() => { const v = loadLS('ludorum_pscfg', null); return v && Array.isArray(v.prices) ? { ...DEFAULT_PS_CFG, ...v } : DEFAULT_PS_CFG; });
  const startedRef = useRef(false);
  const T = useMemo(() => mkTheme(dark), [dark]);
  soundOn = sound;

  // persistência (somente neste aparelho)
  useEffect(() => saveLS('ludorum_dark', dark), [dark]);
  useEffect(() => saveLS('ludorum_sound', sound), [sound]);
  useEffect(() => saveLS('ludorum_view', viewMode), [viewMode]);
  useEffect(() => saveLS('ludorum_franchises', fr), [fr]);
  useEffect(() => saveLS('ludorum_pscfg', psCfg), [psCfg]);
  useEffect(() => {
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#030712' : '#ffffff');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }, [dark]);

  // service worker (só no site publicado)
  useEffect(() => {
    const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;
    if (isProd && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // abertura: toca a fanfarra ao terminar o carregamento (ou no primeiro toque, se o navegador bloquear)
  useEffect(() => {
    if ((appState === 'ready' || appState === 'config') && !startedRef.current) { startedRef.current = true; playStartup(); }
  }, [appState]);
  useEffect(() => {
    const unlock = () => { initAudio(); if (audioCtx && audioCtx.state !== 'running' && !window.__ludStartup) { window.__ludStartup = true; playStartup(); } };
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // ------------------------- dados
  const fetchGames = async (url, soft) => {
    setSync({ type: 'loading', message: 'Sincronizando com a planilha...' });
    try {
      const res = await fetch(url); const data = await res.json();
      if (data.error) throw new Error(data.error);
      const mk = (arr, st) => Array.isArray(arr) ? arr.map((g, i, a) => ({ ...g, status: g.status || st, _fallbackId: a.length - i })) : [];
      setRawGames([...mk(data.finished, 'Finalizado'), ...mk(data.backlog, 'Backlog')]);
      setAppState('ready'); setSync({ type: 'success', message: 'Sincronizado com sucesso' });
      setTimeout(() => setSync({ type: 'idle', message: '' }), 2500);
      return true;
    } catch (err) {
      playBeep('error');
      setSync({ type: 'error', message: 'Erro ao sincronizar. Confira o link e a implantação do script.' });
      if (!soft) setAppState('config');
      return false;
    }
  };
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = localStorage.getItem('gas_url');
      if (saved) { setConfigUrl(saved); setAppState('loading'); fetchGames(saved); } else setAppState('config');
    }, 900);
    return () => clearTimeout(t);
  }, []);
  const saveConfig = () => { localStorage.setItem('gas_url', configUrl); setAppState('loading'); fetchGames(configUrl); };
  const post = async (payload) => {
    const res = await fetch(configUrl, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
    const j = await res.json(); if (j && j.error) throw new Error(j.error); return j;
  };
  const buildPayload = (f) => ({ ...f, link: f.midia, observacao: f.comentarios });

  const all = useMemo(() => rawGames.map(g => normalizeGame(g, fr)), [rawGames, fr]);
  const filtered = useMemo(() => applyFilters(all, filters, search), [all, filters, search]);
  const backlogAll = useMemo(() => all.filter(r => r.status === 'Backlog'), [all]);
  const maxPrio = backlogAll.length + 1;
  const modalRec = modalId ? all.find(r => r.id === modalId) : null;

  const options = useMemo(() => {
    const o = {};
    FACETS.forEach(f => {
      const cnt = {}; all.forEach(r => { const v = f.get(r); if (v) cnt[v] = (cnt[v] || 0) + 1; });
      let keys = Object.keys(cnt);
      if (f.id === 'nota') keys = ['S', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'].filter(k => cnt[k]);
      else if (f.id === 'ano') keys = keys.sort().reverse();
      else if (f.id === 'dif') keys = keys.sort();
      else keys = keys.sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b));
      o[f.id] = keys;
    });
    return o;
  }, [all]);
  const uniq = useMemo(() => {
    const u = (arr) => Array.from(new Set(arr.filter(Boolean))).sort();
    return { console: u(all.map(r => r.console === 'Sem console' ? '' : r.console)), genre: u(all.map(r => r.genre)), suporte: u(all.map(r => r.supRaw)), cond: u(all.map(r => r.cond)) };
  }, [all]);
  const prioOptionsFor = (currentId) => Array.from({ length: maxPrio }).map((_, i) => {
    const p = i + 1; const occ = backlogAll.find(g => g.prio === p); let label = String(p);
    if (occ && occ.id !== currentId) label += ` - ${occ.title}`;
    return <option key={p} value={p}>{label}</option>;
  });

  // ------------------------- ações
  const toggle = (id, val) => { if (!val) return; setFilters(f => ({ ...f, [id]: f[id].includes(val) ? f[id].filter(x => x !== val) : [...f[id], val] })); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setSearch(''); };
  const pickFromList = (id, val) => toggle(id, val);
  const activeCount = Object.values(filters).reduce((s, a) => s + a.length, 0);
  const hasCut = activeCount > 0 || search.trim() !== '';
  const goTab = (id) => { setTab(id); setPanelOpen(false); setPage(1); if (id === 'finished') setSortState({ key: 'num', dir: 'desc' }); if (id === 'backlog') setSortState({ key: 'prio', dir: 'asc' }); };
  const setSort = (k) => setSortState(s => s.key === k ? { key: k, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key: k, dir: TEXT_SORTS.includes(k) ? 'asc' : 'desc' });
  useEffect(() => setPage(1), [filters, search, backFilter, viewMode, sort]);

  const toForm = (r) => ({
    ...r.raw, id: r.id, '#': r.num, status: r.status, titulo: r.title, plataforma: r.console === 'Sem console' ? '' : r.console, franquia: r.genre,
    inicio: r.startStr, fim: r.endStr, tempo: r.hours ? toHMS(r.hours) : String(getVal(r.raw, ['tempo']) || ''),
    nota: r.isS ? 'S' : (r.nota !== null ? String(r.nota).replace('.', ',') : ''), dificuldade: r.dif, conquistas: r.cond,
    preco: r.hasPrice ? String(getVal(r.raw, ['preco', 'preco pago'])) : '', preco_original: r.orig !== null ? String(getVal(r.raw, ['preco_original', 'preco sem desconto', 'preço sem desconto'])) : '',
    suporte: r.supRaw, midia: r.link, comentarios: r.obs, prioridade: r.prio === null ? '' : String(r.prio),
  });
  const openGame = (r) => { if (!r) return; setModalId(r.id); setForm(toForm(r)); setEditing(false); setConfirmDel(false); setFicha({ type: 'idle', message: '' }); };
  const closeGame = () => { setModalId(null); setEditing(false); setConfirmDel(false); setFicha({ type: 'idle', message: '' }); };

  const runSave = async (fn, setStatus, onDone) => {
    setStatus({ type: 'loading', message: 'Salvando na planilha...' });
    try {
      await fn();
      const ok = await fetchGames(configUrl, true);
      if (!ok) throw new Error('refetch');
      playBeep('save'); setStatus({ type: 'success', message: 'Salvo com sucesso' });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 2500);
      if (onDone) onDone();
      return true;
    } catch (e) {
      playBeep('error'); setStatus({ type: 'error', message: 'Não foi possível salvar. Nada foi alterado na planilha.' });
      return false;
    }
  };
  const swapPrio = async (target, selfId, selfOld) => {
    const occ = backlogAll.find(g => g.prio === target && g.id !== selfId);
    if (occ) await post({ action: 'UPDATE', data: { ...occ.raw, prioridade: selfOld || '' } });
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    const target = parseInt(addForm.prioridade, 10);
    const ok = await runSave(async () => {
      if (addForm.status === 'Backlog' && !isNaN(target)) await swapPrio(target, null, '');
      await post({ action: 'ADD', data: { ...buildPayload(addForm), id: 'temp_id' } });
    }, setAddStatus);
    if (ok) setAddForm({ ...BLANK_FORM, status: addForm.status });
  };
  const handleUpdate = async () => {
    const rec = modalRec; if (!rec) return;
    const target = parseInt(form.prioridade, 10);
    await runSave(async () => {
      if (form.status === 'Backlog' && !isNaN(target) && target !== rec.prio) await swapPrio(target, rec.id, rec.prio);
      await post({ action: 'UPDATE', data: buildPayload(form) });
    }, setFicha, () => setEditing(false));
  };
  const handleDelete = async () => {
    const rec = modalRec; if (!rec) return;
    setFicha({ type: 'loading', message: 'Excluindo da planilha...' });
    try {
      await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'DELETE', id: rec.id }) });
      const ok = await fetchGames(configUrl, true); if (!ok) throw new Error('refetch');
      playBeep('save'); setFicha({ type: 'success', message: 'Jogo excluído' });
      setTimeout(closeGame, 1100);
    } catch (e) { playBeep('error'); setFicha({ type: 'error', message: 'Não foi possível excluir.' }); }
  };

  // ------------------------- listas
  const listRecs = useMemo(() => {
    let l = filtered.filter(r => r.status === (tab === 'backlog' ? 'Backlog' : 'Finalizado'));
    if (tab === 'backlog' && backFilter === 'iniciados') l = l.filter(r => r.started);
    if (tab === 'backlog' && backFilter === 'fila') l = l.filter(r => !r.started);
    return sortRecs(l, sort);
  }, [filtered, tab, backFilter, sort]);
  const totalPages = Math.max(1, Math.ceil(listRecs.length / ITEMS_PER_PAGE));
  const pageRecs = viewMode === 'cards' ? listRecs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE) : listRecs;
  const nowMs = useMemo(() => Date.now(), [rawGames]);

  const iconBtn = `relative flex items-center justify-center w-10 h-10 border-[2px] ${T.bd} ${T.surface} ${T.shadowSm} active:translate-y-0.5 transition-transform ${FOCUS}`;

  // ------------------------- abertura
  if (appState === 'booting' || (appState === 'loading' && rawGames.length === 0)) {
    return (
      <ThemeCtx.Provider value={T}>
        <div className={`min-h-screen ${T.page} flex flex-col items-center justify-center p-4`}>
          <Styles dark={dark} />
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <img src={ICON_URL} alt="" className="w-32 h-32" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <div className="flex flex-col items-center">
              <div className={`px-4 py-2 border-[2px] ${T.bd} ${T.shadow} -rotate-2`} style={{ backgroundColor: C.cyan, color: '#fff' }}><h1 className="text-3xl font-black tracking-tighter">Ludorum</h1></div>
              <div className={`px-4 py-1 mt-3 border-[2px] ${T.bd} ${T.shadow} rotate-1`} style={{ backgroundColor: C.pink, color: '#fff' }}><h2 className="text-lg font-black tracking-widest">Memorabilia</h2></div>
            </div>
            <div className="text-xs font-black">Sincronizando a biblioteca...</div>
          </div>
        </div>
      </ThemeCtx.Provider>
    );
  }

  const showSearch = ['dashboard', 'finished', 'backlog'].includes(tab);
  const chips = FACETS.flatMap(f => filters[f.id].map(v => ({ id: f.id, label: f.label, v })));

  return (
    <ThemeCtx.Provider value={T}>
      <div className={`min-h-screen ${T.page} font-sans selection:bg-pink-300 selection:text-black`}>
        <Styles dark={dark} />
        <header className={`sticky top-0 z-30 ${T.surface} border-b-[2px] ${T.bd}`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-2 flex flex-wrap sm:flex-nowrap items-center gap-2 relative">
            <button onClick={() => { goTab('dashboard'); clearFilters(); }} className={`flex items-center gap-2 shrink-0 ${FOCUS}`} title="Início">
              <img src={ICON_URL} alt="" className="w-9 h-9 sm:w-10 sm:h-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className={`px-2 py-1 border-[2px] ${T.bd} ${T.shadowSm} -rotate-1 text-base sm:text-lg font-black tracking-tighter leading-none`} style={{ backgroundColor: C.cyan, color: '#fff' }}>Ludorum</span>
              <span className={`hidden md:inline px-2 py-1 border-[2px] ${T.bd} ${T.shadowSm} rotate-1 text-xs font-black tracking-widest leading-none`} style={{ backgroundColor: C.pink, color: '#fff' }}>Memorabilia</span>
            </button>
            {showSearch ? (
              <div className="relative order-last basis-full sm:order-none sm:basis-auto sm:flex-1 min-w-0">
                <Ico d={ICON.search} className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jogo, console, gênero" aria-label="Buscar" className={`w-full h-10 pl-8 pr-2 border-[2px] ${T.input} font-bold text-sm outline-none ${T.shadowSm}`} />
              </div>
            ) : null}
            <div className="flex-1 sm:hidden" />
            {!showSearch && <div className="hidden sm:block flex-1" />}
            {showSearch && (
              <button onClick={() => setPanelOpen(!panelOpen)} aria-label="Filtros" aria-expanded={panelOpen} className={`${iconBtn} ${activeCount ? '' : ''}`} style={activeCount ? { backgroundColor: C.pink, color: '#fff' } : undefined}>
                <Ico d={ICON.filter} />{activeCount > 0 && <span className={`absolute -top-2 -right-2 min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-[10px] font-black border-[2px] ${T.bd} ${T.surface}`}>{activeCount}</span>}
              </button>
            )}
            <button onClick={() => setSound(!sound)} aria-label={sound ? 'Desligar sons' : 'Ligar sons'} className={iconBtn}><Ico d={sound ? ICON.sound : ICON.mute} /></button>
            <button onClick={() => setDark(!dark)} aria-label={dark ? 'Modo claro' : 'Modo escuro'} className={iconBtn}><Ico d={dark ? ICON.sun : ICON.moon} /></button>
            {panelOpen && showSearch && <FilterPanel options={options} filters={filters} toggle={toggle} clear={() => setFilters(EMPTY_FILTERS)} onClose={() => setPanelOpen(false)} />}
          </div>
          <nav className={`flex border-t-[2px] ${T.bd} overflow-x-auto scrollbar-hide`} aria-label="Seções">
            {TABS.map(t => (
              <button key={t.id} onClick={() => goTab(t.id)} aria-current={tab === t.id ? 'page' : undefined} className={`flex-1 min-w-[72px] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 border-r-[2px] last:border-r-0 ${T.bd} text-[11px] sm:text-xs font-black transition-colors ${FOCUS}`} style={tab === t.id ? { backgroundColor: C.amber, color: '#000' } : undefined}>
                <Ico d={t.icon} className="w-4 h-4 sm:w-5 sm:h-5" />{t.label}
              </button>
            ))}
          </nav>
          {showSearch && hasCut && (
            <div className={`border-t-[2px] ${T.bd} px-2 sm:px-4 py-1.5 flex flex-wrap items-center gap-1.5`} style={{ backgroundColor: dark ? 'rgba(219,39,119,0.18)' : '#fdf2f8' }}>
              <span className="text-[10px] font-black mr-1">Recorte: {filtered.length} jogos</span>
              {search.trim() && <Chip active onClick={() => setSearch('')}>"{search.trim()}" ×</Chip>}
              {chips.map(c => <Chip key={`${c.id}-${c.v}`} active onClick={() => toggle(c.id, c.v)} title={`Remover filtro de ${c.label}`}>{c.label}: {c.v} ×</Chip>)}
              <button onClick={clearFilters} className={`ml-auto text-[10px] font-black underline ${FOCUS}`}>Limpar tudo</button>
            </div>
          )}
        </header>

        <main className="max-w-[1600px] mx-auto p-2 sm:p-4 pb-24">
          {appState === 'loading' && <div className="h-1.5 mb-3 overflow-hidden border-[2px] border-current"><div className="h-full animate-pulse" style={{ backgroundColor: C.pink }} /></div>}
          {tab === 'dashboard' && (
            <Dashboard recs={filtered} allRecs={all} filters={filters} toggle={toggle} clearFilters={clearFilters} onOpen={openGame} onList={() => goTab('finished')} psCfg={psCfg} nowMs={nowMs} />
          )}
          {(tab === 'finished' || tab === 'backlog') && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1">
                  {[['table', ICON.list, 'Tabela'], ['cards', ICON.grid, 'Cards']].map(([id, d, label]) => <button key={id} onClick={() => setViewMode(id)} aria-label={label} title={label} className={`p-2 border-[2px] ${T.bd} ${FOCUS}`} style={viewMode === id ? { backgroundColor: C.amber, color: '#000' } : undefined}><Ico d={d} className="w-4 h-4" /></button>)}
                </div>
                {tab === 'backlog' && <Seg value={backFilter} onChange={setBackFilter} options={[{ id: 'todos', label: 'Todos' }, { id: 'iniciados', label: 'Iniciados' }, { id: 'fila', label: 'Na fila' }]} />}
                <span className="ml-auto text-[11px] font-black opacity-70">{listRecs.length} {listRecs.length === 1 ? 'jogo' : 'jogos'}</span>
              </div>
              {viewMode === 'table' ? <GameTable list={pageRecs} isBack={tab === 'backlog'} sort={sort} setSort={setSort} onOpen={openGame} pick={pickFromList} /> : <GameCards list={pageRecs} isBack={tab === 'backlog'} onOpen={openGame} pick={pickFromList} />}
              {viewMode === 'cards' && totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-3">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)} className={`px-3 py-1.5 border-[2px] ${T.bd} ${T.surface} text-xs font-black disabled:opacity-40 ${FOCUS}`}>Anterior</button>
                  <span className="text-xs font-black">Página {page} de {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className={`px-3 py-1.5 border-[2px] ${T.bd} ${T.surface} text-xs font-black disabled:opacity-40 ${FOCUS}`}>Próxima</button>
                </div>
              )}
            </div>
          )}
          {tab === 'add' && (
            <form onSubmit={handleAdd} className={`max-w-4xl mx-auto border-[2px] ${T.bd} ${T.shadow} ${T.surface} p-4 sm:p-6`}>
              <h2 className={`text-lg font-black mb-4 pb-2 border-b-[2px] ${T.bd}`}>Novo jogo <span className="text-xs font-bold opacity-60">(entra no topo da planilha)</span></h2>
              <StatusBar s={addStatus} />
              <GameForm data={addForm} setData={setAddForm} uniq={uniq} prioOptions={prioOptionsFor(null)} uid="add" />
              <button type="submit" className={`mt-5 px-5 py-2.5 border-[2px] ${T.bd} ${T.shadowSm} text-white text-sm font-black active:translate-y-0.5 transition-transform ${FOCUS}`} style={{ backgroundColor: C.cyan }}>Salvar na planilha</button>
            </form>
          )}
          {tab === 'config' && <ConfigTab configUrl={configUrl} setConfigUrl={setConfigUrl} saveConfig={saveConfig} syncStatus={sync} fr={fr} setFr={setFr} allRecs={all} psCfg={psCfg} setPsCfg={setPsCfg} dark={dark} setDark={setDark} sound={sound} setSound={setSound} />}
        </main>

        {tab === 'dashboard' && hasCut && filtered.length > 0 && (
          <div className="fixed left-0 right-0 flex justify-center pointer-events-none z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            <button onClick={() => goTab(filtered.some(r => r.status === 'Finalizado') ? 'finished' : 'backlog')} className={`pointer-events-auto px-4 py-2.5 border-[2px] ${T.bd} ${T.shadow} text-sm font-black active:translate-y-0.5 transition-transform ${FOCUS}`} style={{ backgroundColor: C.pink, color: '#fff' }}>Ver os {filtered.length} jogos deste recorte</button>
          </div>
        )}

        {modalRec && <GameModal rec={modalRec} editing={editing} setEditing={setEditing} form={form} setForm={setForm} status={ficha} onSave={handleUpdate} onDelete={handleDelete} onClose={closeGame} uniq={uniq} prioOptions={prioOptionsFor(modalRec.id)} confirmDel={confirmDel} setConfirmDel={setConfirmDel} />}
      </div>
    </ThemeCtx.Provider>
  );
}
