/* SLGFC 공통 Copyright 연동 : contacts.json 의 copyright 문구를 모든 연동 페이지 하단에 표시
   - 문구 수정은 contacts_admin.html 의 「Copyright 문구」에서 하고 「GitHub 반영」으로 저장합니다.
   - 문구 안의 {YEAR} 는 페이지를 열 때마다 해당 연도로 자동 변경됩니다.
   - 사용법 : 페이지 끝에 <script src="copyright.js"></script> (하위 폴더는 ../copyright.js) 한 줄을 넣습니다.
   - 기존 문구(ⓒ연도. YOON HYUNCHUL, ALL RIGHTS RESERVED.)를 찾아 교체하며, 불러오지 못하면 기존 문구를 그대로 둡니다. */
(function () {
  var cs = document.currentScript, src = cs ? cs.src : '';
  var base = src ? src.replace(/[^\/]*(\?.*)?$/, '') : '';
  var RE = /^\s*(?:ⓒ|©|\(C\))\s*(?:\d{4}|\{YEAR\})\s*\.\s*YOON HYUNCHUL,\s*ALL RIGHTS?\s+RESERVED\.?\s*$/i;
  var DEF = 'ⓒ{YEAR}. YOON HYUNCHUL, ALL RIGHTS RESERVED.';
  var txt = null, busy = false;

  function out(t) { return t.replace(/\{YEAR\}/g, String(new Date().getFullYear())); }
  function apply() {
    if (txt === null || busy) return;
    busy = true;
    try {
      var all = document.body ? document.body.getElementsByTagName('*') : [];
      var hit = [];
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(e.tagName)) continue;
        if (e.getAttribute('data-cp-skip') !== null) continue;
        if (e.closest && e.closest('[data-cp-skip]')) continue;
        var t = e.textContent;
        if (!t || t.length > 120 || !RE.test(t)) continue;
        var inner = false;
        for (var c = 0; c < e.children.length; c++) { if (RE.test(e.children[c].textContent)) { inner = true; break; } }
        if (!inner) hit.push(e);
      }
      hit.forEach(function (e) {
        var o = out(txt);
        if (e.textContent === o) return;
        var keep = Array.prototype.slice.call(e.querySelectorAll('[id],[class]')); /* 기존 연도 span(#yr 등)은 숨겨서 보존 */
        e.textContent = o;
        keep.forEach(function (k) { k.style.display = 'none'; k.textContent = String(new Date().getFullYear()); e.appendChild(k); });
      });
    } catch (x) {}
    busy = false;
  }
  function run() {
    fetch(base + 'contacts.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var v = String((j && j.copyright) || '').replace(/\s+/g, ' ').trim();
      txt = v || DEF;
      apply();
      try { new MutationObserver(function () { apply(); }).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) {}
      window.addEventListener('beforeprint', apply);
    }).catch(function () {});
  }
  if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
