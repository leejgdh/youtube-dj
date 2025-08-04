import { NextRequest, NextResponse } from 'next/server';

const db = require('../../../../../lib/database');

// 금지곡 목록 조회
export async function GET() {
  try {
    // 데이터베이스 초기화 확인
    await db.initDatabase();
    const bannedSongs = await db.getBannedSongs();
    return NextResponse.json({ success: true, bannedSongs });
  } catch (error) {
    console.error('Error fetching banned songs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banned songs' },
      { status: 500 }
    );
  }
}

// 금지곡 추가
export async function POST(request: NextRequest) {
  try {
    // 데이터베이스 초기화 확인
    await db.initDatabase();
    
    const body = await request.json();
    const { youtubeUrl, videoId, title, author } = body;

    if (!youtubeUrl || !videoId || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bannedSong = await db.addBannedSong({
      youtubeUrl,
      videoId,
      title,
      author: author || '알 수 없음'
    });

    return NextResponse.json({ 
      success: true, 
      message: '금지곡으로 등록되었습니다.',
      bannedSong 
    });
  } catch (error: any) {
    console.error('Error adding banned song:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to add banned song' 
      },
      { status: 500 }
    );
  }
}

// 금지곡 제거
export async function DELETE(request: NextRequest) {
  try {
    // 데이터베이스 초기화 확인
    await db.initDatabase();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Song ID is required' },
        { status: 400 }
      );
    }

    await db.removeBannedSong(parseInt(id));

    return NextResponse.json({ 
      success: true, 
      message: '금지곡에서 제거되었습니다.' 
    });
  } catch (error) {
    console.error('Error removing banned song:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove banned song' },
      { status: 500 }
    );
  }
}