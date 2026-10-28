/* 정부지원금·세제지원 — 공통 로직 (보기·인쇄 페이지 공유) */
(function () {
  'use strict';
  var G = window.GS = {};
  G.LV = ['중앙정부', '지자체', '공공·금융기관'];
  G.CAT = ['자금·보증', '보조금·바우처', '고용·사회보험', '세제지원', '창업·R&D·수출', '재기·채무조정', '승계·상속'];
  G.TG = ['소상공인', '소기업', '중소기업', '중견기업', '창업기업', '법인대표(개인)'];
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
  G.F0 = function () { return { q: '', lv: '', tg: '', lt: '', lvs: [], tgs: [], lts: [], cats: [], pfs: [], rels: [], chk: false, hideEnd: false }; };
  function has(arr, s) { return (arr || []).join(' ').toLowerCase().indexOf(s) >= 0; }
  G.match = function (it, F) {
    var s;
    if (F.cats.length && F.cats.indexOf(it.cat) < 0) return false;
    if (F.pfs.length && !F.pfs.some(function (x) { return (it.pf || []).indexOf(x) >= 0; })) return false;
    if (F.rels.length && F.rels.indexOf(it.rel) < 0) return false;
    if (F.chk && !it.chk) return false;
    if (F.hideEnd && it.end) return false;
    if (F.lvs && F.lvs.length && F.lvs.indexOf(it.lv) < 0) return false;
    if (F.tgs && F.tgs.length && !F.tgs.some(function (x) { return (it.tg || []).indexOf(x) >= 0 || (it.ind || []).indexOf(x) >= 0; })) return false;
    if (F.lts && F.lts.length && !F.lts.some(function (x) { return (it.lt || []).indexOf(x) >= 0; })) return false;
    if (F.lv) {
      s = F.lv.trim().toLowerCase();
      if (s && (it.lv + ' ' + it.ag + ' ' + it.r + ' ' + (it.q || '')).toLowerCase().indexOf(s) < 0) return false;
    }
    if (F.tg) {
      s = F.tg.trim().toLowerCase();
      if (s && (has(it.tg, s) ? 0 : (has(it.ind, s) ? 0 : 1))) return false;
    }
    if (F.lt) {
      s = F.lt.trim().toLowerCase();
      if (s && (has(it.lt, s) ? 0 : ((it.lim || '').toLowerCase().indexOf(s) >= 0 ? 0 : 1))) return false;
    }
    if (F.q) {
      var ws = F.q.trim().toLowerCase().split(/\s+/);
      var hay = [it.n, it.sn, it.ag, it.lv, it.r, it.q, it.cat, (it.tg || []).join(' '), (it.ind || []).join(' '), (it.pf || []).join(' '),
        (it.lt || []).join(' '), it.a, it.lim, it.w, it.d, it.law, it.ch, it.fu, it.chk,
        (it.src || []).map(function (x) { return x[0]; }).join(' ')].join(' ').toLowerCase();
      for (var i = 0; i < ws.length; i++) if (ws[i] && hay.indexOf(ws[i]) < 0) return false;
    }
    return true;
  };
  G.filter = function (F) { return G.items.filter(function (it) { return G.match(it, F); }); };

  /* URL 파라미터 ↔ 필터 (보기 → 인쇄 연동) */
  G.toQS = function (F) {
    var p = [];
    ['q', 'lv', 'tg', 'lt'].forEach(function (k) { if (F[k]) p.push(k + '=' + encodeURIComponent(F[k])); });
    ['lvs', 'tgs', 'lts', 'cats', 'pfs', 'rels'].forEach(function (k) { if (F[k].length) p.push(k + '=' + encodeURIComponent(F[k].join('~'))); });
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
      var b = e.target.closest('button.chip[data-g]'); if (!b) return;
      G.toggleSel(b.dataset.g, b.dataset.v); onChange();
    });
    function read() {
      F.q = $('fq').value; F.lv = $('flv').value; F.tg = $('ftg').value; F.lt = $('flt2').value;
      F.chk = $('fchk').checked; F.hideEnd = $('fend').checked;
    }
    G.syncUI = function () {
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
    '<div><label for="fq">통합 검색 (키워드 입력)</label><input type="search" id="fq" placeholder="예: 고용, 법인세, 새출발, 노란우산" autocomplete="off"></div>' +
    '<div class="cg"><label>지급 주체 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="clv"></div></div>' +
    '<div class="cg"><label>대상 기업 — 규모·업종 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="ctg"></div></div>' +
    '<div class="cg"><label>제한조건 유형 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="clt"></div></div>' +
    '<div class="cg"><label>분류 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="ccat"></div></div>' +
    '<div class="cg"><label>지원 형태 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="cpf"></div></div>' +
    '<div class="cg"><label>출처 등급 (중복 선택 · 다시 누르면 해제)</label><div class="chs" id="crel"></div></div>' +
    '<div><label for="flv">지급 주체 직접 입력</label><input type="text" id="flv" list="dlv" placeholder="중앙정부·지자체·기관명" autocomplete="off"><datalist id="dlv"></datalist></div>' +
    '<div><label for="ftg">대상 기업 직접 입력</label><input type="text" id="ftg" list="dtg" placeholder="소상공인·제조업 등" autocomplete="off"><datalist id="dtg"></datalist></div>' +
    '<div><label for="flt2">제한조건 직접 입력</label><input type="text" id="flt2" list="dlt" placeholder="매출·업력·지역 등" autocomplete="off"><datalist id="dlt"></datalist></div>' +
    '<div class="ck"><input type="checkbox" id="fchk"><label for="fchk" style="margin:0">확인필요 항목만</label></div>' +
    '<div class="ck"><input type="checkbox" id="fend"><label for="fend" style="margin:0">마감·종료 가능 제외</label></div>' +
    '<div><button type="button" class="btn sub" id="freset">필터 초기화</button></div>';

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
    ['cpy', 'cpyt'].forEach(function (i) { var e = document.getElementById(i); if (e) e.textContent = G.COPY; });
  };
})();
