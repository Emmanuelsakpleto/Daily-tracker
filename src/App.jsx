import React, { useState, useEffect, useMemo } from 'react';
import {
  format, subDays, eachDayOfInterval, isSameDay, startOfToday,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth,
  addMonths, subMonths, isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Target, LayoutDashboard, Calendar as CalendarIcon, Award, Settings,
  CheckCircle2, Plus, Trash2, Zap, TrendingUp, AlertCircle, RefreshCw,
  Edit2, BookOpen, ChevronLeft, ChevronRight, FileText, CheckSquare, ListTodo, Coins, TrendingDown, DollarSign
} from 'lucide-react';

// --- Default Configuration (Seed Data) ---
const DEFAULT_HABITS = [
  { id: 'h1', title: "Musculation / Sport", category: "Corps" },
  { id: 'h2', title: "Manger léger (sans grignotage)", category: "Discipline" },
  { id: 'h3', title: "Lecture quotidienne", category: "Esprit" },
  { id: 'h4', title: "Pas de réseaux le matin", category: "Discipline" },
  { id: 'h5', title: "Anglais Intensif", category: "Compétences" }
];

const DEFAULT_PROFILE = { name: "SAKPLETO Emmanuel", year: 2026, priority: "Bourse Master à l'étranger" };

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) { return initialValue; }
  });

  const setValue = value => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (e) { console.error(e); }
  };
  return [storedValue, setValue];
}

