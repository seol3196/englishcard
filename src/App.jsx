import React, { useState, useEffect } from 'react';
import SessionList from './components/SessionList';
import UrlInput from './components/UrlInput';
import Summary from './components/Summary';
import FlashCard from './components/FlashCard';
import CardNavigation from './components/CardNavigation';

export default function App() {
    const [view, setView] = useState('home'); // 'home', 'loading', 'cards', 'mode-select'
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('cards'); // 'summary', 'cards'
    const [studyMode, setStudyMode] = useState('all'); // 'all', 'unknown'

    // 필터링된 카드 목록
    const filteredCards = studyMode === 'unknown'
        ? cards.filter(card => !card.mastered)
        : cards;

    // 세션 목록 로드
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await fetch('/api/sessions');
            const data = await response.json();
            setSessions(data);
        } catch (err) {
            console.error('세션 목록 로드 실패:', err);
        }
    };

    // 새 카드 생성
    const handleGenerate = async (url) => {
        setIsLoading(true);
        setError('');
        setView('loading');
        setLoadingStep('YouTube 자막을 추출하고 있습니다...');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '카드 생성에 실패했습니다.');
            }

            setCurrentSession({
                id: data.sessionId,
                title: data.title,
                summary: data.summary
            });
            setCards(data.cards.map(card => ({ ...card, mastered: false })));
            setCurrentCardIndex(0);
            setActiveTab('cards');
            setView('mode-select');

            // 세션 목록 새로고침
            fetchSessions();
        } catch (err) {
            setError(err.message);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    // 기존 세션 선택
    const handleSelectSession = async (sessionId) => {
        setIsLoading(true);
        setError('');
        setView('loading');
        setLoadingStep('카드를 불러오고 있습니다...');

        try {
            const response = await fetch(`/api/sessions/${sessionId}/cards`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '카드 로드에 실패했습니다.');
            }

            setCurrentSession(data.session);
            setCards(data.cards.map(card => ({ ...card, mastered: !!card.mastered })));
            setCurrentCardIndex(0);
            setActiveTab('cards');
            setView('mode-select');
        } catch (err) {
            setError(err.message);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    // 학습 모드 선택
    const handleSelectStudyMode = (mode) => {
        setStudyMode(mode);
        setCurrentCardIndex(0);
        setView('cards');
    };

    // 홈으로 돌아가기
    const handleGoHome = () => {
        setView('home');
        setCurrentSession(null);
        setCards([]);
        setCurrentCardIndex(0);
        setError('');
        setStudyMode('all');
    };

    // 카드 암기 상태 업데이트
    const updateCardMastered = async (cardId, mastered) => {
        try {
            await fetch(`/api/cards/${cardId}/mastered`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mastered })
            });

            // 로컬 상태 업데이트
            setCards(prevCards =>
                prevCards.map(card =>
                    card.id === cardId ? { ...card, mastered } : card
                )
            );
        } catch (err) {
            console.error('카드 상태 업데이트 실패:', err);
        }
    };

    // 카드 초기화
    const handleResetCards = async () => {
        if (!currentSession) return;

        try {
            await fetch(`/api/sessions/${currentSession.id}/reset-cards`, {
                method: 'POST'
            });

            // 로컬 상태 업데이트
            setCards(prevCards =>
                prevCards.map(card => ({ ...card, mastered: false }))
            );
            setCurrentCardIndex(0);
        } catch (err) {
            console.error('카드 초기화 실패:', err);
        }
    };

    // 카드 네비게이션
    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    const handleNextCard = () => {
        if (currentCardIndex < filteredCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        }
    };

    // 스와이프 핸들러 - 왼쪽: 암기완료, 오른쪽: 공부필요
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setSwipeDirection(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        const currentX = e.targetTouches[0].clientX;
        setTouchEnd(currentX);

        // 스와이프 방향 미리보기
        if (touchStart) {
            const diff = touchStart - currentX;
            if (diff > 30) {
                setSwipeDirection('left');
            } else if (diff < -30) {
                setSwipeDirection('right');
            } else {
                setSwipeDirection(null);
            }
        }
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (filteredCards.length > 0) {
            const currentCard = filteredCards[currentCardIndex];

            if (isLeftSwipe) {
                // 왼쪽 스와이프 = 암기 완료
                updateCardMastered(currentCard.id, true);
                if (currentCardIndex < filteredCards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1);
                }
            } else if (isRightSwipe) {
                // 오른쪽 스와이프 = 공부 필요
                updateCardMastered(currentCard.id, false);
                if (currentCardIndex < filteredCards.length - 1) {
                    setCurrentCardIndex(currentCardIndex + 1);
                }
            }
        }

        setSwipeDirection(null);
    };

    // 마우스 드래그 핸들러 (데스크탑용) - window 레벨에서 추적
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [dragOffset, setDragOffset] = useState(0);

    const onMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart(e.clientX);
        setDragOffset(0);
        setSwipeDirection(null);
    };

    // window 레벨 마우스 이벤트 (카드 밖에서도 드래그 계속)
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e) => {
            if (!dragStart) return;

            const diff = dragStart - e.clientX;
            setDragOffset(-diff); // 카드가 마우스를 따라오도록

            if (diff > 30) {
                setSwipeDirection('left');
            } else if (diff < -30) {
                setSwipeDirection('right');
            } else {
                setSwipeDirection(null);
            }
        };

        const handleMouseUp = (e) => {
            if (!dragStart) {
                setIsDragging(false);
                return;
            }

            const distance = dragStart - e.clientX;
            const isLeftDrag = distance > minSwipeDistance;
            const isRightDrag = distance < -minSwipeDistance;

            if (filteredCards.length > 0) {
                const currentCard = filteredCards[currentCardIndex];

                if (isLeftDrag) {
                    updateCardMastered(currentCard.id, true);
                    if (currentCardIndex < filteredCards.length - 1) {
                        setCurrentCardIndex(currentCardIndex + 1);
                    } else {
                        showCompleteAndRedirect();
                    }
                } else if (isRightDrag) {
                    updateCardMastered(currentCard.id, false);
                    if (currentCardIndex < filteredCards.length - 1) {
                        setCurrentCardIndex(currentCardIndex + 1);
                    } else {
                        showCompleteAndRedirect();
                    }
                }
            }

            setIsDragging(false);
            setDragStart(null);
            setDragOffset(0);
            setSwipeDirection(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, filteredCards, currentCardIndex]);

    // 암기 완료 처리
    const handleMarkMastered = () => {
        if (filteredCards.length > 0 && view === 'cards' && activeTab === 'cards') {
            const currentCard = filteredCards[currentCardIndex];
            updateCardMastered(currentCard.id, true);
            if (currentCardIndex < filteredCards.length - 1) {
                setCurrentCardIndex(currentCardIndex + 1);
            } else {
                // 마지막 카드 - 완료 메시지 후 모드 선택으로
                showCompleteAndRedirect();
            }
        }
    };

    // 공부 필요 처리
    const handleMarkNeedsStudy = () => {
        if (filteredCards.length > 0 && view === 'cards' && activeTab === 'cards') {
            const currentCard = filteredCards[currentCardIndex];
            updateCardMastered(currentCard.id, false);
            if (currentCardIndex < filteredCards.length - 1) {
                setCurrentCardIndex(currentCardIndex + 1);
            } else {
                // 마지막 카드 - 완료 메시지 후 모드 선택으로
                showCompleteAndRedirect();
            }
        }
    };

    // 학습 완료 상태
    const [showComplete, setShowComplete] = useState(false);

    const showCompleteAndRedirect = () => {
        setShowComplete(true);
        setTimeout(() => {
            setShowComplete(false);
            setCurrentCardIndex(0);
            setView('mode-select');
        }, 1500);
    };


    // 키보드 이벤트 리스너
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (view !== 'cards' || activeTab !== 'cards') return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handleMarkMastered();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleMarkNeedsStudy();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                handlePrevCard();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                handleNextCard();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view, activeTab, filteredCards, currentCardIndex]);

    // 모르는 카드 개수
    const unknownCount = cards.filter(card => !card.mastered).length;

    return (
        <div className="app">
            {/* 카드 학습 중에는 헤더 숨김 */}
            {view !== 'cards' && (
                <header className="header">
                    <h1>🎬 영어 플래시카드</h1>
                    <p>YouTube 영상으로 영어 학습</p>
                </header>
            )}

            {/* 카드 학습 중에는 네비게이션도 숨김 */}
            {view !== 'loading' && view !== 'cards' && (
                <nav className="nav-bar">
                    <button
                        className={`nav-btn ${view === 'home' ? 'active' : ''}`}
                        onClick={handleGoHome}
                    >
                        🏠 홈
                    </button>
                </nav>
            )}

            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {view === 'home' && (
                <>
                    <UrlInput onSubmit={handleGenerate} isLoading={isLoading} />
                    <SessionList
                        sessions={sessions}
                        onSelectSession={handleSelectSession}
                    />
                </>
            )}

            {view === 'loading' && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">잠시만 기다려주세요...</div>
                    <div className="loading-step">{loadingStep}</div>
                </div>
            )}

            {view === 'mode-select' && (
                <div className="mode-select-container">
                    <h2 className="mode-select-title">📚 학습 모드 선택</h2>
                    <p className="mode-select-subtitle">{currentSession?.title}</p>

                    <div className="mode-select-buttons">
                        <button
                            className="mode-btn mode-btn-all"
                            onClick={() => handleSelectStudyMode('all')}
                        >
                            <span className="mode-btn-icon">📖</span>
                            <span className="mode-btn-text">전체 학습</span>
                            <span className="mode-btn-count">{cards.length}개 카드</span>
                        </button>

                        <button
                            className="mode-btn mode-btn-unknown"
                            onClick={() => handleSelectStudyMode('unknown')}
                            disabled={unknownCount === 0}
                        >
                            <span className="mode-btn-icon">🎯</span>
                            <span className="mode-btn-text">모르는 것만</span>
                            <span className="mode-btn-count">
                                {unknownCount === 0 ? '없음' : `${unknownCount}개 카드`}
                            </span>
                        </button>
                    </div>

                    <button
                        className="reset-btn"
                        onClick={handleResetCards}
                    >
                        🔄 카드 상태 초기화
                    </button>
                </div>
            )}

            {view === 'cards' && filteredCards.length > 0 && (
                <>
                    <button className="back-btn" onClick={() => setView('mode-select')}>
                        ← 모드 선택
                    </button>

                    {/* 탭 네비게이션 */}
                    <div className="tab-container">
                        <button
                            className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cards')}
                        >
                            📚 카드 학습
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            📝 표현 설명
                        </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    {activeTab === 'summary' && (
                        <Summary
                            title={currentSession?.title}
                            summary={currentSession?.summary}
                        />
                    )}

                    {activeTab === 'cards' && (
                        <div
                            className={`card-swipe-area ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isDragging ? 'dragging' : ''}`}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onMouseDown={onMouseDown}
                        >
                            {/* 스와이프 인디케이터 */}
                            <div className="swipe-indicators">
                                <span className={`swipe-indicator left ${swipeDirection === 'left' ? 'active' : ''}`}>
                                    ✅ 암기완료
                                </span>
                                <span className={`swipe-indicator right ${swipeDirection === 'right' ? 'active' : ''}`}>
                                    📚 공부필요
                                </span>
                            </div>

                            <div
                                className="flashcard-drag-wrapper"
                                style={{
                                    transform: `translateX(${dragOffset}px)`,
                                    opacity: Math.max(0.3, 1 - Math.abs(dragOffset) / 150)
                                }}
                            >
                                <FlashCard
                                    front={filteredCards[currentCardIndex].front}
                                    back={filteredCards[currentCardIndex].back}
                                    mastered={filteredCards[currentCardIndex].mastered}
                                />
                            </div>

                            <CardNavigation
                                current={currentCardIndex + 1}
                                total={filteredCards.length}
                                onPrev={handlePrevCard}
                                onNext={handleNextCard}
                            />

                            {/* 데스크탑용 액션 버튼 */}
                            <div className="card-action-buttons">
                                <button
                                    className="action-btn action-btn-mastered"
                                    onClick={handleMarkMastered}
                                >
                                    ✅ 암기완료 (←)
                                </button>
                                <button
                                    className="action-btn action-btn-needs-study"
                                    onClick={handleMarkNeedsStudy}
                                >
                                    📚 공부필요 (→)
                                </button>
                            </div>

                            <div className="swipe-hint">
                                ⌨️ 키보드: ← 암기완료 | → 공부필요 | ↑↓ 이전/다음
                            </div>
                        </div>
                    )}
                </>
            )}

            {view === 'cards' && filteredCards.length === 0 && (
                <div className="empty-cards-message">
                    <div className="empty-icon">🎉</div>
                    <h3>모든 카드를 암기했습니다!</h3>
                    <p>전체 학습으로 돌아가거나 카드를 초기화하세요.</p>
                    <button
                        className="mode-btn mode-btn-all"
                        onClick={() => setView('mode-select')}
                    >
                        학습 모드 선택으로
                    </button>
                </div>
            )}

            {/* 학습 완료 오버레이 */}
            {showComplete && (
                <div className="complete-overlay">
                    <div className="complete-message">
                        <div className="complete-icon">🎉</div>
                        <h2>학습 완료!</h2>
                        <p>모든 카드를 확인했습니다</p>
                    </div>
                </div>
            )}
        </div>
    );
}
