import React, { useState, useEffect } from 'react';
import SessionList from './components/SessionList';
import UrlInput from './components/UrlInput';
import Summary from './components/Summary';
import FlashCard from './components/FlashCard';
import CardNavigation from './components/CardNavigation';

export default function App() {
    const [view, setView] = useState('home'); // 'home', 'loading', 'cards'
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('cards'); // 'summary', 'cards'

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
            setCards(data.cards);
            setCurrentCardIndex(0);
            setActiveTab('cards');
            setView('cards');

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
            setCards(data.cards);
            setCurrentCardIndex(0);
            setActiveTab('cards');
            setView('cards');
        } catch (err) {
            setError(err.message);
            setView('home');
        } finally {
            setIsLoading(false);
            setLoadingStep('');
        }
    };

    // 홈으로 돌아가기
    const handleGoHome = () => {
        setView('home');
        setCurrentSession(null);
        setCards([]);
        setCurrentCardIndex(0);
        setError('');
    };

    // 카드 네비게이션
    const handlePrevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    const handleNextCard = () => {
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        }
    };

    // 스와이프 핸들러
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNextCard();
        } else if (isRightSwipe) {
            handlePrevCard();
        }
    };

    return (
        <div className="app">
            <header className="header">
                <h1>🎬 영어 플래시카드</h1>
                <p>YouTube 영상으로 영어 학습</p>
            </header>

            {view !== 'loading' && (
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

            {view === 'cards' && cards.length > 0 && (
                <>
                    <button className="back-btn" onClick={handleGoHome}>
                        ← 홈으로
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
                            className="card-swipe-area"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <FlashCard
                                front={cards[currentCardIndex].front}
                                back={cards[currentCardIndex].back}
                            />

                            <CardNavigation
                                current={currentCardIndex + 1}
                                total={cards.length}
                                onPrev={handlePrevCard}
                                onNext={handleNextCard}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
