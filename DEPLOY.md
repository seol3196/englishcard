# 🚀 리눅스 서버 배포 가이드

이 문서는 `english-card` 프로젝트를 리눅스(Ubuntu/Debian) 서버에 배포하는 방법을 설명합니다.

## 1. 사전 준비 (Prerequisites)

서버에 다음 소프트웨어들이 설치되어 있어야 합니다. (이미 있다면 건너뛰세요)

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Git 설치
sudo apt install git -y

# Node.js 18+ 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3 및 pip 설치
sudo apt install python3 python3-pip -y

# PM2 설치 (무중단 실행 프로세스 매니저)
sudo npm install -g pm2
```

## 2. 프로젝트 다운로드

```bash
# 원하는 디렉토리로 이동 (예: /var/www 또는 홈 디렉토리)
cd ~

# 레포지토리 클론
git clone <YOUR_GITHUB_REPO_URL> english-card
cd english-card
```

## 3. 의존성 설치

```bash
# Node.js 패키지 설치
npm install

# Python 패키지 설치
pip3 install youtube-transcript-api
```

## 4. 환경 변수 설정

`.env` 파일을 생성하고 API 키 정를 입력합니다.

```bash
# .env 파일 생성
nano .env
```

`.env` 파일 내용:
```env
# Z.AI API Key
ZAI_API_KEY=your_zai_api_key_here

# Server Port (기본값: 3002)
PORT=3002
```
(Ctrl+O로 저장, Enter, Ctrl+X로 종료)

## 5. 프론트엔드 빌드

React 앱을 프로덕션용으로 빌드합니다.

```bash
npm run build
```
이제 `dist` 폴더가 생성됩니다.

## 6. 서버 실행

### 테스트 실행 (잘 되나 확인용)
```bash
npm run server
```
- 브라우저에서 `http://<서버IP>:3002`로 접속해서 잘 나오는지 확인하세요.
- Python 스크립트 실행 등을 확인하기 위해 카드 하나를 생성해보세요.
- 잘 된다면 `Ctrl+C`로 종료합니다.

### 백그라운드 무중단 실행 (PM2)
```bash
# 서버 시작
pm2 start server.js --name "english-card"

# 로그 확인
pm2 logs english-card

# 상태 확인
pm2 status
```

## 🔥 서버 관리 명령어

- **서버 중지**: `pm2 stop english-card`
- **서버 재시작**: `pm2 restart english-card`
- **서버 삭제**: `pm2 delete english-card`

## 💡 문제 해결

**Q: Python 에러가 발생해요!**
A: `get_transcript.py`에 필요한 라이브러리가 설치되었는지 확인하세요.
`pip3 list | grep youtube-transcript-api`

**Q: 포트가 열리지 않아요!**
A: 클라우드(AWS/GCP/NCP)를 사용 중이라면 보안 그룹(Security Group) 또는 방화벽에서 **3002** 포트가 열려 있는지 확인해야 합니다.
```bash
# Ubuntu 방화벽(ufw) 사용 시
sudo ufw allow 3002
```
