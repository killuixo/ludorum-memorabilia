import React, { useState, useEffect, useMemo } from 'react';

const theme = {
  border: 'border-[3px] border-slate-900',
  card: 'bg-white shadow-[6px_6px_0_0_rgba(15,23,42,1)]',
  cyan: 'bg-[#A8E6CF]',
  gold: 'bg-[#FFD3B6]',
  pink: 'bg-[#FF8B94]',
  input: 'w-full p-2 border-[3px] border-slate-900 bg-white font-bold outline-none focus:bg-slate-50 transition-colors text-sm',
  btnBase: 'px-4 py-2 border-[3px] border-slate-900 font-black uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer',
};

const getVal = (game, possibleKeys) => {
  if (!game) return '';
  const keys = Object.keys(game);
  for (let k of keys) {
     const cleanK = String(k).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
     for (let pk of possibleKeys) {
        const cleanPk = String(pk).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\n\r]/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanK === cleanPk) return game[k];
     }
  }
  return '';
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || val === '' || val === '-') return '';
  let strVal = String(val).replace('R$', '').trim().replace(/\s/g, '').replace(',', '.');
  let num = parseFloat(strVal);
  if (isNaN(num)) return String(val);
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

const formatDateStr = (str) => {
  if (!str || str === '-') return '';
  let s = String(str).trim();
  if (s.includes('T') && s.includes('Z')) {
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

const calculateTimeSpan = (inicio, fim) => {
  let inStr = formatDateStr(inicio);
  let fimStr = formatDateStr(fim);
  if (!inStr || !fimStr) return '';
  try {
    const parseDate = (s) => {
      let p = s.split('/');
      if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}T12:00:00`);
      return new Date(s);
    };
    let d1 = parseDate(inStr);
    let d2 = parseDate(fimStr);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '';
    let diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '1 dia';
    if (diffDays < 14) return `${diffDays} dias`;
    if (diffDays < 60) {
      let w = Math.round(diffDays / 7);
      return `${w} ${w === 1 ? 'semana' : 'semanas'}`;
    }
    let m = Math.round(diffDays / 30);
    return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  } catch (e) { return ''; }
};

const calculateDiscount = (pPago, pOrig) => {
  const parseVal = (v) => {
    if (!v || v === '-') return 0;
    let c = String(v).replace('R$', '').trim().replace(',', '.');
    return parseFloat(c) || 0;
  };
  let pago = parseVal(pPago);
  let orig = parseVal(pOrig);
  if (orig > pago && orig > 0) {
    let diff = orig - pago;
    let pct = Math.round((diff / orig) * 100);
    return { val: `R$ ${diff.toFixed(2).replace('.', ',')}`, pct: `${pct}%`, has: true, rawDiff: diff };
  }
  return { has: false, rawDiff: 0 };
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
  if (n === 'PS3' || n === 'PLAYSTATION 3') return { bg: '#000000', text: '#FFFFFF' };
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

const ConsoleIcon = ({ consoleName }) => {
  if (!consoleName) return null;
  const c = String(consoleName).toLowerCase();
  if (c.includes('ps4') || c.includes('ps5') || c.includes('playstation') || c.includes('ps3') || c.includes('ps2') || c.includes('ps1')) return (
    <svg className="w-4 h-4 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M8.322 3.123v13.911l3.528 1.139V3.123zM0 16.518l6.398 2.052v-2.736L2.33 14.526l4.068-.788v-2.036L0 13.064zm13.882.261l9.118 2.923-2.905 1.054-6.213-1.996v-1.981zm.001-4.717l9.117 2.924-2.905 1.053-6.212-1.996v-1.981zM11.85 0C5.305 0 0 5.305 0 11.85s5.305 11.85 11.85 11.85 11.85-5.305 11.85-11.85S18.395 0 11.85 0z" fill="none"/><path d="M8.5 4.5 3 6.8v9.7l5.5 2V4.5zm12.5 12-5.5-2v2.5l5.5 1.8v-2.3zM14 13.8l5.5 1.8v-2.3L14 11.5v2.3z"/></svg>
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
    <span className="inline-block px-3 py-1 font-black text-xs uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] animate-pulse text-slate-900">
      ⭐ S
    </span>
  );
  let num = parseFloat(s.replace(',', '.'));
  if (isNaN(num)) return <span className="font-bold">{s}</span>;
  let bg = num >= 9.0 ? '#A8E6CF' : num >= 7.5 ? '#C7F0DB' : num >= 6.0 ? '#FFE5B4' : '#FFD3B6';
  return (
    <span className="inline-block px-2.5 py-1 font-black text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: bg }}>
      {num.toFixed(1)}
    </span>
  );
};

const getPriceColor = (priceVal) => {
  if (!priceVal || priceVal === '-') return 'transparent';
  let p = parseFloat(String(priceVal).replace('R$', '').trim().replace(',', '.'));
  if (isNaN(p) || p === 0) return 'transparent';
  if (p >= 100) return '#FF8B94'; 
  if (p >= 40) return '#A8E6CF';
  return '#FFD3B6'; 
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
  const [searchTerm, setSearchTerm] = useState('');
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
      const finishedGames = Array.isArray(data.finished) ? data.finished : [];
      const backlogGames = Array.isArray(data.backlog) ? data.backlog : [];
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredGames = useMemo(() => {
    let list = games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog'));
    
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
        // Removemos o 'id' desta busca para garantir que leia APENAS a coluna visual da planilha
        valA = parseInt(getVal(a, ['#', 'ordem'])) || 0;
        valB = parseInt(getVal(b, ['#', 'ordem'])) || 0;
      } else if (sortConfig.key === 'nota') {
        const p = x => {
          let s = String(x).toUpperCase().trim();
          if (s === 'S' || s === 'RANK S') return 999;
          return parseFloat(s.replace(',','.')) || 0;
        };
        valA = p(getVal(a, ['nota'])); valB = p(getVal(b, ['nota']));
      } else if (sortConfig.key === 'tempo') {
        const p = x => parseFloat(formatTempoStr(x).replace('h','')) || 0;
        valA = p(getVal(a, ['tempo'])); valB = p(getVal(b, ['tempo']));
      } else if (sortConfig.key === 'preco') {
        const p = x => parseFloat(String(x).replace('R$', '').trim().replace(',', '.')) || 0;
        valA = p(getVal(a, ['preco', 'preco pago'])); valB = p(getVal(b, ['preco', 'preco pago']));
      } else if (sortConfig.key === 'preco_original') {
        const p = x => parseFloat(String(x).replace('R$', '').trim().replace(',', '.')) || 0;
        valA = p(getVal(a, ['preco_original', 'preco sem desconto', 'preço sem desconto'])); valB = p(getVal(b, ['preco_original', 'preco sem desconto', 'preço sem desconto']));
      } else if (sortConfig.key === 'desconto') {
        const getDesc = x => calculateDiscount(getVal(x, ['preco', 'preco pago']), getVal(x, ['preco_original', 'preco sem desconto', 'preço sem desconto'])).rawDiff;
        valA = getDesc(a); valB = getDesc(b);
      } else {
        valA = String(getVal(a, [sortConfig.key])).toLowerCase();
        valB = String(getVal(b, [sortConfig.key])).toLowerCase();
      }

      // Células vazias SEMPRE no final, independente de ser Ascendente ou Decrescente
      let isBlank = (val) => val === '' || val === null || val === undefined || val === '-' || (typeof val === 'number' && isNaN(val)) || (typeof val === 'number' && val === 0 && sortConfig.key !== 'nota');
      let blankA = isBlank(valA);
      let blankB = isBlank(valB);

      if (blankA && blankB) return 0;
      if (blankA) return 1;  
      if (blankB) return -1; 

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [games, activeTab, searchTerm, sortConfig]);

  const dashboardStats = useMemo(() => {
    let fin = games.filter(g => g.status === 'Finalizado');
    let totalJogos = fin.length;
    let sRanks = fin.filter(g => String(getVal(g, ['nota'])).toUpperCase().trim() === 'S').length;
    let notasValidas = fin.map(g => parseFloat(String(getVal(g, ['nota'])).replace(',','.'))).filter(n => !isNaN(n));
    let avgNota = notasValidas.length > 0 ? (notasValidas.reduce((a,b)=>a+b,0) / notasValidas.length).toFixed(1) : 0;
    let totalGasto = fin.reduce((acc, g) => {
      let p = parseFloat(String(getVal(g, ['preco', 'preco pago'])).replace('R$', '').trim().replace(',', '.'));
      return acc + (isNaN(p) ? 0 : p);
    }, 0);
    return { totalJogos, sRanks, avgNota, totalGasto: `R$ ${totalGasto.toFixed(2).replace('.',',')}` };
  }, [games]);

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
      setTimeout(() => statusUpdateFn({ type: 'idle', message: '' }), 2000);
      return true;
    } catch(err) {
      statusUpdateFn({ type: 'error', message: 'Erro ao salvar.' });
      return false;
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    const success = await executeApiCall('ADD', { ...formData, id: 'temp_id' }, setSyncStatus);
    if (success) {
      setActiveTab(formData.status === 'Finalizado' ? 'finished' : 'backlog');
      setFormData(blankForm);
    }
  };

  const handleUpdateFicha = async () => {
    const success = await executeApiCall('UPDATE', fichaData, setFichaStatus);
    if (success) {
      setIsEditingFicha(false);
      setViewModal({ type: 'game', data: fichaData }); 
    }
  };

  const handleDelete = async (id) => {
    setAppState('loading');
    try {
      await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'DELETE', id }) });
      await fetchGames(configUrl);
    } catch(e) {}
  };

  const Th = ({ label, sortKey, className = "" }) => (
    <th onClick={() => handleSort(sortKey)} className={`p-2 border-r-[3px] border-slate-900 cursor-pointer hover:bg-black/5 transition-colors whitespace-nowrap ${className}`}>
      <div className="flex items-center justify-between gap-1">
        <span>{label}</span>
        {sortConfig.key === sortKey && <Icons.SortArrow asc={sortConfig.direction === 'asc'} />}
      </div>
    </th>
  );

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
      
      {/* Header com Busca */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4">
          <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14" />
          <div className={`p-1.5 sm:p-2 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform -rotate-1`}>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Ludorum</h1>
          </div>
          <div className={`p-1 sm:p-1.5 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform rotate-1`}>
            <h2 className="text-sm sm:text-lg font-bold uppercase tracking-widest">Memorabilia</h2>
          </div>
        </div>
        
        {(activeTab === 'finished' || activeTab === 'backlog') && (
          <div className="flex-grow max-w-sm sm:ml-4">
            <input type="text" placeholder="🔍 Buscar por título, console ou gênero..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={theme.input} />
          </div>
        )}
      </div>

      <div className={`max-w-[1600px] mx-auto ${theme.border} ${theme.card} flex flex-col bg-white overflow-hidden`}>
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
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 ${theme.border} bg-[#A8E6CF] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                  <h3 className="text-xs font-black uppercase">Total Finalizados</h3>
                  <p className="text-4xl font-black">{dashboardStats.totalJogos}</p>
                </div>
                <div className={`p-4 ${theme.border} bg-gradient-to-r from-[#FF8B94] to-[#FFD3B6] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                  <h3 className="text-xs font-black uppercase">Obras-Primas (Rank S)</h3>
                  <p className="text-4xl font-black">{dashboardStats.sRanks}</p>
                </div>
                <div className={`p-4 ${theme.border} bg-[#93C5FD] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                  <h3 className="text-xs font-black uppercase">Nota Média (Sem as 'S')</h3>
                  <p className="text-4xl font-black">{dashboardStats.avgNota}</p>
                </div>
                <div className={`p-4 ${theme.border} bg-[#FDE047] shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                  <h3 className="text-xs font-black uppercase">Total Investido</h3>
                  <p className="text-2xl font-black mt-2">{dashboardStats.totalGasto}</p>
                </div>
             </div>
          )}

          {}
          {/* TAB: LISTAS (Tabela Principal) */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <div className="text-xs font-black uppercase text-slate-500">Exibindo {sortedAndFilteredGames.length} jogos</div>
              </div>

              <div className="overflow-x-auto border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white pb-2 max-w-full">
                <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] font-bold">
                  <thead>
                    <tr className={`${activeTab === 'finished' ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase font-black text-slate-900`}>
                      <Th label="#" sortKey="ordem" className="text-center w-10" />
                      <Th label="NOME DO JOGO" sortKey="titulo" />
                      <Th label="CONSOLE" sortKey="plataforma" />
                      <Th label="GÊNERO" sortKey="franquia" />
                      
                      {activeTab === 'finished' && (
                        <>
                          <Th label="INÍCIO" sortKey="inicio" className="text-center" />
                          <Th label="FIM" sortKey="fim" className="text-center" />
                          <Th label="TEMPO TOTAL" sortKey="tempo" className="text-center" />
                          <Th label="DURAÇÃO" sortKey="duracao" className="text-center" />
                          <Th label="NOTA" sortKey="nota" className="text-center" />
                          <Th label="DIF" sortKey="dificuldade" className="text-center" />
                          <Th label="CONDIÇÃO" sortKey="conquistas" />
                          <Th label="PREÇO PAGO" sortKey="preco" className="text-center" />
                          <Th label="PREÇO S/ DESC." sortKey="preco_original" className="text-center" />
                          <Th label="DESCONTO" sortKey="desconto" className="text-center" />
                          <Th label="SUPORTE" sortKey="suporte" className="text-center border-r-0" />
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredGames.map((game, i) => {
                      
                      // Extração sem usar o game.id como fallback para evitar que exiba "Games Finalizados|2"
                      let rawVisualId = getVal(game, ['#', 'ordem']); 
                      let visualId = rawVisualId && rawVisualId !== '-' ? rawVisualId : ''; 
                      
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
                          
                          <td className="p-2 border-r-[3px] border-slate-900 text-center font-black bg-slate-100 whitespace-nowrap">
                            {visualId}
                          </td>
                          
                          <td onClick={() => { 
                                setFichaData({...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc}); 
                                setViewModal({type:'game', data: {...game, '#': visualId, titulo, plataforma, franquia: genero, preco: pricePago, preco_original: priceSemDesc, inicio, fim, tempo, nota, dificuldade: dif, conquistas: cond, suporte: sup}}); 
                                setIsEditingFicha(false); 
                              }} 
                              className="p-2 border-r-[3px] border-slate-900 font-black text-xs cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4 whitespace-normal break-words min-w-[150px]">
                            {displayClean(titulo)}
                          </td>
                          
                          <td onClick={() => { if(displayClean(plataforma)) setViewModal({type:'console', data: plataforma}) }} className="p-2 border-r-[3px] border-slate-900 cursor-pointer whitespace-nowrap">
                            {displayClean(plataforma) ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform font-black uppercase" style={{ backgroundColor: consoleStyle.bg, color: consoleStyle.text }}>
                                <ConsoleIcon consoleName={plataforma} /> {plataforma}
                              </span>
                            ) : null}
                          </td>
                          
                          <td onClick={() => { if(displayClean(genero)) setViewModal({type:'genre', data: genero}) }} className="p-2 border-r-[3px] border-slate-900 cursor-pointer whitespace-nowrap">
                            {displayClean(genero) ? (
                               <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 uppercase font-black shadow-[1px_1px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{backgroundColor: getGenreColor(genero)}}>
                                 {genero}
                               </span>
                            ) : null}
                          </td>

                          {activeTab === 'finished' && (
                            <>
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{formatDateStr(inicio)}</td>
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{formatDateStr(fim)}</td>
                              <td className="p-2 border-r-[3px] border-slate-900 text-center font-black whitespace-nowrap">{formatTempoStr(tempo)}</td>
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{calculateTimeSpan(inicio, fim)}</td>
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">{getRatingBadge(nota)}</td>
                              
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                                {displayClean(dif) ? (
                                  <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase font-black" style={{backgroundColor: getDifficultyBadge(dif).bg}}>
                                    {getDifficultyBadge(dif).text}
                                  </span>
                                ) : null}
                              </td>
                              
                              <td className="p-2 border-r-[3px] border-slate-900 max-w-[150px] whitespace-normal break-words">{displayClean(cond)}</td>
                              
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                                {displayClean(pricePago) ? (
                                  <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(pricePago)}}>
                                    {formatCurrency(pricePago)}
                                  </span>
                                ) : null}
                              </td>
                              
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                                {displayClean(priceSemDesc) ? (
                                  <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]" style={{backgroundColor: getPriceColor(priceSemDesc)}}>
                                    {formatCurrency(priceSemDesc)}
                                  </span>
                                ) : null}
                              </td>
                              
                              <td className="p-2 border-r-[3px] border-slate-900 text-center whitespace-nowrap">
                                {discount.has ? (
                                  <span className="inline-block px-1.5 py-0.5 font-black border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[#047857] bg-[#D1FAE5]">
                                    {discount.val} ({discount.pct})
                                  </span>
                                ) : null}
                              </td>
                              
                              <td className="p-2 border-slate-900 text-center whitespace-nowrap">{displayClean(sup)}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                    {sortedAndFilteredGames.length === 0 && <tr><td colSpan="15" className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-lg">Nenhum jogo nesta lista.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ADICIONAR NOVO (Inserção na Linha 2) */}
          {activeTab === 'add' && (
            <div className={`p-6 bg-white ${theme.border} ${theme.card} max-w-4xl mx-auto`}>
              <h2 className="text-xl font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Adicionar Novo (Insere no topo sem quebrar fórmulas)</h2>
              <form onSubmit={handleCreateNew} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Status *</label><select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className={theme.input}><option>Finalizado</option><option>Backlog</option></select></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input required value={formData.titulo} onChange={e=>setFormData({...formData, titulo: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input value={formData.plataforma} onChange={e=>setFormData({...formData, plataforma: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input value={formData.franquia} onChange={e=>setFormData({...formData, franquia: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input type="date" value={formData.inicio} onChange={e=>setFormData({...formData, inicio: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input type="date" value={formData.fim} onChange={e=>setFormData({...formData, fim: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input placeholder="Ex: 12h ou 120:00:00" value={formData.tempo} onChange={e=>setFormData({...formData, tempo: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label><input value={formData.nota} onChange={e=>setFormData({...formData, nota: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><select value={formData.dificuldade} onChange={e=>setFormData({...formData, dificuldade: e.target.value})} className={theme.input}><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input placeholder="69,90" value={formData.preco} onChange={e=>setFormData({...formData, preco: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço S/ Desconto</label><input placeholder="132,90" value={formData.preco_original} onChange={e=>setFormData({...formData, preco_original: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input value={formData.suporte} onChange={e=>setFormData({...formData, suporte: e.target.value})} className={theme.input} /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={formData.midia} onChange={e=>setFormData({...formData, midia: e.target.value})} className={theme.input} /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><textarea value={formData.conquistas} onChange={e=>setFormData({...formData, conquistas: e.target.value})} className={theme.input} rows="2" /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={formData.comentarios} onChange={e=>setFormData({...formData, comentarios: e.target.value})} className={theme.input} rows="2" /></div>
                </div>
                <button type="submit" className={`${theme.btnBase} ${theme.cyan} mt-4`}>Salvar na Planilha</button>
              </form>
            </div>
          )}

          {/* TAB: CONFIGURAÇÕES */}
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
      {/* MODAL DE FICHAS */}
      {viewModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl bg-white ${theme.border} ${theme.card} flex flex-col my-auto shadow-2xl`}>
            
            <div className={`p-4 border-b-[3px] border-slate-900 flex justify-between items-center ${viewModal.type === 'game' && isEditingFicha ? theme.pink : theme.cyan}`}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate pr-4">
                {viewModal.type === 'game' && (isEditingFicha ? 'Editar Ficha' : viewModal.data.titulo)}
                {viewModal.type === 'console' && `Ficha do Console: ${viewModal.data}`}
                {viewModal.type === 'genre' && `Ficha do Gênero: ${viewModal.data}`}
              </h2>
              <button onClick={() => setViewModal(null)} className="p-1 hover:bg-white/50 rounded-full transition-colors border-2 border-transparent hover:border-slate-900"><Icons.Close /></button>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 overflow-y-auto max-h-[75vh]">
              
              {/* === FICHA DO JOGO === */}
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
                          {viewModal.data.plataforma ? (
                            <div>
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] font-black uppercase" style={{ backgroundColor: getConsoleStyle(viewModal.data.plataforma).bg, color: getConsoleStyle(viewModal.data.plataforma).text }}>
                                 <ConsoleIcon consoleName={viewModal.data.plataforma} /> {viewModal.data.plataforma}
                               </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Gênero</span>
                          {viewModal.data.franquia ? (
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
                          {viewModal.data.dificuldade ? (
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
                        <div className="flex flex-col col-span-2"><span className="text-[10px] font-black uppercase text-slate-500">Suporte</span><span className="font-bold">{viewModal.data.suporte && viewModal.data.suporte !== '-' ? viewModal.data.suporte : ''}</span></div>
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

                      {/* YOUTUBE PLAYER EMBUTIDO */}
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
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input value={fichaData.plataforma} onChange={e=>setFichaData({...fichaData, plataforma: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input value={fichaData.franquia} onChange={e=>setFichaData({...fichaData, franquia: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input value={fichaData.inicio} onChange={e=>setFichaData({...fichaData, inicio: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input value={fichaData.fim} onChange={e=>setFichaData({...fichaData, fim: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input value={fichaData.tempo} onChange={e=>setFichaData({...fichaData, tempo: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label><input value={fichaData.nota} onChange={e=>setFichaData({...fichaData, nota: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><input value={fichaData.dificuldade} onChange={e=>setFichaData({...fichaData, dificuldade: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço Pago</label><input value={fichaData.preco} onChange={e=>setFichaData({...fichaData, preco: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Preço s/ Desconto</label><input value={fichaData.preco_original} onChange={e=>setFichaData({...fichaData, preco_original: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Suporte</label><input value={fichaData.suporte} onChange={e=>setFichaData({...fichaData, suporte: e.target.value})} className={theme.input} /></div>
                      <div className="flex flex-col"><label className="text-xs font-black uppercase">Link (YouTube)</label><input value={getVal(fichaData, ['midia', 'link'])} onChange={e=>setFichaData({...fichaData, midia: e.target.value, link: e.target.value})} className={theme.input} /></div>
                      
                      <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><textarea value={fichaData.conquistas} onChange={e=>setFichaData({...fichaData, conquistas: e.target.value})} className={theme.input} rows="2" /></div>
                      <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={getVal(fichaData, ['comentarios', 'observacao', 'observação'])} onChange={e=>setFichaData({...fichaData, comentarios: e.target.value, observacao: e.target.value})} className={theme.input} rows="2" /></div>
                    </div>
                  )}
                </>
              )}

              {/* === FICHA DE CONSOLE OU GÊNERO === */}
              {(viewModal.type === 'console' || viewModal.type === 'genre') && (() => {
                 let filteredList = games.filter(g => {
                    let vPlat = getVal(g, ['plataforma', 'console']);
                    let vGen = getVal(g, ['franquia', 'genero', 'gênero']);
                    return viewModal.type === 'console' ? vPlat === viewModal.data : vGen === viewModal.data;
                 });
                 let finList = filteredList.filter(g => g.status === 'Finalizado');
                 
                 let totalTimeHrs = finList.reduce((acc, g) => acc + (parseFloat(formatTempoStr(getVal(g, ['tempo'])).replace('h','')) || 0), 0);
                 let notasVal = finList.map(g => parseFloat(String(getVal(g, ['nota'])).replace(',','.'))).filter(n => !isNaN(n));
                 let avg = notasVal.length > 0 ? (notasVal.reduce((a,b)=>a+b,0) / notasVal.length).toFixed(1) : '-';

                 return (
                   <div className="flex flex-col gap-6">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Total na Lista</h3>
                          <p className="text-2xl font-black">{filteredList.length} <span className="text-xs">jogos</span></p>
                        </div>
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Tempo Gasto (Finalizados)</h3>
                          <p className="text-2xl font-black text-blue-700">{totalTimeHrs}h</p>
                        </div>
                        <div className={`p-4 ${theme.border} bg-white shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
                          <h3 className="text-[10px] font-black uppercase text-slate-500 mb-1">Nota Média</h3>
                          <p className="text-2xl font-black">{avg}</p>
                        </div>
                     </div>
                     <div>
                       <h3 className="text-sm font-black uppercase border-b-[3px] border-slate-900 pb-2 mb-4">Jogos ({viewModal.data})</h3>
                       <div className="flex flex-col gap-2">
                         {filteredList.map((g, i) => (
                           <div key={i} className="flex justify-between items-center bg-white p-2 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
                             <span className="font-black text-sm">{getVal(g, ['titulo', 'nome'])}</span>
                             <span className="text-xs font-bold px-2 py-0.5 border border-slate-900 bg-slate-100 uppercase">{g.status}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 );
              })()}

            </div>

            {/* RODAPÉ DO MODAL (Com botão discreto de Remover) */}
            {viewModal.type === 'game' && (
              <div className="p-4 border-t-[3px] border-slate-900 bg-white flex justify-between items-center gap-4">
                
                <button 
                  onClick={() => {
                     if(window.confirm('Tem certeza que deseja excluir este jogo da planilha?')) {
                        handleDelete(viewModal.data.id);
                        setViewModal(null);
                     }
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
