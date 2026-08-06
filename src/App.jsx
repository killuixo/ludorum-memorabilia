import React, { useState, useEffect, useMemo } from 'react';

// --- ESTILOS MONDRIAN ---
const theme = {
  border: 'border-[3px] border-slate-900',
  card: 'bg-white shadow-[6px_6px_0_0_rgba(15,23,42,1)]',
  cyan: 'bg-[#A8E6CF]',
  gold: 'bg-[#FFD3B6]',
  pink: 'bg-[#FF8B94]',
  input: 'w-full p-2 border-[3px] border-slate-900 bg-white font-bold outline-none focus:bg-slate-50 transition-colors text-sm',
  btnBase: 'px-4 py-2 border-[3px] border-slate-900 font-black uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)] cursor-pointer',
};

// --- FUNÇÕES DE LIMPEZA E FORMATAÇÃO ---
const formatDateStr = (str) => {
  if (!str) return '-';
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
  if (!tempoVal) return '-';
  let str = String(tempoVal).trim();
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
        if (hrs === 0 && mins === 0) return '-';
        return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
      }
    } catch (e) {}
  }
  if (str.includes(':')) {
    let parts = str.split(':');
    let hrs = parseInt(parts[0], 10) || 0;
    let mins = parseInt(parts[1], 10) || 0;
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  let num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num)) return `${num}h`;
  return str;
};

