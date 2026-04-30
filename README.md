# union-mail-transer

ブラウザ版 Outlook (OWA / 新Outlook for Windows) で、組合の **本部メールを区メンバーに半自動転送** するための Office.js アドイン。

配信は GitHub Pages: <https://akuniondigit.github.io/union-mail-transer/>

## 機能概要

- メール編集画面のリボンに「組合メール転送」ボタンを追加（`MessageComposeCommandSurface`）
- 開いている **転送下書き** の本文・件名・宛先を一括整形
  - 本文の `==＜転送メール＞==` マーカー行より上を自動で除去
  - 区名 / 代表委員名のプレースホルダ（`●区` / `●●`）を設定値で置換
  - 件名から `FW:` `RE:` `転送:` などのプレフィックスを除去
  - To / Cc をリストで上書き
- 添付・インライン画像はネイティブの転送下書きが持っているものをそのまま温存（アドインは触らない）
- To: 「送信先（組合）」 /「送信先（組合＋経営管理職）」のリストから択一
- Cc: 別リストの全員を一括設定
- リスト・設定は **CSV ペーストで管理** し localStorage に保存
- 整形後はユーザー操作で **[後で送信] → 18:00** または **[送信]** を押す

## セットアップ

### 1. 依存インストール

```bash
npm install
```

### 2. アイコン用意（任意）

`assets/` に `icon-16.png` `icon-32.png` `icon-80.png` を配置。なくてもサイドロードは可能だが Outlook 上で警告が出る。

### 3. GitHub Pages にデプロイ

`main` への push をトリガーに `.github/workflows/deploy.yml` が自動でビルド・デプロイする（`actions/deploy-pages@v4`）。

初回のみ、リポジトリ設定で Pages を有効化する:

1. GitHub の Settings → Pages → Build and deployment → **Source: "GitHub Actions"** を選択
2. `main` に push（または Actions 画面から `Deploy to GitHub Pages` を `Run workflow` で手動実行）
3. 成功すると <https://akuniondigit.github.io/union-mail-transer/> で taskpane.html / commands.html / 各種アセットが配信される

`manifest.xml` の URL はこの Pages 配信を参照する前提なので、デプロイ完了後にサイドロードすること。

ローカルで成果物を確認したい場合のみ:

```bash
npm run build
```

で `dist/` に同じものが生成される。

### 4. アドインをサイドロード

**OWA (outlook.office.com)** の場合:

1. 設定（歯車）→「Outlook のすべての設定を表示」→ 全般 → カスタマイズ → アドインを取得
2. 「マイ アドイン」→「カスタム アドイン」→「ファイルから追加」
3. このプロジェクトの `manifest.xml` を選択

**新 Outlook for Windows** も同様に「アドインを取得」から追加可能。

## 使い方

1. 本部から届いたメールを開く
2. Outlook ネイティブの **「転送」** を押して編集画面に入る
3. リボンの「組合メール転送」をクリック → タスクペインが開く
4. **初回のみ**:
   - 区名・代表委員名を入力して保存
   - 送信先（組合）/ 送信先（組合＋経営管理職）/ Cc の CSV を貼って保存
     - 形式: `name,email` 1 行 1 件（ヘッダー行 `name,email` 可）
5. To: ラジオで送信先リストを選択
6. 「本部メールを転送下書きにする」をクリック
   - 編集中の下書きの本文・件名・To・Cc が書き換わる
7. 内容を確認し **[後で送信] → 本日 18:00** を選択（または即送信なら [送信]）

## 開発

### スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run build` | 本番ビルド（`dist/`） |
| `npm run build:dev` | 開発ビルド（sourcemap 付き） |
| `npm run validate` | manifest.xml バリデーション |
| `npm run test` | vitest 単体テスト |

### ディレクトリ

```
src/
├── core/        # bodyFilter / bodyTemplate / csvParser / subject (純ロジック)
├── lists/       # listStore / settingsStore (localStorage 永続化)
├── outlook/     # itemReader (Office.js compose API ラッパ)
├── taskpane/    # UI (HTML/CSS/TS)
├── commands/    # リボンボタンハンドラ
└── config.ts    # 定数 (FORWARD_GUIDE_TEXT)
```

## 制限事項 / 既知の制約

- **18:00 予約はネイティブ UI 任せ**: Office.js には予約送信 API がないので、ユーザーが [後で送信] を手動で押す
- **リスト共有なし**: localStorage に保存されるためブラウザ / PC ごと。複数端末で使うなら別途 export / import が必要（将来検討）
- **マーカー未検出時は本文無加工**: `==＜転送メール＞==` 行が見つからない場合、本文は変更せず件名・宛先のみ更新される
- **添付の操作は行わない**: ネイティブ転送下書きが付けた添付・インライン画像はそのまま残る

## ライセンス

private
