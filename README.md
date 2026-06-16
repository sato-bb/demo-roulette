# Roulette Socket MVP

タブレット操作用の `/controller` と、結果表示用の `/display` を分けた Socket.IO 製の目押しルーレットMVPです。

## ルール

ルーレットの表示は `△ → ○ → × → ◻︎` の順で切り替わります。
コントローラーで `START` して、各ステップで `STOP` します。

目標順は以下です。

1. △
2. ○
3. ×
4. ◻︎

4つすべて順番通りに止められたら勝ちです。
途中で外したら失敗です。

## 起動

```bash
npm install
npm run dev
```

`npm run dev` は SCSS の監視コンパイルとサーバー起動を同時に行います。

## スタイル（SCSS）

画面の見た目は `scss/` 以下の SCSS からビルドします。

```text
scss/
  _variables.scss   # 色・フォントなどの変数
  _mixins.scss      # 共通 mixin
  display.scss      # ディスプレイ画面
  controller.scss   # コントローラー画面
```

```bash
npm run build:css   # 1回だけコンパイル
npm run watch:css   # 変更を監視してコンパイル
```

コンパイル結果は `public/display/style.css` と `public/controller/style.css` に出力されます。
カスタマイズするときは SCSS を編集してください。

## URL

```text
http://localhost:3002/controller
http://localhost:3002/display
```

## 構成

```text
src/
  server.js
  gameState.js
  judge.js
scss/
  _variables.scss
  _mixins.scss
  display.scss
  controller.scss
public/
  controller/
    index.html
    controller.js
    style.css
  display/
    index.html
    display.js
    style.css
```

## 調整ポイント

ルーレットの速度は `src/gameState.js` の `tickMs` で変更できます。
シンボルや目標順は `src/judge.js` の `SYMBOLS`, `TARGET_SEQUENCE` で変更できます。
