export function createTelemetryChart() {
  const container = document.createElement('div');
  container.className = 'flex flex-col rounded overflow-hidden tactical-card';
  container.style.border = '1px solid rgba(63, 72, 80, 0.45)';

  container.innerHTML = `
    <!-- Header Strip -->
    <div class="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[18px]" style="color: var(--color-primary);">show_chart</span>
        <span class="font-headline-md text-on-surface uppercase tracking-wide font-bold" style="font-size: 14px;">THREAT ACTIVITY (24H TELEMETRY)</span>
      </div>
      
      <!-- Legend -->
      <div class="flex items-center gap-3 font-code-sm" style="font-size: 11px;">
        <div class="flex items-center gap-1.5 text-error" style="color: var(--color-error);">
          <span class="w-2.5 h-0.5 inline-block" style="background-color: var(--color-error);"></span>
          <span>Detected</span>
        </div>
        <div class="flex items-center gap-1.5 text-primary" style="color: var(--color-primary);">
          <span class="w-2.5 h-0.5 inline-block" style="background-color: var(--color-primary);"></span>
          <span>Blocked</span>
        </div>
        <div class="flex items-center gap-1.5 text-tertiary" style="color: var(--color-tertiary);">
          <span class="w-2.5 h-0.5 border-t border-dashed inline-block" style="border-top: 1px dashed var(--color-tertiary);"></span>
          <span>Auditing</span>
        </div>
      </div>
    </div>

    <div class="p-4 flex flex-col flex-1 justify-between gap-3" style="background-color: var(--color-surface-lowest);">
      <!-- Interactive SVG Multi-Line Chart Canvas -->
      <div class="relative w-full h-64 rounded p-2 overflow-hidden flex flex-col justify-between border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
        
        <!-- SVG Canvas Graphic -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none p-3" preserveAspectRatio="none" viewBox="0 0 500 200">
          <defs>
            <linearGradient id="primaryGlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#93ccff" stop-opacity="0.3"></stop>
              <stop offset="100%" stop-color="#93ccff" stop-opacity="0.0"></stop>
            </linearGradient>
            <linearGradient id="errorGlow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#ffb4ab" stop-opacity="0.35"></stop>
              <stop offset="100%" stop-color="#ffb4ab" stop-opacity="0.0"></stop>
            </linearGradient>
          </defs>

          <!-- Horizontal Grid Lines -->
          <line x1="0" x2="500" y1="40" y2="40" stroke="#3f4850" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2 4"></line>
          <line x1="0" x2="500" y1="90" y2="90" stroke="#3f4850" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2 4"></line>
          <line x1="0" x2="500" y1="140" y2="140" stroke="#3f4850" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="2 4"></line>

          <!-- Detected Threats Area (Red Area & Line) -->
          <path d="M 0,140 Q 60,120 120,70 T 240,110 T 360,40 T 500,60 L 500,190 L 0,190 Z" fill="url(#errorGlow)"></path>
          <path d="M 0,140 Q 60,120 120,70 T 240,110 T 360,40 T 500,60" fill="none" stroke="#ffb4ab" stroke-linecap="round" stroke-width="2.5"></path>

          <!-- Blocked Threats Area (Blue Area & Line) -->
          <path d="M 0,160 Q 60,140 120,95 T 240,125 T 360,65 T 500,80 L 500,190 L 0,190 Z" fill="url(#primaryGlow)"></path>
          <path d="M 0,160 Q 60,140 120,95 T 240,125 T 360,65 T 500,80" fill="none" stroke="#93ccff" stroke-linecap="round" stroke-width="2"></path>

          <!-- Investigation Path (Amber dashed) -->
          <path d="M 0,175 Q 80,160 160,150 T 320,130 T 500,115" fill="none" stroke="#ffb95f" stroke-dasharray="4,4" stroke-width="1.5"></path>

          <!-- Active Peak Nodes -->
          <circle cx="360" cy="40" r="4.5" fill="#ffb4ab"></circle>
          <circle cx="360" cy="40" r="9" fill="none" stroke="#ffb4ab" opacity="0.6" stroke-width="1.5" class="pulse-anim"></circle>
          <circle cx="500" cy="80" r="4" fill="#93ccff"></circle>
        </svg>

        <!-- Y Axis indicators -->
        <div class="relative z-10 flex flex-col justify-between h-full font-code-sm text-outline select-none pointer-events-none pb-4" style="font-size: 10px;">
          <span>120 /hr</span>
          <span>80 /hr</span>
          <span>40 /hr</span>
          <span>0</span>
        </div>

        <!-- X Axis indicators -->
        <div class="relative z-10 flex justify-between font-code-sm text-outline select-none pt-1 border-t border-outline-variant/30" style="font-size: 10px; border-top: 1px solid rgba(63, 72, 80, 0.3);">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span class="text-primary font-bold">NOW (LIVE)</span>
        </div>
      </div>

      <!-- Bottom Summary Metrics -->
      <div class="grid grid-cols-3 gap-2 pt-1">
        <div class="p-2.5 rounded flex flex-col border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
          <span class="font-code-sm text-outline" style="font-size: 10px;">AVERAGE MITIGATION</span>
          <span class="font-code-md font-bold text-on-surface mt-0.5" style="font-size: 13px;">380 ms</span>
        </div>
        <div class="p-2.5 rounded flex flex-col border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
          <span class="font-code-sm text-outline" style="font-size: 10px;">PEAK INGRESS SPIKE</span>
          <span class="font-code-md font-bold text-error mt-0.5" style="font-size: 13px; color: var(--color-error);">14:22 UTC</span>
        </div>
        <div class="p-2.5 rounded flex flex-col border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
          <span class="font-code-sm text-outline" style="font-size: 10px;">NEURAL CONCURRENCY</span>
          <span class="font-code-md font-bold text-primary mt-0.5" style="font-size: 13px; color: var(--color-primary);">99.98%</span>
        </div>
      </div>
    </div>
  `;

  return container;
}
