import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import crypto from 'crypto';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getDatabase,
    createSession,
    createCard,
    getAllSessions,
    getCardsBySessionId,
    getSessionById
} from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// 프로덕션 환경에서 빌드된 React 앱 서빙
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// DB 초기화
getDatabase();

// GLM API 클라이언트
const client = new OpenAI({
    apiKey: process.env.ZAI_API_KEY,
    baseURL: "https://api.z.ai/api/paas/v4/"
});

// YouTube 비디오 ID 추출
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// POST /api/generate - YouTube URL로 카드 생성
app.post('/api/generate', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL이 필요합니다.' });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return res.status(400).json({ error: '유효한 YouTube URL이 아닙니다.' });
        }

        // 1. 자막 추출 (Python youtube_transcript_api 사용 - 자동 생성 자막 지원)
        console.log('자막 추출 중... videoId:', videoId);

        const transcriptText = await new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'get_transcript.py');
            const python = spawn('py', [pythonScript, videoId]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr || 'Python script failed'));
                    return;
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    if (result.success) {
                        console.log(`자막 성공! 세그먼트 수: ${result.segments}`);
                        resolve(result.text);
                    } else {
                        reject(new Error(result.error));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse transcript result'));
                }
            });
        });

        console.log(`자막 길이: ${transcriptText.length}자`);
        console.log('자막 미리보기:', transcriptText.substring(0, 200));

        // 2. GLM API로 요약 및 카드 생성
        console.log('AI로 카드 생성 중...');

        const systemPrompt = `당신은 영어 학습 전문가입니다. 주어진 영상 자막을 분석하여 영어 학습용 플래시카드를 생성해주세요.

다음 형식의 JSON으로 응답해주세요:
{
  "title": "이 영상에서 배우는 핵심 영어 표현 (예: 'for a while vs in a while 차이와 활용')",
  "summary": "이 영상에서 학습할 영어 표현에 대한 설명. 어떤 표현을 배우는지, 각 표현의 의미와 뉘앙스 차이, 언제 사용하는지를 설명해주세요. 영상 스토리가 아닌 학습 포인트에 집중하세요.",
  "cards": [
    { "front": "한글 문장", "back": "영어 문장" },
    ...
  ]
}

플래시카드 생성 규칙:
1. 이 영상이 가르치는 핵심 영어 표현을 파악하세요 (예: 특정 구문, 숙어, 문법 패턴 등).
2. 영상에 나온 예시 문장을 먼저 카드로 활용하세요.
3. 영상 예시 문장을 모두 활용한 후, 동일 표현을 활용한 응용 문제 10개를 추가로 생성하세요.
4. front(앞면)은 한글로, back(뒷면)은 영어로 작성합니다.
5. 한글 문장은 직독직해가 가능하도록 영어 문장 구조를 따라 작성합니다.
   예: "나는 믿어요 / 당신이 할 수 있다고" → "I believe / you can do it"
6. 문제 배치 순서는 난이도와 학습 흐름을 고려하여 배치하세요.
7. 최소 15개 이상의 카드를 생성해주세요.

중요: summary는 영상 스토리 요약이 아니라, 학습할 영어 표현에 대한 설명이어야 합니다.
JSON만 응답하고, 다른 설명은 포함하지 마세요.`;

        const completion = await client.chat.completions.create({
            model: "GLM-4.7-Flash",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `다음 영상 자막을 분석하여 영어 학습 플래시카드를 생성해주세요:\n\n${transcriptText.substring(0, 8000)}` }
            ]
        });

        const responseText = completion.choices[0].message.content;

        // JSON 파싱
        let result;
        try {
            // JSON 블록 추출 시도
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                responseText.match(/```\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
            result = JSON.parse(jsonStr.trim());
        } catch (parseError) {
            console.error('JSON 파싱 오류:', parseError);
            return res.status(500).json({ error: 'AI 응답을 파싱하는 데 실패했습니다.' });
        }

        // 3. DB에 저장
        const sessionId = crypto.randomUUID();
        createSession(sessionId, url, result.title, result.summary);

        const cards = result.cards.map((card, index) => {
            const cardId = crypto.randomUUID();
            createCard(cardId, sessionId, card.front, card.back, index + 1);
            return {
                id: cardId,
                front: card.front,
                back: card.back,
                card_order: index + 1
            };
        });

        console.log(`세션 ${sessionId} 생성 완료, 카드 ${cards.length}개`);

        res.json({
            sessionId,
            title: result.title,
            summary: result.summary,
            cards
        });

    } catch (error) {
        console.error('생성 오류:', error);
        res.status(500).json({ error: error.message || '카드 생성 중 오류가 발생했습니다.' });
    }
});

// GET /api/sessions - 모든 세션 목록
app.get('/api/sessions', (req, res) => {
    try {
        const sessions = getAllSessions();
        res.json(sessions);
    } catch (error) {
        console.error('세션 조회 오류:', error);
        res.status(500).json({ error: '세션 목록 조회 중 오류가 발생했습니다.' });
    }
});

// GET /api/sessions/:id/cards - 특정 세션의 카드
app.get('/api/sessions/:id/cards', (req, res) => {
    try {
        const { id } = req.params;
        const session = getSessionById(id);

        if (!session) {
            return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
        }

        const cards = getCardsBySessionId(id);
        res.json({
            session,
            cards
        });
    } catch (error) {
        console.error('카드 조회 오류:', error);
        res.status(500).json({ error: '카드 조회 중 오류가 발생했습니다.' });
    }
});

// SPA 폴백 - 모든 비-API 요청을 React 앱으로 라우팅
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 http://0.0.0.0:${PORT} 에서 실행 중입니다.`);
});
