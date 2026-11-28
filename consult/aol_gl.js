/* 정관컨설팅 : 용어 및 법조문 팝업 (공통). 설명은 일반 법리와 조문 요지이며, 정확한 문언은 법령 원문으로 확인합니다. */
(function(){
var GL={
'절대적 기재사항':'빠지면 정관 전체가 효력을 잃는 필수 기재사항입니다. 목적, 상호, 발행예정주식총수, 액면주식 1주의 금액, 설립 시 발행주식 총수, 본점 소재지, 공고방법, 발기인의 인적사항 8가지입니다.',
'상대적 기재사항':'정관에 적어야만 효력이 생기는 사항입니다. 주식양도 제한, 종류주식, 중간배당, 현물배당 등이 해당합니다. 적지 않아도 정관이 무효가 되지는 않지만 그 내용은 효력이 없습니다.',
'임의적 기재사항':'법령에 반하지 않는 범위에서 회사가 자유롭게 정하는 운영 규칙입니다. 사업연도, 주총 소집지, 이사 수 등이 해당하며 강행규정에 반하면 효력이 없습니다.',
'발행예정주식총수':'회사가 발행할 수 있는 주식 수의 한도입니다. 정관의 절대적 기재사항이자 등기사항이어서, 한도를 넘는 신주 발행은 정관 변경이 먼저 필요합니다.',
'액면주식':'1주의 금액(액면가)이 정해진 주식입니다. 1주의 금액은 100원 이상이어야 하고 균일해야 합니다.',
'특별결의':'출석한 주주 의결권의 3분의 2 이상이면서 발행주식총수의 3분의 1 이상이 찬성하는 결의입니다. 정관 변경이 대표적입니다.',
'보통결의':'출석한 주주 의결권의 과반수이면서 발행주식총수의 4분의 1 이상이 찬성하는 결의입니다. 법령이나 정관에 다른 정함이 없는 사항에 적용됩니다.',
'의안의 요령':'정관 변경 안건을 주주총회 소집통지에 적을 때 변경 취지와 핵심 내용을 요약한 문구입니다. 빠지면 소집절차 하자로 결의취소 사유가 될 수 있습니다.',
'의안 요령':'정관 변경 안건을 주주총회 소집통지에 적을 때 변경 취지와 핵심 내용을 요약한 문구입니다. 빠지면 소집절차 하자로 결의취소 사유가 될 수 있습니다.',
'소규모회사':'자본금 총액이 10억 원 미만인 주식회사입니다. 소집통지 10일 전, 서면 결의, 이사 1~2인, 감사 생략, 발기설립 시 정관 공증 생략 등의 특례가 있습니다.',
'변경등기':'등기사항이 바뀐 때 본점 소재지에서 2주 안에 하는 등기입니다. 늦으면 과태료 대상이 될 수 있습니다.',
'특별이해관계인':'결의 사항에 주주 지위를 넘는 개인적 이해관계가 있는 주주입니다. 그 결의에서 의결권을 행사할 수 없고, 그 주식은 출석 의결권 수에도 산입되지 않습니다.',
'강행규정':'당사자가 합의나 정관으로 배제하거나 바꿀 수 없는 규정입니다. 이사 보수에 관한 상법 제388조는 강행규정으로 보는 것이 판례입니다.',
'손금불산입':'회사가 지출했지만 세법상 비용(손금)으로 인정되지 않아 과세소득 계산에서 빼 주지 않는 금액입니다. 그만큼 법인세가 늘어납니다.',
'결의취소의 소':'소집절차나 결의방법이 법령 또는 정관을 위반했거나 현저하게 불공정한 주주총회 결의를 결의일로부터 2개월 안에 취소해 달라고 청구하는 소송입니다.',
'신주발행무효의 소':'신주 발행에 중대한 하자가 있을 때 발행일로부터 6개월 안에 그 발행을 무효로 해 달라고 청구하는 소송입니다.',
'충실의무':'이사가 법령과 정관에 따라 회사를 위하여 직무를 충실하게 수행해야 하는 의무입니다. 2025년 7월 22일 개정 상법은 주주의 이익도 보호하도록 확대했습니다.',
'자기거래':'이사 등이 자기 또는 제3자의 계산으로 회사와 하는 거래입니다. 이사회의 사전 승인이 필요하고, 승인 절차를 어기면 회사에 대한 손해배상 책임으로 이어질 수 있습니다.',
'경업금지':'이사가 이사회 승인 없이 회사와 같은 종류의 영업을 하거나, 같은 영업을 하는 다른 회사의 무한책임사원이나 이사가 되는 것을 금지하는 규정입니다.',
'중간배당':'영업연도 중 한 번 이사회 결의로 하는 배당입니다. 정관에 근거 규정이 있어야 합니다.',
'현물배당':'금전이 아닌 다른 재산으로 하는 배당입니다. 정관에 근거 규정이 있어야 합니다.',
'종류주식':'이익배당, 잔여재산 분배, 의결권 등의 내용이 다른 주식입니다. 발행하려면 그 내용과 수를 정관에 정해야 합니다.',
'중간정산':'퇴직금을 퇴직 전에 미리 정산해 받는 것입니다. 임원의 경우 퇴직금도 상법 제388조의 보수여서 정관 또는 주주총회 결의 근거가 필요하다는 것이 판례입니다.',
'퇴직소득':'퇴직으로 받는 소득입니다. 임원 퇴직금은 소득세법상 한도를 넘는 금액이 근로소득으로 과세됩니다.',
'근로소득':'근로를 제공하고 받는 급여, 상여 등의 소득으로 종합소득에 합산해 과세합니다.',
'서면결의':'소규모회사에서 주주 전원이 서면으로 동의하면 총회를 열지 않고도 결의한 것으로 보는 방식입니다. 정관에 반대 규정이 있는지 함께 확인합니다.',
'정관 공증':'설립 시 원시정관에 공증인의 인증을 받는 절차입니다. 자본금 10억 원 미만 회사를 발기설립하는 경우에는 생략할 수 있습니다.',
'발기인':'회사 설립을 기획하고 정관에 기명날인 또는 서명한 사람입니다.',
'소집통지':'주주총회를 열기 전에 주주에게 일시, 장소, 목적사항을 알리는 통지입니다. 원칙은 2주 전이며 소규모회사는 10일 전까지 가능합니다.',
'특례':'소규모회사에 대하여 상법이 절차를 줄여 주는 예외 규정입니다.',
'자기주식':'회사가 자기가 발행한 주식을 보유하는 것입니다. 2026년 3월 6일 시행 개정 사항은 소각과 관련해 항목별 확인이 필요합니다.'
};
var LS={
'상법 제289조':'주식회사 정관의 작성과 절대적 기재사항 8가지(목적, 상호, 발행예정주식총수, 액면주식 1주의 금액, 설립 시 발행주식 총수, 본점 소재지, 공고방법, 발기인의 인적사항)를 정합니다.',
'상법 제292조':'원시정관은 공증인의 인증을 받아야 효력이 생깁니다. 자본금 10억 원 미만 회사를 발기설립하는 경우는 단서에 따라 인증이 필요 없습니다.',
'상법 제317조':'주식회사 설립등기 사항을 정하고, 등기사항이 변경되면 제183조를 준용해 변경등기를 하도록 합니다(제4항).',
'상법 제183조':'등기사항에 변경이 생기면 본점 소재지에서 2주 안에 변경등기를 하도록 정합니다.',
'상법 제335조':'주식의 양도성을 정합니다. 정관이 정하는 바에 따라 이사회의 승인을 받도록 양도를 제한할 수 있습니다(제1항 단서).',
'상법 제344조':'종류주식(이익배당, 잔여재산 분배, 의결권 등이 다른 주식)에 관한 규정입니다. 내용과 수는 정관으로 정합니다.',
'상법 제363조':'주주총회 소집통지를 정합니다. 원칙은 2주 전이며, 자본금 10억 원 미만 회사는 10일 전 통지가 가능하고(제4항) 주주 전원의 동의가 있으면 서면 결의도 가능합니다(제5항).',
'상법 제368조':'총회의 결의 방법입니다. 출석 의결권의 과반수와 발행주식총수의 4분의 1 이상(제1항)이 원칙이며, 특별이해관계가 있는 주주는 의결권을 행사하지 못합니다(제3항).',
'상법 제371조':'의결권의 수 계산입니다. 의결권을 행사할 수 없는 주식의 수는 출석한 주주의 의결권 수에 산입하지 않습니다(제2항).',
'상법 제376조':'결의취소의 소입니다. 결의일로부터 2개월 안에 제기해야 합니다.',
'상법 제382조의3':'이사의 충실의무를 정합니다. 2025년 7월 22일 개정으로 주주의 이익 보호에 관한 내용이 포함되었습니다.',
'상법 제383조':'이사의 수와 임기입니다. 이사는 3명 이상이 원칙이나 자본금 10억 원 미만 회사는 1명 또는 2명으로 할 수 있고(제1항 단서), 임기는 3년을 넘지 못합니다(제2항).',
'상법 제388조':'이사의 보수는 정관에 정하지 않은 경우 주주총회 결의로 정한다고 규정합니다. 강행규정으로 보며 퇴직금도 포함됩니다.',
'상법 제397조':'이사의 경업금지와 겸직금지를 정합니다. 이사회 승인이 필요합니다.',
'상법 제398조':'이사 등과 회사 간의 거래(자기거래)에는 이사회의 승인이 필요하다고 정합니다.',
'상법 제399조':'이사가 법령, 정관을 위반하거나 임무를 게을리해 회사에 손해를 끼친 때의 손해배상 책임을 정합니다.',
'상법 제400조':'이사의 회사에 대한 책임 면제와 감경입니다. 총주주의 동의로 면제할 수 있고, 정관으로 책임 한도를 정할 수 있습니다.',
'상법 제409조':'감사의 선임입니다. 자본금 10억 원 미만 회사는 감사를 두지 않을 수 있습니다(제4항).',
'상법 제429조':'신주발행무효의 소입니다. 신주 발행일로부터 6개월 안에 제기해야 합니다.',
'상법 제433조':'정관 변경은 주주총회 결의로 하며, 변경 안건은 소집통지에 의안의 요령을 적어야 합니다.',
'상법 제434조':'정관 변경 등 특별결의의 정족수입니다. 출석 의결권의 3분의 2 이상과 발행주식총수의 3분의 1 이상이 필요합니다.',
'상법 제462조의3':'중간배당입니다. 연 1회 영업연도 중에 이사회 결의로 할 수 있고 정관에 그 근거가 있어야 합니다.',
'상법 제462조의4':'현물배당입니다. 정관에 근거를 두면 금전 외의 재산으로 배당할 수 있습니다.',
'상법 제635조':'법령에 정한 의무 위반에 대한 과태료 규정입니다. 등기를 게을리한 경우 등에 500만 원 이하 과태료가 부과될 수 있습니다.',
'법인세법 시행령 제43조':'임원 상여금 중 정관, 주주총회, 이사회 결의로 정한 지급기준을 초과하는 금액은 손금에 산입하지 않는다고 정합니다.',
'법인세법 시행령 제44조':'퇴직급여 한도입니다. 정관에 퇴직급여 규정이 없으면 퇴직 전 1년간 총급여액의 10% 곱하기 근속연수까지만 손금으로 인정합니다(제4항).',
'소득세법 제22조':'퇴직소득의 범위와 계산을 정합니다. 임원 퇴직소득은 한도를 초과하는 금액을 근로소득으로 봅니다(제3항).',
'소득세법 시행령 제42조의2':'임원 퇴직소득금액의 한도 계산입니다. 퇴직 전 3년 평균 총급여의 10분의 1에 근속연수와 근무기간별 배수를 곱합니다.'
};
var LNAME={'상법':'상법','법인세법시행령':'법인세법 시행령','소득세법시행령':'소득세법 시행령','소득세법':'소득세법','법인세법':'법인세법'};
var skip=/^(SCRIPT|STYLE|A|TH|H1|H2|H3|H4|H5|INPUT|TEXTAREA|BUTTON|SUP|SELECT)$/;
var TR=Object.keys(GL).sort(function(a,b){return b.length-a.length});
var RE=new RegExp('('+TR.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')','g');
function scan(root){
 if(window.self!==window.top||/_admin/.test(location.pathname))return;
 var seen=new WeakMap();
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);var nodes=[],n;
 while(n=w.nextNode()){
  var p=n.parentNode;if(!p||skip.test(p.nodeName)||p.closest('a,.gl,th,.ttl,.mini,script,style,.bar,.pf,.ft .law,[data-nogl]'))continue;
  if(!RE.test(n.nodeValue)){RE.lastIndex=0;continue}RE.lastIndex=0;nodes.push(n)}
 nodes.forEach(function(n){
  var box=n.parentNode.closest('section,.pg,#pbody')||document.body;var s=seen.get(box);if(!s){s={};seen.set(box,s)}
  var t=n.nodeValue,out=document.createDocumentFragment(),last=0,m,changed=false;RE.lastIndex=0;
  while((m=RE.exec(t))){
   if(s[m[1]]&&box.id!=='pbody')continue;s[m[1]]=1;changed=true;
   out.appendChild(document.createTextNode(t.slice(last,m.index)));
   var sp=document.createElement('span');sp.className='gl';sp.setAttribute('data-g',m[1]);sp.tabIndex=0;sp.textContent=m[1];out.appendChild(sp);last=m.index+m[1].length}
  if(!changed)return;out.appendChild(document.createTextNode(t.slice(last)));n.parentNode.replaceChild(out,n)});
}
var pop;
function mk(){if(pop)return pop;pop=document.createElement('div');pop.id='glp';pop.hidden=true;
 pop.innerHTML='<div class="gh"><b></b><button type="button" aria-label="닫기">×</button></div><div class="gb"></div>';document.body.appendChild(pop);
 pop.querySelector('button').onclick=function(){pop.hidden=true};return pop}
function show(title,body,link,x,y){mk();pop.querySelector('b').textContent=title;var gb=pop.querySelector('.gb');gb.textContent=body;
 if(link){var a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener';a.textContent='법령 원문 보기 (law.go.kr)';a.style.display='block';a.style.marginTop='6px';gb.appendChild(a)}
 pop.hidden=false;var w=pop.offsetWidth,h=pop.offsetHeight,W=innerWidth,H=innerHeight;
 pop.style.left=Math.max(6,Math.min(x,W-w-6))+'px';pop.style.top=Math.max(6,(y+h+20>H?y-h-10:y+14))+'px'}
function key(href){try{var d=decodeURIComponent(href).split('/법령/')[1];if(!d)return null;var p=d.split('/');var nm=LNAME[p[0].replace(/\s/g,'')]||p[0];return nm+' '+p[1]}catch(e){return null}}
document.addEventListener('click',function(e){
 var g=e.target.closest&&e.target.closest('.gl');
 if(g){e.preventDefault();e.stopImmediatePropagation();var t=g.getAttribute('data-g');show(t,GL[t],null,e.clientX,e.clientY);return}
 var a=e.target.closest&&e.target.closest('a[href*="law.go.kr"]');
 if(a&&window.self===window.top){var k=key(a.getAttribute('href'));if(k){e.preventDefault();e.stopImmediatePropagation();show(k,LS[k]||'조문의 요지를 준비하지 못했습니다. 원문 링크로 확인하십시오.',a.href,e.clientX,e.clientY);return}}
 if(pop&&!pop.hidden&&!e.target.closest('#glp'))pop.hidden=true;
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&pop)pop.hidden=true;if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('gl'))e.target.click()});
var st=document.createElement('style');
st.textContent='.gl{border-bottom:1px dotted #1763ad;color:inherit;cursor:help}.gl:hover,.gl:focus{background:#fff3cf;outline:0}#glp{position:fixed;z-index:99999;width:min(340px,92vw);background:#fff;border:1px solid #b08435;border-top:4px solid #b08435;border-radius:6px;box-shadow:0 6px 22px rgba(0,0,0,.28);font:13px/1.5 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#1d2433;word-break:keep-all}#glp .gh{display:flex;justify-content:space-between;align-items:center;padding:6px 10px 2px}#glp .gh b{color:#17294a;font-size:14px}#glp .gh button{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:#566074}#glp .gb{padding:2px 10px 10px}#glp a{color:#0b5cab}@media print{#glp{display:none!important}.gl{border:0}}';
document.head.appendChild(st);
window.glScan=scan;
function run(){scan(document.body);var pb=document.getElementById('pbody');if(pb)new MutationObserver(function(){scan(pb)}).observe(pb,{childList:true});}
if(document.readyState!=='loading')run();else document.addEventListener('DOMContentLoaded',run);
setTimeout(function(){scan(document.body)},1800);
})();
