import React from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCw, Download } from 'lucide-react';
import { DEFAULT_HABITS, DEFAULT_PROFILE } from '../../utils/constants';

const SettingsView = ({ containerVars, appData, setAppData }) => {
    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
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
    );
};

export default SettingsView;
