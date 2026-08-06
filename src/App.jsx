import React, { useState, useEffect, useMemo } from 'react';

// Estilos base do tema Mondrian Suave
const theme = {
  border: 'border-2 border-slate-800',
  card: 'bg-white shadow-[4px_4px_0_0_rgba(30,41,59,1)]',
  cyan: 'bg-[#E0F7FA]', // Ciano suave
  gold: 'bg-[#FFF9C4]', // Dourado suave
  pink: 'bg-[#FCE4EC]', // Pink suave
  input: 'w-full p-2 border-2 border-slate-800 bg-white outline-none focus:bg-slate-50 transition-colors',
  btnBase: 'px-4 py-2 border-2 border-slate-800 font-bold active:translate-y-1 active:translate-x-1 active:shadow-none transition-all shadow-[4px_4px_0_0_rgba(30,41,59,1)]',
};

// Cores temáticas para os consoles
const getConsoleColor = (consoleName) => {
  const name = consoleName.toLowerCase();
  if (name.includes('playstation') || name.includes('ps3') || name.includes('ps4') || name.includes('ps5')) return '#93C5FD'; // Azul claro
  if (name.includes('xbox')) return '#86EFAC'; // Verde claro
  if (name.includes('nintendo') || name.includes('switch') || name.includes('wii')) return '#FCA5A5'; // Vermelho claro
  if (name.includes('pc') || name.includes('steam')) return '#D1D5DB'; // Cinza
  return '#FDE047'; // Amarelo genérico
};

const Icons = {
  Home: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  List: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

// Gráfico de Barras Horizontal
const SimpleBarChart = ({ data, maxVal }) => {
  return (
    <div className="w-full flex flex-col gap-2 mt-4">
      {data.map((item, i) => (
        <div key={i} className="flex items-center text-sm">
          <div className="w-24 truncate font-medium">{item.label}</div>
          <div className="flex-1 h-6 bg-slate-100 border border-slate-800 relative mx-2">
            <div 
              className="h-full border-r border-slate-800" 
              style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color }}
            />
          </div>
          <div className="w-8 text-right">{item.value}</div>
        </div>
      ))}
    </div>
  );
};

