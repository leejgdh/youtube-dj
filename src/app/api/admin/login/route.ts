import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === adminUsername && password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, message: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}