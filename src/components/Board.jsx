import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Palette, X, Trash2 } from 'lucide-react';
import Card from './Card';

const Board = ({ column, tasks, index, onCardClick, onUpdateColumn, onDeleteColumn }) => {
    const [isEditingCover, setIsEditingCover] = useState(false);
    const [coverColor, setCoverColor] = useState(column.coverColor || '#3b82f6');
    const [coverText, setCoverText] = useState(column.coverText || '');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(column.title);

    const handleSaveCover = () => {
        onUpdateColumn(column.id, { coverColor, coverText });
        setIsEditingCover(false);
    };

    const handleSaveTitle = () => {
        if (tempTitle.trim()) {
            onUpdateColumn(column.id, { title: tempTitle });
        } else {
            setTempTitle(column.title);
        }
        setIsEditingTitle(false);
    };

    const handleRemoveCover = () => {
        onUpdateColumn(column.id, { coverColor: null, coverText: '' });
        setCoverText('');
        setIsEditingCover(false);
    };

    return (
        <Draggable draggableId={column.id} index={index}>
            {(provided) => (
                <div
                    className="column"
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                >
                    {column.coverColor && (
                        <div style={{
                            backgroundColor: column.coverColor,
                            color: '#ffffff',
                            padding: '0.5rem 1rem',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            textAlign: 'center',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}>
                            {column.coverText}
                        </div>
                    )}
                    <div
                        className="column-header"
                        {...provided.dragHandleProps}
                        style={column.coverColor ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : {}}
                    >
                        <h3 className="column-title" style={{ flex: 1 }}>
                            <div
                                style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: column.color
                                }}
                            />
                            {isEditingTitle ? (
                                <input
                                    autoFocus
                                    className="form-input"
                                    style={{ fontSize: '0.875rem', padding: '2px 4px', height: 'auto', fontWeight: 600, textTransform: 'uppercase' }}
                                    value={tempTitle}
                                    onChange={(e) => setTempTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle();
                                        if (e.key === 'Escape') {
                                            setTempTitle(column.title);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                />
                            ) : (
                                <span onClick={() => setIsEditingTitle(true)} style={{ cursor: 'text' }}>
                                    {column.title}
                                </span>
                            )}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                className="btn-ghost"
                                style={{ padding: '0.25rem', display: 'flex', border: 'none', cursor: 'pointer' }}
                                onClick={() => setIsEditingCover(true)}
                                title="Editar Capa da Fila"
                            >
                                <Palette size={16} />
                            </button>
                            <button
                                className="btn-ghost"
                                style={{ padding: '0.25rem', display: 'flex', border: 'none', cursor: 'pointer' }}
                                onClick={() => onDeleteColumn(column.id)}
                                title="Excluir Fila"
                            >
                                <Trash2 size={16} color="var(--danger-color)" />
                            </button>
                            <span className="column-badge">{tasks.length}</span>
                        </div>
                    </div>

                    {isEditingCover && (
                        <div style={{
                            padding: '0.75rem',
                            backgroundColor: '#ffffff',
                            borderBottom: '1px solid var(--border-color)',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Configurar Capa</span>
                                <button className="btn-ghost" style={{ padding: '0.125rem', border: 'none', cursor: 'pointer', display: 'flex' }} onClick={() => setIsEditingCover(false)}>
                                    <X size={14} />
                                </button>
                            </div>
                            <input
                                type="color"
                                value={coverColor}
                                onChange={e => setCoverColor(e.target.value)}
                                style={{ width: '100%', height: '36px', border: 'none', cursor: 'pointer', padding: 0 }}
                                title="Cor da Capa"
                            />
                            <input
                                type="text"
                                value={coverText}
                                onChange={e => setCoverText(e.target.value)}
                                placeholder="Texto da capa..."
                                className="form-input"
                                style={{ fontSize: '0.75rem', padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', justifyContent: 'center' }} onClick={handleSaveCover}>
                                    Salvar
                                </button>
                                <button className="btn btn-danger" style={{ padding: '0.25rem', fontSize: '0.75rem', border: '1px solid currentColor' }} onClick={handleRemoveCover}>
                                    Remover
                                </button>
                            </div>
                        </div>
                    )}

                    <Droppable droppableId={column.id} type="task">
                        {(provided, snapshot) => (
                            <div
                                className={`task-list ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {tasks.map((task, index) => (
                                    <Card
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        onClick={() => onCardClick(task)}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            )}
        </Draggable>
    );
};

export default Board;
