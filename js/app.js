/* =============================================================
   KeepGoing — 単語帳ビュー
   ・window.WORDS からカードを描画
   ・検索（部分一致・デバウンス）、タブ切替、window.App の公開
   ES Modules は使わない。グローバルには window.App だけを足す。
   ============================================================= */
(function () {
  'use strict';

  var WORDS = [];
  var cardIndex = [];     // { id, el, haystack } の配列
  var ready = false;      // 描画完了フラグ
  var readyQueue = [];    // onReady で積まれたコールバック
  var searchTimer = null;
  var currentQuery = '';
  var playlistIds = null;   // null = すべて表示 / 配列 = その id だけ表示
  var flashTimer = null;

  var els = {};

  /* ---------- 小物 ---------------------------------------------------- */

  // 正規表現のメタ文字を無効化する
  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // 検索・ハイライト用に正規化（大文字小文字を無視）
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase();
  }

  /* ---------- ハイライト ------------------------------------------------
     text の中の marks（複数可・大小無視）を <mark class="hl"> で包む。
     innerHTML は一切使わず、テキストノードと要素を組み立てて返す。
     ------------------------------------------------------------------- */
  function buildHighlighted(text, marks) {
    var frag = document.createDocumentFragment();
    text = String(text == null ? '' : text);
    if (!marks || !marks.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }

    // 全マークの出現位置を集める
    var ranges = [];
    for (var i = 0; i < marks.length; i++) {
      var m = String(marks[i] == null ? '' : marks[i]);
      if (!m) continue;
      var re = new RegExp(escapeRe(m), 'gi');
      var hit;
      while ((hit = re.exec(text)) !== null) {
        if (hit[0].length === 0) { re.lastIndex++; continue; }
        ranges.push({ start: hit.index, end: hit.index + hit[0].length });
      }
    }
    if (!ranges.length) {
      frag.appendChild(document.createTextNode(text));
      return frag;
    }

    // 位置順に並べて重なりを統合する
    ranges.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var merged = [];
    for (var j = 0; j < ranges.length; j++) {
      var last = merged[merged.length - 1];
      if (last && ranges[j].start <= last.end) {
        if (ranges[j].end > last.end) last.end = ranges[j].end;
      } else {
        merged.push({ start: ranges[j].start, end: ranges[j].end });
      }
    }

    // テキストと mark を交互に積む（元の表記はそのまま残す）
    var pos = 0;
    for (var k = 0; k < merged.length; k++) {
      var r = merged[k];
      if (r.start > pos) {
        frag.appendChild(document.createTextNode(text.slice(pos, r.start)));
      }
      var mk = document.createElement('mark');
      mk.className = 'hl';
      mk.textContent = text.slice(r.start, r.end);
      frag.appendChild(mk);
      pos = r.end;
    }
    if (pos < text.length) {
      frag.appendChild(document.createTextNode(text.slice(pos)));
    }
    return frag;
  }

  /* ---------- 描画 ---------------------------------------------------- */

  function buildCard(word, tplCard, tplExample) {
    var card = tplCard.content.firstElementChild.cloneNode(true);
    card.setAttribute('data-id', String(word.id));

    var no = card.querySelector('.word-no');
    if (no) no.textContent = String(word.id);

    var ipa = card.querySelector('.word-ipa');
    if (ipa) ipa.textContent = word.ipa || '';

    var term = card.querySelector('.word-term');
    if (term) term.textContent = word.term || '';

    var meaning = card.querySelector('.word-meaning');
    if (meaning) meaning.textContent = word.meaning || '';

    var list = card.querySelector('.example-list');
    var examples = Array.isArray(word.examples) ? word.examples : [];
    if (list) {
      for (var i = 0; i < examples.length; i++) {
        var ex = examples[i] || {};
        var exEl = tplExample.content.firstElementChild.cloneNode(true);
        var en = exEl.querySelector('.example__en');
        var ja = exEl.querySelector('.example__ja');
        if (en) en.appendChild(buildHighlighted(ex.en, ex.enMark));
        if (ja) ja.appendChild(buildHighlighted(ex.ja, ex.jaMark));
        list.appendChild(exEl);
      }
    }

    // 検索対象文字列（見出し語・訳・発音記号・例文の英日）
    var parts = [word.term, word.meaning, word.ipa];
    for (var j = 0; j < examples.length; j++) {
      parts.push(examples[j] && examples[j].en, examples[j] && examples[j].ja);
    }

    return { el: card, haystack: norm(parts.join(' \u0001 ')) };
  }

  function render() {
    var tplCard = document.getElementById('tpl-word-card');
    var tplExample = document.getElementById('tpl-example');
    if (!els.list || !tplCard || !tplExample) return;

    // DocumentFragment にまとめて 1 回で挿入する
    var frag = document.createDocumentFragment();
    cardIndex = [];
    for (var i = 0; i < WORDS.length; i++) {
      var w = WORDS[i];
      if (!w || typeof w !== 'object') continue;
      var built = buildCard(w, tplCard, tplExample);
      frag.appendChild(built.el);
      cardIndex.push({ id: w.id, el: built.el, haystack: built.haystack });
    }
    els.list.textContent = '';
    els.list.appendChild(frag);
  }

  /* ---------- 検索 ---------------------------------------------------- */

  function applyFilter(raw) {
    var q = norm(raw).trim();
    currentQuery = q;
    var shown = 0;

    // プレイリストの id を引きやすいように集合化する
    var inList = null;
    if (playlistIds) {
      inList = {};
      for (var k = 0; k < playlistIds.length; k++) inList[playlistIds[k]] = true;
    }

    for (var i = 0; i < cardIndex.length; i++) {
      var item = cardIndex[i];
      var hit = (!inList || inList[item.id] === true) &&
                (!q || item.haystack.indexOf(q) !== -1);
      if (hit) {
        item.el.hidden = false;
        shown++;
      } else {
        item.el.hidden = true;
      }
    }

    if (els.count) {
      els.count.textContent = (q || playlistIds)
        ? shown + ' / ' + cardIndex.length + '語'
        : cardIndex.length + '語';
    }
    if (els.empty) els.empty.hidden = shown !== 0;
  }

  /* プレイリストによる絞り込み（playlists.js から呼ばれる）
     ids に配列を渡すとその単語だけ、null を渡すとすべて表示する */
  function setPlaylistFilter(ids) {
    playlistIds = (Object.prototype.toString.call(ids) === '[object Array]') ? ids.slice() : null;
    applyFilter(els.search ? els.search.value : '');
  }

  function onSearchInput() {
    var value = els.search ? els.search.value : '';
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      searchTimer = null;
      applyFilter(value);
    }, 120);
  }

  function clearSearch() {
    if (searchTimer) { clearTimeout(searchTimer); searchTimer = null; }
    if (els.search) els.search.value = '';
    applyFilter('');
  }

  /* ---------- ビュー切替（タブ制御は app.js の責務） --------------------- */

  function showView(name) {
    var views = document.querySelectorAll('.view');
    var tabs = document.querySelectorAll('.tab[data-view]');
    var target = 'study';          // ビューは単語帳だけ

    for (var i = 0; i < views.length; i++) {
      var v = views[i];
      var isTarget = v.id === 'view-' + target;
      v.hidden = !isTarget;
      if (isTarget) v.classList.add('is-active');
      else v.classList.remove('is-active');
    }
    for (var j = 0; j < tabs.length; j++) {
      var t = tabs[j];
      var on = t.getAttribute('data-view') === target;
      if (on) t.classList.add('is-active');
      else t.classList.remove('is-active');
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    return target;
  }

  function bindTabs() {
    var tabs = document.querySelectorAll('.tab[data-view]');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function (e) {
        showView(e.currentTarget.getAttribute('data-view'));
      });
    }
  }

  /* ---------- スクロール ------------------------------------------------ */

  function findCard(id) {
    var key = String(id);
    for (var i = 0; i < cardIndex.length; i++) {
      if (String(cardIndex[i].id) === key) return cardIndex[i].el;
    }
    return null;
  }

  function scrollToWord(id) {
    showView('study');
    // 絞り込み中は対象が隠れている可能性があるので検索を解除する
    if (currentQuery) clearSearch();

    var card = findCard(id);
    if (!card) return false;

    // プレイリストで絞り込み中に、その外の単語へ飛ぶ場合は「すべて」に戻す
    if (card.hidden) {
      if (window.Playlists && typeof window.Playlists.setActive === 'function') {
        window.Playlists.setActive('all');
      } else {
        setPlaylistFilter(null);
      }
    }

    // sticky なヘッダーに隠れないよう余白を確保する
    var bar = document.getElementById('app-bar');
    var offset = (bar ? bar.offsetHeight : 0) + 12;
    card.style.scrollMarginTop = offset + 'px';

    try {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      card.scrollIntoView();
    }

    // 一瞬ハイライト（1.4 秒）
    if (flashTimer) clearTimeout(flashTimer);
    var prev = document.querySelectorAll('.word-card.is-flash');
    for (var i = 0; i < prev.length; i++) prev[i].classList.remove('is-flash');
    card.classList.add('is-flash');
    flashTimer = setTimeout(function () {
      flashTimer = null;
      card.classList.remove('is-flash');
    }, 1400);

    return true;
  }

  /* ---------- 起動 ------------------------------------------------------ */

  function init() {
    els.list = document.getElementById('word-list');
    els.search = document.getElementById('study-search');
    els.count = document.getElementById('study-count');
    els.empty = document.getElementById('study-empty');

    WORDS = Array.isArray(window.WORDS) ? window.WORDS : [];

    render();
    bindTabs();
    applyFilter('');

    if (els.search) {
      els.search.addEventListener('input', onSearchInput);
      // 検索欄での Esc は入力をクリアする
      els.search.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') clearSearch();
      });
    }

    ready = true;
    var queue = readyQueue;
    readyQueue = [];
    for (var i = 0; i < queue.length; i++) {
      try { queue[i](); } catch (err) { console.error(err); }
    }
  }

  /* ---------- 公開 API -------------------------------------------------- */

  window.App = {
    words: function () {
      return WORDS;
    },
    byId: function (id) {
      var key = String(id);
      for (var i = 0; i < WORDS.length; i++) {
        if (String(WORDS[i].id) === key) return WORDS[i];
      }
      return undefined;
    },
    scrollToWord: scrollToWord,
    showView: showView,
    setPlaylistFilter: setPlaylistFilter,
    cardFor: findCard,
    onReady: function (fn) {
      if (typeof fn !== 'function') return;
      if (ready) fn();
      else readyQueue.push(fn);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
