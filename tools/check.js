/**
 * 統合チェック: アプリ全体が壊れていないかを自動検証する。
 *   実行: node tools/check.js
 * 失敗したら終了コード 1。
 */
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', 'index.html');
const results = [];
const ok = (name, cond, note = '') => results.push({ name, pass: !!cond, note });

(async () => {
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
  ok('単語データが17件', data.count === 17, `count=${data.count}`);
  ok('idが1..17の連番', data.idsSequential);
  ok('必須フィールドが揃っている', data.hasFields);
  ok('ハイライト文字列が例文に実在する', data.markOk);
  ok('1語目が approach', data.first && data.first.term === 'approach',
     JSON.stringify(data.first));

  // --- 描画 ---------------------------------------------------------------
  ok('カードが17枚描画された', await page.locator('.word-card').count() === 17);
  ok('番号バッジに値が入っている', (await page.locator('.word-card').first().locator('.word-no').textContent()).trim() === '1');
  ok('ハイライト<mark>が存在する', await page.locator('.word-card mark').count() > 0);
  ok('例文が描画されている', await page.locator('.example').count() >= 17);

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
  ok('検索で絞り込める', visibleAfter > 0 && visibleAfter < 17, `visible=${visibleAfter}`);
  await page.fill('#study-search', '');
  await page.waitForTimeout(350);

  // --- リスニング ----------------------------------------------------------
  await page.click('.tab[data-view="listening"]');
  await page.waitForTimeout(500);
  ok('リスニングビューが表示される', await page.locator('#view-listening').isVisible());
  ok('リスニングUIが描画されている', (await page.locator('#lsn-root').innerHTML()).length > 200);
  ok('リスニングのJS APIが公開されている',
     await page.evaluate(() => !!(window.Listening && typeof window.Listening.playFrom === 'function')));
  ok('単語帳のJS APIが公開されている',
     await page.evaluate(() => !!(window.App && typeof window.App.scrollToWord === 'function')));

  await page.screenshot({ path: '/tmp/check-listening.png', fullPage: false });
  await page.click('.tab[data-view="study"]');
  await page.waitForTimeout(400);
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
  console.log('screenshots: /tmp/check-study.png  /tmp/check-listening.png');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
