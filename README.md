# YouTube DJ

Next.js + Socket.IO 기반 유튜브 신청곡/재생 프로젝트

## 개발 환경 실행

```bash
npm install
npm run dev
```

- 웹: http://localhost:3000
- 소켓 서버: http://localhost:3001

---

## Docker 이미지 빌드 및 배포

### 1. **빌드타임 환경변수 설정**
- 소켓 서버 주소는 클라이언트 번들에 하드코딩되므로, 반드시 **빌드 시점**에 환경변수로 지정해야 합니다.
- 예시: 홈서버 IP가 `192.168.0.45`, 소켓 포트가 `8801`일 때

```bash
docker build --build-arg NEXT_PUBLIC_SOCKET_URL=http://192.168.0.45:8801 -t registry.hwida.com/youtube-dj:latest .
docker push registry.hwida.com/youtube-dj:latest
```

### 2. **docker-compose.yml 예시**

```yaml
version: "3.8"

services:
  youtube-dj:
    image: registry.hwida.com/youtube-dj:latest
    container_name: youtube-dj
    restart: always
    ports:
      - "8800:3000"   # Next.js 웹
      - "8801:3001"   # 소켓 서버
    environment:
      - NODE_ENV=production
```

### 3. **서버에서 실행**

```bash
docker-compose up -d
```

- 웹: http://192.168.0.45:8800
- 소켓: http://192.168.0.45:8801

---

## 주의사항
- **NEXT_PUBLIC_SOCKET_URL**은 반드시 빌드 시점에 지정해야 하며, 컨테이너 실행 시점의 env로는 반영되지 않습니다.
- 소켓 서버 주소가 바뀌면 이미지를 새로 빌드해야 합니다.

---

## 기타
- 전체화면 해제 버튼, 실시간 신청곡, 재생목록, MUI 기반 UI 등 다양한 기능 포함
- 문의: [프로젝트 관리자에게 문의]
