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
  
  if (s.includes('T')) {
    try {
      const d = new Date(s);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const mon = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yr = d.getUTCFullYear();
      if(!isNaN(yr) && yr > 1900) return `${day}-${mon}-${yr}`;
    } catch(e) {}
  }
  
  if (s.includes('/')) s = s.replace(/\//g, '-');
  
  let isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
      return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }
  return s;
};

const parseInputDate = (str) => {
  if (!str) return 0;
  let p = formatDateStr(str).split('-');
  if(p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}T12:00:00`).getTime() || 0;
  return 0;
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
    let d1 = parseInputDate(inStr);
    let d2 = parseInputDate(fimStr);
    if (d1 === 0 || d2 === 0) return -1;
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

const getPriorityColorHex = (prio, totalBacklog = 1) => {
    let p = parseInt(prio);
    if (isNaN(p) || p <= 0) return 'transparent';
    let pct = p / Math.max(totalBacklog, 1);
    if (pct <= 0.33) return '#FF8B94'; 
    if (pct <= 0.66) return '#FFD3B6'; 
    return '#A8E6CF'; 
};

const getPriceColorPago = (priceVal) => {
  if (priceVal === undefined || priceVal === null || priceVal === '' || priceVal === '-') return 'transparent';
  let p = getNumericPrice(priceVal);
  if (p === 0) return 'transparent';
  if (p >= 100) return '#FF8B94'; 
  if (p >= 40) return '#FFD3B6';  
  return '#A8E6CF';               
};

const getPriceColorDesc = (priceVal) => {
  if (priceVal === undefined || priceVal === null || priceVal === '' || priceVal === '-') return 'transparent';
  let p = getNumericPrice(priceVal);
  if (p === 0) return 'transparent';
  if (p >= 100) return '#A8E6CF'; 
  if (p >= 40) return '#FFD3B6';  
  return '#FF8B94';               
};

const getSuporteInfo = (name) => {
  let original = String(name || '').trim();
  if (!original || original === '-') return { categoria: 'Desconhecido', subCategoria: 'Desconhecido' };
  let parts = original.split(/\s*[\/\-]\s*/);
  let categoria = parts[0];
  let catLower = categoria.toLowerCase();
  
  if (catLower.includes('físico') || catLower.includes('fisico')) categoria = 'Físico';
  else if (catLower.includes('digital')) categoria = 'Digital';
  
  let subCategoria = parts.length > 1 ? parts.slice(1).join(' / ') : 'Desconhecido';
  return { categoria, subCategoria };
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

  const displayLabel = selected.length === 0
    ? label
    : selected.length === 1
      ? selected[0]
      : `${label} (${selected.length})`;

  return (
    <div className="relative min-w-[120px] max-w-[150px] flex-1" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`${theme.input} h-full p-1.5 cursor-pointer flex justify-between items-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]`}>
        <span className="truncate pr-2 text-[10px] sm:text-[11px] font-black uppercase">
          {displayLabel}
        </span>
        <span className="text-[10px] shrink-0">▼</span>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto z-50 bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col p-1 custom-scrollbar">
          {options.map(o => (
            <label key={o} className="flex items-center gap-2 p-1.5 hover:bg-slate-100 cursor-pointer text-[10px] font-bold uppercase border-b-[2px] border-slate-100 last:border-0 transition-colors">
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggleOption(o)} className="w-3.5 h-3.5 accent-slate-900 shrink-0 cursor-pointer" />
              <span className="truncate">{o === 'S' ? 'Rank S' : o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const PieChartUI = ({ title, slices, onClickSlice }) => {
   if (!slices || slices.length === 0) return null;
   return (
     <div className={`p-3 sm:p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col items-center justify-between h-full min-h-[320px]`}>
       <h3 className="text-xs font-black uppercase mb-2 w-full text-center border-b-[3px] border-slate-900 pb-2">{title}</h3>
       <div className="w-full flex-grow flex items-center justify-center py-2 relative">
         <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-32 h-32 transform -rotate-90 drop-shadow-md">
            {slices.map(s => {
               const getCoords = (percent) => [Math.cos(2*Math.PI*percent), Math.sin(2*Math.PI*percent)];
               const [startX, startY] = getCoords(s.start);
               const [endX, endY] = getCoords(s.end);
               const largeArc = s.end - s.start > 0.5 ? 1 : 0;
               const pathData = s.end - s.start >= 1 
                  ? `M -1 0 A 1 1 0 1 1 1 0 A 1 1 0 1 1 -1 0`
                  : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} Z`;
               
               const midP = s.start + (s.end - s.start)/2;
               const [tX, tY] = getCoords(midP);
               const showInsideText = s.pct > 10;
               return (
                 <g key={s.id} onClick={() => onClickSlice && onClickSlice(s)} className="cursor-pointer hover:opacity-80 transition-opacity">
                    <path d={pathData} fill={s.color} stroke="#0f172a" strokeWidth="0.04" />
                    {showInsideText && (
                        <>
                          <text x={tX * 0.65} y={tY * 0.65} fill="white" stroke="#0f172a" strokeWidth="0.08" strokeLinejoin="round" fontSize="0.22" textAnchor="middle" dominantBaseline="central" className="font-black" transform={`rotate(90 ${tX * 0.65} ${tY * 0.65})`}>{Math.round(s.pct)}%</text>
                          <text x={tX * 0.65} y={tY * 0.65} fill="white" fontSize="0.22" textAnchor="middle" dominantBaseline="central" className="font-black" transform={`rotate(90 ${tX * 0.65} ${tY * 0.65})`}>{Math.round(s.pct)}%</text>
                        </>
                    )}
                 </g>
               )
            })}
         </svg>
       </div>
       <div className="w-full flex flex-col gap-1 border-t-[3px] border-slate-900 pt-2 max-h-[160px] overflow-y-auto custom-scrollbar">
          {slices.map(s => (
             <div key={s.id} onClick={() => onClickSlice && onClickSlice(s)} className="flex items-center text-[10px] font-black uppercase cursor-pointer hover:opacity-70 transition-opacity justify-between">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-slate-900 shrink-0" style={{backgroundColor: s.color}}></div><span className="truncate max-w-[120px]" title={s.label}>{s.label}</span></div>
                <span className="text-slate-500 whitespace-nowrap ml-1 shrink-0">{s.count} ({Math.round(s.pct)}%)</span>
             </div>
          ))}
       </div>
     </div>
   )
};

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Grid: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  SortArrow: ({ asc }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`w-3 h-3 ml-1 inline-block transition-transform ${asc ? '' : 'rotate-180'}`}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>,
  Close: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Gamepad: () => <span className="inline-block text-cyan-700 font-black text-[14px] align-middle px-1 leading-none">▷</span>
};

