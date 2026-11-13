// 시중은행 적금금리 자동 갱신: 금융감독원 '금융상품한눈에' 오픈API -> rates.json
// 사용: FINLIFE_KEY=인증키 node scripts/update_rates.mjs   (시험용: FINLIFE_MOCK=파일.json)
import fs from 'node:fs';

const KEY = process.env.FINLIFE_KEY;
const MOCK = process.env.FINLIFE_MOCK;
const FILE = new URL('../rates.json', import.meta.url);
const TERM = 12; // 비교 기준: 12개월 상품

// 표시 은행명 -> 공시 API의 금융회사명 후보
const BANKS = [
  ['KB국민은행', ['국민은행', 'KB국민은행']],
  ['신한은행', ['신한은행']],
  ['우리은행', ['우리은행']],
  ['하나은행', ['하나은행']],
  ['NH농협은행', ['농협은행주식회사', 'NH농협은행']],
  ['IBK기업은행', ['중소기업은행', 'IBK기업은행']],
  ['카카오뱅크', ['카카오뱅크', '주식회사 카카오뱅크']],
  ['케이뱅크', ['케이뱅크', '주식회사 케이뱅크']],
  ['토스뱅크', ['토스뱅크', '토스뱅크 주식회사']],
  ['부산은행', ['부산은행']],
  ['경남은행', ['경남은행']],
  ['광주은행', ['광주은행']],
  ['제주은행', ['제주은행']],
];

async function getJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url.replace(KEY, '***'));
  return r.json();
}

async function loadAll() {
  if (MOCK) return JSON.parse(fs.readFileSync(MOCK, 'utf8'));
  if (!KEY) throw new Error('FINLIFE_KEY(인증키)가 없습니다.');
  const base = 'https://finlife.fss.or.kr/api/savingProductsSearch.json?auth=' + encodeURIComponent(KEY) + '&topFinGrpNo=020000&pageNo=';
  let baseList = [], optionList = [], max = 1;
  for (let p = 1; p <= max; p++) {
    const j = await getJson(base + p);
    const res = j.result;
    if (!res || res.err_cd !== '000') throw new Error('API 오류: ' + (res && (res.err_cd + ' ' + res.err_msg)));
    max = Number(res.max_page_no) || 1;
    baseList = baseList.concat(res.baseList || []);
    optionList = optionList.concat(res.optionList || []);
  }
  return { result: { baseList, optionList } };
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const open = (m) => /제한\s*없음|누구나|실명의\s*개인|개인\s*고객|제한없음/.test(m || '');

(async () => {
  const data = await loadAll();
  const { baseList, optionList } = data.result;
  const opts = new Map();
  for (const o of optionList) {
    if (Number(o.save_trm) !== TERM) continue;
    const k = o.fin_co_no + '|' + o.fin_prdt_cd;
    const cur = opts.get(k);
    const mx = num(o.intr_rate2);
    if (!cur || (mx ?? -1) > (cur.mx ?? -1)) opts.set(k, { base: num(o.intr_rate), mx, type: o.rsrv_type_nm || '' });
  }
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const items = [];
  const missing = [];
  for (const [label, names] of BANKS) {
    const cands = baseList
      .filter((b) => names.includes((b.kor_co_nm || '').trim()))
      .map((b) => ({ b, o: opts.get(b.fin_co_no + '|' + b.fin_prdt_cd) }))
      .filter((x) => x.o && x.o.mx !== null);
    if (!cands.length) { missing.push(label); continue; }
    const pick = (list) => list.sort((a, b) => b.o.mx - a.o.mx)[0];
    const free = cands.filter((x) => open(x.b.join_member));
    const best = free.length ? pick(free) : pick(cands);
    const notes = [];
    if (!free.length || !open(best.b.join_member)) notes.push('가입대상 제한 상품: ' + String(best.b.join_member || '').slice(0, 30));
    if (/월복리/.test(best.b.fin_prdt_nm + (best.b.intr_rate_type_nm || ''))) notes.push('월복리');
    items.push({ bank: label, product: best.b.fin_prdt_nm.trim(), base: best.o.base, max: best.o.mx, date: today, note: notes.join(' · ') });
  }
  if (items.length < 5) throw new Error('조회된 은행이 너무 적습니다(' + items.length + '개). 기존 rates.json을 유지합니다.');
  items.sort((a, b) => b.max - a.max);
  const out = {
    asOf: today,
    source: '금융감독원 금융상품한눈에 오픈API(적금, 12개월, 은행권) 자동 수집 · 은행별 최고금리 상품(가입대상 제한 없는 상품 우선)',
    items,
  };
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + '\n');
  console.log('rates.json 갱신: ' + items.length + '개 은행, 기준일 ' + today + (missing.length ? ' / 미조회: ' + missing.join(', ') : ''));
})().catch((e) => { console.error('갱신 실패: ' + e.message); process.exit(1); });
