import React from 'react';
import { motion } from 'framer-motion';
import { format, subDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Zap, CheckCircle2, FileText, ListTodo, Plus, Trash2, Coins, TrendingUp, TrendingDown } from 'lucide-react';

const JournalView = ({ containerVars, appData, selectedDate, setSelectedDate, today, toggleHabit, saveNote, addTodo, toggleTodo, deleteTodo, saveFinance }) => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentRecord = appData.records[selectedDateStr] || { habits: [], todos: [], notes: '', finance: { income: '', expense: '' } };

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
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
                                <div key={habit.id} className={`checkbox-wrapper ${isChecked ? 'checked' : ''}`} onClick={() => toggleHabit(selectedDateStr, habit.id)}>
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
                        onChange={(e) => saveNote(selectedDateStr, e.target.value)}
                    ></textarea>
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ListTodo size={20} color="var(--warning)" /> Tâches Spécifiques ({selectedDateStr})
                    </h3>

                    <form onSubmit={(e) => { e.preventDefault(); addTodo(selectedDateStr, e.target.todo.value); e.target.reset(); }} className="task-input-group">
                        <input type="text" name="todo" placeholder="Ajouter une tâche..." autoComplete="off" />
                        <button type="submit" className="btn-icon" style={{ background: 'var(--accent-primary)', color: 'white' }}><Plus size={20} /></button>
                    </form>

                    <div className="todo-list">
                        {currentRecord.todos.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>Aucune tâche pour cette date.</p>
                        ) : (
                            currentRecord.todos.map(todo => (
                                <div key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
                                    <div className="left" onClick={() => toggleTodo(selectedDateStr, todo.id)}>
                                        <div className="check-circle">{todo.done && <CheckCircle2 size={12} color="white" />}</div>
                                        <span className="text">{todo.text}</span>
                                    </div>
                                    <button className="btn-icon" onClick={() => deleteTodo(selectedDateStr, todo.id)} style={{ width: '30px', height: '30px' }}><Trash2 size={14} /></button>
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
                                <input type="number" placeholder="0" value={currentRecord.finance?.income || ''} onChange={(e) => saveFinance(selectedDateStr, 'income', e.target.value)} style={{ width: '100%', borderColor: 'rgba(16, 185, 129, 0.3)' }} />
                                <TrendingUp size={16} color="var(--success)" style={{ position: 'absolute', right: '15px', bottom: '15px' }} />
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Dépenses (Sorties)</label>
                                <input type="number" placeholder="0" value={currentRecord.finance?.expense || ''} onChange={(e) => saveFinance(selectedDateStr, 'expense', e.target.value)} style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.3)' }} />
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
    );
};

export default JournalView;
