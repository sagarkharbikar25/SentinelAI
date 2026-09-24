import { defaultThreatResult } from '../../data/threatsData.js';

export function createThreatAnalysisResult(threatData = defaultThreatResult, onBlock = () => {}, onInvestigate = () => {}, onReport = () => {}) {
  const container = document.createElement('div');
  container.className = 'flex flex-col rounded overflow-hidden tactical-card';
  container.style.border = '1px solid rgba(63, 72, 80, 0.45)';

  const data = threatData || defaultThreatResult;

  // Calculate gauge dash values
  const score = data.score || 87;
  const circumference = 100;
  const dashArray = `${score}, ${circumference}`;

  container.innerHTML = `
    <!-- Header Strip -->
    <div class="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-error text-[18px]" style="color: var(--color-error);">security_update_warning</span>
        <span class="font-headline-md text-on-surface uppercase tracking-wide font-bold" style="font-size: 14px;">THREAT ANALYSIS RESULT // ${data.id || 'INC-89312'}</span>
      </div>
      <span class="badge-critical font-code-sm" style="font-size: 10px;">
        <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-error);"></span>
        CLASSIFIED SOC ASSESSMENT // HEURISTIC ENGINE
      </span>
    </div>

    <div class="p-4 flex flex-col gap-4" style="background-color: var(--color-surface-lowest);">
      <!-- Top Metric Showcase: Radial Gauge & Classification Details -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 rounded border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
        
        <!-- Score Radial Ring / Number (5 Cols) -->
        <div class="md:col-span-5 flex items-center gap-3">
          <div class="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <!-- Background Path -->
              <path 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="var(--color-surface-container)" 
                stroke-width="3.5"
              />
              <!-- Value Arc -->
              <path 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="var(--color-error)" 
                stroke-dasharray="${dashArray}" 
                stroke-linecap="round" 
                stroke-width="3.5"
              />
            </svg>
            <div class="absolute flex flex-col items-center justify-center text-center">
              <span class="font-headline-lg font-bold text-error leading-none" style="font-size: 26px; color: var(--color-error); font-family: var(--font-headline);">${score}</span>
              <span class="font-code-sm text-outline uppercase" style="font-size: 9.5px;">/ 100</span>
            </div>
          </div>

          <div class="flex flex-col">
            <span class="font-label-caps text-outline uppercase" style="font-size: 9.5px;">RISK EVALUATION</span>
            <span class="font-headline-md font-bold text-error flex items-center gap-1" style="font-size: 16px; color: var(--color-error);">
              ${data.riskLevel || 'HIGH RISK'}
            </span>
            <span class="font-code-sm text-error flex items-center gap-1 mt-0.5 font-semibold" style="font-size: 10.5px; color: var(--color-error);">
              <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-error);"></span>
              THREAT DETECTED
            </span>
          </div>
        </div>

        <!-- Classification & Confidence (7 Cols) -->
        <div class="md:col-span-7 grid grid-cols-2 gap-2 pl-0 md:pl-3 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-2 md:pt-0" style="border-left: 1px solid rgba(63, 72, 80, 0.35);">
          <div class="p-2.5 rounded flex flex-col" style="background-color: var(--color-surface-container);">
            <span class="font-label-caps text-outline" style="font-size: 9.5px;">CLASSIFICATION</span>
            <span class="font-code-md text-error font-bold mt-0.5 flex items-center gap-1" style="font-size: 13px; color: var(--color-error);">
              <span class="material-symbols-outlined text-[15px]">phishing</span>
              ${data.classification || 'PHISHING'}
            </span>
            <span class="font-code-sm text-outline mt-0.5" style="font-size: 10px;">${data.subVector || 'Vector: Credential Trap'}</span>
          </div>

          <div class="p-2.5 rounded flex flex-col" style="background-color: var(--color-surface-container);">
            <span class="font-label-caps text-outline" style="font-size: 9.5px;">CONFIDENCE</span>
            <span class="font-code-md text-primary font-bold mt-0.5 flex items-center gap-1" style="font-size: 13px; color: var(--color-primary);">
              <span class="material-symbols-outlined text-[15px]">psychology</span>
              ${data.confidence || '94.8%'}
            </span>
            <span class="font-code-sm text-outline mt-0.5" style="font-size: 10px;">${data.consensus || 'Ensemble consensus'}</span>
          </div>
        </div>
      </div>

      <!-- Threat Indicators Grid (6 Pills) -->
      <div class="flex flex-col gap-1.5">
        <span class="font-label-caps text-outline tracking-wider uppercase" style="font-size: 10px;">DEEP TELEMETRY INDICATORS</span>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          ${(data.indicators || []).map(ind => {
            let colorVar = 'var(--color-primary)';
            let bgVar = 'rgba(147, 204, 255, 0.1)';
            if (ind.status === 'error') {
              colorVar = 'var(--color-error)';
              bgVar = 'rgba(164, 2, 23, 0.25)';
            } else if (ind.status === 'tertiary') {
              colorVar = 'var(--color-tertiary)';
              bgVar = 'rgba(202, 129, 0, 0.2)';
            }
            return `
              <div class="p-2 px-2.5 rounded flex items-center justify-between border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
                <span class="font-code-sm text-outline" style="font-size: 10.5px;">${ind.label}</span>
                <span class="font-code-sm font-bold px-1.5 py-0.5 rounded" style="color: ${colorVar}; background-color: ${bgVar}; font-size: 10.5px;">
                  ${ind.value}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- AI Security Explanation Box -->
      <div class="p-3.5 rounded-r border-l-2 border-error flex flex-col gap-1" style="background-color: var(--color-surface-low); border-left: 3px solid var(--color-error);">
        <div class="flex items-center gap-1.5 text-error" style="color: var(--color-error);">
          <span class="material-symbols-outlined text-[16px]">neurology</span>
          <span class="font-label-caps font-bold tracking-wider" style="font-size: 10px;">AI HEURISTIC VERDICT</span>
        </div>
        <p class="font-body-md text-on-surface italic" style="font-size: 12px; line-height: 17px; color: var(--color-on-surface);">
          ${data.verdict || defaultThreatResult.verdict}
        </p>
      </div>

      <!-- Tactical Response Action Controls -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
        <span class="font-label-caps text-outline uppercase" style="font-size: 10px;">TACTICAL RESPONSE:</span>
        <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button id="action-block-threat-btn" class="btn-danger flex-1 sm:flex-initial py-2 px-4" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[16px]">block</span>
            <span>BLOCK THREAT</span>
          </button>
          <button id="action-investigate-btn" class="btn-secondary flex-1 sm:flex-initial py-2 px-3.5" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[16px] text-primary">filter_center_focus</span>
            <span>INVESTIGATE HOST</span>
          </button>
          <button id="action-report-btn" class="btn-secondary flex-1 sm:flex-initial py-2 px-3.5" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[16px]">download</span>
            <span>GENERATE REPORT</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach button triggers
  const blockBtn = container.querySelector('#action-block-threat-btn');
  const invBtn = container.querySelector('#action-investigate-btn');
  const repBtn = container.querySelector('#action-report-btn');

  if (blockBtn) blockBtn.addEventListener('click', onBlock);
  if (invBtn) invBtn.addEventListener('click', onInvestigate);
  if (repBtn) repBtn.addEventListener('click', onReport);

  return container;
}
