/* 정부지원금·세제지원 — 공통 로직 (보기·인쇄 페이지 공유) */
(function () {
  'use strict';
  var G = window.GS = {};
  G.LV = ['중앙정부', '지자체', '공공·금융기관'];
  G.CAT = ['자금·보증', '보조금·바우처', '고용·사회보험', '세제지원', '창업·R&D·수출', '재기·채무조정', '승계·상속'];
  G.TG = ['소상공인', '소기업', '중소기업', '중견기업', '창업기업', '법인대표(개인)'];
  /* 포함 관계: 소상공인 ⊂ 소기업 ⊂ 중소기업, 창업기업 ⊂ 중소기업 → 상위 규모 대상 제도는 하위 규모 기업에도 적용되는 것으로 본다
     (근거: 소상공인기본법 제2조, 중소기업기본법 제2조, 중소기업창업 지원법 제2조). 표시용 대상 목록(it.tg)은 원문 그대로 둔다. */
  G.TGDOWN = { '중소기업': ['소기업', '소상공인', '창업기업'], '소기업': ['소상공인'] };
  G.tgx = function (it) {
    var t = (it.tg || []).slice();
    (it.tg || []).forEach(function (x) { (G.TGDOWN[x] || []).forEach(function (y) { if (t.indexOf(y) < 0) t.push(y); }); });
    return t;
  };
  G.IND = ['전업종', '제조업', '도소매업', '의료업', '서비스업', '업종 한정(공고·법령 확인)'];
  G.PF = ['융자', '보증', '이차보전', '보조금·바우처', '장려금', '보험료지원', '컨설팅·교육', '채무조정', '세액공제', '세액감면', '소득공제', '세율·과세특례', '상속·증여세 특례'];
  G.LT = ['매출·소득기준', '상시근로자·고용기준', '업력·창업기한', '업종 제한', '지역 제한', '신청기한·선착순', '체납·신용 제한', '사후관리·추징', '교육·인증 요건'];
  G.REL = ['공식', '보도', '참고'];
  G.CONTACT = '삼성생명 개인/기업 재무 전문가 윤현철 팀장 010-9510-1088';
  G.COPY = 'ⓒ2026. YOON HYUNCHUL ALL RIGHTS RESERVED.';

  G.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var esc = G.esc;
  G.safeUrl = function (u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : ''; };
  G.fmtD = function (s) { return String(s || '').replace(/-/g, '.'); };
  G.dayNum = function (s) {
    var m = /^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/.exec(String(s || ''));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN;
  };

  /* 데이터 로드 (관리페이지 미리보기: ?preview=1) */
  G.load = function () {
    var d = window.GOV_SUPPORT_DATA || { items: [], timeline: [] };
    var cfg = window.GOV_SUPPORT_CONFIG || {};
    var up = window.GOV_SUPPORT_UPDATES || { asOf: '', log: [] };
    G.preview = false;
    if (/[?&]preview=1/.test(location.search)) {
      try {
        var p = JSON.parse(sessionStorage.getItem('govPreview') || 'null');
        if (p && p.data) { d = p.data; cfg = p.cfg || cfg; up = p.upd || up; G.preview = true; }
      } catch (e) { /* 무시 */ }
    }
    G.items = d.items || [];
    G.timeline = d.timeline || [];
    G.cfg = cfg;
    G.upd = up;
    G.asOf = up.asOf || '';
  };

  /* 여러 줄 텍스트 → 줄 단위 HTML ('- ' 시작은 글머리) */
  G.txt = function (s) {
    if (!s) return '';
    return String(s).split('\n').map(function (l) {
      if (/^- /.test(l)) return '<span class="ln bl">· ' + esc(l.slice(2)) + '</span>';
      return '<span class="ln">' + esc(l) + '</span>';
    }).join('');
  };

  /* 최근 변경된 항목은 변경 전 값을 취소선으로 함께 표시 */
  G.cv = function (it, f, html) {
    var c = G.cfg || {};
    if (c.showChg === false) return html;
    var days = c.chgDays || 30, base = G.dayNum(G.asOf), out = '';
    ((G.upd && G.upd.log) || []).forEach(function (e) {
      if (e.n === it.n && e.f === f && base - G.dayNum(e.date) <= days && base - G.dayNum(e.date) >= 0) {
        out += '<div class="sm"><s class="oldv">' + esc(String(e.old).replace(/\n/g, ' / ')) + '</s> (변경 ' + esc(G.fmtD(e.date)) + ')</div>';
      }
    });
    return html + out;
  };

  function tag(cls, t) { return '<span class="tgs ' + cls + '">' + esc(t) + '</span>'; }
  G.catCls = function (c) { var i = G.CAT.indexOf(c); return 't-c' + (i < 0 ? 0 : i); };
  G.lvCls = function (l) { var i = G.LV.indexOf(l); return 't-lv' + (i < 0 ? 0 : i); };

  /* 한 행 생성 */
  G.row = function (it) {
    var tr = document.createElement('tr');
    var relCls = it.rel === '공식' ? 't-ok' : (it.rel === '보도' ? 't-nw' : 't-rf');
    var c1 = '<div class="nm">' + esc(it.n) + '</div>' +
      '<div>' + tag(G.lvCls(it.lv), it.lv) + (it.r && it.r !== '전국' ? tag('t-tg', it.r + (it.q ? ' ' + it.q : '')) : tag('t-tg', '전국')) + '</div>' +
      '<div class="sm">' + esc(it.ag) + '</div>' +
      (it.law ? '<div class="sm">근거: ' + esc(it.law) + '</div>' : '');
    var c2 = tag(G.catCls(it.cat), it.cat) + '<div>' + (it.pf || []).map(function (p) { return tag('t-pf', p); }).join('') + '</div>';
    var c3 = '<div>' + (it.tg || []).map(function (p) { return tag('t-tg', p); }).join('') + '</div>' +
      '<div class="sm">업종: ' + esc((it.ind || []).join(', ')) + '</div>';
    var c4 = G.cv(it, 'a', G.txt(it.a));
    if (it.ch) c4 += '<div class="chg"><b>변경</b> ' + esc(it.ch) + (it.fd && !it.fu ? ' (' + esc(it.fd) + ')' : '') + '</div>';
    if (it.fu) c4 += '<div class="fu"><b>예정·개정</b> ' + esc(it.fu) + (it.fd ? ' <span class="sm">[' + esc(it.fd) + ']</span>' : '') + '</div>';
    var c5 = '<div>' + (it.lt || []).map(function (p) { return tag('t-lt', p); }).join('') + '</div>' + G.cv(it, 'lim', G.txt(it.lim));
    var c6 = G.cv(it, 'w', G.txt(it.w));
    if (it.d) c6 += '<div style="margin-top:3px"><b>시기·기한</b> ' + esc(it.d) + '</div>';
    var c7 = tag(relCls, '출처 ' + it.rel) + (it.chk ? tag('t-ck', '확인필요') : '') + (it.end ? tag('t-end', '마감·종료 가능') : '');
    if (it.chk) c7 += '<div class="ckr">' + esc(it.chk) + '</div>';
    c7 += '<ol class="src" style="padding-left:16px;margin:3px 0 0">' + (it.src || []).map(function (s) {
      var u = G.safeUrl(s[1]);
      return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(s[0]) + '</a>' : esc(s[0])) + '</li>';
    }).join('') + '</ol><div class="sm">확인일 ' + esc(G.fmtD(it.v)) + '</div>';
    var cells = [['지원·정책명 / 주체', c1], ['분류·형태', c2], ['대상 기업', c3], ['지원 내용', c4], ['제한조건', c5], ['신청·문의', c6], ['확인·출처', c7]];
    tr.innerHTML = cells.map(function (c, i) { return '<td data-l="' + esc(c[0]) + '">' + c[1] + '</td>'; }).join('');
    return tr;
  };

  G.THEAD = '<tr><th style="min-width:200px">지원·정책명 / 주체</th><th style="min-width:110px">분류·형태</th><th style="min-width:150px">대상 기업</th><th style="min-width:330px">지원 내용</th><th style="min-width:270px">제한조건</th><th style="min-width:190px">신청·문의</th><th style="min-width:230px">확인·출처</th></tr>';

  /* 필터 */
  G.F0 = function () { return { q: '', lv: '', tg: '', lt: '', lvm: 'or', tgm: 'or', ltm: 'or', qm: 'or', lvs: [], tgs: [], lts: [], cats: [], pfs: [], rels: [], chk: false, hideEnd: false, id: '' }; };
  function has(arr, s) { return (arr || []).join(' ').toLowerCase().indexOf(s) >= 0; }
  G.match = function (it, F) {
    var s;
    if (F.id && it.id !== F.id) return false;
    if (F.cats.length && F.cats.indexOf(it.cat) < 0) return false;
    if (F.pfs.length && !F.pfs.some(function (x) { return (it.pf || []).indexOf(x) >= 0; })) return false;
    if (F.rels.length && F.rels.indexOf(it.rel) < 0) return false;
    if (F.chk && !it.chk) return false;
    if (F.hideEnd && it.end) return false;
    if (F.lvs && F.lvs.length && F.lvs.indexOf(it.lv) < 0) return false;
    if (F.tgs && F.tgs.length && !F.tgs.some(function (x) { return G.tgx(it).indexOf(x) >= 0 || (it.ind || []).indexOf(x) >= 0; })) return false;
    if (F.lts && F.lts.length && !F.lts.some(function (x) { return (it.lt || []).indexOf(x) >= 0; })) return false;
    function terms(v) { return String(v || '').split(/[,，、]/).map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean); }
    var tl = terms(F.lv);
    if (tl.length) {
      var h1 = (it.lv + ' ' + it.ag + ' ' + it.r + ' ' + (it.q || '')).toLowerCase();
      if (!(F.lvm === 'and' ? tl.every : tl.some).call(tl, function (t) { return h1.indexOf(t) >= 0; })) return false;
    }
    tl = terms(F.tg);
    if (tl.length && !(F.tgm === 'and' ? tl.every : tl.some).call(tl, function (t) { return has(G.tgx(it), t) || has(it.ind, t); })) return false;
    tl = terms(F.lt);
    if (tl.length && !(F.ltm === 'and' ? tl.every : tl.some).call(tl, function (t) { return has(it.lt, t) || (it.lim || '').toLowerCase().indexOf(t) >= 0; })) return false;
    if (F.q) {
      var ws = F.q.trim().toLowerCase().split(/[\s,，、]+/).filter(Boolean);
      var hay = [it.n, it.sn, it.ag, it.lv, it.r, it.q, it.cat, (it.tg || []).join(' '), (it.ind || []).join(' '), (it.pf || []).join(' '),
        (it.lt || []).join(' '), it.a, it.lim, it.w, it.d, it.law, it.ch, it.fu, it.chk,
        (it.src || []).map(function (x) { return x[0]; }).join(' ')].join(' ').toLowerCase();
      if (ws.length && !(F.qm === 'and' ? ws.every : ws.some).call(ws, function (w) { return hay.indexOf(w) >= 0; })) return false;
    }
    return true;
  };
  G.filter = function (F) { return G.items.filter(function (it) { return G.match(it, F); }); };

  /* URL 파라미터 ↔ 필터 (보기 → 인쇄 연동) */
  G.toQS = function (F) {
    var p = [];
    ['q', 'lv', 'tg', 'lt'].forEach(function (k) { if (F[k]) p.push(k + '=' + encodeURIComponent(F[k])); });
    ['lvs', 'tgs', 'lts', 'cats', 'pfs', 'rels'].forEach(function (k) { if (F[k].length) p.push(k + '=' + encodeURIComponent(F[k].join('~'))); });
    ['lvm', 'tgm', 'ltm', 'qm'].forEach(function (k) { if (F[k] === 'and') p.push(k + '=and'); });
    if (F.chk) p.push('chk=1');
    if (F.hideEnd) p.push('he=1');
    return p.join('&');
  };
  G.fromQS = function (qs) {
    var F = G.F0();
    String(qs || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = kv.slice(0, i), v = '';
      try { v = decodeURIComponent(kv.slice(i + 1)); } catch (e) { v = ''; }
      if (['q', 'lv', 'tg', 'lt'].indexOf(k) >= 0) F[k] = v;
      else if (k === 'lvs' || k === 'tgs' || k === 'lts' || k === 'cats' || k === 'pfs' || k === 'rels') F[k] = v ? v.split('~') : [];
      else if (k === 'lvm' || k === 'tgm' || k === 'ltm' || k === 'qm') F[k] = v === 'and' ? 'and' : 'or';
      else if (k === 'chk') F.chk = v === '1';
      else if (k === 'he') F.hideEnd = v === '1';
    });
    return F;
  };

  G.fillSel = function (sel, arr, first) {
    sel.innerHTML = '<option value="">' + esc(first) + '</option>' + arr.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
  };
  G.fillDL = function (dl, arr) { dl.innerHTML = arr.map(function (x) { return '<option value="' + esc(x) + '">'; }).join(''); };
  G.uniq = function (arr) { return arr.filter(function (x, i) { return x && arr.indexOf(x) === i; }); };

  /* 필터 UI 공통 구성 (보기·인쇄) — 요소 id: fq flv ftg flt fcat fpf frel fchk fend */
  G.initFilterUI = function (F, onChange) {
    var $ = function (id) { return document.getElementById(id); };
    G.fillDL($('dlv'), G.uniq(G.LV.concat(G.items.map(function (i) { return i.ag.split('·'); }).reduce(function (a, b) { return a.concat(b); }, []), ['서울', '경기', '화성시'])));
    G.fillDL($('dtg'), G.TG.concat(G.IND));
    G.fillDL($('dlt'), G.LT);
    var GR = [['clv', 'lvs', G.LV], ['ctg', 'tgs', G.TG.concat(G.IND)], ['clt', 'lts', G.LT], ['ccat', 'cats', G.CAT], ['cpf', 'pfs', G.PF], ['crel', 'rels', G.REL]];
    function chips() {
      GR.forEach(function (g) {
        $(g[0]).innerHTML = '<button type="button" class="chip all' + (F[g[1]].length ? '' : ' on') + '" data-g="' + g[1] + '" data-v="">전체</button>' +
          g[2].map(function (x) { return '<button type="button" class="chip' + (F[g[1]].indexOf(x) >= 0 ? ' on' : '') + '" data-g="' + g[1] + '" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('');
      });
    }
    G.toggleSel = function (g, v) {
      if (!v) F[g] = [];
      else { var i = F[g].indexOf(v); if (i >= 0) F[g].splice(i, 1); else F[g].push(v); }
      G.syncUI();
    };
    $('flt').addEventListener('click', function (e) {
      var ab = e.target.closest('.ao button'); 
      if (ab) { F[ab.parentNode.dataset.f + 'm'] = ab.dataset.m; G.syncUI(); onChange(); return; }
      var b = e.target.closest('button.chip[data-g]'); if (!b) return;
      G.toggleSel(b.dataset.g, b.dataset.v); onChange();
    });
    function read() {
      F.q = $('fq').value; F.lv = $('flv').value; F.tg = $('ftg').value; F.lt = $('flt2').value;
      F.chk = $('fchk').checked; F.hideEnd = $('fend').checked;
    }
    G.syncUI = function () {
      [['lvm', 'lv'], ['tgm', 'tg'], ['ltm', 'lt'], ['qm', 'q']].forEach(function (m) {
        Array.prototype.forEach.call(document.querySelectorAll('.ao[data-f="' + m[1] + '"] button'), function (b) { b.classList.toggle('on', b.dataset.m === F[m[0]]); });
      });
      $('fq').value = F.q; $('flv').value = F.lv; $('ftg').value = F.tg; $('flt2').value = F.lt;
      chips();
      $('fchk').checked = F.chk; $('fend').checked = F.hideEnd;
    };
    ['fq', 'flv', 'ftg', 'flt2', 'fchk', 'fend'].forEach(function (id) {
      var ev = (id === 'fq' || id === 'flv' || id === 'ftg' || id === 'flt2') ? 'input' : 'change';
      $(id).addEventListener(ev, function () { read(); onChange(); });
    });
    $('freset').addEventListener('click', function () {
      var n = G.F0(); for (var k in n) F[k] = n[k];
      G.syncUI(); onChange();
    });
    G.syncUI();
  };

  /* 필터 영역 HTML */
  G.FILTER_HTML =
    '<div><label for="fq">통합 검색 (키워드, 공백·쉼표 구분)</label><span class="ao" data-f="q"><button type="button" data-m="or" class="on">OR</button><button type="button" data-m="and">AND</button></span><input type="search" id="fq" placeholder="예: 고용, 법인세, 새출발, 노란우산" autocomplete="off"></div>' +
    '<div class="cg"><label>지급 주체 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="clv"></div></div>' +
    '<div class="cg"><label>대상 기업 — 규모·업종 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="ctg"></div></div>' +
    '<div class="cg"><label>제한조건 유형 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="clt"></div></div>' +
    '<div class="cg"><label>분류 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="ccat"></div></div>' +
    '<div class="cg"><label>지원 형태 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="cpf"></div></div>' +
    '<div class="cg"><label>출처 등급 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="crel"></div></div>' +
    '<div><label for="flv">지급 주체 직접 입력 (쉼표 구분)</label><span class="ao" data-f="lv"><button type="button" data-m="or" class="on">OR</button><button type="button" data-m="and">AND</button></span><input type="text" id="flv" list="dlv" placeholder="예: 서울, 화성시, 경기" autocomplete="off"><datalist id="dlv"></datalist></div>' +
    '<div><label for="ftg">대상 기업 직접 입력 (쉼표 구분)</label><span class="ao" data-f="tg"><button type="button" data-m="or" class="on">OR</button><button type="button" data-m="and">AND</button></span><input type="text" id="ftg" list="dtg" placeholder="소상공인·제조업 등" autocomplete="off"><datalist id="dtg"></datalist></div>' +
    '<div><label for="flt2">제한조건 직접 입력 (쉼표 구분)</label><span class="ao" data-f="lt"><button type="button" data-m="or" class="on">OR</button><button type="button" data-m="and">AND</button></span><input type="text" id="flt2" list="dlt" placeholder="매출·업력·지역 등" autocomplete="off"><datalist id="dlt"></datalist></div>' +
    '<div class="ck"><input type="checkbox" id="fchk"><label for="fchk" style="margin:0">확인필요 항목만</label></div>' +
    '<div class="ck"><input type="checkbox" id="fend"><label for="fend" style="margin:0">마감·종료 가능 제외</label></div>' +
    '<div><button type="button" class="btn sub" id="freset">필터 초기화</button></div>';


  /* 개요 도식 전용: ‘종합’ 성격의 제도를 하위 제도로 풀어서 표시 (출처: 고용노동부 ‘2026년도 고용장려금 지원 제도’ 안내, 2026.2.18) */
  G.SUBH = 4;
  G.SUB = {
    g10: [['고용촉진', '고용촉진장려금'], ['워라밸+4.5', '워라밸일자리 장려금(워라밸+4.5 프로젝트)'], ['근로시간 단축', '워라밸일자리 장려금(소정근로시간 단축)'], ['환경개선', '일·가정 양립 환경개선'], ['정규직 전환', '정규직 전환 지원'], ['출산육아기', '출산육아기 고용안정장려금'], ['고용유지', '고용유지지원금'], ['고령자 안정', '고령자 고용안정지원'], ['지역고용', '지역고용촉진지원금']]
  };

  /* 가업상속공제·가업승계 증여세 과세특례 요건표 팝업 (현행법 기준) */
  G.SUCC = {
    inh: { t: '가업상속공제 요건표 (현행법)', law: '상속세 및 증여세법 제18조의2, 같은 법 시행령 제15조', rows: [
      ['가업 요건', '중소기업(자산총액 5,000억원 미만 등 중소기업기본법상 중소기업) 또는 중견기업(직전 3개 사업연도 매출액 평균 5,000억원 미만). 시행령 별표의 가업상속공제 적용 업종이며 부동산임대업·일반유흥주점업 등은 제외'],
      ['피상속인(대표자)', '10년 이상 계속 경영한 가업, 상속개시일 현재 국내 거주자. 최대주주로서 특수관계인 합산 지분 40% 이상(상장법인 20% 이상)을 10년 이상 계속 보유'],
      ['피상속인 대표이사 재직', '다음 중 하나 — ① 가업영위기간의 50% 이상 대표이사 재직 ② 상속인이 직을 승계해 상속개시일까지 계속 재직하는 경우 10년 이상 재직 ③ 상속개시일 소급 10년 중 5년 이상 재직'],
      ['상속인(승계자)', '상속개시일 현재 만 18세 이상. 상속개시 전 2년 이상 직접 가업 종사(피상속인이 65세 이전 사망하거나 부득이한 사유가 있으면 예외). 상속세 신고기한까지 임원 취임, 신고기한부터 2년 이내 대표이사 취임. 상속인의 배우자가 요건을 갖추면 상속인이 충족한 것으로 봄(법인사업자)'],
      ['공제한도', '가업영위기간 10년 이상 300억원 · 20년 이상 400억원 · 30년 이상 600억원. 법인은 주식가액 × (1 − 사업무관자산 ÷ 총자산)'],
      ['중견기업 추가', '가업 외 상속재산가액이 가업상속공제를 적용하지 않을 때 납부할 상속세의 2배를 넘지 않을 것'],
      ['사후관리(5년)', '업종 유지 · 대표 종사 및 지분 유지 · 정규직 근로자 수와 총급여액 평균 90% 이상 유지 · 가업용 자산 40% 이상 처분 금지. 위반 시 공제세액과 이자상당액 추징']] },
    gift: { t: '가업승계 증여세 과세특례 요건표 (현행법)', law: '조세특례제한법 제30조의6, 같은 법 시행령 제27조의6', rows: [
      ['대상 재산', '법인의 주식·출자지분만 해당(개인사업자의 사업용 자산은 대상 아님)'],
      ['가업 요건', '가업상속공제와 동일 — 중소기업 또는 매출액 평균 5,000억원 미만 중견기업, 시행령 별표 업종'],
      ['증여자', '증여일 현재 만 60세 이상 부모(부모가 사망한 경우 조부모 포함). 10년 이상 계속 경영, 최대주주로서 특수관계인 합산 지분 40% 이상(상장법인 20% 이상)을 10년 이상 계속 보유'],
      ['수증자', '증여일 현재 만 18세 이상 거주자인 자녀(직계비속). 수증자 또는 그 배우자가 증여세 신고기한(증여일이 속한 달의 말일부터 3개월)까지 가업에 종사하고, 증여일부터 3년 이내 대표이사 취임'],
      ['특례 내용', '증여세 과세가액에서 10억원을 공제한 뒤 과세표준 120억원 이하 10%, 초과분 20%. 한도는 가업영위기간 10년 이상 300억원 · 20년 이상 400억원 · 30년 이상 600억원. 증여세 신고세액공제는 적용하지 않음'],
      ['상속 시 정산', '특례를 적용받은 주식은 증여 시기와 관계없이 증여자의 상속재산에 가산. 상속개시일에 가업상속공제 요건을 갖추면 가업상속공제 가능'],
      ['사후관리(5년)', '증여일부터 5년 내 가업 종사·휴업·폐업 여부, 수증자 지분 감소 여부 관리. 신고기한까지 종사하지 않거나 3년 내 대표이사에 취임하지 않으면 위반. 위반 시 일반 증여세와 이자상당액 부과']] }
  };
  G.showSucc = function (kind) {
    var D = G.SUCC[kind]; if (!D) return;
    var h = '<h3>' + esc(D.t) + '</h3><table class="dpt"><tbody>';
    D.rows.forEach(function (r) { h += '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; });
    h += '</tbody></table><p class="dpl"><b>근거</b> ' + esc(D.law) + '</p>';
    h += '<p class="dpn">※ 2026 세제개편안(정부안: 가업상속공제 한도 경영연수×20억원·최대 1,000억원, 경영요건 30년 등)은 국회 확정 전이라 이 표와 판정에 반영하지 않았습니다. 사후관리 기준 등은 개정될 수 있으므로 적용 전 국가법령정보센터(law.go.kr)와 세무전문가를 통해 확인하세요.</p>';
    G.pop(h);
  };

  /* 개요 도식: 지원 종류(행) × 대상 기업(열) 매트릭스 — 칩 색상 = 지급 주체 */
  G.matrix = function (list, opt) {
    opt = opt || {};
    var cols = G.TG.slice(), cats = G.CAT.slice();
    list.forEach(function (i) { if (cats.indexOf(i.cat) < 0 && i.cat) cats.push(i.cat); });
    if (list.some(function (i) { return !(i.tg || []).length; })) cols.push('공통·기타');
    function inCol(i, c) { var t = G.tgx(i); return c === '공통·기타' ? !t.length : t.indexOf(c) >= 0; }
    var h = '<table class="mx"><thead><tr><th class="cn"><span>지원 종류</span><i>▼</i><span class="r">대상 기업 ▶</span></th>';
    cols.forEach(function (c) {
      h += '<th' + (G.DEF[c] ? ' class="dfh" data-def="' + esc(c) + '" tabindex="0" role="button" title="클릭하면 ' + esc(c) + '의 정의를 볼 수 있습니다"' : '') + '>' + esc(c) + (G.DEF[c] ? '<i class="dfi">ⓘ</i>' : '') + '<span class="n">' + list.filter(function (i) { return inCol(i, c); }).length + '건</span></th>';
    });
    h += '<th class="tt">합계</th></tr></thead><tbody>';
    cats.forEach(function (cat, ci) {
      var rows = list.filter(function (i) { return i.cat === cat; });
      var lvc = G.LV.map(function (l, k) { var n = rows.filter(function (i) { return i.lv === l; }).length; return n ? '<b class="l' + k + '">' + esc(l.replace('공공·금융기관', '공공·금융')) + ' ' + n + '</b>' : ''; }).join('');
      /* 같은 제도가 연속한 열에 걸치면 한 칸으로 병합(colspan), 중간에 끊기면 구간마다 다시 표시 */
      var segs = [];
      rows.forEach(function (i, ix) {
        var idx = [];
        cols.forEach(function (c, k) { if (inCol(i, c)) idx.push(k); });
        var st = null, en = null;
        idx.forEach(function (k) {
          if (st === null) { st = en = k; } else if (k === en + 1) { en = k; } else { segs.push({ i: i, s: st, e: en, o: ix }); st = en = k; }
        });
        if (st !== null) segs.push({ i: i, s: st, e: en, o: ix });
      });
      /* 일반 제도 먼저, 하위 제도를 풀어 보여주는 제도(여러 줄 차지)는 나중에 배치 */
      segs.forEach(function (sg) { sg.h = (G.SUB && G.SUB[sg.i.id]) ? G.SUBH : 1; });
      segs.sort(function (x, y) { return (x.h > 1) - (y.h > 1) || x.s - y.s || (y.e - y.s) - (x.e - x.s) || x.o - y.o; });
      var lanes = [];
      function free(k, sg) { for (var r = k; r < k + sg.h; r++) for (var q = sg.s; q <= sg.e; q++) if (lanes[r] && lanes[r][q]) return false; return true; }
      segs.forEach(function (sg) {
        var k = 0, r, q;
        while (!free(k, sg)) k++;
        for (r = k; r < k + sg.h; r++) { if (!lanes[r]) lanes[r] = []; for (q = sg.s; q <= sg.e; q++) lanes[r][q] = 'x'; }
        lanes[k][sg.s] = sg;
      });
      for (var z = 0; z < lanes.length; z++) if (!lanes[z]) lanes[z] = [];
      if (!lanes.length) lanes.push([]);
      var colHas = cols.map(function (c) { return rows.some(function (i) { return inCol(i, c); }); });
      lanes.forEach(function (L, li) {
        h += '<tr class="cb' + (ci % 2) + (li === lanes.length - 1 ? ' ll' : '') + '">';
        if (li === 0) h += '<th class="rh" rowspan="' + lanes.length + '">' + esc(cat) + '<span class="n">' + rows.length + '건</span><span class="lv">' + lvc + '</span></th>';
        for (var c = 0; c < cols.length; c++) {
          var sg = L[c];
          if (sg && sg !== 'x') {
            var i = sg.i, k2 = Math.max(0, G.LV.indexOf(i.lv));
            var attr = (opt.click ? ' data-id="' + esc(i.id) + '" role="button" tabindex="0"' : '');
            var sub = G.SUB && G.SUB[i.id];
            h += '<td colspan="' + (sg.e - sg.s + 1) + '"' + (sg.h > 1 ? ' rowspan="' + sg.h + '"' : '') + ' class="mxm">';
            if (sub) {
              h += '<div class="mxg l' + k2 + '"><b class="mxgt">' + esc(i.sn || i.n) + '</b>' + sub.map(function (t) {
                return '<span class="mxs2"' + attr + ' title="' + esc(i.n) + ' ▸ ' + esc(t[1]) + '">' + esc(t[0]) + '</span>';
              }).join('') + '</div>';
            } else {
              h += '<span class="mxc l' + k2 + '"' + attr + ' title="' + esc(i.n) + ' · ' + esc(i.lv) + '">' + esc(i.sn || i.n) + '</span>';
            }
            h += '</td>';
            c = sg.e;
          } else if (sg === 'x') { /* 병합 구간 안 */ }
          else h += '<td class="mxn">' + (li === 0 && !colHas[c] ? '<span class="mxe">-</span>' : '') + '</td>';
        }
        if (li === 0) h += '<td class="tt" rowspan="' + lanes.length + '">' + rows.length + '</td>';
        h += '</tr>';
      });
    });
    h += '</tbody></table>';
    return h;
  };
  G.matrixLegend = function (list) {
    return '<div class="mxl"><b>색상 = 지급 주체</b>' + G.LV.map(function (l, k) {
      return '<span class="mxc l' + k + '">' + esc(l) + ' <b>' + list.filter(function (i) { return i.lv === l; }).length + '</b>건</span>';
    }).join('') + '<span class="mxs">같은 제도가 여러 대상 기업에 해당하면 각 열에 함께 표시</span><span class="mxs"><b>총 ' + list.length + '건</b></span></div>';
  };


  /* 기업 규모 정의 팝업 — 개요 도식의 열 제목 클릭 시 표시 (근거: 각 법령 조항, 정확한 적용은 법제처 원문 확인) */
  G.DEF = {
    '소상공인': {
      d: '소상공인기본법 제2조에 따라, 상시 근로자 수가 일정 규모 미만이면서 업종별 매출액 요건(소기업 기준)을 충족하는 사업자.',
      rows: [['광업·제조업·건설업·운수업', '상시 근로자 10명 미만'], ['그 밖의 업종', '상시 근로자 5명 미만'], ['공통 요건', '중소기업기본법상 소기업 요건(업종별 3년 평균 매출액 기준 이내) 충족']],
      law: '소상공인기본법 제2조, 같은 법 시행령 제3조'
    },
    '소기업': {
      d: '중소기업 중 업종별 3년 평균 매출액이 아래 기준 이하이고 자산총액 5천억원 미만인 기업(소상공인은 소기업의 하위 개념).',
      rows: [['120억원 이하', '식료품·화학·의약품·금속가공·전자부품·자동차·가구 등 제조업 일부, 전기·가스업'], ['80억원 이하', '농림어업·광업·섬유·목재·인쇄·고무·플라스틱 등 제조업 일부, 건설업, 운수·창고업'], ['50억원 이하', '도매·소매업, 정보통신업 등'], ['30억원 이하', '부동산업, 전문·과학·기술 서비스업, 사업시설관리·지원서비스업 등'], ['10억원 이하', '숙박·음식점업, 교육서비스업, 보건·사회복지업, 수리·개인서비스업 등']],
      law: '중소기업기본법 제2조, 같은 법 시행령 제3조·별표 3 (업종별 상세 구간은 별표 원문 확인)'
    },
    '중소기업': {
      d: '업종별 평균 매출액이 아래 기준 이하이고, 자산총액 5천억원 미만이며, 독립성 기준(대기업 계열 아님)을 충족하는 기업.',
      rows: [['1,500억원 이하', '의복·가죽·펄프종이·1차 금속·전기장비·가구 제조업'], ['1,000억원 이하', '농림어업·광업·식료품·화학·고무플라스틱·금속가공·전자부품·자동차 제조업, 건설업, 도매·소매업 등'], ['800억원 이하', '음료·인쇄·의약품·비금속광물·의료정밀기기 제조업 등'], ['600억원 이하', '전문·과학·기술 서비스업, 사업시설관리·지원서비스업, 보건·사회복지업, 예술·스포츠업 등'], ['400억원 이하', '숙박·음식점업, 금융·보험업, 부동산업, 임대업, 교육서비스업'], ['독립성 기준', '자산총액 5천억원 이상 법인이 지분 30% 이상을 소유한 최다출자자인 경우, 상호출자제한기업집단 소속 회사 등은 제외']],
      law: '중소기업기본법 제2조, 같은 법 시행령 제3조·별표 1 (업종별 상세 구간은 별표 원문 확인)'
    },
    '중견기업': {
      d: '중소기업이 아니면서 아래 요건을 모두 갖춘 기업.',
      rows: [['독립성', '상호출자제한기업집단 소속이 아니고, 자산총액이 상호출자제한기업집단 지정기준 이상인 법인이 지분 30% 이상을 보유한 최다출자자인 기업이 아닐 것'], ['제외 업종', '금융업, 보험 및 연금업, 금융·보험 관련 서비스업(일반지주회사는 제외 대상 아님)'], ['제외 기관', '공공기관, 지방공기업 등'], ['참고', '‘중견기업 후보기업’: 중소기업 중 3년 평균 매출액 증가율 15% 이상 또는 R&D 투자비율 평균 2% 이상인 기업']],
      law: '중견기업 성장촉진 및 경쟁력 강화에 관한 특별법 제2조, 같은 법 시행령 제2조'
    },
    '창업기업': {
      d: '창업자가 사업을 개시한 날부터 7년이 지나지 않은 중소기업.',
      rows: [['기간 기준', '사업 개시일부터 7년 미만'], ['대상', '중소기업기본법상 중소기업'], ['창업 제외', '합병·분할·사업 양수 등으로 기존 사업을 승계하거나 업종만 추가·변경하는 경우, 폐업 후 동종 재개업 등은 창업으로 보지 않음(법 제2조·시행령 제2조)']],
      law: '중소기업창업 지원법 제2조 제3호·제5호, 같은 법 시행령 제2조'
    }
  };
  G.pop = function (html) {
    var m = document.getElementById('defPop');
    if (!m) {
      m = document.createElement('div'); m.id = 'defPop'; m.className = 'defpop noprint';
      m.innerHTML = '<div class="dpb" role="dialog" aria-modal="true"><button type="button" class="dpx" aria-label="닫기">×</button><div class="dpc"></div></div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('dpx')) m.style.display = 'none'; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.style.display = 'none'; });
    }
    m.querySelector('.dpc').innerHTML = html; m.style.display = 'flex';
  };
  G.showDef = function (name) {
    var D = G.DEF[name]; if (!D) return;
    var h = '<h3>' + esc(name) + '의 정의</h3><p class="dpd">' + esc(D.d) + '</p><table class="dpt"><tbody>';
    D.rows.forEach(function (r) { h += '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; });
    h += '</tbody></table><p class="dpl"><b>근거</b> ' + esc(D.law) + '</p><p class="dpn">※ 법령은 개정될 수 있으므로 실제 적용 전 국가법령정보센터(law.go.kr)의 현행 조문·별표를 확인하세요.</p>';
    G.pop(h);
  };

  /* 세율표 — 개인 종합소득세(소득세법 제55조, 2023년 이후 귀속), 법인세(법인세법 제55조, 2026.1.1 이후 개시 사업연도) */
  G.PTAX = [[1400, 6, 0], [5000, 15, 126], [8800, 24, 576], [15000, 35, 1544], [30000, 38, 1994], [50000, 40, 2594], [100000, 42, 3594], [Infinity, 45, 6594]]; /* 과세표준 상한(만원), 세율(%), 누진공제(만원) */
  G.CTAX = [[2, 10, 0], [200, 20, 0.2], [3000, 22, 4.2], [Infinity, 25, 94.2]]; /* 과세표준 상한(억원), 세율(%), 누진공제(억원) */
  function pick(tb, x) { for (var i = 0; i < tb.length; i++) if (x <= tb[i][0]) return i; return tb.length - 1; }
  G.mtrOf = function (man) { return (typeof man === 'number' && man > 0 && isFinite(man)) ? pick(G.PTAX, man) : -1; };
  G.ctrOf = function (eok) { return (typeof eok === 'number' && eok > 0 && isFinite(eok)) ? pick(G.CTAX, eok) : -1; };
  function fm(v) { /* 만원 → 억·만 표기 */ var e = Math.floor(v / 10000), m = Math.round(v - e * 10000); return (e ? e + '억' : '') + (m ? (e ? ' ' : '') + m.toLocaleString('ko-KR') + '만' : (e ? '' : '0')) + '원'; }
  function fe(v) { /* 억원 → 조·억·만 표기 */ var j = Math.floor(v / 10000), e = v - j * 10000, ee = Math.floor(e + 1e-9), mm = Math.round((e - ee) * 10000); return (j ? j + '조 ' : '') + (ee ? ee.toLocaleString('ko-KR') + '억' : '') + (mm ? (ee ? ' ' : '') + mm.toLocaleString('ko-KR') + '만' : '') + '원'; }
  G.fmMan = fm; G.fmEok = fe;
  G.showTax = function (kind, val) {
    var P = kind === 'p', T = P ? G.PTAX : G.CTAX, hi = P ? G.mtrOf(val) : G.ctrOf(val), h;
    h = '<h3>' + (P ? '개인 종합소득세율표 (과세표준 기준)' : '법인세율표 (2026.1.1 이후 개시 사업연도)') + '</h3>';
    h += '<table class="dpt tx"><thead><tr><th>과세표준</th><th>세율</th><th>누진공제액</th><th>지방소득세 포함</th></tr></thead><tbody>';
    T.forEach(function (r, i) {
      var lo = i ? T[i - 1][0] : 0, f = P ? fm : fe;
      var rng = (i === 0 ? f(r[0]) + ' 이하' : (r[0] === Infinity ? f(lo) + ' 초과' : f(lo) + ' 초과 ~ ' + f(r[0]) + ' 이하'));
      h += '<tr' + (i === hi ? ' class="hi"' : '') + '><td>' + rng + '</td><td class="c">' + r[1] + '%</td><td class="a">' + (r[2] ? f(r[2]) : '-') + '</td><td class="c">' + (Math.round(r[1] * 11) / 10) + '%</td></tr>';
    });
    h += '</tbody></table>';
    if (hi >= 0) {
      var r = T[hi], tax = P ? val * r[1] / 100 - r[2] : val * r[1] / 100 - r[2];
      h += '<p class="dpl"><b>입력값 ' + (P ? fm(val) : fe(val)) + '</b> → ' + r[1] + '% 구간 · 산출세액 약 <b>' + (P ? fm(tax) : fe(tax)) + '</b> (과세표준 × 세율 − 누진공제액)</p>';
    }
    h += '<p class="dpl"><b>근거</b> ' + (P ? '소득세법 제55조(종합소득세 세율), 지방소득세는 소득세액의 10%(지방세법 제92조)' : '법인세법 제55조, 지방소득세는 법인세액의 10%(지방세법 제103조의19). 2026.1.1 이후 개시 사업연도부터 종전 9·19·21·24%에서 10·20·22·25%로 환원') + '</p>';
    h += '<p class="dpn">※ 실제 세액은 감면·세액공제·가산세 등에 따라 달라질 수 있습니다. 적용 전 국가법령정보센터(law.go.kr)에서 현행 조문을 확인하세요.</p>';
    G.pop(h);
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-def]');
    if (t) G.showDef(t.getAttribute('data-def'));
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-def')) { e.preventDefault(); G.showDef(e.target.getAttribute('data-def')); }
  });


  /* 인쇄 머리글·바닥글: 쪽 여백 영역(@page 여백 상자)에 넣어 모든 쪽에서 잘리지 않고 쪽번호와 같은 줄에 표시 */
  G.hf = function () {
    function t(id) { var e = document.getElementById(id); return e ? e.textContent : ''; }
    function q(x) { return '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
    var st = document.getElementById('hfStyle');
    if (!st) { st = document.createElement('style'); st.id = 'hfStyle'; document.head.appendChild(st); }
    st.textContent = '@page{@top-left{content:' + q(t('fht')) + '}@top-right{content:' + q(t('fha')) + '}@bottom-left{content:' + q(t('ctct')) + '}@bottom-right{content:' + q(t('cpyt')) + '}}';
  };

  /* 표 틀고정: 머리글 행 + 왼쪽 n개 열(예: ‘지원·정책명’까지)을 고정 — rowspan·colspan 반영 */
  G.freeze = function (table, n) {
    var hr = table && table.tHead && table.tHead.rows[0];
    if (!hr || !table.offsetWidth) return;
    var acc = [0], i;
    for (i = 0; i < n && i < hr.cells.length; i++) acc[i + 1] = acc[i] + hr.cells[i].getBoundingClientRect().width;
    for (i = 0; i < n && i < hr.cells.length; i++) {
      var h = hr.cells[i]; h.style.position = 'sticky'; h.style.left = acc[i] + 'px'; h.style.zIndex = 4;
      h.classList.toggle('fzl', i === n - 1);
    }
    Array.prototype.forEach.call(table.tBodies, function (tb) {
      var occ = [];
      Array.prototype.forEach.call(tb.rows, function (r) {
        var col = 0, k;
        Array.prototype.forEach.call(r.cells, function (cell) {
          while (occ[col] > 0) col++;
          var cs = cell.colSpan, rs = cell.rowSpan;
          if (col < n && col + cs <= n) {
            cell.style.position = 'sticky'; cell.style.left = acc[col] + 'px'; cell.style.zIndex = 1;
            cell.classList.add('fzc'); cell.classList.toggle('fzl', col + cs === n);
          }
          for (k = 0; k < cs; k++) occ[col + k] = rs;
          col += cs;
        });
        for (k = 0; k < occ.length; k++) if (occ[k] > 0) occ[k]--;
      });
    });
  };
  /* 모바일: 고정 열은 좁게(px), 나머지 열은 PC 폭(1100px 기준) 그대로 — 표 모양은 PC와 동일하게 유지 */
  G.fitMobile = function (t) {
    var cg = t.querySelector('colgroup'); if (!cg) return;
    var mob = window.innerWidth <= 760, fw = (t.dataset.fzw || '').split(',').map(Number), tot = 0;
    Array.prototype.forEach.call(cg.children, function (c, i) {
      if (!c.dataset.p) c.dataset.p = parseFloat(c.style.width) || 0;
      if (mob) { var px = (fw[i] > 0) ? fw[i] : c.dataset.p * 11; c.style.setProperty('width', px + 'px', 'important'); tot += px; }
      else c.style.width = c.dataset.p + '%';
    });
    t.style.width = mob ? tot + 'px' : ''; t.style.minWidth = mob ? '0' : '';
  };
  G.freezeAll = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('table[data-fz]'), function (t) { G.fitMobile(t); G.freeze(t, parseInt(t.dataset.fz, 10) || 1); });
  };
  window.addEventListener('resize', function () { G.freezeAll(); });

  G.setTop = function () {
    var c = G.cfg || {};
    var h = document.getElementById('ttl');
    if (h && !h.dataset.fixed) h.innerHTML = esc(c.title || '정부지원·세제지원') + '<small>' + esc(c.sub || '') + '</small>';
    var a = document.getElementById('asof');
    if (a) a.textContent = '기준일 : ' + G.fmtD(G.asOf);
  };
  G.setFoot = function () {
    var c = (G.cfg && G.cfg.contact != null) ? G.cfg.contact : G.CONTACT;
    ['ctc', 'ctct'].forEach(function (i) { var e = document.getElementById(i); if (e) e.textContent = c; });
    var cp = (G.cfg && G.cfg.copy != null && G.cfg.copy !== '') ? G.cfg.copy : G.COPY;
    ['cpy', 'cpyt'].forEach(function (i) { var e = document.getElementById(i); if (e) e.textContent = cp; });
  };
})();
