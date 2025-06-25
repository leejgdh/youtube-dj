# YouTube DJ

🎵 **Next.js + Socket.IO 기반 YouTube 신청곡 시스템**

Docker를 통한 간편한 배포와 환경변수 기반의 유연한 설정을 지원합니다.

## 🌟 주요 기능

- 🎵 실시간 YouTube 신청곡 접수 및 재생
- 🎮 DJ 컨트롤 패널 (재생/일시정지/건너뛰기)
- 📱 모바일 친화적 신청곡 페이지
- 🔄 상태 지속성 (새로고침해도 재생목록 유지)
- 🎯 전체화면 DJ 모드
- 🌐 실시간 다중 사용자 동기화

---

## 🚀 빠른 시작

### 1단계: 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# IP 주소 수정 (필수!)
vim .env  # 또는 원하는 에디터 사용
```

**.env 파일에서 수정할 내용:**
```bash
SOCKET_URL=http://YOUR_SERVER_IP:8801  # 실제 서버 IP로 변경
```

### 2단계: 서비스 실행

#### 방법 A: 로컬에서 빌드하여 실행
```bash
docker-compose up -d
```

#### 방법 B: 사전 빌드된 이미지 사용
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3단계: 접속 확인

- 🌐 **DJ 페이지**: `http://your-ip:8800`
- 📱 **신청곡 등록**: `http://your-ip:8800/request`

---

## 🛠️ Docker 명령어 가이드

### 기본 서비스 관리

```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지
docker-compose down

# 서비스 재시작
docker-compose restart

# 서비스 상태 확인
docker-compose ps

# 로그 확인 (실시간)
docker-compose logs -f
```

### 이미지 빌드 및 배포

```bash
# 로컬에서 이미지 빌드
docker build --build-arg NEXT_PUBLIC_SOCKET_URL=http://your-ip:8801 -t youtube-dj .

# 레지스트리에 푸시 (선택사항)
docker tag youtube-dj registry.hwida.com/youtube-dj:latest
docker push registry.hwida.com/youtube-dj:latest
```

### 환경변수를 인라인으로 설정

```bash
# .env 파일 없이 직접 실행
SOCKET_URL=http://192.168.0.45:8801 WEB_PORT=8800 SOCKET_PORT=8801 docker-compose up -d
```

---

## ⚙️ 환경변수 설명

| 변수명 | 설명 | 기본값 | 예시 |
|--------|------|--------|------|
| `SOCKET_URL` | 클라이언트가 접속할 소켓 서버 URL | `http://localhost:3001` | `http://192.168.0.45:8801` |
| `WEB_PORT` | 웹 서비스 외부 포트 | `3000` | `8800` |
| `SOCKET_PORT` | 소켓 서버 외부 포트 | `3001` | `8801` |
| `SERVER_HOST` | 서버 바인딩 주소 | `0.0.0.0` | `0.0.0.0` |
| `SOCKET_SERVER_PORT` | 컨테이너 내부 소켓 포트 | `3001` | `3001` |

**Docker 이미지 관련 (선택사항):**
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `REGISTRY` | Docker 레지스트리 주소 | `registry.hwida.com` |
| `IMAGE_NAME` | 이미지 이름 | `youtube-dj` |
| `TAG` | 이미지 태그 | `latest` |

---

## 📁 Docker Compose 파일 선택

### `docker-compose.yml` (로컬 빌드)
- 소스코드를 현재 디렉토리에서 빌드
- 개발 또는 커스터마이징이 필요한 경우 사용

### `docker-compose.prod.yml` (사전 빌드 이미지)
- 레지스트리에서 빌드된 이미지를 다운로드
- 빠른 배포가 필요한 경우 사용

---

## 🎯 사용 시나리오

### 시나리오 1: 개발자 - 로컬 빌드
```bash
# 소스 수정 후 재빌드
docker-compose down
docker-compose up -d --build
```

