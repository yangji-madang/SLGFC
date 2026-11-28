/* 공통 페이지 제목 변경 (pagetitle.js)
   - 관리 페이지(_admin)에 「제목 변경」 버튼을 달고, 바꾼 제목을 같은 폴더 최상위의 titles.json 에 저장(GitHub 반영)합니다.
   - 보기 페이지·관리 페이지가 열릴 때 titles.json 을 읽어 브라우저 탭 제목과 화면 상단 제목에 자동 반영합니다.
   - 사용법 : 보기 페이지와 관리 페이지 끝에 <script src="pagetitle.js" data-repo="소유자/저장소"></script> 한 줄 (하위 폴더는 ../pagetitle.js).
     · 관리 페이지에 대응하는 보기 페이지가 없으면(관리 페이지 자체가 대상) data-view="-" 를 추가합니다.
     · 보기 파일명이 "관리파일명에서 _admin 을 뺀 이름"과 다르면 data-view="보기파일.html" 로 지정합니다.
   - 제목은 글자로만 처리하며(HTML 해석 없음), 원제목은 titles.json 에 함께 기록되어 「원래대로」로 되돌릴 수 있습니다. */
(function () {
  var cs = document.currentScript, src = cs ? cs.src : '';
  if (!src) return;
  var base = src.replace(/[^\/]*(\?.*)?$/, '');
  var basePath, path;
  try { basePath = decodeURIComponent(new URL(base).pathname); path = decodeURIComponent(location.pathname); } catch (e) { return; }
  var key = path.indexOf(basePath) === 0 ? path.slice(basePath.length) : path.replace(/^\//, '');
  if (!key || /\/$/.test(key)) key += 'index.html';
  var isAdmin = /_admin\.html$/i.test(key);
  var dv = cs.getAttribute('data-view') || '';
  var viewKey = key;
  if (isAdmin && dv !== '-') viewKey = dv ? key.replace(/[^\/]*$/, '') + dv : key.replace(/_admin\.html$/i, '.html');
  var REPO = cs.getAttribute('data-repo') || (location.hostname.split('.')[0] + '/' + basePath.split('/')[1]);
  var TKEY = 'pt_gh_token';
  var entries = {};
  var origTitle = document.title;

  window.__ptKey = key;
  window.__ptOrig = origTitle;

  /* ---------- 제목 반영 ---------- */
  var SEL = 'h1,h2,h3,header b,header strong,.tb b,.bar b,.top b,.hd b,.admin-top b,[class*="title"],[class*="ttl"]';
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|SELECT|NOSCRIPT)$/;

  function cands(doc, e) {
    var a = [];
    function add(s) { s = (s || '').trim(); if (s.length >= 2 && s !== e.title && a.indexOf(s) < 0) a.push(s); }
    add(doc.__ptCur);
    add(e.orig);
    if (e.orig) add(e.orig.split(/\s[|·–-]\s/)[0]);
    return a.sort(function (x, y) { return y.length - x.length; });
  }
  function replaceHeadings(doc, e) {
    var cs2 = cands(doc, e);
    if (!cs2.length || (doc.__ptN || 0) >= 6) return;
    var els = doc.querySelectorAll(SEL), done = 0;
    for (var i = 0; i < els.length && done < 2; i++) {
      var w = doc.createTreeWalker(els[i], 4, null), n;
      while ((n = w.nextNode()) && done < 2) {
        var p = n.parentNode;
        if (!p || SKIP.test(p.nodeName) || (p.closest && p.closest('[data-pt-skip]'))) continue;
        for (var j = 0; j < cs2.length; j++) {
          var at = n.nodeValue.indexOf(cs2[j]);
          if (at >= 0) {
            n.nodeValue = n.nodeValue.slice(0, at) + e.title + n.nodeValue.slice(at + cs2[j].length);
            done++; doc.__ptN = (doc.__ptN || 0) + 1;
            break;
          }
        }
      }
    }
  }
  function applyDoc(doc, e, chrome) {
    if (!e || !e.title) return;
    var cs2 = cands(doc, e);
    if (!chrome) { doc.title = e.title; }
    else {
      for (var k = 0; k < cs2.length; k++) {
        if (doc.title.indexOf(cs2[k]) >= 0) { doc.title = doc.title.replace(cs2[k], e.title); break; }
      }
    }
    replaceHeadings(doc, e);
    doc.__ptCur = e.title;
    doc.__ptWant = { e: e, chrome: chrome };
    watch(doc);
  }
  function watch(doc) {
    if (doc.__ptWatching) return;
    doc.__ptWatching = true;
    var t0 = Date.now(), tm = null;
    var mo = new MutationObserver(function () {
      if (tm) return;
      tm = setTimeout(function () {
        tm = null;
        var w = doc.__ptWant; if (!w) return;
        if (!w.chrome && doc.title !== w.e.title) doc.title = w.e.title;
        if (Date.now() - t0 < 10000) { doc.__ptN = 0; replaceHeadings(doc, w.e); }
      }, 150);
    });
    if (doc.body) mo.observe(doc.body, { childList: true, subtree: true, characterData: true });
    var th = doc.querySelector('title');
    if (th) mo.observe(th, { childList: true, characterData: true, subtree: true });
  }
  window.__ptApply = function (e) { applyDoc(document, e, isAdmin); };

  function loadEntries(cb) {
    fetch(base + 'titles.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; })
      .then(function (j) { entries = (j && typeof j === 'object') ? j : {}; cb && cb(); });
  }
  function start() {
    loadEntries(function () {
      var e = entries[viewKey];
      if (e) applyDoc(document, e, isAdmin);
      if (isAdmin && window.top === window) buildUi();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* ---------- 관리 화면 : 제목 변경 창 ---------- */
  function findToken() {
    var v = '';
    try { v = localStorage.getItem(TKEY) || ''; } catch (e) {}
    if (v) return v;
    var RE = /^(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})$/;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var s = localStorage.getItem(localStorage.key(i));
        if (s && RE.test(s)) return s;
      }
    } catch (e) {}
    var pw = document.querySelectorAll('input[type=password]');
    for (var j = 0; j < pw.length; j++) if (RE.test((pw[j].value || '').trim())) return pw[j].value.trim();
    return '';
  }
  function getOrig(cb) {
    var e = entries[viewKey];
    if (e && e.orig) return cb(e.orig);
    if (viewKey === key) return cb(origTitle);
    fetch(base + viewKey + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (t) { cb((new DOMParser().parseFromString(t, 'text/html').title || '').trim()); })
      .catch(function () { cb(''); });
  }
  function liveApply(e) {
    window.__ptApply(e);
    var fr = document.querySelectorAll('iframe');
    for (var i = 0; i < fr.length; i++) {
      try { var w = fr[i].contentWindow; if (w && w.__ptApply && w.__ptKey === viewKey) w.__ptApply(e); } catch (x) {}
    }
  }
  function b64d(s) { return decodeURIComponent(escape(atob(s.replace(/\s/g, '')))); }
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
  async function saveEntries(token, mutate, msg) {
    var api = 'https://api.github.com/repos/' + REPO + '/contents/titles.json';
    var h = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
    var sha, obj = {};
    var g = await fetch(api + '?ref=main&t=' + Date.now(), { headers: h, cache: 'no-store' });
    if (g.ok) { var j = await g.json(); sha = j.sha; try { obj = JSON.parse(b64d(j.content)) || {}; } catch (e) { obj = {}; } }
    else if (g.status !== 404) throw new Error('불러오기 실패 ' + g.status);
    mutate(obj);
    var body = { message: msg, content: b64e(JSON.stringify(obj, null, 1) + '\n'), branch: 'main' };
    if (sha) body.sha = sha;
    var r = await fetch(api, { method: 'PUT', headers: h, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('저장 실패 ' + r.status + ' (토큰 권한과 저장소를 확인하십시오)');
    entries = obj;
  }

  function buildUi() {
    var css = document.createElement('style');
    css.textContent =
      '.pt-btn{font:inherit;font-size:12px;line-height:1.2;padding:5px 10px;margin:2px;border:1px solid #c8811a;border-radius:4px;background:#c8811a;color:#fff;cursor:pointer;white-space:nowrap}' +
      '.pt-btn.pt-float{position:fixed;left:8px;bottom:8px;z-index:2147483000;box-shadow:0 1px 4px rgba(0,0,0,.35)}' +
      '.pt-box{position:fixed;z-index:2147483600;width:min(420px,calc(100vw - 16px));background:#fff;color:#1d2433;border:2px solid #12355b;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.35);font:13px/1.45 system-ui,-apple-system,"Segoe UI","Malgun Gothic",sans-serif;word-break:keep-all;text-align:left}' +
      '.pt-box *{box-sizing:border-box}' +
      '.pt-hd{background:#12355b;color:#fff;padding:8px 10px;cursor:move;display:flex;align-items:center;gap:8px;border-radius:5px 5px 0 0;touch-action:none;user-select:none}' +
      '.pt-hd b{flex:1}.pt-x{background:none;border:0;color:#fff;font-size:18px;line-height:1;cursor:pointer;padding:0 4px}' +
      '.pt-bd{padding:10px 12px}.pt-bd label{display:block;font-weight:700;margin:8px 0 3px;color:#12355b}' +
      '.pt-bd input{width:100%;font:inherit;padding:6px 8px;border:1px solid #8aa0b8;border-radius:4px}' +
      '.pt-cur{padding:6px 8px;background:#f1f4f8;border-radius:4px;color:#33445a;overflow-wrap:anywhere}' +
      '.pt-key{font-size:11px;color:#6b7a8c;overflow-wrap:anywhere}' +
      '.pt-note{font-size:11px;color:#51606f;margin-top:6px}' +
      '.pt-ac{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}' +
      '.pt-ac button{font:inherit;font-size:13px;padding:6px 12px;border-radius:4px;border:1px solid #12355b;background:#fff;color:#12355b;cursor:pointer}' +
      '.pt-ac button.pt-pri{background:#c8811a;border-color:#c8811a;color:#fff;font-weight:700}' +
      '.pt-st{margin-top:8px;min-height:18px;font-size:12px;color:#12355b;overflow-wrap:anywhere}' +
      '@media print{.pt-btn,.pt-box{display:none!important}}';
    document.head.appendChild(css);

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'pt-btn'; btn.textContent = '✎ 제목 변경';
    var bar = null, cand = document.querySelectorAll('.bar,.tb,.tbw,.top,.admin-top,.hd,.savebar,#bar');
    for (var i = 0; i < cand.length; i++) {
      var r = cand[i].getBoundingClientRect();
      if (r.width > 0 && r.height > 0) { bar = cand[i]; break; }
    }
    if (bar) bar.appendChild(btn); else { btn.className += ' pt-float'; document.body.appendChild(btn); }

    var box = null;
    btn.addEventListener('click', function () { if (box) { box.style.display = 'block'; return; } open(); });

    function open() {
      box = document.createElement('div'); box.className = 'pt-box'; box.setAttribute('data-pt-skip', '');
      box.innerHTML =
        '<div class="pt-hd"><b>페이지 제목 변경</b><button type="button" class="pt-x" title="닫기">×</button></div>' +
        '<div class="pt-bd">' +
        '<div class="pt-key"></div>' +
        '<label>현재 제목</label><div class="pt-cur">불러오는 중...</div>' +
        '<label for="pt-new">새 제목</label><input id="pt-new" type="text" maxlength="100" autocomplete="off">' +
        '<div class="pt-tkw" style="display:none"><label for="pt-tk">GitHub 토큰</label><input id="pt-tk" type="password" autocomplete="off" placeholder="저장 권한이 있는 토큰"></div>' +
        '<div class="pt-note">브라우저 탭 제목과 화면 상단 제목이 함께 바뀝니다. 저장하면 보기 페이지에 곧 반영됩니다.</div>' +
        '<div class="pt-ac"><button type="button" class="pt-pri" id="pt-sv">저장 (GitHub 반영)</button><button type="button" id="pt-rs">원래대로</button><button type="button" id="pt-cl">닫기</button></div>' +
        '<div class="pt-st"></div></div>';
      document.body.appendChild(box);
      var $ = function (s) { return box.querySelector(s); };
      $('.pt-key').textContent = '대상 : ' + viewKey;
      var inp = $('#pt-new'), cur = $('.pt-cur'), st = $('.pt-st'), tkw = $('.pt-tkw'), tk = $('#pt-tk');
      var orig = '';
      if (!findToken()) tkw.style.display = 'block';
      getOrig(function (o) {
        orig = o;
        var e = entries[viewKey];
        cur.textContent = (e && e.title) || o || '(제목을 확인하지 못했습니다)';
        inp.value = (e && e.title) || o || '';
        if (!o) st.textContent = '원제목을 확인하지 못했습니다. 새 제목은 저장되나 화면 상단 제목은 바뀌지 않을 수 있습니다.';
        inp.focus();
      });
      var W = box.offsetWidth, H = box.offsetHeight;
      box.style.left = Math.max(8, (window.innerWidth - W) / 2) + 'px';
      box.style.top = Math.max(8, Math.min(60, window.innerHeight - H - 8)) + 'px';

      /* 드래그(이동) */
      var hd = $('.pt-hd'), dx = 0, dy = 0, drag = false;
      function pt(ev) { var t = ev.touches ? ev.touches[0] : ev; return { x: t.clientX, y: t.clientY }; }
      function down(ev) {
        if (ev.target.className === 'pt-x') return;
        var p = pt(ev), r = box.getBoundingClientRect(); dx = p.x - r.left; dy = p.y - r.top; drag = true;
      }
      function move(ev) {
        if (!drag) return; var p = pt(ev);
        var x = Math.max(0, Math.min(window.innerWidth - 60, p.x - dx)), y = Math.max(0, Math.min(window.innerHeight - 40, p.y - dy));
        box.style.left = x + 'px'; box.style.top = y + 'px'; if (ev.cancelable) ev.preventDefault();
      }
      function up() { drag = false; }
      hd.addEventListener('mousedown', down); hd.addEventListener('touchstart', down, { passive: true });
      document.addEventListener('mousemove', move); document.addEventListener('touchmove', move, { passive: false });
      document.addEventListener('mouseup', up); document.addEventListener('touchend', up);

      function hide() { box.style.display = 'none'; }
      $('.pt-x').onclick = hide; $('#pt-cl').onclick = hide;
      document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && box.style.display !== 'none') hide(); });

      function token() {
        var t = (tk.value || '').trim() || findToken();
        if (!t) { tkw.style.display = 'block'; st.textContent = 'GitHub 토큰을 입력하십시오.'; return ''; }
        return t;
      }
      async function run(entry, msg, remove) {
        var t = token(); if (!t) return;
        st.textContent = '저장 중...';
        try {
          await saveEntries(t, function (o) { if (remove) delete o[viewKey]; else o[viewKey] = entry; }, msg);
          if ((tk.value || '').trim()) { try { localStorage.setItem(TKEY, tk.value.trim()); } catch (e) {} }
          st.textContent = remove ? '원래 제목으로 되돌렸습니다.' : '저장 완료 : 보기 페이지에 곧 반영됩니다.';
          return true;
        } catch (e) { st.textContent = '저장 실패 : ' + e.message; return false; }
      }
      $('#pt-sv').onclick = async function () {
        var v = (inp.value || '').replace(/\s+/g, ' ').trim();
        if (!v) { st.textContent = '새 제목을 입력하십시오.'; return; }
        if (v === cur.textContent) { st.textContent = '현재 제목과 같습니다.'; return; }
        var prev = cur.textContent;
        var ent = { title: v, orig: orig || prev };
        if (await run(ent, '제목 변경 : ' + viewKey, false)) { liveApply(ent); cur.textContent = v; }
      };
      $('#pt-rs').onclick = async function () {
        if (!entries[viewKey]) { st.textContent = '변경된 제목이 없습니다.'; return; }
        var prev = cur.textContent, o = entries[viewKey].orig || orig;
        if (await run(null, '제목 원복 : ' + viewKey, true)) {
          liveApply({ title: o, orig: prev }); cur.textContent = o; inp.value = o;
        }
      };
    }
  }
})();
