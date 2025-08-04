const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로
const DB_PATH = path.join(process.cwd(), 'data', 'youtube-dj.db');

// 데이터베이스 연결
let db = null;
let isInitialized = false;

function getDatabase() {
  if (!db || !isInitialized) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function initDatabase() {
  return new Promise((resolve, reject) => {
    if (isInitialized && db) {
      resolve(db);
      return;
    }

    // data 디렉토리 생성
    const dataDir = path.dirname(DB_PATH);
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }

      // 금지곡 테이블 생성
      db.run(`
        CREATE TABLE IF NOT EXISTS banned_songs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          youtube_url TEXT UNIQUE NOT NULL,
          video_id TEXT NOT NULL,
          title TEXT NOT NULL,
          author TEXT,
          banned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          banned_by TEXT DEFAULT 'admin'
        )
      `, (err) => {
        if (err) {
          console.error('Table creation error:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          isInitialized = true;
          resolve(db);
        }
      });
    });
  });
}

// 금지곡 추가
function addBannedSong(songData) {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      const { youtubeUrl, videoId, title, author } = songData;
      
      database.run(
        'INSERT INTO banned_songs (youtube_url, video_id, title, author) VALUES (?, ?, ?, ?)',
        [youtubeUrl, videoId, title, author],
        function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('이미 금지곡으로 등록된 곡입니다.'));
            } else {
              reject(err);
            }
          } else {
            resolve({ id: this.lastID, ...songData });
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// 금지곡 제거
function removeBannedSong(id) {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      database.run('DELETE FROM banned_songs WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deletedId: id, changes: this.changes });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 금지곡 목록 조회
function getBannedSongs() {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      database.all('SELECT * FROM banned_songs ORDER BY banned_at DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// URL로 금지곡 확인
function isBannedSong(youtubeUrl) {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      database.get('SELECT id FROM banned_songs WHERE youtube_url = ?', [youtubeUrl], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 비디오 ID로 금지곡 확인
function isBannedVideoId(videoId) {
  return new Promise((resolve, reject) => {
    try {
      const database = getDatabase();
      database.get('SELECT id FROM banned_songs WHERE video_id = ?', [videoId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 데이터베이스 연결 종료
function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Database closing error:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

module.exports = {
  initDatabase,
  addBannedSong,
  removeBannedSong,
  getBannedSongs,
  isBannedSong,
  isBannedVideoId,
  closeDatabase
};