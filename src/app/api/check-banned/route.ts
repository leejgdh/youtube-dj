import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // JSON 데이터베이스 로드
    const db = require('../../../../lib/database-json');
    
    // 데이터베이스 초기화 확인
    await db.initDatabase();
    
    const body = await request.json();
    const { youtubeUrl, videoId } = body;

    if (!youtubeUrl && !videoId) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL or video ID is required' },
        { status: 400 }
      );
    }

    let isBanned = false;

    if (youtubeUrl) {
      isBanned = await db.isBannedSong(youtubeUrl);
    } else if (videoId) {
      isBanned = await db.isBannedVideoId(videoId);
    }

    return NextResponse.json({ 
      success: true, 
      isBanned,
      message: isBanned ? '이 곡은 금지곡으로 등록되어 있습니다.' : null
    });
  } catch (error) {
    console.error('Error checking banned song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check banned song' },
      { status: 500 }
    );
  }
}