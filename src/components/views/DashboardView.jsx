import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, CheckCircle2, AlertCircle, BookOpen, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const DashboardView = ({ containerVars, appData, today, neglectedHabits, financialStats, chartData }) => {
    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
            <div className="header-glass">
                <div><h2 className="section-title">Progression & Stats</h2><p className="section-subtitle">Visualisez vos efforts en temps réel.</p></div>
                <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}><TrendingUp size={18} /> Cycle {appData.profile.year}</div>
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
                        <ResponsiveContainer>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} /><stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} /></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', borderColor: 'var(--glass-border)', borderRadius: '12px' }} itemStyle={{ color: 'white' }} />
                                <Area type="monotone" dataKey="score" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3>Ce que je ne fais plus</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Habitudes effectuées 0-1 fois sur 7j.</p>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {neglectedHabits.length === 0 ? (
                            <div className="alert-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                <div style={{ color: 'var(--success)' }}><CheckCircle2 size={24} /></div>
                                <div><h4 style={{ color: 'var(--success)' }}>Excellente constance</h4><p style={{ fontSize: '0.9rem' }}>Maintenez ce rythme.</p></div>
                            </div>
                        ) : neglectedHabits.map((h, i) => (
                            <div key={i} className="alert-card" style={{ marginBottom: '1rem' }}>
                                <AlertCircle size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
                                <div><h4>{h.title}</h4><p style={{ fontSize: '0.85rem' }}>Reprenez-le en main aujourd'hui.</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardView;
