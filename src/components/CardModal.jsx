import React, { useState, useRef, useEffect } from 'react';
import {
    X, CheckSquare, ListPlus, FilePlus, Paperclip,
    Trash2, Image as ImageIcon, FileText, FileSpreadsheet, Plus, DownloadCloud, History, Copy
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Comments from './Comments';

export default function CardModal({ task, currentUser, onClose, onUpdate, onDuplicate, onAddComment, columns }) {
    const [localTask, setLocalTask] = useState(task);
    const [showFieldMenu, setShowFieldMenu] = useState(false);
    const fileInputRef = useRef(null);

    // Sync to parent when localTask changes
    useEffect(() => {
        onUpdate(localTask.id, localTask);
    }, [localTask]);

    const handleUpdate = (updates) => {
        setLocalTask(prev => ({ ...prev, ...updates }));
    };

    const handleAddChecklist = () => {
        handleUpdate({
            checklist: [
                ...localTask.checklist,
                { id: `chk-${uuidv4()}`, text: 'Nova Tarefa', completed: false }
            ]
        });
    };

    const handleToggleChecklist = (id) => {
        handleUpdate({
            checklist: localTask.checklist.map(chk =>
                chk.id === id ? { ...chk, completed: !chk.completed } : chk
            )
        });
    };

    const handleChecklistTextUpdate = (id, text) => {
        handleUpdate({
            checklist: localTask.checklist.map(chk =>
                chk.id === id ? { ...chk, text } : chk
            )
        });
    };

    const handleDeleteChecklist = (id) => {
        handleUpdate({
            checklist: localTask.checklist.filter(chk => chk.id !== id)
        });
    };

    const completedCount = localTask.checklist.filter(c => c.completed).length;
    const totalCount = localTask.checklist.length;
    const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

    const handleAddField = (type) => {
        handleUpdate({
            customFields: [
                ...localTask.customFields,
                { id: `cf-${uuidv4()}`, label: `Novo Campo (${type})`, type, value: '' }
            ]
        });
        setShowFieldMenu(false);
    };

    const handleFieldUpdate = (id, fieldUpdates) => {
        handleUpdate({
            customFields: localTask.customFields.map(f =>
                f.id === id ? { ...f, ...fieldUpdates } : f
            )
        });
    };

    const handleDeleteField = (id) => {
        handleUpdate({
            customFields: localTask.customFields.filter(f => f.id !== id)
        });
    };

    const getFileIcon = (file) => {
        if (file.type.includes('image')) return <ImageIcon size={24} color="var(--primary-color)" />;
        if (file.type.includes('spreadsheet') || file.type.includes('csv') || file.name.endsWith('.xlsx')) return <FileSpreadsheet size={24} color="var(--success-color)" />;
        return <FileText size={24} color="var(--danger-color)" />;
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);

        // Simulating file upload
        const newAttachments = files.map(file => {
            return {
                id: `att-${uuidv4()}`,
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                // In reality, this would be an uploaded URL
                url: file.type.includes('image') ? URL.createObjectURL(file) : null
            };
        });

        handleUpdate({
            attachments: [...localTask.attachments, ...newAttachments]
        });
    };

    const handleDeleteAttachment = (id) => {
        handleUpdate({
            attachments: localTask.attachments.filter(a => a.id !== id)
        });
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group" style={{ flex: 1, marginRight: '1rem' }}>
                        <input
                            value={localTask.company}
                            onChange={(e) => handleUpdate({ company: e.target.value })}
                            placeholder="Nome da Empresa"
                        />
                        <input
                            style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '0.25rem' }}
                            value={localTask.contact}
                            onChange={(e) => handleUpdate({ contact: e.target.value })}
                            placeholder="Nome do Contato"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => onDuplicate(localTask)}
                            title="Duplicar como modelo"
                            style={{ padding: '0.5rem 0.75rem' }}
                        >
                            <Copy size={18} />
                            Duplicar
                        </button>
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="modal-body">
                    {/* Main Column */}
                    <div className="modal-main">
                        {/* Checklist Section */}
                        <div className="section-title">
                            <CheckSquare size={18} /> Checklist
                        </div>

                        {totalCount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{Math.round(progress)}%</span>
                                <div className="progress-container" style={{ flex: 1, marginTop: 0, height: '8px' }}>
                                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            {localTask.checklist.map(item => (
                                <div key={item.id} className="checklist-item">
                                    <input
                                        type="checkbox"
                                        className="checklist-checkbox"
                                        checked={item.completed}
                                        onChange={() => handleToggleChecklist(item.id)}
                                    />
                                    <input
                                        type="text"
                                        className={`checklist-input ${item.completed ? 'completed' : ''}`}
                                        value={item.text}
                                        onChange={(e) => handleChecklistTextUpdate(item.id, e.target.value)}
                                    />
                                    <button className="btn btn-ghost" style={{ padding: '0.25rem' }} onClick={() => handleDeleteChecklist(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={handleAddChecklist}>
                                <ListPlus size={16} /> Adicionar Tarefa
                            </button>
                        </div>

                        <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

                        {/* Custom Fields Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div className="section-title" style={{ margin: 0 }}>
                                <FilePlus size={18} /> Campos Personalizados
                            </div>
                            <div style={{ position: 'relative' }}>
                                <button className="btn btn-secondary" onClick={() => setShowFieldMenu(!showFieldMenu)}>
                                    <Plus size={16} /> Adicionar Campo
                                </button>
                                {showFieldMenu && (
                                    <div className="new-field-menu">
                                        <div className="new-field-item" onClick={() => handleAddField('text')}>Texto</div>
                                        <div className="new-field-item" onClick={() => handleAddField('date')}>Data</div>
                                        <div className="new-field-item" onClick={() => handleAddField('currency')}>Moeda</div>
                                        <div className="new-field-item" onClick={() => handleAddField('select')}>Seleção</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {localTask.customFields.map(field => (
                                <div key={field.id} className="form-group" style={{ marginBottom: '0.5rem', position: 'relative', padding: '0.5rem', border: '1px solid transparent', borderRadius: '8px' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-color)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <input
                                            value={field.label}
                                            onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
                                            className="form-label"
                                            style={{ border: 'none', background: 'transparent', outline: 'none', padding: 0, margin: '0 0 0.5rem 0', fontWeight: 600 }}
                                        />
                                        <button className="btn btn-ghost" style={{ padding: '0.125rem' }} onClick={() => handleDeleteField(field.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {field.type === 'text' && (
                                        <input className="form-input" value={field.value} onChange={e => handleFieldUpdate(field.id, { value: e.target.value })} placeholder="Digite o texto..." />
                                    )}
                                    {field.type === 'date' && (
                                        <input type="date" className="form-input" value={field.value} onChange={e => handleFieldUpdate(field.id, { value: e.target.value })} />
                                    )}
                                    {field.type === 'currency' && (
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>R$</span>
                                            <input type="number" className="form-input" style={{ paddingLeft: '2.5rem' }} value={field.value} onChange={e => handleFieldUpdate(field.id, { value: e.target.value })} placeholder="0,00" />
                                        </div>
                                    )}
                                    {field.type === 'select' && (
                                        <select className="form-select" value={field.value} onChange={e => handleFieldUpdate(field.id, { value: e.target.value })}>
                                            <option value="">Selecione...</option>
                                            <option value="Enterprise">Enterprise</option>
                                            <option value="Mid-Market">Mid-Market</option>
                                            <option value="SMB">SMB</option>
                                            <option value="Agência">Agência</option>
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>

                        <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

                        {/* Attachments Section */}
                        <div className="section-title">
                            <Paperclip size={18} /> Arquivos e Anexos
                        </div>

                        <input
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />

                        <div
                            className="upload-zone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <DownloadCloud size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontWeight: 500, color: 'var(--text-dark)' }}>Clique para fazer upload ou arraste arquivos aqui</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Suporta JPG, PNG, PDF, XLSX, DOCX</p>
                        </div>

                        {localTask.attachments.length > 0 && (
                            <div className="attachment-list">
                                {localTask.attachments.map(file => (
                                    <div key={file.id} className="attachment-item">
                                        <div className="attachment-icon">
                                            {file.url ? (
                                                <img src={file.url} alt="preview" className="attachment-img-preview" />
                                            ) : (
                                                getFileIcon(file)
                                            )}
                                        </div>
                                        <div className="attachment-info">
                                            <div className="attachment-name" title={file.name}>{file.name}</div>
                                            <div className="attachment-size">{file.size}</div>
                                        </div>
                                        <button className="btn btn-ghost" onClick={() => handleDeleteAttachment(file.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

                        <Comments
                            comments={localTask.comments}
                            currentUser={currentUser}
                            onAddComment={(text) => onAddComment(localTask.id, text)}
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="modal-sidebar" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                        <div className="section-title">
                            <History size={18} /> Histórico de Eventos
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', marginTop: '1rem' }}>
                            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5px', width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }}></div>
                            {localTask.history.slice().reverse().map((record, index) => {
                                const isFirst = index === localTask.history.length - 1;
                                const colData = columns ? columns[record.columnId] : null;
                                const recordDate = new Date(record.enteredAt);
                                return (
                                    <div key={index} className="log-entry" style={{ position: 'relative', zIndex: 1, paddingLeft: '1.5rem', margin: 0 }}>
                                        <div style={{ position: 'absolute', left: 0, top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colData?.color || 'var(--primary-color)', border: '2px solid white' }}></div>
                                        <div>
                                            <div style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                                                {isFirst ? 'Prospecto Criado' : 'Movido para fila'}
                                            </div>
                                            <div style={{ color: 'var(--text-primary)' }}>{colData?.title || record.columnId}</div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                                {format(recordDate, 'dd/MM/yyyy HH:mm')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
