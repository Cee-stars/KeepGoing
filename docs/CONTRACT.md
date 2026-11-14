# KeepGoing 単語帳アプリ — 実装契約

ビルド不要の静的サイト（HTML + CSS + 素の JS）。`index.html` をそのまま開いても動くこと。
**ES Modules は使わない**（file:// で壊れるため）。各スクリプトはグローバルに 1 つだけ公開する。

## ファイル所有権（他人のファイルは絶対に編集しない）

| ファイル | 所有者 |
|---|---|
| `index.html`, `css/tokens.css`, `docs/CONTRACT.md`, `manifest.webmanifest` | リード（既に確定済み・変更禁止） |
| `css/styles.css` | A：デザイナー |
| `data/words.js`, `js/app.js` | B：プログラマー（単語帳） |
| `css/listening.css`, `js/listening.js` | C：プログラマー（リスニング） |

## 色・形

`css/tokens.css` の CSS 変数のみを使う。色を直書きしない。

## データ形式 — `data/words.js`

```js
window.WORDS = [
  {
    id: 1,                                  // 1 始まりの連番。表示される番号そのもの
    term: "better off",                     // 見出し語
    ipa: "/ˈbɛdər ˈɔːf/",                   // 発音記号（IPA、スラッシュ込み）
    meaning: "（〜の）方がいい",              // 日本語訳
    examples: [                             // 1〜2 本
      {
        en: "You're better off starting from the beginning than trying to find where you went wrong.",
        ja: "どこで間違ったか探そうとするよりも最初からやった方がいいよ。",
        enMark: ["better off"],             // en の中でこの文字列を青くハイライト
        jaMark: ["方がいい"]                 // ja の中でこの文字列を青くハイライト
      }
    ]
  },
  // ...
];
```

- 単語は **30 語ちょうど**（`id` は 1〜30）。リスニングの「1〜30」の既定レンジに対応する。
- `enMark` / `jaMark` は省略可（その場合ハイライトなし）。大文字小文字は無視してマッチさせる。

## `js/app.js` が公開する API（listening.js から使う）

```js
window.App = {
  words(),                 // => window.WORDS（配列そのもの）
  byId(id),                // => word | undefined
  scrollToWord(id),        // 単語帳ビューへ切替えてその単語までスクロール＋一瞬ハイライト
  showView("study"|"listening"),  // ビュー切替（タブの状態も更新する）
  onReady(fn)              // DOM 構築後に fn() を呼ぶ
};
```

`App.showView()` は `.view` の `hidden` 属性と `.is-active` クラス、`.tab` の `.is-active` /
`aria-selected` を切り替える。**タブのクリック処理は app.js が担当**（listening.js は触らない）。

## `js/listening.js` が公開する API

```js
window.Listening = {
  playFrom(id),            // その単語から再生開始
  stop(),
  isPlaying()
};
```

## マークアップ契約

`index.html` の `<template id="tpl-word-card">` と `<template id="tpl-example">` が唯一の正。
app.js はこれを `cloneNode(true)` して、以下のクラスに値を入れる：

- `.word-card[data-id]` — カード本体
- `.word-no` — 番号（白文字・丸いグレー背景）
- `.word-ipa` / `.word-term` / `.word-meaning`
- `.example-list` に `.example` を追加、`.example__en` / `.example__ja`
- ハイライトは `<mark class="hl">…</mark>` で包む

デザイナーはこのクラス名だけを前提にする。**新しい要素が必要なら必ずリードに言う**（勝手に
index.html を書き換えない）。

## 写真の再現ポイント（デザイナー向け）

1. カード上部：左端に細い縦のグレーの線（`.word-card__rail`）→ グレーの角丸四角アイコン
   （中にオレンジの山型カーブ）→ **その右に白文字＋丸いグレー背景の番号** → その右にテキスト群。
2. テキスト群は上から **発音記号（小・黒）**、**見出し語（特大・青・太字・イタリック）**、
   **日本語訳（大・黒・太字）**。
3. その下に `↓` の丸いグレーアイコン ＋ `example` のグレー文字 ＋ 右へ伸びる細い横罫線。
4. 例文カード：角丸・**薄い青の枠線**・ほぼ白の背景。中は英文（太字・黒、対象語だけ青）、
   **点線の区切り**、和訳（黒、対象語だけ青）。
5. 2 語目以降は同じカードが**下に続く**（縦スクロールの 1 カラム）。

## 動作確認

`node tools/check.js`（リードが用意）と、Playwright でのスクリーンショットで確認する。
