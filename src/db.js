import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 싱글턴 패턴으로 DB 인스턴스 관리
let db = null;

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(__dirname, '..', 'flashcard.db');
    db = new Database(dbPath);

    // WAL 모드 및 busy_timeout 설정
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');

    // 테이블 생성
    initializeTables();
  }
  return db;
}

function initializeTables() {
  // sessions 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      summary TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // cards 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      card_order INTEGER NOT NULL,
      mastered INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  // 기존 테이블에 mastered 컬럼이 없으면 추가
  try {
    db.exec(`ALTER TABLE cards ADD COLUMN mastered INTEGER DEFAULT 0`);
  } catch (e) {
    // 이미 컬럼이 존재하면 무시
  }
}

// 세션 생성
export function createSession(id, url, title, summary) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO sessions (id, url, title, summary)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, url, title, summary);
}

// 카드 생성
export function createCard(id, sessionId, front, back, cardOrder) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO cards (id, session_id, front, back, card_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, sessionId, front, back, cardOrder);
}

// 모든 세션 조회
export function getAllSessions() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, url, title, summary, created_at
    FROM sessions
    ORDER BY created_at DESC
  `);
  return stmt.all();
}

// 특정 세션의 카드 조회
export function getCardsBySessionId(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, front, back, card_order, mastered
    FROM cards
    WHERE session_id = ?
    ORDER BY card_order ASC
  `);
  return stmt.all(sessionId);
}

// 특정 세션 조회
export function getSessionById(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, url, title, summary, created_at
    FROM sessions
    WHERE id = ?
  `);
  return stmt.get(sessionId);
}

// 카드 암기 상태 업데이트
export function updateCardMastered(cardId, mastered) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE cards SET mastered = ? WHERE id = ?
  `);
  stmt.run(mastered ? 1 : 0, cardId);
}

// 세션의 모든 카드 초기화 (공부필요 상태로)
export function resetSessionCards(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE cards SET mastered = 0 WHERE session_id = ?
  `);
  stmt.run(sessionId);
}
