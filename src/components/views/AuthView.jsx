import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const AuthView = ({ session, setSession }) => {
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, [setSession]);

    if (session) {
        return null; // Will be handled by App.jsx to render main app
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1.5rem' }}>
            <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="logo-pulse" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }}></div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Daily Tracker</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Connectez-vous pour synchroniser votre vie.</p>
                </div>

                <Auth
                    supabaseClient={supabase}
                    appearance={{
                        theme: ThemeSupa,
                        variables: {
                            default: {
                                colors: {
                                    brand: '#6366f1',
                                    brandAccent: '#a855f7',
                                    messageText: '#ffffff',
                                    messageTextDanger: '#ef4444',
                                }
                            }
                        },
                        className: {
                            container: 'auth-container',
                            button: 'btn-primary',
                            input: 'auth-input',
                            label: 'auth-label'
                        }
                    }}
                    providers={['google']}
                    theme="dark"
                    localization={{
                        variables: {
                            sign_in: {
                                email_label: 'Adresse Email',
                                password_label: 'Mot de passe',
                                email_input_placeholder: 'Votre email',
                                password_input_placeholder: 'Votre mot de passe',
                                button_label: 'Se connecter',
                                loading_button_label: 'Connexion en cours...',
                                link_text: "Déjà un compte ? Connectez-vous"
                            },
                            sign_up: {
                                email_label: 'Adresse Email',
                                password_label: 'Créer un mot de passe',
                                email_input_placeholder: 'Votre email',
                                password_input_placeholder: 'Votre mot de passe',
                                button_label: "S'inscrire",
                                loading_button_label: 'Inscription en cours...',
                                link_text: "Pas encore de compte ? S'inscrire"
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default AuthView;
