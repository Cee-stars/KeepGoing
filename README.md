# KeepGoing 単語帳

英単語・チャンクの単語帳アプリ。写真のデザインをそのまま再現したカード表示です。

ビルド不要。`index.html` をブラウザで開くだけで動きます。

## 使い方

### 単語帳
- 1 枚のカードに「番号・発音記号・見出し語・日本語訳・例文 2 本（英日）」。
  2 語目以降は同じカードが下に続きます。
- 上の検索欄で、単語・意味・発音記号・例文を横断して絞り込めます。

### プレイリスト
単語が増えると一覧が長くなるので、**表示そのものを絞り込めます。**

- 検索欄の下のチップで切り替え：`すべて` / `1-10` `11-17`（10 語ずつの自動セット）/
  自分で作ったプレイリスト / `＋ 新規`。
- **カード右上の ＋** から、その単語を好きなプレイリストに入れられます。
  入っている単語は ＋ が青くなります。最初から「お気に入り」が 1 つ用意されています。
- 名前の変更・削除もその場でできます（削除してもプレイリストが消えるだけで、単語は残ります）。
- 選んでいるプレイリストと中身はブラウザに保存され、次に開いたときに復元されます。
- 長い一覧では、右下に **先頭へ戻る** ボタンが出ます。

## 単語データはどこにあるか

単語は**すべてこのリポジトリに保存**されています。端末の中だけに保存されるものはありません
（ブラウザに保存されるのはプレイリストの中身だけです）。

**別の会話の Claude に単語を読ませたいときは、次のどれかを渡してください。**

| 用途 | 場所 |
|---|---|
| 人も AI も読みやすい一覧（おすすめ） | [`docs/WORDS.md`](docs/WORDS.md) |
| 機械が読む用 | [`data/words.json`](data/words.json) |
| アプリが読む元データ | [`data/words.js`](data/words.js) |

リポジトリを開けない会話には、公開 URL をそのまま渡せば読めます。

```
https://cee-stars.github.io/KeepGoing/data/words.json
```

```
https://raw.githubusercontent.com/Cee-stars/KeepGoing/main/docs/WORDS.md
```

`words.json` と `WORDS.md` は `data/words.js` からの自動生成です。**`words.js` を編集したら
必ず次を実行してください。**（忘れると `node tools/check.js` が失敗します）

```bash
node tools/export-words.js
```

## 単語を追加する

`data/words.js` を編集するだけです。

```js
{
  id: 18,                                 // 連番
  term: "take after",
  ipa: "/ˈteɪk ˌæftər/",                  // 第一強勢 ˈ を入れる
  meaning: "〜に似ている",
  examples: [
    {
      en: "She really takes after her mother.",
      ja: "彼女は本当にお母さん似だ。",
      enMark: ["takes after"],            // en に実在する文字列（青くハイライト）
      jaMark: ["似"]                      // ja に実在する文字列
    }
  ]
}
```

`enMark` / `jaMark` は **例文に実際に含まれる文字列**にしてください（活用形が変わる場合はその形）。
追加したら `node tools/check.js` で検証できます（件数の期待値は適宜変更）。

## 構成

| ファイル | 役割 |
|---|---|
| `index.html` | 画面の骨組みとカードの `<template>` |
| `css/tokens.css` | 配色トークン（写真の色はここに集約） |
| `css/styles.css` | 単語帳の見た目 |
| `data/words.js` | 単語データ（元データ。ここを編集する） |
| `data/words.json` / `docs/WORDS.md` | 単語データの書き出し（自動生成。他のセッションに渡す用） |
| `tools/export-words.js` | 上の 2 つを作り直す |
| `js/app.js` | 一覧描画・検索・タブ・`window.App` |
| `js/playlists.js` / `css/playlists.css` | プレイリスト・先頭へ戻る・`window.Playlists` |
| `sw.js` / `manifest.webmanifest` | オフライン対応とホーム画面追加 |
| `_headers` | Cloudflare Pages 用のキャッシュ設定 |
| `tools/check.js` | Playwright による統合チェック |
| `docs/CONTRACT.md` | 実装契約（データ形式・API） |

## 開発

```bash
node tools/check.js
```

オフライン対応（Service Worker）とホーム画面追加は `http(s)` 配信時のみ有効です。
ローカルで試すときは次のように配信してください。

```bash
python3 -m http.server 8000
```

## 公開（Cloudflare Pages）

静的ファイルだけなのでビルドは不要です。Cloudflare Pages の設定はこれだけです。

| 項目 | 値 |
|---|---|
| Framework preset | `None` |
| Build command | （空のまま） |
| Build output directory | `/` |
| Production branch | `main` |

`main` に push するたびに自動でデプロイされます。
`_headers` で HTML と `sw.js` を `no-cache` にしているので、更新はすぐ反映されます。
