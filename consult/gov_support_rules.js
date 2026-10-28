/* 내 회사에 적합한 지원제도 찾기 : 제도별 대상·제한조건 판정 규칙 및 지원금액 예시 산식
 * 각 제도(gov_support_data.js 의 id)의 '제한조건' 문구를 근거로 작성했습니다.
 * 금액 산식은 데이터 파일에 수록된 공식·보도 자료 기준의 '예시'이며, 실제 지원액은 공고·심사·신고 결과에 따라 달라집니다. */
(function () {
  'use strict';
  var W = 1e8, M = 1e4;
  var ORDER = ['micro', 'small', 'sme', 'mid', 'large'];
  var CAPITAL = ['seoul', 'hwaseong', 'gyeonggi', 'incheon'];
  function N(v) { return v !== null && v !== undefined && !isNaN(v); }
  function c(s, t) { return { s: s, t: t }; }

  /* ── 조건 생성 함수: P(회사 정보) → {s:'p'|'f'|'u', t:설명} ── */
  var R = {
    scale: function (max, label) { return function (P) {
      if (!P.scale) return c('u', label);
      return c(ORDER.indexOf(P.scale) <= ORDER.indexOf(max) ? 'p' : 'f', label);
    }; },
    ge: function (k, v, label) { return function (P) { return N(P[k]) ? c(P[k] >= v ? 'p' : 'f', label) : c('u', label); }; },
    gt: function (k, v, label) { return function (P) { return N(P[k]) ? c(P[k] > v ? 'p' : 'f', label) : c('u', label); }; },
    lt: function (k, v, label) { return function (P) { return N(P[k]) ? c(P[k] < v ? 'p' : 'f', label) : c('u', label); }; },
    le: function (k, v, label) { return function (P) { return N(P[k]) ? c(P[k] <= v ? 'p' : 'f', label) : c('u', label); }; },
    no: function (k, label) { return function (P) { return c(P.f[k] ? 'f' : 'p', label); }; },
    yes: function (k, label) { return function (P) { return c(P.f[k] ? 'p' : 'f', label); }; },
    form: function (v, label) { return function (P) { return P.form ? c(P.form === v ? 'p' : 'f', label) : c('u', label); }; },
    region: function (list, label) { return function (P) { return P.region ? c(list.indexOf(P.region) >= 0 ? 'p' : 'f', label) : c('u', label); }; },
    ind: function (list, label) { return function (P) { return P.ind ? c(list.indexOf(P.ind) >= 0 ? 'p' : 'f', label) : c('u', label); }; },
    indNot: function (list, label) { return function (P) { return P.ind ? c(list.indexOf(P.ind) < 0 ? 'p' : 'f', label) : c('u', label); }; },
    fn: function (f) { return f; }
  };
  var NOT_CONSUME = ['consume'];
  var NOT_CONS_RENT = ['consume', 'rental'];

  /* 증가 여부 */
  function incr(P, label) {
    if (!N(P.emp) || !N(P.prevemp)) return c('u', label);
    return c(P.emp > P.prevemp ? 'p' : 'f', label);
  }
  function nodec(P, label) {
    if (!N(P.emp) || !N(P.prevemp)) return c('u', label);
    return c(P.emp >= P.prevemp ? 'p' : 'f', label);
  }

  /* ── 법인세 계산(억원) ── */
  function ctax(b, isNew) {
    if (!N(b) || b <= 0) return 0;
    var r = isNew ? [0.10, 0.20, 0.22, 0.25] : [0.09, 0.19, 0.21, 0.24];
    var t = 0;
    t += Math.min(b, 2) * r[0];
    if (b > 2) t += (Math.min(b, 200) - 2) * r[1];
    if (b > 200) t += (Math.min(b, 3000) - 200) * r[2];
    if (b > 3000) t += (b - 3000) * r[3];
    return t;
  }
  /* 증여세(억원) : 일반세율 */
  function giftGeneral(v) {
    var tx = v - 0.5; // 직계비속 증여재산공제 5천만원 가정
    if (tx <= 0) return 0;
    if (tx <= 1) return tx * 0.10;
    if (tx <= 5) return tx * 0.20 - 0.1;
    if (tx <= 10) return tx * 0.30 - 0.6;
    if (tx <= 30) return tx * 0.40 - 1.6;
    return tx * 0.50 - 4.6;
  }
  function giftSpecial(v) {
    var tx = v - 10;
    if (tx <= 0) return 0;
    return Math.min(tx, 120) * 0.10 + Math.max(0, tx - 120) * 0.20;
  }
  function row(l, f, lo, hi, k) { return { l: l, f: f, lo: lo, hi: hi, k: k }; }
  function isCap(P) { return CAPITAL.indexOf(P.region) >= 0; }

  var RULES = {};

  RULES.g01 = {
    req: [R.scale('sme', '중소기업(소상공인·소기업 포함)'), R.no('tax_arrears', '국세·지방세 체납 없음'), R.no('loan_overdue', '금융 연체·융자제한 없음'), R.no('closed', '휴·폐업 사업장 아님')],
    info: ['자금별 업력·신용위험등급 요건은 공고문 확인'],
    ex: function (P) {
      var base = P.region === 'other' ? 70 : 60, r = [];
      r.push(row('융자 한도(기업당)', (P.region === 'other' ? '지방소재 70억원' : '기본 60억원') + ', 우대·정책기업 최대 100억원', base * W, 100 * W, 'loan'));
      if (N(P.loan) && P.loan > 0) r.push(row('우대금리 인하 효과', '대출 ' + P.loan + '억원 × 최대 0.4%p(성과창출·유망기업·포용금융 등 조건 충족 시)', 0, Math.min(P.loan, base) * 0.004 * W, 'cash'));
      return r;
    }
  };
  RULES.g02 = {
    req: [R.scale('micro', '소상공인(업종별 상시근로자·매출 기준)'), R.no('tax_arrears', '국세·지방세 체납 없음'), R.no('loan_overdue', '금융 연체·신용 제한 없음'), R.no('closed', '휴·폐업 사업장 아님')],
    info: ['자금별 한도·금리는 공고문(첨부) 기준']
  };
  RULES.g03 = {
    req: [R.scale('micro', '소상공인'), R.no('tax_arrears', '국세·지방세 체납 없음'), R.no('closed', '휴·폐업 사업장 아님')],
    info: ['보증비율·한도는 관할 지역신용보증재단 심사 기준']
  };
  RULES.g04 = {
    req: [R.scale('micro', '소상공인'), R.yes('faithful', '성실상환 이력')],
    ex: function (P) {
      if (!(N(P.loan) && P.loan > 0)) return [];
      return [
        row('우대금리 인하 효과', '대출 ' + P.loan + '억원 × 0.2~0.5%p', P.loan * 0.002 * W, P.loan * 0.005 * W, 'cash'),
        row('보증료 감면 효과', '대출 ' + P.loan + '억원 × 최대 0.3%p', 0, P.loan * 0.003 * W, 'cash')
      ];
    }
  };
  RULES.g05 = {
    req: [R.scale('micro', '소상공인·자영업자'), R.yes('distress', '부실(우려) 채무 보유(채무조정 필요)')],
    info: ['사업 영위기간 2020.4~2025.6 요건, 신청기한은 확인필요'],
    ex: function (P) {
      if (!(N(P.unsec) && P.unsec > 0)) return [];
      return [row('무담보 부실채무 원금감면(최대)', '무담보 채무 ' + P.unsec + '억원 × 최대 90%' + (P.unsec > 1 ? ' (총채무 1억원 초과는 감면율이 낮아질 수 있음)' : ' (총채무 1억원 이하·저소득 요건)'), 0, P.unsec * 0.9 * W, 'cash')];
    }
  };
  RULES.g06 = {
    req: [R.scale('micro', '소상공인'), R.yes('closing', '폐업했거나 폐업 예정')],
    ex: function () {
      return [row('점포철거비(최대)', '최대 400만원(2025.5 공고 기준)', 0, 400 * M, 'cash'),
        row('재기사업화(최대)', '일반 최대 2,000만원', 0, 2000 * M, 'cash')];
    }
  };
  RULES.g07 = {
    req: [R.lt('emp', 10, '근로자 10명 미만'), R.lt('pay', 270, '월평균보수 270만원 미만 근로자'), R.yes('ins_new', '신규 가입자(최근 1년 내 사회보험 가입이력 없음)')],
    info: ['지원기간·재산·소득 제외기준은 공고 확인'],
    ex: function (P) {
      if (!(N(P.pay) && N(P.emp) && P.emp > 0)) return [];
      var b = Math.min(P.pay * M, 2300000), mo = b * (0.0072 + 0.0092 + 0.036 * 2);
      return [row('사회보험료 지원(최대)', '월 약 ' + Math.round(mo).toLocaleString('ko-KR') + '원/인(보수 230만원 한도, 80% 지원) × 12개월 × ' + P.emp + '명(전원이 대상이라고 가정)', 0, mo * 12 * P.emp, 'cash')];
    }
  };
  RULES.g08 = {
    req: [R.scale('micro', '소상공인 대표'), R.yes('ebi', '대표 고용보험 가입')],
    info: ['보험료의 최대 80%를 5년간 지원(보도 기준, 소진공 공고 확인)']
  };
  RULES.g09 = {
    req: [R.ge('emp', 5, '상시근로자 5인 이상(5인 미만은 특례업종)'), R.scale('sme', '우선지원대상기업(중소기업)'), R.ge('newyouth', 1, '청년(만 15~34세) 정규직 신규 채용'),
      R.indNot(NOT_CONS_RENT, '소비·향락업 등 제외업종 아님'), R.no('wage_arrears', '임금체불 명단 공개 사업주 아님'), R.no('tax_arrears', '보험료 체납 없음'),
      function (P) {
        var l = '직전연도 매출 ≥ 피보험자수 × 1,900만원(업력 1년 미만은 면제)';
        if (N(P.age) && P.age < 1) return c('p', l);
        if (!N(P.sales) || !N(P.emp)) return c('u', l);
        return c(P.sales >= P.emp * 0.19 ? 'p' : 'f', l);
      }],
    info: ['2026.1.1 이후 채용, 주 28시간 이상·월 평균임금 450만원 이하, 채용 후 3개월 내 신청'],
    ex: function (P) {
      if (!(N(P.newyouth) && P.newyouth > 0)) return [];
      return [row('기업지원금(1년, 최대)', '청년 ' + P.newyouth + '명 × 720만원', 0, P.newyouth * 720 * M, 'cash'),
        row('청년 근속지원금(청년 본인 지급, 참고)', '청년 ' + P.newyouth + '명 × 최대 480만원(일반, 2년)', 0, P.newyouth * 480 * M, 'info')];
    }
  };
  RULES.g10 = {
    req: [R.scale('sme', '우선지원대상기업(중소기업)'), R.ge('emp', 1, '고용보험 가입 근로자 있음')],
    info: ['제도별(고용촉진·정규직 전환·워라밸·고용유지·출산육아기) 금액·요건은 고용부 안내 확인']
  };
  RULES.g11 = {
    req: [R.scale('mid', '우선지원대상기업·중견기업'), R.ge('senior', 1, '정년 도달(예정) 고령 근로자 있음')],
    info: ['정년을 1년 이상 운영, 계속고용제도를 취업규칙에 반영해 노동청에 신고'],
    ex: function (P) {
      if (!(N(P.senior) && P.senior > 0)) return [];
      return [row('계속고용장려금(연, 최대)', '고령 근로자 ' + P.senior + '명 × 월 30만원 × 12개월(정년 이후 최대 3년, 3년 합계 ' + Math.round(P.senior * 1080).toLocaleString('ko-KR') + '만원)', 0, P.senior * 360 * M, 'cash')];
    }
  };
  RULES.g12 = {
    req: [R.lt('age', 7, '창업 7년 미만(사업별 업력 요건 상이)')],
    info: ['사업별 연령·업종 요건은 통합공고문 확인']
  };
  RULES.g13 = {
    req: [R.scale('sme', '중소기업'), R.gt('export', 0, '수출 실적(또는 수출 추진 중)')],
    info: ['수출실적·업종별 한도는 통합공고 기준']
  };
  RULES.g14 = {
    req: [R.scale('sme', '중소기업'), R.ind(['mfg'], '제조업(제조 중소기업 중심)')],
    info: ['정부지원 비율·한도는 공고문 확인']
  };
  RULES.g15 = {
    req: [R.form('corp', '법인(법인세 납세의무)')],
    info: ['2026.1.1 이후 개시 사업연도부터 10·20·22·25%'],
    ex: function (P) {
      if (!(P.form === 'corp' && N(P.taxbase) && P.taxbase > 0)) return [row('법인세 산출세액', '법인 과세표준을 입력하면 계산합니다', null, null, 'info')];
      var nw = ctax(P.taxbase, true), od = ctax(P.taxbase, false);
      return [row('법인세 산출세액(2026 세율)', '과세표준 ' + P.taxbase + '억원 기준', nw * W, nw * W, 'info'),
        row('종전 세율 대비 부담 증가', '종전(9·19·21·24%) 산출세액 대비', (nw - od) * W, (nw - od) * W, 'cost')];
    }
  };
  RULES.g16 = {
    req: [R.scale('sme', '중소기업'), R.indNot(NOT_CONSUME, '소비성서비스업 아님'), function (P) { return incr(P, '전년 대비 상시근로자 증가'); }],
    info: ['금액은 KPMG 요약 기준(확인필요), 사후관리: 고용 감소분만 공제 배제'],
    ex: function (P) {
      var r = [];
      if (N(P.emp) && N(P.prevemp) && P.emp > P.prevemp) {
        var inc = P.emp - P.prevemp, yc = 0;
        if (N(P.newyouth)) yc = Math.min(P.newyouth, inc);
        if (N(P.youth)) yc = Math.min(yc, P.youth);
        var oc = inc - yc;
        r.push(row('통합고용세액공제 1년차', '증가 ' + inc + '명(청년 등 우대 ' + yc + '명 × 700만원 + 기본 ' + oc + '명 × 400만원)', (yc * 700 + oc * 400) * M, (yc * 700 + oc * 400) * M, 'tax'));
        r.push(row('통합고용세액공제 3년 합계(참고)', '우대 700+1,600+1,700만원 / 기본 400+900+1,000만원', (yc * 4000 + oc * 2300) * M, (yc * 4000 + oc * 2300) * M, 'info'));
      }
      if (N(P.retur) && P.retur > 0) r.push(row('육아휴직 복귀자 추가공제', '복귀자 ' + P.retur + '명 × 1,300만원(적용기한 2026.12.31)', P.retur * 1300 * M, P.retur * 1300 * M, 'tax'));
      return r;
    }
  };
  RULES.g17 = {
    req: [R.scale('sme', '중소기업'), R.indNot(NOT_CONS_RENT, '소비성서비스업·부동산임대업 등 제외업종 아님'), R.gt('invest', 0, '설비 등 투자 계획·실적')],
    info: ['투자완료일부터 5년 내 전용 시 추징, 2026년 투자분 공제율은 확인필요'],
    ex: function (P) {
      if (!(N(P.invest) && P.invest > 0)) return [];
      return [row('통합투자세액공제(기본공제)', '투자 ' + P.invest + '억원 × 10%(일반) ~ 12%(신성장·원천기술)', P.invest * 0.10 * W, P.invest * 0.12 * W, 'tax')];
    }
  };
  RULES.g18 = {
    req: [R.scale('sme', '소기업 또는 중기업'),
      function (P) {
        var l = '감면대상 업종(제조업·도소매업·의료업 등)';
        if (!P.ind) return c('u', l);
        if (['mfg', 'trade', 'med'].indexOf(P.ind) >= 0) return c('p', l);
        if (P.ind === 'consume' || P.ind === 'rental') return c('f', l);
        return c('u', l + ' : 서비스업 등은 세부 해당 여부 확인');
      },
      function (P) {
        var l = '중기업은 수도권 내 감면 제외';
        if (!P.scale || !P.region) return c('u', l);
        return c(P.scale === 'sme' && isCap(P) ? 'f' : 'p', l);
      }],
    info: ['감면한도 1억원 − 상시근로자 감소인원 × 500만원'],
    ex: function (P) {
      if (!(P.form === 'corp' && N(P.taxbase) && P.taxbase > 0 && P.ind && P.scale && P.region)) return [row('특별세액감면', '법인 과세표준·업종·규모·소재지를 입력하면 계산합니다(개인사업자는 소득세 산출세액 기준 별도 계산)', null, null, 'info')];
      var small = (P.scale === 'micro' || P.scale === 'small'), cap = isCap(P), rate = 0;
      if (P.ind === 'mfg') rate = small ? (cap ? 0.20 : 0.30) : (cap ? 0 : 0.15);
      else if (P.ind === 'trade' || P.ind === 'med') rate = small ? 0.10 : (cap ? 0 : 0.05);
      if (!rate) return [row('특별세액감면', '입력하신 업종·규모·소재지 기준 감면율이 없거나 서비스업 세부 요건 확인 필요', null, null, 'info')];
      var tax = ctax(P.taxbase, true) * W, lim = 1 * W;
      if (N(P.emp) && N(P.prevemp) && P.prevemp > P.emp) lim -= (P.prevemp - P.emp) * 500 * M;
      lim = Math.max(0, lim);
      var v = Math.min(tax * rate, lim);
      return [row('중소기업 특별세액감면(연)', '산출세액 ' + (tax / W).toFixed(2) + '억원 × ' + Math.round(rate * 100) + '% (한도 ' + (lim / W).toFixed(2) + '억원), 소득 전부가 감면대상이라고 가정', v, v, 'tax')];
    }
  };
  RULES.g19 = {
    req: [R.scale('sme', '중소기업'), R.le('age', 5, '창업 후 5년 이내(감면기간 5년)'), R.indNot(NOT_CONS_RENT, '감면 제외업종 아님'),
      function (P) {
        var l = '수도권 과밀억제권역 내 일반창업은 감면 제외(청년·소규모 창업은 50%)';
        return c(P.f.overcrowd && !P.f.young_founder ? 'f' : 'p', l);
      }],
    info: ['감면업종 해당 여부, 소득 발생 연도부터 5년간 적용'],
    ex: function (P) {
      if (!(P.form === 'corp' && N(P.taxbase) && P.taxbase > 0)) return [row('창업중소기업 세액감면', '법인 과세표준을 입력하면 계산합니다', null, null, 'info')];
      var rate = P.f.young_founder ? (P.f.overcrowd ? 0.5 : 1.0) : (P.f.overcrowd ? 0 : 0.5);
      var v = ctax(P.taxbase, true) * W * rate;
      return [row('창업중소기업 세액감면(연)', '산출세액 ' + ctax(P.taxbase, true).toFixed(2) + '억원 × ' + Math.round(rate * 100) + '% (' + (P.f.young_founder ? '청년창업' : '일반창업') + ')', v, v, 'tax')];
    }
  };
  RULES.g20 = {
    req: [R.scale('sme', '중소기업'), R.yes('rnd_lab', '기업부설(창작)연구소·연구개발 전담부서 인증'), R.gt('rnd', 0, '연구·인력개발비 지출')],
    info: ['연구소 인증이 취소되면 공제 배제'],
    ex: function (P) {
      if (!(N(P.rnd) && P.rnd > 0)) return [];
      var lo = P.rnd * 0.25 * W, hi = lo;
      if (N(P.rndprev)) hi = Math.max(lo, Math.max(0, P.rnd - P.rndprev) * 0.5 * W);
      return [row('연구·인력개발비 세액공제', '당기분 ' + P.rnd + '억원 × 25%' + (N(P.rndprev) ? ' / 증가분 ' + Math.max(0, P.rnd - P.rndprev).toFixed(2) + '억원 × 50% 중 유리한 방식(근사)' : ''), lo, hi, 'tax')];
    }
  };
  RULES.g21 = {
    req: [R.scale('sme', '중소기업'), R.yes('bonus_agree', '경영성과급 사전 서면 약정'), function (P) { return nodec(P, '상시근로자 수 전년 대비 미감소'); }, R.gt('bonus', 0, '경영성과급 지급')],
    info: ['총급여 7천만원 초과자·최대주주 등 특수관계자 제외'],
    ex: function (P) {
      if (!(N(P.bonus) && P.bonus > 0)) return [];
      return [row('경영성과급 세액공제', '지급액 ' + P.bonus.toLocaleString('ko-KR') + '만원 × 10%', P.bonus * M * 0.10, P.bonus * M * 0.10, 'tax')];
    }
  };
  RULES.g22 = {
    req: [R.scale('sme', '중소기업'), function (P) { return nodec(P, '상시근로자 수 전년 대비 미감소'); }],
    info: ['임금 감소 총액 × 10% + 임금 보전액 × 15%, 노사 합의 증빙 필요(적용기한 2026.12.31)']
  };
  RULES.g23 = {
    req: [R.scale('mid', '중소기업·중견기업'), R.gt('partner', 0, '상생결제 지급 실적')],
    info: ['어음 결제 비율이 전년 대비 증가하지 않을 것'],
    ex: function (P) {
      if (!(N(P.partner) && P.partner > 0)) return [];
      return [row('상생결제 세액공제', '지급액 ' + P.partner + '억원 × 0.15%(31~60일) ~ 0.5%(15일 이내)', P.partner * 0.0015 * W, P.partner * 0.005 * W, 'tax')];
    }
  };
  RULES.g24 = {
    req: [R.scale('mid', '중소기업·중견기업'), function (P) { return nodec(P, '상시근로자 수 전년 대비 미감소'); }],
    info: ['적용기한(2025.12.31) 이후 연장 여부 확인 필요']
  };
  RULES.g25 = {
    req: [function (P) {
      var l = '소상공인 또는 법인대표';
      if (P.scale === 'micro' || P.form === 'corp') return c('p', l);
      return (P.scale || P.form) ? c('f', l) : c('u', l);
    }, function (P) {
      var l = '법인대표는 총급여 8,000만원 이하';
      if (P.form !== 'corp') return c('p', l);
      return N(P.bizinc) ? c(P.bizinc <= 8000 ? 'p' : 'f', l) : c('u', l);
    }, R.indNot(['rental'], '부동산임대업 소득 아님')],
    info: ['납입한도 연 1,800만원(2026.7.1부터)'],
    ex: function (P) {
      if (!N(P.bizinc)) return [];
      var x = P.bizinc, d;
      if (x <= 4000) d = 600; else if (x <= 6000) d = 500; else if (x <= (P.form === 'corp' ? 8000 : 10000)) d = 400; else d = (P.form === 'corp' ? 0 : 200);
      var r = [row('노란우산 소득공제 한도', '소득 ' + x.toLocaleString('ko-KR') + '만원 구간', d * M, d * M, 'info')];
      if (N(P.mtr) && P.mtr > 0) r.push(row('소득세 절감 효과', '공제 ' + d + '만원 × 한계세율 ' + P.mtr + '% × 1.1(지방소득세 포함)', d * M * P.mtr / 100 * 1.1, d * M * P.mtr / 100 * 1.1, 'tax'));
      return r;
    }
  };
  RULES.g26 = {
    req: [R.form('indiv', '개인사업자'), function (P) {
      var th = P.ind === 'rental' ? 0.48 : 1.04, l = '직전연도 공급대가 ' + (P.ind === 'rental' ? '4,800만원' : '1억 400만원') + ' 미만';
      return N(P.sales) ? c(P.sales < th ? 'p' : 'f', l) : c('u', l);
    }],
    info: ['간이과세 배제 업종·지역 요건 별도, 일반과세 유지는 포기신고']
  };
  /* 가업상속·가업승계(증여) 판정 : 입력값 근거의 간이 판정
   * 법령: 상증세법 제18조의2·같은 법 시행령 제15조(가업상속공제), 조특법 제30조의6·같은 법 시행령 제27조의6(가업승계 증여세 과세특례) */
  function gen(k, v, label, unit) { return function (P) {
    if (!N(P[k])) return c('u', label + ' : 입력 필요');
    return P[k] >= v ? c('p', label) : c('f', label + ' : 입력 ' + P[k] + (unit || '') + ' (부족)');
  }; }
  function flagU(k, label) { return function (P) { return P.f[k] ? c('p', label) : c('u', label + ' : 해당되면 체크'); }; }
  function sizeAsset(P) {
    var l = P.scale === 'mid' ? '직전 3개 사업연도 평균 매출 5,000억원 미만(중견기업)' : '자산총액 5,000억원 미만(중소기업)';
    if (P.scale === 'mid') return N(P.sales) ? c(P.sales < 5000 ? 'p' : 'f', l) : c('u', l + ' : 매출 입력 필요');
    return N(P.assets) ? c(P.assets < 5000 ? 'p' : 'f', l) : c('u', l + ' : 자산총액 입력 필요');
  }
  var SC = R.scale('mid', '중소기업 또는 중견기업');
  var IND = R.indNot(['rental', 'consume'], '가업 업종(부동산임대업·유흥주점업 제외, 별표 업종 해당 여부는 세부업종 확인)');
  var COMMON = [gen('bizyears', 10, '가업 10년 이상 계속 경영', '년'),
    gen('stake', 40, '대표 및 특수관계인 합산 지분 40% 이상(상장 20%)', '%'),
    gen('stakeyrs', 10, '위 지분을 10년 이상 계속 보유', '년')];
  RULES.g27 = {
    req: [SC, sizeAsset, IND].concat(COMMON, [
      function (P) {
        var l = '피상속인 대표이사 재직(가업영위기간의 50% 이상, 또는 상속개시 전 10년 중 5년 이상 등)';
        if (!N(P.ceoyrs)) return c('u', l + ' : 대표이사 재직연수 입력 필요');
        if (N(P.bizyears) && P.ceoyrs >= P.bizyears * 0.5) return c('p', l);
        return P.ceoyrs >= 5 ? c('u', l + ' : 재직 ' + P.ceoyrs + '년: 50% 미만이나 소급 10년 중 5년 이상 충족 여부 확인') : c('f', l + ' : 재직 ' + P.ceoyrs + '년 (부족)');
      },
      gen('succage', 18, '승계자 상속개시일 현재 만 18세 이상', '세'),
      gen('succyrs', 2, '승계자 상속개시 전 2년 이상 가업 종사(피상속인 65세 이전 사망 등은 예외)', '년'),
      flagU('succ_exec', '승계자 상속세 신고기한까지 임원 취임(예정 포함)'),
      flagU('succ_ceo', '승계자 신고기한부터 2년 내 대표이사 취임(예정 포함)')]),
    info: ['현행법 기준 판정(2026 세제개편안은 국회 확정 전). 사후관리 5년: 업종·지분·고용(정규직·총급여 평균 90%)·자산(40% 미만 처분) 유지'],
    ex: function (P) {
      if (!N(P.bizyears)) return [];
      var y = P.bizyears, cur = y >= 30 ? 600 : (y >= 20 ? 400 : (y >= 10 ? 300 : 0)), nw = Math.min(y * 20, 1000);
      var r = [row('가업상속공제 한도(현행)', '경영 ' + y + '년 → ' + cur + '억원', cur * W, cur * W, 'info'),
        row('가업상속공제 한도(2026 정부안)', '경영연수 ' + y + '년 × 20억원(최대 1,000억원), 요건·시행일 확정 전', nw * W, nw * W, 'info')];
      if (N(P.bizval) && P.bizval > 0) r.push(row('공제 가능액(현행 기준)', '가업상속재산 ' + P.bizval + '억원과 한도 중 작은 금액', Math.min(P.bizval, cur) * W, Math.min(P.bizval, cur) * W, 'info'));
      return r;
    }
  };
  RULES.g28 = {
    req: [SC, R.form('corp', '법인 주식만 대상(개인사업자는 적용 불가)'), sizeAsset, IND].concat(COMMON, [
      gen('ceoage', 60, '증여자(부모) 만 60세 이상', '세'),
      gen('succage', 18, '수증자 증여일 현재 만 18세 이상', '세'),
      flagU('succ_resident', '수증자 국내 거주자'),
      function (P) { return N(P.succyrs) && P.succyrs > 0 ? c('p', '수증자 증여세 신고기한(증여월 말일부터 3개월)까지 가업 종사') : c('u', '수증자 증여세 신고기한까지 가업 종사 : 가업종사연수 입력 필요'); },
      flagU('succ_ceo', '수증자 증여일부터 3년 내 대표이사 취임(예정 포함)')]),
    info: ['수증자 요건·사후관리(5년) 위반 시 추징, 정부안 개편 예정'],
    ex: function (P) {
      if (!(N(P.giftval) && P.giftval > 0)) return [];
      var g = giftGeneral(P.giftval), s = giftSpecial(P.giftval);
      return [row('증여세(일반 세율, 자녀 5천만원 공제 가정)', '증여 ' + P.giftval + '억원 기준 누진세율', g * W, g * W, 'info'),
        row('증여세(가업승계 특례)', '10억원 공제 후 120억원 이하 10%, 초과 20%', s * W, s * W, 'info'),
        row('특례 적용 시 절감 효과', '일반 − 특례', Math.max(0, g - s) * W, Math.max(0, g - s) * W, 'once')];
    }
  };
  RULES.g29 = {
    req: [R.ge('ceoage', 60, '매도자 60세 이상'), R.ge('bizyears', 20, '20년 이상 경영')],
    info: ['정부안 단계(2028.1.1~2030.12.31 양도분 한시)'],
    ex: function (P) {
      if (!N(P.bizyears)) return [];
      return [row('양도소득세 감면 한도(정부안)', '경영 ' + P.bizyears + '년 × 5,000만원, 감면율 20%', P.bizyears * 0.5 * W, P.bizyears * 0.5 * W, 'info')];
    }
  };
  RULES.g30 = {
    req: [R.region(['seoul'], '서울 소재'), R.scale('sme', '소상공인·중소기업'), R.no('tax_arrears', '국세·지방세 체납 없음'), R.no('closed', '휴·폐업 사업장 아님')],
    info: ['자금별 요건 상이(고금리 대출 이용·취약사업자 지정·창업교육 이수 등)'],
    ex: function (P) {
      if (!(N(P.loan) && P.loan > 0)) return [];
      var b = Math.min(P.loan, 1);
      return [row('이자차액 보전(연)', '대출 ' + b + '억원(희망동행자금 한도 1억원) × 1.8~2.5%', b * 0.018 * W, b * 0.025 * W, 'cash')];
    }
  };
  RULES.g31 = {
    req: [R.region(['seoul'], '서울 소재'), R.scale('micro', '소상공인(상인회 단위 신청)')],
    info: ['상권 단위 지원, 올해 1차 모집 마감(추가 모집 확인)'],
    ex: function () { return [row('상권 공동마케팅 지원(상권 단위)', '상권 규모에 따라 2,000만~4,000만원(개별 점포 지원 아님)', 2000 * M, 4000 * M, 'info')]; }
  };
  RULES.g32 = {
    req: [R.region(['hwaseong', 'gyeonggi'], '경기도 소재'), R.scale('micro', '소상공인'), R.yes('edu_done', '창업경영교육 12시간 이상 이수'), R.no('tax_arrears', '국세·지방세 체납 없음'), R.no('loan_overdue', '금융 연체 없음'), R.no('closed', '휴·폐업 사업장 아님')],
    info: ['융자기간 5년(1년 거치), 업체당 최대 1.5억원'],
    ex: function (P) {
      if (!(N(P.loan) && P.loan > 0)) return [row('융자 한도(업체당)', '자금별 최대 1억~1.5억원', 1 * W, 1.5 * W, 'loan')];
      var b = Math.min(P.loan, 1);
      return [row('이차보전(연)', '대출 ' + b + '억원 × 2.0%p(창업·경영개선자금)', b * 0.02 * W, b * 0.02 * W, 'cash'),
        row('융자 한도(업체당)', '자금별 최대 1억~1.5억원', 1 * W, 1.5 * W, 'loan')];
    }
  };
  RULES.g33 = {
    req: [R.region(['hwaseong'], '화성시 소재'), R.form('indiv', '개인사업자'), R.gt('sales', 0, '연매출 0원 초과'), R.lt('sales', 1.04, '연매출 1억 400만원 미만'), R.ge('age', 1, '2025.12.31 이전 개업(영업 중)')],
    info: ['2026.2.9~12.18, 예산 소진 시 조기 종료'],
    ex: function () { return [row('경영안정 바우처', '사업자당 최대 25만원(카드 포인트)', 0, 25 * M, 'cash')]; }
  };
  RULES.g34 = {
    req: [R.region(['hwaseong'], '화성시 소재'), R.scale('sme', '중소기업'), R.ge('age', 1, '사업자등록 1년 이상 경과'), R.no('tax_arrears', '화성시 지방세 체납 없음'), R.no('closed', '휴·폐업 아님')],
    info: ['이차보전 여부·기준연도는 확인필요'],
    ex: function () { return [row('특례보증 한도', '기업당 최대 3억원(법인·개인별 보증한도 8억원 이내)', 3 * W, 3 * W, 'loan')]; }
  };

  /* ── 평가 ── */
  function evaluate(id, P) {
    var rule = RULES[id];
    if (!rule) return { st: 'maybe', c: [], info: [], rows: [] };
    var cs = (rule.req || []).map(function (f) { return f(P); });
    var st = 'ok';
    cs.forEach(function (x) { if (x.s === 'f') st = 'no'; else if (x.s === 'u' && st !== 'no') st = 'maybe'; });
    var rows = [];
    if (rule.ex && st !== 'no') { try { rows = rule.ex(P) || []; } catch (e) { rows = []; } }
    return { st: st, c: cs, info: rule.info || [], rows: rows, hasEx: !!rule.ex };
  }

  window.GOV_SUPPORT_RULES = { evaluate: evaluate, RULES: RULES, ctax: ctax, giftGeneral: giftGeneral, giftSpecial: giftSpecial };
})();
