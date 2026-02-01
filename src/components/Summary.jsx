import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function Summary({ title, summary }) {
    return (
        <div className="summary-section">
            <div className="summary-title">📝 {title || '학습할 표현'}</div>
            <div className="summary-content">
                <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
        </div>
    );
}
