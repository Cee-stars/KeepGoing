/* ==========================================================================
   KeepGoing — プレイリスト
     ・単語帳を「すべて / 10語ずつの自動セット / 自分で作ったリスト」で絞り込む
     ・カードの ＋ ボタンから好きなリストに入れる
     ・プレイリストをそのままリスニングで再生できる
     ・先頭へ戻るボタン
   公開するグローバルは window.Playlists だけ。保存先は localStorage。
   ========================================================================== */
(function () {
  'use strict';

  var LS_KEY = 'keepgoing.playlists.v1';
  var AUTO_SIZE = 10;        // 自動セット 1 つあたりの語数
  var FAV_ID = 'fav';        // 最初から用意しておくリスト

  /* 最初から入れておくプレイリスト。
     1 度だけ自動で追加され、あとは普通のリストと同じ（消したら復活しない）。 */
  var SEEDS = [
    {
      id: 'conv',
      name: '会話によく出る',
      ids: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47]
    }
  ];

  function seedCopies() {
    var out = [];
    for (var i = 0; i < SEEDS.length; i++) {
      out.push({ id: SEEDS[i].id, name: SEEDS[i].name, ids: SEEDS[i].ids.slice() });
    }
    return out;
  }

  function seedKeys() {
    var out = [];
    for (var i = 0; i < SEEDS.length; i++) out.push(SEEDS[i].id);
    return out;
  }

  function hasStr(arr, v) {
    for (var i = 0; i < arr.length; i++) if (arr[i] === v) return true;
    return false;
  }

  /* ======================================================================
     1. 保存データ
     ====================================================================== */
  function defaults() {
    return {
      lists: [{ id: FAV_ID, name: 'お気に入り', ids: [] }].concat(seedCopies()),
      seeded: seedKeys(),    // 自動追加ずみの既定リスト（消しても戻さないための印）
      active: 'all'          // 'all' | 'auto:<from>-<to>' | 'pl:<id>'
    };
  }

  var S = defaults();
  var els = {};
  var built = false;

  function load() {
    var raw = null;
    try { raw = window.localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;

    if (isArray(o.lists)) {
      var out = [];
      for (var i = 0; i < o.lists.length; i++) {
        var l = o.lists[i];
        if (!l || typeof l !== 'object') continue;
        var id = String(l.id == null ? '' : l.id);
        var name = String(l.name == null ? '' : l.name).slice(0, 24);
        if (!id || !name) continue;
        out.push({ id: id, name: name, ids: intList(l.ids) });
      }
      if (out.length) S.lists = out;
    }
    // お気に入りは必ず残しておく
    if (!findList(FAV_ID)) S.lists.unshift({ id: FAV_ID, name: 'お気に入り', ids: [] });

    // まだ一度も追加していない既定リストだけを入れる（ユーザーが消したものは戻さない）
    S.seeded = [];
    if (isArray(o.seeded)) {
      for (var j = 0; j < o.seeded.length; j++) S.seeded.push(String(o.seeded[j]));
    }
    var added = false;
    for (var k = 0; k < SEEDS.length; k++) {
      if (hasStr(S.seeded, SEEDS[k].id)) continue;
      if (!findList(SEEDS[k].id)) {
        S.lists.push({ id: SEEDS[k].id, name: SEEDS[k].name, ids: SEEDS[k].ids.slice() });
      }
      S.seeded.push(SEEDS[k].id);
      added = true;
    }

    if (typeof o.active === 'string') S.active = o.active;
    if (added) save();
  }

  function save() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ======================================================================
     2. 小物
     ====================================================================== */
  function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }

  function toInt(v, d) {
    var n = parseInt(v, 10);
    return isNaN(n) ? d : n;
  }

  function intList(v) {
    var out = [], seen = {}, i, n;
    if (!isArray(v)) return out;
    for (i = 0; i < v.length; i++) {
      n = toInt(v[i], 0);
      if (n > 0 && !seen[n]) { seen[n] = true; out.push(n); }
    }
    return out;
  }

  function words() {
    if (window.App && typeof window.App.words === 'function') return window.App.words() || [];
    return isArray(window.WORDS) ? window.WORDS : [];
  }

  function wordById(id) {
    if (window.App && typeof window.App.byId === 'function') return window.App.byId(id);
    var ws = words();
    for (var i = 0; i < ws.length; i++) if (String(ws[i].id) === String(id)) return ws[i];
    return undefined;
  }

  function findList(id) {
    for (var i = 0; i < S.lists.length; i++) if (S.lists[i].id === id) return S.lists[i];
    return null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function newId() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  /* ======================================================================
     3. 自動セット（10語ずつ）
     ====================================================================== */
  function autoGroups() {
    var ws = words();
    if (ws.length <= AUTO_SIZE) return [];   // 少ないときはセットを出さない
    var ids = [], i;
    for (i = 0; i < ws.length; i++) {
      var n = toInt(ws[i].id, 0);
      if (n > 0) ids.push(n);
    }
    ids.sort(function (a, b) { return a - b; });

    var groups = [];
    for (i = 0; i < ids.length; i += AUTO_SIZE) {
      var chunk = ids.slice(i, i + AUTO_SIZE);
      groups.push({
        key: 'auto:' + chunk[0] + '-' + chunk[chunk.length - 1],
        name: chunk[0] + '-' + chunk[chunk.length - 1],
        ids: chunk
      });
    }
    return groups;
  }

  /* いま選ばれているものの id 配列（'all' のときは null = 絞り込みなし） */
  function activeIds() {
    var key = S.active;
    if (!key || key === 'all') return null;

    if (key.indexOf('auto:') === 0) {
      var groups = autoGroups();
      for (var i = 0; i < groups.length; i++) if (groups[i].key === key) return groups[i].ids;
      return null;                        // 語数が変わって消えたセット
    }
    if (key.indexOf('pl:') === 0) {
      var l = findList(key.slice(3));
      return l ? l.ids.slice() : null;
    }
    return null;
  }

  function activeName() {
    var key = S.active;
    if (!key || key === 'all') return 'すべて';
    if (key.indexOf('auto:') === 0) return key.slice(5);
    var l = findList(key.slice(3));
    return l ? l.name : 'すべて';
  }

  /* ======================================================================
     4. 絞り込みの反映
     ====================================================================== */
  function applyActive() {
    var ids = activeIds();
    if (window.App && typeof window.App.setPlaylistFilter === 'function') {
      window.App.setPlaylistFilter(ids);
    }
    renderBar();
  }

  function setActive(key) {
    S.active = String(key || 'all');
    save();
    applyActive();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
  }

  /* ======================================================================
     5. プレイリストの操作
     ====================================================================== */
  function createList(name) {
    var clean = String(name == null ? '' : name).trim().slice(0, 24);
    if (!clean) return null;
    var l = { id: newId(), name: clean, ids: [] };
    S.lists.push(l);
    save();
    return l;
  }

  function renameList(id, name) {
    var l = findList(id);
    var clean = String(name == null ? '' : name).trim().slice(0, 24);
    if (!l || !clean) return false;
    l.name = clean;
    save();
    renderBar();
    return true;
  }

  function removeList(id) {
    if (id === FAV_ID) return false;          // お気に入りは消さない
    for (var i = 0; i < S.lists.length; i++) {
      if (S.lists[i].id === id) {
        S.lists.splice(i, 1);
        if (S.active === 'pl:' + id) S.active = 'all';
        save();
        applyActive();
        refreshCardButtons();
        return true;
      }
    }
    return false;
  }

  function hasWord(listId, wordId) {
    var l = findList(listId);
    if (!l) return false;
    return l.ids.indexOf(toInt(wordId, -1)) !== -1;
  }

  function toggleWord(listId, wordId) {
    var l = findList(listId);
    var n = toInt(wordId, -1);
    if (!l || n < 0) return false;
    var at = l.ids.indexOf(n);
    if (at === -1) l.ids.push(n);
    else l.ids.splice(at, 1);
    l.ids.sort(function (a, b) { return a - b; });
    save();
    if (S.active === 'pl:' + listId) applyActive();
    else renderBar();
    markCardButton(n);
    return at === -1;                         // true = 追加した
  }

  /* その単語がどれか 1 つでもリストに入っているか */
  function inAnyList(wordId) {
    var n = toInt(wordId, -1);
    for (var i = 0; i < S.lists.length; i++) if (S.lists[i].ids.indexOf(n) !== -1) return true;
    return false;
  }

  /* ======================================================================
     6. プレイリストバー
     ====================================================================== */
  function chip(label, count, on, onClick) {
    var b = el('button', 'pl-chip' + (on ? ' is-on' : ''));
    b.type = 'button';
    b.appendChild(el('span', 'pl-chip__label', label));
    if (count != null) b.appendChild(el('span', 'pl-chip__count', String(count)));
    b.addEventListener('click', onClick);
    return b;
  }

  function renderBar() {
    if (!els.bar) return;
    els.bar.textContent = '';

    var row = el('div', 'pl-row');
    var ws = words();

    row.appendChild(chip('すべて', ws.length, S.active === 'all', function () { setActive('all'); }));

    var groups = autoGroups();
    for (var i = 0; i < groups.length; i++) {
      (function (g) {
        row.appendChild(chip(g.name, g.ids.length, S.active === g.key,
          function () { setActive(g.key); }));
      })(groups[i]);
    }

    for (var j = 0; j < S.lists.length; j++) {
      (function (l) {
        var c = chip(l.name, l.ids.length, S.active === 'pl:' + l.id,
          function () { setActive('pl:' + l.id); });
        c.classList.add('pl-chip--own');
        row.appendChild(c);
      })(S.lists[j]);
    }

    var add = el('button', 'pl-chip pl-chip--add');
    add.type = 'button';
    add.setAttribute('aria-label', 'プレイリストを作る');
    add.appendChild(el('span', 'pl-chip__label', '＋ 新規'));
    add.addEventListener('click', function () { openCreateDialog(null); });
    row.appendChild(add);

    els.bar.appendChild(row);

    // 絞り込み中だけ、下に操作列を出す
    var ids = activeIds();
    if (ids) {
      var act = el('div', 'pl-actions');
      var info = el('span', 'pl-actions__name', activeName() + '・' + ids.length + '語');
      act.appendChild(info);

      var bPlay = el('button', 'pl-act pl-act--play');
      bPlay.type = 'button';
      bPlay.textContent = 'これを聞く';
      bPlay.addEventListener('click', function () { playActive(); });
      act.appendChild(bPlay);

      if (S.active.indexOf('pl:') === 0) {
        var bEdit = el('button', 'pl-act');
        bEdit.type = 'button';
        bEdit.textContent = '名前を変更';
        bEdit.addEventListener('click', function () {
          openCreateDialog(findList(S.active.slice(3)));
        });
        act.appendChild(bEdit);

        if (S.active !== 'pl:' + FAV_ID) {
          var bDel = el('button', 'pl-act pl-act--danger');
          bDel.type = 'button';
          bDel.textContent = '削除';
          bDel.addEventListener('click', function () {
            openConfirmDelete(findList(S.active.slice(3)));
          });
          act.appendChild(bDel);
        }
      }
      els.bar.appendChild(act);
    }
  }

  /* プレイリストをリスニングで再生する */
  function playActive() {
    var ids = activeIds();
    if (!ids || !ids.length) return;
    if (!window.Listening || typeof window.Listening.setSelection !== 'function') return;
    if (window.App && typeof window.App.showView === 'function') window.App.showView('listening');
    try { window.scrollTo(0, 0); } catch (e) {}
    window.Listening.setSelection(ids, true);
  }

  /* ======================================================================
     7. モーダル（alert / prompt は使えないので自前で作る）
     ====================================================================== */
  function openModal(title, bodyEl, buttons) {
    closeModal();
    var back = el('div', 'pl-modal-back');
    var box = el('div', 'pl-modal');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.appendChild(el('h3', 'pl-modal__title', title));
    box.appendChild(bodyEl);

    var foot = el('div', 'pl-modal__foot');
    for (var i = 0; i < buttons.length; i++) {
      (function (b) {
        var btn = el('button', 'pl-btn' + (b.kind ? ' pl-btn--' + b.kind : ''), b.label);
        btn.type = 'button';
        btn.addEventListener('click', b.onClick);
        foot.appendChild(btn);
      })(buttons[i]);
    }
    box.appendChild(foot);
    back.appendChild(box);
    back.addEventListener('click', function (e) { if (e.target === back) closeModal(); });
    document.body.appendChild(back);
    els.modal = back;

    document.addEventListener('keydown', onModalKey);
    return box;
  }

  function onModalKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function closeModal() {
    if (els.modal && els.modal.parentNode) els.modal.parentNode.removeChild(els.modal);
    els.modal = null;
    document.removeEventListener('keydown', onModalKey);
  }

  /* 新規作成 / 名前の変更 */
  function openCreateDialog(list) {
    var body = el('div', 'pl-modal__body');
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'pl-input';
    input.maxLength = 24;
    input.placeholder = '例）今週の10語、苦手、会話でよく出る';
    input.value = list ? list.name : '';
    body.appendChild(input);

    var err = el('p', 'pl-err', '');
    err.hidden = true;
    body.appendChild(err);

    function commit() {
      var name = input.value.trim();
      if (!name) {
        err.textContent = '名前を入力してください。';
        err.hidden = false;
        input.focus();
        return;
      }
      if (list) {
        renameList(list.id, name);
      } else {
        var made = createList(name);
        if (made) { S.active = 'pl:' + made.id; save(); applyActive(); }
      }
      closeModal();
      refreshCardButtons();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
    });

    openModal(list ? 'プレイリストの名前' : 'プレイリストを作る', body, [
      { label: 'キャンセル', onClick: closeModal },
      { label: list ? '変更' : '作る', kind: 'primary', onClick: commit }
    ]);
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 30);
  }

  function openConfirmDelete(list) {
    if (!list) return;
    var body = el('div', 'pl-modal__body');
    body.appendChild(el('p', 'pl-modal__text',
      '「' + list.name + '」を削除します。単語そのものは消えません。'));
    openModal('プレイリストを削除', body, [
      { label: 'キャンセル', onClick: closeModal },
      { label: '削除', kind: 'danger', onClick: function () {
          removeList(list.id);
          closeModal();
        } }
    ]);
  }

  /* 単語をどのリストに入れるか選ぶシート */
  function openPickSheet(wordId) {
    var w = wordById(wordId);
    if (!w) return;

    var body = el('div', 'pl-modal__body');
    body.appendChild(el('p', 'pl-modal__text', '「' + w.term + '」を入れるプレイリスト'));

    var listBox = el('div', 'pl-pick');

    function drawRows() {
      listBox.textContent = '';
      for (var i = 0; i < S.lists.length; i++) {
        (function (l) {
          var row = el('label', 'pl-pick__row');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'pl-pick__cb';
          cb.checked = hasWord(l.id, wordId);
          cb.addEventListener('change', function () {
            toggleWord(l.id, wordId);
            cb.checked = hasWord(l.id, wordId);
            cnt.textContent = l.ids.length + '語';
          });
          row.appendChild(cb);
          row.appendChild(el('span', 'pl-pick__name', l.name));
          var cnt = el('span', 'pl-pick__count', l.ids.length + '語');
          row.appendChild(cnt);
          listBox.appendChild(row);
        })(S.lists[i]);
      }
    }
    drawRows();
    body.appendChild(listBox);

    var mk = el('button', 'pl-newlist', '＋ 新しいプレイリストを作る');
    mk.type = 'button';
    mk.addEventListener('click', function () {
      closeModal();
      // 作ったあとにそのリストへ入れてシートを開き直す
      var body2 = el('div', 'pl-modal__body');
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'pl-input';
      input.maxLength = 24;
      input.placeholder = '例）苦手、今週の10語';
      body2.appendChild(input);
      function commit2() {
        var made = createList(input.value);
        if (made) {
          toggleWord(made.id, wordId);
          renderBar();
        }
        closeModal();
        openPickSheet(wordId);
      }
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); commit2(); }
      });
      openModal('プレイリストを作る', body2, [
        { label: 'キャンセル', onClick: function () { closeModal(); openPickSheet(wordId); } },
        { label: '作る', kind: 'primary', onClick: commit2 }
      ]);
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 30);
    });
    body.appendChild(mk);

    openModal('プレイリストに追加', body, [
      { label: '閉じる', kind: 'primary', onClick: closeModal }
    ]);
  }

  /* ======================================================================
     8. カードの ＋ ボタン
     ====================================================================== */
  function markCardButton(wordId) {
    if (!window.App || typeof window.App.cardFor !== 'function') return;
    var card = window.App.cardFor(wordId);
    if (!card) return;
    var btn = card.querySelector('.word-add');
    if (!btn) return;
    var on = inAnyList(wordId);
    if (on) btn.classList.add('is-on');
    else btn.classList.remove('is-on');
    btn.setAttribute('aria-label', on ? 'プレイリストを編集' : 'プレイリストに追加');
  }

  function refreshCardButtons() {
    var cards = document.querySelectorAll('.word-card[data-id]');
    for (var i = 0; i < cards.length; i++) {
      markCardButton(toInt(cards[i].getAttribute('data-id'), -1));
    }
  }

  function bindCardButtons() {
    var list = document.getElementById('word-list');
    if (!list) return;
    // 1 つのリスナーでまかなう（カードは 30 枚以上になりうる）
    list.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('.word-add') : null;
      if (!btn) return;
      var card = btn.closest('.word-card');
      if (!card) return;
      e.preventDefault();
      openPickSheet(toInt(card.getAttribute('data-id'), -1));
    });
  }

  /* ======================================================================
     9. 先頭へ戻る
     ====================================================================== */
  function bindToTop() {
    var btn = document.getElementById('to-top');
    if (!btn) return;
    btn.addEventListener('click', function () {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
    });

    var ticking = false;
    function update() {
      ticking = false;
      var studyOpen = !document.getElementById('view-study').hasAttribute('hidden');
      btn.hidden = !(studyOpen && window.scrollY > 900);
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ======================================================================
     10. 起動
     ====================================================================== */
  function start() {
    if (built) return;
    built = true;

    els.bar = document.getElementById('pl-bar');
    load();

    // 保存されていた選択が今の単語数で成立しないときは「すべて」に戻す
    if (S.active !== 'all' && activeIds() === null) S.active = 'all';

    applyActive();
    bindCardButtons();
    refreshCardButtons();
    bindToTop();
  }

  function boot() {
    if (window.App && typeof window.App.onReady === 'function') window.App.onReady(start);
    else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }
  boot();

  /* ======================================================================
     11. 公開 API
     ====================================================================== */
  window.Playlists = {
    all: function () {
      var out = [];
      for (var i = 0; i < S.lists.length; i++) {
        out.push({ id: S.lists[i].id, name: S.lists[i].name, ids: S.lists[i].ids.slice() });
      }
      return out;
    },
    active: function () { return S.active; },
    setActive: setActive,
    create: createList,
    rename: renameList,
    remove: removeList,
    toggleWord: toggleWord,
    hasWord: hasWord,
    idsFor: activeIds
  };
})();
