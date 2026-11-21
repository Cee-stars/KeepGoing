/**
 * 単語データを「どこからでも読める形」に書き出す。
 *   実行: node tools/export-words.js
 *
 * data/words.js（アプリが読む JS）を元に、次の 2 つを作り直す。
 *   - data/words.json … 機械が読む用。JS を解釈しなくてもそのまま読める
 *   - docs/WORDS.md   … 人と AI が読む用。1 ファイルで全単語を通読できる
 *
 * words.js を変更したら必ずこれを実行すること（tools/check.js が同期を検査する）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

global.window = {};
require(path.join(ROOT, 'data', 'words.js'));
const WORDS = global.window.WORDS || [];

if (!WORDS.length) {
  console.error('data/words.js から単語を読めませんでした。');
  process.exit(1);
}

/* ---------- data/words.json ---------- */
const json = {
  name: 'KeepGoing 単語帳',
  source: 'https://github.com/Cee-stars/KeepGoing/blob/main/data/words.js',
  count: WORDS.length,
  updated: new Date().toISOString().slice(0, 10),
  words: WORDS
};
fs.writeFileSync(
  path.join(ROOT, 'data', 'words.json'),
  JSON.stringify(json, null, 2) + '\n'
);

/* ---------- docs/WORDS.md ---------- */
const lines = [];
lines.push('# KeepGoing 単語一覧（' + WORDS.length + '語）');
lines.push('');
lines.push('**このファイルは自動生成です。直接編集しないでください。**');
lines.push('元データは `data/words.js`、作り直すには `node tools/export-words.js`。');
lines.push('');
lines.push('最終更新: ' + json.updated);
lines.push('');
lines.push('## 一覧');
lines.push('');
lines.push('| # | 単語 | 発音記号 | 意味 |');
lines.push('|---|---|---|---|');
WORDS.forEach(w => {
  lines.push(
    '| ' + w.id + ' | ' + w.term + ' | `' + w.ipa + '` | ' + w.meaning + ' |'
  );
});
lines.push('');
lines.push('## 例文つき');
lines.push('');
WORDS.forEach(w => {
  lines.push('### ' + w.id + '. ' + w.term);
  lines.push('');
  lines.push('- 発音: `' + w.ipa + '`');
  lines.push('- 意味: ' + w.meaning);
  lines.push('');
  (w.examples || []).forEach((e, i) => {
    lines.push((i + 1) + '. ' + e.en);
    lines.push('   ' + e.ja);
  });
  lines.push('');
});

fs.writeFileSync(path.join(ROOT, 'docs', 'WORDS.md'), lines.join('\n'));

console.log('書き出しました: data/words.json / docs/WORDS.md （' + WORDS.length + '語）');
