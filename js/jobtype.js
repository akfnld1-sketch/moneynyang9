// ══════════════════════════════════════════
// 직업 유형 선택 & 모드 전환
// v12: 다중 직종 동시 등록 지원
// ══════════════════════════════════════════

// 직종 정보 정의
const JOB_TYPES = {
  employee:   { icon:'🏢', name:'직장인',    desc:'출퇴근·OT 기록<br>급여·연차 자동계산', calcType:'hourly',   color:'var(--accent)'  },
  convenience:{ icon:'💪', name:'알바',       desc:'편의점·쿠팡·물류 등<br>시급 × 근무시간 자동계산', calcType:'hourly',   color:'var(--orange)' },
  delivery:   { icon:'🛵', name:'배달/대리',  desc:'배달·대리기사 등<br>건당 수입 일별 합산',     calcType:'perCase',  color:'var(--yellow)'  },
  driver:     { icon:'🚗', name:'대리기사',   desc:'건당 수입 기록<br>야간 할증 지원',     calcType:'perCase',  color:'var(--accent2)' },
  freelancer: { icon:'💻', name:'프리랜서',   desc:'프로젝트 단가<br>3.3% 세금계산',       calcType:'project',  color:'var(--green)'   },
  shortAlba:  { icon:'📋', name:'단기알바',   desc:'날짜별 시급 기록<br>다양한 단기 업무',  calcType:'hourly',   color:'var(--cyan)'    },
  etc:        { icon:'➕', name:'추가수입',   desc:'보험금·정부지원금 등<br>일시적 수입 직접 입력', calcType:'manual',   color:'var(--text2)'   },
};

// 선택된 직종들 (다중 선택)
// jobType: 'employee' | 'multi' (기존 호환성 유지)
// selectedJobs: ['convenience','delivery',...] (새 구조)

function loadSelectedJobs(){
  try{
    const raw = localStorage.getItem('atm2_selectedJobs');
    if(raw) return JSON.parse(raw);
  }catch(e){}
  // 기존 jobType 마이그레이션
  if(typeof jobType !== 'undefined' && jobType && jobType !== 'multi'){
    return jobType === 'employee' ? ['employee'] : [jobType];
  }
  return [];
}

function saveSelectedJobs(jobs){
  try{ localStorage.setItem('atm2_selectedJobs', JSON.stringify(jobs)); }catch(e){}
  // 기존 jobType 호환성
  if(jobs.includes('employee') && jobs.length === 1){
    jobType = 'employee';
  } else if(jobs.length > 0 && !jobs.includes('employee')){
    jobType = jobs[0]; // 첫번째 직종
  } else {
    jobType = 'multi';
  }
  localStorage.setItem('atm2_jobType', jobType);
}

