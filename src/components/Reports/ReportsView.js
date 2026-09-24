import { reportsList } from '../../data/intelData.js';

export function createReportsView(toast = { show: () => {} }) {
  const container = document.createElement('div');
  container.className = 'flex flex-col gap-4';

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div>
        <div class="flex items-center gap-2 font-label-caps text-primary tracking-widest" style="font-size: 10px; color: var(--color-primary);">
          <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
          OFFICIAL SECURITY AUDIT & INTELLIGENCE REPORTS
        </div>
        <h1 class="font-headline-lg font-bold text-on-surface" style="font-size: 24px; font-family: var(--font-headline);">
          OFFICIAL INTELLIGENCE & COMPLIANCE DEBRIEFS
        </h1>
        <p class="font-body-sm text-on-surface-variant" style="font-size: 12.5px;">
          Formal security posture evaluations, SCADA infrastructure reviews, and automated incident debriefs.
        </p>
      </div>

      <button id="generate-new-report-btn" class="btn-primary py-1.5 px-3" style="font-size: 11px;">
        <span class="material-symbols-outlined text-[16px]">add</span>
        <span>COMPILE NEW AUDIT</span>
      </button>
    </div>

    <!-- Reports Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${reportsList.map(rep => `
        <div class="tactical-card p-4 flex flex-col justify-between gap-3 border border-outline-variant/40 hover:border-primary transition-all" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="font-code-sm text-primary font-bold" style="font-size: 11px;">${rep.id}</span>
              <span class="font-label-caps px-2 py-0.5 rounded font-bold" style="background-color: var(--color-surface-high); color: var(--color-on-surface); font-size: 9px;">
                ${rep.classification}
              </span>
            </div>
            <h3 class="font-headline-sm font-bold text-on-surface mt-1" style="font-size: 14px; line-height: 19px;">
              ${rep.title}
            </h3>
            <p class="font-body-sm text-on-surface-variant" style="font-size: 11.5px; line-height: 16px;">
              ${rep.summary}
            </p>
          </div>

          <div class="pt-2 border-t border-outline-variant/20 flex flex-col gap-2 font-code-sm text-outline" style="font-size: 10.5px;">
            <div class="flex justify-between items-center">
              <span>Author: <strong class="text-on-surface">${rep.author}</strong></span>
              <span>${rep.date}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>${rep.pages} pages (${rep.fileSize})</span>
              <button class="download-report-btn btn-secondary py-1 px-2.5 font-label-caps" data-id="${rep.id}" style="font-size: 9.5px;">
                <span class="material-symbols-outlined text-[13px]">download</span>
                <span>DOWNLOAD PDF</span>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Attach triggers
  const compileBtn = container.querySelector('#generate-new-report-btn');
  if (compileBtn) {
    compileBtn.addEventListener('click', () => {
      toast.show('Compiling official SOC Cyber Telemetry Report...', 'success');
    });
  }

  container.querySelectorAll('.download-report-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      toast.show(`Generating export PDF for ${id}...`, 'success');
    });
  });

  return container;
}
