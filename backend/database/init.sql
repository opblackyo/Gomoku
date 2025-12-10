-- ============================================
-- 五子棋遊戲資料庫初始化腳本
-- ============================================

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 用戶表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================
-- 遊戲房間表
-- ============================================
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
    player1_id VARCHAR(100),
    player1_name VARCHAR(100),
    player2_id VARCHAR(100),
    player2_name VARCHAR(100),
    winner_id VARCHAR(100),
    current_player INTEGER DEFAULT 1, -- 1 or 2
    board_state JSONB,
    total_moves INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

-- ============================================
-- 匹配佇列表
-- ============================================
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socket_id VARCHAR(100) UNIQUE NOT NULL,
    player_name VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, matched, expired
    matched_with VARCHAR(100),
    matched_at TIMESTAMP
);

-- ============================================
-- 遊戲統計表
-- ============================================
CREATE TABLE IF NOT EXISTS game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socket_id VARCHAR(100) NOT NULL,
    player_name VARCHAR(100),
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    total_moves INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(socket_id)
);

-- ============================================
-- 遊戲歷史記錄
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
    player1_id VARCHAR(100),
    player1_name VARCHAR(100),
    player2_id VARCHAR(100),
    player2_name VARCHAR(100),
    winner_id VARCHAR(100),
    winner_name VARCHAR(100),
    total_moves INTEGER,
    duration_seconds INTEGER,
    final_board JSONB,
    moves_history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 玩家連線記錄
-- ============================================
CREATE TABLE IF NOT EXISTS player_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socket_id VARCHAR(100) UNIQUE NOT NULL,
    player_name VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- 建立索引以提升查詢效能
-- ============================================

-- 遊戲房間索引
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_player1 ON game_rooms(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_player2 ON game_rooms(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_created ON game_rooms(created_at DESC);

-- 匹配佇列索引
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_socket ON matchmaking_queue(socket_id);
CREATE INDEX IF NOT EXISTS idx_matchmaking_joined ON matchmaking_queue(joined_at);

-- 遊戲統計索引
CREATE INDEX IF NOT EXISTS idx_game_stats_socket ON game_stats(socket_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_played ON game_stats(games_played DESC);
CREATE INDEX IF NOT EXISTS idx_game_stats_winrate ON game_stats(win_rate DESC);

-- 遊戲歷史索引
CREATE INDEX IF NOT EXISTS idx_game_history_room ON game_history(room_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player1 ON game_history(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player2 ON game_history(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created ON game_history(created_at DESC);

-- 玩家連線記錄索引
CREATE INDEX IF NOT EXISTS idx_player_sessions_socket ON player_sessions(socket_id);
CREATE INDEX IF NOT EXISTS idx_player_sessions_active ON player_sessions(is_active);

-- ============================================
-- 自動更新 updated_at 的觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 應用觸發器到需要的表
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_stats_updated_at 
    BEFORE UPDATE ON game_stats
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 自動計算勝率的觸發器
-- ============================================

CREATE OR REPLACE FUNCTION update_win_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.games_played > 0 THEN
        NEW.win_rate = ROUND((NEW.games_won::DECIMAL / NEW.games_played::DECIMAL) * 100, 2);
    ELSE
        NEW.win_rate = 0.00;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_win_rate 
    BEFORE INSERT OR UPDATE ON game_stats
    FOR EACH ROW 
    EXECUTE FUNCTION update_win_rate();

-- ============================================
-- 清理過期匹配佇列的函數（可用於定時任務）
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_queue()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 刪除 5 分鐘前仍在等待的記錄
    DELETE FROM matchmaking_queue
    WHERE status = 'waiting' 
    AND joined_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- ============================================
-- 查詢排行榜的視圖
-- ============================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    player_name,
    games_played,
    games_won,
    games_lost,
    games_drawn,
    win_rate,
    RANK() OVER (ORDER BY win_rate DESC, games_won DESC) as rank
FROM game_stats
WHERE games_played >= 5  -- 至少玩過 5 場
ORDER BY rank;

-- ============================================
-- 插入測試數據（可選，用於測試）
-- ============================================

-- 取消註解以插入測試數據
/*
INSERT INTO game_stats (socket_id, player_name, games_played, games_won, games_lost)
VALUES 
    ('test1', 'Alice', 10, 7, 3),
    ('test2', 'Bob', 15, 10, 5),
    ('test3', 'Charlie', 8, 4, 4);
*/

-- ============================================
-- 完成
-- ============================================

-- 顯示所有已建立的表
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 顯示統計
SELECT 
    'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Game Rooms', COUNT(*) FROM game_rooms
UNION ALL
SELECT 'Matchmaking Queue', COUNT(*) FROM matchmaking_queue
UNION ALL
SELECT 'Game Stats', COUNT(*) FROM game_stats
UNION ALL
SELECT 'Game History', COUNT(*) FROM game_history
UNION ALL
SELECT 'Player Sessions', COUNT(*) FROM player_sessions;

RAISE NOTICE 'Database initialization completed successfully!';
