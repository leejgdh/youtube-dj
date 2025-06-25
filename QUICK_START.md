# YouTube DJ - 빠른 시작 가이드

## 🚀 3단계로 바로 시작하기

### 1단계: 환경 설정
```bash
cp .env.example .env
```

`.env` 파일에서 IP 주소만 수정:
```bash
SOCKET_URL=http://YOUR_SERVER_IP:8801
```

### 2단계: 서비스 실행

#### 옵션 A: 로컬에서 빌드
```bash
docker-compose up -d
```

#### 옵션 B: 사전 빌드 이미지 사용  
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3단계: 접속
- DJ 페이지: `http://your-ip:8800`
- 신청곡 등록: `http://your-ip:8800/request`

---

## 📋 주요 명령어

```bash
# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down

# 서비스 재시작  
docker-compose restart

# 설정 확인
docker-compose config
```

---

## 🔧 Makefile 사용 (편의 기능)

```bash
make help      # 전체 명령어 보기
make setup     # .env 파일 생성
make up        # 서비스 시작 (로컬 빌드)
make up-prod   # 서비스 시작 (사전 빌드)
make logs      # 로그 확인
make down      # 서비스 중지
```

---

## 🚨 문제 해결

**Q: 접속이 안됩니다**
- `.env` 파일의 IP 주소 확인
- 방화벽 포트 8800, 8801 허용 확인

**Q: 컨테이너가 시작 안됩니다**
```bash
docker-compose logs
```

자세한 내용은 `README.md`를 참고하세요.