const App = () => {
  const [activeTab, setActiveTab] = useState('journal');
  const [appData, setAppData] = useLocalStorage('tracker_data_v2', {
    profile: DEFAULT_PROFILE,
    habits: DEFAULT_HABITS,
    scholarships: [],
    books: [],
    records: {} // { 'YYYY-MM-DD': { habits: ['h1'], todos: [], notes: '' } }
  });

  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Helpers
  const currentRecord = appData.records[selectedDateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };

  const updateRecord = (updates) => {
    setAppData(prev => {
      const rec = prev.records[selectedDateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };
      return { ...prev, records: { ...prev.records, [selectedDateStr]: { ...rec, ...updates } } };
    });
  };

  // --- ACTIONS: JOURNAL ---
  const toggleHabit = (id) => {
    const newHabits = currentRecord.habits.includes(id) ? currentRecord.habits.filter(h => h !== id) : [...currentRecord.habits, id];
    updateRecord({ habits: newHabits });
  };

  const addTodo = (e) => {
    e.preventDefault();
    const text = e.target.todo.value.trim();
    if (!text) return;
    updateRecord({ todos: [...currentRecord.todos, { id: Date.now(), text, done: false }] });
    e.target.reset();
  };

  const toggleTodo = (id) => {
    updateRecord({ todos: currentRecord.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) });
  };

  const deleteTodo = (id) => updateRecord({ todos: currentRecord.todos.filter(t => t.id !== id) });

  const saveNote = (e) => updateRecord({ notes: e.target.value });

  const saveFinance = (type, value) => {
    const numValue = value === '' ? '' : Number(value);
    updateRecord({ finance: { ...(currentRecord.finance || { income: '', expense: '' }), [type]: numValue } });
  };

  // --- ACTIONS: BOOKS ---
  const [editingBookData, setEditingBookData] = useState(null);
  const handleSaveBook = (e) => {
    e.preventDefault();
    const b = {
      title: e.target.title.value, author: e.target.author.value,
      totalPages: parseInt(e.target.totalPages.value) || 0,
      readPages: parseInt(e.target.readPages.value) || 0
    };
    if (!b.title) return;

    setAppData(prev => {
      const newBooks = editingBookData
        ? prev.books.map(book => book.id === editingBookData.id ? { ...book, ...b } : book)
        : [...prev.books, { id: Date.now(), ...b }];
      return { ...prev, books: newBooks };
    });
    setEditingBookData(null);
  };
  const deleteBook = (id) => setAppData(p => ({ ...p, books: p.books.filter(b => b.id !== id) }));
  const updateBookProgress = (id, newPages) => {
    setAppData(p => ({
      ...p, books: p.books.map(b => b.id === id ? { ...b, readPages: Math.min(b.totalPages, Math.max(0, newPages)) } : b)
    }));
  };

  // --- ACTIONS: SCHOLARSHIPS ---
  const [editingScholarshipData, setEditingScholarshipData] = useState(null);
  const handleSaveScholarship = (e) => {
    e.preventDefault();
    const s = { name: e.target.name.value, status: e.target.status.value };
    if (!s.name) return;
    setAppData(prev => {
      const newScho = editingScholarshipData
        ? prev.scholarships.map(x => x.id === editingScholarshipData.id ? { ...x, ...s } : x)
        : [...prev.scholarships, { id: Date.now(), ...s }];
      return { ...prev, scholarships: newScho };
    });
    setEditingScholarshipData(null);
  };
  const deleteScholarship = (id) => setAppData(p => ({ ...p, scholarships: p.scholarships.filter(s => s.id !== id) }));

  // --- STATS / DATA PROCESSING ---
  const last7Days = eachDayOfInterval({ start: subDays(today, 6), end: today });

  const chartData = useMemo(() => {
    return last7Days.map(d => {
      const rec = appData.records[format(d, 'yyyy-MM-dd')];
      const nbH = rec ? Math.min(rec.habits.length, appData.habits.length) : 0;
      return { name: format(d, 'EEE', { locale: fr }), score: appData.habits.length > 0 ? Math.round((nbH / appData.habits.length) * 100) : 0 };
    });
  }, [appData.records, appData.habits, last7Days]);

  const neglectedHabits = useMemo(() => {
    const counts = {};
    appData.habits.forEach(h => counts[h.id] = 0);
    last7Days.forEach(d => {
      const rec = appData.records[format(d, 'yyyy-MM-dd')];
      if (rec) rec.habits.forEach(hId => { counts[hId] = counts[hId] ? counts[hId] + 1 : 1 });
    });
    return appData.habits.filter(h => counts[h.id] <= 1);
  }, [appData.records, appData.habits, last7Days]);

  const financialStats = useMemo(() => {
    let income = 0; let expense = 0;
    Object.values(appData.records).forEach(rec => {
      if (rec.finance) {
        if (rec.finance.income) income += Number(rec.finance.income);
        if (rec.finance.expense) expense += Number(rec.finance.expense);
      }
    });
    return { income, expense, net: income - expense };
  }, [appData.records]);

  // --- CALENDAR LOGIC (Full Month) ---
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const containerVars = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };

  return (
    <div className="app-container">
      {/* --- SIDEBAR --- */}
      <nav className="side-nav glass-card" style={{ padding: '1.5rem 1rem' }}>
        <div className="nav-header" style={{ marginBottom: '2rem' }}>
          <div className="logo-pulse"></div>
          <h2 className="gradient-text">Tracker {appData.profile.year}</h2>
        </div>
        <div className="flex flex-col gap-2">
          <button className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
            <CalendarIcon size={20} /> Mon Calendrier
          </button>
          <button className={`nav-item ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => { setActiveTab('journal'); setSelectedDate(today); }}>
            <CheckSquare size={20} /> Journal du Jour
          </button>
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Progression & Stats
          </button>
          <button className={`nav-item ${activeTab === 'books' ? 'active' : ''}`} onClick={() => setActiveTab('books')}>
            <BookOpen size={20} /> Bibliothèque
          </button>
          <button className={`nav-item ${activeTab === 'scholarships' ? 'active' : ''}`} onClick={() => setActiveTab('scholarships')}>
            <Award size={20} /> Projets & Candidatures
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Configuration
          </button>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontWeight: 600 }}>{appData.profile.name}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dynamique & Persistant</p>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        <AnimatePresence mode="wait">

          {/* 1. FULL CALENDAR */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass">
                <div>
                  <h2 className="section-title">Aperçu Mensuel</h2>
                  <p className="section-subtitle">Visualisez vos journées, naviguez et gérez votre mois.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="btn-icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></button>
                  <h3 style={{ textTransform: 'capitalize', minWidth: '150px', textAlign: 'center' }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                  </h3>
                  <button className="btn-icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></button>
                </div>
              </div>

              <div className="glass-card">
                <div className="calendar-grid-month">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="calendar-day-header">{d}</div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const dStr = format(day, 'yyyy-MM-dd');
                    const rec = appData.records[dStr];
                    const hasTodos = rec && rec.todos.length > 0;
                    const hasNotes = rec && rec.notes.length > 5;
                    const hasHabits = rec && rec.habits.length > 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => { setSelectedDate(day); setActiveTab('journal'); }}
                        className={`calendar-day-cell 
                          ${!isSameMonth(day, currentMonth) ? 'dimmed' : ''} 
                          ${isToday(day) ? 'today' : ''}
                          ${isSameDay(day, selectedDate) ? 'active' : ''}`
                        }
                      >
                        <span className="day-number">{format(day, 'd')}</span>

                        <div className="day-indicators">
                          {hasHabits && <div className="indicator-dot stat-bg-emerald" title="Habitudes complétées"></div>}
                          {hasTodos && <div className="indicator-dot stat-bg-amber" title="To-Dos présentes"></div>}
                          {hasNotes && <div className="indicator-dot stat-bg-indigo" title="Notes rédigées"></div>}
                          {rec && rec.finance && (rec.finance.income > 0 || rec.finance.expense > 0) && <div className="indicator-dot" style={{ background: '#3b82f6' }} title="Mouvements financiers"></div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="indicator-dot stat-bg-emerald"></div> Habitudes</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="indicator-dot stat-bg-amber"></div> Tâches/To-Do</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="indicator-dot stat-bg-indigo"></div> Notes</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="indicator-dot" style={{ background: '#3b82f6' }}></div> Finances</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. JOURNAL (Day Specific) */}
          {activeTab === 'journal' && (
            <motion.div key="journal" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass">
                <div>
                  <h2 className="section-title">Journal Rapide</h2>
                  <p className="section-subtitle">Gérez vos habitudes, tâches et notes quotidiennes.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button className="btn-icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}><ChevronLeft size={18} /></button>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ textTransform: 'capitalize' }}>{format(selectedDate, 'EEEE d MMM yyyy', { locale: fr })}</h3>
                    {isSameDay(selectedDate, today) && <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Aujourd'hui</span>}
                  </div>
                  <button className="btn-icon" onClick={() => setSelectedDate(subDays(selectedDate, -1))}><ChevronRight size={18} /></button>
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="glass-card flex flex-col gap-4">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Zap size={20} color="var(--accent-primary)" /> Mes Habitudes
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {appData.habits.map(habit => {
                      const isChecked = currentRecord.habits.includes(habit.id);
                      return (
                        <div key={habit.id} className={`checkbox-wrapper ${isChecked ? 'checked' : ''}`} onClick={() => toggleHabit(habit.id)}>
                          <div className="check-custom">{isChecked && <CheckCircle2 size={16} color="white" />}</div>
                          <div>
                            <p className="check-text">{habit.title}</p>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{habit.category}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
                    <FileText size={20} color="var(--accent-secondary)" /> Notes / Réflexions du Jour
                  </h3>
                  <textarea
                    className="daily-notes"
                    placeholder="Qu'est-ce qui a bien marché aujourd'hui ? Quelles sont vos pensées ?"
                    value={currentRecord.notes || ''}
                    onChange={saveNote}
                  ></textarea>
                </div>

                <div className="glass-card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ListTodo size={20} color="var(--warning)" /> Tâches Spécifiques ({selectedDateStr})
                  </h3>

                  <form onSubmit={addTodo} className="task-input-group">
                    <input type="text" name="todo" placeholder="Ajouter une tâche..." autoComplete="off" />
                    <button type="submit" className="btn-icon" style={{ background: 'var(--accent-primary)', color: 'white' }}><Plus size={20} /></button>
                  </form>

                  <div className="todo-list">
                    {currentRecord.todos.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Aucune tâche pour cette date.</p>
                    ) : (
                      currentRecord.todos.map(todo => (
                        <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
                          <div className="left" onClick={() => toggleTodo(todo.id)}>
                            <div className="check-circle">{todo.done && <CheckCircle2 size={12} color="white" />}</div>
                            <span className="text">{todo.text}</span>
                          </div>
                          <button className="btn-icon" onClick={() => deleteTodo(todo.id)} style={{ width: '30px', height: '30px' }}><Trash2 size={14} /></button>
                        </div>
                      ))
                    )}
                  </div>

                  <h3 style={{ marginTop: '2.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coins size={20} color="#3b82f6" /> Finances du Jour
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Revenus (Entrées)</label>
                        <input type="number" placeholder="0" value={currentRecord.finance?.income || ''} onChange={(e) => saveFinance('income', e.target.value)} style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.3)' }} />
                        <TrendingUp size={16} color="var(--success)" style={{ position: 'absolute', right: '15px', bottom: '15px' }} />
                      </div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Dépenses (Sorties)</label>
                        <input type="number" placeholder="0" value={currentRecord.finance?.expense || ''} onChange={(e) => saveFinance('expense', e.target.value)} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }} />
                        <TrendingDown size={16} color="var(--danger)" style={{ position: 'absolute', right: '15px', bottom: '15px' }} />
                      </div>
                    </div>
                    <div style={{ padding: '1rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Bilan Journalier</span>
                      <span style={{ fontWeight: 700, fontSize: '1.2rem', color: ((currentRecord.finance?.income || 0) - (currentRecord.finance?.expense || 0)) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {((currentRecord.finance?.income || 0) - (currentRecord.finance?.expense || 0))} MAD
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* 3. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass">
                <div><h2 className="section-title">Progression & Stats</h2><p className="section-subtitle">Visualisez vos efforts en temps réel.</p></div>
                <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}><TrendingUp size={18} /> Cycle 2026</div>
              </div>

              <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
                <div className="glass-card stat-card"><div className="stat-icon stat-bg-indigo"><Target size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Aujourd'hui</h4><p className="stat-value">{Math.round(((appData.records[format(today, 'yyyy-MM-dd')]?.habits.length || 0) / Math.max(appData.habits.length, 1)) * 100)}%</p></div></div>
                <div className="glass-card stat-card"><div className="stat-icon stat-bg-emerald"><CheckCircle2 size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Tâches Finies</h4><p className="stat-value">{appData.records[format(today, 'yyyy-MM-dd')]?.todos.filter(t => t.done).length || 0}</p></div></div>
                <div className="glass-card stat-card"><div className="stat-icon stat-bg-rose"><AlertCircle size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Négligées</h4><p className="stat-value">{neglectedHabits.length}</p></div></div>
                <div className="glass-card stat-card"><div className="stat-icon stat-bg-amber"><BookOpen size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Livres</h4><p className="stat-value">{appData.books.filter(b => b.readPages >= b.totalPages).length} / {appData.books.length}</p></div></div>
              </div>

              <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
                <div className="glass-card stat-card"><div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}><TrendingUp size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Revenus Globaux</h4><p className="stat-value">{financialStats.income} MAD</p></div></div>
                <div className="glass-card stat-card"><div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}><TrendingDown size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Dépenses Globales</h4><p className="stat-value">{financialStats.expense} MAD</p></div></div>
                <div className="glass-card stat-card" style={{ padding: '1rem', borderColor: financialStats.net >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}><div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><DollarSign size={24} /></div><div><h4 style={{ color: 'var(--text-secondary)' }}>Balance Nette</h4><p className="stat-value" style={{ color: financialStats.net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{financialStats.net} MAD</p></div></div>
              </div>

              <div className="grid-cols-3">
                <div className="glass-card" style={{ gridColumn: 'span 2' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Constance sur 7 Jours (%)</h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer><AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} /><stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} /><XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', borderRadius: '12px' }} itemStyle={{ color: 'white' }} /><Area type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" /></AreaChart></ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3>Ce que je ne fais plus</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Habitudes effectuées 0-1 fois sur 7j.</p>
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {neglectedHabits.length === 0 ? (<div className="alert-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}><div style={{ color: 'var(--success)' }}><CheckCircle2 size={24} /></div><div><h4 style={{ color: 'var(--success)' }}>Excellente constance</h4><p style={{ fontSize: '0.9rem' }}>Maintenez ce rythme.</p></div></div>) : neglectedHabits.map((h, i) => (<div key={i} className="alert-card" style={{ marginBottom: '1rem' }}><AlertCircle size={24} color="var(--danger)" style={{ flexShrink: 0 }} /><div><h4>{h.title}</h4><p style={{ fontSize: '0.85rem' }}>Reprenez-le en main aujourd'hui.</p></div></div>))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. BOOKS / LIBRARY */}
          {activeTab === 'books' && (
            <motion.div key="books" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass">
                <div>
                  <h2 className="section-title">Bibliothèque d'Apprentissage</h2>
                  <p className="section-subtitle">Suivez vos lectures et votre progression intellectuelle.</p>
                </div>
                {editingBookData == null && (
                  <button className="btn-primary" onClick={() => setEditingBookData({})}><Plus size={18} /> Ajouter un Livre</button>
                )}
              </div>

              {editingBookData !== null && (
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
                  <h3>{editingBookData.id ? 'Modifier un livre' : 'Nouveau Livre'}</h3>
                  <form onSubmit={handleSaveBook} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Titre</label><input name="title" required defaultValue={editingBookData.title} style={{ width: '100%' }} /></div>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Auteur</label><input name="author" required defaultValue={editingBookData.author} style={{ width: '100%' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Pages Lues</label><input name="readPages" type="number" min="0" required defaultValue={editingBookData.readPages || 0} style={{ width: '100%' }} /></div>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Pages Totales</label><input name="totalPages" type="number" min="1" required defaultValue={editingBookData.totalPages || 300} style={{ width: '100%' }} /></div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                      <button type="submit" className="btn-primary">Sauvegarder</button>
                      <button type="button" className="btn-icon" onClick={() => setEditingBookData(null)}>Annuler</button>
                    </div>
                  </form>
                </div>
              )}

              {appData.books.length > 0 ? (
                <div className="grid-cols-4">
                  {appData.books.map(b => (
                    <div key={b.id} className="glass-card book-card" style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setEditingBookData(b)}><Edit2 size={14} /></button>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => deleteBook(b.id)}><Trash2 size={14} /></button>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.2rem', paddingRight: '40px' }}>{b.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{b.author}</p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 'auto 0 0.5rem 0' }}>
                        <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => updateBookProgress(b.id, b.readPages - 10)}>-</button>
                        <span style={{ fontWeight: 600 }}>{b.readPages} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 400 }}>/ {b.totalPages} p.</span></span>
                        <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => updateBookProgress(b.id, b.readPages + 10)}>+</button>
                      </div>
                      <div className="book-progress-wrapper"><div className="book-progress-bar" style={{ width: `${Math.min(100, (b.readPages / Math.max(b.totalPages, 1)) * 100)}%` }}></div></div>
                      {b.readPages >= b.totalPages && <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Complété</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                  <BookOpen size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
                  <h3>Votre bibliothèque est vide</h3>
                  <p>Ajoutez des livres pour commencer à suivre votre progression.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 5. SCHOLARSHIPS / PROJETS */}
          {activeTab === 'scholarships' && (
            <motion.div key="scholarships" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass">
                <div><h2 className="section-title">Objectifs & Candidatures</h2><p className="section-subtitle">Gérez vos opportunités académiques et pro.</p></div>
                {editingScholarshipData == null && <button className="btn-primary" onClick={() => setEditingScholarshipData({})}><Plus size={18} /> Nouveau</button>}
              </div>

              {editingScholarshipData !== null && (
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent-primary)' }}>
                  <form onSubmit={handleSaveScholarship} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nom du projet / Bourse</label><input name="name" required defaultValue={editingScholarshipData.name} style={{ width: '100%' }} /></div>
                    <div style={{ width: '200px' }}><label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Statut</label><select name="status" defaultValue={editingScholarshipData.status || 'À faire'} style={{ width: '100%' }}><option value="À faire">À faire</option><option value="En préparation">En préparation</option><option value="En attente">En attente</option><option value="Accepté">Accepté</option><option value="Refusé">Refusé</option></select></div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}><button type="submit" className="btn-primary">Sauvegarder</button><button type="button" className="btn-icon" onClick={() => setEditingScholarshipData(null)}>x</button></div>
                  </form>
                </div>
              )}

              <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr><th style={{ padding: '1.2rem 1rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>Projet / Bourse</th><th style={{ padding: '1.2rem 1rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>Statut</th><th style={{ padding: '1.2rem 1rem', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {appData.scholarships.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '1.2rem 1rem', fontWeight: 500 }}>{s.name}</td>
                        <td style={{ padding: '1.2rem 1rem' }}><span className={`badge ${s.status.includes('Refusé') ? 'badge-danger' : s.status === 'En attente' ? 'badge-warning' : s.status === 'Accepté' ? 'badge-success' : 'badge-outline'}`}>{s.status}</span></td>
                        <td style={{ padding: '1.2rem 1rem' }}><div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => setEditingScholarshipData(s)}><Edit2 size={14} /></button><button className="btn-icon" style={{ width: '32px', height: '32px' }} onClick={() => deleteScholarship(s.id)}><Trash2 size={14} /></button></div></td>
                      </tr>
                    ))}
                    {appData.scholarships.length === 0 && <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune candidature enregistrée pour le moment.</td></tr>}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* 6. SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div key="settings" variants={containerVars} initial="hidden" animate="visible" exit="hidden">
              <div className="header-glass"><div><h2 className="section-title">Configuration Initiale</h2><p className="section-subtitle">Sécurité et paramètres</p></div></div>
              <div className="grid-cols-2">
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} /> Sauvegarde (JSON)</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>Vos données sont stockées dans le navigateur. Exportez-les pour faire une sauvegarde ou les transférer.</p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" onClick={() => {
                      const blob = new Blob([JSON.stringify(appData)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `tracker_${appData.profile.year}_sauvegarde.json`; a.click();
                    }}><Download size={18} /> Exporter Data</button>
                  </div>
                </div>

                <div className="glass-card">
                  <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><RefreshCw size={20} /> Réinitialisation Totale</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Idéal pour redémarrer une nouvelle année. Cette action efface toutes les données de l'application.</p>
                  <button className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                    onClick={() => {
                      if (window.confirm('Etes-vous sûr de vouloir effacer tout l\'historique ? Cette action est irréversible.')) {
                        setAppData({ profile: DEFAULT_PROFILE, habits: DEFAULT_HABITS, records: {}, scholarships: [], books: [] });
                        window.location.reload();
                      }
                    }}>
                    Effacer l'historique de l'application
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
