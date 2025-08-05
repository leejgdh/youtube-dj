# 현재 날짜와 시간 가져오기
$tag = Get-Date -Format "yyyyMMdd_HHmm"

# Docker 이미지 빌드: 날짜/시간 태그
docker build -t registry.hwida.com/youtube-dj:$tag . -f .\Dockerfile

docker tag registry.hwida.com/youtube-dj:$tag registry.hwida.com/youtube-dj:latest

docker push registry.hwida.com/youtube-dj:$tag

docker push registry.hwida.com/youtube-dj:latest