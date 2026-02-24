import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Info } from 'lucide-react';
import { format } from 'date-fns';

const DeepWorkView = ({ containerVars, saveDeepWork, today }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('focus'); // focus | break

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            clearInterval(interval);
            if (mode === 'focus') {
                saveDeepWork(format(today, 'yyyy-MM-dd'), 25);
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => console.log('Audio pas pu être joué'));
                setMode('break');
                setTimeLeft(5 * 60);
            } else {
                setMode('focus');
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, saveDeepWork, today]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    };

    const skipBreak = () => {
        setIsActive(false);
        setMode('focus');
        setTimeLeft(25 * 60);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <motion.div variants={containerVars} initial="hidden" animate="visible" exit="hidden">
            <div className="header-glass">
                <div>
                    <h2 className="section-title">Deep Work Hub</h2>
                    <p className="section-subtitle">Concentration absolue (Pomodoro).</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0' }}>
                <div className="glass-card" style={{ width: '400px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

                    {/* Animated Background Gradient depending on mode */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, opacity: 0.1,
                        background: mode === 'focus' ? 'var(--accent-primary)' : 'var(--success)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
                        <h3 style={{ textTransform: 'uppercase', letterSpacing: '2px', color: mode === 'focus' ? 'var(--accent-primary)' : 'var(--success)', marginBottom: '1rem' }}>
                            {mode === 'focus' ? '🔥 Focus (25 min)' : '☕ Pause (5 min)'}
                        </h3>

                        <div style={{ fontSize: '5rem', fontWeight: 800, fontFamily: 'monospace', margin: '2rem 0', color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button onClick={toggleTimer} className="btn-icon" style={{ width: '60px', height: '60px', background: 'var(--bg-tertiary)', color: 'white' }}>
                                {isActive ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
                            </button>
                            <button onClick={resetTimer} className="btn-icon" style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                <Square size={24} />
                            </button>
                        </div>

                        {mode === 'break' && (
                            <button onClick={skipBreak} className="btn-primary" style={{ marginTop: '2rem', width: '100%', border: '1px solid var(--glass-border)', background: 'transparent' }}>
                                Passer la pause
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="alert-card" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Info size={24} color="#3b82f6" />
                <div>
                    <h4 style={{ color: '#3b82f6' }}>Comment ça marche ?</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fais 25 minutes de concentration absolue. Une fois le temps écoulé, ces minutes sont ajoutées à ton score de Deep Work visible dans tes Statistiques.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default DeepWorkView;
