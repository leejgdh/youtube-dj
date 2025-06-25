# 🎵 YouTube DJ - 순수 Docker 환경 구축

## v3.0.0 - 2025.06.26

### 🐳 **순수 Docker 명령어 기반 아키텍처**

#### ❌ **제거된 요소들**
모든 스크립트 파일을 제거하고 표준 Docker 명령어만 사용하도록 변경:

- `docker-build.sh/.bat` ❌
- `docker-deploy.sh/.bat` ❌ 
- `git-commit.bat` ❌
- `git-status.sh` ❌
- `DOCKER_DEPLOY_GUIDE.md` ❌

#### 🆕 **새로운 구조**

##### **1. 이중 Docker Compose 전략**

**`docker-compose.yml` (로컬 빌드)**
```yaml
# 현재 소스코드를 빌드하여 실행
services:
  youtube-dj:
    build:
      context: .
      args:
        NEXT_PUBLIC_SOCKET_URL: ${SOCKET_URL}
```

**`docker-compose.prod.yml` (사전 빌드 이미지)**
```yaml
# 레지스트리의 빌드된 이미지 사용
services:
  youtube-dj:
    image: ${REGISTRY}/${IMAGE_NAME}:${TAG}
```

##### **2. 향상된 Docker Compose 설정**
- **헬스체크**: 자동 서비스 상태 모니터링
- **로깅 설정**: 로그 크기 및 순환 관리
- **네트워크**: 전용 브리지 네트워크
- **재시작 정책**: `unless-stopped`로 안정성 향상

##### **3. Makefile 편의 기능 (선택사항)**
표준 Docker 명령어를 단축하는 Make 타겟 제공:

```bash
make setup     # .env 파일 생성
make up        # 로컬 빌드 실행
make up-prod   # 사전 빌드 이미지 실행
make logs      # 로그 확인
make down      # 서비스 중지
```

#### 🚀 **사용 방법 변화**

##### **이전 (스크립트 기반)**
```bash
./docker-deploy.sh  # 모든 것을 자동화
```

##### **현재 (표준 Docker)**
```bash
# 1. 환경 설정
cp .env.example .env
vim .env

# 2. 서비스 실행
docker-compose up -d                           # 로컬 빌드
# 또는
docker-compose -f docker-compose.prod.yml up -d  # 사전 빌드 이미지
```

#### 🎯 **표준화의 장점**

1. **Docker 표준 준수**: 업계 표준 명령어 사용
2. **학습 곡선 감소**: Docker를 아는 사람이면 누구나 사용 가능
3. **CI/CD 친화적**: 표준 명령어로 자동화 파이프라인 구축 용이
4. **유지보수성**: 커스텀 스크립트 없이 Docker Compose만 관리
5. **투명성**: 모든 설정이 docker-compose.yml에 명시

#### 🔧 **주요 Docker 명령어**

##### **기본 서비스 관리**
```bash
# 서비스 시작
docker-compose up -d

# 서비스 중지  
docker-compose down

# 로그 확인
docker-compose logs -f

# 상태 확인
docker-compose ps
```

##### **이미지 관리**
```bash
# 로컬 빌드
docker build --build-arg NEXT_PUBLIC_SOCKET_URL=http://your-ip:8801 -t youtube-dj .

# 이미지 푸시
docker push registry.hwida.com/youtube-dj:latest

# 이미지 업데이트
docker-compose pull && docker-compose up -d
```

##### **환경변수 설정**
```bash
# 인라인 환경변수
SOCKET_URL=http://192.168.0.45:8801 docker-compose up -d

# 설정 확인
docker-compose config
```

#### 📊 **환경변수 완전 가이드**

| 변수명 | 용도 | 기본값 | 설정 예시 |
|--------|------|--------|-----------|
| `SOCKET_URL` | 클라이언트 접속 URL | `http://localhost:3001` | `http://192.168.0.45:8801` |
| `WEB_PORT` | 웹 서비스 포트 | `3000` | `8800` |
| `SOCKET_PORT` | 소켓 서버 포트 | `3001` | `8801` |
| `SERVER_HOST` | 서버 바인딩 주소 | `0.0.0.0` | `0.0.0.0` |
| `SOCKET_SERVER_PORT` | 내부 소켓 포트 | `3001` | `3001` |
| `REGISTRY` | Docker 레지스트리 | `registry.hwida.com` | `my-registry.com` |
| `IMAGE_NAME` | 이미지 이름 | `youtube-dj` | `my-youtube-dj` |
| `TAG` | 이미지 태그 | `latest` | `v1.0.0` |

#### 💡 **Best Practices**

1. **환경별 설정**:
   ```bash
   # 개발환경
   cp .env.example .env.dev
   
   # 프로덕션환경  
   cp .env.example .env.prod
   
   # 사용시
   docker-compose --env-file .env.dev up -d
   ```

2. **보안 강화**:
   ```bash
   # .env 파일 권한 설정
   chmod 600 .env
   
   # 민감한 정보는 Docker Secrets 사용 권장
   echo "my-secret" | docker secret create db-password -
   ```

3. **모니터링**:
   ```bash
   # 리소스 사용량 모니터링
   docker stats youtube-dj
   
   # 헬스체크 상태 확인
   docker inspect --format='{{.State.Health.Status}}' youtube-dj
   ```

---

## v2.0.0 - 환경변수 기반 시스템

### 🔧 기존 기능들
- 환경변수 기반 Docker 설정
- .env 파일 지원  
- 소켓 서버 환경변수 지원
- docker-compose.yml 개선

---

## v1.0.0 - 기본 YouTube DJ 시스템

### 🎵 핵심 기능
- YouTube 신청곡 시스템
- 실시간 재생목록 관리
- Socket.IO 기반 실시간 통신
- 상태 지속성
- 전체화면 DJ 모드

---

**🐳 YouTube DJ는 이제 완전한 Docker 네이티브 애플리케이션입니다!**

## 🚀 한 줄 명령어로 시작하기

```bash
# 설정 후 바로 실행
cp .env.example .env && docker-compose up -d

# 또는 사전 빌드 이미지 사용
cp .env.example .env && docker-compose -f docker-compose.prod.yml up -d
```

**Docker를 알면 YouTube DJ를 완벽하게 운영할 수 있습니다!** 🎉