function showJobTypeSelector(forceShow){
  let overlay = document.getElementById('job-type-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'job-type-overlay';
    overlay.onclick = e => {
      if(e.target === overlay && loadSelectedJobs().length > 0) overlay.style.display = 'none';
    };
    document.body.appendChild(overlay);
  }

  const currentJobs = loadSelectedJobs();
  const isChanging = currentJobs.length > 0;
  // 더 이상 카드에 없는 구 직종(단기알바/대리기사 등)은 알바/배달로 마이그레이션
  const LEGACY_MAP = { shortAlba:'convenience', driver:'delivery' };
  let tempSelected = [...new Set(currentJobs.map(j => LEGACY_MAP[j] || j))]
    .filter(j => j==='employee' || JOB_TYPES[j]);

  function renderModal(){
    const isEmployee = tempSelected.includes('employee');

    const employeeCard = `
      <div id="jt-employee" class="job-type-card${tempSelected.includes('employee')?' selected':''}"
           onclick="jtToggle('employee')"
           style="${tempSelected.includes('employee')?'border-color:var(--accent);background:rgba(79,124,255,.12);':''}">
        <span class="jt-icon">🏢</span>
        <div class="jt-name">직장인</div>
        <div class="jt-desc">출퇴근·OT 기록<br>급여·연차 자동계산</div>
        ${tempSelected.includes('employee')?'<div style="margin-top:6px;font-size:10px;font-weight:700;color:var(--accent);background:rgba(79,124,255,.15);padding:2px 8px;border-radius:10px;">✓ 선택됨</div>':''}
      </div>`;

    const multiCards = ['convenience','delivery','freelancer','etc'].map(type => {
      const info = JOB_TYPES[type];
      const sel = tempSelected.includes(type);
      const disabled = isEmployee && type !== 'employee';
      return `
        <div class="job-type-card${sel?' selected':''}${disabled?' disabled':''}"
             onclick="${disabled?'jtShowEmployeeOnly()':'jtToggle(\''+type+'\')'}"
             style="${sel?'border-color:'+info.color+';background:rgba(0,0,0,.08);':''}
                    ${disabled?'opacity:.4;cursor:not-allowed;':''}">
          <span class="jt-icon">${info.icon}</span>
          <div class="jt-name">${info.name}</div>
          <div class="jt-desc">${info.desc}</div>
          ${sel?`<div style="margin-top:6px;font-size:10px;font-weight:700;color:${info.color};padding:2px 8px;border-radius:10px;background:rgba(0,0,0,.06);">✓ 선택됨</div>`:''}
        </div>`;
    }).join('');

    overlay.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:20px;
                  padding:28px 24px;max-width:520px;width:96%;max-height:92vh;overflow-y:auto;
                  box-shadow:0 24px 64px rgba(0,0,0,.45);position:relative;">

        ${isChanging ? `<button onclick="document.getElementById('job-type-overlay').style.display='none'"
          style="position:absolute;top:14px;right:16px;background:none;border:none;
                 color:var(--text3);font-size:20px;cursor:pointer;">✕</button>` : ''}

        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:36px;margin-bottom:8px;">${isChanging?'🔄':'👋'}</div>
          <h2 style="font-size:20px;font-weight:700;margin-bottom:6px;">
            ${isChanging?'직종 변경':'나의 수익원 선택'}
          </h2>
          <div style="font-size:13px;color:var(--text3);line-height:1.6;">
            해당하는 직종을 <b>모두 선택</b>하세요<br>
            <span style="color:var(--accent);font-weight:600;">여러 직종 동시 선택 가능</span> (직장인은 단독 선택)
          </div>
        </div>

        <!-- 직장인 (단독) -->
        <div style="margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">
            📌 직장 근무
          </div>
          <div style="display:grid;grid-template-columns:1fr;">
            ${employeeCard}
          </div>
        </div>

        <!-- N잡/알바/프리랜서 -->
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">
            💼 N잡 · 알바 · 프리랜서 (복수 선택 가능)
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">
            ${multiCards}
          </div>
        </div>

        <!-- 선택된 직종 요약 -->
        <div id="jt-summary" style="margin-bottom:16px;min-height:36px;"></div>

        <button onclick="jtConfirm()"
          id="jt-confirm-btn"
          style="width:100%;padding:14px;border-radius:10px;border:none;
                 background:${tempSelected.length>0?'var(--accent)':'var(--border)'};
                 color:${tempSelected.length>0?'#fff':'var(--text3)'};
                 font-size:15px;font-weight:700;cursor:${tempSelected.length>0?'pointer':'not-allowed'};
                 font-family:'Noto Sans KR';transition:all .2s;">
          ${tempSelected.length>0?'✅ 선택 완료 ('+tempSelected.length+'개 직종)':'직종을 선택해주세요'}
        </button>

        <div style="font-size:11px;color:var(--text3);text-align:center;margin-top:10px;line-height:1.7;">
          💡 상단 뱃지를 탭하면 언제든 변경 가능
        </div>
      </div>`;

    // 요약 업데이트
    updateJtSummary(tempSelected);
  }

  // 전역 함수로 노출 (onclick에서 사용)
  window.jtToggle = function(type){
    if(type === 'employee'){
      // 직장인 선택 시 다른 직종 모두 해제
      if(tempSelected.includes('employee')){
        tempSelected = tempSelected.filter(t => t !== 'employee');
      } else {
        tempSelected = ['employee'];
      }
    } else {
      // 직장인 선택 상태면 다른 직종 선택 불가
      if(tempSelected.includes('employee')) return;
      if(tempSelected.includes(type)){
        tempSelected = tempSelected.filter(t => t !== type);
      } else {
        tempSelected.push(type);
      }
    }
    renderModal();
  };

  window.jtShowEmployeeOnly = function(){
    showToast('💡 직장인 모드와 다른 직종은 함께 선택할 수 없어요');
  };

  window.jtConfirm = function(){
    if(tempSelected.length === 0){ showToast('⚠️ 직종을 하나 이상 선택해주세요'); return; }
    saveSelectedJobs(tempSelected);
    overlay.style.display = 'none';
    applyJobTypeUI();
    if(tempSelected.length === 1 && tempSelected[0] === 'freelancer'){
      showPage('sal');
    } else {
      renderCalendar();
    }
    const names = tempSelected.map(t => JOB_TYPES[t]?.icon + ' ' + JOB_TYPES[t]?.name).join(', ');
    showToast('✅ ' + names);
  };

  renderModal();
  overlay.style.display = 'flex';
}

function updateJtSummary(selected){
  const el = document.getElementById('jt-summary');
  if(!el) return;
  if(selected.length === 0){
    el.innerHTML = '';
    return;
  }
  const tags = selected.map(t => {
    const info = JOB_TYPES[t];
    return `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;
                         border-radius:20px;font-size:12px;font-weight:600;
                         background:rgba(79,124,255,.1);color:var(--accent);border:1px solid rgba(79,124,255,.2);">
              ${info.icon} ${info.name}
            </span>`;
  }).join('');
  el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">
    <span style="font-size:11px;color:var(--text3);">선택됨:</span>${tags}
  </div>`;
}

function selectJobType(type){
  // 기존 단일 선택 호환용
  saveSelectedJobs([type]);
  const overlay = document.getElementById('job-type-overlay');
  if(overlay) overlay.style.display = 'none';
  applyJobTypeUI();
  if(type === 'freelancer'){
    showPage('sal');
  } else {
    renderCalendar();
  }
  const info = JOB_TYPES[type] || {};
  showToast((info.icon||'') + ' ' + (info.name||type) + ' 모드');
}

function applyJobTypeUI(){
  const selectedJobs = loadSelectedJobs();
  const isEmployee = selectedJobs.includes('employee') || jobType === 'employee';
  const isMulti = !isEmployee && selectedJobs.length > 0;

  const salBtn  = document.getElementById('btn-sal');
  const dashBtn = document.getElementById('btn-dash');
  const mobSal  = document.getElementById('mob-btn-sal');
  const mobDash = document.getElementById('mob-btn-dash');
  const attBtn  = document.getElementById('btn-att');
  const mobAtt  = document.getElementById('mob-btn-att');
  const sidebar    = document.getElementById('sidebar');
  const weekToggle = document.querySelector('.week-toggle-wrap');

  // ── 직업별 근태/근무 탭 이름 결정 ──
  function getAttLabel(){
    // 복수 선택 시 대표 직종 우선
    if(selectedJobs.includes('employee'))        return { icon:'📅', text:'근태관리' };
    if(selectedJobs.some(j=>['delivery','driver'].includes(j)) &&
       !selectedJobs.some(j=>['convenience','shortAlba'].includes(j)))
                                                 return { icon:'🛵', text:'운행관리' };
    if(selectedJobs.includes('freelancer') &&
       selectedJobs.length === 1)               return { icon:'💻', text:'스케줄관리' };
    if(selectedJobs.some(j=>['convenience','shortAlba'].includes(j)))
                                                 return { icon:'📋', text:'근무관리' };
    // 복수 혼합 or etc 단독
    return { icon:'📅', text:'근무기록' };
  }
  const attLabel = getAttLabel();

  // att 버튼 텍스트+아이콘 적용
  // PC: <span class="tab-icon">📋</span> 근태관리
  if(attBtn){
    const tabIcon = attBtn.querySelector('.tab-icon');
    if(tabIcon) tabIcon.textContent = attLabel.icon;
    // 텍스트 노드 교체
    const nodes = attBtn.childNodes;
    for(let i = nodes.length-1; i >= 0; i--){
      if(nodes[i].nodeType === 3){
        nodes[i].textContent = ' ' + attLabel.text;
        break;
      }
    }
  }
  // 모바일: <span class="icon">📋</span><span>근태관리</span>
  if(mobAtt){
    const spans = mobAtt.querySelectorAll('span');
    if(spans.length >= 2){
      spans[0].textContent = attLabel.icon;
      spans[spans.length-1].textContent = attLabel.text;
    } else if(spans.length === 1){
      spans[0].textContent = attLabel.text;
    }
  }

  if(isEmployee){
    if(salBtn)  { salBtn.style.display='';  salBtn.textContent='💰 급여관리'; }
    if(dashBtn) { dashBtn.style.display=''; dashBtn.textContent='📊 대시보드'; }
    if(mobSal)  { mobSal.style.display='';  mobSal.querySelector('span:last-child').textContent='급여관리'; }
    if(mobDash) { mobDash.style.display=''; mobDash.querySelector('span:last-child').textContent='대시보드'; }
    if(sidebar)    sidebar.style.display='';
    if(weekToggle) weekToggle.style.display='';
  } else {
    if(salBtn)  { salBtn.style.display='';  salBtn.textContent='🧮 수입관리'; }
    // N잡(알바/배달·대리/프리랜서)도 연간요약(월합계+연누적)을 볼 수 있도록 대시보드 버튼 유지
    if(dashBtn) { dashBtn.style.display=''; dashBtn.textContent='📊 연간요약'; }
    if(mobSal)  { mobSal.style.display='';  mobSal.querySelector('span:last-child').textContent='수입관리'; }
    if(mobDash) { mobDash.style.display=''; mobDash.querySelector('span:last-child').textContent='연간요약'; }
    if(weekToggle) weekToggle.style.display='none';
    if(sidebar) sidebar.style.display='none';
  }

  const budgetBtn = document.getElementById('btn-budget');
  const mobBudget = document.getElementById('mob-btn-budget');
  if(budgetBtn) budgetBtn.style.display='';
  if(mobBudget) mobBudget.style.display='';

  updateJobBadge();
}

function updateJobBadge(){
  // 상단 N잡 뱃지 비활성화 — 달력 팝업에서 직종 선택하는 방식으로 변경
  const badge = document.getElementById('job-type-badge');
  if(badge) badge.remove();
}
// ══════════════════════════════════════════
