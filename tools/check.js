/**
 * 統合チェック: アプリ全体が壊れていないかを自動検証する。
 *   実行: node tools/check.js
 * 失敗したら終了コード 1。
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const results = [];
const ok = (name, cond, note = '') => results.push({ name, pass: !!cond, note });

/* 書き出したファイルが words.js と同じ中身かを見る。
   ずれていたら node tools/export-words.js を忘れている。 */
function checkExports() {
  let src = [];
  try {
    const g = {};
    new Function('window', fs.readFileSync(path.join(ROOT, 'data', 'words.js'), 'utf8'))(g);
    src = g.WORDS || [];
  } catch (e) {
    ok('data/words.js を読める', false, String(e));
    return;
  }

  let json = null;
  try {
    json = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'words.json'), 'utf8'));
  } catch (e) {
    ok('data/words.json がある', false, String(e));
  }
  if (json) {
    ok('words.json の件数が一致', json.count === src.length && (json.words || []).length === src.length,
       `json=${json.count} js=${src.length}`);
    const same = JSON.stringify(json.words) === JSON.stringify(src);
    ok('words.json の中身が一致', same, same ? '' : 'ずれています → node tools/export-words.js');
  }

  let md = '';
  try {
    md = fs.readFileSync(path.join(ROOT, 'docs', 'WORDS.md'), 'utf8');
  } catch (e) {
    ok('docs/WORDS.md がある', false, String(e));
  }
  if (md) {
    const missing = src.filter(w => md.indexOf('### ' + w.id + '. ' + w.term) === -1);
    ok('WORDS.md に全単語が載っている', missing.length === 0,
       missing.length ? '欠け: ' + missing.map(w => w.term).join(', ') : '');
    ok('WORDS.md の件数表記が一致', md.indexOf('（' + src.length + '語）') !== -1);
  }
}

(async () => {
  checkExports();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  const jsErrors = [];
  const failedReqs = [];
  page.on('pageerror', e => jsErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') jsErrors.push('console: ' + m.text()); });
  page.on('requestfailed', r => failedReqs.push(r.url()));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // --- データ -------------------------------------------------------------
  const data = await page.evaluate(() => {
    const w = window.WORDS || [];
    const markOk = w.every(x => (x.examples || []).every(ex =>
      (ex.enMark || []).every(m => ex.en.toLowerCase().includes(String(m).toLowerCase())) &&
      (ex.jaMark || []).every(m => ex.ja.includes(String(m)))
    ));
    return {
      count: w.length,
      idsSequential: w.every((x, i) => x.id === i + 1),
      hasFields: w.every(x => x.term && x.ipa && x.meaning && Array.isArray(x.examples) && x.examples.length),
      markOk,
      first: w[0] ? { term: w[0].term, ipa: w[0].ipa, meaning: w[0].meaning } : null
    };
  });
  // 件数は増え続けるので固定値では見ない。中身の整合だけを見る。
  const N = data.count;
  ok('単語データがある', N > 0, `count=${N}`);
  ok(`idが1..${N}の連番`, data.idsSequential);
  ok('必須フィールドが揃っている', data.hasFields);
  ok('ハイライト文字列が例文に実在する', data.markOk);
  ok('1語目が approach', data.first && data.first.term === 'approach',
     JSON.stringify(data.first));

  // --- 描画 ---------------------------------------------------------------
  ok(`カードが${N}枚描画された（データ件数と一致）`,
     await page.locator('.word-card').count() === N);
  ok('番号バッジに値が入っている', (await page.locator('.word-card').first().locator('.word-no').textContent()).trim() === '1');
  ok('ハイライト<mark>が存在する', await page.locator('.word-card mark').count() > 0);
  ok('例文が描画されている', await page.locator('.example').count() >= N);

  // --- スタイルが当たっているか（デザイナー担当分） -------------------------
  const style = await page.evaluate(() => {
    const term = document.querySelector('.word-term');
    const no   = document.querySelector('.word-no');
    const ex   = document.querySelector('.example');
    const mk   = document.querySelector('mark.hl');
    const cs = el => el ? getComputedStyle(el) : null;
    const t = cs(term), n = cs(no), e = cs(ex), m = cs(mk);
    return {
      termColor: t && t.color, termStyle: t && t.fontStyle, termSize: t && t.fontSize,
      noColor: n && n.color, noBg: n && n.backgroundColor,
      noW: no && no.getBoundingClientRect().width, noH: no && no.getBoundingClientRect().height,
      exBorder: e && e.borderTopColor, exRadius: e && e.borderTopLeftRadius,
      markBg: m && m.backgroundColor, markColor: m && m.color,
      bodyBg: getComputedStyle(document.body).backgroundColor
    };
  });
  ok('見出し語が青', /rgb\(59, *120, *240\)/.test(style.termColor || ''), style.termColor);
  ok('見出し語がイタリック', style.termStyle === 'italic', style.termStyle);
  ok('番号バッジが白文字', /rgb\(255, *255, *255\)/.test(style.noColor || ''), style.noColor);
  ok('番号バッジがグレー背景', /rgb\(141, *150, *166\)/.test(style.noBg || ''), style.noBg);
  ok('番号バッジが正円', style.noW && Math.abs(style.noW - style.noH) < 1.5, `${style.noW}x${style.noH}`);
  ok('例文カードに角丸がある', parseFloat(style.exRadius) > 4, style.exRadius);
  ok('markの黄色背景が消えている', /rgba\(0, *0, *0, *0\)|transparent/.test(style.markBg || ''), style.markBg);

  // --- 検索 ---------------------------------------------------------------
  await page.fill('#study-search', 'daylight');
  await page.waitForTimeout(350);
  const visibleAfter = await page.locator('.word-card:not([hidden])').count();
  ok('検索で絞り込める', visibleAfter > 0 && visibleAfter < N, `visible=${visibleAfter}`);
  await page.fill('#study-search', '');
  await page.waitForTimeout(350);

  // --- 残っていてはいけないもの --------------------------------------------
  ok('リスニングのUIが残っていない',
     await page.locator('#view-listening, #lsn-root, #mini-player, .tab[data-view="listening"]').count() === 0);
  ok('リスニングのJSが残っていない', await page.evaluate(() => !window.Listening));
  ok('単語帳のJS APIが公開されている',
     await page.evaluate(() => !!(window.App && typeof window.App.scrollToWord === 'function')));

  await page.screenshot({ path: '/tmp/check-study.png', fullPage: false });

  // --- エラー --------------------------------------------------------------
  const realFails = failedReqs.filter(u => !/favicon/.test(u));
  ok('JSエラーが無い', jsErrors.length === 0, jsErrors.slice(0, 5).join(' | '));
  ok('読み込み失敗が無い', realFails.length === 0, realFails.join(' | '));

  await browser.close();

  let bad = 0;
  for (const r of results) {
    if (!r.pass) bad++;
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.note ? '   -- ' + r.note : ''}`);
  }
  console.log(`\n${results.length - bad}/${results.length} passed`);
  console.log('screenshot: /tmp/check-study.png');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
