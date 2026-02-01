import React from 'react';

export default function CardNavigation({ current, total, onPrev, onNext }) {
    return (
        <div className="card-navigation">
            <button
                className="nav-arrow"
                onClick={onPrev}
                disabled={current <= 1}
                aria-label="이전 카드"
            >
                ←
            </button>

            <div className="card-counter">
                <span>{current}</span> / {total}
            </div>

            <button
                className="nav-arrow"
                onClick={onNext}
                disabled={current >= total}
                aria-label="다음 카드"
            >
                →
            </button>
        </div>
    );
}
