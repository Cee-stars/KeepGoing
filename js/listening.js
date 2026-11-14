/* ==========================================================================
   KeepGoing — リスニングモード （担当 C / js/listening.js）
   公開するグローバルは window.Listening だけ。
   描画先は #view-listening > #lsn-root と #mini-player。
   ========================================================================== */
(function () {
  'use strict';

  /* ======================================================================
     0. 環境判定
     ====================================================================== */
  var UA = navigator.userAgent || '';
  var IS_IOS = /iPad|iPhone|iPod/.test(UA) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Chrome の「15 秒で発話が止まる」バグ対策は Chromium 系だけに入れる
  var IS_CHROMIUM = /Chrome|Chromium|CriOS|Edg/.test(UA) && !IS_IOS;
  var HAS_TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  var HAS_MS  = !!(window.navigator && navigator.mediaSession);
  var synth   = HAS_TTS ? window.speechSynthesis : null;

  /* ======================================================================
     1. ユーティリティ
     ====================================================================== */
  function noop() {}

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }

  function clampNum(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) n = lo;
    return Math.min(hi, Math.max(lo, n));
  }

  function toInt(n, fallback) {
    n = parseInt(n, 10);
    return isFinite(n) ? n : fallback;
  }

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = (v || '').trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  /* ======================================================================
     2. 設定（localStorage に保存・復元）
     ====================================================================== */
  var LS_KEY = 'keepgoing.listening.v1';

  function defaults() {
    return {
      mode: 'range',        // 'range' | 'pick'
      start: 1,
      end: 30,
      picked: [],           // 個別選択モードの id 配列
      read: { term: true, meaning: true, exEn: true, exJa: false },
      repeat: 1,            // 各単語の繰り返し回数 1〜5
      rateEn: 1,            // 0.5〜1.5
      rateJa: 1,
      gap: 0.5,             // 単語間の間（秒）0〜3
      loop: 'none',         // 'none' | 'all' | 'one'
      shuffle: false
    };
  }

  var S = defaults();

  function loadSettings() {
    var raw = null;
    try { raw = window.localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;
    if (o.mode === 'pick' || o.mode === 'range') S.mode = o.mode;
    S.start = toInt(o.start, S.start);
    S.end = toInt(o.end, S.end);
    if (Array.isArray(o.picked)) {
      S.picked = o.picked.map(function (v) { return toInt(v, 0); })
                         .filter(function (v) { return v > 0; });
    }
    if (o.read && typeof o.read === 'object') {
      S.read.term    = !!o.read.term;
      S.read.meaning = !!o.read.meaning;
      S.read.exEn    = !!o.read.exEn;
      S.read.exJa    = !!o.read.exJa;
    }
    S.repeat = clampNum(toInt(o.repeat, S.repeat), 1, 5);
    S.rateEn = clampNum(o.rateEn, 0.5, 1.5);
    S.rateJa = clampNum(o.rateJa, 0.5, 1.5);
    S.gap    = clampNum(o.gap, 0, 3);
    if (o.loop === 'all' || o.loop === 'one' || o.loop === 'none') S.loop = o.loop;
    S.shuffle = !!o.shuffle;
  }

  function saveSettings() {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ======================================================================
     3. 単語データ（words.js / app.js は後から来る可能性がある）
     ====================================================================== */
  function words() {
    try {
      if (window.App && typeof window.App.words === 'function') {
        var a = window.App.words();
        if (Array.isArray(a)) return a;
      }
    } catch (e) {}
    return Array.isArray(window.WORDS) ? window.WORDS : [];
  }

  function wordById(id) {
    id = toInt(id, -1);
    try {
      if (window.App && typeof window.App.byId === 'function') {
        var w = window.App.byId(id);
        if (w) return w;
      }
    } catch (e) {}
    var ws = words();
    for (var i = 0; i < ws.length; i++) if (toInt(ws[i].id, -1) === id) return ws[i];
    return null;
  }

  function minId() {
    var ws = words(), m = Infinity;
    for (var i = 0; i < ws.length; i++) m = Math.min(m, toInt(ws[i].id, 1));
    return isFinite(m) ? m : 1;
  }

  function maxId() {
    var ws = words(), m = -Infinity;
    for (var i = 0; i < ws.length; i++) m = Math.max(m, toInt(ws[i].id, 1));
    return isFinite(m) ? m : 1;
  }

  /* 現在の設定から再生対象の id 配列（単語帳の順）を得る */
  function selectedIds() {
    var ws = words();
    if (!ws.length) return [];
    var out = [], i, id;
    if (S.mode === 'pick') {
      var set = {};
      for (i = 0; i < S.picked.length; i++) set[S.picked[i]] = true;
      for (i = 0; i < ws.length; i++) {
        id = toInt(ws[i].id, 0);
        if (set[id]) out.push(id);
      }
    } else {
      var a = Math.min(S.start, S.end), b = Math.max(S.start, S.end);
      for (i = 0; i < ws.length; i++) {
        id = toInt(ws[i].id, 0);
        if (id >= a && id <= b) out.push(id);
      }
    }
    return out;
  }

  /* ======================================================================
     4. 再生状態
     ====================================================================== */
  var P = {
    active: false,     // 再生セッション中（一時停止を含む）
    paused: false,
    tracks: [],        // 再生する id の並び（シャッフル適用後）
    trackIdx: 0,
    steps: [],         // 現在の単語の発話ステップ
    stepIdx: 0,
    errorStreak: 0,
    gapTimer: null,
    watchdog: null,
    curUtt: null,
    keepAlive: null,
    gen: 0            // 発話の世代。cancel 後に届く古い onend/onerror を無視する
  };

  /* ======================================================================
     5. 音声（voice）選択 — getVoices() は非同期で埋まる
     ====================================================================== */
  var voiceEn = null, voiceJa = null, voicesReady = false;

  function pickVoices() {
    if (!HAS_TTS) return;
    var list = [];
    try { list = synth.getVoices() || []; } catch (e) { list = []; }
    if (!list.length) return;
    voicesReady = true;

    function best(prefixes, names) {
      var i, j, v, scored = [], score;
      for (i = 0; i < list.length; i++) {
        v = list[i];
        var lang = (v.lang || '').toLowerCase().replace('_', '-');
        var ok = false;
        for (j = 0; j < prefixes.length; j++) if (lang.indexOf(prefixes[j]) === 0) { ok = true; break; }
        if (!ok) continue;
        score = 0;
        if (v.localService) score += 2;          // 端末内蔵は途切れにくい
        if (v.default) score += 1;
        for (j = 0; j < names.length; j++) {
          if ((v.name || '').toLowerCase().indexOf(names[j]) >= 0) { score += 5 - j; break; }
        }
        scored.push({ v: v, s: score });
      }
      scored.sort(function (a, b) { return b.s - a.s; });
      return scored.length ? scored[0].v : null;
    }

    voiceEn = best(['en-us', 'en-gb', 'en'], ['samantha', 'google us english', 'microsoft aria', 'alex']);
    voiceJa = best(['ja-jp', 'ja'], ['kyoko', 'google 日本語', 'microsoft nanami', 'o-ren']);
    updateVoiceNote();
  }

  if (HAS_TTS) {
    pickVoices();
    try {
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', pickVoices);
      } else {
        synth.onvoiceschanged = pickVoices;
      }
    } catch (e) {}
    // 一部ブラウザは voiceschanged を投げないので数回だけ再試行する
    setTimeout(pickVoices, 300);
    setTimeout(pickVoices, 1200);
    setTimeout(pickVoices, 3000);
  }

  /* ======================================================================
     6. 無音ループ音声（audio session を保持してバックグラウンド再生を助ける）
        外部ファイルに依存せず WAV ヘッダを組み立てて data URI にする。
     ====================================================================== */
  var silentAudio = null;

  function silentWavDataUri(seconds) {
    var sampleRate = 8000, channels = 1, bits = 8;
    var dataLen = sampleRate * seconds * channels * (bits / 8);
    var bytes = [];
    function str(s) { for (var i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 255); }
    function u32(v) { bytes.push(v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255); }
    function u16(v) { bytes.push(v & 255, (v >>> 8) & 255); }
    str('RIFF'); u32(36 + dataLen); str('WAVE');
    str('fmt '); u32(16); u16(1); u16(channels); u32(sampleRate);
    u32(sampleRate * channels * bits / 8); u16(channels * bits / 8); u16(bits);
    str('data'); u32(dataLen);
    for (var i = 0; i < dataLen; i++) bytes.push(128); // 8bit 符号なしの無音は 128
    var s = '', CH = 0x4000;
    for (var j = 0; j < bytes.length; j += CH) {
      s += String.fromCharCode.apply(null, bytes.slice(j, j + CH));
    }
    return 'data:audio/wav;base64,' + window.btoa(s);
  }

  function startSilentLoop() {
    try {
      if (!silentAudio) {
        silentAudio = document.createElement('audio');
        silentAudio.loop = true;
        silentAudio.preload = 'auto';
        silentAudio.setAttribute('aria-hidden', 'true');
        // 音量 0 だとセッションを切る実装があるので極小の値にする
        silentAudio.volume = 0.001;
        silentAudio.src = silentWavDataUri(1);
        silentAudio.className = 'lsn-silent';
        // DOM 外だと再生を続けない実装があるので自分の描画先に入れておく
        var host = document.getElementById('lsn-root') || document.body;
        if (host) host.appendChild(silentAudio);
      }
      var p = silentAudio.play();
      if (p && typeof p.catch === 'function') p.catch(noop);
    } catch (e) {}
  }

  function stopSilentLoop() {
    try { if (silentAudio) silentAudio.pause(); } catch (e) {}
  }

  /* ======================================================================
     7. アートワーク（canvas で番号入りアイコンを描く。外部画像は使わない）
     ====================================================================== */
  var artCache = {};

  function artwork(num, size) {
    var key = num + '@' + size;
    if (artCache[key]) return artCache[key];
    var url = '';
    try {
      var c = document.createElement('canvas');
      c.width = c.height = size;
      var g = c.getContext('2d');
      if (!g) return '';
      var grad = g.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, cssVar('--icon-bg-from', '#626d82'));
      grad.addColorStop(1, cssVar('--icon-bg-to', '#4d5768'));
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      // オレンジの山型カーブ（単語帳アイコンと同じ形）
      g.strokeStyle = cssVar('--icon-line', '#e4673c');
      g.lineWidth = size * 0.062;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(size * 0.09, size * 0.70);
      g.bezierCurveTo(size * 0.28, size * 0.70, size * 0.28, size * 0.30, size * 0.50, size * 0.30);
      g.bezierCurveTo(size * 0.72, size * 0.30, size * 0.72, size * 0.70, size * 0.91, size * 0.70);
      g.stroke();
      // 白の番号
      g.fillStyle = cssVar('--badge-ink', '#ffffff');
      g.font = '800 ' + Math.round(size * 0.24) + 'px ' +
               'Helvetica Neue, Helvetica, Arial, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.fillText(String(num), size / 2, size * 0.93);
      url = c.toDataURL('image/png');
    } catch (e) { url = ''; }
    artCache[key] = url;
    return url;
  }

  /* ======================================================================
     8. mediaSession（ロック画面・イヤホン操作）
     ====================================================================== */
  var msHandlersSet = false;

  function setupMediaSession() {
    if (!HAS_MS || msHandlersSet) return;
    msHandlersSet = true;
    var handlers = {
      play: function () { if (P.active) resume(); else play(); },
      pause: function () { pause(); },
      previoustrack: function () { prev(); },
      nexttrack: function () { next(); },
      stop: function () { stop(); }
    };
    Object.keys(handlers).forEach(function (k) {
      try { navigator.mediaSession.setActionHandler(k, handlers[k]); } catch (e) {}
    });
  }

  function updateMediaSession() {
    if (!HAS_MS) return;
    try {
      navigator.mediaSession.playbackState =
        P.active ? (P.paused ? 'paused' : 'playing') : 'none';
    } catch (e) {}
    if (typeof window.MediaMetadata !== 'function') return;
    var id = currentId();
    var w = id ? wordById(id) : null;
    if (!w) return;
    var pos = P.trackIdx + 1, total = P.tracks.length || selectedIds().length || 0;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: String(w.term || ''),
        artist: String(w.meaning || ''),
        album: 'KeepGoing 単語帳 ' + pos + '/' + total,
        artwork: [
          { src: artwork(w.id, 256), sizes: '256x256', type: 'image/png' },
          { src: artwork(w.id, 512), sizes: '512x512', type: 'image/png' }
        ].filter(function (a) { return !!a.src; })
      });
    } catch (e) {}
  }

  /* ======================================================================
     9. Chrome の 15 秒バグ対策 keep-alive
     ====================================================================== */
  function startKeepAlive() {
    if (!IS_CHROMIUM || !HAS_TTS || P.keepAlive) return;
    P.keepAlive = window.setInterval(function () {
      if (!P.active || P.paused) return;
      try { synth.pause(); synth.resume(); } catch (e) {}
    }, 250);
  }

  function stopKeepAlive() {
    if (P.keepAlive) { window.clearInterval(P.keepAlive); P.keepAlive = null; }
  }

  /* ======================================================================
     10. 再生キュー（直列）
     ====================================================================== */
  function mkStep(id, lang, text) {
    return { kind: 'say', id: id, lang: lang, text: String(text) };
  }

  function buildSteps(w) {
    var steps = [], i, r;
    var reps = clampNum(S.repeat, 1, 5);
    var exs = Array.isArray(w.examples) ? w.examples : [];
    var hasAny = S.read.term || S.read.meaning || S.read.exEn || S.read.exJa;
    for (r = 0; r < reps; r++) {
      if ((S.read.term || !hasAny) && w.term) steps.push(mkStep(w.id, 'en', w.term));
      if (S.read.meaning && w.meaning) steps.push(mkStep(w.id, 'ja', w.meaning));
      for (i = 0; i < exs.length; i++) {
        if (!exs[i]) continue;
        if (S.read.exEn && exs[i].en) steps.push(mkStep(w.id, 'en', exs[i].en));
        if (S.read.exJa && exs[i].ja) steps.push(mkStep(w.id, 'ja', exs[i].ja));
      }
      steps.push({ kind: 'gap', ms: Math.round(clampNum(S.gap, 0, 3) * 1000) });
    }
    return steps;
  }

  function shuffled(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function currentId() {
    return P.tracks.length ? P.tracks[clampNum(P.trackIdx, 0, P.tracks.length - 1)] : 0;
  }

  function clearTimers() {
    if (P.gapTimer) { window.clearTimeout(P.gapTimer); P.gapTimer = null; }
    clearWatchdog();
  }

  function clearWatchdog() {
    if (P.watchdog) { window.clearTimeout(P.watchdog); P.watchdog = null; }
  }

  function loadTrack(idx) {
    P.gen++;
    P.trackIdx = idx;
    P.stepIdx = 0;
    var w = wordById(currentId());
    P.steps = w ? buildSteps(w) : [];
    markSpeaking(currentId());
    markCurrentRow();
    updateMediaSession();
    renderPlayer();
    renderMini();
  }

  function runStep() {
    if (!P.active || P.paused) return;
    var step = P.steps[P.stepIdx];
    if (!step) { trackFinished(); return; }
    if (step.kind === 'gap') {
      if (step.ms <= 0) { P.stepIdx++; runStep(); return; }
      var gen = P.gen;
      P.gapTimer = window.setTimeout(function () {
        P.gapTimer = null;
        if (gen !== P.gen || !P.active || P.paused) return;
        P.stepIdx++;
        runStep();
      }, step.ms);
      return;
    }
    speakStep(step);
  }

  function nextStepSoon(gen) {
    window.setTimeout(function () {
      if (gen !== P.gen || !P.active || P.paused) return;
      P.stepIdx++;
      runStep();
    }, 0);
  }

  function failStep(gen) {
    if (gen !== P.gen) return;
    P.errorStreak++;
    if (P.errorStreak >= 6) {
      // 無限ループを避けるため、連続で失敗したら停止して理由を出す
      setNotice('この環境では音声の再生ができませんでした（音声エンジンが見つかりません）。');
      stop();
      return;
    }
    nextStepSoon(gen);
  }

  function speakStep(step) {
    var gen = P.gen;
    if (!HAS_TTS) { failStep(gen); return; }
    var u;
    try { u = new window.SpeechSynthesisUtterance(step.text); }
    catch (e) { failStep(gen); return; }

    u.lang = step.lang === 'ja' ? 'ja-JP' : 'en-US';
    var v = step.lang === 'ja' ? voiceJa : voiceEn;
    if (v) { try { u.voice = v; } catch (e) {} }
    u.rate = clampNum(step.lang === 'ja' ? S.rateJa : S.rateEn, 0.5, 1.5);
    u.pitch = 1;
    u.volume = 1;

    var done = false;
    P.curUtt = u;

    u.onstart = function () {
      if (gen !== P.gen) return;
      clearWatchdog();
    };
    u.onend = function () {
      if (done || gen !== P.gen) return;
      done = true;
      clearWatchdog();
      P.errorStreak = 0;
      nextStepSoon(gen);
    };
    u.onerror = function () {
      if (done || gen !== P.gen) return;
      done = true;
      clearWatchdog();
      failStep(gen);
    };

    // 発話が始まらない環境（音声エンジン無し等）で止まらないための見張り
    clearWatchdog();
    P.watchdog = window.setTimeout(function () {
      P.watchdog = null;
      if (done || gen !== P.gen) return;
      done = true;
      try { synth.cancel(); } catch (e) {}
      failStep(gen);
    }, 3000);

    try { synth.speak(u); }
    catch (e) {
      if (!done) { done = true; clearWatchdog(); failStep(gen); }
    }
  }

  function trackFinished() {
    if (S.loop === 'one') { loadTrack(P.trackIdx); runStep(); return; }
    if (P.trackIdx + 1 < P.tracks.length) { loadTrack(P.trackIdx + 1); runStep(); return; }
    if (S.loop === 'all') {
      if (S.shuffle) P.tracks = shuffled(P.tracks);
      loadTrack(0);
      runStep();
      return;
    }
    stop();
  }

  /* ======================================================================
     11. 操作（再生／一時停止／前後／シーク／停止）
     ====================================================================== */
  /* cancel() すると直前の発話の onend / onerror が遅れて飛んでくる実装があるため、
     世代を進めて古いコールバックを無効化する（キューの二重進行を防ぐ）。 */
  function cancelSpeech() {
    P.gen++;
    clearWatchdog();
    P.curUtt = null;
    if (!HAS_TTS) return;
    try { synth.cancel(); } catch (e) {}
  }

  function play(fromId) {
    if (!HAS_TTS) { setNotice('このブラウザは読み上げ（Web Speech API）に対応していません。'); return; }
    var ids = selectedIds();
    if (!ids.length) { setNotice('聞く単語が選ばれていません。範囲かチェックを選んでください。'); return; }

    var order = S.shuffle ? shuffled(ids) : ids;
    var startIdx = 0;
    if (fromId != null) {
      var at = order.indexOf(toInt(fromId, -1));
      if (at < 0) { order = [toInt(fromId, -1)].concat(order); at = 0; }
      startIdx = at;
    }

    clearTimers();
    cancelSpeech();
    P.tracks = order;
    P.errorStreak = 0;
    P.active = true;
    P.paused = false;
    setNotice('');
    setupMediaSession();
    startSilentLoop();
    startKeepAlive();
    loadTrack(startIdx);
    if (!voicesReady) pickVoices();
    runStep();
    renderAll();
  }

  function pause() {
    if (!P.active || P.paused) return;
    P.paused = true;
    clearTimers();
    try { if (HAS_TTS) synth.pause(); } catch (e) {}
    // pause() が効かない端末（Android Chrome 等）では発話が最後まで流れるが、
    // 次のステップへは進まない。再開時は同じステップから読み直す（resume 参照）。
    updateMediaSession();
    renderAll();
  }

  function resume() {
    if (!P.active || !P.paused) return;
    P.paused = false;
    var resumed = false;
    try {
      if (HAS_TTS && (synth.speaking || synth.pending)) { synth.resume(); resumed = true; }
    } catch (e) {}
    if (!resumed) { cancelSpeech(); runStep(); }
    startSilentLoop();
    startKeepAlive();
    updateMediaSession();
    renderAll();
  }

  function toggle() {
    if (!P.active) play();
    else if (P.paused) resume();
    else pause();
  }

  function next() {
    if (!P.active) return;
    clearTimers();
    cancelSpeech();
    if (P.trackIdx + 1 < P.tracks.length) loadTrack(P.trackIdx + 1);
    else if (S.loop !== 'none') loadTrack(0);
    else { stop(); return; }
    P.errorStreak = 0;
    if (!P.paused) runStep();
    renderAll();
  }

  function prev() {
    if (!P.active) return;
    clearTimers();
    cancelSpeech();
    loadTrack(P.trackIdx > 0 ? P.trackIdx - 1 : 0);
    P.errorStreak = 0;
    if (!P.paused) runStep();
    renderAll();
  }

  /* 任意の単語へジャンプ（シーク） */
  function seekTo(id) {
    id = toInt(id, -1);
    if (!P.active) { play(id); return; }
    var at = P.tracks.indexOf(id);
    if (at < 0) { play(id); return; }
    clearTimers();
    cancelSpeech();
    loadTrack(at);
    P.errorStreak = 0;
    if (!P.paused) runStep();
    renderAll();
  }

  function stop() {
    P.active = false;
    P.paused = false;
    clearTimers();
    cancelSpeech();
    stopKeepAlive();
    stopSilentLoop();
    markSpeaking(0);
    markCurrentRow();
    updateMediaSession();
    renderAll();
  }

  /* 単語帳側のカードに .is-speaking を付け外しする */
  function markSpeaking(id) {
    var prevNodes = document.querySelectorAll('.word-card.is-speaking');
    for (var i = 0; i < prevNodes.length; i++) prevNodes[i].classList.remove('is-speaking');
    if (!id || !P.active) return;
    var node = document.querySelector('.word-card[data-id="' + id + '"]');
    if (node) node.classList.add('is-speaking');
  }

  /* 画面復帰時に止まっていたら復帰を試みる */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (!P.active || P.paused) return;
    startSilentLoop();
    var stalled = false;
    try { stalled = HAS_TTS && !synth.speaking && !synth.pending; } catch (e) {}
    if (stalled && !P.gapTimer && !P.watchdog) {
      cancelSpeech();
      runStep();
    }
  });

  /* ======================================================================
     12. UI 構築
     ====================================================================== */
  var root = null, mini = null;
  var ui = {};          // 作った DOM をまとめて持つ
  var built = false;

  function chip(label, cls) {
    var b = el('button', 'lsn-chip' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    return b;
  }

  function field(labelText, control, valueNode) {
    var wrap = el('div', 'lsn-field');
    var lab = el('label', 'lsn-field__label', labelText);
    if (control && control.id) lab.setAttribute('for', control.id);
    wrap.appendChild(lab);
    var row = el('div', 'lsn-field__row');
    row.appendChild(control);
    if (valueNode) row.appendChild(valueNode);
    wrap.appendChild(row);
    return wrap;
  }

  function checkRow(labelText, checked, onChange) {
    var lab = el('label', 'lsn-check');
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !!checked;
    box.className = 'lsn-check__box';
    box.addEventListener('change', function () { onChange(box.checked); });
    lab.appendChild(box);
    lab.appendChild(el('span', 'lsn-check__text', labelText));
    return { node: lab, box: box };
  }

  function slider(id, min, max, step, value) {
    var r = document.createElement('input');
    r.type = 'range';
    r.id = id;
    r.className = 'lsn-range';
    r.min = String(min); r.max = String(max); r.step = String(step);
    r.value = String(value);
    return r;
  }

  function buildPlayer() {
    var box = el('section', 'lsn-player');

    var head = el('div', 'lsn-player__head');
    ui.no = el('span', 'lsn-no', '–');
    head.appendChild(ui.no);
    var meta = el('div', 'lsn-meta');
    ui.ipa = el('p', 'lsn-ipa', '');
    ui.term = el('h2', 'lsn-term', '');
    ui.meaning = el('p', 'lsn-meaning', '再生する範囲を選んで ▶ を押してください');
    meta.appendChild(ui.ipa);
    meta.appendChild(ui.term);
    meta.appendChild(ui.meaning);
    head.appendChild(meta);
    box.appendChild(head);

    var prog = el('div', 'lsn-prog');
    var bar = el('div', 'lsn-prog__bar');
    ui.progFill = el('div', 'lsn-prog__fill');
    bar.appendChild(ui.progFill);
    ui.progText = el('span', 'lsn-prog__text', '0 / 0');
    prog.appendChild(bar);
    prog.appendChild(ui.progText);
    box.appendChild(prog);

    var ctrl = el('div', 'lsn-ctrl');
    ui.btnPrev = el('button', 'lsn-btn', '⏮');
    ui.btnPrev.type = 'button';
    ui.btnPrev.setAttribute('aria-label', '前の単語');
    ui.btnPlay = el('button', 'lsn-btn lsn-btn--main', '▶');
    ui.btnPlay.type = 'button';
    ui.btnPlay.setAttribute('aria-label', '再生／一時停止');
    ui.btnNext = el('button', 'lsn-btn', '⏭');
    ui.btnNext.type = 'button';
    ui.btnNext.setAttribute('aria-label', '次の単語');
    ui.btnStop = el('button', 'lsn-btn lsn-btn--stop', '■');
    ui.btnStop.type = 'button';
    ui.btnStop.setAttribute('aria-label', '停止');
    ctrl.appendChild(ui.btnPrev);
    ctrl.appendChild(ui.btnPlay);
    ctrl.appendChild(ui.btnNext);
    ctrl.appendChild(ui.btnStop);
    box.appendChild(ctrl);

    ui.btnPrev.addEventListener('click', function () { prev(); });
    ui.btnNext.addEventListener('click', function () { next(); });
    ui.btnPlay.addEventListener('click', function () { toggle(); });
    ui.btnStop.addEventListener('click', function () { stop(); });

    var sub = el('div', 'lsn-player__sub');
    ui.btnShow = el('button', 'lsn-link', '単語帳で見る');
    ui.btnShow.type = 'button';
    ui.btnShow.addEventListener('click', function () {
      var id = currentId() || selectedIds()[0];
      if (!id) return;
      try {
        if (window.App && typeof window.App.scrollToWord === 'function') window.App.scrollToWord(id);
      } catch (e) {}
    });
    sub.appendChild(ui.btnShow);
    ui.voiceNote = el('span', 'lsn-voicenote', '');
    sub.appendChild(ui.voiceNote);
    box.appendChild(sub);

    ui.notice = el('p', 'lsn-notice');
    ui.notice.hidden = true;
    box.appendChild(ui.notice);

    return box;
  }

  function buildRangeSection() {
    var sec = el('details', 'lsn-sec');
    sec.open = true;
    var sum = el('summary', 'lsn-sec__sum');
    sum.appendChild(el('span', 'lsn-sec__title', '聞く範囲をカスタマイズ'));
    ui.countBadge = el('span', 'lsn-sec__badge', '0 語');
    sum.appendChild(ui.countBadge);
    sec.appendChild(sum);

    var body = el('div', 'lsn-sec__body');

    /* --- モード切替 --- */
    var modes = el('div', 'lsn-seg');
    ui.modeRange = chip('範囲で選ぶ', 'lsn-chip--seg');
    ui.modePick = chip('個別に選ぶ', 'lsn-chip--seg');
    ui.modeRange.addEventListener('click', function () { S.mode = 'range'; afterSelectionChange(); });
    ui.modePick.addEventListener('click', function () {
      // 空のまま切り替えて 0 語になるのを避け、いまの範囲を引き継ぐ
      if (S.mode !== 'pick' && !S.picked.length) S.picked = idsInRange(S.start, S.end);
      S.mode = 'pick';
      afterSelectionChange();
    });
    modes.appendChild(ui.modeRange);
    modes.appendChild(ui.modePick);
    body.appendChild(modes);

    /* --- 範囲の数値入力 --- */
    ui.rangeBox = el('div', 'lsn-rangebox');
    ui.inStart = document.createElement('input');
    ui.inStart.type = 'number';
    ui.inStart.id = 'lsn-start';
    ui.inStart.className = 'lsn-num';
    ui.inEnd = document.createElement('input');
    ui.inEnd.type = 'number';
    ui.inEnd.id = 'lsn-end';
    ui.inEnd.className = 'lsn-num';
    var l1 = el('label', 'lsn-rangebox__lab', '開始');
    l1.setAttribute('for', 'lsn-start');
    var l2 = el('label', 'lsn-rangebox__lab', '終了');
    l2.setAttribute('for', 'lsn-end');
    ui.rangeBox.appendChild(l1);
    ui.rangeBox.appendChild(ui.inStart);
    ui.rangeBox.appendChild(el('span', 'lsn-rangebox__tilde', '〜'));
    ui.rangeBox.appendChild(l2);
    ui.rangeBox.appendChild(ui.inEnd);
    body.appendChild(ui.rangeBox);

    function onRangeInput() {
      var lo = minId(), hi = maxId();
      var a = clampNum(toInt(ui.inStart.value, lo), lo, hi);
      var b = clampNum(toInt(ui.inEnd.value, hi), lo, hi);
      if (a > b) { var t = a; a = b; b = t; }   // 開始 > 終了 は自動補正
      S.start = a; S.end = b;
      afterSelectionChange();
    }
    ui.inStart.addEventListener('change', onRangeInput);
    ui.inEnd.addEventListener('change', onRangeInput);

    /* --- プリセットチップ --- */
    ui.presets = el('div', 'lsn-chips');
    body.appendChild(ui.presets);

    /* --- 個別選択 --- */
    ui.pickTools = el('div', 'lsn-picktools');
    var bAll = chip('全選択'), bNone = chip('全解除'), bFromRange = chip('範囲を選択に反映');
    bAll.addEventListener('click', function () {
      S.picked = words().map(function (w) { return toInt(w.id, 0); });
      S.mode = 'pick';
      afterSelectionChange();
    });
    bNone.addEventListener('click', function () {
      S.picked = [];
      S.mode = 'pick';
      afterSelectionChange();
    });
    bFromRange.addEventListener('click', function () {
      S.picked = idsInRange(S.start, S.end);
      S.mode = 'pick';
      afterSelectionChange();
    });
    ui.pickTools.appendChild(bAll);
    ui.pickTools.appendChild(bNone);
    ui.pickTools.appendChild(bFromRange);
    body.appendChild(ui.pickTools);

    ui.pickList = el('div', 'lsn-picklist');
    body.appendChild(ui.pickList);

    sec.appendChild(body);
    return sec;
  }

  function buildVoiceSection() {
    var sec = el('details', 'lsn-sec');
    var sum = el('summary', 'lsn-sec__sum');
    sum.appendChild(el('span', 'lsn-sec__title', '読み上げのカスタマイズ'));
    ui.voiceBadge = el('span', 'lsn-sec__badge', '');
    sum.appendChild(ui.voiceBadge);
    sec.appendChild(sum);

    var body = el('div', 'lsn-sec__body');

    /* --- 読む要素 --- */
    body.appendChild(el('p', 'lsn-label', '読み上げる内容'));
    var reads = el('div', 'lsn-checks');
    ui.cbTerm = checkRow('見出し語（英）', S.read.term, function (v) { S.read.term = v; afterVoiceChange(); });
    ui.cbMeaning = checkRow('日本語訳', S.read.meaning, function (v) { S.read.meaning = v; afterVoiceChange(); });
    ui.cbExEn = checkRow('例文（英）', S.read.exEn, function (v) { S.read.exEn = v; afterVoiceChange(); });
    ui.cbExJa = checkRow('例文の和訳', S.read.exJa, function (v) { S.read.exJa = v; afterVoiceChange(); });
    reads.appendChild(ui.cbTerm.node);
    reads.appendChild(ui.cbMeaning.node);
    reads.appendChild(ui.cbExEn.node);
    reads.appendChild(ui.cbExJa.node);
    body.appendChild(reads);

    /* --- 繰り返し回数 --- */
    ui.selRepeat = document.createElement('select');
    ui.selRepeat.id = 'lsn-repeat';
    ui.selRepeat.className = 'lsn-select';
    for (var i = 1; i <= 5; i++) {
      var o = el('option', null, i + ' 回');
      o.value = String(i);
      ui.selRepeat.appendChild(o);
    }
    ui.selRepeat.addEventListener('change', function () {
      S.repeat = clampNum(toInt(ui.selRepeat.value, 1), 1, 5);
      afterVoiceChange();
    });
    body.appendChild(field('各単語の繰り返し回数', ui.selRepeat));

    /* --- 速度（英 / 日） --- */
    ui.rngEn = slider('lsn-rate-en', 0.5, 1.5, 0.05, S.rateEn);
    ui.valEn = el('span', 'lsn-val', '');
    ui.rngEn.addEventListener('input', function () {
      S.rateEn = clampNum(ui.rngEn.value, 0.5, 1.5);
      ui.valEn.textContent = S.rateEn.toFixed(2);
      afterVoiceChange();
    });
    body.appendChild(field('英語の速度', ui.rngEn, ui.valEn));

    ui.rngJa = slider('lsn-rate-ja', 0.5, 1.5, 0.05, S.rateJa);
    ui.valJa = el('span', 'lsn-val', '');
    ui.rngJa.addEventListener('input', function () {
      S.rateJa = clampNum(ui.rngJa.value, 0.5, 1.5);
      ui.valJa.textContent = S.rateJa.toFixed(2);
      afterVoiceChange();
    });
    body.appendChild(field('日本語の速度', ui.rngJa, ui.valJa));

    /* --- 単語間の間 --- */
    ui.rngGap = slider('lsn-gap', 0, 3, 0.1, S.gap);
    ui.valGap = el('span', 'lsn-val', '');
    ui.rngGap.addEventListener('input', function () {
      S.gap = clampNum(ui.rngGap.value, 0, 3);
      ui.valGap.textContent = S.gap.toFixed(1) + ' 秒';
      afterVoiceChange();
    });
    body.appendChild(field('単語間の間（ま）', ui.rngGap, ui.valGap));

    /* --- リピート --- */
    ui.selLoop = document.createElement('select');
    ui.selLoop.id = 'lsn-loop';
    ui.selLoop.className = 'lsn-select';
    [['none', 'なし'], ['all', '全体をループ'], ['one', '1 語リピート']].forEach(function (p) {
      var o = el('option', null, p[1]);
      o.value = p[0];
      ui.selLoop.appendChild(o);
    });
    ui.selLoop.addEventListener('change', function () {
      S.loop = ui.selLoop.value;
      afterVoiceChange();
    });
    body.appendChild(field('リピート', ui.selLoop));

    /* --- シャッフル --- */
    ui.cbShuffle = checkRow('シャッフル再生', S.shuffle, function (v) {
      S.shuffle = v;
      afterVoiceChange();
    });
    var shWrap = el('div', 'lsn-checks');
    shWrap.appendChild(ui.cbShuffle.node);
    body.appendChild(shWrap);

    sec.appendChild(body);
    return sec;
  }

  function buildUI() {
    root = document.getElementById('lsn-root');
    mini = document.getElementById('mini-player');
    if (!root || built) return;
    built = true;

    root.textContent = '';

    if (!HAS_TTS) {
      var alert = el('p', 'lsn-alert',
        'このブラウザは読み上げ（Web Speech API）に対応していないため、リスニングモードは使えません。' +
        'Chrome / Safari の最新版をお試しください。');
      root.appendChild(alert);
    }

    root.appendChild(buildPlayer());
    root.appendChild(buildRangeSection());
    root.appendChild(buildVoiceSection());

    var foot = el('div', 'lsn-foot');
    foot.appendChild(el('p', 'lsn-foot__p',
      '※ iOS / iPadOS の Safari は画面ロック中やアプリ切替後に読み上げが停止することがあります。'));
    foot.appendChild(el('p', 'lsn-foot__p',
      '　その場合はロックを解除してこの画面に戻ると、再生位置から自動で復帰を試みます。'));
    if (!HAS_MS) {
      foot.appendChild(el('p', 'lsn-foot__p',
        '※ このブラウザはロック画面の操作（Media Session）に対応していません。'));
    }
    root.appendChild(foot);

    buildMini();
    syncControls();
    renderSelectionUI();
    renderAll();
    watchViewChange();
  }

  function buildMini() {
    if (!mini) return;
    mini.textContent = '';
    var open = el('button', 'mini__open');
    open.type = 'button';
    open.setAttribute('aria-label', 'リスニング画面を開く');
    ui.miniNo = el('span', 'lsn-no lsn-no--sm', '–');
    open.appendChild(ui.miniNo);
    var tx = el('span', 'mini__text');
    ui.miniTerm = el('span', 'mini__term', '');
    ui.miniMeaning = el('span', 'mini__meaning', '');
    tx.appendChild(ui.miniTerm);
    tx.appendChild(ui.miniMeaning);
    open.appendChild(tx);
    open.addEventListener('click', function () { gotoListeningView(); });
    mini.appendChild(open);

    var ctrl = el('span', 'mini__ctrl');
    ui.miniPlay = el('button', 'mini__btn', '▶');
    ui.miniPlay.type = 'button';
    ui.miniPlay.setAttribute('aria-label', '再生／一時停止');
    ui.miniPlay.addEventListener('click', function (ev) { ev.stopPropagation(); toggle(); });
    ui.miniNext = el('button', 'mini__btn', '⏭');
    ui.miniNext.type = 'button';
    ui.miniNext.setAttribute('aria-label', '次の単語');
    ui.miniNext.addEventListener('click', function (ev) { ev.stopPropagation(); next(); });
    ctrl.appendChild(ui.miniPlay);
    ctrl.appendChild(ui.miniNext);
    mini.appendChild(ctrl);
    mini.hidden = true;
  }

  function gotoListeningView() {
    try {
      if (window.App && typeof window.App.showView === 'function') {
        window.App.showView('listening');
        return;
      }
    } catch (e) {}
    // app.js が未読込のときはタブのクリックに委ねる（タブ処理は app.js の担当）
    var tab = document.querySelector('.tab[data-view="listening"]');
    if (tab) tab.click();
  }

  /* ======================================================================
     13. 描画
     ====================================================================== */
  function setNotice(msg) {
    if (!ui.notice) return;
    ui.notice.textContent = msg || '';
    ui.notice.hidden = !msg;
  }

  function updateVoiceNote() {
    if (!ui.voiceNote) return;
    if (!HAS_TTS) { ui.voiceNote.textContent = ''; return; }
    var names = [];
    if (voiceEn) names.push('英: ' + voiceEn.name);
    if (voiceJa) names.push('日: ' + voiceJa.name);
    ui.voiceNote.textContent = names.length ? names.join(' / ') : '音声エンジンを検出できません';
  }

  /* プリセットチップ（単語数に追従して作り直す） */
  function renderPresets() {
    if (!ui.presets) return;
    ui.presets.textContent = '';
    var lo = minId(), hi = maxId();
    var ws = words();
    if (!ws.length) return;
    var defs = [];
    for (var a = lo; a <= hi; a += 10) {
      var b = Math.min(a + 9, hi);
      defs.push([a + '-' + b, a, b]);
    }
    defs.push(['全部', lo, hi]);
    defs.forEach(function (d) {
      var c = chip(d[0]);
      if (isPresetOn(d[1], d[2])) c.classList.add('is-on');
      c.addEventListener('click', function () {
        S.start = d[1];
        S.end = d[2];
        // 個別選択モードのときはチェック内容をその範囲に置き換える（モードは変えない）
        if (S.mode === 'pick') S.picked = idsInRange(d[1], d[2]);
        afterSelectionChange();
      });
      ui.presets.appendChild(c);
    });
  }

  function idsInRange(a, b) {
    var lo = Math.min(a, b), hi = Math.max(a, b);
    return words().map(function (w) { return toInt(w.id, 0); })
                  .filter(function (id) { return id >= lo && id <= hi; });
  }

  function isPresetOn(a, b) {
    if (S.mode === 'range') return S.start === a && S.end === b;
    var want = idsInRange(a, b).join(',');
    return want !== '' && want === S.picked.slice().sort(function (x, y) { return x - y; }).join(',');
  }

  /* 個別選択リスト */
  function renderPickList() {
    if (!ui.pickList) return;
    ui.pickList.textContent = '';
    var ws = words();
    var set = {};
    for (var i = 0; i < S.picked.length; i++) set[S.picked[i]] = true;
    ws.forEach(function (w) {
      var id = toInt(w.id, 0);
      var row = el('label', 'lsn-row');
      row.setAttribute('data-id', String(id));
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'lsn-row__box';
      box.checked = !!set[id];
      box.setAttribute('data-id', String(id));
      box.addEventListener('change', function () {
        var list = S.picked.filter(function (v) { return v !== id; });
        if (box.checked) list.push(id);
        list.sort(function (a, b) { return a - b; });
        S.picked = list;
        S.mode = 'pick';
        afterSelectionChange(true);
      });
      row.appendChild(box);
      row.appendChild(el('span', 'lsn-no lsn-no--sm', id));
      var tx = el('span', 'lsn-row__text');
      tx.appendChild(el('span', 'lsn-row__term', w.term || ''));
      tx.appendChild(el('span', 'lsn-row__meaning', w.meaning || ''));
      row.appendChild(tx);
      var jump = el('button', 'lsn-row__jump', '▶');
      jump.type = 'button';
      jump.setAttribute('aria-label', (w.term || id) + ' から再生');
      jump.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        seekTo(id);
      });
      row.appendChild(jump);
      ui.pickList.appendChild(row);
    });
    markCurrentRow();
  }

  /* 個別選択リストの「いま再生中の行」を示す */
  function markCurrentRow() {
    if (!ui.pickList) return;
    var on = ui.pickList.querySelectorAll('.lsn-row.is-current');
    for (var i = 0; i < on.length; i++) on[i].classList.remove('is-current');
    if (!P.active) return;
    var row = ui.pickList.querySelector('.lsn-row[data-id="' + currentId() + '"]');
    if (row) row.classList.add('is-current');
  }

  /* 選択 UI 全体（モード・入力値・プリセット・リスト） */
  function renderSelectionUI() {
    if (!built) return;
    var hasWords = words().length > 0;
    var lo = minId(), hi = maxId();
    if (hasWords) {
      S.start = clampNum(S.start, lo, hi);
      S.end = clampNum(S.end, lo, hi);
      if (S.start > S.end) { var t = S.start; S.start = S.end; S.end = t; }
    }

    ui.inStart.min = ui.inEnd.min = String(lo);
    ui.inStart.max = ui.inEnd.max = String(hi);
    ui.inStart.value = String(S.start);
    ui.inEnd.value = String(S.end);

    var pick = S.mode === 'pick';
    ui.modeRange.classList.toggle('is-on', !pick);
    ui.modePick.classList.toggle('is-on', pick);
    ui.modeRange.setAttribute('aria-pressed', String(!pick));
    ui.modePick.setAttribute('aria-pressed', String(pick));
    ui.pickTools.hidden = !pick;
    ui.pickList.hidden = !pick;

    renderPresets();
    if (pick) renderPickList();

    var n = selectedIds().length;
    ui.countBadge.textContent = n + ' 語';
  }

  function renderPlayer() {
    if (!built) return;
    var ids = selectedIds();
    var total = P.active ? P.tracks.length : ids.length;
    var pos = P.active ? P.trackIdx + 1 : 0;
    var id = P.active ? currentId() : (ids.length ? ids[0] : 0);
    var w = id ? wordById(id) : null;

    ui.no.textContent = w ? String(w.id) : '–';
    ui.ipa.textContent = w && w.ipa ? w.ipa : '';
    ui.term.textContent = w ? (w.term || '') : '';
    ui.meaning.textContent = w ? (w.meaning || '')
                               : '聞く範囲を選んで ▶ を押してください';
    ui.meaning.classList.toggle('lsn-meaning--empty', !w);

    ui.progText.textContent = pos + ' / ' + total;
    var pct = total > 0 ? (pos / total) * 100 : 0;
    ui.progFill.style.width = clampNum(pct, 0, 100) + '%';

    ui.btnPlay.textContent = (P.active && !P.paused) ? '⏸' : '▶';
    ui.btnPlay.setAttribute('aria-label', (P.active && !P.paused) ? '一時停止' : '再生');
    ui.btnPrev.disabled = !P.active;
    ui.btnNext.disabled = !P.active;
    ui.btnStop.disabled = !P.active;
    ui.btnPlay.disabled = !HAS_TTS;
    ui.btnShow.disabled = !w;

    ui.voiceBadge.textContent = S.repeat + ' 回 / ' + S.gap.toFixed(1) + '秒';
  }

  function renderMini() {
    if (!mini || !built) return;
    var inListening = isListeningVisible();
    if (!P.active || inListening) {
      mini.hidden = true;
      return;
    }
    var w = wordById(currentId());
    ui.miniNo.textContent = w ? String(w.id) : '–';
    ui.miniTerm.textContent = w ? (w.term || '') : '';
    ui.miniMeaning.textContent = w ? (w.meaning || '') : '';
    ui.miniPlay.textContent = P.paused ? '▶' : '⏸';
    mini.hidden = false;
  }

  function renderAll() {
    renderPlayer();
    renderMini();
    if (ui.countBadge) ui.countBadge.textContent = selectedIds().length + ' 語';
  }

  function syncControls() {
    if (!built) return;
    ui.cbTerm.box.checked = S.read.term;
    ui.cbMeaning.box.checked = S.read.meaning;
    ui.cbExEn.box.checked = S.read.exEn;
    ui.cbExJa.box.checked = S.read.exJa;
    ui.cbShuffle.box.checked = S.shuffle;
    ui.selRepeat.value = String(S.repeat);
    ui.selLoop.value = S.loop;
    ui.rngEn.value = String(S.rateEn);
    ui.rngJa.value = String(S.rateJa);
    ui.rngGap.value = String(S.gap);
    ui.valEn.textContent = S.rateEn.toFixed(2);
    ui.valJa.textContent = S.rateJa.toFixed(2);
    ui.valGap.textContent = S.gap.toFixed(1) + ' 秒';
    updateVoiceNote();
  }

  /* 選択が変わったとき：保存 → UI 更新 → 再生中なら並びを作り直す */
  function afterSelectionChange(skipListRedraw) {
    saveSettings();
    if (skipListRedraw) {
      var lo = minId(), hi = maxId();
      S.start = clampNum(S.start, lo, hi);
      S.end = clampNum(S.end, lo, hi);
      ui.countBadge.textContent = selectedIds().length + ' 語';
      renderPresets();     // プリセットの点灯だけ更新（リストは作り直さない）
    } else {
      renderSelectionUI();
    }
    if (P.active) rebuildTracksKeepingCurrent();
    renderAll();
  }

  function afterVoiceChange() {
    saveSettings();
    if (built) ui.voiceBadge.textContent = S.repeat + ' 回 / ' + S.gap.toFixed(1) + '秒';
    renderAll();
  }

  function rebuildTracksKeepingCurrent() {
    var cur = currentId();
    var ids = selectedIds();
    if (!ids.length) { stop(); return; }
    var order = S.shuffle ? shuffled(ids) : ids;
    P.tracks = order;
    var at = order.indexOf(cur);
    if (at < 0) {
      // 今の単語が選択から外れた → 先頭から続ける
      clearTimers();
      cancelSpeech();
      loadTrack(0);
      if (!P.paused) runStep();
    } else {
      P.trackIdx = at;
      renderPlayer();
    }
  }

  /* ======================================================================
     14. ビュー切替の監視（ミニプレイヤーの出し入れ）
     ====================================================================== */
  function isListeningVisible() {
    var v = document.getElementById('view-listening');
    if (!v) return false;
    return !v.hasAttribute('hidden');
  }

  function watchViewChange() {
    var v = document.getElementById('view-listening');
    if (!v || typeof window.MutationObserver !== 'function') return;
    var mo = new window.MutationObserver(function () { renderMini(); });
    mo.observe(v, { attributes: true, attributeFilter: ['hidden', 'class'] });
  }

  /* ======================================================================
     15. 起動（words.js / app.js が後から来ても壊れない）
     ====================================================================== */
  var pollCount = 0, poller = null;

  function pollForWords() {
    if (poller) return;
    poller = window.setInterval(function () {
      pollCount++;
      if (words().length) {
        window.clearInterval(poller);
        poller = null;
        renderSelectionUI();
        renderAll();
        return;
      }
      if (pollCount > 100) {        // 20 秒であきらめる
        window.clearInterval(poller);
        poller = null;
      }
    }, 200);
  }

  function boot() {
    loadSettings();
    buildUI();
    if (!words().length) pollForWords();
  }

  function start() {
    try {
      if (window.App && typeof window.App.onReady === 'function') {
        window.App.onReady(boot);
        return;
      }
    } catch (e) {}
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }

  start();

  /* ======================================================================
     16. 公開 API
     ====================================================================== */
  window.Listening = {
    playFrom: function (id) { play(id); },
    stop: function () { stop(); },
    isPlaying: function () { return !!(P.active && !P.paused); }
  };
})();
