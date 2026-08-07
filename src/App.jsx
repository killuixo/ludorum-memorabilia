import React, { useState, useEffect, useMemo, useRef } from 'react';

const theme = {
  border: 'border-[3px] border-slate-900',
  card: 'bg-white shadow-[6px_6px_0_0_rgba(15,23,42,1)]',
  cyan: 'bg-[#A8E6CF]',
  gold: 'bg-[#FFD3B6]',
  pink: 'bg-[#FF8B94]',
  blue: 'bg-[#3B82F6]', 
  red: 'bg-[#EF4444]',
  input: 'w-full p-2 border-[3px] border-slate-900 bg-white font-bold outline-none focus:bg-slate-50 transition-colors text-sm',
  btnBase: 'px-4 py-2 border-[3px] border-slate-900 font-black uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer',
};

const getVal = (game, possibleKeys) => {
  if (!game) return '';
  for (let pk of possibleKeys) {
     if (game[pk] !== undefined && game[pk] !== null && game[pk] !== '') return game[pk];
  }
  const keys = Object.keys(game);
  for (let k of keys) {
     const cleanK = String(k).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
     for (let pk of possibleKeys) {
        const cleanPk = String(pk).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanK === cleanPk && game[k] !== undefined && game[k] !== null && game[k] !== '') return game[k];
     }
  }
  return '';
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === '' || val === '-') return '';
  let strVal = String(val).replace('R$', '').trim().replace(/\s/g, '').replace(',', '.');
  let num = parseFloat(strVal);
  if (isNaN(num)) return '';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

const getNumericPrice = (val) => {
  if (!val || val === '-') return 0;
  let strVal = String(val).replace('R$', '').trim().replace(/\s/g, '').replace(',', '.');
  let num = parseFloat(strVal);
  return isNaN(num) ? 0 : num;
};

const formatDateStr = (str) => {
  if (!str || str === '-') return '';
  let s = String(str).trim();
  if (s.includes('T') && (s.includes('Z') || s.includes('-'))) {
    try {
      const d = new Date(s);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const mon = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yr = d.getUTCFullYear();
      if(!isNaN(yr) && yr > 1900) return `${day}/${mon}/${yr}`;
    } catch(e) {}
  }
  return s;
};

const formatTempoStr = (tempoVal) => {
  if (!tempoVal || tempoVal === '-') return '';
  let str = String(tempoVal).trim();
  if (/^\d+:\d+(:\d+)?$/.test(str)) {
    let parts = str.split(':');
    let hrs = parseInt(parts[0], 10) || 0;
    let mins = parseInt(parts[1], 10) || 0;
    if (hrs === 0 && mins === 0) return '';
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
  }
  if (str.includes('T') || str.includes('1899') || str.includes('1900')) {
    try {
      let d = new Date(str);
      if (!isNaN(d.getTime())) {
        let baseDate = new Date('1899-12-30T00:00:00Z');
        let diffMs = d.getTime() - baseDate.getTime();
        if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
        let totalMins = Math.floor(diffMs / (1000 * 60));
        let hrs = Math.floor(totalMins / 60);
        let mins = totalMins % 60;
        if (hrs === 0 && mins === 0) return '';
        return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
      }
    } catch (e) {}
  }
  let num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num)) return `${num}h`;
  return str;
};

