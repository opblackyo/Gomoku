# Gomoku - 五子棋多人連線遊戲

基於 Vue3 + NestJS + WebSocket 的即時多人五子棋遊戲。

## 技術棧

### Frontend
- **Vue 3** - 前端框架
- **TypeScript** - 類型安全
- **Vite** - 建構工具
- **Pinia** - 狀態管理
- **Socket.IO Client** - WebSocket 客戶端

### Backend
- **NestJS** - 後端框架
- **TypeScript** - 類型安全
- **Socket.IO** - WebSocket 伺服器
- **UUID** - 唯一識別碼生成

### 專案結構
- **Monorepo** - 使用 pnpm workspace 管理
- **共用類型** - 前後端共用 TypeScript 類型定義

## 專案結構

```
gomoku/
├── common/              # 共用類型定義
│   └── types/
│       ├── player.types.ts
│       ├── game.types.ts
│       ├── room.types.ts
│       ├── events.types.ts
│       └── index.ts
├── frontend/            # Vue3 前端
│   ├── src/
│   │   ├── components/  # Vue 組件
│   │   ├── views/       # 頁面視圖
│   │   ├── stores/      # Pinia stores
│   │   ├── websocket/   # WebSocket 客戶端
│   │   └── main.ts
│   └── package.json
├── backend/             # NestJS 後端
│   ├── src/
│   │   ├── modules/
│   │   │   ├── gateway/      # WebSocket gateway
│   │   │   ├── matchmaking/  # 配對服務
│   │   │   ├── room/         # 房間管理
│   │   │   └── game/         # 遊戲邏輯
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── package.json         # Root package.json
├── pnpm-workspace.yaml  # pnpm workspace 配置
└── README.md
```

## 前置需求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

## 安裝步驟

### 1. 安裝 pnpm（如果尚未安裝）

```bash
npm install -g pnpm
```

### 2. Clone 專案

```bash
git clone <repository-url>
cd gomoku
```

### 3. 安裝所有依賴

```bash
pnpm install
```

這會自動安裝根目錄、frontend 和 backend 的所有依賴。

## 開發指南

### 啟動開發環境

#### 方式一：同時啟動前後端（推薦）

```bash
pnpm dev
```

這會同時啟動：
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

#### 方式二：分別啟動

**啟動後端：**
```bash
pnpm dev:backend
```

**啟動前端：**
```bash
pnpm dev:frontend
```

### 建構專案

```bash
# 建構所有專案
pnpm build

# 只建構前端
pnpm build:frontend

# 只建構後端
pnpm build:backend
```

### 類型檢查

```bash
pnpm type-check
```

### 程式碼檢查

```bash
pnpm lint
```

## 遊戲規則

- 棋盤大小：15x15
- 黑棋先手
- 同一格不能重複落子
- 一方連成五子即獲勝
- 玩家可以投降
- 玩家斷線視為認輸

## WebSocket 事件協議

### Client → Server

| 事件名稱 | 說明 | 參數 |
|---------|------|------|
| `matchmaking.join` | 加入配對隊列 | `{ playerName: string }` |
| `matchmaking.cancel` | 取消配對 | - |
| `game.move` | 落子 | `{ x: number, y: number, playerId: string }` |
| `game.surrender` | 投降 | - |
| `room.leave` | 離開房間 | - |

### Server → Client

| 事件名稱 | 說明 | 參數 |
|---------|------|------|
| `matchmaking.matched` | 配對成功 | `{ roomId: string }` |
| `room.state` | 房間狀態更新 | `Room` |
| `game.update` | 遊戲狀態更新 | `{ move: Move, board: Board, currentTurn: PlayerColor }` |
| `game.result` | 遊戲結束 | `{ winner?: string, winnerColor?: PlayerColor, reason: string }` |
| `error` | 錯誤訊息 | `{ message: string }` |

## 開發規範

### 命名規則
- TypeScript interface/class：使用 **PascalCase**
- Vue 組件：使用 **PascalCase**
- 事件名稱：使用 **lower-case + dot**（例如：`game.move`）

### 架構原則
- ✅ 後端為遊戲狀態的唯一權威來源
- ✅ 前端只負責顯示和發送事件
- ✅ 所有遊戲邏輯在後端處理
- ✅ 使用共用類型確保前後端一致性
- ❌ 禁止在前端判斷勝負
- ❌ 禁止在前端保存完整遊戲狀態

### 程式碼風格
- 使用 **async/await**，禁止 callback 風格
- WebSocket event handler 必須做錯誤處理
- 所有函數必須有明確的類型定義

## 部署

### 生產環境建構

```bash
pnpm build
```

### 啟動生產環境

**後端：**
```bash
cd backend
pnpm start:prod
```

**前端：**
建構後的檔案在 `frontend/dist/`，可以使用任何靜態檔案伺服器部署。

## 故障排除

### pnpm 安裝失敗
```bash
# 清除快取
pnpm store prune

# 重新安裝
rm -rf node_modules
pnpm install
```

### WebSocket 連線失敗
- 確認後端已啟動在 port 3001
- 檢查防火牆設定
- 確認 CORS 設定正確

### 類型錯誤
```bash
# 重新建構類型定義
pnpm type-check
```

## License

MIT

