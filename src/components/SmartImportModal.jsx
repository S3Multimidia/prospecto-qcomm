import React, { useState, useEffect } from 'react';
import { X, Sparkles, Settings, FileText, AlertCircle } from 'lucide-react';

export default function SmartImportModal({ isOpen, onClose, onImport }) {
    const [apiKey, setApiKey] = useState('');
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('import'); // 'import' or 'settings'

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini-api-key');
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            // Default key provided by user
            setApiKey('AIzaSyCYtkDi5jlJkislCTCpvBigc3hF_k0nles');
        }
    }, [isOpen]);

    const handleSaveKey = () => {
        localStorage.setItem('gemini-api-key', apiKey);
        setActiveTab('import');
    };

    const handleProcess = async () => {
        if (!inputText.trim()) {
            setError('Por favor, cole um texto ou CSV para importar.');
            return;
        }
        if (!apiKey.trim()) {
            setError('A Chave da API não está configurada.');
            setActiveTab('settings');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const prompt = `Você é um assistente de CRM especialista em extrair dados de prospectos. Analise o texto a seguir (que pode ser CSV, texto livre ou tabela copiada) e extraia a lista de empresas e contatos. Retorne ESTRITAMENTE um Array em formato JSON puro (sem markdown, sem crases como \`\`\`json). \nCada objeto do array deve ter os campos: "company" (string), "contact" (string), "email" (string), "phone" (string), "social" (string), "notes" (string). Se um dado não existir, deixe a string vazia "".\n\nTexto de entrada:\n${inputText}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Erro ao consultar a API do Google Gemini.');
            }

            const data = await response.json();
            let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Clean up possible markdown tags
            aiText = aiText.replace(/```json/gi, '').replace(/```/g, '').trim();

            let parsedData;
            try {
                parsedData = JSON.parse(aiText);
                if (!Array.isArray(parsedData)) {
                    parsedData = [parsedData]; // Wrap in array if object
                }
            } catch (jsonError) {
                console.error('Raw AI response:', aiText);
                throw new Error('A IA não retornou um JSON válido. Tente formatar os dados de entrada com mais clareza.');
            }

            if (parsedData.length === 0) {
                throw new Error('Nenhuma empresa foi encontrada no texto enviado.');
            }

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

    return (
        <div className="modal-overlay" onMouseDown={onClose} style={{ zIndex: 1100 }}>
            <div className="modal-content" style={{ maxWidth: '600px' }} onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles className="text-primary" />
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dark)', margin: 0 }}>Importação Inteligente</h2>
                    </div>
                    <button className="modal-close" onClick={onClose} disabled={loading}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                    <button
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'import' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'import' ? '2px solid var(--primary-color)' : '2px solid transparent', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: activeTab === 'import' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                        onClick={() => setActiveTab('import')}
                    >
                        <FileText size={18} /> Importar Dados
                    </button>
                    <button
                        style={{ flex: 1, padding: '1rem', background: activeTab === 'settings' ? 'white' : 'transparent', border: 'none', borderBottom: activeTab === 'settings' ? '2px solid var(--primary-color)' : '2px solid transparent', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} /> Configurações de API
                    </button>
                </div>

                <div className="modal-body" style={{ display: 'block', padding: '1.5rem 2rem' }}>
                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <AlertCircle size={16} style={{ marginTop: '0.125rem', flexShrink: 0 }} />
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'import' ? (
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Cole um texto livre ou um arquivo CSV. A inteligência artificial vai extrair automaticamente o nome das empresas, contatos, telefones e e-mails, e criará os cards na sua primeira fila.
                            </p>
                            <textarea
                                className="form-input"
                                style={{ height: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem' }}
                                placeholder="Exemplo: \nEmpresa X, Contato: João, Tel: 1199999999, joao@empresax.com\nEmpresa Y, Falar com a Maria, maria@y.com"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={loading}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem' }}>
                                <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleProcess} disabled={loading}>
                                    {loading ? (
                                        <><div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Processando IA...</>
                                    ) : (
                                        <><Sparkles size={16} /> Processar com IA</>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Insira e gerencie sua chave da API do Google Gemini para habilitar a importação inteligente.
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
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button className="btn btn-primary" onClick={handleSaveKey}>Salvar Chave</button>
                            </div>
                        </div>
                    )}
                </div>
                {/* Add simple inline style for spinner animation if not present globally */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}} />
            </div>
        </div>
    );
}
