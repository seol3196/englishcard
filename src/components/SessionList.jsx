import React from 'react';

export default function SessionList({ sessions, onSelectSession, onNewSession }) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="session-list">
            <h2>📚 학습 기록</h2>

            {sessions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🎬</div>
                    <p>아직 학습한 영상이 없습니다.</p>
                    <p>YouTube URL을 입력하여 첫 플래시카드를 만들어보세요!</p>
                </div>
            ) : (
                <div className="session-grid">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className="session-card"
                            onClick={() => onSelectSession(session.id)}
                        >
                            <div className="session-date">{formatDate(session.created_at)}</div>
                            <div className="session-title">{session.title || '제목 없음'}</div>
                            <div className="session-summary">{session.summary}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