// Gráfico de Donut (SVG)
const DonutChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-32 h-32 transform -rotate-90">
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
          cumulativePercent += slice.value / total;
          const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
          const largeArcFlag = slice.value / total > 0.5 ? 1 : 0;
          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          ].join(' ');

          return (
            <path key={i} d={pathData} fill="none" stroke={slice.color} strokeWidth="0.4" className="transition-all duration-500" />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1 text-sm font-bold">
        {data.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 border border-slate-800" style={{ backgroundColor: slice.color }}></div>
            <span>{slice.label} ({slice.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  // Inicia na aba de jogos finalizados conforme solicitado
  const [activeTab, setActiveTab] = useState('finished');
  const [configUrl, setConfigUrl] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado do Formulário (15 colunas)
  // Carrega configurações locais no início e sincroniza automaticamente
  useEffect(() => {
    const savedUrl = localStorage.getItem('gas_url');
    if (savedUrl) {
      setConfigUrl(savedUrl);
      fetchGames(savedUrl);
    } else {
      setActiveTab('settings');
    }
  }, []);

  const fetchGames = async (url) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // O backend agora retorna { finished: [], backlog: [] }
      // Mesclamos no frontend injetando o status para facilitar a UI
      const finishedGames = (data.finished || []).map(g => ({ ...g, status: 'Finalizado' }));
      const backlogGames = (data.backlog || []).map(g => ({ ...g, status: 'Backlog' }));
      
      setGames([...finishedGames, ...backlogGames]);
    } catch (err) {
      setError('Erro ao carregar dados. Verifique a URL da sua Planilha (App Script).');
    }
    setLoading(false);
  };

  const saveGame = async (e) => {
    e.preventDefault();
    if (!configUrl) return alert('Configure a URL primeiro!');
    setLoading(true);
    
    const isNew = !formData.id;
    const payload = {
      action: isNew ? 'ADD' : 'UPDATE',
      data: { ...formData, id: isNew ? crypto.randomUUID() : formData.id }
    };

    try {
      await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      // Sincroniza logo após salvar
      await fetchGames(configUrl);
      setActiveTab(formData.status === 'Finalizado' ? 'finished' : 'backlog');
      resetForm();
    } catch (err) {
      setError('Erro ao salvar no Sheets. Tente novamente.');
    }
    setLoading(false);
  };

  const deleteGame = async (id) => {
    if(!window.confirm('Excluir este jogo?')) return;
    setLoading(true);
    try {
      await fetch(configUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'DELETE', id }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      // Sincroniza logo após deletar
      await fetchGames(configUrl);
    } catch (err) {
      setError('Erro ao deletar do Sheets.');
    }
    setLoading(false);
  };

  const editGame = (game) => {
    setFormData(game);
    setActiveTab('add');
  };

  const resetForm = () => {
    setFormData({
      id: '', titulo: '', status: 'Backlog', plataforma: '', franquia: '', 
      nota: '', dificuldade: 'Médio', tempo: '', preco: '', suporte: '', 
      midia: 'Digital', inicio: '', fim: '', conquistas: '', comentarios: ''
    });
  };

  const saveConfig = () => {
    localStorage.setItem('gas_url', configUrl);
    fetchGames(configUrl);
    setActiveTab('finished');
  };

  const stats = useMemo(() => {
    const finished = games.filter(g => g.status === 'Finalizado');
    const backlog = games.filter(g => g.status === 'Backlog');
    
    // Total Investido
    const totalSpent = games.reduce((acc, g) => acc + (parseFloat(g.preco) || 0), 0);
    const totalTime = games.reduce((acc, g) => acc + (parseFloat(g.tempo) || 0), 0);
    
    // Média de Notas
    const validScores = finished.filter(g => g.nota).map(g => parseFloat(g.nota));
    const avgScore = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;

    // Distribuição por Console
    const consoleCounts = {};
    games.forEach(g => {
      if(g.plataforma) consoleCounts[g.plataforma] = (consoleCounts[g.plataforma] || 0) + 1;
    });
    const consoleChartData = Object.entries(consoleCounts)
      .sort((a,b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: getConsoleColor(label) }));
    
    const maxConsoleCount = Math.max(...consoleChartData.map(d => d.value), 1);

    // Dificuldade (Apenas Finalizados)
    const diffCounts = { 'Fácil': 0, 'Médio': 0, 'Difícil': 0, 'Extremo': 0 };
    finished.forEach(g => { if(diffCounts[g.dificuldade] !== undefined) diffCounts[g.dificuldade]++; });
    const diffChartData = [
      { label: 'Fácil', value: diffCounts['Fácil'], color: '#AEE6E6' },
      { label: 'Médio', value: diffCounts['Médio'], color: '#FCE38A' },
      { label: 'Difícil', value: diffCounts['Difícil'], color: '#FFB6B9' },
      { label: 'Extremo', value: diffCounts['Extremo'], color: '#94A3B8' }
    ];

    return { 
      total: games.length, finished: finished.length, backlog: backlog.length, 
      totalSpent, totalTime, avgScore, consoleChartData, maxConsoleCount, diffChartData 
    };
  }, [games]);

  const NavButton = ({ tab, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(tab); if(tab === 'add') resetForm(); }}
      className={`flex flex-col items-center justify-center p-3 sm:flex-row sm:gap-2 w-full transition-colors border-b-4 sm:border-b-0 sm:border-r-4 ${theme.border} ${activeTab === tab ? theme.gold : 'bg-white hover:bg-slate-50'}`}
    >
      <Icon /> <span className="text-xs sm:text-sm font-black uppercase mt-1 sm:mt-0 tracking-tighter">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 font-sans p-2 sm:p-6 selection:bg-pink-200">
      
      {/* TÍTULO LUDORUM MEMORABILIA */}
      <div className="max-w-6xl mx-auto mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center gap-4">
        <div className={`p-3 ${theme.cyan} ${theme.border} inline-block shadow-[4px_4px_0_0_rgba(30,41,59,1)]`}>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Ludorum</h1>
        </div>
        <div className={`p-2 ${theme.pink} ${theme.border} inline-block shadow-[4px_4px_0_0_rgba(30,41,59,1)]`}>
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-widest">Memorabilia</h2>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto ${theme.border} ${theme.card} flex flex-col`}>
        
        {/* Cabeçalho / Navegação */}
        <nav className={`flex flex-row overflow-x-auto sm:grid sm:grid-cols-5 border-b-4 ${theme.border} bg-white`}>
          <NavButton tab="dashboard" icon={Icons.Home} label="Dashboard" />
          <NavButton tab="finished" icon={Icons.List} label="Finalizados" />
          <NavButton tab="backlog" icon={Icons.List} label="Backlog" />
          <NavButton tab="add" icon={Icons.Plus} label="Novo Jogo" />
          <NavButton tab="settings" icon={Icons.Settings} label="Config" />
        </nav>

        {/* Loader Global */}
        {loading && (
          <div className="h-1 w-full bg-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-pink-400 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
        )}

        {/* Conteúdo Principal */}
        <main className="p-4 sm:p-8">
          {error && <div className={`p-4 mb-6 ${theme.pink} ${theme.border} font-medium`}>{error}</div>}

          {/* VIEW: CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <div className={`max-w-lg mx-auto ${theme.cyan} p-6 ${theme.border} ${theme.card}`}>
              <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Conexão Google Sheets</h2>
              <p className="text-sm mb-6 leading-relaxed">
                Cole abaixo a URL do seu Web App gerado no Google Apps Script. 
                Os dados ficarão salvos apenas no seu dispositivo.
              </p>
              <input 
                type="url" 
                value={configUrl} 
                onChange={(e) => setConfigUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className={`${theme.input} mb-4`}
              />
              <button onClick={saveConfig} className={`${theme.btnBase} ${theme.gold} w-full`}>
                Salvar Configuração e Conectar
              </button>
            </div>
          )}

          {}
          {activeTab === 'dashboard' && configUrl && (
            <div className="flex flex-col gap-8">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.cyan}`}>
                  <div className="text-sm font-bold uppercase mb-1">Total de Jogos</div>
                  <div className="text-4xl font-black">{stats.total}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} bg-white`}>
                  <div className="text-sm font-bold uppercase mb-1">Finalizados / Backlog</div>
                  <div className="text-2xl font-black">{stats.finished} <span className="text-slate-400">/</span> {stats.backlog}</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.gold}`}>
                  <div className="text-sm font-bold uppercase mb-1">Tempo Jogado</div>
                  <div className="text-2xl font-black">{stats.totalTime}h</div>
                </div>
                <div className={`p-4 ${theme.border} ${theme.card} ${theme.pink}`}>
                  <div className="text-sm font-bold uppercase mb-1">Total Gasto</div>
                  <div className="text-2xl font-black">R$ {stats.totalSpent.toFixed(2)}</div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gráfico Plataformas */}
                <div className={`p-6 ${theme.border} ${theme.card} bg-white`}>
                  <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-slate-800 pb-2">Jogos por Plataforma</h3>
                  {stats.consoleChartData.length > 0 ? 
                    <SimpleBarChart data={stats.consoleChartData} maxVal={stats.maxConsoleCount} /> 
                    : <p className="text-slate-500 text-sm">Sem dados suficientes.</p>}
                </div>

                {/* Gráfico Status & Dificuldade */}
                <div className="flex flex-col gap-8">
                   <div className={`p-6 ${theme.border} ${theme.card} bg-white`}>
                    <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-slate-800 pb-2">Status da Biblioteca</h3>
                    <DonutChart data={[
                      { label: 'Finalizados', value: stats.finished, color: '#FCE38A' },
                      { label: 'Backlog', value: stats.backlog, color: '#AEE6E6' }
                    ]} />
                  </div>
                  <div className={`p-6 ${theme.border} ${theme.card} bg-white`}>
                    <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-slate-800 pb-2">Dificuldade (Finalizados)</h3>
                    <div className="flex gap-2 h-12 w-full border-2 border-slate-800 overflow-hidden">
                      {stats.diffChartData.map((d, i) => {
                        const width = stats.finished ? (d.value / stats.finished) * 100 : 0;
                        if(width === 0) return null;
                        return (
                          <div key={i} style={{ width: `${width}%`, backgroundColor: d.color }} className="h-full flex items-center justify-center border-r-2 border-slate-800 last:border-0 text-xs font-bold" title={`${d.label}: ${d.value}`}>
                            {width > 15 ? d.label : ''}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {(activeTab === 'finished' || activeTab === 'backlog') && (
            <div className="overflow-x-auto">
              <table className={`w-full text-left border-collapse ${theme.border} bg-white`}>
                <thead>
                  <tr className={`${activeTab === 'finished' ? theme.gold : theme.cyan} border-b-4 border-slate-800 uppercase text-xs sm:text-sm font-black`}>
                    <th className="p-3 border-r-2 border-slate-800">Título</th>
                    <th className="p-3 border-r-2 border-slate-800">Plataforma</th>
                    <th className="p-3 border-r-2 border-slate-800 hidden sm:table-cell">Nota</th>
                    <th className="p-3 border-r-2 border-slate-800 hidden md:table-cell">Tempo</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog')).map((game, i) => (
                    <tr key={game.id || i} className="border-b-2 border-slate-800 hover:bg-slate-50 transition-colors">
                      <td className="p-3 border-r-2 border-slate-800 font-bold">{game.titulo}</td>
                      <td className="p-3 border-r-2 border-slate-800">
                        <span className="inline-block px-2 py-1 text-xs font-bold border border-slate-800 rounded-sm" style={{backgroundColor: getConsoleColor(game.plataforma)}}>
                          {game.plataforma}
                        </span>
                      </td>
                      <td className="p-3 border-r-2 border-slate-800 hidden sm:table-cell font-mono">{game.nota || '-'}</td>
                      <td className="p-3 border-r-2 border-slate-800 hidden md:table-cell">{game.tempo ? `${game.tempo}h` : '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => editGame(game)} className={`p-1 border border-slate-800 bg-white hover:${theme.gold} transition-colors`} title="Editar"><Icons.Plus /></button>
                          <button onClick={() => deleteGame(game.id)} className={`p-1 border border-slate-800 bg-white hover:${theme.pink} transition-colors text-red-600`} title="Excluir"><Icons.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {games.filter(g => g.status === (activeTab === 'finished' ? 'Finalizado' : 'Backlog')).length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Nenhum jogo encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {}
          {activeTab === 'add' && (
            <form onSubmit={saveGame} className={`p-6 sm:p-8 bg-white ${theme.border} ${theme.card}`}>
              <div className="flex justify-between items-center mb-6 border-b-4 border-slate-800 pb-4">
                <h2 className="text-2xl font-black uppercase">{formData.id ? 'Editar Jogo' : 'Adicionar Jogo'}</h2>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input type="radio" name="status" value="Backlog" checked={formData.status === 'Backlog'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-4 h-4 accent-slate-800" />
                    Backlog
                  </label>
                  <label className="flex items-center gap-2 font-bold cursor-pointer">
                    <input type="radio" name="status" value="Finalizado" checked={formData.status === 'Finalizado'} onChange={e => setFormData({...formData, status: e.target.value})} className="w-4 h-4 accent-slate-800" />
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
                  <input value={formData.plataforma} onChange={e => setFormData({...formData, plataforma: e.target.value})} className={theme.input} placeholder="Ex: PS5, PC, Switch" />
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
                  <textarea rows="3" value={formData.comentarios} onChange={e => setFormData({...formData, comentarios: e.target.value})} className={theme.input}></textarea>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button type="submit" disabled={loading} className={`${theme.btnBase} ${theme.cyan} flex items-center gap-2 text-lg`}>
                  <Icons.Save /> {loading ? 'Salvando...' : 'Salvar Jogo'}
                </button>
              </div>
            </form>
          )}

        </main>
      </div>
    </div>
  );
}
