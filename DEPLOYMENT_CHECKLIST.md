# 🚀 五子棋網站部署檢查清單

## 📋 部署前檢查

### 本地環境
- [ ] Node.js 版本 >= 18.0.0
- [ ] pnpm 已安裝
- [ ] Git 已安裝並設定
- [ ] 所有依賴已安裝 (`pnpm install`)
- [ ] 本地開發環境正常運作
- [ ] TypeScript 編譯無錯誤 (`pnpm type-check`)

### 帳號準備
- [ ] GitHub 帳號已建立
- [ ] Render 帳號已建立 (https://render.com)
- [ ] Vercel 帳號已建立 (https://vercel.com)

### 程式碼準備
- [ ] 所有變更已提交
- [ ] 程式碼已推送到 GitHub
- [ ] Repository 設定為 Public 或正確授權

---

## 🔧 後端部署 (Render)

### Web Service 建立
- [ ] 在 Render Dashboard 建立 New Web Service
- [ ] 連接 GitHub repository
- [ ] 設定 Root Directory: `backend`
- [ ] 設定 Build Command: `npm install -g pnpm && pnpm install && pnpm build`
- [ ] 設定 Start Command: `node dist/src/main`
- [ ] 選擇 Region（建議：Singapore）
- [ ] 選擇 Instance Type（Free 或 Starter）

### 環境變數設定
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `CORS_ORIGIN` = `https://your-app.vercel.app` (稍後更新)
- [ ] `DATABASE_URL` = `postgresql://...` (稍後設定)
- [ ] `WS_PORT` = `3001`
- [ ] `MAX_PLAYERS_PER_ROOM` = `2`
- [ ] `MATCHMAKING_TIMEOUT` = `30000`

### 部署驗證
- [ ] Build 成功完成
- [ ] Service 狀態顯示 "Live"
- [ ] 記錄 Backend URL: `https://_____.onrender.com`
- [ ] 測試 Health Check: `curl https://_____.onrender.com/health`
- [ ] Health Check 回應正常

---

## 🗄️ 資料庫部署 (Render PostgreSQL)

### PostgreSQL 建立
- [ ] 在 Render Dashboard 建立 PostgreSQL
- [ ] 設定 Database Name: `gomoku`
- [ ] 設定 Region（與後端相同）
- [ ] PostgreSQL Version: 15
- [ ] 選擇 Plan（Free 或 Starter）

### 連線資訊
- [ ] 複製 Internal Database URL
- [ ] 複製 External Database URL（本地使用）
- [ ] 記錄 Hostname
- [ ] 記錄 Port
- [ ] 記錄 Username
- [ ] 記錄 Password

### 資料庫初始化
- [ ] 方法 1: 使用 Render Web Shell 執行 `init.sql`
- [ ] 方法 2: 使用本地 psql 執行
  ```powershell
  $env:PGPASSWORD="password"
  psql -h hostname -U username -d gomoku -f backend/database/init.sql
  ```
- [ ] 方法 3: 使用 Node.js migration
  ```powershell
  $env:DATABASE_URL="postgresql://..."
  node backend/database/migrate.js
  ```

### 驗證資料表
- [ ] 連接到資料庫
- [ ] 執行 `\dt` 確認所有資料表已建立
- [ ] 確認以下資料表存在：
  - [ ] users
  - [ ] game_rooms
  - [ ] matchmaking_queue
  - [ ] game_stats
  - [ ] game_history
  - [ ] player_sessions

### 更新後端環境變數
- [ ] 回到 Render Backend Service
- [ ] 更新 `DATABASE_URL` 為 Internal Database URL
- [ ] 儲存並等待自動重新部署
- [ ] 檢查 Logs 確認資料庫連線成功

---

## 🎨 前端部署 (Vercel)

### 環境變數準備
- [ ] 建立 `frontend/.env.production`
- [ ] 設定 `VITE_BACKEND_URL` = Render Backend URL
- [ ] 設定 `VITE_SOCKET_URL` = Render Backend URL

### 本地建置測試
- [ ] 執行 `cd frontend && pnpm build`
- [ ] 建置成功無錯誤
- [ ] 執行 `pnpm preview` 測試建置結果
- [ ] 本地預覽正常運作

### Vercel 部署
- [ ] 方法 1: 使用 Vercel CLI
  - [ ] 安裝: `npm install -g vercel`
  - [ ] 登入: `vercel login`
  - [ ] 部署: `vercel --prod`
  
- [ ] 方法 2: 使用 GitHub 整合（推薦）
  - [ ] 前往 vercel.com
  - [ ] Import Git Repository
  - [ ] 選擇 gomoku repository
  - [ ] Framework Preset: Vite
  - [ ] 設定 Build Command
  - [ ] 設定 Output Directory: `frontend/dist`

### Vercel 環境變數
- [ ] `VITE_BACKEND_URL` = `https://your-backend.onrender.com`
- [ ] `VITE_SOCKET_URL` = `https://your-backend.onrender.com`

### 部署驗證
- [ ] Build 成功完成
- [ ] 記錄 Frontend URL: `https://_____.vercel.app`
- [ ] 訪問網站可正常載入
- [ ] 開啟 Console 無錯誤

---

## 🔗 整合設定

### 更新 CORS
- [ ] 前往 Render Backend Service
- [ ] 更新 `CORS_ORIGIN` = `https://your-app.vercel.app`
- [ ] 如有多個網域，用逗號分隔
- [ ] 儲存並等待重新部署

### 測試整合
- [ ] 開啟前端網站
- [ ] 開啟瀏覽器 DevTools (F12)
- [ ] 檢查 Console 有 "WebSocket connected" 訊息
- [ ] 檢查 Network Tab 有 WebSocket 連線
- [ ] Status 應該是 "101 Switching Protocols"

---

## 🧪 功能測試

### WebSocket 連線
- [ ] 使用測試腳本: `node test-websocket.js`
- [ ] 連線成功
- [ ] Socket ID 顯示正常
- [ ] 加入匹配佇列成功

### 完整流程測試
- [ ] 使用測試腳本: `node test-full-flow.js`
- [ ] Player 1 連線成功
- [ ] Player 2 連線成功
- [ ] 配對成功
- [ ] 遊戲開始
- [ ] 落子同步正常

### 瀏覽器測試
- [ ] 開啟兩個瀏覽器視窗（或無痕模式）
- [ ] 兩個玩家都點擊「開始匹配」
- [ ] 自動配對成功
- [ ] 輪流下棋
- [ ] 棋子位置同步
- [ ] 五子連線判定正確
- [ ] 遊戲結果顯示

### 統計功能
- [ ] 遊戲結束後統計更新
- [ ] 勝敗場數正確
- [ ] 資料持久化

### 斷線處理
- [ ] 關閉一個玩家視窗
- [ ] 另一方收到勝利通知
- [ ] 房間正確清理

---

## 🔍 效能與監控

### Health Check
- [ ] `/health` 端點可訪問
- [ ] 回應格式正確
- [ ] Uptime 正常顯示

### 日誌檢查
- [ ] Render Backend Logs 無錯誤
- [ ] Vercel Build Logs 無錯誤
- [ ] WebSocket 連線日誌正常
- [ ] 資料庫查詢無錯誤

### 效能測試
- [ ] 頁面載入速度 < 3 秒
- [ ] WebSocket 連線延遲 < 100ms
- [ ] 落子回應延遲 < 50ms
- [ ] 多個房間同時運行正常

---

## 🛡️ 安全性檢查

### HTTPS/WSS
- [ ] 前端使用 HTTPS
- [ ] WebSocket 使用 WSS
- [ ] 無 Mixed Content 警告
- [ ] SSL 憑證有效

### CORS 設定
- [ ] CORS Origin 設定正確
- [ ] 不允許所有來源（生產環境）
- [ ] Credentials 設定正確

### 環境變數
- [ ] 敏感資訊不在程式碼中
- [ ] .env 檔案在 .gitignore 中
- [ ] 環境變數僅在平台設定

---

## 📱 跨裝置測試

### 桌面瀏覽器
- [ ] Chrome 正常
- [ ] Firefox 正常
- [ ] Safari 正常
- [ ] Edge 正常

### 行動裝置
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
- [ ] 觸控操作正常
- [ ] 螢幕尺寸適應

### 響應式設計
- [ ] 手機版面正常
- [ ] 平板版面正常
- [ ] 桌面版面正常
- [ ] 棋盤顯示正常

---

## 🎯 進階設定（可選）

### 自訂網域
- [ ] Vercel 新增網域
- [ ] DNS 記錄設定
- [ ] SSL 憑證啟用
- [ ] 更新 CORS 設定包含新網域

### 效能優化
- [ ] CDN 快取設定
- [ ] 資料庫索引優化
- [ ] 連線池設定
- [ ] Gzip 壓縮啟用

### 監控與警報
- [ ] Render Cron Job 設定（防休眠）
- [ ] Uptime 監控設定
- [ ] 錯誤追蹤設定
- [ ] 效能監控設定

---

## ✅ 最終確認

### 核心功能
- [ ] 玩家可以連線
- [ ] 匹配系統運作
- [ ] 遊戲可以進行
- [ ] 結果正確顯示
- [ ] 統計正確記錄

### 使用者體驗
- [ ] 介面流暢
- [ ] 無明顯延遲
- [ ] 錯誤訊息清楚
- [ ] 重連機制正常

### 穩定性
- [ ] 長時間運行穩定
- [ ] 記憶體使用正常
- [ ] 無記憶體洩漏
- [ ] 錯誤恢復正常

---

## 📝 部署資訊記錄

```
部署日期: _______________
前端 URL: https://_____.vercel.app
後端 URL: https://_____.onrender.com
資料庫: dpg-_____.singapore-postgres.render.com

環境變數設定:
✅ CORS_ORIGIN
✅ DATABASE_URL
✅ VITE_BACKEND_URL
✅ VITE_SOCKET_URL

測試結果:
✅ Health Check
✅ WebSocket 連線
✅ 完整流程
✅ 跨瀏覽器
```

---

## 🎉 部署完成！

恭喜！你的五子棋網站已成功部署到雲端。

### 下一步
1. 分享你的網站 URL
2. 收集使用者反饋
3. 持續監控效能
4. 定期備份資料庫
5. 規劃功能更新

### 維護提醒
- [ ] 定期檢查日誌
- [ ] 監控使用量
- [ ] 更新依賴套件
- [ ] 備份資料庫
- [ ] 審查安全性

---

**需要協助？**
- 📖 查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 💻 參考 [DEPLOYMENT_COMMANDS.md](./DEPLOYMENT_COMMANDS.md)
- 🐛 檢查常見問題排解章節
