# 🎵 YouTube DJ 프로젝트 실행 가이드

## 빠른 시작

### 방법 1: 배치 파일 사용 (Windows)
```bash
# 프로젝트 폴더에서
./start-dev.bat
```

### 방법 2: Bash 스크립트 사용 (Linux/Mac/WSL)
```bash
# 실행 권한 부여
chmod +x start-dev.sh

# 실행
./start-dev.sh
```

### 방법 3: NPM 스크립트 사용
```bash
# 의존성 설치 (처음 한번만)
npm install

# 개발 서버 시작 (두 개 터미널 필요)
npm run dev          # Next.js 서버 (포트 3000)
npm run dev:socket   # Socket.IO 서버 (포트 3001)

# 또는 한 번에 시작 (concurrently 설치 후)
npm install concurrently --save-dev
npm run dev:all
```

## 접속 주소
- **웹 애플리케이션**: http://localhost:3000
- **Socket.IO 서버**: http://localhost:3001

## 주요 기능
- 실시간 유튜브 신청곡 시스템
- Socket.IO 기반 실시간 통신
- Material-UI 기반 모던 UI
- Docker 컨테이너화 지원

## 문제 해결
1. **포트 충돌**: 3000, 3001 포트가 사용 중인 경우 다른 애플리케이션을 종료하거나 포트를 변경
2. **의존성 오류**: `npm install` 재실행
3. **Socket 연결 실패**: Socket.IO 서버가 먼저 실행되었는지 확인

---
*즐거운 개발 되세요! 🚀*
