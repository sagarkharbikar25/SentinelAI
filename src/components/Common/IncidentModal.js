export function createIncidentModal(onClose = () => {}, onIsolate = () => {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'incident-modal-overlay';

  overlay.innerHTML = `
    <div class="modal-window p-5 flex flex-col gap-4 border border-outline-variant/40" style="border: 1px solid rgba(63, 72, 80, 0.5); background-color: var(--color-surface-low);">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-error text-[20px]" style="color: var(--color-error);">crisis_alert</span>
          <h3 class="font-headline-md font-bold text-on-surface" id="modal-incident-title" style="font-size: 16px;">
            INCIDENT DRILLDOWN
          </h3>
        </div>
        <button id="modal-close-btn" class="p-1 rounded hover:bg-surface-high text-outline hover:text-on-surface" style="background: none; border: none; cursor: pointer;">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="flex flex-col gap-3 font-code-sm" id="modal-incident-body" style="font-size: 11.5px;">
        <!-- Filled dynamically in show() -->
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-outline-variant/30" style="border-top: 1px solid rgba(63, 72, 80, 0.35);">
        <button id="modal-cancel-btn" class="btn-secondary py-1.5 px-3">
          CLOSE
        </button>
        <div class="flex items-center gap-2">
          <button id="modal-sandbox-btn" class="btn-secondary py-1.5 px-3">
            <span class="material-symbols-outlined text-[15px] text-tertiary">science</span>
            <span>SEND TO SANDBOX</span>
          </button>
          <button id="modal-isolate-btn" class="btn-danger py-1.5 px-3.5">
            <span class="material-symbols-outlined text-[15px]">shield</span>
            <span>AIRGAP ISOLATE</span>
          </button>
        </div>
      </div>
    </div>
  `;

  let currentItem = null;

  function close() {
    overlay.classList.remove('active');
    onClose();
  }

  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.querySelector('#modal-cancel-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const isolateBtn = overlay.querySelector('#modal-isolate-btn');
  if (isolateBtn) {
    isolateBtn.addEventListener('click', () => {
      if (currentItem) onIsolate(currentItem);
      close();
    });
  }

  const sandboxBtn = overlay.querySelector('#modal-sandbox-btn');
  if (sandboxBtn) {
    sandboxBtn.addEventListener('click', () => {
      close();
    });
  }

  return {
    element: overlay,
    show: (incident) => {
      currentItem = incident;
      const titleEl = overlay.querySelector('#modal-incident-title');
      const bodyEl = overlay.querySelector('#modal-incident-body');
      if (titleEl) titleEl.textContent = `INCIDENT ${incident.id} // ${incident.type.toUpperCase()}`;

      if (bodyEl) {
        bodyEl.innerHTML = `
          <div class="grid grid-cols-2 gap-2 p-3 rounded border border-outline-variant/30" style="background-color: var(--color-surface-container);">
            <div><span class="text-outline">Threat ID:</span> <strong class="text-primary">${incident.id}</strong></div>
            <div><span class="text-outline">Severity:</span> <span class="${incident.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}">${incident.severity}</span></div>
            <div><span class="text-outline">Source:</span> <span class="text-on-surface">${incident.sourceType} (${incident.sourceDetail})</span></div>
            <div><span class="text-outline">Risk Score:</span> <strong class="text-error font-bold">${incident.riskScore} / 100</strong></div>
            <div><span class="text-outline">Status:</span> <span class="text-emerald font-bold">${incident.status}</span></div>
            <div><span class="text-outline">Detected:</span> <span class="text-on-surface-variant">${incident.time}</span></div>
          </div>

          <div class="p-3 rounded border border-outline-variant/30 flex flex-col gap-1" style="background-color: var(--color-surface-lowest);">
            <span class="font-label-caps text-outline">HEURISTIC TELEMETRY ASSESSMENT</span>
            <p class="font-body-sm text-on-surface leading-relaxed" style="font-size: 12px;">
              ${incident.details}
            </p>
          </div>

          <div class="p-2.5 rounded font-code-sm text-outline flex items-center justify-between" style="background-color: var(--color-surface-high);">
            <span>HASH: 8f44b20199e4c19a9042b322...</span>
            <span class="text-primary font-bold">SHA-256 VALIDATED</span>
          </div>
        `;
      }

      overlay.classList.add('active');
    },
    close
  };
}
