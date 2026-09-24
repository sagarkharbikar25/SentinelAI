export function createHeroOverview(onFilterFeeds = () => {}) {
  const section = document.createElement('section');
  section.className = 'flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 border-b border-outline-variant/30';
  section.style.borderBottom = '1px solid rgba(63, 72, 80, 0.35)';

  section.innerHTML = `
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-2 font-label-caps text-primary tracking-widest uppercase" style="color: var(--color-primary); font-size: 10px;">
        <span class="inline-block w-2 h-2 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
        <span class="font-bold">SYSTEM ACTIVE // MIL-SPEC TELEMETRY INGRESS</span>
        <span class="text-outline">::</span>
        <span class="text-on-surface-variant font-code-sm">GRID-ALPHA-9 [NOC DELHI]</span>
      </div>
      <h1 class="font-display-lg text-on-surface tracking-tight font-bold" style="font-family: var(--font-headline); font-size: 28px; line-height: 34px;">
        CYBER SECURITY OVERVIEW
      </h1>
      <p class="font-body-md text-on-surface-variant flex flex-wrap items-center gap-2" style="font-size: 13px; color: var(--color-on-surface-variant);">
        <span>AI-powered continuous threat monitoring, dynamic heuristics & defense orchestration.</span>
        <span class="inline-block w-1 h-1 rounded-full" style="background-color: var(--color-outline);"></span>
        <span class="font-code-sm text-primary font-semibold tracking-wide" style="font-size: 11px; color: var(--color-primary);">
          LAST REFRESH: <span id="telemetry-refresh-counter">00:03s AGO</span> | SOC CLUSTER: PRIMARY-DELTA
        </span>
      </p>
    </div>

    <!-- Right Live Telemetry Badges & Filter Button -->
    <div class="flex flex-wrap items-center gap-2.5">
      <div class="px-3 py-1.5 rounded flex items-center gap-2.5 border border-outline-variant/40" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.4);">
        <span class="material-symbols-outlined text-primary text-[20px]" style="color: var(--color-primary);">dns</span>
        <div class="flex flex-col">
          <span class="font-label-caps text-outline leading-none" style="font-size: 9px;">PACKET INGEST</span>
          <span class="font-code-md text-on-surface font-bold" style="font-size: 12.5px;">1.48 TB/s</span>
        </div>
      </div>

      <div class="px-3 py-1.5 rounded flex items-center gap-2.5 border border-outline-variant/40" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.4);">
        <span class="material-symbols-outlined text-tertiary text-[20px]" style="color: var(--color-tertiary);">memory</span>
        <div class="flex flex-col">
          <span class="font-label-caps text-outline leading-none" style="font-size: 9px;">NEURAL LATENCY</span>
          <span class="font-code-md text-on-surface font-bold" style="font-size: 12.5px;">4.2ms</span>
        </div>
      </div>

      <button 
        id="filter-feeds-btn"
        class="btn-secondary"
        style="padding: 8px 14px; font-size: 11px;"
      >
        <span class="material-symbols-outlined text-[16px] text-primary">tune</span>
        <span>FILTER FEEDS</span>
      </button>
    </div>
  `;

  const filterBtn = section.querySelector('#filter-feeds-btn');
  if (filterBtn) {
    filterBtn.addEventListener('click', onFilterFeeds);
  }

  // Simulated live refresh timer
  let seconds = 3;
  const counterEl = section.querySelector('#telemetry-refresh-counter');
  setInterval(() => {
    seconds = (seconds % 10) + 1;
    if (counterEl) {
      counterEl.textContent = `00:0${seconds}s AGO`;
    }
  }, 1000);

  return section;
}
