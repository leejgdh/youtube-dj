# Node.js 20 기반 경량 이미지 사용
FROM node:20-alpine

# 작업 디렉토리 생성
WORKDIR /app

# 빌드 도구 설치 (SQLite 빌드용)
RUN apk add --no-cache make gcc g++ python3

# 패키지 파일 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci

# SQLite3 다시 빌드 (Alpine Linux용)
RUN npm rebuild sqlite3

# 소스 전체 복사
COPY . .

# Next.js 빌드
RUN npm run build

# pm2 글로벌 설치
RUN npm install -g pm2

# 프로덕션 환경 변수
ENV NODE_ENV=production

# 포트 오픈
EXPOSE 3000 3001

# 시작 스크립트 생성
RUN echo '#!/bin/sh' > start.sh && \
    echo 'node socket-server.js &' >> start.sh && \
    echo 'npm start' >> start.sh && \
    chmod +x start.sh

# 시작 스크립트 실행
CMD ["./start.sh"] 