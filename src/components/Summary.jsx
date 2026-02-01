import React from 'react';

export default function Summary({ title, summary }) {
    return (
        <div className="summary-section">
            <div className="summary-title">📝 {title || '영상 요약'}</div>
            <div className="summary-text">{summary}</div>
        </div>
    );
}
