export function createMetricGrid(stats) {
  const section = document.createElement('section');
  section.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3';

  section.innerHTML = `
    <!-- Card 1: Total Threats -->
    <div class="tactical-card p-4 flex flex-col justify-between overflow-hidden group hover:border-primary transition-all cursor-pointer" style="border: 1px solid rgba(63, 72, 80, 0.45);">
      <div class="tactical-corner"></div>
      <div class="flex justify-between items-start pb-1">
        <span class="font-label-caps text-outline uppercase tracking-wider" style="font-size: 10px;">TOTAL THREATS</span>
        <span class="material-symbols-outlined text-primary text-[20px]" style="color: var(--color-primary);">radar</span>
      </div>
      <div class="flex items-baseline gap-2 my-1">
        <span class="font-display-lg text-on-surface font-bold" style="font-size: 32px; font-family: var(--font-headline);">${stats.totalThreats}</span>
        <span class="font-code-sm text-primary flex items-center font-semibold" style="font-size: 11px; color: var(--color-primary);">
          <span class="material-symbols-outlined text-[14px]">arrow_upward</span>${stats.totalThreatsDelta}
        </span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden mt-2" style="background-color: var(--color-surface-container);">
        <div class="h-full rounded-full transition-all duration-700" style="width: ${stats.totalThreatsCapacity}%; background-color: var(--color-primary);"></div>
      </div>
      <div class="flex justify-between font-code-sm text-outline mt-1.5" style="font-size: 10.5px;">
        <span>Target baseline</span>
        <span class="text-on-surface-variant font-medium">${stats.totalThreatsCapacity}% of capacity</span>
      </div>
    </div>

    <!-- Card 2: Defcon 2 Critical -->
    <div class="tactical-card p-4 flex flex-col justify-between overflow-hidden group hover:border-error transition-all cursor-pointer" style="border: 1px solid rgba(164, 2, 23, 0.45);">
      <div class="tactical-corner-error"></div>
      <div class="flex justify-between items-start pb-1">
        <span class="font-label-caps text-error uppercase tracking-wider font-bold" style="font-size: 10px; color: var(--color-error);">DEFCON 2 CRITICAL</span>
        <span class="badge-critical" style="font-size: 9.5px;">
          <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-error);"></span>
          IMMEDIATE ACTION
        </span>
      </div>
      <div class="flex items-baseline gap-2 my-1">
        <span class="font-display-lg text-error font-bold" style="font-size: 32px; font-family: var(--font-headline); color: var(--color-error);">${stats.critical}</span>
        <span class="font-code-sm text-on-error-container font-semibold" style="font-size: 11px; color: var(--color-error);">${stats.criticalIsolated} isolated</span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden mt-2" style="background-color: var(--color-surface-container);">
        <div class="h-full rounded-full transition-all duration-700" style="width: ${stats.criticalCapacity}%; background-color: var(--color-error);"></div>
      </div>
      <div class="flex justify-between font-code-sm text-outline mt-1.5" style="font-size: 10.5px;">
        <span class="text-error font-medium">Isolation required</span>
        <span class="text-on-surface-variant font-medium">Target: 0</span>
      </div>
    </div>

    <!-- Card 3: High Risk -->
    <div class="tactical-card p-4 flex flex-col justify-between overflow-hidden group hover:border-tertiary transition-all cursor-pointer" style="border: 1px solid rgba(202, 129, 0, 0.45);">
      <div class="tactical-corner-tertiary"></div>
      <div class="flex justify-between items-start pb-1">
        <span class="font-label-caps text-tertiary uppercase tracking-wider font-bold" style="font-size: 10px; color: var(--color-tertiary);">ELEVATED RISKS</span>
        <span class="material-symbols-outlined text-tertiary text-[20px]" style="color: var(--color-tertiary);">warning</span>
      </div>
      <div class="flex items-baseline gap-2 my-1">
        <span class="font-display-lg text-tertiary font-bold" style="font-size: 32px; font-family: var(--font-headline); color: var(--color-tertiary);">${stats.highRisk}</span>
        <span class="font-code-sm text-on-surface-variant font-medium" style="font-size: 11px;">${stats.highRiskPipeline}</span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden mt-2" style="background-color: var(--color-surface-container);">
        <div class="h-full rounded-full transition-all duration-700" style="width: ${stats.highRiskCapacity}%; background-color: var(--color-tertiary);"></div>
      </div>
      <div class="flex justify-between font-code-sm text-outline mt-1.5" style="font-size: 10.5px;">
        <span>Quarantine queue</span>
        <span class="text-on-surface-variant font-medium">43 assigned</span>
      </div>
    </div>

    <!-- Card 4: Threats Blocked -->
    <div class="tactical-card p-4 flex flex-col justify-between overflow-hidden group hover:border-primary transition-all cursor-pointer" style="border: 1px solid rgba(63, 72, 80, 0.45);">
      <div class="tactical-corner"></div>
      <div class="flex justify-between items-start pb-1">
        <span class="font-label-caps text-primary uppercase tracking-wider font-bold" style="font-size: 10px; color: var(--color-primary);">THREATS BLOCKED</span>
        <span class="material-symbols-outlined text-primary text-[20px]" style="color: var(--color-primary);">verified_user</span>
      </div>
      <div class="flex items-baseline gap-2 my-1">
        <span class="font-display-lg text-on-surface font-bold" style="font-size: 32px; font-family: var(--font-headline);">${stats.blocked}</span>
        <span class="font-code-sm text-primary font-bold" style="font-size: 11px; color: var(--color-primary);">${stats.blockedContainmentRate}% containment</span>
      </div>
      <div class="w-full h-1.5 rounded-full overflow-hidden mt-2" style="background-color: var(--color-surface-container);">
        <div class="h-full rounded-full transition-all duration-700" style="width: ${stats.blockedContainmentRate}%; background-color: var(--color-primary);"></div>
      </div>
      <div class="flex justify-between font-code-sm text-outline mt-1.5" style="font-size: 10.5px;">
        <span class="text-emerald font-semibold">Zero breaches</span>
        <span class="text-on-surface-variant font-medium">Automated firewall</span>
      </div>
    </div>
  `;

  return section;
}