### 시나리오 2: 운영자 - 사전 빌드 이미지
```bash
# 빠른 배포
cp .env.example .env
# .env 수정 후
docker-compose -f docker-compose.prod.yml up -d
```

### 시나리오 3: CI/CD - 자동 배포
```bash
# 이미지 빌드 및 푸시
docker build --build-arg NEXT_PUBLIC_SOCKET_URL=$SOCKET_URL -t $REGISTRY/$IMAGE_NAME:$TAG .
docker push $REGISTRY/$IMAGE_NAME:$TAG

# 서버에서 배포
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 Makefile 사용 (선택사항)

편의를 위해 Makefile이 제공됩니다:

```bash
# 환경 설정
make setup

# 서비스 시작 (로컬 빌드)
make up

# 서비스 시작 (사전 빌드 이미지)
make up-prod

# 로그 확인
make logs

# 서비스 중지
make down

# 전체 명령어 확인
make help
```

---

## 🏗️ 아키텍처

```
┌─────────────────┐    ┌─────────────────┐
│   신청곡 페이지    │    │    DJ 페이지     │
│  (/request)     │    │      (/)        │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │       WebSocket      │
          │                      │
          └─────┬─────────────────┘
                │
        ┌───────┴────────┐
        │ Docker Container │
        │                │
        │ ┌────────────┐ │ :3000 → :8800
        │ │ Next.js    │ │
        │ │ Web App    │ │
        │ └────────────┘ │
        │                │
        │ ┌────────────┐ │ :3001 → :8801
        │ │ Socket.IO  │ │
        │ │ Server     │ │
        │ └────────────┘ │
        └────────────────┘
```

---

## 🚨 문제해결

### 일반적인 문제들

**Q: 컨테이너가 시작되지 않아요**
```bash
# 로그 확인
docker-compose logs

# 포트 충돌 확인
netstat -tlnp | grep :8800
netstat -tlnp | grep :8801
```

**Q: 신청곡이 재생되지 않아요**
```bash
# 소켓 연결 상태 확인
docker-compose logs youtube-dj | grep socket
```

**Q: 브라우저에서 접속이 안돼요**
- IP 주소 확인: `.env` 파일의 `SOCKET_URL` 값 점검
- 방화벽 확인: 포트 8800, 8801 허용
- 컨테이너 상태 확인: `docker-compose ps`

### 환경변수 문제
```bash
# 현재 환경변수 확인
docker-compose config

# 특정 서비스의 환경변수 확인
docker-compose exec youtube-dj env | grep SOCKET
```

### 컨테이너 초기화
```bash
# 완전 초기화 (주의: 데이터 손실)
docker-compose down -v
docker system prune -f
docker-compose up -d
```

---

## 🔄 업데이트

### 새 버전으로 업데이트
```bash
# 사전 빌드 이미지 사용시
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 로컬 빌드시
git pull
docker-compose up -d --build
```

---

## 🛡️ 프로덕션 고려사항

### 보안
- `.env` 파일 권한: `chmod 600 .env`
- 방화벽 설정: 필요한 포트만 개방
- HTTPS 적용: 리버스 프록시 (nginx, traefik) 사용 권장

### 성능
- 리소스 제한 설정:
```yaml
services:
  youtube-dj:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### 모니터링
```bash
# 리소스 사용량 확인
docker stats youtube-dj

# 헬스체크 상태 확인
docker inspect --format='{{.State.Health.Status}}' youtube-dj
```

---

## 📊 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Material-UI
- **Backend**: Socket.IO, Node.js
- **Deployment**: Docker, Docker Compose
- **Real-time**: WebSocket 통신

---

**🎵 YouTube DJ로 즐거운 음악 시간을 만들어보세요! 🎧**

> 💡 **Tip**: `docker-compose logs -f` 명령으로 실시간 로그를 확인하면서 신청곡 처리 과정을 모니터링할 수 있습니다.
