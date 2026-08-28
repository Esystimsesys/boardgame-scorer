# ボードゲーム得点記録アプリ

**公開URL: https://esystimsesys.github.io/boardgame-scorer/**

ボードゲームの得点を、その場でスマホに記録するための PWA。
サーバーは持たず、記録は端末（localStorage）の中だけに保存する。ホーム画面に追加すればオフラインでも動く。

計画・要件・デザイン方針は [`docs/00-plan.md`](./docs/00-plan.md) を参照。

## できること

- **プレイヤー名簿**: 追加・改名・並べ替え・退避（削除ではなく退避なので過去の記録が壊れない）
- **ゲーム作成**: プリセット（汎用ポイント／マイナスあり／失点式／金額／勝利数／麻雀素点）を選び、
  単位・小数桁・増減単位・ワンタップ値・集計方法（合計／平均／最大／最終）・勝敗の向き（高い方／低い方）を調整できる
- **得点の記録**: ラウンド × プレイヤーの表。セルをタップすると下からテンキーが出て、`＋/−` でマイナスも入力できる。
  「次の人へ」で同じ回の次の人に進む。未入力（—）と 0 は区別して保存される
- **途中経過**: 集計方法と勝敗の向きに従った合計と順位（同点は同順位）を常時表示
- **ひとつ戻す**: 直前の記録・回の追加・削除・終了を1段階だけ取り消せる
- **履歴**: 過去のゲームの一覧・再開・削除
- **デザインの切り替え**: 紙 / レトロ / ミニマル（設定 → デザイン）
- **書き出し・読み込み**: JSON でバックアップと復元。全消去も設定から

## 起動方法

```bash
npm install
npm run dev      # 開発サーバー（Service Worker は動かない）
```

その他:

```bash
npm run build    # 型チェック + ビルド（dist/ に Service Worker と manifest も生成される）
npm run preview  # ビルド結果をローカルで確認。ここでは Service Worker も動く
npm run lint     # oxlint
```

### スマホの実機で確認するとき

PWA としてインストールするには **https（または localhost）が必要**で、`--host` で LAN に出しただけの
`http://192.168.x.x:4173` ではインストールできない（画面の確認だけならこれで足りる）。実機で
「ホーム画面に追加 → オフラインで起動」まで試すなら、どちらかを使う。

```bash
# 方法1: 自己署名証明書をローカルに用意する
mkcert -install && mkcert 192.168.x.x
# 生成した証明書を vite の server.https に指定して npm run dev -- --host

# 方法2: 一時的な https の URL を作る（外部に公開されるので、確認が終わったら止める）
npm run build && npm run preview -- --port 4173
cloudflared tunnel --url http://localhost:4173
```

## 配信

`main` に push すると GitHub Actions（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）が
lint とビルドを通して GitHub Pages に上げる。プロジェクトページは `/boardgame-scorer/` 配下に置かれるため、
配信用のビルドは `npm run build:pages`（`GITHUB_PAGES=true` で vite の `base` を切り替える）で行う。

GitHub Pages は存在しないパスに 404 を返してクライアント側のルーティングまで届かないので、
`index.html` を `404.html` にも複製している（`/players` などを直接開いても動く）。

## ディレクトリ構成

```text
docs/                 計画書
mockups/              デザイン検討用の静的 HTML モック（themed.html がテーマ切り替えの見本）
public/               アイコン・favicon
src/
  components/         Layout（共通の枠）、ScoreInputSheet（得点入力のボトムシート）
  pages/              画面ごとのコンポーネント（Home / Players / NewGame / Scoreboard / History / Settings）
  lib/                score.ts（集計・順位・表示書式）、presets.ts（ルールのプリセット）、date.ts
  store/              AppStore.tsx（状態と永続化）、context.ts、useApp.ts、storage.ts
  styles/             tokens.css（テーマトークン）、global.css（リセット・共通レイアウト）
  types.ts            データモデルの型定義
vite.config.ts        PWA（manifest / Service Worker）の設定
```

## 設計のきまりごと

- **色・余白・文字サイズ・罫線は `src/styles/tokens.css` のトークン経由でだけ使う**。
  コンポーネント側に16進カラーや px を直接書かない。テーマを3つ持てているのはこの規律のおかげなので、
  新しい値が必要になったらトークンを足す。
- テーマによる差はまずトークンで表現し、それで足りない構造だけを
  `:global([data-theme='retro']) .xxx` の形で各コンポーネントの CSS Module に書く。**HTML は分岐させない**。
- 数値の表示は必ず `src/lib/score.ts` の `formatValue` / `formatCell` を通す（符号・小数桁・3桁区切り・接頭記号をここに集約している）。
- 得点は常に符号付きの数値で保持し、「ポイント / 金額 / 勝利数」といった違いは
  `ScoreRule`（表示と集計のルール）だけで表す。

## データの保存

`localStorage` のキー `bgs:v1` に状態全体を JSON で保存している（`version` を持たせてあるので将来の移行が可能）。
壊れた JSON や localStorage が使えない環境でも、アプリは空の状態で起動する。
