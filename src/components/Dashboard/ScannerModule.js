import { sampleScanTargets } from '../../data/threatsData.js';

export function createScannerModule(onAnalyze = () => {}) {
  const container = document.createElement('div');
  container.className = 'flex flex-col rounded overflow-hidden tactical-card';
  container.style.border = '1px solid rgba(63, 72, 80, 0.45)';

  let currentMode = 'url';

  container.innerHTML = `
    <!-- Header Strip -->
    <div class="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[18px]" style="color: var(--color-primary);">biotech</span>
        <span class="font-headline-md text-on-surface uppercase tracking-wide font-bold" style="font-size: 14px;">THREAT DETECTION ENGINE</span>
      </div>
      <span class="font-code-sm text-primary px-2 py-0.5 rounded border border-primary/30" style="background: rgba(147, 204, 255, 0.1); font-size: 10.5px; color: var(--color-primary);">
        MOD: SCAN-AI-V4.8
      </span>
    </div>

    <div class="p-4 flex flex-col gap-4 justify-between flex-1" style="background-color: var(--color-surface-lowest);">
      <div class="flex flex-col gap-3">
        <p class="font-body-md text-on-surface-variant" style="font-size: 12.5px; color: var(--color-on-surface-variant);">
          Analyze suspicious digital content using AI-powered deep heuristic pattern extraction and sandboxed zero-day introspection.
        </p>

        <!-- 5 Mode Selector Tabs -->
        <div class="grid grid-cols-5 gap-1 p-1 rounded border border-outline-variant/30" style="background-color: var(--color-surface-container);">
          <button class="mode-tab active py-1.5 font-label-caps tracking-wider transition-all rounded flex items-center justify-center gap-1" data-mode="url" style="cursor: pointer;">
            <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-on-primary-container);"></span>
            <span>URL</span>
          </button>
          <button class="mode-tab py-1.5 font-label-caps tracking-wider transition-all rounded flex items-center justify-center gap-1" data-mode="email" style="cursor: pointer;">
            <span>EMAIL</span>
          </button>
          <button class="mode-tab py-1.5 font-label-caps tracking-wider transition-all rounded flex items-center justify-center gap-1" data-mode="file" style="cursor: pointer;">
            <span>FILE</span>
          </button>
          <button class="mode-tab py-1.5 font-label-caps tracking-wider transition-all rounded flex items-center justify-center gap-1" data-mode="ip" style="cursor: pointer;">
            <span>IP ADDR</span>
          </button>
          <button class="mode-tab py-1.5 font-label-caps tracking-wider transition-all rounded flex items-center justify-center gap-1" data-mode="text" style="cursor: pointer;">
            <span>TEXT</span>
          </button>
        </div>

        <!-- Target Input Area -->
        <div class="flex flex-col gap-1.5">
          <label class="font-label-caps text-outline flex items-center justify-between" style="font-size: 10px;">
            <span id="target-input-label">ENTER TARGET URL FOR DEEP HEURISTIC INSPECTION</span>
            <span class="font-code-sm text-primary" style="font-size: 10.5px; color: var(--color-primary);">PROTOCOL: HTTPS/DIRECT</span>
          </label>
          <div class="relative flex items-center">
            <span class="absolute left-3 text-primary text-[18px] material-symbols-outlined" style="color: var(--color-primary); pointer-events: none;">link</span>
            <input 
              id="scanner-target-input"
              class="w-full bg-surface-container border-0 pl-10 pr-20 py-2.5 text-on-surface font-code-md rounded focus:ring-1 focus:ring-primary outline-none transition-all"
              style="
                background-color: var(--color-surface-container);
                border: 1px solid rgba(63, 72, 80, 0.4);
                color: var(--color-on-surface);
                font-family: var(--font-mono);
                font-size: 12px;
                border-radius: var(--radius-default);
              "
              type="text" 
              value="${sampleScanTargets.url}"
            />
            <div class="absolute right-2 flex items-center gap-1">
              <button id="copy-payload-btn" class="p-1 text-outline hover:text-primary transition-colors" title="Copy Target" style="background: none; border: none; cursor: pointer;">
                <span class="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
              <button id="clear-payload-btn" class="p-1 text-outline hover:text-error transition-colors" title="Clear Target" style="background: none; border: none; cursor: pointer;">
                <span class="material-symbols-outlined text-[16px]">backspace</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Action Trigger Buttons -->
        <div class="mt-1 flex flex-col sm:flex-row gap-2">
          <button 
            id="run-analysis-btn"
            class="btn-primary flex-1 py-2.5"
            style="font-size: 11.5px; letter-spacing: 0.08em;"
          >
            <span class="material-symbols-outlined text-[18px] animate-spin" id="scan-spinner-icon" style="display: none;">progress_activity</span>
            <span class="material-symbols-outlined text-[18px]" id="scan-radar-icon">radar</span>
            <span id="scan-btn-label">ANALYZE THREAT</span>
          </button>
          <button 
            id="batch-load-btn"
            class="btn-secondary py-2.5"
            style="font-size: 11px;"
          >
            <span class="material-symbols-outlined text-[16px]">file_upload</span>
            <span>LOAD BATCH</span>
          </button>
        </div>
      </div>

      <!-- Real-Time Telemetry Monitor Log -->
      <div class="p-3 rounded border border-outline-variant/30 flex flex-col gap-1.5" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
        <div class="flex items-center justify-between border-b border-outline-variant/20 pb-1.5" style="border-bottom: 1px solid rgba(63, 72, 80, 0.25);">
          <div class="flex items-center gap-1.5 font-code-sm text-primary" style="font-size: 11px; color: var(--color-primary);">
            <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
            <span>TELEMETRY PARSER ACTIVE</span>
          </div>
          <span class="font-code-sm text-outline" style="font-size: 10.5px;">HASH: 7f83b165...</span>
        </div>
        <div class="font-code-sm text-on-surface-variant flex flex-col gap-1 select-none" style="font-size: 11px;">
          <div class="flex justify-between">
            <span class="text-outline">&gt; DNS RESOLUTION:</span>
            <span class="text-on-surface font-semibold">198.51.100.24 [AS40201]</span>
          </div>
          <div class="flex justify-between">
            <span class="text-outline">&gt; ENTROPY SCORE:</span>
            <span class="text-tertiary font-medium">7.84 bits/byte (High Obfuscation)</span>
          </div>
          <div class="flex justify-between">
            <span class="text-outline">&gt; HEURISTIC PIPELINE:</span>
            <span class="text-primary font-bold">[PARSING HEURISTICS - 100%]</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Update tab styles
  function renderTabs() {
    container.querySelectorAll('.mode-tab').forEach(tab => {
      const mode = tab.getAttribute('data-mode');
      if (mode === currentMode) {
        tab.style.backgroundColor = 'var(--color-primary-container)';
        tab.style.color = 'var(--color-on-primary-container)';
        tab.style.fontWeight = '700';
      } else {
        tab.style.backgroundColor = 'transparent';
        tab.style.color = 'var(--color-on-surface-variant)';
        tab.style.fontWeight = '500';
      }
    });
  }
  renderTabs();

  // Mode tab switching
  container.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.getAttribute('data-mode');
      renderTabs();
      const inputEl = container.querySelector('#scanner-target-input');
      const labelEl = container.querySelector('#target-input-label');
      if (inputEl && sampleScanTargets[currentMode]) {
        inputEl.value = sampleScanTargets[currentMode];
      }
      if (labelEl) {
        labelEl.textContent = `ENTER TARGET ${currentMode.toUpperCase()} FOR DEEP HEURISTIC INSPECTION`;
      }
    });
  });

  const inputEl = container.querySelector('#scanner-target-input');
  const copyBtn = container.querySelector('#copy-payload-btn');
  const clearBtn = container.querySelector('#clear-payload-btn');
  const analyzeBtn = container.querySelector('#run-analysis-btn');
  const spinnerIcon = container.querySelector('#scan-spinner-icon');
  const radarIcon = container.querySelector('#scan-radar-icon');
  const labelText = container.querySelector('#scan-btn-label');

  if (copyBtn && inputEl) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(inputEl.value);
      copyBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-emerald">done</span>';
      setTimeout(() => {
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">content_copy</span>';
      }, 1500);
    });
  }

  if (clearBtn && inputEl) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      inputEl.focus();
    });
  }

  if (analyzeBtn && inputEl) {
    analyzeBtn.addEventListener('click', () => {
      const targetVal = inputEl.value.trim() || sampleScanTargets.url;
      spinnerIcon.style.display = 'inline-block';
      radarIcon.style.display = 'none';
      labelText.textContent = 'SCANNING HEURISTICS...';
      analyzeBtn.style.opacity = '0.85';

      setTimeout(() => {
        spinnerIcon.style.display = 'none';
        radarIcon.style.display = 'inline-block';
        labelText.textContent = 'ANALYSIS COMPLETE';
        analyzeBtn.style.opacity = '1';
        onAnalyze(targetVal, currentMode);

        setTimeout(() => {
          labelText.textContent = 'ANALYZE THREAT';
        }, 2000);
      }, 900);
    });
  }

  const batchBtn = container.querySelector('#batch-load-btn');
  if (batchBtn) {
    batchBtn.addEventListener('click', () => {
      onAnalyze('batch-payload-cluster-2048.ioc', 'batch');
    });
  }

  return container;
}
