import React, { useState } from 'react';
import { Mail, LogIn, LayoutDashboard } from 'lucide-react';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const ALLOWED_USERS = {
        'danilo@s3m.com.br': { name: 'Danilo', avatar: 'DS' },
        'lucas@qcomm.com.br': { name: 'Lucas', avatar: 'LC' },
        'oswaldo@qcomm.com.br': { name: 'Oswaldo', avatar: 'OB' }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const user = ALLOWED_USERS[email.toLowerCase().trim()];

        if (user) {
            onLogin({ ...user, email: email.toLowerCase().trim() });
        } else {
            setError('Email não autorizado para acesso.');
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-logo">
                    <LayoutDashboard size={32} />
                </div>
                <h1 className="login-title">CRM Prospecto</h1>
                <p className="login-subtitle">Entre com seu e-mail para acessar o painel</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label className="form-label" style={{ marginLeft: '0.25rem' }}>E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="email"
                                className="form-input"
                                style={{ paddingLeft: '2.5rem' }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com.br"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            {error}
                        </p>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                        <LogIn size={20} /> Entrar no Sistema
                    </button>
                </form>

                <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    © 2024 QComm - Sistema de Prospecção Inteligente
                </div>
            </div>
        </div>
    );
}
