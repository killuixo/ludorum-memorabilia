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

const ConsoleIcon = ({ consoleName }) => {
  if (!consoleName) return null;
  const c = String(consoleName).toLowerCase();

  if (c.includes('ps4') || c.includes('ps5') || c.includes('playstation') || c.includes('ps3') || c.includes('ps2') || c.includes('ps1')) {
    return (
      <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.322 3.123v13.911l3.528 1.139V3.123zM0 16.518l6.398 2.052v-2.736L2.33 14.526l4.068-.788v-2.036L0 13.064zm13.882.261l9.118 2.923-2.905 1.054-6.213-1.996v-1.981zm.001-4.717l9.117 2.924-2.905 1.053-6.212-1.996v-1.981zM11.85 0C5.305 0 0 5.305 0 11.85s5.305 11.85 11.85 11.85 11.85-5.305 11.85-11.85S18.395 0 11.85 0z" fill="none"/>
        <path d="M8.5 4.5 3 6.8v9.7l5.5 2V4.5zm12.5 12-5.5-2v2.5l5.5 1.8v-2.3zM14 13.8l5.5 1.8v-2.3L14 11.5v2.3z"/>
      </svg>
    );
  }
  if (c.includes('xbox')) {
    return (
      <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.12 18.23c-1.57.87-3.23 1.3-5.12 1.3-1.89 0-3.55-.43-5.12-1.3l2.88-5.33c.69.39 1.45.58 2.24.58.79 0 1.55-.19 2.24-.58l2.88 5.33zM4.32 6.88c1.36-1.55 3.25-2.58 5.4-2.82L7.3 9.49C6.22 8.7 5.2 7.82 4.32 6.88zm15.36 0c-.88.94-1.9 1.82-2.98 2.61l-2.42-5.43c2.15.24 4.04 1.27 5.4 2.82z"/>
      </svg>
    );
  }
  if (c.includes('switch') || c.includes('wii') || c.includes('nintendo') || c.includes('snes') || c.includes('ds') || c.includes('gba') || c.includes('gamecube')) {
    return (
      <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm14-7h-4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
      </svg>
    );
  }
  if (c.includes('pc') || c.includes('steam')) {
    return (
      <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0a12 12 0 0 0-11.95 10.72L5.8 13.1a3.5 3.5 0 0 1 2.37-.89c.17 0 .34.01.5.04l3.12-4.52a4.48 4.48 0 0 1 5.21 4.27 4.5 4.5 0 0 1-8.31 2.33l-4.22 1.74A12 12 0 1 0 12 0zm-3.5 14a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/>
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 inline-block shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H9v2H7v-2H5v-2h2V9h2v2h2v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
  );
};

const getConsoleColor = (consoleName) => {
  if(!consoleName) return '#e2e8f0';
  const name = String(consoleName).toLowerCase();
  if (name.includes('ps4') || name.includes('ps5') || name.includes('playstation')) return '#93C5FD';
  if (name.includes('ps1') || name.includes('ps2') || name.includes('ps3')) return '#BFDBFE';
  if (name.includes('xbox')) return '#86EFAC';
  if (name.includes('switch') || name.includes('wii') || name.includes('snes')) return '#FCA5A5';
  if (name.includes('pc') || name.includes('steam')) return '#E2E8F0';
  if (name.includes('ds') || name.includes('gba') || name.includes('gamecube')) return '#C4B5FD';
  if (name.includes('mega drive') || name.includes('master system')) return '#FDE047';
  return '#FFD3B6';
};

const getGenreColor = (genreName) => {
  if (!genreName) return '#f1f5f9';
  const g = String(genreName).toLowerCase();
  if (g.includes('rpg')) return '#C4B5FD'; // Violeta
  if (g.includes('ação') || g.includes('acao')) return '#FF8B94'; // Pink Mondrian
  if (g.includes('plataforma')) return '#A8E6CF'; // Ciano Mondrian
  if (g.includes('luta') || g.includes('briga')) return '#FCA5A5'; // Vermelho suave
  if (g.includes('quebra') || g.includes('puzzle')) return '#FFD3B6'; // Dourado Mondrian
  if (g.includes('corrida')) return '#FDE047'; // Amarelo
  if (g.includes('estratégia') || g.includes('estrategia')) return '#93C5FD'; // Azul
  if (g.includes('sobrevivência') || g.includes('survival')) return '#86EFAC'; // Verde
  if (g.includes('aventura')) return '#FED7AA'; // Laranja suave
  if (g.includes('fps') || g.includes('tiro')) return '#CBD5E1'; // Cinza
  return '#E2E8F0';
};

const getDifficultyBadge = (dif) => {
  if (!dif) return { text: '-', bg: '#f1f5f9' };
  const d = String(dif).toUpperCase().trim();
  if (d === 'A') return { text: 'A (Muito Difícil)', bg: '#FF8B94' }; // Pink
  if (d === 'B') return { text: 'B (Difícil)', bg: '#FFB3BA' };
  if (d === 'C') return { text: 'C (Médio)', bg: '#A8E6CF' }; // Ciano
  if (d === 'D') return { text: 'D (Fácil)', bg: '#FFE5B4' };
  if (d === 'E') return { text: 'E (Facílimo)', bg: '#FFD3B6' }; // Dourado
  if (d === 'S') return { text: 'S (Master)', bg: '#FCA5A5' };
  return { text: d, bg: '#E2E8F0' };
};

const getRatingBadge = (notaVal) => {
  if (notaVal === undefined || notaVal === null || notaVal === '') return <span className="text-slate-400">-</span>;
  const strVal = String(notaVal).trim().toUpperCase();

  // Tratamento Nota S
  if (strVal === 'S' || strVal === 'S+' || strVal === 'RANK S') {
    return (
      <span className="inline-block px-3 py-1 font-black text-xs uppercase border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] bg-gradient-to-r from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6] animate-pulse text-slate-900">
        ⭐ RANK S
      </span>
    );
  }

  const num = parseFloat(strVal.replace(',', '.'));
  if (isNaN(num)) return <span>{strVal}</span>;

  // Escala de Cor de 0 (Dourado #FFD3B6) a 10 (Ciano #A8E6CF)
  let bgColor = '#FFD3B6';
  if (num >= 9.0) bgColor = '#A8E6CF'; // Ciano
  else if (num >= 7.5) bgColor = '#C7F0DB';
  else if (num >= 6.0) bgColor = '#FFE5B4';
  else bgColor = '#FF8B94'; // Pink para notas muito baixas

  return (
    <span className="inline-block px-2.5 py-1 font-black text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: bgColor }}>
      {num.toFixed(1)}
    </span>
  );
};

const getPriceBadge = (precoStr, maxPreco) => {
  if (!precoStr) return '-';
  let clean = String(precoStr).replace('R$', '').trim().replace(',', '.');
  let num = parseFloat(clean);
  if (isNaN(num) || num === 0) return 'Grátis / -';

  // Escala: Pink (mais caro), Ciano (médio), Dourado (barato)
  let bg = '#FFD3B6';
  if (maxPreco > 0) {
    let ratio = num / maxPreco;
    if (ratio > 0.6) bg = '#FF8B94'; // Caro = Pink
    else if (ratio > 0.3) bg = '#A8E6CF'; // Médio = Ciano
    else bg = '#FFD3B6'; // Barato = Dourado
  }

  return (
    <span className="inline-block px-2 py-0.5 font-bold text-xs border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)]" style={{ backgroundColor: bg }}>
      R$ {num.toFixed(2).replace('.', ',')}
    </span>
  );
};

const formatTempo = (tempoVal) => {
  if (!tempoVal) return '-';
  let str = String(tempoVal).trim();

  // Trata formato ISO vindo do Sheets (ex: 1900-01-03T00:00:00.000Z ou 1899-12-30T20:00:00)
  if (str.includes('T') || str.includes('1899') || str.includes('1900')) {
    try {
      let d = new Date(str);
      if (!isNaN(d.getTime())) {
        // No Sheets, 1899-12-30 é a data base de tempo 00:00
        let baseDate = new Date('1899-12-30T00:00:00Z');
        let diffMs = d.getTime() - baseDate.getTime();
        if (diffMs < 0) {
          // Ajuste para fusos horários negativos
          diffMs += 24 * 60 * 60 * 1000;
        }
        let totalMins = Math.floor(diffMs / (1000 * 60));
        let hrs = Math.floor(totalMins / 60);
        let mins = totalMins % 60;
        
        if (hrs === 0 && mins === 0) return '-';
        return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
      }
    } catch (e) {
      // Fallback para parsing simples
    }
  }

  // Se já for do tipo "74:47:48" ou "16:00:00"
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
  if (!inicio || !fim) return '-';
  try {
    const parseDate = (dStr) => {
      let s = String(dStr).trim();
      if (s.includes('/')) {
        let p = s.split('/');
        if (p.length === 3) return new Date(`${p[2]}-${p[1]}-${p[0]}`);
      }
      return new Date(s);
    };

    let d1 = parseDate(inicio);
    let d2 = parseDate(fim);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '-';

    let diffTime = Math.abs(d2 - d1);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '1 dia';
    if (diffDays < 14) return `${diffDays} dias`;
    if (diffDays < 60) {
      let weeks = Math.round(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    let months = Math.round(diffDays / 30);
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  } catch (e) {
    return '-';
  }
};

const calculateDiscount = (pPago, pOrig) => {
  const parseVal = (v) => {
    if (!v) return 0;
    let clean = String(v).replace('R$', '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
  };

  let pago = parseVal(pPago);
  let orig = parseVal(pOrig);

  if (orig > pago && orig > 0) {
    let diff = orig - pago;
    let percent = Math.round((diff / orig) * 100);
    return {
      descontoVal: `R$ ${diff.toFixed(2).replace('.', ',')}`,
      descontoPct: `${percent}%`,
      hasDiscount: true
    };
  }
  return { descontoVal: '-', descontoPct: '0%', hasDiscount: false };
};

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

const SimpleBarChart = ({ data, maxVal }) => (
  <div className="w-full flex flex-col gap-3 mt-4">
    {data.map((item, i) => (
      <div key={i} className="flex items-center text-xs sm:text-sm font-black">
        <div className="w-28 truncate">{item.label}</div>
        <div className="flex-1 h-6 bg-slate-100 border-[2px] border-slate-900 relative mx-2 overflow-hidden shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
          <div className="h-full border-r-[2px] border-slate-900 transition-all duration-500" style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color }} />
        </div>
        <div className="w-8 text-right font-black">{item.value}</div>
      </div>
    ))}
  </div>
);

export default function App() {
  const [appState, setAppState] = useState('booting'); 
  const [activeTab, setActiveTab] = useState('finished');
  const [configUrl, setConfigUrl] = useState('');
  const [games, setGames] = useState([]);
  const [syncStatus, setSyncStatus] = useState({ type: 'idle', message: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: '', titulo: '', status: 'Backlog', plataforma: '', franquia: '', 
    nota: '', dificuldade: 'C', tempo: '', preco: '', preco_original: '', suporte: '', 
    midia: 'Digital', inicio: '', fim: '', conquistas: '', comentarios: ''
  });

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
      console.error(err);
      setSyncStatus({ type: 'error', message: 'Falha ao Sincronizar! Verifique o link e se você publicou a Nova Versão no Apps Script.' });
      setAppState('config');
    }
  };

  const saveConfig = () => {
    if(!configUrl.includes('script.google.com')) {
      setSyncStatus({ type: 'error', message: 'Insira um Link válido do Google Apps Script.' });
      return;
    }
    localStorage.setItem('gas_url', configUrl);
    setAppState('loading');
    fetchGames(configUrl);
  };

  const saveGame = async (e) => {
    e.preventDefault();
    setAppState('loading');
    
    const isNew = !formData.id;
    const payload = {
      action: isNew ? 'ADD' : 'UPDATE',
      data: { ...formData, id: isNew ? 'temp_id' : formData.id }
    };

    try {
      const res = await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const result = await res.json();
      if(result.error) throw new Error(result.error);
      
      await fetchGames(configUrl);
      setActiveTab(formData.status === 'Finalizado' ? 'finished' : 'backlog');
      resetForm();
    } catch (err) {
      setSyncStatus({ type: 'error', message: 'Erro ao salvar. Verifique a conexão.' });
      setAppState('ready');
    }
  };

  const deleteGame = async (id) => {
    if(!window.confirm('Tem certeza que deseja excluir este jogo?')) return;
    setAppState('loading');
    try {
      await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      await fetchGames(configUrl);
    } catch (err) {
      setSyncStatus({ type: 'error', message: 'Erro ao deletar.' });
      setAppState('ready');
    }
  };

  const editGame = (game) => {
    setFormData({...formData, ...game});
    setActiveTab('add');
  };

  const resetForm = () => {
    setFormData({
      id: '', titulo: '', status: 'Backlog', plataforma: '', franquia: '', 
      nota: '', dificuldade: 'C', tempo: '', preco: '', preco_original: '', suporte: '', 
      midia: 'Digital', inicio: '', fim: '', conquistas: '', comentarios: ''
    });
  };

  const stats = useMemo(() => {
    try {
      const finished = games.filter(g => g.status === 'Finalizado');
      const backlog = games.filter(g => g.status === 'Backlog');
      
      const parseVal = (val) => {
        if(typeof val === 'number') return val;
        let str = String(val).replace('R$', '').trim().replace(',', '.');
        return parseFloat(str) || 0;
      };

      const parseTempoHours = (tempoStr) => {
        let f = formatTempo(tempoStr);
        if (f.includes('h')) {
          let parts = f.split('h');
          let h = parseFloat(parts[0]) || 0;
          return h;
        }
        return 0;
      };

      const totalSpent = games.reduce((acc, g) => acc + parseVal(g.preco), 0);
      const totalTime = finished.reduce((acc, g) => acc + parseTempoHours(g.tempo), 0);
      
      // Média das notas ignorando NOTA S
      let validRatings = [];
      let sRankCount = 0;

      finished.forEach(g => {
        let nStr = String(g.nota || '').trim().toUpperCase();
        if (nStr === 'S' || nStr === 'RANK S') {
          sRankCount++;
        } else {
          let n = parseFloat(nStr.replace(',', '.'));
          if (!isNaN(n)) validRatings.push(n);
        }
      });

      const avgRating = validRatings.length > 0 ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1) : '-';

      // Plataformas
      const consoleCounts = {};
      games.forEach(g => {
        const plat = g.plataforma || 'Outros';
        consoleCounts[plat] = (consoleCounts[plat] || 0) + 1;
      });
      const consoleChartData = Object.entries(consoleCounts)
        .sort((a,b) => b[1] - a[1]).slice(0, 5)
        .map(([label, value]) => ({ label, value, color: getConsoleColor(label) }));
      const maxConsoleCount = Math.max(...consoleChartData.map(d => d.value), 1);

      // Gêneros
      const genreCounts = {};
      games.forEach(g => {
        const gen = g.franquia || 'Outros';
        genreCounts[gen] = (genreCounts[gen] || 0) + 1;
      });
      const genreChartData = Object.entries(genreCounts)
        .sort((a,b) => b[1] - a[1]).slice(0, 5)
        .map(([label, value]) => ({ label, value, color: getGenreColor(label) }));
      const maxGenreCount = Math.max(...genreChartData.map(d => d.value), 1);

      // Preço máximo para a escala
      const maxPrice = Math.max(...games.map(g => parseVal(g.preco)), 1);

      return { total: games.length, finished: finished.length, backlog: backlog.length, totalSpent, totalTime, avgRating, sRankCount, consoleChartData, maxConsoleCount, genreChartData, maxGenreCount, maxPrice };
    } catch(e) {
      return { total: 0, finished: 0, backlog: 0, totalSpent: 0, totalTime: 0, avgRating: '-', sRankCount: 0, consoleChartData: [], maxConsoleCount: 1, genreChartData: [], maxGenreCount: 1, maxPrice: 1 };
    }
  }, [games]);

  const filteredGames = useMemo(() => {
    let list = games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog'));
    if (!searchTerm) return list;
    return list.filter(g => 
      String(g.titulo).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(g.plataforma).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(g.franquia).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [games, activeTab, searchTerm]);

  const NavButton = ({ tab, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(tab); if(tab === 'add') resetForm(); }}
      className={`flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 w-full transition-colors border-b-[3px] sm:border-b-0 sm:border-r-[3px] border-slate-900 ${activeTab === tab ? theme.gold : 'bg-white hover:bg-slate-50'}`}
    >
      <Icon /> <span className="text-xs sm:text-sm font-black uppercase mt-1 sm:mt-0">{label}</span>
    </button>
  );

  if (appState === 'booting' || (appState === 'loading' && games.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Ludorum Logo" className="w-36 h-36 object-contain drop-shadow-xl" />
          <div className="flex flex-col items-center text-center">
             <div className={`px-4 py-2 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform -rotate-2`}>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Ludorum</h1>
             </div>
             <div className={`px-4 py-1 mt-2 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform rotate-1`}>
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest">Memorabilia</h2>
             </div>
          </div>
          <div className="mt-6 text-slate-600 font-black uppercase text-xs sm:text-sm flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-slate-900" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Carregando Biblioteca de Jogos...
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'config') {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className={`max-w-md w-full ${theme.cyan} p-8 ${theme.border} ${theme.card}`}>
          <div className="flex justify-center mb-6">
             <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-24 h-24 drop-shadow-md" />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase text-center">Conectar Planilha</h2>
          <p className="text-xs mb-6 text-center font-bold text-slate-700">Cole a URL do seu App Script abaixo. Suas informações ficam armazenadas apenas no seu dispositivo.</p>
          
          {syncStatus.type === 'error' && (
            <div className={`p-3 mb-4 ${theme.pink} border-[2px] border-slate-900 font-bold text-xs text-center`}>{syncStatus.message}</div>
          )}
          
          <input 
            type="url" 
            value={configUrl} 
            onChange={(e) => setConfigUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className={`${theme.input} mb-4`}
          />
          <button onClick={saveConfig} className={`${theme.btnBase} ${theme.gold} w-full`}>
            Acessar Biblioteca
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-2 sm:p-6 selection:bg-pink-200">
      
      {/* Header Visual Mondrian */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row items-center gap-4">
        <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
        <div className={`p-2 sm:p-3 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform -rotate-1`}>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Ludorum</h1>
        </div>
        <div className={`p-1.5 sm:p-2 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)] transform rotate-1`}>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest">Memorabilia</h2>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto ${theme.border} ${theme.card} flex flex-col bg-white overflow-hidden`}>
        
        {/* Navegação */}
        <nav className={`flex flex-row overflow-x-auto sm:grid sm:grid-cols-5 border-b-[3px] border-slate-900 bg-slate-100`}>
          <NavButton tab="dashboard" icon={Icons.Home} label="Dashboard" />
          <NavButton tab="finished" icon={Icons.List} label="Finalizados" />
          <NavButton tab="backlog" icon={Icons.List} label="Backlog" />
          <NavButton tab="add" icon={Icons.Plus} label="Novo Jogo" />
          <NavButton tab="settings" icon={Icons.Settings} label="Config" />
        </nav>

        {/* Loader Secundário Animado */}
        {appState === 'loading' && (
          <div className="h-1.5 w-full bg-slate-200 relative overflow-hidden border-b-[3px] border-slate-900">
            <div className="absolute top-0 left-0 h-full bg-[#FF8B94] animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        <main className="p-3 sm:p-6">

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
            <div className={`max-w-lg mx-auto ${theme.cyan} p-6 ${theme.border} ${theme.card}`}>
              <h2 className="text-2xl font-black mb-4 uppercase">Alterar Conexão</h2>
              <input type="url" value={configUrl} onChange={(e) => setConfigUrl(e.target.value)} className={`${theme.input} mb-4`} />
              
              {syncStatus.type !== 'idle' && (
                <div className={`p-3 mb-4 font-bold text-sm border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] text-center
                  ${syncStatus.type === 'success' ? 'bg-[#86EFAC]' : syncStatus.type === 'error' ? theme.pink : 'bg-white'}
                `}>
                  {syncStatus.message}
                </div>
              )}

              <button onClick={saveConfig} disabled={appState === 'loading'} className={`${theme.btnBase} ${theme.gold} w-full`}>
                {appState === 'loading' ? 'Reconectando...' : 'Reconectar'}
              </button>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.cyan}`}>
                  <div className="text-xs font-black uppercase mb-1">Total Jogos</div>
                  <div className="text-3xl font-black">{stats.total}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} bg-white`}>
                  <div className="text-xs font-black uppercase mb-1">Finalizados / Backlog</div>
                  <div className="text-xl font-black">{stats.finished} <span className="text-slate-400">/</span> {stats.backlog}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.gold}`}>
                  <div className="text-xs font-black uppercase mb-1">Horas de Jogo</div>
                  <div className="text-2xl font-black">{stats.totalTime}h</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.pink}`}>
                  <div className="text-xs font-black uppercase mb-1">Média Notas (excl. S)</div>
                  <div className="text-2xl font-black">{stats.avgRating} <span className="text-xs font-bold text-slate-800">/10</span></div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} bg-gradient-to-br from-[#FF8B94] via-[#A8E6CF] to-[#FFD3B6]`}>
                  <div className="text-xs font-black uppercase mb-1 text-slate-900">Rank S (Masterpiece)</div>
                  <div className="text-3xl font-black text-slate-900">⭐ {stats.sRankCount}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-5 ${theme.border} ${theme.card} bg-white`}>
                  <h3 className="text-md font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Top Consoles</h3>
                  {stats.consoleChartData.length > 0 ? 
                    <SimpleBarChart data={stats.consoleChartData} maxVal={stats.maxConsoleCount} /> 
                    : <p className="text-slate-500 font-bold text-xs">Sem dados suficientes.</p>}
                </div>
                <div className={`p-5 ${theme.border} ${theme.card} bg-white`}>
                  <h3 className="text-md font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Top Gêneros</h3>
                  {stats.genreChartData.length > 0 ? 
                    <SimpleBarChart data={stats.genreChartData} maxVal={stats.maxGenreCount} /> 
                    : <p className="text-slate-500 font-bold text-xs">Sem dados suficientes.</p>}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: FINALIZADOS & BACKLOG TABLES */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="flex flex-col gap-4">
              
              {/* Barra de Busca */}
              <div className="flex justify-between items-center gap-4">
                <input 
                  type="text" 
                  placeholder="🔍 Buscar por título, console ou gênero..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${theme.input} max-w-xs`}
                />
                <div className="text-xs font-black uppercase">
                  Exibindo {filteredGames.length} jogos
                </div>
              </div>

              <div className="overflow-x-auto border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px] text-xs font-bold">
                  <thead>
                    <tr className={`${activeTab === 'finished' ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase font-black text-slate-900`}>
                      <th className="p-2.5 border-r-[3px] border-slate-900 text-center w-12">#</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900">Nome do Jogo</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900">Console</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900">Gênero</th>
                      {activeTab === 'finished' && (
                        <>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Início</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Fim</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Tempo Total</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Duração</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Nota</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Dificuldade</th>
                          <th className="p-2.5 border-r-[3px] border-slate-900">Condição</th>
                        </>
                      )}
                      <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Pago</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Original</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900 text-center">Desconto</th>
                      <th className="p-2.5 border-r-[3px] border-slate-900">Suporte</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.map((game, i) => {
                      const difBadge = getDifficultyBadge(game.dificuldade);
                      const discount = calculateDiscount(game.preco, game.preco_original);
                      const timeSpan = calculateTimeSpan(game.inicio, game.fim);
                      
                      return (
                        <tr key={game.id || i} className="border-b-[2px] border-slate-900 hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 border-r-[3px] border-slate-900 text-center font-black bg-slate-100">
                            {game.ordem || i + 1}
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900 font-black text-sm">
                            {game.titulo || '-'}
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: getConsoleColor(game.plataforma)}}>
                              <ConsoleIcon consoleName={game.plataforma} />
                              <span className="font-black uppercase">{game.plataforma || '-'}</span>
                            </span>
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900">
                            <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase text-[11px]" style={{backgroundColor: getGenreColor(game.franquia)}}>
                              {game.franquia || '-'}
                            </span>
                          </td>

                          {activeTab === 'finished' && (
                            <>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center">{game.inicio || '-'}</td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center">{game.fim || '-'}</td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center font-black">
                                {formatTempo(game.tempo)}
                              </td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center">
                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 border-[1px] border-slate-900">{timeSpan}</span>
                              </td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center">
                                {getRatingBadge(game.nota)}
                              </td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 text-center">
                                <span className="inline-block px-2 py-0.5 border-[2px] border-slate-900 shadow-[1px_1px_0_0_rgba(15,23,42,1)] uppercase font-black" style={{backgroundColor: difBadge.bg}}>
                                  {difBadge.text}
                                </span>
                              </td>
                              <td className="p-2.5 border-r-[3px] border-slate-900 font-medium truncate max-w-[150px]">{game.conquistas || '-'}</td>
                            </>
                          )}

                          <td className="p-2.5 border-r-[3px] border-slate-900 text-center">
                            {getPriceBadge(game.preco, stats.maxPrice)}
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900 text-center text-slate-500">
                            {game.preco_original ? `R$ ${parseFloat(String(game.preco_original).replace('R$', '').trim().replace(',', '.')).toFixed(2)}` : '-'}
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900 text-center font-black">
                            {discount.hasDiscount ? (
                              <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border-[1px] border-emerald-900">
                                {discount.descontoVal} ({discount.descontoPct})
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-2.5 border-r-[3px] border-slate-900 font-medium">{game.suporte || game.midia || '-'}</td>

                          <td className="p-2.5 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => editGame(game)} title="Editar" className="p-1 border-[2px] border-slate-900 bg-white hover:bg-amber-200 transition-colors shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-0.5"><Icons.Plus /></button>
                              <button onClick={() => deleteGame(game.id)} title="Excluir" className="p-1 border-[2px] border-slate-900 bg-white hover:bg-rose-200 transition-colors shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-0.5"><Icons.Trash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredGames.length === 0 && (
                      <tr><td colSpan="16" className="p-8 text-center text-slate-500 font-black">Nenhum jogo encontrado.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: ADD / EDIT FORM */}
          {activeTab === 'add' && (
            <form onSubmit={saveGame} className={`p-6 sm:p-8 bg-white ${theme.border} ${theme.card}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-[3px] border-slate-900 pb-4 gap-4">
                <h2 className="text-2xl font-black uppercase">{formData.id ? 'Editar Jogo' : 'Adicionar Novo Jogo'}</h2>
                <div className="flex gap-4 p-2 bg-slate-100 border-[2px] border-slate-900">
                  <label className="flex items-center gap-2 font-black uppercase text-xs cursor-pointer">
                    <input type="radio" name="status" value="Backlog" checked={formData.status === 'Backlog'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-4 h-4 accent-slate-900" />
                    Backlog
                  </label>
                  <label className="flex items-center gap-2 font-black uppercase text-xs cursor-pointer">
                    <input type="radio" name="status" value="Finalizado" checked={formData.status === 'Finalizado'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-4 h-4 accent-slate-900" />
                    Finalizado
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Nome do Jogo *</label>
                  <input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Console</label>
                  <input placeholder="ex: PS4, Switch, PC..." value={formData.plataforma} onChange={e => setFormData({...formData, plataforma: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Gênero</label>
                  <input placeholder="ex: RPG, Plataforma, Ação..." value={formData.franquia} onChange={e => setFormData({...formData, franquia: e.target.value})} className={theme.input} />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Nota (0 a 10 ou S)</label>
                  <input placeholder="ex: 9.5 ou S" value={formData.nota} onChange={e => setFormData({...formData, nota: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Dificuldade (A a E)</label>
                  <select value={formData.dificuldade} onChange={e => setFormData({...formData, dificuldade: e.target.value})} className={theme.input}>
                    <option value="A">A (Muito Difícil)</option>
                    <option value="B">B (Difícil)</option>
                    <option value="C">C (Médio)</option>
                    <option value="D">D (Fácil)</option>
                    <option value="E">E (Facílimo)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Tempo Total (Horas)</label>
                  <input placeholder="ex: 74:47:48 ou 20h" value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})} className={theme.input} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Preço Pago (R$)</label>
                  <input placeholder="ex: 69.98" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Preço sem Desconto (R$)</label>
                  <input placeholder="ex: 199.90" value={formData.preco_original} onChange={e => setFormData({...formData, preco_original: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Suporte / Mídia</label>
                  <input placeholder="ex: Digital / PS Store, Físico / BD" value={formData.suporte} onChange={e => setFormData({...formData, suporte: e.target.value})} className={theme.input} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Data de Início</label>
                  <input placeholder="dd/mm/aaaa" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Data de Fim</label>
                  <input placeholder="dd/mm/aaaa" value={formData.fim} onChange={e => setFormData({...formData, fim: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Condição de Finalização</label>
                  <input placeholder="ex: Platina, Terminar história" value={formData.conquistas} onChange={e => setFormData({...formData, conquistas: e.target.value})} className={theme.input} />
                </div>
                
                <div className="flex flex-col gap-1 md:col-span-3">
                  <label className="text-xs font-black uppercase">Observações</label>
                  <textarea rows="2" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})} className={theme.input}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button type="submit" disabled={appState === 'loading'} className={`${theme.btnBase} ${theme.cyan} flex items-center gap-2 text-md`}>
                  <Icons.Save /> {appState === 'loading' ? 'Salvando...' : 'Salvar Jogo'}
                </button>
              </div>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}
