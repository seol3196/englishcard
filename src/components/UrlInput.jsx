import React, { useState } from 'react';

export default function UrlInput({ onSubmit, isLoading }) {
    const [url, setUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim() && !isLoading) {
            onSubmit(url.trim());
        }
    };

    return (
        <div className="url-input-section">
            <form onSubmit={handleSubmit} className="input-container">
                <input
                    type="text"
                    className="url-input"
                    placeholder="YouTube URL을 입력하세요 (예: https://youtube.com/watch?v=...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="generate-btn"
                    disabled={!url.trim() || isLoading}
                >
                    {isLoading ? '생성 중...' : '카드 생성'}
                </button>
            </form>
        </div>
    );
}
