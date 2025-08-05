const path = require('path');
const fs = require('fs').promises;

// 데이터 파일 경로
const DATA_DIR = path.join(process.cwd(), 'data');
const BANNED_SONGS_FILE = path.join(DATA_DIR, 'banned-songs.json');

let isInitialized = false;

// 데이터 디렉토리 및 파일 초기화
async function initDatabase() {
  if (isInitialized) return;
  
  try {
    // 데이터 디렉토리 생성
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // banned-songs.json 파일이 없으면 생성
    try {
      await fs.access(BANNED_SONGS_FILE);
    } catch {
      await fs.writeFile(BANNED_SONGS_FILE, JSON.stringify([], null, 2));
    }
    
    isInitialized = true;
    console.log('JSON Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize JSON database:', error);
    throw error;
  }
}

// 금지곡 목록 조회
async function getBannedSongs() {
  await initDatabase();
  
  try {
    const data = await fs.readFile(BANNED_SONGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read banned songs:', error);
    return [];
  }
}

// 금지곡 추가
async function addBannedSong({ youtubeUrl, videoId, title, author }) {
  await initDatabase();
  
  try {
    const bannedSongs = await getBannedSongs();
    
    // 중복 확인
    const exists = bannedSongs.some(song => 
      song.youtubeUrl === youtubeUrl || song.videoId === videoId
    );
    
    if (exists) {
      throw new Error('이미 금지곡으로 등록된 곡입니다.');
    }
    
    const newSong = {
      id: bannedSongs.length > 0 ? Math.max(...bannedSongs.map(s => s.id)) + 1 : 1,
      youtubeUrl,
      videoId,
      title,
      author,
      createdAt: new Date().toISOString()
    };
    
    bannedSongs.push(newSong);
    await fs.writeFile(BANNED_SONGS_FILE, JSON.stringify(bannedSongs, null, 2));
    
    return newSong;
  } catch (error) {
    console.error('Failed to add banned song:', error);
    throw error;
  }
}

// 금지곡 제거
async function removeBannedSong(id) {
  await initDatabase();
  
  try {
    const bannedSongs = await getBannedSongs();
    const filteredSongs = bannedSongs.filter(song => song.id !== id);
    
    if (filteredSongs.length === bannedSongs.length) {
      throw new Error('해당 금지곡을 찾을 수 없습니다.');
    }
    
    await fs.writeFile(BANNED_SONGS_FILE, JSON.stringify(filteredSongs, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to remove banned song:', error);
    throw error;
  }
}

// URL로 금지곡 확인
async function isBannedSong(youtubeUrl) {
  await initDatabase();
  
  try {
    const bannedSongs = await getBannedSongs();
    return bannedSongs.some(song => song.youtubeUrl === youtubeUrl);
  } catch (error) {
    console.error('Failed to check banned song:', error);
    return false;
  }
}

// 비디오 ID로 금지곡 확인
async function isBannedVideoId(videoId) {
  await initDatabase();
  
  try {
    const bannedSongs = await getBannedSongs();
    return bannedSongs.some(song => song.videoId === videoId);
  } catch (error) {
    console.error('Failed to check banned video ID:', error);
    return false;
  }
}

module.exports = {
  initDatabase,
  getBannedSongs,
  addBannedSong,
  removeBannedSong,
  isBannedSong,
  isBannedVideoId
};