import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';

const LibraryView = ({ containerVars, appData, saveBook, deleteBook, updateBookProgress }) => {
    const [editingBookData, setEditingBookData] = useState(null);

    const handleSaveBook = (e) => {
        e.preventDefault();
        const b = {
            title: e.target.title.value,
            author: e.target.author.value,
            totalPages: parseInt(e.target.totalPages.value) || 0,
            readPages: parseInt(e.target.readPages.value) || 0
        };
        if (!b.title) return;

        if (editingBookData?.id) {
            saveBook({ ...b, id: editingBookData.id }, true);
        } else {
            saveBook(b, false);
        }
        setEditingBookData(null);
    };

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
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
    );
};

export default LibraryView;