const parseDuracaoDays = (inicio, fim) => {
  let inStr = formatDateStr(inicio);
  let fimStr = formatDateStr(fim);
  if (!inStr || !fimStr) return -1;
  try {
    const parseDate = (s) => {
      let p = s.split('/');
      if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}T12:00:00`);
      return new Date(s);
    };
    let d1 = parseDate(inStr);
    let d2 = parseDate(fimStr);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return -1;
    return Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  } catch (e) { return -1; }
};

const calculateTimeSpan = (inicio, fim) => {
  let diffDays = parseDuracaoDays(inicio, fim);
  if (diffDays < 0) return '';
  if (diffDays === 0) return '0 dias';
  if (diffDays === 1) return '1 dia';
  if (diffDays < 14) return `${diffDays} dias`;
  if (diffDays < 60) {
    let w = Math.round(diffDays / 7);
    return `${w} ${w === 1 ? 'semana' : 'semanas'}`;
  }
  if (diffDays < 365) {
    let m = Math.round(diffDays / 30);
    return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  }
  let y = Math.floor(diffDays / 365);
  let remDays = diffDays % 365;
  let m = Math.round(remDays / 30);
  if (m === 0) return `${y} ${y === 1 ? 'ano' : 'anos'}`;
  if (m === 12) return `${y + 1} anos`;
  return `${y} ${y === 1 ? 'ano' : 'anos'} e ${m} ${m === 1 ? 'mês' : 'meses'}`;
};

const getNumericTempo = (tempoVal) => {
  let str = formatTempoStr(tempoVal);
  let hrs = 0;
  let mins = 0;
  let hMatch = str.match(/(\d+)h/);
  let mMatch = str.match(/(\d+)m/);
  if (hMatch) hrs = parseInt(hMatch[1], 10);
  if (mMatch) mins = parseInt(mMatch[1], 10);
  return hrs + (mins / 60);
};

const formatTotalTempoHrs = (numHrs) => {
   if (!numHrs || isNaN(numHrs) || numHrs <= 0) return '-';
   if (Number.isInteger(numHrs)) return `${numHrs}h`;
   return `${numHrs.toFixed(1)}h`;
};

const calculateDiscount = (pPago, pOrig) => {
  let pago = getNumericPrice(pPago);
  let orig = getNumericPrice(pOrig);
  if (orig > pago && orig > 0) {
    let diff = orig - pago;
    let pct = Math.round((diff / orig) * 100);
    return { val: `R$ ${diff.toFixed(2).replace('.', ',')}`, pct: `${pct}%`, has: true, rawDiff: diff, pago: pago, orig: orig };
  }
  return { has: false, rawDiff: -1, pago: pago, orig: orig };
};

const getYoutubeId = (url) => {
  if(!url) return null;
  let match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
  return match ? match[1] : null;
};

const getConsoleStyle = (name) => {
  if (!name) return { bg: 'transparent', text: 'inherit' };
  let n = String(name).toUpperCase().trim();
  if (n === 'PS1' || n === 'PLAYSTATION 1') return { bg: '#D9D9D9', text: '#222222' };
  if (n === 'PS2' || n === 'PLAYSTATION 2') return { bg: '#0B1E5B', text: '#79B8FF' };
  if (n === 'PS4' || n === 'PS5' || n.includes('PLAYSTATION')) return { bg: '#003791', text: '#FFFFFF' };
  if (n === 'SNES' || n === 'SUPER NINTENDO') return { bg: '#6B4BAE', text: '#FFFFFF' };
  if (n === 'NES' || n === 'NINTENDINHO') return { bg: '#5B5B5B', text: '#E60012' };
  if (n === 'WII') return { bg: '#FFFFFF', text: '#00AEEF' };
  if (n === 'GBA' || n === 'GAME BOY ADVANCE') return { bg: '#4B4B9F', text: '#FFFFFF' };
  if (n === 'GB' || n === 'GAME BOY' || n === 'GBC') return { bg: '#5B6D4A', text: '#DFF5C0' };
  if (n === 'MEGA DRIVE' || n === 'GENESIS') return { bg: '#111111', text: '#D4AF37' };
  if (n === 'MASTER SYSTEM') return { bg: '#111111', text: '#E53935' };
  if (n === 'DS' || n === '3DS') return { bg: '#F5F5F5', text: '#444444' };
  if (n === 'PC' || n === 'STEAM') return { bg: '#111111', text: '#76B900' };
  return { bg: '#FFD3B6', text: '#000000' }; 
};

const getSuporteInfo = (name) => {
  let n = String(name).toLowerCase();
  let categoria = 'Digital';
  if (n.includes('físico') || n.includes('fisico') || n.includes('dvd') || n.includes('bd') || n.includes('blu-ray') || n.includes('cd') || n.includes('cartucho') || n.includes('disco')) {
     categoria = 'Físico';
  }
  
  let subCategoria = name || '-';
  if (n.includes('opl')) subCategoria = 'OPL (Open PS2 Loader)';
  else if (n.includes('dvd')) subCategoria = 'DVD';
  else if (n.includes('bd') || n.includes('blu') || n.includes('blu-ray') || n.includes('bluray')) subCategoria = 'Blu-Ray';
  else if (n.includes('cartucho')) subCategoria = 'Cartucho';
  else if (n.includes('cd')) subCategoria = 'CD';
  else if (n.includes('steam')) subCategoria = 'Steam (PC)';
  else if (n.includes('psn') || n.includes('ps store') || n.includes('playstation store')) subCategoria = 'PlayStation Network (Digital)';
  else if (n.includes('eshop') || n.includes('nintendo eshop')) subCategoria = 'Nintendo eShop (Digital)';
  else if (n.includes('xbox live') || n.includes('xbox store')) subCategoria = 'Xbox Store (Digital)';
  else if (n.includes('epic')) subCategoria = 'Epic Games Store (Digital)';
  else if (n.includes('gog')) subCategoria = 'GOG (Digital)';
  
  return { categoria, subCategoria };
};

const ConsoleIcon = ({ consoleName }) => {
  if (!consoleName) return null;
  const c = String(consoleName).toLowerCase();
  if (c.includes('ps4') || c.includes('ps5') || c.includes('playstation') || c.includes('ps3') || c.includes('ps2') || c.includes('ps1')) return (
    <svg className="w-4 h-4 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M8.322 3.123v13.911l3.528 1.139V3.123zM0 16.518l6.398 2.052v-2.736L2.33 14.526l4.068-.788v-2.036L0 13.064zm13.882.261l9.118 2.923-2.905 1.054-6.213-1.996v-1.981zm.001-4.717l9.117 2.924-2.905 1.053-6.212-1.996v-1.981zM11.85 0C5.305 0 0 5.305 0 11.85s5.305 11.85 11.85 11.85-5.305 11.85-11.85S18.395 0 11.85 0z" fill="none"/><path d="M8.5 4.5 3 6.8v9.7l5.5 2V4.5zm12.5 12-5.5-2v2.5l5.5 1.8v-2.3zM14 13.8l5.5 1.8v-2.3L14 11.5v2.3z"/></svg>
  );
  if (c.includes('switch') || c.includes('wii') || c.includes('nintendo') || c.includes('snes') || c.includes('ds') || c.includes('gba') || c.includes('gamecube')) return (
    <svg className="w-4 h-4 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm14-7h-4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
  );
  if (c.includes('pc') || c.includes('steam')) return (
    <svg className="w-4 h-4 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-11.95 10.72L5.8 13.1a3.5 3.5 0 0 1 2.37-.89c.17 0 .34.01.5.04l3.12-4.52a4.48 4.48 0 0 1 5.21 4.27 4.5 4.5 0 0 1-8.31 2.33l-4.22 1.74A12 12 0 1 0 12 0zm-3.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
  );
  return <svg className="w-4 h-4 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>;
};

const getGenreColor = (name) => {
  let g = String(name || '').toLowerCase();
  if (!g || g === '-') return 'transparent';
  if (g.includes('rpg')) return '#C4B5FD'; 
  if (g.includes('ação') || g.includes('acao')) return '#FF8B94'; 
  if (g.includes('plataforma')) return '#A8E6CF'; 
  if (g.includes('luta')) return '#FCA5A5'; 
  if (g.includes('quebra') || g.includes('puzzle')) return '#FFD3B6'; 
  if (g.includes('estratégia')) return '#93C5FD'; 
  if (g.includes('sobrevivência') || g.includes('survival')) return '#86EFAC'; 
  if (g.includes('corrida')) return '#FDE047'; 
  if (g.includes('aventura')) return '#99F6E4';
  if (g.includes('mundo aberto')) return '#FDA4AF';
  return '#E2E8F0';
};

const getDifficultyBadge = (dif) => {
  let d = String(dif || '').toUpperCase().trim();
  if (!d || d === '-') return { text: '', bg: 'transparent' };
  if (d === 'A') return { text: 'A', bg: '#FF8B94' };
  if (d === 'B') return { text: 'B', bg: '#FFB3BA' };
  if (d === 'C') return { text: 'C', bg: '#A8E6CF' };
  if (d === 'D') return { text: 'D', bg: '#FFE5B4' };
  if (d === 'E') return { text: 'E', bg: '#FFD3B6' };
  return { text: d, bg: '#E2E8F0' };
};

const getRatingBadge = (notaVal) => {
  if (!notaVal || notaVal === '-') return null;
  let s = String(notaVal).trim().toUpperCase();
  if (s === 'S' || s === 'RANK S') return (
    <span className="inline-block px-3 py-1 font-black text-xs uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] animate-[pulse_2s_ease-in-out_infinite] text-slate-900 cursor-pointer hover:-translate-y-0.5 transition-transform">
      ⭐ S
    </span>
  );
  let num = parseFloat(s.replace(',', '.'));
  if (isNaN(num)) return <span className="font-bold">{s}</span>;
  let bg = num >= 9.0 ? '#A8E6CF' : num >= 7.5 ? '#C7F0DB' : num >= 6.0 ? '#FFE5B4' : '#FFD3B6';
  return (
    <span className="inline-block px-2.5 py-1 font-black text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: bg }}>
      {num.toFixed(1)}
    </span>
  );
};

const getPriceColor = (priceVal) => {
  if (priceVal === undefined || priceVal === null || priceVal === '' || priceVal === '-') return 'transparent';
  let p = getNumericPrice(priceVal);
  if (p === 0) return 'transparent';
  if (p >= 100) return '#FF8B94'; 
  if (p >= 40) return '#A8E6CF';
  return '#FFD3B6'; 
};

const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    if(isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) onChange(selected.filter(x => x !== opt));
    else onChange([...selected, opt]);
  };

  return (
    <div className="relative flex-1 min-w-[150px]" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`${theme.input} h-full cursor-pointer flex justify-between items-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]`}>
        <span className="truncate pr-2 text-[11px] font-black uppercase">
          {label} {selected.length > 0 ? `(${selected.length})` : ''}
        </span>
        <span className="text-[10px] shrink-0">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto z-50 bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col p-1">
          {options.map(o => (
            <label key={o} className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer text-xs font-bold uppercase border-b-[2px] border-slate-100 last:border-0 transition-colors">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggleOption(o)} className="w-3.5 h-3.5 accent-slate-900 shrink-0 cursor-pointer" />
              <span className="truncate">{o === 'S' ? 'Rank S' : o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  SortArrow: ({ asc }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`w-3 h-3 ml-1 inline-block transition-transform ${asc ? '' : 'rotate-180'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

export default function App() {
  const [appState, setAppState] = useState('booting'); 
  const [activeTab, setActiveTab] = useState('finished');
  const [configUrl, setConfigUrl] = useState('');
  const [games, setGames] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ type: 'idle', message: '' });
  const [addStatus, setAddStatus] = useState({ type: 'idle', message: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ console: [], genero: [], nota: [], dif: [], suporte: [] });
  
  const [descontoSort, setDescontoSort] = useState('desc_val_desc');
  // Alterado para ordem decrescente (do maior ID para o menor, exibindo o último no topo)
  const [sortConfig, setSortConfig] = useState({ key: 'ordem', direction: 'desc' }); 

  const [viewModal, setViewModal] = useState(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [fichaData, setFichaData] = useState({});
  const [fichaStatus, setFichaStatus] = useState({ type: 'idle', message: '' });

  const blankForm = { status: 'Finalizado', titulo: '', plataforma: '', franquia: '', inicio: '', fim: '', tempo: '', nota: '', dificuldade: '', conquistas: '', preco: '', preco_original: '', suporte: '', midia: '', comentarios: '' };
  const [formData, setFormData] = useState(blankForm);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      const savedUrl = localStorage.getItem('gas_url');
      if (savedUrl) {
        setConfigUrl(savedUrl);
        setAppState('loading');
        fetchGames(savedUrl);
      } else {
        setAppState('config');
      }
    }, 1500);
    return () => clearTimeout(bootTimer);
  }, []);

  const fetchGames = async (url) => {
    setSyncStatus({ type: 'loading', message: 'Sincronizando com a Planilha...' });
    try {
      const response = await fetch(url);
      const data = await response.json();
      if(data.error) throw new Error(data.error);
      
      const finishedGames = Array.isArray(data.finished) ? data.finished.map((g, idx, arr) => ({...g, _fallbackId: arr.length - idx})) : [];
      const backlogGames = Array.isArray(data.backlog) ? data.backlog.map((g, idx, arr) => ({...g, _fallbackId: arr.length - idx})) : [];
      
      setGames([...finishedGames, ...backlogGames]);
      setAppState('ready');
      setSyncStatus({ type: 'success', message: 'Sincronizado com Sucesso!' });
      setTimeout(() => setSyncStatus({ type: 'idle', message: '' }), 3000);
    } catch (err) {
      setSyncStatus({ type: 'error', message: 'Erro! Verifique o link e a Nova Implantação.' });
      setAppState('config');
    }
  };

  const saveConfig = () => {
    localStorage.setItem('gas_url', configUrl);
    setAppState('loading');
    fetchGames(configUrl);
  };

  const executeApiCall = async (action, data, statusUpdateFn) => {
    statusUpdateFn({ type: 'loading', message: 'Salvando na planilha...' });
    try {
      const res = await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify({ action, data }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await res.json();
      if(result.error) throw new Error(result.error);
      await fetchGames(configUrl);
      statusUpdateFn({ type: 'success', message: 'Salvo com sucesso!' });
      setTimeout(() => statusUpdateFn({ type: 'idle', message: '' }), 3000);
      return true;
    } catch(err) {
      statusUpdateFn({ type: 'error', message: 'Erro ao salvar.' });
      return false;
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const success = await executeApiCall('ADD', { ...formData, id: 'temp_id' }, setAddStatus);
    if (success) setFormData(blankForm);
  };

  const handleUpdateFicha = async () => {
    const success = await executeApiCall('UPDATE', fichaData, setFichaStatus);
    if (success) {
      setIsEditingFicha(false);
      setViewModal({ type: 'game', data: fichaData }); 
    }
  };

  const handleDelete = async (id) => {
    setFichaStatus({ type: 'loading', message: 'Excluindo jogo da planilha...' });
    try {
      await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'DELETE', id }) });
      await fetchGames(configUrl);
      setFichaStatus({ type: 'success', message: 'Jogo excluído com sucesso!' });
      setTimeout(() => {
        setViewModal(null);
        setFichaStatus({ type: 'idle', message: '' });
      }, 1500);
    } catch(e) {
      setFichaStatus({ type: 'error', message: 'Erro ao excluir o jogo.' });
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const resetHome = () => {
     setActiveTab('dashboard');
     setSearchTerm('');
     setFilters({ console: [], genero: [], nota: [], dif: [], suporte: [] });
  };

  const isValBlank = (val) => val === '' || val === null || val === undefined || val === '-' || (typeof val === 'number' && isNaN(val)) || (typeof val === 'number' && val === -1);

  const sortedAndFilteredGames = useMemo(() => {
    let list = games;
    if (activeTab === 'finished') list = games.filter(g => g.status === 'Finalizado');
    if (activeTab === 'backlog') list = games.filter(g => g.status === 'Backlog');
    
    if (filters.console.length > 0) list = list.filter(g => filters.console.includes(getVal(g, ['plataforma', 'console'])));
    if (filters.genero.length > 0) list = list.filter(g => filters.genero.includes(getVal(g, ['franquia', 'genero', 'gênero'])));
    if (filters.dif.length > 0) list = list.filter(g => filters.dif.includes(String(getVal(g, ['dificuldade'])).toUpperCase().trim()));
    if (filters.suporte.length > 0) list = list.filter(g => filters.suporte.includes(getVal(g, ['suporte'])));
    
    if (filters.nota.length > 0) {
      list = list.filter(g => {
        let n = String(getVal(g, ['nota'])).toUpperCase().trim();
        if (n === 'S') return filters.nota.includes('S');
        let num = parseFloat(n.replace(',', '.'));
        return !isNaN(num) && filters.nota.includes(String(Math.floor(num)));
      });
    }

    if (searchTerm) {
      list = list.filter(g => {
        let t = getVal(g, ['titulo', 'nome']);
        let p = getVal(g, ['plataforma', 'console']);
        let f = getVal(g, ['franquia', 'genero', 'gênero']);
        return String(t).toLowerCase().includes(searchTerm.toLowerCase()) ||
               String(p).toLowerCase().includes(searchTerm.toLowerCase()) ||
               String(f).toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    list.sort((a, b) => {
      let valA, valB;
      if (sortConfig.key === 'ordem') {
        valA = parseInt(getVal(a, ['#', 'ordem', 'numero'])) || a._fallbackId || 0;
        valB = parseInt(getVal(b, ['#', 'ordem', 'numero'])) || b._fallbackId || 0;
      } else if (sortConfig.key === 'nota') {
        const p = x => {
          let s = String(x).toUpperCase().trim();
          if (s === 'S' || s === 'RANK S') return 999;
          return parseFloat(s.replace(',','.')) || -1;
        };
        valA = p(getVal(a, ['nota'])); valB = p(getVal(b, ['nota']));
      } else if (sortConfig.key === 'tempo') {
        valA = getNumericTempo(getVal(a, ['tempo']));
        valB = getNumericTempo(getVal(b, ['tempo']));
        if (valA === 0) valA = -1; if (valB === 0) valB = -1;
      } else if (sortConfig.key === 'duracao') {
        valA = parseDuracaoDays(getVal(a, ['inicio', 'iniciado']), getVal(a, ['fim', 'termino']));
        valB = parseDuracaoDays(getVal(b, ['inicio', 'iniciado']), getVal(b, ['fim', 'termino']));
      } else if (sortConfig.key === 'preco') {
        valA = getNumericPrice(getVal(a, ['preco', 'preco pago']));
        valB = getNumericPrice(getVal(b, ['preco', 'preco pago']));
        if (valA === 0) valA = -1; if (valB === 0) valB = -1;
      } else if (sortConfig.key === 'preco_original') {
        valA = getNumericPrice(getVal(a, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
        valB = getNumericPrice(getVal(b, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
        if (valA === 0) valA = -1; if (valB === 0) valB = -1;
      } else if (sortConfig.key === 'desconto') {
        const getDesc = x => calculateDiscount(getVal(x, ['preco', 'preco pago']), getVal(x, ['preco_original', 'preco sem desconto', 'preço sem desconto'])).rawDiff;
        valA = getDesc(a); valB = getDesc(b);
      } else {
        valA = String(getVal(a, [sortConfig.key])).toLowerCase();
        valB = String(getVal(b, [sortConfig.key])).toLowerCase();
      }

      let blankA = isValBlank(valA); let blankB = isValBlank(valB);
      if (blankA && blankB) return 0;
      if (blankA) return 1;  
      if (blankB) return -1; 
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [games, activeTab, searchTerm, sortConfig, filters]);

  const dashboardStats = useMemo(() => {
    let fin = sortedAndFilteredGames.filter(g => g.status === 'Finalizado');
    let totalJogos = fin.length;
    let sRanks = fin.filter(g => String(getVal(g, ['nota'])).toUpperCase().trim() === 'S').length;
    let notasValidas = fin.map(g => parseFloat(String(getVal(g, ['nota'])).replace(',','.'))).filter(n => !isNaN(n));
    let avgNota = notasValidas.length > 0 ? (notasValidas.reduce((a,b)=>a+b,0) / notasValidas.length).toFixed(1) : 0;
    
    let stats = { 
      totalJogos, sRanks, avgNota, totalGasto: 0, totalEconomia: 0,
      notas: { '10': 0, '9': 0, '8': 0, '7': 0, '6': 0, '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, '0': 0 },
      dif: { A: 0, B: 0, C: 0, D: 0, E: 0 }, consoles: {}, generos: {}
    };

    fin.forEach(g => {
      let pPago = getNumericPrice(getVal(g, ['preco', 'preco pago']));
      let pOrig = getNumericPrice(getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
      
      stats.totalGasto += pPago;
      if(pOrig > pPago && pOrig > 0) stats.totalEconomia += (pOrig - pPago);

      let n = parseFloat(String(getVal(g, ['nota'])).replace(',','.'));
      if(!isNaN(n)) {
        let baseNote = Math.floor(n); 
        if (baseNote >= 0 && baseNote <= 10) stats.notas[String(baseNote)]++;
      }

      let d = String(getVal(g, ['dificuldade'])).toUpperCase().trim();
      if(stats.dif[d] !== undefined) stats.dif[d]++;

      let consoleName = getVal(g, ['plataforma', 'console']) || 'Desconhecido';
      let genreName = getVal(g, ['franquia', 'genero', 'gênero']) || 'Desconhecido';
      let tHrs = getNumericTempo(getVal(g, ['tempo']));

      if(consoleName && consoleName !== '-' && consoleName !== 'Desconhecido') {
        if(!stats.consoles[consoleName]) stats.consoles[consoleName] = { count: 0, totalNota: 0, notaCount: 0, totalTempo: 0 };
        stats.consoles[consoleName].count++;
        stats.consoles[consoleName].totalTempo += tHrs;
        if(!isNaN(n)) { stats.consoles[consoleName].totalNota += n; stats.consoles[consoleName].notaCount++; }
      }

      if(genreName && genreName !== '-' && genreName !== 'Desconhecido') {
        if(!stats.generos[genreName]) stats.generos[genreName] = { count: 0, totalNota: 0, notaCount: 0, totalTempo: 0 };
        stats.generos[genreName].count++;
        stats.generos[genreName].totalTempo += tHrs;
        if(!isNaN(n)) { stats.generos[genreName].totalNota += n; stats.generos[genreName].notaCount++; }
      }
    });

    Object.keys(stats.consoles).forEach(c => stats.consoles[c].avgNota = stats.consoles[c].notaCount > 0 ? (stats.consoles[c].totalNota / stats.consoles[c].notaCount).toFixed(1) : 0);
    Object.keys(stats.generos).forEach(c => stats.generos[c].avgNota = stats.generos[c].notaCount > 0 ? (stats.generos[c].totalNota / stats.generos[c].notaCount).toFixed(1) : 0);
    stats.totalGastoStr = `R$ ${stats.totalGasto.toFixed(2).replace('.',',')}`;
    return stats;
  }, [sortedAndFilteredGames]);

  const uniqueOptions = useMemo(() => {
    let opts = { console: new Set(), genero: new Set(), suporte: new Set(), condicao: new Set() };
    games.forEach(g => {
      let c = getVal(g, ['plataforma', 'console']); if (c && c !== '-') opts.console.add(c);
      let gen = getVal(g, ['franquia', 'genero', 'gênero']); if (gen && gen !== '-') opts.genero.add(gen);
      let s = getVal(g, ['suporte']); if (s && s !== '-') opts.suporte.add(s);
      let con = getVal(g, ['conquistas', 'condicao', 'condição']); if (con && con !== '-') opts.condicao.add(con);
    });
    return {
      console: Array.from(opts.console).sort(),
      genero: Array.from(opts.genero).sort(),
      suporte: Array.from(opts.suporte).sort(),
      condicao: Array.from(opts.condicao).sort(),
      nota: ['S', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'],
      dif: ['A', 'B', 'C', 'D', 'E']
    };
  }, [games]);

  const Th = ({ label, sortKey, className = "" }) => (
    <th onClick={() => handleSort(sortKey)} className={`p-2 border-r-[3px] border-slate-900 cursor-pointer hover:bg-black/5 transition-colors whitespace-nowrap ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <span>{label}</span>
        {sortConfig.key === sortKey && <Icons.SortArrow asc={sortConfig.direction === 'asc'} />}
      </div>
    </th>
  );

  const renderGameTable = (list) => {
    const isBacklog = activeTab === 'backlog' && !viewModal;
    return (
    <div className={`overflow-x-auto border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white pb-2 max-w-full`}>
      <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] font-bold">
        <thead>
          <tr className={`${activeTab === 'finished' || viewModal ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase font-black text-slate-900`}>
            <Th label="#" sortKey="ordem" className="text-center w-10" />
            <Th label="NOME DO JOGO" sortKey="titulo" />
            <Th label="CONSOLE" sortKey="plataforma" />
            <Th label="GÊNERO" sortKey="franquia" />
            <Th label="INÍCIO" sortKey="inicio" className="text-center" />
            {!isBacklog && <Th label="FIM" sortKey="fim" className="text-center" />}
            {!isBacklog && <Th label="TEMPO TOTAL" sortKey="tempo" className="text-center" />}
            {!isBacklog && <Th label="DURAÇÃO" sortKey="duracao" className="text-center" />}
            {!isBacklog && <Th label="NOTA" sortKey="nota" className="text-center" />}
            {!isBacklog && <Th label="DIF" sortKey="dificuldade" className="text-center" />}
            <Th label="CONDIÇÃO" sortKey="conquistas" />
            <Th label="PREÇO PAGO" sortKey="preco" className="text-center" />
            <Th label="PREÇO S/ DESC." sortKey="preco_original" className="text-center" />
            {!isBacklog && <Th label="DESCONTO" sortKey="desconto" className="text-center" />}
            <Th label="SUPORTE" sortKey="suporte" className="text-center border-r-0" />
          </tr>
        </thead>
        <tbody>
          {list.map((game, i) => {
            let visualId = getVal(game, ['#', 'ordem', 'numero']) || game._fallbackId; 
            let titulo = getVal(game, ['titulo', 'nome']);
            let plataforma = getVal(game, ['plataforma', 'console']);
            let genero = getVal(game, ['franquia', 'genero', 'gênero']);
            let inicio = getVal(game, ['inicio', 'iniciado']);
            let fim = getVal(game, ['fim', 'termino']);
            let tempo = getVal(game, ['tempo']);
            let nota = getVal(game, ['nota']);
            let dif = getVal(game, ['dificuldade']);
            let cond = getVal(game, ['conquistas', 'condicao', 'condição']);
            let pricePago = getVal(game, ['preco', 'preco pago']);
            let priceSemDesc = getVal(game, ['preco_original', 'preco sem desconto', 'preço sem desconto']);
            let sup = getVal(game, ['suporte']);
            
            let discount = calculateDiscount(pricePago, priceSemDesc);
            const consoleStyle = getConsoleStyle(plataforma);
            const displayClean = (val) => (val && val !== '-' ? val : '');
            
            return (
              <tr key={game.id || i} className="border-b-[2px] border-slate-900 hover:bg-slate-50 transition-colors">
                <td className="p-2 border-r-[3px] border-slate-900 text-center font-black bg-slate-100 whitespace-nowrap">{visualId}</td>
                <td onClick={() => { 
                      setFichaData({...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc}); 
                      setViewModal({type:'game', data: {...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, inicio, fim, tempo, nota, dificuldade: dif, conquistas: cond, suporte: sup}}); 
                      setIsEditingFicha(false); 
                    }} 
                    className="p-2 border-r-[3px] border-slate-900 font-black text-xs cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4 whitespace-normal break-words min-w-[150px]">
                  {displayClean(titulo)}
                </td>
                
                <td onClick={() => { if(displayClean(plataforma)) setViewModal({type:'console', data: plataforma}) }} className="p-2 border-r-[3px] border-slate-900 cursor-pointer whitespace-nowrap">
                  {displayClean(plataforma) && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform font-black uppercase" style={{ backgroundColor: consoleStyle.bg, color: consoleStyle.text }}>
                      <ConsoleIcon consoleName={plataforma} /> {plataforma}
                    </span>
                  )}
                </td>
                
                <td onClick={() => { if(displayClean(genero)) setViewModal({type:'genre', data: genero}) }} className="p-2 border-r-[3px] border-slate-900 cursor-pointer whitespace-nowrap">
                  {displayClean(genero) && (
                     <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 uppercase font-black shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{backgroundColor: getGenreColor(genero)}}>
                       {genero}
                     </span>
                  )}
                </td>

                <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{formatDateStr(inicio)}</td>
                {!isBacklog && <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{formatDateStr(fim)}</td>}
                {!isBacklog && <td className="p-2 border-r-[3px] border-slate-900 text-center font-black whitespace-nowrap">{formatTempoStr(tempo)}</td>}
                {!isBacklog && <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap font-bold text-slate-600">{calculateTimeSpan(inicio, fim)}</td>}
                
                {!isBacklog && (
                  <td onClick={() => { if(displayClean(nota)) setViewModal({type:'note', data: nota}) }} className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                    {getRatingBadge(nota)}
                  </td>
                )}
                
                {!isBacklog && (
                  <td onClick={() => { if(displayClean(dif)) setViewModal({type:'diff', data: dif}) }} className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                    {displayClean(dif) && (
                      <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase font-black cursor-pointer hover:-translate-y-0.5 transition-transform" style={{backgroundColor: getDifficultyBadge(dif).bg}}>
                        {getDifficultyBadge(dif).text}
                      </span>
                    )}
                  </td>
                )}
                
                <td className="p-2 border-r-[3px] border-slate-900 max-w-[150px] whitespace-normal break-words">{displayClean(cond)}</td>
                
                <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                  {displayClean(pricePago) && (
                    <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(pricePago)}}>
                      {formatCurrency(pricePago)}
                    </span>
                  )}
                </td>
                
                <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                  {displayClean(priceSemDesc) && (
                    <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(priceSemDesc)}}>
                      {formatCurrency(priceSemDesc)}
                    </span>
                  )}
                </td>
                
                {!isBacklog && (
                  <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                    {discount.has && (
                      <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] group relative cursor-help" style={{backgroundColor: getPriceColor(discount.rawDiff)}}>
                        {discount.val} ({discount.pct})
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">Economia de {discount.val}</div>
                      </span>
                    )}
                  </td>
                )}
                
                <td onClick={() => { if(displayClean(sup)) setViewModal({type:'suporte', data: sup}) }} className="p-2 border-slate-900 text-center whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4">
                  {displayClean(sup)}
                </td>
              </tr>
            );
          })}
          {list.length === 0 && <tr><td colSpan="15" className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-lg">Nenhum jogo nesta lista.</td></tr>}
        </tbody>
      </table>
    </div>
  )};

  if (appState === 'booting' || (appState === 'loading' && games.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-36 h-36 drop-shadow-xl" />
          <div className="flex flex-col items-center text-center">
             <div className={`px-4 py-2 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform -rotate-2`}>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Ludorum</h1>
             </div>
             <div className={`px-4 py-1 mt-2 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform rotate-1`}>
                <h2 className="text-xl font-bold uppercase tracking-widest">Memorabilia</h2>
             </div>
          </div>
          <div className="mt-6 text-slate-800 font-black uppercase text-xs">Sincronizando Biblioteca...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-2 sm:p-4 selection:bg-pink-200 relative">
      
      {/* HEADER (Logo + Barra de Busca) */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div onClick={resetHome} className="flex items-center gap-4 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" title="Voltar ao Início e Limpar Filtros">
          <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14" />
          <div className={`p-1.5 sm:p-2 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform -rotate-1`}>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Ludorum</h1>
          </div>
          <div className={`p-1 sm:p-1.5 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform rotate-1`}>
            <h2 className="text-sm sm:text-lg font-bold uppercase tracking-widest">Memorabilia</h2>
          </div>
        </div>
        
        {(activeTab === 'dashboard' || activeTab === 'finished' || activeTab === 'backlog') && (
          <div className="flex-grow max-w-md flex items-center">
            <input type="text" placeholder="🔍 Buscar por título, console ou gênero..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${theme.input} shadow-[4px_4px_0_0_rgba(15,23,42,1)]`} />
          </div>
        )}
      </div>

      <div className={`max-w-[1600px] mx-auto ${theme.border} ${theme.card} flex flex-col bg-white overflow-hidden`}>
        {/* NAVEGAÇÃO / ABAS */}
        <nav className="flex flex-row overflow-x-auto sm:grid sm:grid-cols-5 border-b-[3px] border-slate-900 bg-slate-100">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
            { id: 'finished', label: 'Finalizados', icon: Icons.List },
            { id: 'backlog', label: 'Backlog', icon: Icons.List },
            { id: 'add', label: 'Novo Jogo', icon: Icons.Plus },
            { id: 'config', label: 'Config', icon: Icons.Settings }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 min-w-[100px] w-full transition-colors border-r-[3px] border-slate-900 ${activeTab === t.id ? theme.gold : 'bg-white hover:bg-slate-50'}`}>
              <t.icon /> <span className="text-xs sm:text-sm font-black uppercase">{t.label}</span>
            </button>
          ))}
        </nav>

        {appState === 'loading' && (
          <div className="h-1.5 w-full bg-slate-200 relative overflow-hidden border-b-[3px] border-slate-900">
            <div className="absolute top-0 left-0 h-full bg-[#FF8B94] animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        <main className="p-4 sm:p-6 overflow-x-auto">
          
          {/* BARRA DE FILTROS LADO A LADO */}
          {(activeTab === 'dashboard' || activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-row flex-wrap gap-2 mb-4 w-full">
               <MultiSelectDropdown label="Consoles" options={uniqueOptions.console} selected={filters.console} onChange={(v) => setFilters({...filters, console: v})} />
               <MultiSelectDropdown label="Gêneros" options={uniqueOptions.genero} selected={filters.genero} onChange={(v) => setFilters({...filters, genero: v})} />
               <MultiSelectDropdown label="Notas" options={uniqueOptions.nota} selected={filters.nota} onChange={(v) => setFilters({...filters, nota: v})} />
               <MultiSelectDropdown label="Dificuldades" options={uniqueOptions.dif} selected={filters.dif} onChange={(v) => setFilters({...filters, dif: v})} />
               <MultiSelectDropdown label="Suportes" options={uniqueOptions.suporte} selected={filters.suporte} onChange={(v) => setFilters({...filters, suporte: v})} />
            </div>
          )}

          {/* DASHBOARD COMPLETO */}
          {activeTab === 'dashboard' && (
             <div className="flex flex-col gap-6">
                
                {/* 4 Cards Superiores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 ${theme.border} bg-[#A8E6CF] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                    <h3 className="text-xs font-black uppercase">Total Finalizados</h3>
                    <p className="text-4xl font-black">{dashboardStats.totalJogos}</p>
                  </div>
                  <div onClick={() => setViewModal({type:'note', data: 'S'})} className={`p-4 ${theme.border} bg-gradient-to-r from-[#FF8B94] to-[#FFD3B6] shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity`}>
                    <h3 className="text-xs font-black uppercase">Obras-Primas (Rank S)</h3>
                    <p className="text-4xl font-black">{dashboardStats.sRanks}</p>
                  </div>
                  <div className={`p-4 ${theme.border} bg-[#93C5FD] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                    <h3 className="text-xs font-black uppercase">Nota Média</h3>
                    <p className="text-4xl font-black">{dashboardStats.avgNota}</p>
                  </div>
                  <div className={`p-4 ${theme.border} bg-[#FDE047] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                    <h3 className="text-xs font-black uppercase">Total Investido</h3>
                    <p className="text-2xl font-black mt-2">{dashboardStats.totalGastoStr}</p>
                  </div>
                </div>

                {/* Descontos + Economia Geral */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className={`lg:col-span-2 p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-fit`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b-[3px] border-slate-900 pb-2 gap-2">
                      <h3 className="text-sm font-black uppercase">Descontos por Jogo</h3>
                      <select value={descontoSort} onChange={e=>setDescontoSort(e.target.value)} className="text-[10px] p-1.5 border-[2px] border-slate-900 font-bold outline-none cursor-pointer bg-slate-50 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                         <option value="desc_val_desc">Maior Desconto (R$)</option>
                         <option value="desc_val_asc">Menor Desconto (R$)</option>
                         <option value="pago_desc">Maior Preço Pago</option>
                         <option value="pago_asc">Menor Preço Pago</option>
                         <option value="orig_desc">Maior Preço Original</option>
                         <option value="alfa_asc">Alfabética (A-Z)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                      {sortedAndFilteredGames.filter(g => g.status === 'Finalizado' && calculateDiscount(getVal(g, ['preco', 'preco pago']), getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto'])).has)
                            .sort((a,b) => {
                               let dA = calculateDiscount(getVal(a, ['preco', 'preco pago']), getVal(a, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                               let dB = calculateDiscount(getVal(b, ['preco', 'preco pago']), getVal(b, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                               if (descontoSort === 'alfa_asc') return getVal(a, ['titulo', 'nome']).localeCompare(getVal(b, ['titulo', 'nome']));
                               if (descontoSort === 'pago_asc') return dA.pago - dB.pago;
                               if (descontoSort === 'pago_desc') return dB.pago - dA.pago;
                               if (descontoSort === 'orig_desc') return dB.orig - dA.orig;
                               if (descontoSort === 'desc_val_asc') return dA.rawDiff - dB.rawDiff;
                               return dB.rawDiff - dA.rawDiff; // default desc_val_desc
                            })
                            .map((g, i) => {
                        let d = calculateDiscount(getVal(g, ['preco', 'preco pago']), getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                        let pctPago = (d.pago / d.orig) * 100;
                        let pctDesc = (d.rawDiff / d.orig) * 100;
                        let nomeJogo = getVal(g, ['titulo', 'nome']);
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase w-full">
                             <div className="w-1/3 truncate text-right pr-2" title={nomeJogo}>{nomeJogo}</div>
                             <div className="flex w-2/3 h-4 border-[2px] border-slate-900 bg-slate-100">
                               <div className="bg-[#3B82F6] h-full relative group" style={{width: `${pctPago}%`}} title={`${nomeJogo} - Preço Pago: R$ ${d.pago.toFixed(2).replace('.', ',')}`}>
                               </div>
                               <div className="bg-[#EF4444] h-full relative group cursor-help" style={{width: `${pctDesc}%`}} title={`${nomeJogo} - Desconto de R$ ${d.rawDiff.toFixed(2).replace('.', ',')} (${d.pct})`}>
                                  <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">-{d.pct}</div>
                               </div>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col justify-between items-center h-fit`}>
                    <h3 className="text-sm font-black uppercase mb-4 w-full text-center border-b-[3px] border-slate-900 pb-2">Economia Geral</h3>
                    <div className="w-full flex-grow flex flex-row justify-center items-center mb-4 mt-2 gap-2">
                       <div className="w-[80px] sm:w-[100px] flex flex-col border-[3px] border-slate-900 h-[220px] bg-slate-100 relative shadow-[4px_4px_0_0_rgba(15,23,42,1)]" title={`Gasto Total + Economia Total = R$ ${(dashboardStats.totalGasto + dashboardStats.totalEconomia).toFixed(2).replace('.', ',')}`}>
                          <div className="w-full bg-[#EF4444] flex items-center justify-center flex-col transition-all group relative cursor-help" style={{height: `${dashboardStats.totalGasto + dashboardStats.totalEconomia > 0 ? (dashboardStats.totalEconomia / (dashboardStats.totalGasto + dashboardStats.totalEconomia)) * 100 : 0}%`}}>
                             <span className="text-white font-black text-xs md:text-sm">{dashboardStats.totalEconomia.toFixed(2)}</span>
                             <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 z-10 pointer-events-none">Total Economizado</div>
                          </div>
                          <div className="w-full bg-[#3B82F6] flex items-center justify-center flex-col transition-all group relative cursor-help" style={{height: `${dashboardStats.totalGasto + dashboardStats.totalEconomia > 0 ? (dashboardStats.totalGasto / (dashboardStats.totalGasto + dashboardStats.totalEconomia)) * 100 : 0}%`}}>
                             <span className="text-white font-black text-xs md:text-sm">{dashboardStats.totalGasto.toFixed(2)}</span>
                             <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 z-10 pointer-events-none">Total Gasto Real</div>
                          </div>
                       </div>
                       <div className="flex items-center text-slate-800 pointer-events-none">
                           <span className="text-[60px] font-light leading-none -translate-y-1">{'}'}</span>
                           <div className="flex flex-col ml-1">
                             <span className="text-[10px] font-black uppercase leading-tight text-slate-500">Total Cheio</span>
                             <span className="text-lg sm:text-xl font-black leading-none">{(dashboardStats.totalGasto + dashboardStats.totalEconomia).toFixed(2).replace('.',',')}</span>
                           </div>
                       </div>
                    </div>
                    <div className="w-full bg-[#991B1B] text-white p-2 border-[3px] border-slate-900 text-center font-black uppercase sm:text-lg lg:text-xl shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                       Economia R$ {dashboardStats.totalEconomia.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>

                {/* GRID DE 4 COLUNAS COMPACTO PARA OS DEMAIS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                   
                   {/* Dificuldade */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Por Dificuldade</h3>
                     <div className="flex flex-col gap-2">
                       {['A', 'B', 'C', 'D', 'E'].map(d => (
                         <div key={d} onClick={() => setViewModal({type:'diff', data: d})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.dif[d]} jogos da dificuldade ${d} (${dashboardStats.totalJogos > 0 ? ((dashboardStats.dif[d] / dashboardStats.totalJogos) * 100).toFixed(1) : 0}%)`}>
                           <span className="inline-block w-6 text-center border-[2px] border-slate-900 py-0.5 group-hover:opacity-70 transition-opacity" style={{backgroundColor: getDifficultyBadge(d).bg}}>{d}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${dashboardStats.totalJogos > 0 ? (dashboardStats.dif[d] / dashboardStats.totalJogos) * 100 : 0}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.dif[d]}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                   
                   {/* Por Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Por Nota</h3>
                     <div className="flex flex-col gap-2">
                       {['S'].map(n => (
                         <div key={n} onClick={() => setViewModal({type:'note', data: n})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.sRanks} jogos (${dashboardStats.totalJogos > 0 ? ((dashboardStats.sRanks / dashboardStats.totalJogos) * 100).toFixed(1) : 0}%)`}>
                           <span className="inline-block w-8 text-center border-[2px] border-slate-900 py-0.5 bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] group-hover:opacity-80 transition-opacity">{n}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${dashboardStats.totalJogos > 0 ? (dashboardStats.sRanks / dashboardStats.totalJogos) * 100 : 0}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.sRanks}</span>
                         </div>
                       ))}
                       {['10', '9', '8', '7', '6', '5'].map(n => (
                         <div key={n} onClick={() => setViewModal({type:'note', data: n})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.notas[n]} jogos (${dashboardStats.totalJogos > 0 ? ((dashboardStats.notas[n] / dashboardStats.totalJogos) * 100).toFixed(1) : 0}%)`}>
                           <span className="inline-block w-8 text-center border-[2px] border-slate-900 py-0.5 group-hover:opacity-70 transition-opacity">{n}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${dashboardStats.totalJogos > 0 ? (dashboardStats.notas[n] / dashboardStats.totalJogos) * 100 : 0}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.notas[n]}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Top Consoles Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Consoles (Nota)</h3>
                     <table className="w-full text-left text-[10px] font-black uppercase">
                       <thead><tr className="border-b-[2px] border-slate-900"><th className="pb-1">Console</th><th className="pb-1 text-center">Jogos</th><th className="pb-1 text-center">Nota</th></tr></thead>
                       <tbody>
                         {Object.keys(dashboardStats.consoles).sort((a,b) => dashboardStats.consoles[b].avgNota - dashboardStats.consoles[a].avgNota).slice(0, 5).map(c => {
                           let stat = dashboardStats.consoles[c];
                           return (
                             <tr key={c} className="border-b border-slate-200">
                               <td className="py-2"><span onClick={()=>setViewModal({type:'console', data: c})} className="inline-flex cursor-pointer items-center gap-1 px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: getConsoleStyle(c).bg, color: getConsoleStyle(c).text }}><ConsoleIcon consoleName={c} /> {c}</span></td>
                               <td className="py-2 text-center">{stat.count}</td>
                               <td className="py-2 text-center">{stat.avgNota}</td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>
                   
                   {/* Top Consoles Tempo */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Consoles (Tempo)</h3>
                     <table className="w-full text-left text-[10px] font-black uppercase">
                       <thead><tr className="border-b-[2px] border-slate-900"><th className="pb-1">Console</th><th className="pb-1 text-center">Jogos</th><th className="pb-1 text-center">Tempo Total</th></tr></thead>
                       <tbody>
                         {Object.keys(dashboardStats.consoles).sort((a,b) => dashboardStats.consoles[b].totalTempo - dashboardStats.consoles[a].totalTempo).slice(0, 5).map(c => {
                           let stat = dashboardStats.consoles[c];
                           return (
                             <tr key={c} className="border-b border-slate-200">
                               <td className="py-2"><span onClick={()=>setViewModal({type:'console', data: c})} className="inline-flex cursor-pointer items-center gap-1 px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: getConsoleStyle(c).bg, color: getConsoleStyle(c).text }}><ConsoleIcon consoleName={c} /> {c}</span></td>
                               <td className="py-2 text-center">{stat.count}</td>
                               <td className="py-2 text-center text-blue-600">{formatTotalTempoHrs(stat.totalTempo)}</td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>

                   {/* Top Gêneros Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Gêneros (Nota)</h3>
                     <table className="w-full text-left text-[10px] font-black uppercase">
                       <thead><tr className="border-b-[2px] border-slate-900"><th className="pb-1">Gênero</th><th className="pb-1 text-center">Jogos</th><th className="pb-1 text-center">Nota</th></tr></thead>
                       <tbody>
                         {Object.keys(dashboardStats.generos).sort((a,b) => dashboardStats.generos[b].avgNota - dashboardStats.generos[a].avgNota).slice(0, 5).map(c => {
                           let stat = dashboardStats.generos[c];
                           return (
                             <tr key={c} className="border-b border-slate-200">
                               <td className="py-2"><span onClick={()=>setViewModal({type:'genre', data: c})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: getGenreColor(c)}}>{c}</span></td>
                               <td className="py-2 text-center">{stat.count}</td>
                               <td className="py-2 text-center">{stat.avgNota}</td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>

                   {/* Top Gêneros Tempo */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Gêneros (Tempo)</h3>
                     <table className="w-full text-left text-[10px] font-black uppercase">
                       <thead><tr className="border-b-[2px] border-slate-900"><th className="pb-1">Gênero</th><th className="pb-1 text-center">Jogos</th><th className="pb-1 text-center">Tempo Total</th></tr></thead>
                       <tbody>
                         {Object.keys(dashboardStats.generos).sort((a,b) => dashboardStats.generos[b].totalTempo - dashboardStats.generos[a].totalTempo).slice(0, 5).map(c => {
                           let stat = dashboardStats.generos[c];
                           return (
                             <tr key={c} className="border-b border-slate-200">
                               <td className="py-2"><span onClick={()=>setViewModal({type:'genre', data: c})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: getGenreColor(c)}}>{c}</span></td>
                               <td className="py-2 text-center">{stat.count}</td>
                               <td className="py-2 text-center text-blue-600">{formatTotalTempoHrs(stat.totalTempo)}</td>
                             </tr>
                           )
                         })}
                       </tbody>
                     </table>
                   </div>

                </div>

             </div>
          )}

          {/* LISTAS FINALS & BACKLOG */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <div className="text-xs font-black uppercase text-slate-500">Exibindo {sortedAndFilteredGames.length} jogos</div>
              </div>
              {renderGameTable(sortedAndFilteredGames)}
            </div>
          )}

          {/* ADICIONAR NOVO */}
          {activeTab === 'add' && (
            <div className={`p-6 bg-white ${theme.border} ${theme.card} max-w-4xl mx-auto`}>
              <h2 className="text-xl font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Adicionar Novo (Insere no topo da Planilha)</h2>
              
              {addStatus.type !== 'idle' && (
                <div className={`p-3 mb-4 font-bold text-sm text-center uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${addStatus.type === 'loading' ? 'bg-amber-200' : addStatus.type === 'success' ? 'bg-[#86EFAC]' : theme.pink}`}>
                  {addStatus.message}
                </div>
              )}

              <datalist id="consoles-list">{uniqueOptions.console.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="generos-list">{uniqueOptions.genero.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="suportes-list">{uniqueOptions.suporte.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="condicoes-list">{uniqueOptions.condicao.map(o => <option key={o} value={o} />)}</datalist>

              <form onSubmit={handleCreateNew} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Status *</label><select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className={theme.input}><option>Finalizado</option><option>Backlog</option></select></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input required value={formData.titulo} onChange={e=>setFormData({...formData, titulo: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list" value={formData.plataforma} onChange={e=>setFormData({...formData, plataforma: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list" value={formData.franquia} onChange={e=>setFormData({...formData, franquia: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input placeholder="DD/MM/YYYY ou YYYY-MM-DD" value={formData.inicio} onChange={e=>setFormData({...formData, inicio: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input placeholder="DD/MM/YYYY ou YYYY-MM-DD" value={formData.fim} onChange={e=>setFormData({...formData, fim: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input placeholder="Ex: 12h ou 120:00:00" value={formData.tempo} onChange={e=>setFormData({...formData, tempo: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label><input value={formData.nota} onChange={e=>setFormData({...formData, nota: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><select value={formData.dificuldade} onChange={e=>setFormData({...formData, dificuldade: e.target.value})} className={theme.input}><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input placeholder="69,90" value={formData.preco} onChange={e=>setFormData({...formData, preco: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço S/ Desconto</label><input placeholder="132,90" value={formData.preco_original} onChange={e=>setFormData({...formData, preco_original: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list" value={formData.suporte} onChange={e=>setFormData({...formData, suporte: e.target.value})} className={theme.input} /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={formData.midia} onChange={e=>setFormData({...formData, midia: e.target.value})} className={theme.input} /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><input list="condicoes-list" value={formData.conquistas} onChange={e=>setFormData({...formData, conquistas: e.target.value})} className={theme.input} /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={formData.comentarios} onChange={e=>setFormData({...formData, comentarios: e.target.value})} className={theme.input} rows="2" /></div>
                </div>
                <button type="submit" className={`${theme.btnBase} ${theme.cyan} mt-4`}>Salvar na Planilha</button>
              </form>
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          {activeTab === 'config' && (
             <div className={`max-w-xl mx-auto bg-white p-8 ${theme.border} ${theme.card}`}>
                <h2 className="text-2xl font-black mb-4 uppercase text-center">Alterar Conexão</h2>
                {syncStatus.type !== 'idle' && (
                  <div className={`p-3 mb-4 border-[2px] border-slate-900 font-bold text-xs text-center shadow-[4px_4px_0_0_rgba(15,23,42,1)] uppercase ${syncStatus.type === 'success' ? 'bg-[#86EFAC]' : syncStatus.type === 'error' ? theme.pink : 'bg-amber-200'}`}>
                    {syncStatus.message}
                  </div>
                )}
                <input type="url" value={configUrl} onChange={(e) => setConfigUrl(e.target.value)} placeholder="Cole a URL do Apps Script" className={`${theme.input} mb-4`} />
                <button onClick={saveConfig} className={`${theme.btnBase} ${theme.gold} w-full`}>Reconectar e Sincronizar</button>
             </div>
          )}

        </main>
      </div>

      {/* MODAL E FICHAS ABERTAS... */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-[1400px] bg-white ${theme.border} ${theme.card} flex flex-col my-auto shadow-2xl`}>
            
            <div className={`p-4 border-b-[3px] border-slate-900 flex justify-between items-center ${viewModal.type === 'game' && isEditingFicha ? theme.pink : theme.cyan}`}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate pr-4">
                {viewModal.type === 'game' && (isEditingFicha ? 'Editar Ficha' : viewModal.data.titulo)}
                {viewModal.type === 'console' && `Ficha do Console: ${viewModal.data}`}
                {viewModal.type === 'genre' && `Ficha do Gênero: ${viewModal.data}`}
                {viewModal.type === 'note' && `Jogos com Nota: ${viewModal.data}`}
                {viewModal.type === 'diff' && `Jogos com Dificuldade: ${viewModal.data}`}
                {viewModal.type === 'suporte' && `Ficha do Suporte: ${viewModal.data}`}
              </h2>
              <button onClick={() => setViewModal(null)} className="p-1 hover:bg-white/50 rounded-full transition-colors border-2 border-transparent hover:border-slate-900"><Icons.Close /></button>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 overflow-y-auto max-h-[75vh]">
              
              {/* FICHA DO JOGO */}
              {viewModal.type === 'game' && (
                <>
                  {fichaStatus.type !== 'idle' && (
                    <div className={`p-3 mb-4 font-bold text-sm text-center uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${fichaStatus.type === 'loading' ? 'bg-amber-200' : fichaStatus.type === 'success' ? 'bg-[#86EFAC]' : theme.pink}`}>
                      {fichaStatus.message}
                    </div>
                  )}

                  {!isEditingFicha ? (
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Console</span>
                          {viewModal.data.plataforma && viewModal.data.plataforma !== '-' ? (
                            <div>
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] font-black uppercase" style={{ backgroundColor: getConsoleStyle(viewModal.data.plataforma).bg, color: getConsoleStyle(viewModal.data.plataforma).text }}>
                                 <ConsoleIcon consoleName={viewModal.data.plataforma} /> {viewModal.data.plataforma}
                               </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Gênero</span>
                          {viewModal.data.franquia && viewModal.data.franquia !== '-' ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 uppercase font-black shadow-[1px_1px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: getGenreColor(viewModal.data.franquia)}}>
                                {viewModal.data.franquia}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500 mb-1">Nota</span><div>{getRatingBadge(viewModal.data.nota)}</div></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Dificuldade</span>
                          {viewModal.data.dificuldade && viewModal.data.dificuldade !== '-' ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase font-black" style={{backgroundColor: getDifficultyBadge(viewModal.data.dificuldade).bg}}>
                                {getDifficultyBadge(viewModal.data.dificuldade).text}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Início</span><span className="font-bold">{formatDateStr(viewModal.data.inicio)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Fim</span><span className="font-bold">{formatDateStr(viewModal.data.fim)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Tempo de Jogo</span><span className="font-black text-blue-700">{formatTempoStr(viewModal.data.tempo)}</span></div>
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Duração Span</span><span className="font-bold">{calculateTimeSpan(viewModal.data.inicio, viewModal.data.fim)}</span></div>
                        
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Preço Pago</span>
                          {viewModal.data.preco && viewModal.data.preco !== '-' ? (
                             <div>
                               <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(viewModal.data.preco)}}>
                                 {formatCurrency(viewModal.data.preco)}
                               </span>
                             </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Preço s/ Desconto</span>
                          {viewModal.data.preco_original && viewModal.data.preco_original !== '-' ? (
                             <div>
                               <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(viewModal.data.preco_original)}}>
                                 {formatCurrency(viewModal.data.preco_original)}
                               </span>
                             </div>
                          ) : null}
                        </div>
                        
                        {(() => {
                           let discount = calculateDiscount(viewModal.data.preco, viewModal.data.preco_original);
                           return discount.has ? (
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Desconto</span>
                               <div>
                                 <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(discount.rawDiff)}}>
                                   {discount.val} ({discount.pct})
                                 </span>
                               </div>
                             </div>
                           ) : <div className="flex flex-col"></div>;
                        })()}

                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Suporte</span><span className="font-bold">{viewModal.data.suporte && viewModal.data.suporte !== '-' ? viewModal.data.suporte : ''}</span></div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                          <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Condição</span>
                          <p className="font-bold text-sm whitespace-pre-wrap">{viewModal.data.conquistas && viewModal.data.conquistas !== '-' ? viewModal.data.conquistas : ''}</p>
                        </div>
                        <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                          <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Observações</span>
                          <p className="font-bold text-sm whitespace-pre-wrap">{getVal(viewModal.data, ['comentarios', 'observacao', 'observação']) || ''}</p>
                        </div>
                      </div>

                      {(() => {
                         let linkUrl = getVal(viewModal.data, ['midia', 'link']);
                         let ytb = getYoutubeId(linkUrl) || getYoutubeId(viewModal.data.suporte);
                         if (ytb) return (
                           <div className="w-full aspect-video border-[3px] border-slate-900 shadow-[6px_6px_0_0_rgba(15,23,42,1)] mt-2">
                             <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytb}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                           </div>
                         );
                         if (linkUrl && linkUrl !== '-') return (
                           <div className="flex flex-col gap-2 mt-2">
                             <span className="text-[10px] font-black uppercase text-slate-500">Link</span>
                             <a href={linkUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline break-all">{linkUrl}</a>
                           </div>
                         );
                         return null;
                      })()}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input value={fichaData.titulo} onChange={e=>setFichaData({...fichaData, titulo: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list" value={fichaData.plataforma} onChange={e=>setFichaData({...fichaData, plataforma: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list" value={fichaData.franquia} onChange={e=>setFichaData({...fichaData, franquia: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Início (Ex: DD/MM/YYYY)</label><input placeholder="DD/MM/YYYY ou YYYY-MM-DD" value={fichaData.inicio} onChange={e=>setFichaData({...fichaData, inicio: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim (Ex: DD/MM/YYYY)</label><input placeholder="DD/MM/YYYY ou YYYY-MM-DD" value={fichaData.fim} onChange={e=>setFichaData({...fichaData, fim: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input value={fichaData.tempo} onChange={e=>setFichaData({...fichaData, tempo: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label><input value={fichaData.nota} onChange={e=>setFichaData({...fichaData, nota: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><input value={fichaData.dificuldade} onChange={e=>setFichaData({...fichaData, dificuldade: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input value={fichaData.preco} onChange={e=>setFichaData({...fichaData, preco: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço s/ Desconto</label><input value={fichaData.preco_original} onChange={e=>setFichaData({...fichaData, preco_original: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list" value={fichaData.suporte} onChange={e=>setFichaData({...fichaData, suporte: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={getVal(fichaData, ['midia', 'link'])} onChange={e=>setFichaData({...fichaData, midia: e.target.value, link: e.target.value})} className={theme.input} /></div>
                      
                      <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><input list="condicoes-list" value={fichaData.conquistas} onChange={e=>setFichaData({...fichaData, conquistas: e.target.value})} className={theme.input} /></div>
                      <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={getVal(fichaData, ['comentarios', 'observacao', 'observação'])} onChange={e=>setFichaData({...fichaData, comentarios: e.target.value, observacao: e.target.value})} className={theme.input} rows="2" /></div>
                    </div>
                  )}
                </>
              )}

              {/* FICHA DE LISTAGENS FILTRADAS */}
              {viewModal.type !== 'game' && (() => {
                 let filteredList = games.filter(g => {
                    if(g.status !== 'Finalizado') return false;
                    let vPlat = getVal(g, ['plataforma', 'console']);
                    let vGen = getVal(g, ['franquia', 'genero', 'gênero']);
                    let vNota = String(getVal(g, ['nota'])).toUpperCase().trim();
                    let vDiff = String(getVal(g, ['dificuldade'])).toUpperCase().trim();
                    let vSup = getVal(g, ['suporte']);

                    if (viewModal.type === 'console') return vPlat === viewModal.data;
                    if (viewModal.type === 'genre') return vGen === viewModal.data;
                    if (viewModal.type === 'diff') return vDiff === viewModal.data;
                    if (viewModal.type === 'suporte') return vSup === viewModal.data;
                    
                    if (viewModal.type === 'note') {
                       if (viewModal.data === 'S') return vNota === 'S';
                       let nm = parseFloat(vNota.replace(',', '.'));
                       let targetNota = parseFloat(viewModal.data);
                       return Math.floor(nm) === targetNota;
                    }
                    return false;
                 });
                 
                 let totalTimeHrs = filteredList.reduce((acc, g) => acc + getNumericTempo(getVal(g, ['tempo'])), 0);
                 let notasVal = filteredList.map(g => parseFloat(String(getVal(g, ['nota'])).replace(',','.'))).filter(n => !isNaN(n));
                 let avg = notasVal.length > 0 ? (notasVal.reduce((a,b)=>a+b,0) / notasVal.length).toFixed(1) : '-';

                 return (
                   <div className="flex flex-col gap-6">
                     
                     {viewModal.type === 'suporte' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Categoria de Mídia</h3>
                              <p className="text-xl font-black">{getSuporteInfo(viewModal.data).categoria}</p>
                           </div>
                           <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                              <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Subcategoria</h3>
                              <p className="text-xl font-black">{getSuporteInfo(viewModal.data).subCategoria}</p>
                           </div>
                        </div>
                     )}

                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Total na Lista</h3>
                          <p className="text-2xl font-black">{filteredList.length} <span className="text-xs">jogos</span></p>
                        </div>
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Tempo Gasto</h3>
                          <p className="text-2xl font-black text-blue-700">{formatTotalTempoHrs(totalTimeHrs)}</p>
                        </div>
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Nota Média</h3>
                          <p className="text-2xl font-black">
                            {viewModal.type === 'note' && viewModal.data === 'S' ? (
                               <span className="bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] text-transparent bg-clip-text animate-[pulse_2s_ease-in-out_infinite]">S</span>
                            ) : avg}
                          </p>
                        </div>
                     </div>
                     <div>
                       <h3 className="text-sm font-black uppercase border-b-[3px] border-slate-900 pb-2 mb-4">
                          Jogos na Categoria: {viewModal.type === 'note' && viewModal.data !== 'S' ? `Nota na casa dos ${viewModal.data}` : viewModal.data}
                       </h3>
                       {renderGameTable(filteredList)}
                     </div>
                   </div>
                 );
              })()}

            </div>

            {viewModal.type === 'game' && (
              <div className="p-4 border-t-[3px] border-slate-900 bg-white flex justify-between items-center gap-4">
                <button 
                  onClick={() => {
                     if(window.confirm('Tem certeza que deseja excluir este jogo da planilha?')) handleDelete(viewModal.data.id);
                  }} 
                  className="text-rose-600 hover:text-rose-800 text-[10px] font-black uppercase underline transition-colors"
                >
                  Remover este item
                </button>

                <div className="flex gap-4">
                  {!isEditingFicha ? (
                    <button onClick={() => setIsEditingFicha(true)} className={`${theme.btnBase} ${theme.gold}`}>Habilitar Edição</button>
                  ) : (
                    <>
                      <button onClick={() => { setIsEditingFicha(false); setFichaData(viewModal.data); }} className="px-4 py-2 font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
                      <button onClick={handleUpdateFicha} className={`${theme.btnBase} ${theme.cyan}`}>Salvar Alterações</button>
                    </>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
