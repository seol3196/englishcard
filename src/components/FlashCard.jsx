import React, { useState } from 'react';

export default function FlashCard({ front, back, mastered }) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleClick = () => {
        setIsFlipped(!isFlipped);
    };

    // Reset flip state when card content changes
    React.useEffect(() => {
        setIsFlipped(false);
    }, [front, back]);

    return (
        <div className="flashcard-container">
            <div
                className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                onClick={handleClick}
            >
                <div className="flashcard-face flashcard-front">
                    {mastered && <span className="flashcard-mastered-badge">✅ 암기완료</span>}
                    <div className="flashcard-label">한글 (클릭하여 뒤집기)</div>
                    <div className="flashcard-content">{front}</div>
                    <div className="flashcard-hint">👆 카드를 클릭하세요</div>
                </div>
                <div className="flashcard-face flashcard-back">
                    {mastered && <span className="flashcard-mastered-badge">✅ 암기완료</span>}
                    <div className="flashcard-label">English</div>
                    <div className="flashcard-content">{back}</div>
                    <div className="flashcard-hint">👆 다시 클릭하여 뒤집기</div>
                </div>
            </div>
        </div>
    );
}
