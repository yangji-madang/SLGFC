/* SLGFC 공통 담당자 표시 : contacts.json 의 담당자 목록을 읽어 페이지별로 선택 · 인쇄 하단에 표시
   - 선택은 페이지마다 따로 이 브라우저에 기억합니다(기본값 : 표시하지 않음).
   - 담당자 추가·수정·삭제는 contacts_admin.html 에서 합니다.
   - 사용법 : 푸터의 담당자 자리에 data-ct 속성을 넣고, 페이지 끝에 이 스크립트를 한 줄 넣습니다.
       <span class="l" data-ct></span> ... <script src="../contacts.js"></script>
   - 이미 #ctSel 이 있는 페이지는 그 화면을 그대로 쓰고 SLGCT 로 값을 가져갑니다. */
(function () {
  if (window.SLGCT) return;
  var FB = { contacts: [
    { id: 'c1', t: '삼성생명 개인/기업 재무 전문가 윤현철 팀장 · 010-9510-1088' },
    { id: 'c2', t: '개인ㆍ기업 재무 전문가 오선미 팀장 010-2448-7117' }
  ] };
  var cs = document.currentScript, src = cs ? cs.src : '';
  var base = src ? src.replace(/[^\/]*(\?.*)?$/, '') : '';
  var KEY = 'slgfc_ct_sel:' + location.pathname;
  var data = FB, loaded = false, cbs = [];

  function list() { return (data.contacts || []).filter(function (x) { return x && String(x.t || '').trim(); }); }
  function sel() {
    var v = ''; try { v = localStorage.getItem(KEY) || ''; } catch (e) {}
    return list().some(function (x) { return x.id === v; }) ? v : '';
  }
  function text() {
    var s = sel(), r = '';
    list().forEach(function (x) { if (x.id === s) r = String(x.t); });
    return r;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function apply() {
    var t = text();
    Array.prototype.forEach.call(document.querySelectorAll('[data-ct]'), function (e) { e.textContent = t; });
    try { document.dispatchEvent(new CustomEvent('slgct', { detail: { text: t } })); } catch (e) {}
  }
  function setSel(id) {
    try { if (id) localStorage.setItem(KEY, id); else localStorage.removeItem(KEY); } catch (e) {}
    build(); apply();
  }

  var css = '.slgct{position:relative;display:inline-block;font:inherit;font-size:12px;vertical-align:middle}' +
    '.slgct summary{cursor:pointer;list-style:none;padding:5px 12px;border:1px solid #17294a;border-radius:4px;background:#fff;color:#17294a;white-space:nowrap;line-height:1.2}' +
    '.slgct summary::-webkit-details-marker{display:none}' +
    '.slgct .pn{position:absolute;z-index:99;top:100%;margin-top:3px;right:0;min-width:270px;max-width:92vw;background:#fff;color:#222;border:1px solid #64748b;border-radius:4px;padding:5px 9px;box-shadow:0 2px 8px #0003;text-align:left}' +
    '.slgct .pn label{display:flex;align-items:flex-start;gap:5px;padding:3px 0;white-space:normal;cursor:pointer;line-height:1.35}' +
    '.slgct .pn label.no{border-top:1px solid #cbd5e1;margin-top:3px;padding-top:5px}' +
    '.slgct-fl{position:fixed;top:8px;right:10px;z-index:90}' +
    '@media print{.slgct,.slgct-fl{display:none!important}}';
  function addCss() {
    if (document.getElementById('slgctCss')) return;
    var s = document.createElement('style'); s.id = 'slgctCss'; s.textContent = css; document.head.appendChild(s);
  }

  function mount(d) {
    var tgt = document.getElementById('ctMount');
    if (tgt) { tgt.appendChild(d); return; }
    var p = document.getElementById('prt') || document.querySelector('button[onclick*="window.print"]');
    if (p && p.parentNode) { p.parentNode.insertBefore(d, p); return; }
    var b = document.querySelector('.bar,.toolbar,#top');
    if (b) { b.appendChild(d); return; }
    d.classList.add('slgct-fl'); document.body.appendChild(d);
  }
  function build() {
    if (document.getElementById('ctSel') && !document.getElementById('ctSel').getAttribute('data-slgct')) return;   /* 페이지 자체 선택 화면 사용 */
    addCss();
    var l = list(), s = sel(), d = document.getElementById('ctSel');
    if (!d) {
      d = document.createElement('details'); d.id = 'ctSel'; d.className = 'slgct'; d.setAttribute('data-slgct', '1');
      d.innerHTML = '<summary>담당자 표시 ▾</summary><div class="pn"></div>';
      mount(d);
      d.addEventListener('change', function (ev) {
        var r = ev.target; if (r && r.name === 'slgctR') { d.open = false; setSel(r.value); }
      });
      document.addEventListener('click', function (ev) { if (d.open && !d.contains(ev.target)) d.open = false; });
    }
    var h = '';
    l.forEach(function (x) { h += '<label><input type="radio" name="slgctR" value="' + esc(x.id) + '"' + (x.id === s ? ' checked' : '') + '><span>' + esc(x.t) + '</span></label>'; });
    h += '<label class="no"><input type="radio" name="slgctR" value=""' + (s ? '' : ' checked') + '><span>표시하지 않음</span></label>';
    d.querySelector('.pn').innerHTML = h;
  }

  function done() {
    loaded = true; build(); apply();
    var q = cbs; cbs = []; q.forEach(function (f) { try { f(); } catch (e) {} });
  }
  function load() {
    var u = (base || '') + 'contacts.json';
    try {
      fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { if (j && Array.isArray(j.contacts)) data = j; done(); })
        .catch(function () { done(); });
    } catch (e) { done(); }
  }

  window.SLGCT = {
    list: list, sel: sel, text: text, setSel: setSel,
    ready: function (f) { if (loaded) { try { f(); } catch (e) {} } else { cbs.push(f); } }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load); else load();
})();
