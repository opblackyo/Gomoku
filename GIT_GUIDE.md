# Git 使用指南

本指南提供 Gomoku 專案的 Git 工作流程和常用命令。

## 目錄

- [基本概念](#基本概念)
- [初始設定](#初始設定)
- [日常工作流程](#日常工作流程)
- [分支管理](#分支管理)
- [常用命令](#常用命令)
- [最佳實踐](#最佳實踐)
- [故障排除](#故障排除)

## 基本概念

### Git 三個區域
- **工作區 (Working Directory)**：你正在編輯的檔案
- **暫存區 (Staging Area)**：準備提交的變更
- **版本庫 (Repository)**：已提交的歷史記錄

### 分支策略
```
main (master)     - 主分支，穩定版本
├── develop       - 開發分支
├── feature/*     - 功能分支
├── bugfix/*      - 錯誤修復分支
└── hotfix/*      - 緊急修復分支
```

## 初始設定

### 1. 設定使用者資訊

```bash
# 設定全域使用者名稱和信箱
git config --global user.name "你的名字"
git config --global user.email "your.email@example.com"

# 查看設定
git config --list
```

### 2. Clone 專案

```bash
# 使用 HTTPS
git clone https://github.com/username/Gomoku.git

# 使用 SSH
git clone git@github.com:username/Gomoku.git

# 進入專案目錄
cd Gomoku
```

### 3. 設定遠端倉庫

```bash
# 查看遠端倉庫
git remote -v

# 新增遠端倉庫
git remote add origin <repository-url>

# 修改遠端倉庫 URL
git remote set-url origin <new-url>
```

## 日常工作流程

### 1. 開始新功能

```bash
# 確保在最新的 main 分支
git checkout main
git pull origin main

# 建立新的功能分支
git checkout -b feature/your-feature-name
```

### 2. 進行開發

```bash
# 查看檔案狀態
git status

# 查看變更內容
git diff

# 將檔案加入暫存區
git add <file>              # 加入特定檔案
git add .                   # 加入所有變更
git add -p                  # 互動式加入（推薦）

# 提交變更
git commit -m "feat: 新增功能描述"

# 修改最後一次提交
git commit --amend
```

### 3. 推送到遠端

```bash
# 第一次推送新分支
git push -u origin feature/your-feature-name

# 後續推送
git push
```

### 4. 更新本地分支

```bash
# 拉取遠端變更
git pull origin main

# 或使用 rebase（保持歷史線性）
git pull --rebase origin main
```

## 分支管理

### 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包含遠端）
git branch -a

# 查看分支詳細資訊
git branch -v
```

### 建立和切換分支

```bash
# 建立新分支
git branch feature/new-feature

# 切換分支
git checkout feature/new-feature

# 建立並切換（推薦）
git checkout -b feature/new-feature

# 使用新語法（Git 2.23+）
git switch -c feature/new-feature
```

### 合併分支

```bash
# 切換到目標分支
git checkout main

# 合併功能分支
git merge feature/your-feature

# 使用 --no-ff 保留分支歷史
git merge --no-ff feature/your-feature
```

### 刪除分支

```bash
# 刪除本地分支
git branch -d feature/completed-feature

# 強制刪除
git branch -D feature/abandoned-feature

# 刪除遠端分支
git push origin --delete feature/completed-feature
```

## 常用命令

### 查看歷史

```bash
# 查看提交歷史
git log

# 簡潔顯示
git log --oneline

# 圖形化顯示
git log --graph --oneline --all

# 查看特定檔案的歷史
git log -- <file>

# 查看某次提交的詳細內容
git show <commit-hash>
```

### 撤銷變更

```bash
# 撤銷工作區的變更
git checkout -- <file>
git restore <file>          # 新語法

# 撤銷暫存區的變更（保留工作區）
git reset HEAD <file>
git restore --staged <file> # 新語法

# 撤銷最後一次提交（保留變更）
git reset --soft HEAD~1

# 撤銷最後一次提交（丟棄變更）
git reset --hard HEAD~1
```

### 暫存變更 (Stash)

```bash
# 暫存當前變更
git stash

# 暫存包含未追蹤的檔案
git stash -u

# 暫存時加上訊息
git stash save "WIP: 功能開發中"

# 查看暫存列表
git stash list

# 恢復最新的暫存
git stash pop

# 恢復特定暫存
git stash apply stash@{0}

# 刪除暫存
git stash drop stash@{0}

# 清空所有暫存
git stash clear
```

### 標籤管理

```bash
# 建立輕量標籤
git tag v1.0.0

# 建立附註標籤（推薦）
git tag -a v1.0.0 -m "版本 1.0.0 發布"

# 查看所有標籤
git tag

# 查看標籤詳細資訊
git show v1.0.0

# 推送標籤到遠端
git push origin v1.0.0

# 推送所有標籤
git push origin --tags

# 刪除本地標籤
git tag -d v1.0.0

# 刪除遠端標籤
git push origin --delete v1.0.0
```

### Rebase 操作

```bash
# 將當前分支 rebase 到 main
git rebase main

# 互動式 rebase（整理提交）
git rebase -i HEAD~3

# 繼續 rebase
git rebase --continue

# 跳過當前提交
git rebase --skip

# 中止 rebase
git rebase --abort
```

### Cherry-pick

```bash
# 挑選特定提交到當前分支
git cherry-pick <commit-hash>

# 挑選多個提交
git cherry-pick <commit1> <commit2>

# 挑選但不自動提交
git cherry-pick -n <commit-hash>
```

## 最佳實踐

### 提交訊息規範

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型：**
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件變更
- `style`: 程式碼格式（不影響功能）
- `refactor`: 重構
- `perf`: 效能優化
- `test`: 測試相關
- `chore`: 建構工具或輔助工具變更

**範例：**
```bash
git commit -m "feat(game): 新增五子棋勝利判定邏輯"
git commit -m "fix(websocket): 修復斷線重連問題"
git commit -m "docs(readme): 更新安裝說明"
```

### 分支命名規範

```
feature/功能名稱      # 新功能
bugfix/問題描述       # 錯誤修復
hotfix/緊急修復       # 緊急修復
refactor/重構內容     # 重構
docs/文件更新         # 文件
test/測試內容         # 測試
```

**範例：**
```bash
feature/matchmaking-system
bugfix/websocket-reconnection
hotfix/critical-game-crash
refactor/room-service
docs/api-documentation
```

### 工作流程建議

1. **小步提交**：每個提交只做一件事
2. **頻繁推送**：避免本地累積太多變更
3. **定期同步**：經常從 main 拉取最新變更
4. **Code Review**：使用 Pull Request 進行程式碼審查
5. **測試後提交**：確保程式碼可以運行再提交

### .gitignore 設定

專案已包含 `.gitignore`，常見忽略項目：

```gitignore
# 依賴
node_modules/
pnpm-lock.yaml

# 建構輸出
dist/
build/
*.tsbuildinfo

# 環境變數
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# 系統檔案
.DS_Store
Thumbs.db

# 日誌
*.log
logs/
```

## 故障排除

### 合併衝突

```bash
# 1. 查看衝突檔案
git status

# 2. 手動編輯衝突檔案，解決衝突標記
# <<<<<<< HEAD
# 你的變更
# =======
# 別人的變更
# >>>>>>> branch-name

# 3. 標記為已解決
git add <resolved-file>

# 4. 完成合併
git commit
```

### 誤刪檔案恢復

```bash
# 恢復已刪除但未提交的檔案
git checkout HEAD -- <file>

# 從特定提交恢復檔案
git checkout <commit-hash> -- <file>
```

### 找回遺失的提交

```bash
# 查看所有操作記錄
git reflog

# 恢復到特定狀態
git reset --hard <commit-hash>
```

### 清理本地分支

```bash
# 刪除已合併的本地分支
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# 清理遠端已刪除的分支引用
git fetch --prune
```

### 大檔案問題

```bash
# 如果誤提交大檔案，使用 BFG Repo-Cleaner
# 或 git filter-branch 清理歷史

# 查看大檔案
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort --numeric-sort --key=2 | \
  tail -n 10
```

## 進階技巧

### Git Alias

在 `~/.gitconfig` 中設定別名：

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
    amend = commit --amend --no-edit
```

使用：
```bash
git st          # 等同於 git status
git visual      # 圖形化顯示歷史
```

### Git Hooks

在 `.git/hooks/` 目錄下建立腳本：

**pre-commit**（提交前檢查）：
```bash
#!/bin/sh
# 執行 linter
pnpm lint

# 執行測試
pnpm test
```

**commit-msg**（檢查提交訊息）：
```bash
#!/bin/sh
# 檢查提交訊息格式
commit_msg=$(cat $1)
if ! echo "$commit_msg" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
    echo "錯誤：提交訊息格式不正確"
    exit 1
fi
```

### 子模組 (Submodules)

```bash
# 新增子模組
git submodule add <repository-url> <path>

# Clone 包含子模組的專案
git clone --recursive <repository-url>

# 更新子模組
git submodule update --init --recursive

# 更新到最新版本
git submodule update --remote
```

## 團隊協作

### Pull Request 流程

1. **建立功能分支**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **開發並提交**
   ```bash
   git add .
   git commit -m "feat: 實作新功能"
   ```

3. **推送到遠端**
   ```bash
   git push -u origin feature/new-feature
   ```

4. **在 GitHub/GitLab 建立 Pull Request**

5. **Code Review 後合併**

6. **刪除功能分支**
   ```bash
   git checkout main
   git pull
   git branch -d feature/new-feature
   ```

### 同步 Fork 的專案

```bash
# 新增上游倉庫
git remote add upstream <original-repository-url>

# 拉取上游變更
git fetch upstream

# 合併到本地 main
git checkout main
git merge upstream/main

# 推送到你的 fork
git push origin main
```

## 參考資源

- [Git 官方文件](https://git-scm.com/doc)
- [Pro Git 書籍（中文版）](https://git-scm.com/book/zh-tw/v2)
- [GitHub Guides](https://guides.github.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

## 快速參考

### 常用命令速查表

| 命令 | 說明 |
|------|------|
| `git status` | 查看狀態 |
| `git add .` | 加入所有變更 |
| `git commit -m "msg"` | 提交變更 |
| `git push` | 推送到遠端 |
| `git pull` | 拉取遠端變更 |
| `git checkout -b branch` | 建立並切換分支 |
| `git merge branch` | 合併分支 |
| `git log --oneline` | 查看歷史 |
| `git stash` | 暫存變更 |
| `git stash pop` | 恢復暫存 |

---

**最後更新：** 2025-11-24
**適用版本：** Git 2.30+


