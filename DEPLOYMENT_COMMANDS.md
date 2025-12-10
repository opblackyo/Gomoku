# ============================================
# 五子棋網站部署快速指令參考
# ============================================

# ============================================
# 1. 前置準備
# ============================================

# 檢查環境
node --version          # 需要 18+
pnpm --version         # 需要 pnpm
git --version

# 安裝依賴
pnpm install

# 本地測試
pnpm dev:backend       # 測試後端
pnpm dev:frontend      # 測試前端（新視窗）

# ============================================
# 2. Git 推送到 GitHub
# ============================================

# 初始化（首次）
git init
git add .
git commit -m "Initial commit: Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/gomoku.git
git branch -M main
git push -u origin main

# 後續更新
git add .
git commit -m "Update: [描述]"
git push

# ============================================
# 3. Render 後端部署
# ============================================

# 在 Render Dashboard:
# 1. New + → Web Service
# 2. Connect GitHub repository
# 3. 設定：
#    - Name: gomoku-backend
#    - Root Directory: backend
#    - Build Command: npm install -g pnpm && pnpm install --no-frozen-lockfile && pnpm build
#    - Start Command: node dist/src/main
# 4. 環境變數：
#    NODE_ENV=production
#    PORT=3001
#    CORS_ORIGIN=https://gomoku.vercel.app
#    DATABASE_URL=[稍後設定]

# 使用 Render CLI（可選）
npm install -g @render/cli
render login
render deploy

# 查看日誌
render logs gomoku-backend

# ============================================
# 4. Render PostgreSQL 部署
# ============================================

# 在 Render Dashboard:
# 1. New + → PostgreSQL
# 2. 設定：
#    - Name: gomoku-db
#    - Database: gomoku
#    - Region: Singapore
# 3. 複製 Internal Database URL
# 4. 更新後端環境變數 DATABASE_URL

# 連接資料庫（本地）
$env:PGPASSWORD="your_password"
psql -h dpg-xxxxx.singapore-postgres.render.com -U gomoku_user -d gomoku -p 5432

# 執行初始化
psql -h dpg-xxxxx.singapore-postgres.render.com `
     -U gomoku_user `
     -d gomoku `
     -p 5432 `
     -f backend/database/init.sql

# 或使用 Node.js migration
$env:DATABASE_URL="postgresql://..."
node backend/database/migrate.js

# ============================================
# 5. Vercel 前端部署
# ============================================

# 使用 Vercel CLI
npm install -g vercel
vercel login

# 部署（預覽）
vercel

# 部署到生產環境
vercel --prod

# 使用 GitHub 整合（推薦）:
# 1. 前往 vercel.com
# 2. Import Git Repository
# 3. 選擇 gomoku repository
# 4. 設定環境變數：
#    VITE_BACKEND_URL=https://gomoku-backend.onrender.com
#    VITE_SOCKET_URL=https://gomoku-backend.onrender.com
# 5. Deploy

# ============================================
# 6. 測試部署
# ============================================

# 測試後端健康檢查
curl https://gomoku-backend.onrender.com/health

# 測試 WebSocket
node test-websocket.js

# 測試完整流程
node test-full-flow.js

# 測試 CORS
curl -H "Origin: https://gomoku.vercel.app" `
     -H "Access-Control-Request-Method: GET" `
     -X OPTIONS `
     https://gomoku-backend.onrender.com/health -v

# ============================================
# 7. 資料庫管理
# ============================================

# 查詢資料表
psql -h dpg-xxxxx.singapore-postgres.render.com -U gomoku_user -d gomoku

# 在 psql 中：
\dt                    # 列出所有資料表
\d game_rooms          # 查看資料表結構
SELECT * FROM game_rooms LIMIT 5;  # 查詢資料
\q                     # 離開

# 備份資料庫
pg_dump -h dpg-xxxxx.singapore-postgres.render.com `
        -U gomoku_user `
        -d gomoku `
        -F c `
        -f backup_$(Get-Date -Format 'yyyyMMdd').dump

# 恢復資料庫
pg_restore -h dpg-xxxxx.singapore-postgres.render.com `
           -U gomoku_user `
           -d gomoku `
           -v backup_20231211.dump

# ============================================
# 8. 環境變數管理
# ============================================

# Vercel 環境變數
vercel env ls                          # 列出
vercel env add VITE_BACKEND_URL        # 新增
vercel env rm VITE_BACKEND_URL         # 刪除

# Render 環境變數
# 在 Dashboard → Service → Environment 設定

# ============================================
# 9. 查看日誌
# ============================================

# Render 後端日誌
# Dashboard → Service → Logs

# Vercel 前端日誌
# Dashboard → Deployments → [Deployment] → Build Logs

# Vercel 函數日誌
vercel logs [deployment-url]

# ============================================
# 10. 常用維護指令
# ============================================

# 重新部署 Render（無程式碼變更）
# Dashboard → Service → Manual Deploy → Deploy latest commit

# 重新部署 Vercel
vercel --prod

# 清理 node_modules 並重新安裝
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml
pnpm install

# 類型檢查
pnpm --filter frontend type-check
pnpm --filter backend build

# 建置測試
pnpm build

# ============================================
# 11. 疑難排解
# ============================================

# WebSocket 無法連線
# 1. 檢查 CORS_ORIGIN 設定
# 2. 檢查前端 VITE_SOCKET_URL
# 3. 檢查後端服務狀態
# 4. 查看 Console 錯誤訊息

# 資料庫連線失敗
# 1. 檢查 DATABASE_URL 格式
# 2. 確認包含 ?sslmode=require
# 3. 使用 Internal URL（Render 內部連接）

# 建置失敗
# 1. 檢查 Node 版本（.nvmrc）
# 2. 清除快取重新建置
# 3. 查看建置日誌找出錯誤

# CORS 錯誤
# 1. 更新 CORS_ORIGIN 包含前端 URL
# 2. 檢查 Gateway CORS 設定
# 3. 重新部署後端

# ============================================
# 12. 完整部署檢查清單
# ============================================

# [ ] 程式碼推送到 GitHub
# [ ] Render 後端服務已建立
# [ ] Render PostgreSQL 已建立
# [ ] 資料庫已初始化（執行 init.sql）
# [ ] 後端環境變數已設定
# [ ] Vercel 前端已部署
# [ ] 前端環境變數已設定
# [ ] CORS 設定正確
# [ ] /health 端點可訪問
# [ ] WebSocket 連線正常
# [ ] 匹配流程測試通過
# [ ] 遊戲流程測試通過

# ============================================
# 完成！
# ============================================

# 你的網站 URL：
# 前端: https://gomoku.vercel.app
# 後端: https://gomoku-backend.onrender.com
# 健康檢查: https://gomoku-backend.onrender.com/health
