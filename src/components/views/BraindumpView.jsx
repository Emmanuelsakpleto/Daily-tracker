import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Plus, Trash2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const BraindumpView = ({ containerVars, appData, saveBraindumpNote, deleteBraindumpNote }) => {
    const [noteText, setNoteText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        saveBraindumpNote(noteText.trim());
        setNoteText('');
    };

    const notes = appData.braindump || [];

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
            <div className="header-glass">
                <div>
                    <h2 className="section-title">Boîte à Idées (Braindump)</h2>
                    <p className="section-subtitle">Videz votre esprit. Toutes les pensées non datées vont ici.</p>
                </div>
            </div>

            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Lightbulb size={20} color="var(--accent-primary)" style={{ position: 'absolute', left: '15px', top: '15px' }} />
                        <input
                            type="text"
                            placeholder="J'ai cette idée brillante concernant..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            style={{ width: '100%', paddingLeft: '45px' }}
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={!noteText.trim()}>
                        <Plus size={18} /> Ajouter
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                        <Lightbulb size={48} style={{ opacity: 0.5, margin: '0 auto 1rem auto' }} />
                        <h3>Votre cerveau est vide pour le moment</h3>
                        <p>Déchargez ici tout ce qui vous passe par la tête pour le traiter plus tard.</p>
                    </div>
                ) : (
                    <div className="grid-cols-2">
                        {notes.map(note => (
                            <div key={note.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                                <p style={{ fontSize: '1.05rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', paddingRight: '2rem' }}>
                                    {note.text}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={12} /> {format(new Date(note.createdAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                    </span>
                                    <button
                                        onClick={() => deleteBraindumpNote(note.id)}
                                        className="btn-icon"
                                        style={{ width: '32px', height: '32px', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BraindumpView;
