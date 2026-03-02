import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, CheckSquare, Paperclip, Clock, Mail, Phone, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Detect field type and return appropriate icon + style
const getPillIcon = (label = '') => {
    const l = label.toLowerCase();
    if (l.includes('email') || l.includes('e-mail')) return <Mail size={10} />;
    if (l.includes('tel') || l.includes('phone') || l.includes('fone')) return <Phone size={10} />;
    if (l.includes('linkedin') || l.includes('rede') || l.includes('social')) return <Globe size={10} />;
    return null;
};

const Card = ({ task, index, onClick }) => {
    const completedTasks = task.checklist?.filter(i => i.completed).length ?? 0;
    const totalTasks = task.checklist?.length ?? 0;
    const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    const enteredAtDate = task.history?.[task.history.length - 1]?.enteredAt;
    const timeInColumn = enteredAtDate
        ? formatDistanceToNow(new Date(enteredAtDate), { locale: ptBR, addSuffix: true })
        : '';

    const visibleFields = (task.customFields || []).filter(f => f.value).slice(0, 3);
    const hasFooter = totalTasks > 0 || (task.attachments?.length > 0) || timeInColumn;

    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={onClick}
                >
                    {/* Company name — primary */}
                    <div className="card-company">{task.company}</div>

                    {/* Contact — secondary */}
                    {task.contact && (
                        <div className="card-contact">
                            <User size={11} strokeWidth={2.5} />
                            {task.contact}
                        </div>
                    )}

                    {/* Custom Field Pills */}
                    {visibleFields.length > 0 && (
                        <div className="card-badges" style={{ marginBottom: '0.625rem' }}>
                            {visibleFields.map(field => (
                                <span key={field.id} className="badge" title={`${field.label}: ${field.value}`}>
                                    {getPillIcon(field.label)}
                                    {field.value}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Progress bar */}
                    {totalTasks > 0 && (
                        <div className="progress-container" style={{ marginBottom: '0.5rem' }}>
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    )}

                    {/* Footer chips */}
                    {hasFooter && (
                        <div className="card-footer">
                            {timeInColumn && (
                                <span className="card-meta-chip">
                                    <Clock size={10} />
                                    {timeInColumn}
                                </span>
                            )}
                            {totalTasks > 0 && (
                                <span className={`card-meta-chip ${progress === 100 ? 'success' : ''}`}>
                                    <CheckSquare size={10} />
                                    {completedTasks}/{totalTasks}
                                </span>
                            )}
                            {task.attachments?.length > 0 && (
                                <span className="card-meta-chip">
                                    <Paperclip size={10} />
                                    {task.attachments.length}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default Card;
