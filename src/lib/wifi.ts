// WiFi QR코드 생성을 위한 유틸리티 함수

export interface WiFiConfig {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

/**
 * WiFi 설정을 QR코드용 문자열로 변환
 * WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
 */
export function generateWiFiQRString({ ssid, password, security, hidden = false }: WiFiConfig): string {
  const escape = (str: string) => str.replace(/[\\;,":]/g, '\\$&');
  
  return `WIFI:T:${security};S:${escape(ssid)};P:${escape(password)};H:${hidden};;`;
}

/**
 * 환경변수에서 WiFi 설정 읽기
 */
export function getWiFiConfig(): WiFiConfig | null {
  const ssid = process.env.WIFI_SSID;
  const password = process.env.WIFI_PASSWORD;
  const security = process.env.WIFI_SECURITY as 'WPA' | 'WEP' | 'nopass';

  if (!ssid || !password || !security) {
    return null;
  }

  return {
    ssid,
    password,
    security
  };
}