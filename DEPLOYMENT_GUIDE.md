# 五子棋網站雲端部署完整手冊

## 📋 目錄
1. [部署架構總覽](#部署架構總覽)
2. [前置準備](#前置準備)
3. [後端部署 - Render](#後端部署---render)
4. [資料庫部署 - PostgreSQL](#資料庫部署---postgresql)
5. [前端部署 - Vercel](#前端部署---vercel)
6. [完整指令清單](#完整指令清單)
7. [測試與驗證](#測試與驗證)
8. [常見問題排解](#常見問題排解)

---

## 🏗 部署架構總覽

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Vercel    │────────▶│   Render         │────────▶│   Render    │
│  (Frontend) │ HTTPS   │  (Backend+WS)    │         │ (PostgreSQL)│
│   Vue 3     │         │   NestJS         │         │             │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                         │
      │                         │
      └─────── WebSocket ───────┘
           (WSS over HTTPS)
```

**技術棧：**
- Frontend: Vue 3 + Vite + Socket.io-client
- Backend: NestJS + Socket.io + Express
- Database: PostgreSQL 15+
- 部署平台: Vercel + Render

---

## 🚀 前置準備

### 1. 必備帳號
- [ ] GitHub 帳號（用於程式碼管理）
- [ ] Render 帳號（https://render.com）
- [ ] Vercel 帳號（https://vercel.com）

### 2. 本地環境需求
```powershell
# 檢查 Node.js 版本（需要 18.x 或更高）
node --version

# 檢查 pnpm
pnpm --version

# 檢查 Git
git --version
```

### 3. 安裝必要工具
```powershell
# 如果沒有 pnpm
npm install -g pnpm

# 安裝專案依賴
pnpm install
```

---

## 🔧 後端部署 - Render

### Step 1: 準備後端程式碼

#### 1.1 建立 Render 所需檔案

**建立 `backend/.nvmrc`**（指定 Node 版本）
```
18
```

**建立 `backend/render-build.sh`**（Build Script）
```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

# 安裝依賴
npm install -g pnpm
pnpm install --frozen-lockfile

# 建立專案
pnpm build
```

**建立 `backend/Dockerfile`**（可選，用於 Docker 部署）
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm

# 複製 package 檔案
COPY package.json pnpm-lock.yaml ./

# 安裝依賴
RUN pnpm install --frozen-lockfile --prod

# 複製 built 檔案
COPY dist ./dist

# 暴露端口
EXPOSE 3001

# 啟動命令
CMD ["node", "dist/src/main"]
```

#### 1.2 修改 `backend/src/main.ts` 支援生產環境

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 設定 - 生產環境
  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`Backend server is running on port ${port}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
}

bootstrap();
```

#### 1.3 更新 `backend/src/modules/gateway/game.gateway.ts`

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : true,
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // ... 其他程式碼
}
```

### Step 2: 推送程式碼到 GitHub

```powershell
# 初始化 Git（如果還沒有）
git init

# 建立 .gitignore
@"
node_modules
dist
.env
.env.local
*.log
.DS_Store
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# 提交程式碼
git add .
git commit -m "Prepare for Render deployment"

# 連接到 GitHub（替換為你的 repository URL）
git remote add origin https://github.com/YOUR_USERNAME/gomoku.git
git branch -M main
git push -u origin main
```

### Step 3: 在 Render 建立 Web Service

#### 3.1 登入 Render Dashboard
1. 前往 https://dashboard.render.com
2. 點擊 **"New +"** → **"Web Service"**

#### 3.2 連接 GitHub Repository
1. 選擇 **"Connect a repository"**
2. 授權 Render 存取你的 GitHub
3. 選擇 `gomoku` repository

#### 3.3 設定 Web Service

| 設定項目 | 值 |
|---------|-----|
| **Name** | `gomoku-backend` |
| **Region** | `Singapore` (或離用戶最近的區域) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm build` |
| **Start Command** | `node dist/main` |
| **Instance Type** | `Free` (或 `Starter $7/mo`) |

#### 3.4 設定環境變數

點擊 **"Environment"** 頁籤，新增以下變數：

```env
# 必填
NODE_ENV=production
PORT=3001

# CORS 設定（部署後更新，先用 * 測試）
CORS_ORIGIN=*

# 資料庫連線（稍後從 PostgreSQL 取得）
DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# WebSocket 設定
WS_PORT=3001
WS_PATH=/socket.io

# 應用程式設定
MAX_PLAYERS_PER_ROOM=2
MATCHMAKING_TIMEOUT=30000
GAME_TIMEOUT=300000
```

#### 3.5 部署
1. 點擊 **"Create Web Service"**
2. 等待建置完成（約 3-5 分鐘）
3. 記下你的 backend URL：`https://gomoku-backend.onrender.com`

### Step 4: 處理 Render 閒置休眠問題

**問題：** Render 免費方案會在 15 分鐘無活動後休眠

**解決方案：**

#### 方案 1: 使用 Cron Job 定期喚醒

在 Render Dashboard:
1. 前往 **"New +"** → **"Cron Job"**
2. 設定：
   - **Name**: `keep-backend-alive`
   - **Command**: `curl https://gomoku-backend.onrender.com/health`
   - **Schedule**: `*/10 * * * *` (每 10 分鐘)

#### 方案 2: 在後端加入健康檢查端點

**建立 `backend/src/health.controller.ts`**
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

**註冊到 `app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
// ... 其他 imports

@Module({
  imports: [/* ... */],
  controllers: [HealthController],
  providers: [/* ... */],
})
export class AppModule {}
```

#### 方案 3: 升級到付費方案
- Starter Plan: $7/month (無休眠限制)

---

## 🗄 資料庫部署 - PostgreSQL

### Step 1: 在 Render 建立 PostgreSQL

#### 1.1 建立資料庫
1. 在 Render Dashboard，點擊 **"New +"** → **"PostgreSQL"**
2. 設定：
   - **Name**: `gomoku-db`
   - **Database**: `gomoku`
   - **User**: `gomoku_user` (自動生成)
   - **Region**: `Singapore` (與後端相同)
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free` (或 `Starter $7/mo`)

3. 點擊 **"Create Database"**

#### 1.2 取得連線資訊

在資料庫頁面，找到以下資訊：

```
Internal Database URL (用於 Render 服務間連接):
postgresql://gomoku_user:xxxxx@dpg-xxxxx/gomoku

External Database URL (用於本地連接):
postgresql://gomoku_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/gomoku

Hostname: dpg-xxxxx.singapore-postgres.render.com
Port: 5432
Database: gomoku
Username: gomoku_user
Password: xxxxx (自動生成)
```

### Step 2: 建立資料表結構

#### 2.1 建立 SQL 初始化腳本

**建立 `backend/database/init.sql`**
```sql
-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 遊戲房間表
CREATE TABLE IF NOT EXISTS game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, playing, finished
    player1_id VARCHAR(100),
    player2_id VARCHAR(100),
    winner_id VARCHAR(100),
    board_state JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

-- 匹配佇列表
CREATE TABLE IF NOT EXISTS matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socket_id VARCHAR(100) UNIQUE NOT NULL,
    player_name VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting' -- waiting, matched, expired
);

-- 遊戲統計表
CREATE TABLE IF NOT EXISTS game_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    socket_id VARCHAR(100) NOT NULL,
    player_name VARCHAR(100),
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    games_lost INTEGER DEFAULT 0,
    games_drawn INTEGER DEFAULT 0,
    total_moves INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 遊戲歷史記錄
CREATE TABLE IF NOT EXISTS game_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES game_rooms(id),
    player1_id VARCHAR(100),
    player2_id VARCHAR(100),
    winner_id VARCHAR(100),
    total_moves INTEGER,
    duration_seconds INTEGER,
    final_board JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_matchmaking_status ON matchmaking_queue(status);
CREATE INDEX IF NOT EXISTS idx_game_stats_socket ON game_stats(socket_id);
CREATE INDEX IF NOT EXISTS idx_game_history_room ON game_history(room_id);

-- 自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_stats_updated_at BEFORE UPDATE ON game_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2.2 執行 SQL 初始化

**方法 1: 使用 Render Web Console**
1. 在 Render PostgreSQL 頁面
2. 點擊 **"Connect"** → **"Web Shell"**
3. 複製貼上 `init.sql` 內容並執行

**方法 2: 使用本地 psql 工具**

```powershell
# 安裝 PostgreSQL 客戶端（如果沒有）
# Windows: 下載 PostgreSQL installer
# https://www.postgresql.org/download/windows/

# 連接到 Render PostgreSQL
$env:PGPASSWORD="your_password_here"
psql -h dpg-xxxxx.singapore-postgres.render.com `
     -U gomoku_user `
     -d gomoku `
     -p 5432 `
     -f backend/database/init.sql
```

**方法 3: 使用 Node.js Migration Script**

**建立 `backend/database/migrate.js`**
```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(
      path.join(__dirname, 'init.sql'),
      'utf8'
    );

    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
```

**執行 Migration**
```powershell
# 設定環境變數
$env:DATABASE_URL="postgresql://gomoku_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/gomoku"

# 執行 migration
node backend/database/migrate.js
```

### Step 3: 整合 PostgreSQL 到 NestJS

#### 3.1 安裝依賴

```powershell
cd backend
pnpm add pg @types/pg
```

#### 3.2 建立資料庫服務

**建立 `backend/src/database/database.service.ts`**
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private client: Client;

  async onModuleInit() {
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }
        : false,
    });

    await this.client.connect();
    console.log('Database connected successfully');
  }

  async query(text: string, params?: any[]) {
    try {
      return await this.client.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getClient() {
    return this.client;
  }
}
```

**建立 `backend/src/database/database.module.ts`**
```typescript
import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

**更新 `backend/src/app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
// ... 其他 imports

@Module({
  imports: [
    DatabaseModule, // 新增
    // ... 其他 modules
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Step 4: 更新 Render 環境變數

回到 Render Backend Service:
1. 進入 **"Environment"** 頁籤
2. 更新 `DATABASE_URL` 為 **Internal Database URL**:
   ```
   postgresql://gomoku_user:xxxxx@dpg-xxxxx/gomoku
   ```
3. 儲存變更（會自動重新部署）

---

## 🎨 前端部署 - Vercel

### Step 1: 準備前端程式碼

#### 1.1 建立環境變數檔案

**建立 `frontend/.env.example`**
```env
# 後端 API URL (HTTP)
VITE_BACKEND_URL=https://gomoku-backend.onrender.com

# WebSocket URL (WSS)
VITE_SOCKET_URL=https://gomoku-backend.onrender.com
```

**建立 `frontend/.env.production`**
```env
VITE_BACKEND_URL=https://gomoku-backend.onrender.com
VITE_SOCKET_URL=https://gomoku-backend.onrender.com
```

#### 1.2 更新前端 WebSocket 連線

**更新 `frontend/src/websocket/socket.ts`**
```typescript
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@gomoku/common';

// 生產環境使用環境變數，開發環境自動偵測
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.DEV 
    ? `http://${window.location.hostname}:3001`
    : window.location.origin);

console.log('Connecting to WebSocket:', SOCKET_URL);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'], // 支援降級
});

// 錯誤處理
socket.on('connect', () => {
  console.log('WebSocket connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason);
});

socket.on('error', (data) => {
  console.error('Server error:', data.message);
  alert(`錯誤: ${data.message}`);
});
```

#### 1.3 建立 Vercel 設定檔

**建立 `vercel.json`**
```json
{
  "version": 2,
  "buildCommand": "cd frontend && pnpm install && pnpm build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_BACKEND_URL": "https://gomoku-backend.onrender.com",
    "VITE_SOCKET_URL": "https://gomoku-backend.onrender.com"
  }
}
```

**注意：** 如果你的專案結構是 monorepo，需要調整 build command:

```json
{
  "buildCommand": "pnpm install && pnpm build:frontend",
  "outputDirectory": "frontend/dist"
}
```

### Step 2: 本地建置測試

```powershell
# 進入前端目錄
cd frontend

# 建置專案
pnpm build

# 預覽建置結果
pnpm preview

# 測試是否能正常運行
# 瀏覽器開啟 http://localhost:4173
```

### Step 3: 部署到 Vercel

#### 方法 1: 使用 Vercel CLI（推薦）

```powershell
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 回到專案根目錄
cd ..

# 部署到 Vercel
vercel

# 第一次部署會詢問：
# ? Set up and deploy "~/gomoku"? [Y/n] Y
# ? Which scope do you want to deploy to? [選擇你的帳號]
# ? Link to existing project? [N]
# ? What's your project's name? gomoku
# ? In which directory is your code located? ./

# 部署到生產環境
vercel --prod
```

#### 方法 2: 使用 GitHub 整合（推薦）

1. **推送程式碼到 GitHub**
   ```powershell
   git add .
   git commit -m "Add Vercel configuration"
   git push origin main
   ```

2. **連接 Vercel**
   - 前往 https://vercel.com/new
   - 點擊 **"Import Git Repository"**
   - 選擇 `gomoku` repository
   - 點擊 **"Import"**

3. **設定專案**
   
   | 設定項目 | 值 |
   |---------|-----|
   | **Framework Preset** | `Vite` |
   | **Root Directory** | `./` (or `frontend` if needed) |
   | **Build Command** | `cd frontend && pnpm install && pnpm build` |
   | **Output Directory** | `frontend/dist` |
   | **Install Command** | `pnpm install` |

4. **設定環境變數**
   
   在 **"Environment Variables"** 區域新增：
   ```
   VITE_BACKEND_URL = https://gomoku-backend.onrender.com
   VITE_SOCKET_URL = https://gomoku-backend.onrender.com
   ```

5. **部署**
   - 點擊 **"Deploy"**
   - 等待建置完成（約 2-3 分鐘）
   - 記下你的前端 URL：`https://gomoku.vercel.app`

### Step 4: 更新後端 CORS 設定

現在你有了前端 URL，需要更新後端的 CORS 設定：

1. 前往 Render Backend Service
2. 進入 **"Environment"** 頁籤
3. 更新 `CORS_ORIGIN`:
   ```
   https://gomoku.vercel.app
   ```
4. 儲存（會自動重新部署）

### Step 5: 設定自訂網域（可選）

#### 在 Vercel 設定網域
1. 進入專案設定 → **"Domains"**
2. 新增你的網域（例如：`gomoku.yourdomain.com`）
3. 依照指示設定 DNS 記錄

#### 更新 CORS（如果使用自訂網域）
```
CORS_ORIGIN=https://gomoku.yourdomain.com,https://gomoku.vercel.app
```

---

## 📝 完整指令清單

### 本地開發指令

```powershell
# ============================================
# 1. 安裝依賴
# ============================================
pnpm install

# ============================================
# 2. 啟動開發環境
# ============================================
# 啟動後端
pnpm --filter backend start:dev

# 啟動前端（新終端視窗）
pnpm --filter frontend dev

# 或同時啟動
pnpm dev

# ============================================
# 3. 建置專案
# ============================================
# 建置後端
pnpm --filter backend build

# 建置前端
pnpm --filter frontend build

# 建置全部
pnpm build

# ============================================
# 4. 類型檢查與 Lint
# ============================================
pnpm --filter frontend type-check
pnpm --filter backend build
pnpm lint
```

### Git 操作指令

```powershell
# ============================================
# 初始化與推送
# ============================================
git init
git add .
git commit -m "Initial commit: Gomoku game ready for deployment"

# 連接 GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/gomoku.git
git branch -M main
git push -u origin main

# ============================================
# 後續更新
# ============================================
git add .
git commit -m "Update: [描述你的變更]"
git push

# ============================================
# 查看狀態
# ============================================
git status
git log --oneline -5
```

### Render 部署指令

```powershell
# ============================================
# 使用 Render CLI（可選）
# ============================================
# 安裝 Render CLI
npm install -g @render/cli

# 登入
render login

# 部署服務
render deploy

# 查看日誌
render logs gomoku-backend

# 查看服務狀態
render services list
```

### 資料庫操作指令

```powershell
# ============================================
# 連接到 PostgreSQL
# ============================================
# 設定密碼環境變數
$env:PGPASSWORD="your_password"

# 連接到資料庫
psql -h dpg-xxxxx.singapore-postgres.render.com `
     -U gomoku_user `
     -d gomoku `
     -p 5432

# ============================================
# 執行 SQL 檔案
# ============================================
psql -h dpg-xxxxx.singapore-postgres.render.com `
     -U gomoku_user `
     -d gomoku `
     -p 5432 `
     -f backend/database/init.sql

# ============================================
# 備份資料庫
# ============================================
pg_dump -h dpg-xxxxx.singapore-postgres.render.com `
        -U gomoku_user `
        -d gomoku `
        -p 5432 `
        -F c `
        -b `
        -v `
        -f backup_$(Get-Date -Format 'yyyyMMdd').dump

# ============================================
# 恢復資料庫
# ============================================
pg_restore -h dpg-xxxxx.singapore-postgres.render.com `
           -U gomoku_user `
           -d gomoku `
           -p 5432 `
           -v backup_20231211.dump

# ============================================
# 使用 Node.js Migration
# ============================================
# 安裝 pg
cd backend
pnpm add pg @types/pg

# 執行 migration
$env:DATABASE_URL="postgresql://..."
node database/migrate.js
```

### Vercel 部署指令

```powershell
# ============================================
# 安裝與登入
# ============================================
npm install -g vercel
vercel login

# ============================================
# 部署
# ============================================
# 預覽部署（測試用）
vercel

# 生產部署
vercel --prod

# ============================================
# 環境變數管理
# ============================================
# 列出環境變數
vercel env ls

# 新增環境變數
vercel env add VITE_BACKEND_URL production

# 移除環境變數
vercel env rm VITE_BACKEND_URL production

# ============================================
# 查看部署狀態
# ============================================
vercel ls
vercel inspect [deployment-url]

# ============================================
# 查看日誌
# ============================================
vercel logs [deployment-url]
```

### 測試 WebSocket 連線

**使用 Node.js 測試**

**建立 `test-websocket.js`**
```javascript
const io = require('socket.io-client');

const SOCKET_URL = 'https://gomoku-backend.onrender.com';

console.log(`Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully!');
  console.log('Socket ID:', socket.id);
  
  // 測試加入匹配
  socket.emit('matchmaking.join', { playerName: 'TestPlayer' });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('matchmaking.joined', (data) => {
  console.log('✅ Joined matchmaking queue:', data);
  socket.disconnect();
  process.exit(0);
});

socket.on('error', (data) => {
  console.error('❌ Server error:', data);
});

setTimeout(() => {
  if (!socket.connected) {
    console.error('❌ Connection timeout');
    process.exit(1);
  }
}, 10000);
```

**執行測試**
```powershell
# 安裝 socket.io-client
npm install socket.io-client

# 執行測試
node test-websocket.js
```

**使用 curl 測試 HTTP 端點**
```powershell
# 測試健康檢查
curl https://gomoku-backend.onrender.com/health

# 測試 CORS
curl -H "Origin: https://gomoku.vercel.app" `
     -H "Access-Control-Request-Method: GET" `
     -H "Access-Control-Request-Headers: Content-Type" `
     -X OPTIONS `
     https://gomoku-backend.onrender.com/health `
     -v
```

---

## ✅ 平台設定檢查清單

### 📦 Render 後端設定 Checklist

- [ ] **Web Service 基本設定**
  - [ ] Name: `gomoku-backend`
  - [ ] Region: 選擇適當區域
  - [ ] Branch: `main`
  - [ ] Root Directory: `backend`
  - [ ] Runtime: `Node`

- [ ] **Build 設定**
  - [ ] Build Command: `npm install -g pnpm && pnpm install && pnpm build`
  - [ ] Start Command: `node dist/src/main`
  - [ ] Node Version: 18 或更高（通過 `.nvmrc` 或環境變數）

- [ ] **環境變數**
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3001`
  - [ ] `CORS_ORIGIN=https://gomoku.vercel.app`
  - [ ] `DATABASE_URL=postgresql://...`（Internal URL）
  - [ ] `WS_PORT=3001`
  - [ ] `MAX_PLAYERS_PER_ROOM=2`
  - [ ] `MATCHMAKING_TIMEOUT=30000`

- [ ] **Health Check**
  - [ ] 設定 Health Check Path: `/health`
  - [ ] 建立 health endpoint

- [ ] **部署驗證**
  - [ ] 檢查 Logs 無錯誤
  - [ ] 測試 `/health` 端點回應正常
  - [ ] 確認 WebSocket 可連線

### 🗄 Render PostgreSQL Checklist

- [ ] **資料庫建立**
  - [ ] Name: `gomoku-db`
  - [ ] Database: `gomoku`
  - [ ] PostgreSQL Version: 15
  - [ ] Region: 與後端相同

- [ ] **連線資訊**
  - [ ] 複製 Internal Database URL
  - [ ] 複製 External Database URL（本地開發用）
  - [ ] 記錄 Hostname, Port, Username, Password

- [ ] **資料表初始化**
  - [ ] 執行 `init.sql`
  - [ ] 驗證所有資料表已建立
  - [ ] 驗證索引已建立
  - [ ] 驗證觸發器已建立

- [ ] **連線測試**
  - [ ] 本地 psql 可連線
  - [ ] 後端服務可連線
  - [ ] SSL 設定正確

- [ ] **備份設定**
  - [ ] 啟用自動備份（付費方案）
  - [ ] 測試手動備份

### 🎨 Vercel 前端部署 Checklist

- [ ] **專案設定**
  - [ ] Framework Preset: `Vite`
  - [ ] Root Directory: 正確設定
  - [ ] Build Command: `cd frontend && pnpm install && pnpm build`
  - [ ] Output Directory: `frontend/dist`
  - [ ] Install Command: `pnpm install`

- [ ] **環境變數**
  - [ ] `VITE_BACKEND_URL=https://gomoku-backend.onrender.com`
  - [ ] `VITE_SOCKET_URL=https://gomoku-backend.onrender.com`

- [ ] **部署設定**
  - [ ] `vercel.json` 已建立
  - [ ] Rewrites 設定正確（SPA routing）
  - [ ] Headers 設定（Cache-Control）

- [ ] **GitHub 整合**
  - [ ] Repository 已連接
  - [ ] 自動部署已啟用
  - [ ] Branch protection 設定（可選）

- [ ] **部署驗證**
  - [ ] Build 成功無錯誤
  - [ ] 網站可正常載入
  - [ ] WebSocket 連線正常
  - [ ] 遊戲功能正常運作

- [ ] **網域設定（可選）**
  - [ ] 自訂網域已新增
  - [ ] DNS 記錄已設定
  - [ ] SSL 憑證已啟用

### 🔐 WebSocket on HTTPS 注意事項

- [ ] **協議配對**
  - [ ] HTTP → WS (開發環境)
  - [ ] HTTPS → WSS (生產環境)
  - [ ] 不可混用（會被瀏覽器阻擋）

- [ ] **後端設定**
  - [ ] NestJS Gateway 支援 HTTPS
  - [ ] CORS 設定允許前端網域
  - [ ] Socket.io 支援 `transports: ['websocket', 'polling']`

- [ ] **前端設定**
  - [ ] 使用 `wss://` 協議
  - [ ] 正確的後端 URL（包含 https）
  - [ ] 錯誤處理與重連機制

- [ ] **Render 特殊注意**
  - [ ] Render 自動提供 SSL
  - [ ] 使用同一個 URL for HTTP and WebSocket
  - [ ] 不需要額外的 WebSocket 端口

- [ ] **測試項目**
  - [ ] 瀏覽器 Console 無 mixed content 警告
  - [ ] Network tab 顯示 101 Switching Protocols
  - [ ] WebSocket 連線狀態為 `connected`

### 🎮 五子棋匹配流程測試 Checklist

- [ ] **匹配系統測試**
  - [ ] 單一玩家加入匹配佇列
  - [ ] 兩個玩家自動配對
  - [ ] 配對成功通知
  - [ ] 房間建立成功

- [ ] **遊戲房間測試**
  - [ ] 棋盤正確初始化
  - [ ] 玩家輪流下棋
  - [ ] 落子位置同步
  - [ ] 勝利條件判定
  - [ ] 遊戲結果顯示

- [ ] **斷線處理測試**
  - [ ] 玩家斷線自動判負
  - [ ] 另一方收到勝利通知
  - [ ] 房間正確清理

- [ ] **統計功能測試**
  - [ ] 遊戲統計正確記錄
  - [ ] 勝敗場數正確
  - [ ] 數據持久化

- [ ] **效能測試**
  - [ ] 多個房間同時運行
  - [ ] 延遲測試（< 100ms）
  - [ ] 長時間運行穩定性

---

## 🧪 測試與驗證

### 完整功能測試流程

#### 1. 後端健康檢查
```powershell
# 測試健康檢查端點
curl https://gomoku-backend.onrender.com/health

# 預期回應
# {
#   "status": "ok",
#   "timestamp": "2023-12-11T10:30:00.000Z",
#   "uptime": 1234.56
# }
```

#### 2. WebSocket 連線測試

**建立測試腳本 `test-full-flow.js`**
```javascript
const io = require('socket.io-client');

const BACKEND_URL = 'https://gomoku-backend.onrender.com';

async function testFullFlow() {
  console.log('🧪 Starting full flow test...\n');

  // 建立兩個玩家
  const player1 = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
  const player2 = io(BACKEND_URL, { transports: ['websocket', 'polling'] });

  let roomId = null;

  // Player 1 連線
  player1.on('connect', () => {
    console.log('✅ Player 1 connected:', player1.id);
    player1.emit('matchmaking.join', { playerName: 'Alice' });
  });

  // Player 1 加入匹配
  player1.on('matchmaking.joined', (data) => {
    console.log('✅ Player 1 joined matchmaking');
  });

  // Player 2 連線（延遲 1 秒）
  setTimeout(() => {
    player2.on('connect', () => {
      console.log('✅ Player 2 connected:', player2.id);
      player2.emit('matchmaking.join', { playerName: 'Bob' });
    });
  }, 1000);

  // Player 2 加入匹配
  player2.on('matchmaking.joined', (data) => {
    console.log('✅ Player 2 joined matchmaking');
  });

  // 配對成功
  player1.on('game.matched', (data) => {
    console.log('✅ Player 1 matched:', data);
    roomId = data.roomId;
  });

  player2.on('game.matched', (data) => {
    console.log('✅ Player 2 matched:', data);
  });

  // 遊戲開始
  player1.on('game.started', (data) => {
    console.log('✅ Game started:', data);
    
    // Player 1 下第一步（黑棋）
    setTimeout(() => {
      console.log('🎮 Player 1 makes move: [7, 7]');
      player1.emit('game.move', {
        roomId: roomId,
        position: [7, 7],
      });
    }, 1000);
  });

  // Player 1 下棋成功
  player1.on('game.moved', (data) => {
    console.log('✅ Player 1 move successful:', data.position);
  });

  // Player 2 收到 Player 1 的移動
  player2.on('game.moved', (data) => {
    console.log('✅ Player 2 received move:', data.position);
    
    // Player 2 下第二步（白棋）
    setTimeout(() => {
      console.log('🎮 Player 2 makes move: [7, 8]');
      player2.emit('game.move', {
        roomId: roomId,
        position: [7, 8],
      });
    }, 1000);
  });

  // 錯誤處理
  [player1, player2].forEach((player, index) => {
    player.on('error', (data) => {
      console.error(`❌ Player ${index + 1} error:`, data.message);
    });

    player.on('connect_error', (error) => {
      console.error(`❌ Player ${index + 1} connection error:`, error.message);
    });
  });

  // 10 秒後結束測試
  setTimeout(() => {
    console.log('\n✅ Test completed successfully!');
    player1.disconnect();
    player2.disconnect();
    process.exit(0);
  }, 10000);
}

testFullFlow();
```

**執行測試**
```powershell
node test-full-flow.js
```

#### 3. 前端整合測試

1. **開啟前端網站**
   ```powershell
   # 開啟瀏覽器
   Start-Process "https://gomoku.vercel.app"
   ```

2. **開啟瀏覽器開發者工具** (F12)

3. **檢查 Console**
   - 應該看到 `WebSocket connected: [socket-id]`
   - 無錯誤訊息
   - 無 CORS 警告

4. **檢查 Network Tab**
   - 找到 `socket.io` 請求
   - Status 應該是 `101 Switching Protocols`
   - Type 應該是 `websocket`

5. **測試遊戲流程**
   - 開啟兩個瀏覽器視窗（或無痕模式）
   - 兩個玩家都點擊「開始匹配」
   - 應該自動配對成功
   - 輪流下棋測試
   - 五子連線後顯示勝利

#### 4. 資料庫驗證

```powershell
# 連接資料庫
$env:PGPASSWORD="your_password"
psql -h dpg-xxxxx.singapore-postgres.render.com -U gomoku_user -d gomoku

# 在 psql 中執行
\dt              # 列出所有資料表
\d game_rooms    # 查看 game_rooms 結構

# 查詢遊戲記錄
SELECT * FROM game_rooms ORDER BY created_at DESC LIMIT 5;

# 查詢匹配佇列
SELECT * FROM matchmaking_queue WHERE status = 'waiting';

# 查詢統計資料
SELECT * FROM game_stats ORDER BY games_played DESC LIMIT 10;

# 離開
\q
```

### 效能測試

**使用 Artillery 進行負載測試**

```powershell
# 安裝 Artillery
npm install -g artillery

# 建立測試設定 `artillery-test.yml`
```

**建立 `artillery-test.yml`**
```yaml
config:
  target: "https://gomoku-backend.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
  socketio:
    transports: ["websocket"]

scenarios:
  - name: "Matchmaking flow"
    engine: socketio
    flow:
      - emit:
          channel: "matchmaking.join"
          data:
            playerName: "TestPlayer{{ $randomString() }}"
      - think: 2
      - wait:
          for:
            event: "matchmaking.joined"
      - think: 5
```

**執行測試**
```powershell
artillery run artillery-test.yml
```

---

## 🔧 常見問題排解

### 問題 1: WebSocket 無法連線

**症狀：**
- Console 顯示 `WebSocket connection error`
- Network tab 顯示 `404` 或 `Failed to connect`

**解決方案：**

1. **檢查 URL 正確性**
   ```javascript
   // ❌ 錯誤
   const SOCKET_URL = 'ws://gomoku-backend.onrender.com';
   
   // ✅ 正確（HTTPS 要用 wss 或直接用 https）
   const SOCKET_URL = 'https://gomoku-backend.onrender.com';
   ```

2. **檢查 CORS 設定**
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: ['https://gomoku.vercel.app'],
     credentials: true,
   });
   
   // backend/src/modules/gateway/game.gateway.ts
   @WebSocketGateway({
     cors: {
       origin: ['https://gomoku.vercel.app'],
       credentials: true,
     },
   })
   ```

3. **檢查 Render 服務狀態**
   - 前往 Render Dashboard
   - 確認服務是 "Live"
   - 檢查 Logs 有無錯誤

4. **測試 Backend 可達性**
   ```powershell
   curl https://gomoku-backend.onrender.com/health
   ```

### 問題 2: Render 服務休眠（Cold Start）

**症狀：**
- 首次連線需要等待 30-60 秒
- 一段時間沒活動後再連線很慢

**解決方案：**

1. **設定 Cron Job 定期喚醒**（見上方說明）

2. **升級到付費方案**
   - Starter Plan ($7/mo) 無休眠限制

3. **前端加入載入提示**
   ```vue
   <template>
     <div v-if="isWakingUp" class="loading-overlay">
       <p>正在喚醒伺服器，請稍候...</p>
       <p class="hint">首次連線可能需要 30-60 秒</p>
     </div>
   </template>
   
   <script setup lang="ts">
   import { ref, onMounted } from 'vue';
   import { socket } from './websocket/socket';
   
   const isWakingUp = ref(true);
   
   onMounted(() => {
     socket.connect();
     
     socket.on('connect', () => {
       isWakingUp.value = false;
     });
     
     // 60 秒超時
     setTimeout(() => {
       if (isWakingUp.value) {
         alert('連線超時，請重新整理頁面');
       }
     }, 60000);
   });
   </script>
   ```

### 問題 3: 資料庫連線失敗

**症狀：**
- Backend logs 顯示 `connection refused` 或 `SSL error`

**解決方案：**

1. **檢查 DATABASE_URL 格式**
   ```
   ✅ 正確
   postgresql://user:password@host:5432/database?sslmode=require
   
   ❌ 錯誤（缺少 SSL）
   postgresql://user:password@host:5432/database
   ```

2. **使用 Internal URL**
   - 在 Render 服務間連接，使用 Internal Database URL
   - 速度更快，無需公網流量

3. **檢查 SSL 設定**
   ```typescript
   // database.service.ts
   new Client({
     connectionString: process.env.DATABASE_URL,
     ssl: {
       rejectUnauthorized: false, // Render 需要此設定
     },
   });
   ```

### 問題 4: 前端環境變數無效

**症狀：**
- `import.meta.env.VITE_BACKEND_URL` 回傳 `undefined`

**解決方案：**

1. **確認環境變數前綴**
   ```
   ❌ BACKEND_URL (缺少 VITE_ 前綴)
   ✅ VITE_BACKEND_URL
   ```

2. **重新建置**
   ```powershell
   # Vercel 會自動重建，或手動觸發
   vercel --prod
   ```

3. **檢查 Vercel 設定**
   - 進入 Vercel Project Settings
   - Environment Variables
   - 確認變數已設定且沒有拼寫錯誤

4. **本地測試**
   ```powershell
   # 建立 .env.local
   echo "VITE_BACKEND_URL=https://gomoku-backend.onrender.com" > frontend/.env.local
   
   # 重新啟動開發伺服器
   cd frontend
   pnpm dev
   ```

### 問題 5: CORS 錯誤

**症狀：**
- Console 顯示 `Access-Control-Allow-Origin` 錯誤

**解決方案：**

1. **檢查後端 CORS 設定**
   ```typescript
   // 允許特定來源
   app.enableCors({
     origin: [
       'https://gomoku.vercel.app',
       'http://localhost:5173', // 開發環境
     ],
     credentials: true,
   });
   ```

2. **檢查 Gateway CORS**
   ```typescript
   @WebSocketGateway({
     cors: {
       origin: [
         'https://gomoku.vercel.app',
         'http://localhost:5173',
       ],
       credentials: true,
     },
   })
   ```

3. **更新 Render 環境變數**
   ```
   CORS_ORIGIN=https://gomoku.vercel.app,http://localhost:5173
   ```

4. **驗證前端請求來源**
   ```powershell
   # 使用 curl 測試
   curl -H "Origin: https://gomoku.vercel.app" `
        https://gomoku-backend.onrender.com/health `
        -v
   
   # 應該看到
   # Access-Control-Allow-Origin: https://gomoku.vercel.app
   ```

### 問題 6: 建置失敗

**症狀：**
- Render 或 Vercel 建置失敗

**解決方案：**

1. **檢查 Node 版本**
   ```json
   // package.json 加入
   {
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```
   
   或建立 `.nvmrc`
   ```
   18
   ```

2. **檢查依賴完整性**
   ```powershell
   # 清除並重新安裝
   Remove-Item -Recurse -Force node_modules
   Remove-Item pnpm-lock.yaml
   pnpm install
   ```

3. **檢查 TypeScript 錯誤**
   ```powershell
   pnpm --filter frontend type-check
   pnpm --filter backend build
   ```

4. **查看建置日誌**
   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployments → [點擊部署] → Build Logs

### 問題 7: 遊戲狀態不同步

**症狀：**
- 兩個玩家看到的棋盤不一致

**解決方案：**

1. **檢查事件發送**
   ```typescript
   // 確保使用 server.to(roomId).emit
   this.server.to(room.id).emit('game.moved', {
     position: move.position,
     currentPlayer: room.currentPlayer,
     board: room.board,
   });
   ```

2. **檢查房間加入**
   ```typescript
   // 玩家連線時加入房間
   client.join(room.id);
   ```

3. **前端接收處理**
   ```typescript
   socket.on('game.moved', (data) => {
     // 更新本地狀態
     gameStore.updateBoard(data.board);
     gameStore.setCurrentPlayer(data.currentPlayer);
   });
   ```

---

## 📚 補充資源

### 官方文件
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **NestJS**: https://docs.nestjs.com
- **Vue 3**: https://vuejs.org
- **Socket.io**: https://socket.io/docs/v4

### 監控與日誌
- **Render Logs**: Dashboard → Service → Logs
- **Vercel Logs**: Dashboard → Deployments → [Deployment] → Functions
- **PostgreSQL Logs**: Dashboard → Database → Logs

### 成本估算
| 服務 | 免費方案 | 付費方案 |
|------|---------|----------|
| Render Web Service | ✅ (有休眠) | $7/月起 |
| Render PostgreSQL | ✅ 90天後到期 | $7/月起 |
| Vercel | ✅ 充足額度 | $20/月起 (Pro) |
| **總計** | **$0** | **$14-27/月** |

### 效能優化建議
1. **使用 CDN** - Vercel 自動提供
2. **啟用 Gzip** - Render 自動啟用
3. **資料庫索引** - 已在 `init.sql` 中設定
4. **連線池** - 考慮使用 `pg-pool`
5. **快取** - 使用 Redis (Render 有提供)

---

## 🎉 部署完成確認

完成以下所有項目，即表示部署成功：

### 最終檢查清單

- [ ] 後端服務在 Render 上運行中
- [ ] PostgreSQL 資料庫已初始化
- [ ] 前端網站在 Vercel 上可存取
- [ ] WebSocket 連線正常（WSS over HTTPS）
- [ ] CORS 設定正確
- [ ] 兩個玩家可以成功配對
- [ ] 遊戲流程完整運作
- [ ] 統計資料正確記錄
- [ ] 所有環境變數已設定
- [ ] Health check 端點正常
- [ ] Logs 無錯誤訊息

### 取得你的線上網址

```
✅ 前端: https://gomoku.vercel.app
✅ 後端: https://gomoku-backend.onrender.com
✅ 資料庫: [Render 內部連線]
```

---

**祝部署順利！如有問題，請參考常見問題排解章節。** 🚀
