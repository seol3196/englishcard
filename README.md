# YouTube 영어 플래시카드

YouTube 영상 URL을 입력하면 자막을 추출하고, AI를 활용하여 영어 학습용 플래시카드를 자동 생성합니다.

## 개발 환경 실행

```bash
npm install
npm run start
```

프론트엔드: http://localhost:5173
백엔드 API: http://localhost:3002

## 프로덕션 배포 (Linux)

### 1. 레포지토리 클론
```bash
git clone <your-repo-url>
cd english-card
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Python 의존성 설치
```bash
pip3 install youtube-transcript-api
```

### 4. 환경변수 설정
```bash
cp .env.example .env
nano .env
# ZAI_API_KEY=your_api_key_here
```

### 5. 빌드 및 실행
```bash
npm run prod
```

서버가 http://0.0.0.0:3002 에서 실행됩니다.

### 6. PM2로 백그라운드 실행 (권장)
```bash
npm install -g pm2
pm2 start server.js --name english-card
pm2 save
pm2 startup
```

### 7. 포트 포워딩
라우터에서 외부 포트 → 내부 IP:3002 로 포트 포워딩 설정

## 환경변수

| 변수 | 설명 |
|------|------|
| `ZAI_API_KEY` | Z.AI GLM API 키 |
| `PORT` | 서버 포트 (기본: 3002) |
