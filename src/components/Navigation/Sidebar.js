export function createSidebar(activeRoute = 'dashboard', onNavigate = () => {}) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'fixed left-0 top-0 h-full w-72 bg-surface-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none';
  sidebar.style.backgroundColor = 'var(--color-surface-lowest)';
  sidebar.style.borderRight = '1px solid rgba(63, 72, 80, 0.35)';

  // Authentic SVG Emblem from Stitch Project Asset
  const emblemSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="h-9 w-9 flex-shrink-0">
      <circle cx="50" cy="50" r="46" fill="#0b2545" stroke="#d97706" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="41" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="2,2"/>
      <path d="M50 18 L72 26 C72 50 50 68 50 78 C50 68 28 50 28 26 Z" fill="#1e3a8a" stroke="#d97706" stroke-width="1.8"/>
      <circle cx="50" cy="45" r="14" fill="#0f172a" stroke="#60a5fa" stroke-width="1.2"/>
      <circle cx="50" cy="45" r="4" fill="#d97706"/>
      <line x1="50" y1="31" x2="50" y2="59" stroke="#93c5fd" stroke-width="1"/>
      <line x1="36" y1="45" x2="64" y2="45" stroke="#93c5fd" stroke-width="1"/>
      <line x1="40" y1="35" x2="60" y2="55" stroke="#93c5fd" stroke-width="1"/>
      <line x1="60" y1="35" x2="40" y2="55" stroke="#93c5fd" stroke-width="1"/>
      <path d="M36 82 C44 85 56 85 64 82" stroke="#d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  `;

  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: 'grid_view', badge: 'LIVE' },
    { id: 'agent-security', label: 'Agent Interceptor', icon: 'shield', badge: '3 ACTIVE' },
    { id: 'threat-detection', label: 'Threat Heuristics', icon: 'radar', badge: null },
    { id: 'threat-map', label: 'Global Threat Map', icon: 'public', badge: null },
    { id: 'threat-intel', label: 'Intelligence Vault', icon: 'hub', badge: 'CVEs' },
    { id: 'reports', label: 'Official Reports', icon: 'description', badge: '3 NEW' }
  ];

  sidebar.innerHTML = `
    <div class="flex flex-col">
      <!-- Brand Masthead Header -->
      <div class="h-16 px-4 border-b border-outline-variant/30 flex items-center justify-between" style="border-bottom: 1px solid rgba(63, 72, 80, 0.3);">
        <div class="flex items-center gap-2.5 cursor-pointer" id="brand-logo-btn">
          ${emblemSvg}
          <div class="flex flex-col">
            <span class="font-headline-md tracking-wider text-on-surface font-bold leading-none" style="font-family: var(--font-headline); letter-spacing: 0.04em;">SENTINAL AI</span>
            <span class="font-code-sm text-primary tracking-widest font-semibold mt-0.5" style="font-size: 10px; color: var(--color-primary);">NATIONAL DEFENSE SOC</span>
          </div>
        </div>
        <span class="material-symbols-outlined text-primary text-[20px]" style="color: var(--color-primary);">verified_user</span>
      </div>

      <!-- Department Tiering Label -->
      <div class="px-4 py-2 mt-2">
        <div class="font-label-caps text-outline uppercase px-1 py-1" style="font-size: 9.5px; color: var(--color-outline); letter-spacing: 0.1em;">SOC ARCHITECTURE & TELEMETRY</div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex flex-col gap-1 px-3" id="sidebar-nav">
        ${navItems.map(item => {
          const isActive = item.id === activeRoute;
          return `
            <button 
              data-route="${item.id}"
              class="nav-item w-full flex items-center justify-between px-3 py-2.5 rounded transition-all text-left ${
                isActive 
                  ? 'active' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }"
              style="
                background-color: ${isActive ? 'var(--color-primary-container)' : 'transparent'};
                color: ${isActive ? 'var(--color-on-primary-container)' : 'var(--color-on-surface-variant)'};
                font-family: var(--font-mono);
                font-size: 12px;
                font-weight: ${isActive ? '600' : '400'};
                border: ${isActive ? '1px solid var(--color-primary)' : '1px solid transparent'};
                box-shadow: ${isActive ? '0 0 14px rgba(49, 152, 220, 0.35)' : 'none'};
                cursor: pointer;
              "
            >
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px]" style="color: ${isActive ? 'var(--color-on-primary-container)' : 'var(--color-primary)'};">${item.icon}</span>
                <span>${item.label}</span>
              </div>
              ${item.badge ? `
                <span class="px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-wider uppercase" style="
                  background: ${isActive ? 'rgba(0, 44, 71, 0.3)' : 'var(--color-surface-high)'};
                  color: ${isActive ? 'var(--color-on-primary-container)' : 'var(--color-primary)'};
                  border: 1px solid ${isActive ? 'var(--color-primary)' : 'rgba(63, 72, 80, 0.5)'};
                ">${item.badge}</span>
              ` : ''}
            </button>
          `;
        }).join('')}
      </nav>
    </div>

    <!-- Bottom System Telemetry Status -->
    <div class="p-3 border-t border-outline-variant/30" style="border-top: 1px solid rgba(63, 72, 80, 0.3); background-color: var(--color-surface-low);">
      <div class="p-3 rounded border border-outline-variant/40 flex flex-col gap-1.5" style="background-color: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.4);">
        <div class="flex items-center justify-between pb-1.5 border-b border-outline-variant/20" style="border-bottom: 1px solid rgba(63, 72, 80, 0.2);">
          <span class="font-label-caps text-outline uppercase" style="font-size: 9.5px;">SYSTEM STATUS</span>
          <span class="flex items-center gap-1.5 font-code-sm text-primary" style="font-size: 11px; color: var(--color-primary);">
            <span class="inline-block w-2 h-2 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
            OPERATIONAL
          </span>
        </div>
        <div class="flex justify-between items-center font-code-sm text-on-surface-variant" style="font-size: 10.5px;">
          <span class="text-outline">Engine:</span>
          <span class="text-on-surface font-semibold">SENTINAL Neural v4.8</span>
        </div>
        <div class="flex justify-between items-center font-code-sm text-on-surface-variant" style="font-size: 10.5px;">
          <span class="text-outline">SOC Node:</span>
          <span class="text-primary font-semibold">SEC-HQ-01 (NOC)</span>
        </div>
        <div class="flex justify-between items-center font-code-sm text-on-surface-variant" style="font-size: 10.5px;">
          <span class="text-outline">Latency:</span>
          <span class="text-emerald font-semibold">4.2ms // eBPF Hook</span>
        </div>
      </div>
    </div>
  `;

  // Attach navigation listeners
  sidebar.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const route = button.getAttribute('data-route');
      onNavigate(route);
    });
  });

  const brandBtn = sidebar.querySelector('#brand-logo-btn');
  if (brandBtn) {
    brandBtn.addEventListener('click', () => onNavigate('dashboard'));
  }

  return sidebar;
}
