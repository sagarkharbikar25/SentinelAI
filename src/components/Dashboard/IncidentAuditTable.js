export function createIncidentAuditTable(incidents, onInspect = () => {}, onExport = () => {}) {
  const container = document.createElement('section');
  container.className = 'tactical-card overflow-hidden';
  container.style.border = '1px solid rgba(63, 72, 80, 0.45)';

  let filterSeverity = 'ALL';
  let searchTerm = '';

  function getFilteredIncidents() {
    return incidents.filter(item => {
      const matchSev = filterSeverity === 'ALL' || item.severity === filterSeverity;
      const matchSearch = searchTerm === '' || 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceDetail.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSev && matchSearch;
    });
  }

  function renderTableRows() {
    const tbody = container.querySelector('#incident-table-tbody');
    if (!tbody) return;

    const list = getFilteredIncidents();
    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-6 text-outline font-code-sm">
            No incidents found matching current filter query.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(item => {
      let sevBadge = '';
      if (item.severity === 'CRITICAL') {
        sevBadge = `<span class="badge-critical"><span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-error);"></span>CRITICAL</span>`;
      } else if (item.severity === 'HIGH') {
        sevBadge = `<span class="badge-high">HIGH</span>`;
      } else {
        sevBadge = `<span class="badge-normal">MEDIUM</span>`;
      }

      let statusBadge = '';
      if (item.status === 'Active') {
        statusBadge = `<span class="flex items-center gap-1.5 text-error font-bold font-code-sm"><span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-error);"></span>Active</span>`;
      } else if (item.status === 'Investigating') {
        statusBadge = `<span class="flex items-center gap-1.5 text-tertiary font-medium font-code-sm"><span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: var(--color-tertiary);"></span>Investigating</span>`;
      } else if (item.status === 'Isolated') {
        statusBadge = `<span class="flex items-center gap-1.5 text-outline font-code-sm"><span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: var(--color-outline);"></span>Isolated</span>`;
      } else {
        statusBadge = `<span class="flex items-center gap-1.5 text-primary font-medium font-code-sm"><span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: var(--color-primary);"></span>Mitigated</span>`;
      }

      const scoreColor = item.riskScore >= 90 ? 'var(--color-error)' : item.riskScore >= 70 ? 'var(--color-tertiary)' : 'var(--color-primary)';

      return `
        <tr class="hover:bg-surface-low transition-colors group cursor-pointer border-b border-outline-variant/20" data-id="${item.id}" style="border-bottom: 1px solid rgba(63, 72, 80, 0.25);">
          <td class="py-2.5 px-4 font-bold text-primary" style="color: var(--color-primary);">${item.id}</td>
          <td class="py-2.5 px-4 text-on-surface font-medium">${item.type}</td>
          <td class="py-2.5 px-4 text-on-surface-variant font-code-sm" style="font-size: 11.5px;">
            <div class="flex items-center gap-1.5">
              <span class="px-1.5 py-0.5 rounded font-label-caps" style="background-color: var(--color-surface-container); font-size: 9.5px;">${item.sourceType}</span>
              <span class="truncate max-w-[160px] text-outline">${item.sourceDetail}</span>
            </div>
          </td>
          <td class="py-2.5 px-4 text-center font-bold" style="color: ${scoreColor}; font-size: 13px;">${item.riskScore}</td>
          <td class="py-2.5 px-4">${sevBadge}</td>
          <td class="py-2.5 px-4">${statusBadge}</td>
          <td class="py-2.5 px-4 text-right text-outline font-code-sm" style="font-size: 11px;">${item.time}</td>
          <td class="py-2.5 px-4 text-center">
            <button class="inspect-btn p-1 rounded hover:bg-surface-high text-outline hover:text-primary transition-colors" data-id="${item.id}" title="Inspect Threat Incident" style="background: none; border: none; cursor: pointer;">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row inspection triggers
    tbody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', (e) => {
        const id = row.getAttribute('data-id');
        const found = incidents.find(i => i.id === id);
        if (found) onInspect(found);
      });
    });
  }

  container.innerHTML = `
    <!-- Section Header Strip -->
    <div class="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[18px]" style="color: var(--color-primary);">terminal</span>
        <span class="font-headline-md text-on-surface uppercase tracking-wide font-bold" style="font-size: 14px;">RECENT THREATS // INCIDENT AUDIT STREAM</span>
      </div>
      
      <div class="flex flex-wrap items-center gap-2">
        <!-- Filter Tabs -->
        <div class="flex items-center gap-1 font-code-sm text-[11px]">
          <button class="sev-filter active px-2 py-0.5 rounded font-bold" data-sev="ALL" style="background-color: var(--color-primary); color: var(--color-on-primary); cursor: pointer; border: none;">ALL</button>
          <button class="sev-filter px-2 py-0.5 rounded text-error hover:bg-surface-high" data-sev="CRITICAL" style="background-color: var(--color-surface-container); cursor: pointer; border: none;">CRITICAL</button>
          <button class="sev-filter px-2 py-0.5 rounded text-tertiary hover:bg-surface-high" data-sev="HIGH" style="background-color: var(--color-surface-container); cursor: pointer; border: none;">HIGH</button>
          <button class="sev-filter px-2 py-0.5 rounded text-primary hover:bg-surface-high" data-sev="MEDIUM" style="background-color: var(--color-surface-container); cursor: pointer; border: none;">MEDIUM</button>
        </div>

        <button id="export-incidents-csv-btn" class="btn-secondary py-1 px-2.5 font-label-caps" style="font-size: 10px;">
          <span class="material-symbols-outlined text-[14px]">download</span>
          <span>EXPORT CSV</span>
        </button>
      </div>
    </div>

    <!-- High-Density Tactical Table -->
    <div class="overflow-x-auto w-full" style="background-color: var(--color-surface-lowest);">
      <table class="w-full text-left font-code-md" style="font-family: var(--font-mono); font-size: 12px; border-collapse: collapse;">
        <thead>
          <tr class="font-label-caps text-outline uppercase border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35); font-size: 10px;">
            <th class="py-2.5 px-4">Threat ID</th>
            <th class="py-2.5 px-4">Type</th>
            <th class="py-2.5 px-4">Source</th>
            <th class="py-2.5 px-4 text-center">Risk Score</th>
            <th class="py-2.5 px-4">Severity</th>
            <th class="py-2.5 px-4">Status</th>
            <th class="py-2.5 px-4 text-right">Time</th>
            <th class="py-2.5 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody id="incident-table-tbody" class="divide-y divide-outline-variant/20">
        </tbody>
      </table>
    </div>
  `;

  renderTableRows();

  // Attach filter events
  container.querySelectorAll('.sev-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.sev-filter').forEach(b => {
        b.style.backgroundColor = 'var(--color-surface-container)';
        b.style.color = b.getAttribute('data-sev') === 'CRITICAL' ? 'var(--color-error)' : b.getAttribute('data-sev') === 'HIGH' ? 'var(--color-tertiary)' : 'var(--color-on-surface-variant)';
        b.style.fontWeight = 'normal';
      });
      btn.style.backgroundColor = 'var(--color-primary)';
      btn.style.color = 'var(--color-on-primary)';
      btn.style.fontWeight = 'bold';

      filterSeverity = btn.getAttribute('data-sev');
      renderTableRows();
    });
  });

  const exportBtn = container.querySelector('#export-incidents-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', onExport);
  }

  return container;
}
