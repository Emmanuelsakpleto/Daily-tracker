import React from 'react';
import {
    LayoutDashboard, Calendar as CalendarIcon, Award, Settings,
    BookOpen, CheckSquare
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, setSelectedDate, today, profile }) => {
    return (
        <nav className="side-nav glass-card" style={{ padding: '1.5rem 1rem' }}>
            <div className="nav-header" style={{ marginBottom: '2rem' }}>
                <div className="logo-pulse"></div>
                <h2 className="gradient-text">Tracker {profile.year}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                <p style={{ fontWeight: 600 }}>{profile.name}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Dynamique & Persistant</p>
            </div>
        </nav>
    );
};

export default Sidebar;
