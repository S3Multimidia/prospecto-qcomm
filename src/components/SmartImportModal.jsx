import React, { useState, useEffect } from 'react';
import { X, Sparkles, Settings, FileText, AlertCircle, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'settings/global';

export default function SmartImportModal({ isOpen, onClose, onImport }) {
    const [apiKey, setApiKey] = useState('');
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('import');

    // Load API key from Firestore (global, shared between all users)
    useEffect(() => {
        if (!isOpen) return;
        getDoc(doc(db, ...SETTINGS_DOC.split('/'))).then(snap => {
            if (snap.exists() && snap.data().geminiApiKey) {
                setApiKey(snap.data().geminiApiKey);
            }
        });
    }, [isOpen]);

    const handleSaveKey = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await setDoc(doc(db, ...SETTINGS_DOC.split('/')), { geminiApiKey: apiKey }, { merge: true });
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                setActiveTab('import');
            }, 1200);
        } catch (err) {
            setError('Erro ao salvar a chave no Firestore: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleProcess = async () => {
        if (!inputText.trim()) {
            setError('Por favor, cole um texto ou CSV para importar.');
            return;
        }
        if (!apiKey.trim()) {
            setError('A Chave da API não está configurada. Configure na aba "Configurações de API".');
            setActiveTab('settings');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const prompt = `Você é um assistente de CRM especialista em extrair dados de prospectos. Analise o texto a seguir (que pode ser CSV, texto livre ou tabela copiada) e extraia a lista de empresas e contatos. Retorne ESTRITAMENTE um Array em formato JSON puro (sem markdown, sem crases como \`\`\`json). \nCada objeto do array deve ter os campos: "company" (string), "contact" (string), "email" (string), "phone" (string), "social" (string), "notes" (string). Se um dado não existir, deixe a string vazia "".\n\nTexto de entrada:\n${inputText}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Erro ao consultar a API do Google Gemini.');
            }

            const data = await response.json();
            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();

            let parsedData;
            try {
                parsedData = JSON.parse(aiText);
                if (!Array.isArray(parsedData)) parsedData = [parsedData];
            } catch {
                throw new Error('A IA não retornou um JSON válido. Tente formatar os dados de entrada com mais clareza.');
            }

            if (parsedData.length === 0) throw new Error('Nenhuma empresa foi encontrada no texto enviado.');

            onImport(parsedData);
            setInputText('');
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro desconhecido durante o processamento.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabStyle = (tab) => ({
        flex: 1, padding: '0.875rem', background: activeTab === tab ? 'white' : 'transparent',
        border: 'none', borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent',
        fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
        transition: 'all 0.15s ease', fontFamily: 'var(--font-family)'
    });

    return (
        <div className="modal-overlay" onMouseDown={onClose} style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '580px' }} onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} color="var(--primary-color)" />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.01em' }}>Importação Inteligente</h2>
                    </div>
                    <button className="modal-close" onClick={onClose} disabled={loading}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                    <button style={tabStyle('import')} onClick={() => setActiveTab('import')}>
                        <FileText size={15} /> Importar Dados
                    </button>
                    <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>
                        <Settings size={15} /> API Global
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {error && (
                        <div style={{ background: 'var(--danger-subtle)', color: 'var(--danger-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem' }}>
                            <AlertCircle size={15} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'import' ? (
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Cole um texto livre ou dados copiados. A IA extrai empresas, contatos, telefones, e-mails e redes sociais — criando os cards automaticamente na primeira fila.
                            </p>
                            <textarea
                                className="form-input"
                                style={{ height: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.6 }}
                                placeholder={"Exemplo:\nGerdau, Pedro Torres (Diretor), inform@gerdau.com, LinkedIn: linkedin.com/..."}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={loading}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', gap: '0.75rem' }}>
                                <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleProcess} disabled={loading} style={{ minWidth: '140px' }}>
                                    {loading ? (
                                        <><div style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div> Processando...</>
                                    ) : (
                                        <><Sparkles size={15} /> Processar com IA</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
                                A chave é salva no Firestore e <strong>compartilhada entre todos os usuários</strong>. Apenas uma configuração necessária para toda a equipe.
                            </p>
                            <div className="form-group">
                                <label className="form-label">Google Gemini API Key</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="AIzaSy..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    Obtenha sua chave gratuita em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>aistudio.google.com/apikey</a>
                                </p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveKey}
                                    disabled={saving || !apiKey.trim()}
                                    style={{ minWidth: '130px', background: saved ? 'var(--success-color)' : '' }}
                                >
                                    {saved ? <><Check size={15} /> Salvo!</> : saving ? 'Salvando...' : 'Salvar para Todos'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
            </div>
        </div>
    );
}
