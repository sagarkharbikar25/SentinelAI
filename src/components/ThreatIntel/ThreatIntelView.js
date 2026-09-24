import { intelFeed, threatActors } from '../../data/intelData.js';

export function createThreatIntelView(toast = { show: () => {} }) {
  const container = document.createElement('div');
  container.className = 'flex flex-col gap-4';

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div>
        <div class="flex items-center gap-2 font-label-caps text-primary tracking-widest" style="font-size: 10px; color: var(--color-primary);">
          <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
          NATIONAL THREAT INTELLIGENCE VAULT
        </div>
        <h1 class="font-headline-lg font-bold text-on-surface" style="font-size: 24px; font-family: var(--font-headline);">
          THREAT INTELLIGENCE & CVE REGISTRY
        </h1>
        <p class="font-body-sm text-on-surface-variant" style="font-size: 12.5px;">
          National Indicators of Compromise (IOC), MITRE ATT&CK tactical vectors, and monitored state-sponsored threat actors.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button id="sync-cve-feed-btn" class="btn-primary py-1.5 px-3" style="font-size: 11px;">
          <span class="material-symbols-outlined text-[16px]">sync</span>
          <span>SYNC CERT-IN FEEDS</span>
        </button>
      </div>
    </div>

    <!-- Active Threat Actors Dossiers Grid -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="font-label-caps text-outline tracking-wider" style="font-size: 10px;">MONITORED THREAT ACTORS & APTS</span>
        <span class="font-code-sm text-primary" style="font-size: 10.5px;">3 Tier-1 Actors Active</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${threatActors.map(actor => `
          <div class="tactical-card p-3.5 flex flex-col justify-between gap-2 border border-outline-variant/40 hover:border-primary transition-colors" style="border: 1px solid rgba(63, 72, 80, 0.45);">
            <div class="flex items-start justify-between">
              <span class="font-headline-sm font-bold text-on-surface" style="font-size: 13px;">${actor.tag}</span>
              <span class="badge-critical font-code-sm" style="font-size: 9px;">${actor.threatLevel}</span>
            </div>
            <div class="font-code-sm flex flex-col gap-1 text-on-surface-variant" style="font-size: 11px;">
              <div><span class="text-outline">Origin:</span> <strong class="text-on-surface">${actor.origin}</strong></div>
              <div><span class="text-outline">Targets:</span> ${actor.targetSectors}</div>
              <div><span class="text-outline">Tactics:</span> <span class="text-tertiary">${actor.tactics}</span></div>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-code-sm text-outline" style="font-size: 10px;">
              <span>Active Incidents: <strong class="text-error">${actor.activeIncidents}</strong></span>
              <button class="view-dossier-btn text-primary hover:underline font-bold" data-actor="${actor.tag}" style="background: none; border: none; cursor: pointer; font-size: 10.5px;">
                View Dossier →
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Live CVE & Vulnerability Intel Stream -->
    <div class="tactical-card overflow-hidden" style="border: 1px solid rgba(63, 72, 80, 0.45);">
      <div class="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[18px]">security</span>
          <span class="font-headline-md font-bold text-on-surface" style="font-size: 14px;">CRITICAL CVE INTEL & ZERO-DAY ADVISORIES</span>
        </div>
        <span class="font-code-sm text-outline" style="font-size: 10.5px;">FEED SOURCE: CERT-IN / NIST NVD</span>
      </div>

      <div class="overflow-x-auto w-full">
        <table class="w-full text-left font-code-md" style="font-size: 11.5px; border-collapse: collapse;">
          <thead>
            <tr class="font-label-caps text-outline uppercase border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35); font-size: 10px;">
              <th class="py-2.5 px-4">CVE Identifier</th>
              <th class="py-2.5 px-4">Vulnerability Name</th>
              <th class="py-2.5 px-4">CVSS Score</th>
              <th class="py-2.5 px-4">Attack Type</th>
              <th class="py-2.5 px-4">Status</th>
              <th class="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            ${intelFeed.map(cve => `
              <tr class="hover:bg-surface-low transition-colors">
                <td class="py-2.5 px-4 font-bold text-primary">${cve.cve}</td>
                <td class="py-2.5 px-4 font-medium text-on-surface">${cve.name}</td>
                <td class="py-2.5 px-4">
                  <span class="${cve.severity.includes('CRITICAL') ? 'badge-critical' : 'badge-high'}">${cve.severity}</span>
                </td>
                <td class="py-2.5 px-4 text-outline">${cve.type}</td>
                <td class="py-2.5 px-4">
                  <span class="text-emerald font-bold font-code-sm">${cve.status}</span>
                </td>
                <td class="py-2.5 px-4 text-right">
                  <button class="cve-mitigate-btn btn-secondary py-1 px-2.5" data-cve="${cve.cve}" style="font-size: 10px;">
                    Verify Patch
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach events
  const syncBtn = container.querySelector('#sync-cve-feed-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      toast.show('Synchronized with National CERT-In Advisory database.', 'success');
    });
  }

  container.querySelectorAll('.view-dossier-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const actor = btn.getAttribute('data-actor');
      toast.show(`Loaded tactical dossier for ${actor}.`, 'success');
    });
  });

  container.querySelectorAll('.cve-mitigate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cve = btn.getAttribute('data-cve');
      toast.show(`Telemetry rule verified for ${cve}. Defenses nominal.`, 'success');
    });
  });

  return container;
}
