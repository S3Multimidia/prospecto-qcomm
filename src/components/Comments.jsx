import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Comments({ comments = [], currentUser, onAddComment }) {
    const [newComment, setNewComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        onAddComment(newComment);
        setNewComment('');
    };

    return (
        <div className="comments-container">
            <div className="section-title">
                <MessageSquare size={18} /> Comentários e Atividade
            </div>

            <form onSubmit={handleSubmit} className="comment-input-area">
                <textarea
                    className="comment-textarea"
                    placeholder="Escrever um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="comment-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!newComment.trim()}
                        style={{ padding: '0.4rem 1rem' }}
                    >
                        <Send size={14} /> Salvar
                    </button>
                </div>
            </form>

            <div className="comment-list">
                {comments.slice().reverse().map((comment) => (
                    <div key={comment.id} className="comment-item">
                        <div className="avatar">
                            {comment.authorAvatar || '??'}
                        </div>
                        <div className="comment-content">
                            <div className="comment-header">
                                <span className="comment-author">{comment.authorName}</span>
                                <span className="comment-date">
                                    {format(new Date(comment.createdAt), "dd 'de' MMM 'de' yyyy, HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <div className="comment-bubble">
                                {comment.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
