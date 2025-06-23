import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // YouTube URL 유효성 검사
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json({ error: '유효하지 않은 YouTube URL입니다.' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: '비디오 ID를 추출할 수 없습니다.' }, { status: 400 });
    }

    try {
      // YouTube oEmbed API 사용
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('oEmbed API 호출 실패');
      }
      
      const data = await response.json();
      
      return NextResponse.json({
        title: data.title,
        duration: 0, // oEmbed API는 duration을 제공하지 않음
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: data.author_name,
        viewCount: 0,
        url: url
      });
    } catch (oembedError) {
      console.error('oEmbed API 오류:', oembedError);
      
      // oEmbed 실패 시 기본 정보만 반환
      return NextResponse.json({
        title: '제목을 가져올 수 없습니다',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        author: '알 수 없음',
        viewCount: 0,
        url: url
      });
    }

  } catch (error) {
    console.error('YouTube API 에러:', error);
    return NextResponse.json({ error: '비디오 정보를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}

// YouTube URL 유효성 검사
function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
  return youtubeRegex.test(url);
}

// YouTube URL에서 videoId 추출
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
} 