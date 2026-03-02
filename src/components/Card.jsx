import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { AlignLeft, Paperclip, CheckSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Card = ({ task, index, onClick }) => {
    const completedTasks = task.checklist.filter(i => i.completed).length;
    const totalTasks = task.checklist.length;
    const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

    const enteredAtDate = task.history[task.history.length - 1]?.enteredAt;
    const timeInColumn = enteredAtDate
        ? formatDistanceToNow(new Date(enteredAtDate), { locale: ptBR, addSuffix: true })
        : '';

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
                    <div className="card-company">{task.company}</div>
                    <div className="card-contact">{task.contact}</div>

                    <div className="card-body">
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Na fila: {timeInColumn}
                        </span>

                        {task.customFields.length > 0 && (
                            <div className="card-badges">
                                {task.customFields.slice(0, 2).map(field => (
                                    <span key={field.id} className="badge">
                                        {field.value}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="card-badges" style={{ marginTop: '0.5rem', justifyContent: 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                            {totalTasks > 0 && (
                                <div title="Checklist" className="badge" style={{ backgroundColor: progress === 100 ? 'var(--success-color)' : '', color: progress === 100 ? 'white' : '' }}>
                                    <CheckSquare size={12} />
                                    {completedTasks}/{totalTasks}
                                </div>
                            )}
                            {task.attachments.length > 0 && (
                                <div title="Anexos" className="badge">
                                    <Paperclip size={12} />
                                    {task.attachments.length}
                                </div>
                            )}
                        </div>

                        {totalTasks > 0 && (
                            <div className="progress-container">
                                <div
                                    className="progress-bar"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default Card;
