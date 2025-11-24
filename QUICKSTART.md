# 快速開始指南

## 專案已完成初始化 ✅

專案框架已經建立完成，包含：
- ✅ Monorepo 結構（pnpm workspace）
- ✅ 共用類型定義（common/types）
- ✅ Frontend（Vue3 + Vite + Pinia + Socket.IO）
- ✅ Backend（NestJS + Socket.IO）
- ✅ 完整的 TypeScript 配置
- ✅ 類型檢查通過

## 立即開始開發

### 方法一：使用 VSCode 內建終端（推薦）

1. **啟動後端**
   - 開啟新終端
   - 執行：
     ```bash
     cd backend
     pnpm start:dev
     ```
   - 等待看到 "Backend server is running on http://localhost:3001"

2. **啟動前端**
   - 開啟另一個新終端
   - 執行：
     ```bash
     cd frontend
     pnpm dev
     ```
   - 等待看到 "Local: http://localhost:3000"

3. **開啟瀏覽器**
   - 訪問 http://localhost:3000

### 方法二：使用 npm scripts

在根目錄執行：
```bash
# 同時啟動前後端
pnpm dev
```

## 測試遊戲

1. 開啟兩個瀏覽器視窗（或使用無痕模式）
2. 兩個視窗都訪問 http://localhost:3000
3. 輸入玩家名稱並點擊「尋找對手」
4. 配對成功後即可開始遊戲

## 專案結構說明

```
gomoku/
├── common/types/          # 共用類型定義
│   ├── player.types.ts    # 玩家相關類型
│   ├── game.types.ts      # 遊戲相關類型
│   ├── room.types.ts      # 房間相關類型
│   └── events.types.ts    # WebSocket 事件類型
│
├── frontend/              # Vue3 前端
│   ├── src/
│   │   ├── components/    # BoardComponent.vue
│   │   ├── views/         # MatchmakingView, GameView
│   │   ├── stores/        # game.ts (Pinia store)
│   │   ├── websocket/     # socket.ts (WebSocket 客戶端)
│   │   └── App.vue
│   └── vite.config.ts
│
└── backend/               # NestJS 後端
    ├── src/
    │   ├── modules/
    │   │   ├── gateway/      # game.gateway.ts (WebSocket)
    │   │   ├── matchmaking/  # matchmaking.service.ts
    │   │   ├── room/         # room.service.ts
    │   │   └── game/         # game.service.ts (遊戲邏輯)
    │   └── main.ts
    └── nest-cli.json
```

## 核心功能已實現

### Frontend
- ✅ WebSocket 連線管理
- ✅ 配對系統 UI
- ✅ 遊戲棋盤組件（15x15）
- ✅ 玩家資訊顯示
- ✅ 回合指示
- ✅ 落子互動
- ✅ 投降功能
- ✅ Pinia 狀態管理

### Backend
- ✅ WebSocket Gateway
- ✅ 配對服務（自動配對兩位玩家）
- ✅ 房間管理（建立、更新、刪除）
- ✅ 遊戲邏輯（落子驗證、勝負判定）
- ✅ 五子連珠檢測（四個方向）
- ✅ 投降處理
- ✅ 斷線處理

## 下一步開發建議

### 功能增強
- [ ] 加入遊戲歷史記錄
- [ ] 實現觀戰功能
- [ ] 加入聊天系統
- [ ] 實現悔棋功能
- [ ] 加入計時器
- [ ] 實現排行榜

### UI/UX 改進
- [ ] 加入音效
- [ ] 改進棋盤視覺效果
- [ ] 加入動畫效果
- [ ] 響應式設計優化
- [ ] 加入主題切換

### 技術優化
- [ ] 加入單元測試
- [ ] 加入 E2E 測試
- [ ] 實現持久化存儲（資料庫）
- [ ] 加入用戶認證系統
- [ ] 實現房間列表功能

## 常用命令

```bash
# 安裝依賴
pnpm install

# 開發模式
pnpm dev                    # 同時啟動前後端
pnpm dev:frontend           # 只啟動前端
pnpm dev:backend            # 只啟動後端

# 建構
pnpm build                  # 建構所有專案
pnpm build:frontend         # 只建構前端
pnpm build:backend          # 只建構後端

# 類型檢查
pnpm type-check             # 檢查所有專案

# 程式碼檢查
pnpm lint                   # 檢查所有專案
```

## 故障排除

### 如果遇到 WebSocket 連線問題
1. 確認後端已啟動在 port 3001
2. 檢查瀏覽器控制台是否有錯誤訊息
3. 確認防火牆沒有阻擋連線

### 如果遇到類型錯誤
```bash
pnpm type-check
```

### 如果遇到依賴問題
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 技術支援

查看完整文檔：[README.md](./README.md)
查看專案規範：[rule.txt](./rule.txt)

