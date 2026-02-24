import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, addMonths, subMonths, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ containerVars, appData, selectedDate, setSelectedDate, setActiveTab, today }) => {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
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
    );
};

export default CalendarView;
