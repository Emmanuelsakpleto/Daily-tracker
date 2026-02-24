import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const ScholarshipsView = ({ containerVars, appData, saveScholarship, deleteScholarship }) => {
    const [editingScholarshipData, setEditingScholarshipData] = useState(null);

    const handleSaveScholarship = (e) => {
        e.preventDefault();
        const s = { name: e.target.name.value, status: e.target.status.value };
        if (!s.name) return;

        if (editingScholarshipData?.id) {
            saveScholarship({ ...s, id: editingScholarshipData.id }, true);
        } else {
            saveScholarship(s, false);
        }
        setEditingScholarshipData(null);
    };

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
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
    );
};

export default ScholarshipsView;
