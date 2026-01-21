# 日報自動生成 問題調査レポート

## 🔍 問題の要因

### 1. パス設定が相対パス
**場所**: `sync_google_calendar.py` 19-22行目
```python
token_path = 'scripts/calendar_sync/token.json'
creds_path = 'scripts/calendar_sync/credentials.json'
```
**問題**: カレントディレクトリが `c:\Users\chatg\Obsidian Vault\papa` でないと動作しない

### 2. run_sync.bat のファイル破損
**場所**: `scripts/calendar_sync/run_sync.bat`
**問題**: ファイルの6-8行目に文字化け（UTF-16エンコーディングの混在）がある
```
p\0y\0t\0h\0o\0n\0...  ← 壊れている
```

### 3. タスクスケジューラ登録状態が不明
**場所**: `task_schedule.xml` は存在するが、Windowsタスクスケジューラに実際に登録されているか未確認

---

## ✅ 解決策

### 解決策1: パスを絶対パスに変更
```python
import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
token_path = os.path.join(SCRIPT_DIR, 'token.json')
creds_path = os.path.join(SCRIPT_DIR, 'credentials.json')
```

### 解決策2: run_sync.bat を再作成
```bat
@echo off
cd /d "c:\Users\chatg\Obsidian Vault\papa"
python scripts\calendar_sync\sync_google_calendar.py
```

### 解決策3: タスクスケジューラに再登録
```powershell
schtasks /create /xml "c:\Users\chatg\Obsidian Vault\papa\scripts\calendar_sync\task_schedule.xml" /tn "ObsidianDailySync"
```

---

## 📋 実行手順

1. [ ] `sync_google_calendar.py` のパスを絶対パスに修正
2. [ ] `run_sync.bat` を再作成（UTF-8で保存）
3. [ ] タスクスケジューラに登録（管理者権限必要）
4. [ ] 手動で `run_sync.bat` を実行してテスト
5. [ ] 翌日5:00に自動実行されることを確認