export default function App() {
  const [appState, setAppState] = useState('booting'); 
  const [activeTab, setActiveTab] = useState('dashboard');
  const [configUrl, setConfigUrl] = useState('');
  const [games, setGames] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ type: 'idle', message: '' });
  const [addStatus, setAddStatus] = useState({ type: 'idle', message: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ console: [], genero: [], nota: [], dif: [], suporte: [], statusScope: 'todos' });
  const [backlogStatusFilter, setBacklogStatusFilter] = useState('todos');
  
  const [descontoSort, setDescontoSort] = useState('desc_val_desc');
  const [sortConfig, setSortConfig] = useState({ key: 'ordem', direction: 'desc' }); 

  const [topSorts, setTopSorts] = useState({
    consolesNota: { key: 'avgNota', dir: 'desc' },
    consolesTempo: { key: 'totalTempo', dir: 'desc' },
    generosNota: { key: 'avgNota', dir: 'desc' },
    generosTempo: { key: 'totalTempo', dir: 'desc' },
    anosTempo: { key: 'ano', dir: 'desc' },
    anosConsoles: { key: 'ano', dir: 'desc' }
  });

  const [viewModal, setViewModal] = useState(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [fichaData, setFichaData] = useState({});
  const [fichaStatus, setFichaStatus] = useState({ type: 'idle', message: '' });

  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  const blankForm = { status: 'Finalizado', titulo: '', plataforma: '', franquia: '', inicio: '', fim: '', tempo: '', nota: '', dificuldade: '', conquistas: '', preco: '', preco_original: '', suporte: '', midia: '', comentarios: '', prioridade: '' };
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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, searchTerm, sortConfig, viewMode, backlogStatusFilter]);

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
    let targetPrio = parseInt(formData.prioridade);
    if (formData.status === 'Backlog' && !isNaN(targetPrio)) {
        let existingGame = games.find(g => g.status === 'Backlog' && parseInt(getVal(g, ['prioridade'])) === targetPrio);
        if (existingGame) {
           setAddStatus({ type: 'loading', message: 'Ajustando prioridade...' });
           try {
              await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'UPDATE', data: { ...existingGame, prioridade: '' } }) });
           } catch (err) {}
        }
    }
    const success = await executeApiCall('ADD', { ...formData, id: 'temp_id' }, setAddStatus);
    if (success) setFormData(blankForm);
  };

  const handleUpdateFicha = async () => {
    let targetPrio = parseInt(fichaData.prioridade);
    let oldPrio = parseInt(viewModal.data.prioridade);

    if (fichaData.status === 'Backlog' && !isNaN(targetPrio) && targetPrio !== oldPrio) {
       let existingGame = games.find(g => g.status === 'Backlog' && g.id !== fichaData.id && parseInt(getVal(g, ['prioridade'])) === targetPrio);
       if (existingGame) {
          setFichaStatus({ type: 'loading', message: 'Trocando prioridades...' });
          try {
             await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'UPDATE', data: { ...existingGame, prioridade: viewModal.data.prioridade || '' } }) });
          } catch (e) {}
       }
    }
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

  const handleTopSort = (tableKey, sortKey) => {
    setTopSorts(prev => ({
      ...prev,
      [tableKey]: {
        key: sortKey,
        dir: prev[tableKey].key === sortKey && prev[tableKey].dir === 'desc' ? 'asc' : 'desc'
      }
    }));
  };

  const resetHome = () => {
     setActiveTab('dashboard');
     setSearchTerm('');
     setFilters({ console: [], genero: [], nota: [], dif: [], suporte: [], statusScope: 'todos' });
     setBacklogStatusFilter('todos');
  };

  const isValBlank = (val) => val === '' || val === null || val === undefined || val === '-' || (typeof val === 'number' && isNaN(val)) || (typeof val === 'number' && val === -1);

  const globalFilteredGames = useMemo(() => {
    let list = games;

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

    return list;
  }, [games, filters, searchTerm]);

  const sortedAndFilteredGames = useMemo(() => {
    let list = [...globalFilteredGames];
    
    if (activeTab === 'finished') list = list.filter(g => g.status === 'Finalizado');
    if (activeTab === 'backlog') list = list.filter(g => g.status === 'Backlog');
    
    if (activeTab === 'backlog') {
       if (backlogStatusFilter === 'iniciados') list = list.filter(g => { let ini = getVal(g, ['inicio', 'iniciado']); return ini && ini !== '-'; });
       if (backlogStatusFilter === 'nao_iniciados') list = list.filter(g => { let ini = getVal(g, ['inicio', 'iniciado']); return !ini || ini === '-'; });
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
      } else if (sortConfig.key === 'inicio' || sortConfig.key === 'fim') {
        valA = parseInputDate(getVal(a, [sortConfig.key, 'iniciado', 'termino']));
        valB = parseInputDate(getVal(b, [sortConfig.key, 'iniciado', 'termino']));
        if (valA === 0) valA = -1; if (valB === 0) valB = -1;
      } else if (sortConfig.key === 'prioridade') {
        let isStartedA = !!getVal(a, ['inicio', 'iniciado']) && getVal(a, ['inicio', 'iniciado']) !== '-';
        let isStartedB = !!getVal(b, ['inicio', 'iniciado']) && getVal(b, ['inicio', 'iniciado']) !== '-';

        if (isStartedA && !isStartedB) return -1; 
        if (!isStartedA && isStartedB) return 1; 
        if (isStartedA && isStartedB) {
            let dA = parseInputDate(getVal(a, ['inicio', 'iniciado']));
            let dB = parseInputDate(getVal(b, ['inicio', 'iniciado']));
            if (dA === 0) dA = -1; if (dB === 0) dB = -1;
            return sortConfig.direction === 'asc' ? dA - dB : dB - dA;
        }

        let pA = parseInt(getVal(a, ['prioridade']));
        let pB = parseInt(getVal(b, ['prioridade']));
        let blankA = isNaN(pA); let blankB = isNaN(pB);

        if (blankA && blankB) return 0;
        if (blankA) return 1; 
        if (blankB) return -1;
        return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
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
  }, [globalFilteredGames, activeTab, sortConfig, backlogStatusFilter]);

  const dashboardStats = useMemo(() => {
    let baseList = globalFilteredGames;
    if (filters.statusScope === 'finalizados') baseList = baseList.filter(g => g.status === 'Finalizado');
    if (filters.statusScope === 'backlog') baseList = baseList.filter(g => g.status === 'Backlog');

    let fin = baseList.filter(g => g.status === 'Finalizado');
    let back = baseList.filter(g => g.status === 'Backlog');
    
    let totalJogos = fin.length;
    let totalBacklog = back.length;
    let totalIniciados = back.filter(g => {
        let i = getVal(g, ['inicio', 'iniciado']);
        return i && i !== '-';
    }).length;

    let sRanks = fin.filter(g => String(getVal(g, ['nota'])).toUpperCase().trim() === 'S').length;
    let notasValidas = fin.map(g => parseFloat(String(getVal(g, ['nota'])).replace(',','.'))).filter(n => !isNaN(n));
    let avgNota = notasValidas.length > 0 ? (notasValidas.reduce((a,b)=>a+b,0) / notasValidas.length).toFixed(1) : 0;
    
    let stats = { 
      totalJogos, totalBacklog, totalIniciados, sRanks, avgNota, totalGasto: 0, totalEconomia: 0, platinas: 0,
      notas: { '10': 0, '9': 0, '8': 0, '7': 0, '6': 0, '5': 0, '4': 0, '3': 0, '2': 0, '1': 0, '0': 0 },
      dif: { A: 0, B: 0, C: 0, D: 0, E: 0 }, consoles: {}, generos: {}, anos: {}, midiaCategoria: {}, midiaSub: {},
      ps4: { gasto: 0, anos: 0, essential: 0, deluxe: 0 }
    };

    let earliestPS4Date = new Date().getTime();
    let hasPS4Date = false;
    let ps4Gasto = 0;

    baseList.forEach(g => {
      let pPago = getNumericPrice(getVal(g, ['preco', 'preco pago']));
      let pOrig = getNumericPrice(getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
      
      stats.totalGasto += pPago;
      if(pOrig > pPago && pOrig > 0) stats.totalEconomia += (pOrig - pPago);

      let cNameUpper = String(getVal(g, ['plataforma', 'console']) || '').toUpperCase().trim();
      if (cNameUpper === 'PS4' || cNameUpper === 'PLAYSTATION 4') {
         ps4Gasto += pPago;
         let dIni = parseInputDate(getVal(g, ['inicio', 'iniciado']));
         if (dIni > 0 && dIni < earliestPS4Date) {
             earliestPS4Date = dIni;
             hasPS4Date = true;
         }
      }

      if (g.status === 'Finalizado') {
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
          let cond = String(getVal(g, ['conquistas', 'condicao', 'condição'])).toLowerCase();

          if (cond.includes('platina')) stats.platinas++;

          let supInfo = getSuporteInfo(getVal(g, ['suporte']));
          if (supInfo.categoria !== 'Desconhecido') {
             if (!stats.midiaCategoria[supInfo.categoria]) stats.midiaCategoria[supInfo.categoria] = { count: 0 };
             stats.midiaCategoria[supInfo.categoria].count++;
          }
          if (supInfo.subCategoria !== 'Desconhecido') {
             if (!stats.midiaSub[supInfo.subCategoria]) stats.midiaSub[supInfo.subCategoria] = { count: 0 };
             stats.midiaSub[supInfo.subCategoria].count++;
          }

          let dStr = formatDateStr(getVal(g, ['fim']));
          let year = 'Desc.';
          if (dStr) {
             let p = dStr.split('-');
             if (p.length === 3) year = p[2];
          }

          if (year !== 'Desc.') {
             if (!stats.anos[year]) stats.anos[year] = { count: 0, tempo: 0, consoles: {} };
             stats.anos[year].count++;
             stats.anos[year].tempo += tHrs;
             if (consoleName && consoleName !== '-' && consoleName !== 'Desconhecido') {
                 if(!stats.anos[year].consoles[consoleName]) stats.anos[year].consoles[consoleName] = 0;
                 stats.anos[year].consoles[consoleName]++;
             }
          }

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
      }
    });

    if (!hasPS4Date) earliestPS4Date = new Date('2023-01-01T12:00:00').getTime();

    let latestDate = new Date().getTime();
    let diffYears = (latestDate - earliestPS4Date) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears < 1) diffYears = 1; 

    const VALOR_ESSENTIAL = 359.90;
    const VALOR_DELUXE = 691.90;

    stats.ps4 = {
       gasto: ps4Gasto,
       anos: diffYears,
       essential: diffYears * VALOR_ESSENTIAL,
       deluxe: diffYears * VALOR_DELUXE
    };

    Object.keys(stats.consoles).forEach(c => stats.consoles[c].avgNota = stats.consoles[c].notaCount > 0 ? (stats.consoles[c].totalNota / stats.consoles[c].notaCount).toFixed(1) : 0);
    Object.keys(stats.generos).forEach(c => stats.generos[c].avgNota = stats.generos[c].notaCount > 0 ? (stats.generos[c].totalNota / stats.generos[c].notaCount).toFixed(1) : 0);
    return stats;
  }, [globalFilteredGames, filters.statusScope]);

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

  const maxBacklogPriority = games.filter(g => g.status === 'Backlog').length + 1;

  const renderPriorityOptions = (currentId) => {
      return Array.from({length: maxBacklogPriority}).map((_, i) => {
         let p = i + 1;
         let occupier = games.find(g => g.status === 'Backlog' && parseInt(getVal(g, ['prioridade'])) === p);
         let label = String(p);
         if (occupier && occupier.id !== currentId) {
             label += ` - ${getVal(occupier, ['titulo', 'nome'])}`;
         }
         return <option key={p} value={p}>{label}</option>;
      });
  };

  const getPieSlices = () => {
     let f = dashboardStats.totalJogos;
     let i = dashboardStats.totalIniciados;
     let b = dashboardStats.totalBacklog - dashboardStats.totalIniciados;
     let t = f + i + b;
     let slices = [];
     let cp = 0;
     if (f > 0) { slices.push({ id:'f', start: cp, end: cp+(f/t), color: '#A8E6CF', count: f, pct: (f/t)*100, type: 'finalizados', label: 'Finalizados' }); cp += (f/t); }
     if (i > 0) { slices.push({ id:'i', start: cp, end: cp+(i/t), color: '#FFD3B6', count: i, pct: (i/t)*100, type: 'backlog_iniciado', label: 'Iniciados' }); cp += (i/t); }
     if (b > 0) { slices.push({ id:'b', start: cp, end: cp+(b/t), color: '#E2E8F0', count: b, pct: (b/t)*100, type: 'backlog_nao_iniciado', label: 'Backlog Fila' }); cp += (b/t); }
     return slices;
  };

  const getGenericPieSlices = (dataObj, type) => {
     let entries = Object.keys(dataObj).map(k => ({ label: k, count: dataObj[k].count, type, data: k }));
     entries.sort((a,b) => b.count - a.count);
     
     let total = entries.reduce((acc, curr) => acc + curr.count, 0);
     let colors = ['#A8E6CF', '#FFD3B6', '#93C5FD', '#C4B5FD', '#FCA5A5', '#E2E8F0', '#FDE047', '#FDA4AF', '#86EFAC', '#99F6E4'];
     
     let slices = [];
     let cp = 0;
     entries.forEach((item, i) => {
        let pct = item.count / total;
        slices.push({ ...item, id: item.id || item.label, start: cp, end: cp + pct, pct: pct * 100, color: colors[i % colors.length] });
        cp += pct;
     });
     return slices;
  };

  const Th = ({ label, sortKey, className = "", onClickOverride }) => (
    <th onClick={() => onClickOverride ? onClickOverride() : handleSort(sortKey)} className={`p-2 border-r-[3px] border-slate-900 cursor-pointer hover:bg-black/10 transition-colors whitespace-nowrap ${className}`}>
      <div className={`flex items-center gap-1 ${className.includes('text-center') ? 'justify-center' : 'justify-between'}`}>
        <span>{label}</span>
        {sortConfig.key === sortKey && <Icons.SortArrow 'asc'} asc="{sortConfig.direction"/>}
      </div>
    </th>
  );

  const MiniTh = ({ label, sortKey, tableKey, align="left" }) => (
    <th onClick={() => handleTopSort(tableKey, sortKey)} className={`pb-1 px-1 cursor-pointer hover:opacity-70 transition-opacity text-${align}`}>
        <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
            {label}
            {topSorts[tableKey].key === sortKey && <Icons.SortArrow 'asc'} asc="{topSorts[tableKey].dir"/>}
        </div>
    </th>
  );

  const displayCond = (cond) => {
    if (!cond || cond === '-') return '';
    if (String(cond).toLowerCase().includes('platina')) {
      return (
        <span onClick={(e) => { e.stopPropagation(); setViewModal({type:'platina', data: 'Platina'}); }} className="inline-block px-2 py-0.5 font-black text-[10px] uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] bg-gradient-to-r from-[#FFD3B6] via-[#A8E6CF] to-[#FF8B94] animate-[pulse_2s_ease-in-out_infinite] text-slate-900 cursor-pointer hover:-translate-y-0.5 transition-transform">
           🏆 {cond}
        </span>
      );
    }
    return cond;
  };

  const PaginationControls = ({ current, total, onChange }) => {
    if (total <= 1 || viewMode === 'table') return null;
    return (
       <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={current === 1} onClick={() => onChange(current - 1)} className={`px-3 py-1 font-black uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${current === 1 ? 'opacity-50 cursor-not-allowed bg-slate-200' : 'bg-white hover:bg-slate-100 hover:-translate-y-0.5'} transition-transform`}>Anterior</button>
          <span className="font-black text-xs text-slate-700 bg-white px-3 py-1 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">Pág. {current} de {total}</span>
          <button disabled={current === total} onClick={() => onChange(current + 1)} className={`px-3 py-1 font-black uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${current === total ? 'opacity-50 cursor-not-allowed bg-slate-200' : 'bg-white hover:bg-slate-100 hover:-translate-y-0.5'} transition-transform`}>Próxima</button>
       </div>
    )
  }

  const renderGameCards = (list, isBacklogOverride) => {
    const isBacklog = isBacklogOverride ?? (activeTab === 'backlog' && !viewModal);
    if (list.length === 0) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-lg bg-white border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">Nenhum jogo nesta lista.</div>;
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
                let prioridade = getVal(game, ['prioridade']);
                const consoleStyle = getConsoleStyle(plataforma);
                const displayClean = (val) => (val && val !== '-' ? val : '');
                let isStartedBacklog = isBacklog && inicio && inicio !== '-';
                
                return (
                    <div key={game.id || i} onClick={() => {
                        setFichaData({...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, prioridade, inicio: formatDateStr(inicio), fim: formatDateStr(fim)});
                        setViewModal({type:'game', data: {...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, inicio, fim, tempo, nota, dificuldade: dif, conquistas: cond, suporte: sup, prioridade}});
                        setIsEditingFicha(false);
                    }} className={`border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] p-4 flex flex-col gap-2 transition-transform cursor-pointer hover:-translate-y-1 relative ${isStartedBacklog ? 'bg-cyan-50 hover:bg-cyan-100' : 'bg-white hover:bg-slate-50'}`}>
                        
                        <div className="flex justify-between items-start border-b-[2px] border-slate-900 pb-2 mb-2 gap-2">
                            <div className="font-black uppercase text-sm flex-1 leading-tight" title={displayClean(titulo)}>
                                {displayClean(titulo)}
                            </div>
                            <div className="font-black text-[11px] text-slate-500 shrink-0 flex items-center justify-center">
                                {!isBacklog && `#${visualId}`}
                                {isBacklog && isStartedBacklog && <Icons.Gamepad/>}
                                {isBacklog && !isStartedBacklog && displayClean(prioridade) && (
                                   <span className="inline-block px-1 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[9px]" style={{backgroundColor: getPriorityColorHex(prioridade, dashboardStats.totalBacklog), color: '#0f172a'}} title="Prioridade">
                                      {prioridade}
                                   </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {displayClean(plataforma) && <span className="inline-block px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)] font-black uppercase text-[9px]" style={{ backgroundColor: consoleStyle.bg, color: consoleStyle.text }}>{plataforma}</span>}
                            {displayClean(genero) && <span className="inline-block px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)] font-black uppercase text-[9px]" style={{backgroundColor: getGenreColor(genero)}}>{genero}</span>}
                        </div>
                        
                        <div className="text-[10px] font-black uppercase text-slate-600 flex flex-col gap-1 mt-auto">
                            {!isBacklog && displayClean(tempo) && <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span>Tempo:</span> <span className="text-blue-600">{formatTempoStr(tempo)}</span></div>}
                            {!isBacklog && displayClean(nota) && <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-1"><span>Nota:</span> <span>{getRatingBadge(nota)}</span></div>}
                            {isBacklog && displayClean(inicio) && <div className="flex justify-between border-b border-dashed border-slate-200 pb-1"><span>Iniciado:</span> <span className="text-cyan-700">{formatDateStr(inicio)}</span></div>}
                            
                            <div className="flex justify-between items-center mt-1">
                                <span>Preço:</span>
                                <span style={{backgroundColor: getPriceColorPago(pricePago)}} className="px-1.5 py-0.5 border-[2px] border-slate-900 text-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)]">
                                    {formatCurrency(pricePago)}
                                </span>
                            </div>
                            {!isBacklog && displayClean(cond) && (
                                <div className="mt-2 flex justify-center text-center">
                                    {displayCond(cond)}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  }

  const renderGameTable = (list, isBacklogOverride) => {
    const isBacklog = isBacklogOverride ?? (activeTab === 'backlog' && !viewModal);
    return (
    <div className={`overflow-x-auto border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white pb-2 max-w-full custom-scrollbar max-h-[70vh]`}>
      <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] font-bold">
        <thead className="sticky top-0 z-10 shadow-sm">
          <tr className={`${activeTab === 'finished' || (viewModal && viewModal.type !== 'backlog_iniciado' && viewModal.type !== 'backlog_nao_iniciado') ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase font-black text-slate-900`}>
            {!isBacklog && <Th className="text-center w-10" label="#" sortKey="ordem"/>}
            {isBacklog && <Th className="font-black text-lg text-slate-700" label="{<div" title="Prioridade / Iniciado">!</div>} sortKey="prioridade" className="text-center w-10" />}
            <Th label="NOME DO JOGO" sortKey="titulo"/>
            <Th label="CONSOLE" sortKey="plataforma"/>
            <Th label="GÊNERO" sortKey="franquia"/>
            {isBacklog ? <Th className="text-center" label="INICIADO" sortKey="inicio"/> : <Th className="text-center" label="INÍCIO" sortKey="inicio"/>}
            {!isBacklog && <Th className="text-center" label="FIM" sortKey="fim"/>}
            {!isBacklog && <Th className="text-center" label="TEMPO TOTAL" sortKey="tempo"/>}
            {!isBacklog && <Th className="text-center" label="DURAÇÃO" sortKey="duracao"/>}
            {!isBacklog && <Th className="text-center" label="NOTA" sortKey="nota"/>}
            {!isBacklog && <Th className="text-center" label="DIF" sortKey="dificuldade"/>}
            {!isBacklog && <Th label="CONDIÇÃO" sortKey="conquistas"/>}
            <Th className="text-center" label="PREÇO PAGO" sortKey="preco"/>
            <Th className="text-center" label="PREÇO S/ DESC." sortKey="preco_original"/>
            {!isBacklog && <Th className="text-center" label="DESCONTO" sortKey="desconto"/>}
            <Th className="text-center border-r-0" label="SUPORTE" sortKey="suporte"/>
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
            let prioridade = getVal(game, ['prioridade']);
            
            let discount = calculateDiscount(pricePago, priceSemDesc);
            const consoleStyle = getConsoleStyle(plataforma);
            const displayClean = (val) => (val && val !== '-' ? val : '');

            let isStartedBacklog = isBacklog && inicio && inicio !== '-';
            
            return (
              <tr key={game.id || i} className={`border-b-[2px] border-slate-900 transition-colors ${isStartedBacklog ? 'bg-cyan-50 hover:bg-cyan-100' : 'bg-white hover:bg-slate-50'}`}>
                
                {!isBacklog && <td className="p-2 border-r-[3px] border-slate-900 text-center font-black whitespace-nowrap bg-slate-100">{visualId}</td>}
                
                {isBacklog && (
                  <td className={`p-2 border-r-[3px] border-slate-900 text-center font-black whitespace-nowrap ${isStartedBacklog ? 'bg-cyan-100' : 'bg-slate-100 text-slate-500'}`}>
                    {isStartedBacklog ? <Icons.Gamepad/> : displayClean(prioridade) ? (
                        <span className="inline-block px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[10px]" style={{backgroundColor: getPriorityColorHex(prioridade, dashboardStats.totalBacklog), color: '#0f172a'}}>
                            {prioridade}
                        </span>
                    ) : '-'}
                  </td>
                )}

                <td onClick={() => { 
                      setFichaData({...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, prioridade, inicio: formatDateStr(inicio), fim: formatDateStr(fim)}); 
                      setViewModal({type:'game', data: {...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, inicio, fim, tempo, nota, dificuldade: dif, conquistas: cond, suporte: sup, prioridade}}); 
                      setIsEditingFicha(false); 
                    }} 
                    className="p-2 border-r-[3px] border-slate-900 font-black text-xs cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4 whitespace-normal break-words min-w-[150px]">
                  {displayClean(titulo)}
                </td>
                
                <td onClick={() => { if(displayClean(plataforma)) setViewModal({type:'console', data: plataforma}) }} className="p-2 border-r-[3px] border-slate-900 cursor-pointer whitespace-nowrap">
                  {displayClean(plataforma) && (
                    <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform font-black uppercase" style={{ backgroundColor: consoleStyle.bg, color: consoleStyle.text }}>
                      {plataforma}
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
                
                {!isBacklog && <td className="p-2 border-r-[3px] border-slate-900 max-w-[150px] whitespace-normal break-words">{displayCond(cond) || displayClean(cond)}</td>}
                
                <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                  {displayClean(pricePago) && (
                    <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColorPago(pricePago)}}>
                      {formatCurrency(pricePago)}
                    </span>
                  )}
                </td>
                
                <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                  {displayClean(priceSemDesc) && (
                    <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColorPago(priceSemDesc)}}>
                      {formatCurrency(priceSemDesc)}
                    </span>
                  )}
                </td>
                
                {!isBacklog && (
                  <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                    {discount.has && (
                      <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] group relative cursor-help" style={{backgroundColor: getPriceColorDesc(discount.rawDiff)}}>
                        {discount.val} ({discount.pct})
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">Economia de {discount.val}</div>
                      </span>
                    )}
                  </td>
                )}
                
                <td onClick={() => { if(displayClean(sup)) setViewModal({type:'suporte', data: sup}) }} className={`p-2 border-slate-900 text-center whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4 border-r-0`}>
                  {displayClean(sup)}
                </td>
              </tr>
            );
          })}
          {list.length === 0 && <tr><td colSpan={isBacklog ? 9 : 15} className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-lg">Nenhum jogo nesta lista.</td></tr>}
        </tbody>
      </table>
    </div>
  )};

  const globalStyles = (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border: 1px solid #0f172a; border-right: none; border-bottom: none;}
      .custom-scrollbar::-webkit-scrollbar-thumb { background: #0f172a; border-radius: 0px; }
      .custom-scrollbar::-webkit-scrollbar-corner { background: #f1f5f9; }
    `}</style>
  );

  if (appState === 'booting' || (appState === 'loading' && games.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        {globalStyles}
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <img src="[https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png](https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png)" alt="Logo" className="w-36 h-36 drop-shadow-xl" />
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
      {globalStyles}
      {/* HEADER */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div onClick={resetHome} className="flex items-center gap-4 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" title="Voltar ao Início e Limpar Filtros">
          <img src="[https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png](https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png)" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14" />
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
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 min-w-[100px] w-full transition-colors border-r-[3px] border-slate-900 custom-scrollbar ${activeTab === t.id ? theme.gold : 'bg-white hover:bg-slate-50'}`}>
              <t.icon /> <span className="text-xs sm:text-sm font-black uppercase">{t.label}</span>
            </button>
          ))}
        </nav>

        {appState === 'loading' && (
          <div className="h-1.5 w-full bg-slate-200 relative overflow-hidden border-b-[3px] border-slate-900">
            <div className="absolute top-0 left-0 h-full bg-[#FF8B94] animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        <main className="p-4 sm:p-6 overflow-x-auto custom-scrollbar">
          
          {/* BARRA DE FILTROS OTIMIZADA */}
          {(activeTab === 'dashboard' || activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-row flex-wrap items-center gap-2 mb-6 w-full bg-white p-2 border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
               
               {(activeTab === 'finished' || activeTab === 'backlog') && (
                  <div className="flex items-center gap-1 border-r-[3px] border-slate-900 pr-2 mr-1">
                     <button onClick={() => setViewMode('table')} className={`p-1.5 border-[2px] border-slate-900 transition-colors hover:-translate-y-0.5 ${viewMode === 'table' ? theme.gold : 'bg-slate-100 hover:bg-slate-200'}`} title="Tabela"><Icons.List/></button>
                     <button onClick={() => setViewMode('cards')} className={`p-1.5 border-[2px] border-slate-900 transition-colors hover:-translate-y-0.5 ${viewMode === 'cards' ? theme.gold : 'bg-slate-100 hover:bg-slate-200'}`} title="Cards"><Icons.Grid/></button>
                  </div>
               )}

               <MultiSelectDropdown label="Consoles" onChange="{(v)" options="{uniqueOptions.console}" selected="{filters.console}"> setFilters({...filters, console: v})} />
               <MultiSelectDropdown label="Gêneros" onChange="{(v)" options="{uniqueOptions.genero}" selected="{filters.genero}"> setFilters({...filters, genero: v})} />
               <MultiSelectDropdown label="Notas" onChange="{(v)" options="{uniqueOptions.nota}" selected="{filters.nota}"> setFilters({...filters, nota: v})} />
               <MultiSelectDropdown label="Dificuldades" onChange="{(v)" options="{uniqueOptions.dif}" selected="{filters.dif}"> setFilters({...filters, dif: v})} />
               <MultiSelectDropdown label="Suportes" onChange="{(v)" options="{uniqueOptions.suporte}" selected="{filters.suporte}"> setFilters({...filters, suporte: v})} />
               
               {activeTab === 'dashboard' && (
                  <select value={filters.statusScope} onChange={e => setFilters({...filters, statusScope: e.target.value})} className={`${theme.input} !w-auto !p-1.5 max-w-[160px] shadow-[2px_2px_0_0_rgba(15,23,42,1)] text-[10px] sm:text-[11px]`}>
                     <option value="todos">Mostrar Tudo (Status)</option>
                     <option value="finalizados">Apenas Finalizados</option>
                     <option value="backlog">Apenas Backlog</option>
                  </select>
               )}

               {activeTab === 'backlog' && (
                  <select value={backlogStatusFilter} onChange={e => setBacklogStatusFilter(e.target.value)} className={`${theme.input} !w-auto !p-1.5 max-w-[150px] shadow-[2px_2px_0_0_rgba(15,23,42,1)] text-[10px] sm:text-[11px]`}>
                     <option value="todos">Todos (Status)</option>
                     <option value="iniciados">Apenas Iniciados</option>
                     <option value="nao_iniciados">Não Iniciados</option>
                  </select>
               )}

               <div className="flex-1 min-w-[150px] text-right text-[10px] sm:text-xs font-black uppercase text-slate-500 whitespace-nowrap pl-2">
                  Total na lista: <span className="text-slate-900">{sortedAndFilteredGames.length}</span> jogos
               </div>
            </div>
          )}

          {}
          {activeTab === 'dashboard' && (
             <div className="flex flex-col gap-6">
                
                {/* Cards Estatísticos Superiores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div onClick={()=>setActiveTab('finished')} className={`p-4 ${theme.border} bg-[#A8E6CF] shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Finalizados</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.totalJogos}</p>
                  </div>
                  <div onClick={()=>setActiveTab('backlog')} className={`p-4 ${theme.border} bg-slate-200 shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Backlog</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.totalBacklog}</p>
                  </div>
                  <div onClick={()=>setViewModal({type:'backlog_iniciado', data:'Iniciados'})} className={`p-4 ${theme.border} bg-[#FFD3B6] shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Iniciados</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.totalIniciados}</p>
                  </div>
                  <div onClick={() => setViewModal({type:'platina', data: 'Platina'})} className={`p-4 ${theme.border} bg-[#E0F2FE] shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Platinas</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.platinas}</p>
                  </div>
                  <div className={`p-4 ${theme.border} bg-[#93C5FD] shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Nota Média</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.avgNota}</p>
                  </div>
                  <div onClick={() => setViewModal({type:'note', data: 'S'})} className={`p-4 ${theme.border} bg-gradient-to-r from-[#FF8B94] to-[#FFD3B6] shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer hover:opacity-80 transition-opacity flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Obras-Primas</h3>
                    <p className="text-3xl sm:text-4xl font-black mt-2">{dashboardStats.sRanks}</p>
                  </div>
                  <div className={`p-4 ${theme.border} bg-[#FDE047] shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col justify-between`}>
                    <h3 className="text-[10px] sm:text-[11px] font-black uppercase leading-tight">Investido</h3>
                    <p className="text-lg sm:text-xl font-black mt-2">{formatCurrency(dashboardStats.totalGasto)}</p>
                  </div>
                </div>

                {/* GRÁFICOS DE PIZZA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                  <PieChartUI onClickSlice="{(s)" slices="{getPieSlices()}" title="Status da Biblioteca"> setViewModal({type: s.type, data: s.label})} 
                  />
                  <PieChartUI 'suporte_cat')} onClickSlice="{(s)" slices="{getGenericPieSlices(dashboardStats.midiaCategoria," title="Mídia: Formatos"> s.type && setViewModal({type: s.type, data: s.data})} 
                  />
                  <PieChartUI 'suporte_sub')} onClickSlice="{(s)" slices="{getGenericPieSlices(dashboardStats.midiaSub," title="Mídia: Subtipos"> s.type && setViewModal({type: s.type, data: s.data})} 
                  />
                  <PieChartUI 'console')} onClickSlice="{(s)" slices="{getGenericPieSlices(dashboardStats.consoles," title="Top Consoles"> s.type && setViewModal({type: s.type, data: s.data})} 
                  />
                  <PieChartUI 'genre')} onClickSlice="{(s)" slices="{getGenericPieSlices(dashboardStats.generos," title="Top Gêneros"> s.type && setViewModal({type: s.type, data: s.data})} 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  {/* Descontos por jogo */}
                  <div className={`lg:col-span-2 p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-full min-h-[300px]`}>
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
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {sortedAndFilteredGames.filter(g => calculateDiscount(getVal(g, ['preco', 'preco pago']), getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto'])).has)
                            .sort((a,b) => {
                               let dA = calculateDiscount(getVal(a, ['preco', 'preco pago']), getVal(a, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                               let dB = calculateDiscount(getVal(b, ['preco', 'preco pago']), getVal(b, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                               if (descontoSort === 'alfa_asc') return getVal(a, ['titulo', 'nome']).localeCompare(getVal(b, ['titulo', 'nome']));
                               if (descontoSort === 'pago_asc') return dA.pago - dB.pago;
                               if (descontoSort === 'pago_desc') return dB.pago - dA.pago;
                               if (descontoSort === 'orig_desc') return dB.orig - dA.orig;
                               if (descontoSort === 'desc_val_asc') return dA.rawDiff - dB.rawDiff;
                               return dB.rawDiff - dA.rawDiff; 
                            })
                            .map((g, i) => {
                        let d = calculateDiscount(getVal(g, ['preco', 'preco pago']), getVal(g, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
                        let pctPago = (d.pago / d.orig) * 100;
                        let pctDesc = (d.rawDiff / d.orig) * 100;
                        let nomeJogo = getVal(g, ['titulo', 'nome']);
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase w-full">
                             <div className="w-1/3 truncate text-right pr-2" title={nomeJogo}>{nomeJogo}</div>
                             <div className="flex w-2/3 h-5 border-[2px] border-slate-900 bg-slate-100 shadow-[1px_1px_0_0_rgba(0,0,0,1)] text-[9px]">
                               <div className="bg-[#3B82F6] h-full flex items-center justify-start pl-1 text-white overflow-hidden whitespace-nowrap cursor-help" style={{width: `${pctPago}%`}} title={`${nomeJogo} - Preço Pago: R$ ${d.pago.toFixed(2).replace('.', ',')}`}>
                                  {pctPago > 15 ? `R$ ${d.pago.toFixed(2).replace('.',',')}` : ''}
                               </div>
                               <div className="bg-[#EF4444] h-full flex items-center justify-end pr-1 text-white overflow-hidden whitespace-nowrap cursor-help relative group" style={{width: `${pctDesc}%`}} title={`${nomeJogo} - Desconto de R$ ${d.rawDiff.toFixed(2).replace('.', ',')} (${d.pct})`}>
                                  {pctDesc > 15 ? `R$ ${d.rawDiff.toFixed(2).replace('.',',')}` : ''}
                                  <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/40">-{d.pct}</div>
                               </div>
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Economia Geral */}
                  <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col justify-between items-center h-full min-h-[300px]`}>
                    <h3 className="text-sm font-black uppercase mb-4 w-full text-center border-b-[3px] border-slate-900 pb-2">Economia Geral</h3>
                    <div className="w-full flex-grow flex flex-row justify-center items-center mb-4 mt-2 gap-2">
                       <div className="w-[80px] sm:w-[100px] flex flex-col border-[3px] border-slate-900 h-full max-h-[160px] bg-slate-100 relative shadow-[4px_4px_0_0_rgba(15,23,42,1)]" title={`Gasto Total + Economia Total = R$ ${(dashboardStats.totalGasto + dashboardStats.totalEconomia).toFixed(2).replace('.', ',')}`}>
                          <div className="w-full bg-[#EF4444] flex items-center justify-center flex-col transition-all group relative cursor-help" style={{height: `${dashboardStats.totalGasto + dashboardStats.totalEconomia > 0 ? (dashboardStats.totalEconomia / (dashboardStats.totalGasto + dashboardStats.totalEconomia)) * 100 : 0}%`}}>
                             <span className="text-white font-black text-[10px] sm:text-xs text-center px-1 overflow-hidden">{formatCurrency(dashboardStats.totalEconomia)}</span>
                             <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 z-10 pointer-events-none">Total Economizado</div>
                          </div>
                          <div className="w-full bg-[#3B82F6] flex items-center justify-center flex-col transition-all group relative cursor-help" style={{height: `${dashboardStats.totalGasto + dashboardStats.totalEconomia > 0 ? (dashboardStats.totalGasto / (dashboardStats.totalGasto + dashboardStats.totalEconomia)) * 100 : 0}%`}}>
                             <span className="text-white font-black text-[10px] sm:text-xs text-center px-1 overflow-hidden">{formatCurrency(dashboardStats.totalGasto)}</span>
                             <div className="absolute top-1/2 left-full -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white text-[10px] px-2 py-1 z-10 pointer-events-none">Total Gasto Real</div>
                          </div>
                       </div>
                       <div className="flex items-center text-slate-800 pointer-events-none">
                           <span className="text-[50px] font-light leading-none -translate-y-1">{'}'}</span>
                           <div className="flex flex-col ml-1">
                             <span className="text-[10px] font-black uppercase leading-tight text-slate-500">Valor Cheio</span>
                             <span className="text-sm font-black leading-none">{formatCurrency(dashboardStats.totalGasto + dashboardStats.totalEconomia)}</span>
                           </div>
                       </div>
                    </div>
                    <div className="w-full bg-[#991B1B] text-white p-2 border-[3px] border-slate-900 text-center font-black uppercase sm:text-md shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                       Econ. {formatCurrency(dashboardStats.totalEconomia)}
                    </div>
                  </div>

                  {/* Comparativo PS Plus */}
                  <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] flex flex-col justify-between items-center h-full min-h-[300px]`}>
                    <h3 className="text-sm font-black uppercase mb-2 w-full text-center border-b-[3px] border-slate-900 pb-2">Comprar vs Assinar (PS4)</h3>
                    
                    {(() => {
                        let maxVal = Math.max(dashboardStats.ps4.gasto, dashboardStats.ps4.essential, dashboardStats.ps4.deluxe, 1);
                        let wGasto = (dashboardStats.ps4.gasto / maxVal) * 100;
                        let wEss = (dashboardStats.ps4.essential / maxVal) * 100;
                        let wDel = (dashboardStats.ps4.deluxe / maxVal) * 100;
                        let saved = dashboardStats.ps4.essential - dashboardStats.ps4.gasto;

                        return (
                          <>
                             <div className="w-full flex-grow flex flex-col justify-center gap-3 mt-1">
                                 {/* Gasto */}
                                 <div className="w-full">
                                   <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-slate-600">
                                     <span>Gasto Real (PS4)</span>
                                     <span className="text-slate-900">{formatCurrency(dashboardStats.ps4.gasto)}</span>
                                   </div>
                                   <div className="w-full h-3 bg-slate-100 border-[2px] border-slate-900">
                                      <div className="h-full bg-[#3B82F6]" style={{width: `${wGasto}%`}}></div>
                                   </div>
                                 </div>
                                 
                                 {/* Essential */}
                                 <div className="w-full">
                                   <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-slate-600">
                                     <span title={`${dashboardStats.ps4.anos.toFixed(1)} anos de assinatura`} className="cursor-help underline decoration-dashed">Se fosse Essential</span>
                                     <span className="text-slate-900">{formatCurrency(dashboardStats.ps4.essential)}</span>
                                   </div>
                                   <div className="w-full h-3 bg-slate-100 border-[2px] border-slate-900">
                                      <div className="h-full bg-[#94A3B8]" style={{width: `${wEss}%`}}></div>
                                   </div>
                                 </div>

                                 {/* Deluxe */}
                                 <div className="w-full">
                                   <div className="flex justify-between text-[10px] font-black uppercase mb-1 text-slate-600">
                                     <span title={`${dashboardStats.ps4.anos.toFixed(1)} anos de assinatura`} className="cursor-help underline decoration-dashed">Se fosse Deluxe</span>
                                     <span className="text-slate-900">{formatCurrency(dashboardStats.ps4.deluxe)}</span>
                                   </div>
                                   <div className="w-full h-3 bg-slate-100 border-[2px] border-slate-900">
                                      <div className="h-full bg-[#FCD34D]" style={{width: `${wDel}%`}}></div>
                                   </div>
                                 </div>
                             </div>

                             <div className={`w-full p-2 border-[3px] border-slate-900 text-center font-black uppercase sm:text-[11px] mt-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)] ${saved >= 0 ? 'bg-[#86EFAC] text-slate-900' : 'bg-[#FF8B94] text-slate-900'}`}>
                                {saved >= 0 ? 'Economizou ' : 'Prejuízo de '}
                                {formatCurrency(Math.abs(saved))}
                             </div>
                          </>
                        )
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                   
                   {/* Dificuldade */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Por Dificuldade</h3>
                     <div className="flex flex-col gap-2">
                       {['A', 'B', 'C', 'D', 'E'].map(d => {
                         let maxDif = Math.max(...Object.values(dashboardStats.dif), 1);
                         return (
                         <div key={d} onClick={() => setViewModal({type:'diff', data: d})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.dif[d]} jogos da dificuldade ${d}`}>
                           <span className="inline-block w-6 text-center border-[2px] border-slate-900 py-0.5 group-hover:opacity-70 transition-opacity" style={{backgroundColor: getDifficultyBadge(d).bg}}>{d}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${(dashboardStats.dif[d] / maxDif) * 100}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.dif[d]}</span>
                         </div>
                       )})}
                     </div>
                   </div>
                   
                   {/* Por Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Por Nota</h3>
                     <div className="flex flex-col gap-2">
                       {['S'].map(n => {
                         let maxNota = Math.max(dashboardStats.sRanks, ...Object.values(dashboardStats.notas), 1);
                         return (
                         <div key={n} onClick={() => setViewModal({type:'note', data: n})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.sRanks} jogos Rank S`}>
                           <span className="inline-block w-8 text-center border-[2px] border-slate-900 py-0.5 bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] group-hover:opacity-80 transition-opacity">{n}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${(dashboardStats.sRanks / maxNota) * 100}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.sRanks}</span>
                         </div>
                       )})}
                       {['10', '9', '8', '7', '6', '5'].map(n => {
                         let maxNota = Math.max(dashboardStats.sRanks, ...Object.values(dashboardStats.notas), 1);
                         return (
                         <div key={n} onClick={() => setViewModal({type:'note', data: n})} className="flex items-center gap-2 text-xs font-black cursor-pointer group" title={`${dashboardStats.notas[n]} jogos`}>
                           <span className="inline-block w-8 text-center border-[2px] border-slate-900 py-0.5 group-hover:opacity-70 transition-opacity">{n}</span>
                           <div className="flex-1 bg-slate-100 h-3 border-[2px] border-slate-900">
                             <div className="h-full bg-slate-900" style={{width: `${(dashboardStats.notas[n] / maxNota) * 100}%`}}></div>
                           </div>
                           <span className="w-6 text-right text-[10px]">{dashboardStats.notas[n]}</span>
                         </div>
                       )})}
                     </div>
                   </div>

                   {/* Horas Jogadas por Ano */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Horas Jogadas por Ano</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Ano" sortKey="ano" tableKey="anosTempo"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="anosTempo"/><MiniTh align="center" label="Tempo" sortKey="tempo" tableKey="anosTempo"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.anos).map(a => ({ ano: a, ...dashboardStats.anos[a] })).sort((a,b) => {
                              let valA = a[topSorts.anosTempo.key]; let valB = b[topSorts.anosTempo.key];
                              if (topSorts.anosTempo.key === 'ano') return topSorts.anosTempo.dir === 'asc' ? a.ano.localeCompare(b.ano) : b.ano.localeCompare(a.ano);
                              return topSorts.anosTempo.dir === 'asc' ? valA - valB : valB - valA;
                           }).map(stat => (
                               <tr key={stat.ano} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'ano', data: stat.ano})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] bg-amber-100 hover:-translate-y-0.5 transition-transform">{stat.ano}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                                 <td className="py-2 text-center text-blue-600">{formatTotalTempoHrs(stat.tempo)}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                   
                   {/* Consoles Mais Jogados por Ano */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Consoles por Ano</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Ano" sortKey="ano" tableKey="anosConsoles"/><MiniTh label="Console" sortKey="console" tableKey="anosConsoles"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="anosConsoles"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.anos).flatMap(a => 
                               Object.keys(dashboardStats.anos[a].consoles).map(c => ({ ano: a, console: c, count: dashboardStats.anos[a].consoles[c] }))
                           ).sort((a,b) => {
                              let valA = a[topSorts.anosConsoles.key]; let valB = b[topSorts.anosConsoles.key];
                              if (topSorts.anosConsoles.key === 'ano' || topSorts.anosConsoles.key === 'console') {
                                 let cmp = String(valA).localeCompare(String(valB));
                                 if (cmp === 0) return b.count - a.count; 
                                 return topSorts.anosConsoles.dir === 'asc' ? cmp : -cmp;
                              }
                              return topSorts.anosConsoles.dir === 'asc' ? valA - valB : valB - valA;
                           }).slice(0, 50).map((stat, idx) => ( 
                               <tr key={`${stat.ano}-${stat.console}-${idx}`} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'ano', data: stat.ano})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] bg-amber-100 hover:-translate-y-0.5 transition-transform">{stat.ano}</span></td>
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'console', data: stat.console})} className="inline-flex cursor-pointer items-center px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] text-[8px] hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: getConsoleStyle(stat.console).bg, color: getConsoleStyle(stat.console).text }}>{stat.console}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* Top Consoles Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Consoles (Nota)</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Console" sortKey="name" tableKey="consolesNota"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="consolesNota"/><MiniTh align="center" label="Nota" sortKey="avgNota" tableKey="consolesNota"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.consoles).map(c => ({ name: c, ...dashboardStats.consoles[c] })).sort((a,b) => {
                              let valA = a[topSorts.consolesNota.key]; let valB = b[topSorts.consolesNota.key];
                              if (topSorts.consolesNota.key === 'name') return topSorts.consolesNota.dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                              return topSorts.consolesNota.dir === 'asc' ? valA - valB : valB - valA;
                           }).map(stat => (
                               <tr key={stat.name} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'console', data: stat.name})} className="inline-flex cursor-pointer items-center px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: getConsoleStyle(stat.name).bg, color: getConsoleStyle(stat.name).text }}>{stat.name}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                                 <td className="py-2 text-center">{stat.avgNota}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                   
                   {/* Top Consoles Tempo */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Consoles (Tempo)</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Console" sortKey="name" tableKey="consolesTempo"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="consolesTempo"/><MiniTh align="center" label="Tempo" sortKey="totalTempo" tableKey="consolesTempo"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.consoles).map(c => ({ name: c, ...dashboardStats.consoles[c] })).sort((a,b) => {
                              let valA = a[topSorts.consolesTempo.key]; let valB = b[topSorts.consolesTempo.key];
                              if (topSorts.consolesTempo.key === 'name') return topSorts.consolesTempo.dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                              return topSorts.consolesTempo.dir === 'asc' ? valA - valB : valB - valA;
                           }).map(stat => (
                               <tr key={stat.name} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'console', data: stat.name})} className="inline-flex cursor-pointer items-center px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{ backgroundColor: getConsoleStyle(stat.name).bg, color: getConsoleStyle(stat.name).text }}>{stat.name}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                                 <td className="py-2 text-center text-blue-600">{formatTotalTempoHrs(stat.totalTempo)}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* Top Gêneros Nota */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Gêneros (Nota)</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Gênero" sortKey="name" tableKey="generosNota"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="generosNota"/><MiniTh align="center" label="Nota" sortKey="avgNota" tableKey="generosNota"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.generos).map(c => ({ name: c, ...dashboardStats.generos[c] })).sort((a,b) => {
                              let valA = a[topSorts.generosNota.key]; let valB = b[topSorts.generosNota.key];
                              if (topSorts.generosNota.key === 'name') return topSorts.generosNota.dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                              return topSorts.generosNota.dir === 'asc' ? valA - valB : valB - valA;
                           }).map(stat => (
                               <tr key={stat.name} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'genre', data: stat.name})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{backgroundColor: getGenreColor(stat.name)}}>{stat.name}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                                 <td className="py-2 text-center">{stat.avgNota}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* Top Gêneros Tempo */}
                   <div className={`p-4 bg-white ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] overflow-x-auto h-fit`}>
                     <h3 className="text-[10px] font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-1">Top Gêneros (Tempo)</h3>
                     <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                       <table className="w-full text-left text-[10px] font-black uppercase">
                         <thead className="sticky top-0 bg-white z-10 shadow-sm"><tr className="border-b-[2px] border-slate-900"><MiniTh label="Gênero" sortKey="name" tableKey="generosTempo"/><MiniTh align="center" label="Jogos" sortKey="count" tableKey="generosTempo"/><MiniTh align="center" label="Tempo" sortKey="totalTempo" tableKey="generosTempo"/></tr></thead>
                         <tbody>
                           {Object.keys(dashboardStats.generos).map(c => ({ name: c, ...dashboardStats.generos[c] })).sort((a,b) => {
                              let valA = a[topSorts.generosTempo.key]; let valB = b[topSorts.generosTempo.key];
                              if (topSorts.generosTempo.key === 'name') return topSorts.generosTempo.dir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                              return topSorts.generosTempo.dir === 'asc' ? valA - valB : valB - valA;
                           }).map(stat => (
                               <tr key={stat.name} className="border-b border-slate-200 hover:bg-slate-50">
                                 <td className="py-2"><span onClick={()=>setViewModal({type:'genre', data: stat.name})} className="inline-block cursor-pointer px-1.5 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{backgroundColor: getGenreColor(stat.name)}}>{stat.name}</span></td>
                                 <td className="py-2 text-center">{stat.count}</td>
                                 <td className="py-2 text-center text-blue-600">{formatTotalTempoHrs(stat.totalTempo)}</td>
                               </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                </div>

             </div>
          )}

          {}
          {/* LISTAS FINALS & BACKLOG */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (() => {
             const isBacklog = activeTab === 'backlog';
             const totalPages = Math.ceil(sortedAndFilteredGames.length / ITEMS_PER_PAGE);
             const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
             const currentList = viewMode === 'table' ? sortedAndFilteredGames : sortedAndFilteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
             
             return (
              <div className="flex flex-col gap-4">
                {viewMode === 'table' ? renderGameTable(currentList, isBacklog) : (
                  <>
                     {renderGameCards(currentList, isBacklog)}
                     <PaginationControls current="{currentPage}" onChange="{setCurrentPage}" total="{totalPages}"/>
                  </>
                )}
              </div>
            )
          })()}

          {}
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
                  
                  {formData.status === 'Finalizado' ? (
                     <>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input required value={formData.titulo} onChange={e=>setFormData({...formData, titulo: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list" value={formData.plataforma} onChange={e=>setFormData({...formData, plataforma: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list" value={formData.franquia} onChange={e=>setFormData({...formData, franquia: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input placeholder="DD-MM-AAAA" value={formData.inicio} onChange={e=>setFormData({...formData, inicio: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input placeholder="DD-MM-AAAA" value={formData.fim} onChange={e=>setFormData({...formData, fim: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input placeholder="Ex: 12h ou 120:00:00" value={formData.tempo} onChange={e=>setFormData({...formData, tempo: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota</label><input placeholder="De 0 a 10 ou S" type="text" value={formData.nota} onChange={e=>setFormData({...formData, nota: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><select value={formData.dificuldade} onChange={e=>setFormData({...formData, dificuldade: e.target.value})} className={theme.input}><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
                        <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><input list="condicoes-list" value={formData.conquistas} onChange={e=>setFormData({...formData, conquistas: e.target.value})} className={theme.input} /></div>
                        <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={formData.midia} onChange={e=>setFormData({...formData, midia: e.target.value})} className={theme.input} /></div>
                        <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={formData.comentarios} onChange={e=>setFormData({...formData, comentarios: e.target.value})} className={theme.input} rows="2" /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input placeholder="69,90" value={formData.preco} onChange={e=>setFormData({...formData, preco: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço S/ Desconto</label><input placeholder="132,90" value={formData.preco_original} onChange={e=>setFormData({...formData, preco_original: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list" value={formData.suporte} onChange={e=>setFormData({...formData, suporte: e.target.value})} className={theme.input} /></div>
                     </>
                  ) : (
                     <>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input required value={formData.titulo} onChange={e=>setFormData({...formData, titulo: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list" value={formData.plataforma} onChange={e=>setFormData({...formData, plataforma: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list" value={formData.franquia} onChange={e=>setFormData({...formData, franquia: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Iniciado</label><input placeholder="DD-MM-AAAA" value={formData.inicio} onChange={e=>setFormData({...formData, inicio: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input placeholder="69,90" value={formData.preco} onChange={e=>setFormData({...formData, preco: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço S/ Desconto</label><input placeholder="132,90" value={formData.preco_original} onChange={e=>setFormData({...formData, preco_original: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list" value={formData.suporte} onChange={e=>setFormData({...formData, suporte: e.target.value})} className={theme.input} /></div>
                        <div className="flex flex-col"><label className="text-xs font-black uppercase">Prioridade</label><select value={formData.prioridade} onChange={e=>setFormData({...formData, prioridade: e.target.value})} className={theme.input}><option value=""></option>{renderPriorityOptions(null)}</select></div>
                     </>
                  )}
                  
                </div>
                <button type="submit" className={`${theme.btnBase} ${theme.cyan} mt-4`}>Salvar na Planilha</button>
              </form>
            </div>
          )}

          {}
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

      {}
      {}
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
                {viewModal.type === 'suporte_cat' && `Formato de Mídia: ${viewModal.data}`}
                {viewModal.type === 'suporte_sub' && `Subtipo de Mídia: ${viewModal.data}`}
                {viewModal.type === 'ano' && `Estatísticas de ${viewModal.data}`}
                {viewModal.type === 'platina' && `Jogos com Platina`}
                {viewModal.type === 'finalizados' && `Lista de Finalizados`}
                {viewModal.type === 'backlog_iniciado' && `Backlog (Em Andamento)`}
                {viewModal.type === 'backlog_nao_iniciado' && `Backlog (Fila/Pendente)`}
              </h2>
              <button onClick={() => setViewModal(null)} className="p-1 hover:bg-white/50 rounded-full transition-colors border-2 border-transparent hover:border-slate-900"><Icons.Close/></button>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <datalist id="consoles-list-edit">{uniqueOptions.console.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="generos-list-edit">{uniqueOptions.genero.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="suportes-list-edit">{uniqueOptions.suporte.map(o => <option key={o} value={o} />)}</datalist>
              <datalist id="condicoes-list-edit">{uniqueOptions.condicao.map(o => <option key={o} value={o} />)}</datalist>

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
                               <span className="inline-flex items-center px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] font-black uppercase" style={{ backgroundColor: getConsoleStyle(viewModal.data.plataforma).bg, color: getConsoleStyle(viewModal.data.plataforma).text }}>
                                 {viewModal.data.plataforma}
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
                        {viewModal.data.status === 'Finalizado' && (
                           <>
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
                           </>
                        )}
                        
                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">{viewModal.data.status === 'Backlog' ? 'Iniciado em' : 'Início'}</span><span className="font-bold">{formatDateStr(viewModal.data.inicio)}</span></div>
                        
                        {viewModal.data.status === 'Finalizado' && (
                           <>
                              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Fim</span><span className="font-bold">{formatDateStr(viewModal.data.fim)}</span></div>
                              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Tempo de Jogo</span><span className="font-black text-blue-700">{formatTempoStr(viewModal.data.tempo)}</span></div>
                              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Duração Span</span><span className="font-bold">{calculateTimeSpan(viewModal.data.inicio, viewModal.data.fim)}</span></div>
                           </>
                        )}
                        
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Preço Pago</span>
                          {viewModal.data.preco && viewModal.data.preco !== '-' ? (
                             <div>
                               <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColorPago(viewModal.data.preco)}}>
                                 {formatCurrency(viewModal.data.preco)}
                               </span>
                             </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Preço s/ Desconto</span>
                          {viewModal.data.preco_original && viewModal.data.preco_original !== '-' ? (
                             <div>
                               <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColorPago(viewModal.data.preco_original)}}>
                                 {formatCurrency(viewModal.data.preco_original)}
                               </span>
                             </div>
                          ) : null}
                        </div>
                        
                        {(() => {
                           if(viewModal.data.status === 'Backlog') return null;
                           let discount = calculateDiscount(viewModal.data.preco, viewModal.data.preco_original);
                           return discount.has ? (
                             <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Desconto</span>
                               <div>
                                 <span className="inline-block px-2 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColorDesc(discount.rawDiff)}}>
                                   {discount.val} ({discount.pct})
                                 </span>
                               </div>
                             </div>
                           ) : <div className="flex flex-col"></div>;
                        })()}

                        <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Suporte</span><span className="font-bold">{viewModal.data.suporte && viewModal.data.suporte !== '-' ? viewModal.data.suporte : ''}</span></div>
                        
                        {viewModal.data.status === 'Backlog' && (
                           <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Prioridade</span>
                             {viewModal.data.prioridade ? (
                                <div>
                                   <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(0,0,0,1)] font-black text-[12px]" style={{backgroundColor: getPriorityColorHex(viewModal.data.prioridade, dashboardStats.totalBacklog), color: '#0f172a'}}>
                                      {viewModal.data.prioridade}
                                   </span>
                                </div>
                             ) : <span className="font-bold">-</span>}
                           </div>
                        )}

                      </div>

                      {viewModal.data.status === 'Finalizado' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                             <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Condição</span>
                             <p className="font-bold text-sm whitespace-pre-wrap flex flex-wrap">{displayCond(viewModal.data.conquistas) || (viewModal.data.conquistas && viewModal.data.conquistas !== '-' ? viewModal.data.conquistas : '')}</p>
                           </div>
                           <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                             <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Observações</span>
                             <p className="font-bold text-sm whitespace-pre-wrap">{getVal(viewModal.data, ['comentarios', 'observacao', 'observação']) || ''}</p>
                           </div>
                        </div>
                      )}

                      {(() => {
                         if (viewModal.data.status === 'Backlog') return null;
                         let linkUrl = getVal(viewModal.data, ['midia', 'link']);
                         let ytb = getYoutubeId(linkUrl) || getYoutubeId(viewModal.data.suporte);
                         if (ytb) return (
                           <div className="w-full aspect-video border-[3px] border-slate-900 shadow-[6px_6px_0_0_rgba(15,23,42,1)] mt-2">
                             <iframe className="w-full h-full" src={`[https://www.youtube.com/embed/$](https://www.youtube.com/embed/$){ytb}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
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
                      <div className="flex flex-col">
                        <label className="text-xs font-black uppercase">Status *</label>
                        <select value={fichaData.status} onChange={e=>setFichaData({...fichaData, status: e.target.value})} className={theme.input}>
                           <option value="Finalizado">Finalizado</option>
                           <option value="Backlog">Backlog</option>
                        </select>
                      </div>

                      {fichaData.status === 'Finalizado' ? (
                         <>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input value={fichaData.titulo} onChange={e=>setFichaData({...fichaData, titulo: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list-edit" value={fichaData.plataforma} onChange={e=>setFichaData({...fichaData, plataforma: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list-edit" value={fichaData.franquia} onChange={e=>setFichaData({...fichaData, franquia: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input placeholder="DD-MM-AAAA" value={fichaData.inicio} onChange={e=>setFichaData({...fichaData, inicio: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input placeholder="DD-MM-AAAA" value={fichaData.fim} onChange={e=>setFichaData({...fichaData, fim: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input placeholder="12h" value={fichaData.tempo} onChange={e=>setFichaData({...fichaData, tempo: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota</label><input placeholder="De 0 a 10 ou S" type="text" value={fichaData.nota} onChange={e=>setFichaData({...fichaData, nota: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><select value={fichaData.dificuldade} onChange={e=>setFichaData({...fichaData, dificuldade: e.target.value})} className={theme.input}><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
                           <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><input list="condicoes-list-edit" value={fichaData.conquistas} onChange={e=>setFichaData({...fichaData, conquistas: e.target.value})} className={theme.input} /></div>
                           <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={getVal(fichaData, ['midia', 'link'])} onChange={e=>setFichaData({...fichaData, midia: e.target.value, link: e.target.value})} className={theme.input} /></div>
                           <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={getVal(fichaData, ['comentarios', 'observacao', 'observação'])} onChange={e=>setFichaData({...fichaData, comentarios: e.target.value, observacao: e.target.value})} className={theme.input} rows="2" /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input value={fichaData.preco} onChange={e=>setFichaData({...fichaData, preco: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço s/ Desconto</label><input value={fichaData.preco_original} onChange={e=>setFichaData({...fichaData, preco_original: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list-edit" value={fichaData.suporte} onChange={e=>setFichaData({...fichaData, suporte: e.target.value})} className={theme.input} /></div>
                         </>
                      ) : (
                         <>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input value={fichaData.titulo} onChange={e=>setFichaData({...fichaData, titulo: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input list="consoles-list-edit" value={fichaData.plataforma} onChange={e=>setFichaData({...fichaData, plataforma: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input list="generos-list-edit" value={fichaData.franquia} onChange={e=>setFichaData({...fichaData, franquia: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Iniciado</label><input placeholder="DD-MM-AAAA" value={fichaData.inicio} onChange={e=>setFichaData({...fichaData, inicio: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input value={fichaData.preco} onChange={e=>setFichaData({...fichaData, preco: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço s/ Desconto</label><input value={fichaData.preco_original} onChange={e=>setFichaData({...fichaData, preco_original: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input list="suportes-list-edit" value={fichaData.suporte} onChange={e=>setFichaData({...fichaData, suporte: e.target.value})} className={theme.input} /></div>
                           <div className="flex flex-col"><label className="text-xs font-black uppercase">Prioridade</label><select value={fichaData.prioridade} onChange={e=>setFichaData({...fichaData, prioridade: e.target.value})} className={theme.input}><option value=""></option>{renderPriorityOptions(fichaData.id)}</select></div>
                         </>
                      )}
                    </div>
                  )}
                </>
              )}

              {}
              {/* FICHA DE LISTAGENS FILTRADAS */}
              {viewModal.type !== 'game' && (() => {
                 let filteredList = games.filter(g => {
                    let vPlat = getVal(g, ['plataforma', 'console']);
                    let vGen = getVal(g, ['franquia', 'genero', 'gênero']);
                    let vNota = String(getVal(g, ['nota'])).toUpperCase().trim();
                    let vDiff = String(getVal(g, ['dificuldade'])).toUpperCase().trim();
                    let vSup = getVal(g, ['suporte']);

                    if (viewModal.type === 'console') return g.status === 'Finalizado' && vPlat === viewModal.data;
                    if (viewModal.type === 'genre') return g.status === 'Finalizado' && vGen === viewModal.data;
                    if (viewModal.type === 'diff') return g.status === 'Finalizado' && vDiff === viewModal.data;
                    if (viewModal.type === 'suporte') return g.status === 'Finalizado' && vSup === viewModal.data;
                    
                    if (viewModal.type === 'suporte_cat') return g.status === 'Finalizado' && getSuporteInfo(vSup).categoria === viewModal.data;
                    if (viewModal.type === 'suporte_sub') return g.status === 'Finalizado' && getSuporteInfo(vSup).subCategoria === viewModal.data;

                    if (viewModal.type === 'platina') return g.status === 'Finalizado' && String(getVal(g, ['conquistas', 'condicao', 'condição'])).toLowerCase().includes('platina');
                    if (viewModal.type === 'ano') {
                        let y = 'Desc.';
                        let dStr = formatDateStr(getVal(g, ['fim']));
                        if (dStr && dStr.split('-').length === 3) y = dStr.split('-')[2];
                        return g.status === 'Finalizado' && y === viewModal.data;
                    }
                    if (viewModal.type === 'note') {
                       if (g.status !== 'Finalizado') return false;
                       if (viewModal.data === 'S') return vNota === 'S';
                       let nm = parseFloat(vNota.replace(',', '.'));
                       let targetNota = parseFloat(viewModal.data);
                       return Math.floor(nm) === targetNota;
                    }

                    if (viewModal.type === 'finalizados') return g.status === 'Finalizado';
                    if (viewModal.type === 'backlog_iniciado') return g.status === 'Backlog' && !!getVal(g, ['inicio', 'iniciado']) && getVal(g, ['inicio', 'iniciado']) !== '-';
                    if (viewModal.type === 'backlog_nao_iniciado') return g.status === 'Backlog' && (!getVal(g, ['inicio', 'iniciado']) || getVal(g, ['inicio', 'iniciado']) === '-');

                    return false;
                 });
                 
                 let isListBacklog = ['backlog_iniciado', 'backlog_nao_iniciado'].includes(viewModal.type);
                 
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

                     {!isListBacklog && (
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
                     )}
                     
                     <div>
                       <h3 className="text-sm font-black uppercase border-b-[3px] border-slate-900 pb-2 mb-4">
                          Listagem
                       </h3>
                       {renderGameTable(filteredList, isListBacklog)}
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
