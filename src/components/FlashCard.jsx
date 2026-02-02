import React, { useState, useEffect, useRef } from 'react';

export default function FlashCard({ front, back, mastered, disabled }) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [noTransition, setNoTransition] = useState(false);
    const prevFrontRef = useRef(front);

    const handleClick = () => {
        if (disabled) return; // 드래그 후 클릭 방지
        setIsFlipped(!isFlipped);
    };

    // Reset flip state when card content changes (without animation)
    useEffect(() => {
        if (prevFrontRef.current !== front) {
            setNoTransition(true);
            setIsFlipped(false);
            // Re-enable transition after reset
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setNoTransition(false);
                });
            });
            prevFrontRef.current = front;
        }
    }, [front]);

    return (
        <div className="flashcard-container">
            <div
                className={`flashcard ${isFlipped ? 'flipped' : ''} ${noTransition ? 'no-transition' : ''}`}
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
