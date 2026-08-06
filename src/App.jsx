import React, { useState, useEffect, useMemo } from 'react';

const theme = {
  border: 'border-[3px] border-slate-900',
  card: 'bg-white shadow-[6px_6px_0_0_rgba(15,23,42,1)]',
  cyan: 'bg-[#A8E6CF]', // Ciano pastel Mondrian
  gold: 'bg-[#FFD3B6]', // Dourado pastel Mondrian
  pink: 'bg-[#FF8B94]', // Pink pastel Mondrian
  input: 'w-full p-2 border-[3px] border-slate-900 bg-white outline-none focus:bg-slate-50 transition-colors',
  btnBase: 'px-4 py-2 border-[3px] border-slate-900 font-black uppercase active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[4px_4px_0_0_rgba(15,23,42,1)]',
};

const getConsoleColor = (consoleName) => {
  if(!consoleName) return '#e2e8f0';
  const name = String(consoleName).toLowerCase();
  if (name.includes('playstation') || name.includes('ps3') || name.includes('ps4') || name.includes('ps5')) return '#93C5FD';
  if (name.includes('xbox')) return '#86EFAC';
  if (name.includes('nintendo') || name.includes('switch') || name.includes('wii')) return '#FCA5A5';
  if (name.includes('pc') || name.includes('steam')) return '#D1D5DB';
  return '#FDE047';
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
      <div key={i} className="flex items-center text-sm font-bold">
        <div className="w-24 truncate">{item.label}</div>
        <div className="flex-1 h-6 bg-slate-100 border-[2px] border-slate-900 relative mx-2 overflow-hidden">
          <div className="h-full border-r-[2px] border-slate-900" style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color }} />
        </div>
        <div className="w-8 text-right">{item.value}</div>
      </div>
    ))}
  </div>
);

const DonutChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;
  return (
    <div className="flex items-center justify-center gap-6">
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-32 h-32 transform -rotate-90">
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          const startX = Math.cos(2 * Math.PI * cumulativePercent);
          const startY = Math.sin(2 * Math.PI * cumulativePercent);
          cumulativePercent += slice.value / total;
          const endX = Math.cos(2 * Math.PI * cumulativePercent);
          const endY = Math.sin(2 * Math.PI * cumulativePercent);
          const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
          return <path key={i} d={`M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`} fill="none" stroke={slice.color} strokeWidth="0.4" className="transition-all duration-500" />;
        })}
      </svg>
      <div className="flex flex-col gap-2 text-sm font-bold">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 border-[2px] border-slate-900" style={{ backgroundColor: slice.color }}></div>
            <span>{slice.label} ({slice.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  // appState: 'booting', 'loading', 'ready', 'config'
  const [appState, setAppState] = useState('booting'); 
  const [activeTab, setActiveTab] = useState('finished');
  const [configUrl, setConfigUrl] = useState('');
  const [games, setGames] = useState([]);
  const [uiError, setUiError] = useState('');
  
  const [formData, setFormData] = useState({
    id: '', titulo: '', status: 'Backlog', plataforma: '', franquia: '', 
    nota: '', dificuldade: 'Médio', tempo: '', preco: '', suporte: '', 
    midia: 'Digital', inicio: '', fim: '', conquistas: '', comentarios: ''
  });

  useEffect(() => {
    // Tempo mínimo da tela de Splash para efeito visual
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
    setUiError('');
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if(data.error) throw new Error(data.error);

      // Tratamento defensivo caso os arrays venham undefined
      const finishedGames = Array.isArray(data.finished) ? data.finished.map(g => ({ ...g, status: 'Finalizado' })) : [];
      const backlogGames = Array.isArray(data.backlog) ? data.backlog.map(g => ({ ...g, status: 'Backlog' })) : [];
      
      setGames([...finishedGames, ...backlogGames]);
      setAppState('ready');
    } catch (err) {
      console.error(err);
      setUiError('Erro ao carregar dados. A URL pode estar incorreta ou precisa de uma Nova Implantação no Apps Script.');
      setAppState('config'); // Volta para a tela de config em caso de erro fatal
    }
  };

  const saveConfig = () => {
    if(!configUrl.includes('script.google.com')) {
      setUiError('Por favor, insira uma URL válida do Google Apps Script.');
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
      data: { ...formData, id: isNew ? crypto.randomUUID() : formData.id }
    };

    try {
      const res = await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Crucial para evitar preflight (CORS)
      });
      const result = await res.json();
      if(result.error) throw new Error(result.error);
      
      await fetchGames(configUrl);
      setActiveTab(formData.status === 'Finalizado' ? 'finished' : 'backlog');
      resetForm();
    } catch (err) {
      setUiError('Erro ao salvar no Sheets. Verifique sua conexão e a implantação do script.');
      setAppState('ready');
    }
  };

  const deleteGame = async (id) => {
    if(!window.confirm('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.')) return;
    setAppState('loading');
    try {
      await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      await fetchGames(configUrl);
    } catch (err) {
      setUiError('Erro ao deletar. Tente novamente.');
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
      nota: '', dificuldade: 'Médio', tempo: '', preco: '', suporte: '', 
      midia: 'Digital', inicio: '', fim: '', conquistas: '', comentarios: ''
    });
  };

  const stats = useMemo(() => {
    try {
      const finished = games.filter(g => g.status === 'Finalizado');
      const backlog = games.filter(g => g.status === 'Backlog');
      
      const totalSpent = games.reduce((acc, g) => acc + (parseFloat(String(g.preco).replace(',','.')) || 0), 0);
      const totalTime = games.reduce((acc, g) => acc + (parseFloat(String(g.tempo).replace(',','.')) || 0), 0);
      
      const consoleCounts = {};
      games.forEach(g => {
        const plat = g.plataforma || 'Outros';
        consoleCounts[plat] = (consoleCounts[plat] || 0) + 1;
      });
      const consoleChartData = Object.entries(consoleCounts)
        .sort((a,b) => b[1] - a[1]).slice(0, 5) // Pega top 5 para o gráfico
        .map(([label, value]) => ({ label, value, color: getConsoleColor(label) }));
      
      const maxConsoleCount = Math.max(...consoleChartData.map(d => d.value), 1);

      const diffCounts = { 'Fácil': 0, 'Médio': 0, 'Difícil': 0, 'Extremo': 0 };
      finished.forEach(g => { 
        const d = g.dificuldade || 'Médio';
        if(diffCounts[d] !== undefined) diffCounts[d]++; 
      });
      
      const diffChartData = [
        { label: 'Fácil', value: diffCounts['Fácil'], color: '#A8E6CF' },
        { label: 'Médio', value: diffCounts['Médio'], color: '#FFD3B6' },
        { label: 'Difícil', value: diffCounts['Difícil'], color: '#FF8B94' },
        { label: 'Extremo', value: diffCounts['Extremo'], color: '#CBD5E1' }
      ];

      return { total: games.length, finished: finished.length, backlog: backlog.length, totalSpent, totalTime, consoleChartData, maxConsoleCount, diffChartData };
    } catch(e) {
      console.error("Erro ao calcular stats", e);
      return { total: 0, finished: 0, backlog: 0, totalSpent: 0, totalTime: 0, consoleChartData: [], maxConsoleCount: 1, diffChartData: [] };
    }
  }, [games]);

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
          <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Ludorum Logo" className="w-40 h-40 object-contain drop-shadow-xl" />
          <div className="flex flex-col items-center text-center">
             <div className={`px-4 py-2 ${theme.cyan} border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform -rotate-2`}>
                <h1 className="text-4xl font-black uppercase tracking-tighter">Ludorum</h1>
             </div>
             <div className={`px-4 py-1 mt-2 ${theme.pink} border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] inline-block transform rotate-1`}>
                <h2 className="text-xl font-bold uppercase tracking-widest">Memorabilia</h2>
             </div>
          </div>
          <div className="mt-8 text-slate-500 font-bold uppercase text-sm flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Sincronizando com a Planilha...
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
             <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-24 h-24" />
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase text-center">Conectar Planilha</h2>
          <p className="text-sm mb-6 text-center font-medium">Cole a URL do seu App Script abaixo. Seus dados ficam salvos apenas neste dispositivo.</p>
          
          {uiError && <div className={`p-3 mb-4 ${theme.pink} border-[2px] border-slate-900 font-bold text-sm`}>{uiError}</div>}
          
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
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-center gap-4">
        <img src="https://raw.githubusercontent.com/killuixo/ludorum-memorabilia/refs/heads/main/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
        <div className={`p-2 sm:p-3 ${theme.cyan} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Ludorum</h1>
        </div>
        <div className={`p-1 sm:p-2 ${theme.pink} ${theme.border} shadow-[4px_4px_0_0_rgba(15,23,42,1)]`}>
          <h2 className="text-lg sm:text-2xl font-bold uppercase tracking-widest">Memorabilia</h2>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto ${theme.border} ${theme.card} flex flex-col bg-white overflow-hidden`}>
        
        {/* Navegação */}
        <nav className={`flex flex-row overflow-x-auto sm:grid sm:grid-cols-5 border-b-[3px] border-slate-900 bg-slate-100`}>
          <NavButton tab="dashboard" icon={Icons.Home} label="Dashboard" />
          <NavButton tab="finished" icon={Icons.List} label="Finalizados" />
          <NavButton tab="backlog" icon={Icons.List} label="Backlog" />
          <NavButton tab="add" icon={Icons.Plus} label="Novo Jogo" />
          <NavButton tab="settings" icon={Icons.Settings} label="Config" />
        </nav>

        {/* Loader Secundário */}
        {appState === 'loading' && (
          <div className="h-1.5 w-full bg-slate-200 relative overflow-hidden border-b-[3px] border-slate-900">
            <div className="absolute top-0 left-0 h-full bg-[#FF8B94] animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        <main className="p-4 sm:p-8">
          {uiError && <div className={`p-4 mb-6 ${theme.pink} ${theme.border} font-bold`}>{uiError}</div>}

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
            <div className={`max-w-lg mx-auto ${theme.cyan} p-6 ${theme.border} ${theme.card}`}>
              <h2 className="text-2xl font-black mb-4 uppercase">Alterar Conexão</h2>
              <input type="url" value={configUrl} onChange={(e) => setConfigUrl(e.target.value)} className={`${theme.input} mb-4`} />
              <button onClick={saveConfig} className={`${theme.btnBase} ${theme.gold} w-full`}>Reconectar</button>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.cyan}`}>
                  <div className="text-xs font-black uppercase mb-1">Total de Jogos</div>
                  <div className="text-4xl font-black">{stats.total}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} bg-white`}>
                  <div className="text-xs font-black uppercase mb-1">Fim / Backlog</div>
                  <div className="text-2xl font-black">{stats.finished} <span className="text-slate-400">/</span> {stats.backlog}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.gold}`}>
                  <div className="text-xs font-black uppercase mb-1">Tempo Jogado</div>
                  <div className="text-2xl font-black">{stats.totalTime}h</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.pink}`}>
                  <div className="text-xs font-black uppercase mb-1">Total Gasto</div>
                  <div className="text-2xl font-black">R$ {stats.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className={`p-6 ${theme.border} ${theme.card} bg-white`}>
                  <h3 className="text-lg font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Top Plataformas</h3>
                  {stats.consoleChartData.length > 0 ? 
                    <SimpleBarChart data={stats.consoleChartData} maxVal={stats.maxConsoleCount} /> 
                    : <p className="text-slate-500 font-bold text-sm">Sem dados suficientes.</p>}
                </div>
                <div className="flex flex-col gap-8">
                   <div className={`p-6 ${theme.border} ${theme.card} bg-white`}>
                    <h3 className="text-lg font-black uppercase mb-4 border-b-[3px] border-slate-900 pb-2">Status da Biblioteca</h3>
                    <DonutChart data={[{ label: 'Finalizados', value: stats.finished, color: '#FFD3B6' }, { label: 'Backlog', value: stats.backlog, color: '#A8E6CF' }]} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LISTAGEM (FINALIZADOS / BACKLOG) */}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="overflow-x-auto border-[3px] border-slate-900">
              <table className={`w-full text-left border-collapse bg-white whitespace-nowrap min-w-[600px]`}>
                <thead>
                  <tr className={`${activeTab === 'finished' ? theme.gold : theme.cyan} border-b-[3px] border-slate-900 uppercase text-xs sm:text-sm font-black`}>
                    <th className="p-3 border-r-[3px] border-slate-900">Título</th>
                    <th className="p-3 border-r-[3px] border-slate-900">Plataforma</th>
                    <th className="p-3 border-r-[3px] border-slate-900">Nota</th>
                    <th className="p-3 border-r-[3px] border-slate-900">Tempo</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog')).map((game, i) => (
                    <tr key={game.id || i} className="border-b-[2px] border-slate-900 hover:bg-slate-100 transition-colors font-bold text-sm">
                      <td className="p-3 border-r-[3px] border-slate-900">{game.titulo || '-'}</td>
                      <td className="p-3 border-r-[3px] border-slate-900">
                        <span className="inline-block px-2 py-1 text-xs border-[2px] border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]" style={{backgroundColor: getConsoleColor(game.plataforma)}}>
                          {game.plataforma || '-'}
                        </span>
                      </td>
                      <td className="p-3 border-r-[3px] border-slate-900">{game.nota || '-'}</td>
                      <td className="p-3 border-r-[3px] border-slate-900">{game.tempo ? `${game.tempo}h` : '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => editGame(game)} className={`p-1.5 border-[2px] border-slate-900 bg-white hover:${theme.gold} transition-colors shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none`}><Icons.Plus /></button>
                          <button onClick={() => deleteGame(game.id)} className={`p-1.5 border-[2px] border-slate-900 bg-white hover:${theme.pink} transition-colors shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none`}><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog')).length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-bold">Nenhum jogo nesta lista.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: ADD / EDIT GAME */}
          {activeTab === 'add' && (
            <form onSubmit={saveGame} className={`p-6 sm:p-8 bg-white ${theme.border} ${theme.card}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-[3px] border-slate-900 pb-4 gap-4">
                <h2 className="text-2xl font-black uppercase">{formData.id ? 'Editar Jogo' : 'Adicionar Jogo'}</h2>
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
                  <label className="text-xs font-black uppercase">Título *</label>
                  <input required value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Plataforma</label>
                  <input value={formData.plataforma} onChange={e => setFormData({...formData, plataforma: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Franquia</label>
                  <input value={formData.franquia} onChange={e => setFormData({...formData, franquia: e.target.value})} className={theme.input} />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Nota (0-10)</label>
                  <input type="number" step="0.1" min="0" max="10" value={formData.nota} onChange={e => setFormData({...formData, nota: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Dificuldade</label>
                  <select value={formData.dificuldade} onChange={e => setFormData({...formData, dificuldade: e.target.value})} className={theme.input}>
                    <option>Fácil</option><option>Médio</option><option>Difícil</option><option>Extremo</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Tempo Jogado (h)</label>
                  <input type="number" step="0.1" value={formData.tempo} onChange={e => setFormData({...formData, tempo: e.target.value})} className={theme.input} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Preço (R$)</label>
                  <input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Mídia</label>
                  <select value={formData.midia} onChange={e => setFormData({...formData, midia: e.target.value})} className={theme.input}>
                    <option>Digital</option><option>Física</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Suporte / Dev</label>
                  <input value={formData.suporte} onChange={e => setFormData({...formData, suporte: e.target.value})} className={theme.input} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Data Início</label>
                  <input type="date" value={formData.inicio} onChange={e => setFormData({...formData, inicio: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Data Término</label>
                  <input type="date" value={formData.fim} onChange={e => setFormData({...formData, fim: e.target.value})} className={theme.input} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-black uppercase">Conquistas (%)</label>
                  <input type="number" min="0" max="100" value={formData.conquistas} onChange={e => setFormData({...formData, conquistas: e.target.value})} className={theme.input} />
                </div>
                
                <div className="flex flex-col gap-1 md:col-span-3">
                  <label className="text-xs font-black uppercase">Comentários</label>
                  <textarea rows="2" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})} className={theme.input}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button type="submit" disabled={appState === 'loading'} className={`${theme.btnBase} ${theme.cyan} flex items-center gap-2 text-lg`}>
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
