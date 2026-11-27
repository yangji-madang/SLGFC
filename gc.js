/* SLGFC 방문통계(GoatCounter) : 쿠키·개인정보 없이 페이지별·일별 조회수만 집계
   - 대시보드 : https://yangjimadang.goatcounter.com
   - 관리페이지(_admin)를 한 번 열면 그 브라우저는 집계에서 제외됩니다(본인 방문 제외).
   - 인쇄 전용 페이지(_print), 로컬 파일(file://), localhost 는 집계하지 않습니다. */
(function () {
  var p = location.pathname;
  try {
    if (/_admin(\.html)?$/i.test(p)) { localStorage.setItem('skipgc', 't'); return; }
    if (localStorage.getItem('skipgc')) return;
  } catch (e) {}
  if (location.protocol === 'file:' || /^(localhost|127\.|\[::1\])/.test(location.hostname) || /_print(\.html)?$/i.test(p)) return;
  var s = document.createElement('script');
  s.async = true;
  s.setAttribute('data-goatcounter', 'https://yangjimadang.goatcounter.com/count');
  s.src = '//gc.zgo.at/count.js';
  document.head.appendChild(s);
})();