const calculateTimeSpan = (inicio, fim) => {
  let inStr = formatDateStr(inicio);
  let fimStr = formatDateStr(fim);
  if (inStr === '-' || fimStr === '-') return '-';
  try {
    const parseDate = (s) => {
      let p = s.split('/');
      if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}T12:00:00`);
      return new Date(s);
    };
    let d1 = parseDate(inStr);
    let d2 = parseDate(fimStr);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '-';
    let diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '1 dia';
    if (diffDays < 14) return `${diffDays} dias`;
    if (diffDays < 60) {
      let w = Math.round(diffDays / 7);
      return `${w} ${w === 1 ? 'semana' : 'semanas'}`;
    }
    let m = Math.round(diffDays / 30);
    return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  } catch (e) { return '-'; }
};

const calculateDiscount = (pPago, pOrig) => {
  const parseVal = (v) => {
    if (!v) return 0;
    let c = String(v).replace('R$', '').trim().replace(',', '.');
    return parseFloat(c) || 0;
  };
  let pago = parseVal(pPago);
  let orig = parseVal(pOrig);
  if (orig > pago && orig > 0) {
    let diff = orig - pago;
    let pct = Math.round((diff / orig) * 100);
    return { val: `R$ ${diff.toFixed(2).replace('.', ',')}`, pct: `${pct}%`, has: true };
  }
  return { has: false };
};

const getYoutubeId = (url) => {
  if(!url) return null;
  let match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
  return match ? match[1] : null;
};

// --- COMPONENTES VISUAIS ---
const ConsoleIcon = ({ consoleName }) => {
  if (!consoleName) return null;
  const c = String(consoleName).toLowerCase();
  if (c.includes('ps4') || c.includes('ps5') || c.includes('playstation') || c.includes('ps3') || c.includes('ps2') || c.includes('ps1')) return (
    <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M8.322 3.123v13.911l3.528 1.139V3.123zM0 16.518l6.398 2.052v-2.736L2.33 14.526l4.068-.788v-2.036L0 13.064zm13.882.261l9.118 2.923-2.905 1.054-6.213-1.996v-1.981zm.001-4.717l9.117 2.924-2.905 1.053-6.212-1.996v-1.981zM11.85 0C5.305 0 0 5.305 0 11.85s5.305 11.85 11.85 11.85 11.85-5.305 11.85-11.85S18.395 0 11.85 0z" fill="none"/><path d="M8.5 4.5 3 6.8v9.7l5.5 2V4.5zm12.5 12-5.5-2v2.5l5.5 1.8v-2.3zM14 13.8l5.5 1.8v-2.3L14 11.5v2.3z"/></svg>
  );
  if (c.includes('xbox')) return (
    <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.12 18.23c-1.57.87-3.23 1.3-5.12 1.3-1.89 0-3.55-.43-5.12-1.3l2.88-5.33c.69.39 1.45.58 2.24.58.79 0 1.55-.19 2.24-.58l2.88 5.33zM4.32 6.88c1.36-1.55 3.25-2.58 5.4-2.82L7.3 9.49C6.22 8.7 5.2 7.82 4.32 6.88zm15.36 0c-.88.94-1.9 1.82-2.98 2.61l-2.42-5.43c2.15.24 4.04 1.27 5.4 2.82z"/></svg>
  );
  if (c.includes('switch') || c.includes('wii') || c.includes('nintendo') || c.includes('snes') || c.includes('ds') || c.includes('gba') || c.includes('gamecube')) return (
    <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm14-7h-4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/></svg>
  );
  if (c.includes('pc') || c.includes('steam')) return (
    <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-11.95 10.72L5.8 13.1a3.5 3.5 0 0 1 2.37-.89c.17 0 .34.01.5.04l3.12-4.52a4.48 4.48 0 0 1 5.21 4.27 4.5 4.5 0 0 1-8.31 2.33l-4.22 1.74A12 12 0 1 0 12 0zm-3.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
  );
  return <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>;
};

const Colors = {
  getConsole: (name) => {
    let n = String(name || '').toLowerCase();
    if (n.includes('ps4') || n.includes('ps5')) return '#93C5FD';
    if (n.includes('ps1') || n.includes('ps2') || n.includes('ps3')) return '#BFDBFE';
    if (n.includes('xbox')) return '#86EFAC';
    if (n.includes('switch') || n.includes('wii') || n.includes('snes')) return '#FCA5A5';
    if (n.includes('pc')) return '#E2E8F0';
    if (n.includes('mega') || n.includes('master')) return '#FDE047';
    return '#FFD3B6';
  },
  getGenre: (name) => {
    let g = String(name || '').toLowerCase();
    if (g.includes('rpg')) return '#C4B5FD'; // Roxo
    if (g.includes('ação') || g.includes('acao')) return '#FF8B94'; // Pink
    if (g.includes('plataforma')) return '#A8E6CF'; // Ciano
    if (g.includes('luta')) return '#FCA5A5'; // Vermelho Claro
    if (g.includes('quebra') || g.includes('puzzle')) return '#FFD3B6'; // Dourado
    if (g.includes('estratégia')) return '#93C5FD'; // Azul
    if (g.includes('sobrevivência')) return '#86EFAC'; // Verde
    return '#E2E8F0'; // Cinza
  }
};

const getDifficultyBadge = (dif) => {
  let d = String(dif || '').toUpperCase().trim();
  if (d === 'A') return { text: 'A', bg: '#FF8B94' };
  if (d === 'B') return { text: 'B', bg: '#FFB3BA' };
  if (d === 'C') return { text: 'C', bg: '#A8E6CF' };
  if (d === 'D') return { text: 'D', bg: '#FFE5B4' };
  if (d === 'E') return { text: 'E', bg: '#FFD3B6' };
  return { text: d || '-', bg: '#E2E8F0' };
};

const getRatingBadge = (notaVal) => {
  if (!notaVal) return <span className="text-slate-400">-</span>;
  let s = String(notaVal).trim().toUpperCase();
  if (s === 'S' || s === 'RANK S') return (
    <span className="inline-block px-3 py-1 font-black text-xs uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] animate-pulse text-slate-900">
      ⭐ S
    </span>
  );
  let num = parseFloat(s.replace(',', '.'));
  if (isNaN(num)) return <span>{s}</span>;
  let bg = num >= 9.0 ? '#A8E6CF' : num >= 7.5 ? '#C7F0DB' : num >= 6.0 ? '#FFE5B4' : '#FF8B94';
  return (
    <span className="inline-block px-2.5 py-1 font-black text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: bg }}>
      {num.toFixed(1)}
    </span>
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ordenação
  const [sortConfig, setSortConfig] = useState({ key: 'ordem', direction: 'asc' });

  // Ficha Completa
  const [selectedGame, setSelectedGame] = useState(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [fichaData, setFichaData] = useState({});
  const [fichaStatus, setFichaStatus] = useState({ type: 'idle', message: '' });

  const blankForm = { id: '', titulo: '', status: 'Backlog', plataforma: '', franquia: '', nota: '', dificuldade: 'C', tempo: '', preco: '', preco_original: '', suporte: '', midia: '', inicio: '', fim: '', conquistas: '', comentarios: '' };
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
    }, 1800);
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
      list = list.filter(g => 
        String(g.titulo).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(g.plataforma).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(g.franquia).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    list.sort((a, b) => {
      let vA = a[sortConfig.key] || '';
      let vB = b[sortConfig.key] || '';

      if (sortConfig.key === 'ordem') {
        vA = parseInt(vA) || 9999;
        vB = parseInt(vB) || 9999;
      } else if (sortConfig.key === 'nota') {
        const p = x => {
          let s = String(x).toUpperCase().trim();
          if (s === 'S' || s === 'RANK S') return 999;
          return parseFloat(s.replace(',','.')) || 0;
        };
        vA = p(vA); vB = p(vB);
      } else if (sortConfig.key === 'tempo') {
        const p = x => parseFloat(formatTempoStr(x).replace('h','')) || 0;
        vA = p(vA); vB = p(vB);
      } else {
        vA = String(vA).toLowerCase();
        vB = String(vB).toLowerCase();
      }

      if (vA < vB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (vA > vB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [games, activeTab, searchTerm, sortConfig]);

  const executeApiCall = async (action, data, statusUpdateFn) => {
    statusUpdateFn({ type: 'loading', message: 'Salvando...' });
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
      setSelectedGame(fichaData); // Update view mode
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Tem certeza que deseja excluir?')) return;
    setAppState('loading');
    try {
      await fetch(configUrl, { method: 'POST', body: JSON.stringify({ action: 'DELETE', id }) });
      await fetchGames(configUrl);
    } catch(e) {}
  };

  const openFicha = (game) => {
    setSelectedGame(game);
    setFichaData(game);
    setIsEditingFicha(false);
    setFichaStatus({ type: 'idle', message: '' });
  };

  const Th = ({ label, sortKey, className = "" }) => (
    <th onClick={() => handleSort(sortKey)} className={`p-2.5 border-r-[3px] border-slate-900 cursor-pointer hover:bg-black/5 transition-colors ${className}`}>
      <div className="flex items-center justify-between">
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
          <div className="mt-6 text-slate-800 font-black uppercase text-xs">Acessando Planilha Base...</div>
        </div>
      </div>
    );
  }

  if (appState === 'config') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className={`max-w-md w-full ${theme.cyan} p-8 ${theme.border} ${theme.card}`}>
          <h2 className="text-2xl font-black mb-4 uppercase text-center">Conectar Planilha</h2>
          {syncStatus.type !== 'idle' && (
            <div className={`p-3 mb-4 border-[2px] border-slate-900 font-bold text-xs text-center ${syncStatus.type === 'success' ? 'bg-[#86EFAC]' : syncStatus.type === 'error' ? theme.pink : 'bg-white'}`}>
              {syncStatus.message}
            </div>
          )}
          <input type="url" value={configUrl} onChange={(e) => setConfigUrl(e.target.value)} placeholder="Cole a URL do Apps Script" className={`${theme.input} mb-4`} />
          <button onClick={saveConfig} className={`${theme.btnBase} ${theme.gold} w-full`}>Acessar Biblioteca</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-2 sm:p-6 selection:bg-pink-200 relative">
      
      {/* HEADER MONDRIAN */}
      <div className="max-w-[1400px] mx-auto mb-6 flex items-center gap-4">
        <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-14 h-14" />
        <div className={`p-2 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform -rotate-1`}>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Ludorum</h1>
        </div>
        <div className={`p-1.5 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform rotate-1`}>
          <h2 className="text-lg font-bold uppercase tracking-widest">Memorabilia</h2>
        </div>
      </div>

      <div className={`max-w-[1400px] mx-auto ${theme.border} ${theme.card} flex flex-col bg-white overflow-hidden`}>
        {/* NAVEGAÇÃO */}
        <nav className="flex flex-row overflow-x-auto sm:grid sm:grid-cols-5 border-b-[3px] border-slate-900 bg-slate-100">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Icons.Home },
            { id: 'finished', label: 'Finalizados', icon: Icons.List },
            { id: 'backlog', label: 'Backlog', icon: Icons.List },
            { id: 'add', label: 'Novo Jogo', icon: Icons.Plus },
            { id: 'settings', label: 'Config', icon: Icons.Settings }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 w-full transition-colors border-r-[3px] border-slate-900 ${activeTab === t.id ? theme.gold : 'bg-white hover:bg-slate-50'}`}>
              <t.icon /> <span className="text-xs sm:text-sm font-black uppercase">{t.label}</span>
            </button>
          ))}
        </nav>

        {appState === 'loading' && (
          <div className="h-1.5 w-full bg-slate-200 relative overflow-hidden border-b-[3px] border-slate-900">
            <div className="absolute top-0 left-0 h-full bg-[#FF8B94] animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        <main className="p-4 sm:p-6">
          
          {/* TAB: TABELAS (FINALIZADOS & BACKLOG) */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <input type="text" placeholder="🔍 Buscar por título, console ou gênero..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${theme.input} max-w-sm`} />
                <div className="text-xs font-black uppercase text-slate-500">Exibindo {sortedAndFilteredGames.length} jogos</div>
              </div>

              <div className="overflow-x-auto border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white pb-2">
                <table className="w-full text-left border-collapse whitespace-nowrap text-[11px] sm:text-xs font-bold">
                  <thead>
                    <tr className={`${activeTab === 'finished' ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase font-black text-slate-900`}>
                      <Th label="#" sortKey="ordem" className="text-center w-10" />
                      <Th label="Nome do Jogo" sortKey="titulo" />
                      <Th label="Console" sortKey="plataforma" />
                      <Th label="Gênero" sortKey="franquia" />
                      {activeTab === 'finished' && (
                        <>
                          <Th label="Início" sortKey="inicio" className="text-center" />
                          <Th label="Fim" sortKey="fim" className="text-center" />
                          <Th label="Tempo" sortKey="tempo" className="text-center" />
                          <Th label="Nota" sortKey="nota" className="text-center" />
                          <Th label="Dif" sortKey="dificuldade" className="text-center" />
                        </>
                      )}
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredGames.map((game, i) => (
                      <tr key={game.id || i} className="border-b-[2px] border-slate-900 hover:bg-slate-50 transition-colors">
                        <td className="p-2 border-r-[3px] border-slate-900 text-center font-black bg-slate-100">{game.ordem || '-'}</td>
                        <td onClick={() => openFicha(game)} className="p-2 border-r-[3px] border-slate-900 font-black text-sm cursor-pointer hover:text-blue-600 transition-colors underline decoration-slate-300 underline-offset-4">{game.titulo || '-'}</td>
                        <td onClick={() => openFicha(game)} className="p-2 border-r-[3px] border-slate-900 cursor-pointer">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-transform" style={{backgroundColor: Colors.getConsole(game.plataforma)}}>
                            <ConsoleIcon consoleName={game.plataforma} /> <span className="font-black uppercase">{game.plataforma || '-'}</span>
                          </span>
                        </td>
                        <td onClick={() => openFicha(game)} className="p-2 border-r-[3px] border-slate-900 cursor-pointer">
                          <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 uppercase shadow-[1px_1px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: Colors.getGenre(game.franquia)}}>{game.franquia || '-'}</span>
                        </td>
                        {activeTab === 'finished' && (
                          <>
                            <td className="p-2 border-r-[3px] border-slate-900 text-center">{formatDateStr(game.inicio)}</td>
                            <td className="p-2 border-r-[3px] border-slate-900 text-center">{formatDateStr(game.fim)}</td>
                            <td className="p-2 border-r-[3px] border-slate-900 text-center font-black">{formatTempoStr(game.tempo)}</td>
                            <td className="p-2 border-r-[3px] border-slate-900 text-center">{getRatingBadge(game.nota)}</td>
                            <td className="p-2 border-r-[3px] border-slate-900 text-center">
                              <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase font-black" style={{backgroundColor: getDifficultyBadge(game.dificuldade).bg}}>{getDifficultyBadge(game.dificuldade).text}</span>
                            </td>
                          </>
                        )}
                        <td className="p-2 text-center align-middle">
                          <button onClick={() => handleDelete(game.id)} title="Excluir" className="p-1.5 border-[2px] border-slate-900 bg-white hover:bg-rose-200 transition-colors shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-0.5"><Icons.Close /></button>
                        </td>
                      </tr>
                    ))}
                    {sortedAndFilteredGames.length === 0 && <tr><td colSpan="10" className="p-8 text-center text-slate-500 font-black">Nenhum jogo encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NOVO JOGO */}
          {activeTab === 'add' && (
            <div className={`p-6 bg-white ${theme.border} ${theme.card} max-w-4xl mx-auto`}>
              <h2 className="text-2xl font-black uppercase mb-6 border-b-[3px] border-slate-900 pb-2">Novo Jogo (Adicionado no Topo)</h2>
              {/* Reaproveita o formulário de edição da ficha para simplificar */}
              <p className="font-bold text-xs text-slate-600">Preencha os dados abaixo. Eles serão inseridos na linha 2 da sua planilha.</p>
            </div>
          )}

        </main>
      </div>

      {/* MODAL FICHA COMPLETA */}
      {selectedGame && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl bg-white ${theme.border} ${theme.card} flex flex-col my-auto shadow-2xl`}>
            
            {/* Modal Header */}
            <div className={`p-4 border-b-[3px] border-slate-900 flex justify-between items-center ${isEditingFicha ? theme.pink : theme.cyan}`}>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter truncate pr-4">
                {isEditingFicha ? 'Editar Ficha' : selectedGame.titulo}
              </h2>
              <button onClick={() => setSelectedGame(null)} className="p-1 hover:bg-white/50 rounded-full transition-colors border-2 border-transparent hover:border-slate-900"><Icons.Close /></button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 bg-slate-50 overflow-y-auto max-h-[75vh]">
              
              {fichaStatus.type !== 'idle' && (
                <div className={`p-3 mb-4 font-bold text-sm text-center border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${fichaStatus.type === 'loading' ? 'bg-amber-200' : fichaStatus.type === 'success' ? 'bg-[#86EFAC]' : theme.pink}`}>
                  {fichaStatus.message}
                </div>
              )}

              {!isEditingFicha ? (
                /* --- MODO VISUALIZAÇÃO --- */
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Console</span><span className="font-bold">{selectedGame.plataforma || '-'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Gênero</span><span className="font-bold">{selectedGame.franquia || '-'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Nota</span><div className="mt-1">{getRatingBadge(selectedGame.nota)}</div></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Dificuldade</span><span className="font-bold">{selectedGame.dificuldade || '-'}</span></div>
                    
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Data de Início</span><span className="font-bold">{formatDateStr(selectedGame.inicio)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Data de Fim</span><span className="font-bold">{formatDateStr(selectedGame.fim)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Tempo de Jogo</span><span className="font-black text-blue-700">{formatTempoStr(selectedGame.tempo)}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-500">Duração Span</span><span className="font-bold">{calculateTimeSpan(selectedGame.inicio, selectedGame.fim)}</span></div>
                  </div>

                  <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Condição / Conquistas</span>
                    <p className="font-bold text-sm whitespace-pre-wrap">{selectedGame.conquistas || '-'}</p>
                  </div>
                  
                  <div className="p-4 bg-white border-[2px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-2">Observações</span>
                    <p className="font-bold text-sm whitespace-pre-wrap">{selectedGame.comentarios || '-'}</p>
                  </div>

                  {getYoutubeId(selectedGame.midia) || getYoutubeId(selectedGame.suporte) ? (
                    <div className="w-full aspect-video border-[3px] border-slate-900 shadow-[6px_6px_0_0_rgba(15,23,42,1)]">
                      <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${getYoutubeId(selectedGame.midia) || getYoutubeId(selectedGame.suporte)}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                  ) : (selectedGame.midia || selectedGame.suporte) && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-500">Links / Suporte</span>
                      <a href={selectedGame.midia} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline break-all">{selectedGame.midia}</a>
                      <span className="font-bold">{selectedGame.suporte}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* --- MODO EDIÇÃO --- */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nome *</label><input value={fichaData.titulo} onChange={e=>setFichaData({...fichaData, titulo: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Console</label><input value={fichaData.plataforma} onChange={e=>setFichaData({...fichaData, plataforma: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Gênero</label><input value={fichaData.franquia} onChange={e=>setFichaData({...fichaData, franquia: e.target.value})} className={theme.input} /></div>
                  
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Início</label><input value={fichaData.inicio} onChange={e=>setFichaData({...fichaData, inicio: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Fim</label><input value={fichaData.fim} onChange={e=>setFichaData({...fichaData, fim: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Tempo</label><input value={fichaData.tempo} onChange={e=>setFichaData({...fichaData, tempo: e.target.value})} className={theme.input} /></div>
                  
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label><input value={fichaData.nota} onChange={e=>setFichaData({...fichaData, nota: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Dificuldade</label><input value={fichaData.dificuldade} onChange={e=>setFichaData({...fichaData, dificuldade: e.target.value})} className={theme.input} /></div>
                  <div className="flex flex-col"><label className="text-xs font-black uppercase">Link / Mídia</label><input value={fichaData.midia} onChange={e=>setFichaData({...fichaData, midia: e.target.value})} className={theme.input} /></div>
                  
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Condição</label><textarea value={fichaData.conquistas} onChange={e=>setFichaData({...fichaData, conquistas: e.target.value})} className={theme.input} rows="2" /></div>
                  <div className="md:col-span-3 flex flex-col"><label className="text-xs font-black uppercase">Observações</label><textarea value={fichaData.comentarios} onChange={e=>setFichaData({...fichaData, comentarios: e.target.value})} className={theme.input} rows="2" /></div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-[3px] border-slate-900 bg-white flex justify-end gap-4">
              {!isEditingFicha ? (
                <button onClick={() => setIsEditingFicha(true)} className={`${theme.btnBase} ${theme.gold}`}>Habilitar Edição</button>
              ) : (
                <>
                  <button onClick={() => { setIsEditingFicha(false); setFichaData(selectedGame); }} className="px-4 py-2 font-black uppercase text-slate-500 hover:text-slate-900 transition-colors">Cancelar</button>
                  <button onClick={handleUpdateFicha} className={`${theme.btnBase} ${theme.cyan}`}>Salvar Alterações</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
