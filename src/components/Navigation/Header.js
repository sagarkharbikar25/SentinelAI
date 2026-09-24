export function createHeader(currentTitle = 'SOC TELEMETRY', onSearch = () => {}, onOpenNotifications = () => {}) {
  const header = document.createElement('header');
  header.className = 'fixed top-0 left-72 right-0 h-16 bg-surface-lowest/95 backdrop-blur-md border-b border-outline-variant/30 z-40 px-6 flex items-center justify-between gap-4 select-none';
  header.style.backgroundColor = 'rgba(10, 14, 23, 0.95)';
  header.style.borderBottom = '1px solid rgba(63, 72, 80, 0.35)';
  header.style.backdropFilter = 'blur(8px)';

  header.innerHTML = `
    <!-- Left: Breadcrumbs -->
    <div class="flex items-center gap-2 font-code-md whitespace-nowrap text-on-surface-variant" style="font-family: var(--font-mono); font-size: 12px;">
      <span class="material-symbols-outlined text-primary text-[18px]" style="color: var(--color-primary);">terminal</span>
      <span class="text-on-surface font-semibold" style="color: var(--color-on-surface);">SENTINAL AI</span>
      <span class="text-outline" style="color: var(--color-outline);">/</span>
      <span class="text-primary font-bold tracking-wider" id="header-breadcrumb" style="color: var(--color-primary);">${currentTitle.toUpperCase()}</span>
    </div>

    <!-- Center: Global Tactical Threat Search Input -->
    <div class="flex-1 max-w-xl mx-4">
      <div class="relative flex items-center">
        <span class="material-symbols-outlined absolute left-3 text-outline text-[18px]" style="color: var(--color-outline); pointer-events: none;">search</span>
        <input 
          id="global-search-input"
          class="w-full bg-surface-low border border-outline-variant/50 focus:border-primary focus:outline-none pl-10 pr-20 py-1.5 text-on-surface placeholder:text-outline font-code-md rounded transition-colors"
          style="
            background-color: var(--color-surface-low);
            border: 1px solid rgba(63, 72, 80, 0.5);
            color: var(--color-on-surface);
            font-family: var(--font-mono);
            font-size: 12px;
            padding-left: 36px;
            padding-right: 70px;
            padding-top: 7px;
            padding-bottom: 7px;
            border-radius: var(--radius-default);
          "
          placeholder="Search threats, hashes, CVEs, or IPs... (Ctrl+K)"
          type="text"
        />
        <div class="absolute right-2.5 font-code-sm px-1.5 py-0.5 rounded text-outline border border-outline-variant/40" style="background-color: var(--color-surface-high); font-size: 10px;">
          Ctrl + K
        </div>
      </div>
    </div>

    <!-- Right: Telemetry Controls, DEFCON & Analyst Identity -->
    <div class="flex items-center gap-3 whitespace-nowrap">
      <!-- Live Sync / IST Time Widget -->
      <div class="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded font-code-sm text-on-surface-variant border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.4); font-size: 11px;">
        <span class="material-symbols-outlined text-[15px] text-primary" style="color: var(--color-primary);">schedule</span>
        <span id="live-ist-clock" class="text-on-surface font-medium">IST LIVE</span>
      </div>

      <!-- Operational Status -->
      <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded font-code-sm text-on-surface-variant border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.4); font-size: 11px;">
        <span class="inline-block w-2 h-2 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
        <span class="text-on-surface font-semibold">MIL-SPEC ONLINE</span>
        <span class="text-outline">|</span>
        <span class="text-primary font-mono font-bold">14ms</span>
      </div>

      <!-- DEFCON State Tag -->
      <div class="flex items-center gap-1 px-2 py-1 rounded font-label-caps" style="background: rgba(202, 129, 0, 0.15); border: 1px solid var(--color-tertiary); color: var(--color-tertiary); font-size: 10px;">
        <span class="material-symbols-outlined text-[14px]">warning</span>
        <span class="font-bold tracking-wider">DEFCON 3 // ELEVATED</span>
      </div>

      <!-- Notifications Bell -->
      <button 
        id="notification-bell-btn"
        class="relative p-1.5 text-on-surface-variant hover:text-on-surface transition-colors rounded hover:bg-surface-container"
        style="cursor: pointer; background: transparent; border: none; color: var(--color-on-surface-variant);"
        title="Active Intercept Notifications"
      >
        <span class="material-symbols-outlined text-[20px]">notifications</span>
        <span class="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full font-code-sm text-[10px] font-bold" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container);">
          3
        </span>
      </button>

      <div class="h-4 w-px bg-outline-variant/40" style="background-color: rgba(63, 72, 80, 0.4);"></div>

      <!-- Analyst Profile ID -->
      <div class="flex items-center gap-2 pl-1">
        <div class="hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-outline-variant/30 font-code-sm" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.4); font-size: 11px;">
          <span class="material-symbols-outlined text-primary text-[14px]" style="color: var(--color-primary);">shield_lock</span>
          <span class="text-on-surface font-bold">Analyst #4092</span>
        </div>
        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-on-primary shadow-sm" style="background-color: var(--color-primary); color: var(--color-on-primary);">
          <span class="material-symbols-outlined text-[18px]">person</span>
        </div>
      </div>
    </div>
  `;

  // Attach search listeners and live clock
  const searchInput = header.querySelector('#global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      onSearch(e.target.value);
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  const notifBtn = header.querySelector('#notification-bell-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', onOpenNotifications);
  }

  // Live IST Clock update
  const clockEl = header.querySelector('#live-ist-clock');
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    const istTime = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    clockEl.textContent = `${istTime} IST / LIVE SYNC`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  return header;
}
