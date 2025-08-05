import { NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

export async function GET() {
  try {
    const nets = networkInterfaces();
    let localIP = 'localhost';
    
    // 네트워크 인터페이스에서 IPv4 주소 찾기
    for (const name of Object.keys(nets)) {
      const netInfo = nets[name];
      if (netInfo) {
        for (const net of netInfo) {
          // IPv4이고, 내부 네트워크가 아니고, loopback이 아닌 주소
          if (net.family === 'IPv4' && !net.internal) {
            localIP = net.address;
            break;
          }
        }
      }
      if (localIP !== 'localhost') break;
    }
    
    return NextResponse.json({ ip: localIP });
  } catch (error) {
    console.error('Failed to get network IP:', error);
    return NextResponse.json({ ip: 'localhost' });
  }
}