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
