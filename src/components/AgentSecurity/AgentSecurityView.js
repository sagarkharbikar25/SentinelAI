import { agentStats, currentInterception, activityFeed, vaultFiles, agentRegistry, securityPolicies } from '../../data/agentSecurityData.js';

export function createAgentSecurityView(toast = { show: () => {} }) {
  const container = document.createElement('div');
  container.className = 'flex flex-col gap-4';

  let countdown = 24;
  let countdownTimer = null;
  let currentTab = 'vault';

  container.innerHTML = `
    <!-- 1. TOP HERO SECTION: AGENT MONITOR & TELEMETRY -->
    <section class="flex flex-col gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div class="flex items-center gap-2 font-label-caps text-primary tracking-widest" style="font-size: 10px; color: var(--color-primary);">
            <span class="inline-block w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-primary);"></span>
            SYSTEM TELEMETRY & RUNTIME INTERCEPTOR
          </div>
          <h1 class="font-headline-lg text-on-surface font-extrabold tracking-tight" style="font-size: 24px; font-family: var(--font-headline);">
            DESKTOP AGENT SECURITY & PERMISSION CONTROL
          </h1>
          <p class="font-body-sm text-on-surface-variant" style="font-size: 12.5px; color: var(--color-on-surface-variant);">
            Monitor AI agent runtime behavior, enforce sandboxing policies, and manage immutable file snapshot rollbacks.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 font-code-sm" style="font-size: 11px;">
          <span class="px-2.5 py-1 rounded border border-outline-variant/30" style="background-color: var(--color-surface-high);">
            HOOK: <strong class="text-emerald font-bold" style="color: var(--color-emerald);">eBPF Active</strong>
          </span>
          <span class="px-2.5 py-1 rounded border border-outline-variant/30" style="background-color: var(--color-surface-high);">
            BUFFER: <strong class="text-primary font-bold" style="color: var(--color-primary);">0.14ms</strong>
          </span>
          <button id="agent-sync-audit-btn" class="btn-secondary py-1 px-3" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[15px] text-primary">sync</span>
            <span>SYNC AUDIT</span>
          </button>
        </div>
      </div>

      <!-- 4 Compact Agent Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
        
        <!-- Card 1: ACTIVE SESSION -->
        <div class="tactical-card p-3.5 flex flex-col justify-between" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex items-center justify-between font-label-caps text-outline" style="font-size: 9.5px;">
            <span>ACTIVE SESSION</span>
            <span class="inline-flex items-center gap-1 font-bold text-emerald" style="color: var(--color-emerald);">
              <span class="w-1.5 h-1.5 rounded-full pulse-anim" style="background-color: var(--color-emerald);"></span>
              PROTECTED
            </span>
          </div>
          <div class="my-1">
            <div class="font-headline-md text-on-surface font-bold" style="font-size: 16px;">${agentStats.activeSession}</div>
            <div class="font-body-sm text-on-surface-variant truncate" style="font-size: 11.5px;">Task: ${agentStats.task}</div>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-code-sm text-outline" style="font-size: 10px;">
            <span>${agentStats.elapsed}</span>
            <span class="text-primary font-semibold">PID: ${agentStats.pid}</span>
          </div>
        </div>

        <!-- Card 2: ACTIONS TODAY -->
        <div class="tactical-card p-3.5 flex flex-col justify-between" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex items-center justify-between font-label-caps text-outline" style="font-size: 9.5px;">
            <span>ACTIONS TODAY</span>
            <span class="font-code-sm text-emerald font-semibold">+34 in last hr</span>
          </div>
          <div class="my-1 flex items-baseline gap-2">
            <span class="font-display-lg text-on-surface font-bold" style="font-size: 26px; font-family: var(--font-headline);">${agentStats.actionsToday}</span>
            <span class="font-label-caps text-on-surface-variant">OPS RECORDED</span>
          </div>
          <div class="flex flex-col gap-1 pt-1">
            <div class="w-full h-1.5 rounded-full overflow-hidden flex" style="background-color: var(--color-surface-container);">
              <div class="h-full" style="width: ${agentStats.allowedPercent}%; background-color: var(--color-emerald);"></div>
              <div class="h-full" style="width: ${agentStats.blockedPercent}%; background-color: var(--color-error);"></div>
            </div>
            <div class="flex justify-between font-code-sm text-outline" style="font-size: 9.5px;">
              <span class="text-emerald font-medium">${agentStats.allowedPercent}% allowed</span>
              <span class="text-error font-medium">${agentStats.blockedPercent}% blocked</span>
            </div>
          </div>
        </div>

        <!-- Card 3: BLOCKED ACTIONS -->
        <div class="tactical-card p-3.5 flex flex-col justify-between" style="border: 1px solid rgba(164, 2, 23, 0.45);">
          <div class="flex items-center justify-between font-label-caps text-error" style="font-size: 9.5px; color: var(--color-error);">
            <span class="flex items-center gap-1 font-bold">
              <span class="material-symbols-outlined text-[14px]">gpp_bad</span>
              BLOCKED ACTIONS
            </span>
            <span class="badge-critical" style="font-size: 8.5px;">URGENT</span>
          </div>
          <div class="my-1 flex items-baseline gap-2">
            <span class="font-display-lg text-error font-bold" style="font-size: 26px; font-family: var(--font-headline); color: var(--color-error);">${agentStats.blockedActions}</span>
            <span class="font-code-sm text-outline">INTERCEPTIONS</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-code-sm text-outline" style="font-size: 10px;">
            <span class="text-error font-semibold">${agentStats.autoBlocked} auto-blocked</span>
            <span>${agentStats.manualKill} manual kill</span>
          </div>
        </div>

        <!-- Card 4: VAULT FILES -->
        <div class="tactical-card p-3.5 flex flex-col justify-between" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex items-center justify-between font-label-caps text-outline" style="font-size: 9.5px;">
            <span>VAULT FILES</span>
            <span class="font-code-sm text-primary font-semibold">RECOVERY BUFFER</span>
          </div>
          <div class="my-1 flex items-baseline gap-2">
            <span class="font-display-lg text-primary font-bold" style="font-size: 26px; font-family: var(--font-headline); color: var(--color-primary);">${agentStats.vaultFilesCount}</span>
            <span class="font-code-sm text-outline">IMMUTABLE COPIES</span>
          </div>
          <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-code-sm text-outline" style="font-size: 10px;">
            <span class="text-on-surface-variant font-medium">${agentStats.vaultSizeMB} protected</span>
            <span class="text-emerald flex items-center gap-0.5 font-semibold" style="color: var(--color-emerald);">
              <span class="material-symbols-outlined text-[13px]">history</span>
              Undo ready
            </span>
          </div>
        </div>

      </div>
    </section>

    <!-- 2. CORE HERO COMPONENT: PERMISSION PROMPT DIALOG -->
    <section class="relative rounded-lg overflow-hidden tactical-card" id="permission-dialog-container" style="border: 1px solid rgba(164, 2, 23, 0.5); background-color: var(--color-surface-low);">
      <div class="h-1.5 w-full" style="background: linear-gradient(90deg, var(--color-secondary-container), var(--color-error), var(--color-secondary-container));"></div>
      
      <div class="p-4 flex flex-col gap-3.5">
        <!-- Dialog Header with Countdown Pill -->
        <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded flex items-center justify-center font-bold" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container); box-shadow: 0 0 14px rgba(164, 2, 23, 0.6);">
              <span class="material-symbols-outlined text-[20px] pulse-anim">warning</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-headline-md font-extrabold text-error tracking-wide" style="font-size: 16px; color: var(--color-error);">PERMISSION REQUIRED</span>
                <span class="font-label-caps px-2 py-0.5 rounded font-bold" style="background-color: var(--color-surface-high); color: var(--color-on-surface); font-size: 9.5px;">
                  INTERCEPTION #${currentInterception.id}
                </span>
              </div>
              <span class="font-code-sm text-outline" style="font-size: 11px;">Agent halted at file system intercept boundary. Direct user authorization required.</span>
            </div>
          </div>

          <!-- Countdown Counter -->
          <div class="flex items-center gap-2.5 px-3 py-1.5 rounded border border-outline-variant/30" style="background-color: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.4);">
            <span class="material-symbols-outlined text-error text-[18px] animate-spin" style="color: var(--color-error);">hourglass_top</span>
            <div class="flex flex-col">
              <div class="flex items-center justify-between gap-2 font-code-sm">
                <span class="font-label-caps text-outline" style="font-size: 9px;">CRITICAL TIMEOUT</span>
                <span class="text-error font-bold" id="countdown-text" style="font-size: 11px; color: var(--color-error);">Auto-block in ${countdown}s</span>
              </div>
              <div class="w-32 h-1.5 rounded-full overflow-hidden mt-0.5" style="background-color: var(--color-surface-container);">
                <div id="countdown-bar" class="h-full transition-all duration-1000 ease-linear" style="width: 100%; background-color: var(--color-error);"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Middle Inspection Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          <!-- Left Parameter Specs (7 Cols) -->
          <div class="lg:col-span-7 flex flex-col gap-2">
            <div class="p-3 rounded flex flex-col gap-1.5 font-code-sm border border-outline-variant/30" style="background-color: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.35); font-size: 11px;">
              <div class="grid grid-cols-12 py-0.5 items-center">
                <span class="col-span-3 text-outline font-label-caps" style="font-size: 9.5px;">AI AGENT</span>
                <div class="col-span-9 flex items-center gap-1.5">
                  <span class="text-on-surface font-bold">${currentInterception.agent}</span>
                  <span class="text-outline">(PID: ${currentInterception.pid}, Hook: eBPF Filesystem)</span>
                </div>
              </div>

              <div class="grid grid-cols-12 py-0.5 items-center">
                <span class="col-span-3 text-outline font-label-caps" style="font-size: 9.5px;">ACTION</span>
                <div class="col-span-9 flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded font-bold font-label-caps tracking-wider" style="background-color: var(--color-secondary-container); color: var(--color-on-secondary-container); font-size: 10px;">
                    ${currentInterception.action}
                  </span>
                  <span class="text-on-surface-variant font-medium">${currentInterception.actionDesc}</span>
                </div>
              </div>

              <div class="grid grid-cols-12 py-0.5 items-center">
                <span class="col-span-3 text-outline font-label-caps" style="font-size: 9.5px;">TARGET</span>
                <div class="col-span-9 flex items-center justify-between px-2 py-1 rounded" style="background-color: var(--color-surface-high);">
                  <span class="text-primary font-bold truncate">${currentInterception.target}</span>
                  <button class="p-0.5 text-outline hover:text-on-surface" id="copy-intercept-target-btn" title="Copy Path" style="background: none; border: none; cursor: pointer;">
                    <span class="material-symbols-outlined text-[15px]">content_copy</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-12 py-0.5 items-center">
                <span class="col-span-3 text-outline font-label-caps" style="font-size: 9.5px;">RISK EVAL</span>
                <div class="col-span-9 flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded font-bold font-label-caps" style="background-color: var(--color-primary-container); color: var(--color-on-primary-container); font-size: 10px;">
                    ${currentInterception.riskCategory}
                  </span>
                  <span class="font-bold text-on-surface">${currentInterception.riskScore} <span class="text-outline font-normal">/ 100</span></span>
                  <div class="flex-1 h-1.5 rounded-full overflow-hidden max-w-[100px]" style="background-color: var(--color-surface-container);">
                    <div class="h-full" style="width: ${currentInterception.riskScore}%; background-color: var(--color-primary);"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Risk Assessment Explanations -->
            <div class="p-3 rounded flex flex-col gap-1 border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
              <span class="font-label-caps text-outline tracking-wider flex items-center gap-1" style="font-size: 9.5px;">
                <span class="material-symbols-outlined text-primary text-[14px]">analytics</span>
                HEURISTIC RISK ASSESSMENT
              </span>
              <ul class="font-body-sm text-on-surface flex flex-col gap-1 mt-0.5" style="font-size: 11.5px; list-style: none;">
                ${currentInterception.riskReasons.map(r => `
                  <li class="flex items-center gap-1.5 text-${r.type}">
                    <span class="material-symbols-outlined text-[15px]">${r.icon}</span>
                    <span>${r.text}</span>
                  </li>
                `).join('')}
              </ul>
              <div class="mt-1 pt-1 border-t border-outline-variant/20 flex flex-wrap gap-x-3 gap-y-1 font-code-sm text-outline" style="font-size: 10px;">
                <span>Size: <strong class="text-on-surface">${currentInterception.fileMetadata.size}</strong></span>
                <span>Git: <strong class="text-error">${currentInterception.fileMetadata.git}</strong></span>
                <span>Modified: <strong class="text-on-surface">${currentInterception.fileMetadata.lastModified}</strong></span>
                <span>Scope: <strong class="text-emerald">${currentInterception.fileMetadata.scope}</strong></span>
              </div>
            </div>
          </div>

          <!-- Right Snapshot & AI Intent Column (5 Cols) -->
          <div class="lg:col-span-5 flex flex-col gap-2">
            <!-- Vault Status Box -->
            <div class="p-3 rounded flex flex-col gap-1 border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
              <div class="flex items-center justify-between">
                <span class="font-label-caps text-emerald font-bold flex items-center gap-1" style="color: var(--color-emerald); font-size: 9.5px;">
                  <span class="material-symbols-outlined text-[15px]">check_circle</span>
                  FILE SNAPSHOT STORED
                </span>
                <span class="font-code-sm px-1.5 py-0.2 rounded font-bold" style="background-color: var(--color-surface-high); color: var(--color-emerald); font-size: 9.5px;">
                  READY
                </span>
              </div>
              <p class="font-headline-sm text-on-surface font-bold" style="font-size: 13px;">${currentInterception.vaultBackup.lines} lines backed up into local vault</p>
              <p class="font-body-sm text-on-surface-variant" style="font-size: 11px;">
                Undo available for this session at any time. Sentinel cached an isolated sha256 blob pre-mutation.
              </p>
              <div class="font-code-sm text-outline flex items-center gap-1 mt-0.5" style="font-size: 9.5px;">
                <span>HASH:</span>
                <span class="text-on-surface-variant truncate max-w-[200px]">${currentInterception.vaultBackup.hash}</span>
              </div>
            </div>

            <!-- Intercepted Agent Intent Box -->
            <div class="p-3 rounded flex flex-col gap-1 border border-outline-variant/30" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
              <span class="font-label-caps text-outline flex items-center gap-1" style="font-size: 9.5px;">
                <span class="material-symbols-outlined text-[14px]">smart_toy</span>
                INTERCEPTED AGENT INTENT
              </span>
              <p class="font-body-sm italic text-on-surface" style="font-size: 11.5px; line-height: 16px;">
                ${currentInterception.intent}
              </p>
              <span class="font-code-sm text-primary font-semibold" style="font-size: 10px; color: var(--color-primary);">
                ${currentInterception.ruleTrigger}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-outline-variant/30" style="border-top: 1px solid rgba(63, 72, 80, 0.35);">
          <div class="flex items-center gap-1 text-outline font-code-sm" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[16px]">shield</span>
            <span>Default policy set to BLOCK upon timeout.</span>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button id="prompt-block-btn" class="btn-danger py-2 px-4" style="font-size: 11px;">
              <span class="material-symbols-outlined text-[16px]">block</span>
              <span>BLOCK (ESC)</span>
            </button>
            <button id="prompt-allow-once-btn" class="btn-primary py-2 px-4" style="font-size: 11px;">
              <span class="material-symbols-outlined text-[16px]">check</span>
              <span>ALLOW ONCE</span>
            </button>
            <button id="prompt-allow-session-btn" class="btn-secondary py-2 px-3.5" style="font-size: 11px;">
              <span>ALLOW FOR SESSION</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. WORKFLOW HIGHLIGHT & DAEMON STATUS ROW -->
    <section class="flex flex-col gap-1.5">
      <div class="overflow-x-auto py-1">
        <div class="flex items-center min-w-[780px] justify-between p-2.5 rounded border border-outline-variant/30 font-code-sm" style="background-color: var(--color-surface-lowest); border: 1px solid rgba(63, 72, 80, 0.35); font-size: 11px;">
          <div class="flex items-center gap-1.5 text-on-surface font-semibold">
            <span class="material-symbols-outlined text-primary text-[16px]">robot_2</span>
            <span>AI AGENT</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1.5 text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            <span>REQUESTS ACTION</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1.5 text-primary font-bold">
            <span class="material-symbols-outlined text-[16px]">network_intelligence</span>
            <span>SENTINEL ANALYZES RISK</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1.5 text-error font-bold">
            <span class="material-symbols-outlined text-[16px]">crisis_alert</span>
            <span>PERMISSION PROMPT</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1 text-on-surface font-bold">
            <span class="text-error">BLOCK</span> / <span class="text-emerald">ALLOW</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1.5 text-emerald font-semibold">
            <span class="material-symbols-outlined text-[16px]">inventory_2</span>
            <span>FILE SNAPSHOT STORED</span>
          </div>
          <span class="material-symbols-outlined text-outline text-[14px]">arrow_forward</span>
          <div class="flex items-center gap-1.5 text-primary font-semibold">
            <span class="material-symbols-outlined text-[16px]">settings_backup_restore</span>
            <span>RESTORE / UNDO</span>
          </div>
        </div>
      </div>

      <!-- Daemon Status Strip -->
      <div class="flex flex-col sm:flex-row items-center justify-between p-2.5 rounded border border-outline-variant/30 gap-2 font-code-sm" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35); font-size: 11px;">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div class="flex items-center gap-1.5 font-bold text-emerald" style="color: var(--color-emerald);">
            <span class="w-2 h-2 rounded-full pulse-anim" style="background-color: var(--color-emerald);"></span>
            <span>DAEMON STATUS: ONLINE</span>
          </div>
          <span class="text-outline">Port: <strong class="text-on-surface">8765</strong></span>
          <span class="text-outline">IPC: <strong class="text-on-surface-variant">/var/run/sentinel.sock</strong></span>
          <span class="text-outline">Vault: <strong class="text-primary">ACTIVE</strong></span>
          <span class="text-outline">Protection: <strong class="text-emerald">ENABLED</strong></span>
        </div>
        <button id="restart-daemon-btn" class="btn-secondary py-1 px-3" style="font-size: 10.5px;">
          <span class="material-symbols-outlined text-[14px]">restart_alt</span>
          <span>RESTART DAEMON</span>
        </button>
      </div>
    </section>

    <!-- 4. TWO-COLUMN SPLIT WORKSPACE -->
    <section class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
      
      <!-- LEFT COLUMN: Activity Timeline & Session Rollback (6 cols) -->
      <div class="lg:col-span-6 flex flex-col gap-3">
        
        <!-- Activity Timeline Card -->
        <div class="tactical-card p-3.5 flex flex-col gap-2" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[18px]">pulse_alert</span>
              <h2 class="font-headline-sm font-bold text-on-surface" style="font-size: 14px;">ACTIVITY TIMELINE</h2>
            </div>
            <!-- Filter Pills -->
            <div class="flex flex-wrap items-center gap-1 font-code-sm text-[10px]">
              <button class="px-2 py-0.5 rounded font-bold" style="background-color: var(--color-primary); color: var(--color-on-primary); border: none; cursor: pointer;">ALL</button>
              <button class="px-2 py-0.5 rounded text-error hover:bg-surface-high" style="background-color: var(--color-surface-container); border: none; cursor: pointer;">BLOCKED (18)</button>
              <button class="px-2 py-0.5 rounded text-emerald hover:bg-surface-high" style="background-color: var(--color-surface-container); border: none; cursor: pointer;">ALLOWED (229)</button>
              <button class="px-2 py-0.5 rounded text-primary hover:bg-surface-high" style="background-color: var(--color-surface-container); border: none; cursor: pointer;">VAULT (12)</button>
            </div>
          </div>

          <!-- Feed Items -->
          <div class="flex flex-col gap-2" id="activity-feed-container">
            ${activityFeed.map(item => {
              const isBlock = item.status === 'BLOCK';
              return `
                <div class="p-2.5 rounded flex flex-col gap-1 border border-outline-variant/30 hover:bg-surface-high transition-all" style="background-color: var(--color-surface-container); border: 1px solid rgba(63, 72, 80, 0.35);">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-code-sm text-outline" style="font-size: 10px;">${item.time}</span>
                      <span class="${isBlock ? 'badge-critical' : 'badge-emerald'}" style="font-size: 9.5px;">${item.status}</span>
                      <span class="font-body-sm font-bold text-on-surface" style="font-size: 12px;">${item.agent}</span>
                    </div>
                    <span class="font-code-sm font-bold" style="color: ${isBlock ? 'var(--color-error)' : 'var(--color-emerald)'}; font-size: 10.5px;">
                      ${item.riskLevel}
                    </span>
                  </div>
                  <div class="font-code-sm text-on-surface-variant" style="font-size: 11.5px;">
                    ${item.actionText} <code class="font-bold ${isBlock ? 'text-error' : 'text-primary'}">${item.targetFile}</code>
                  </div>
                  ${item.reason ? `
                    <div class="font-code-sm text-error flex items-center gap-1" style="font-size: 10px;">
                      <span class="material-symbols-outlined text-[13px]">gpp_bad</span>
                      <span>Reason: ${item.reason}</span>
                    </div>
                  ` : ''}
                  ${item.hasVault ? `
                    <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                      <span class="font-code-sm text-emerald flex items-center gap-1" style="font-size: 10px;">
                        <span class="material-symbols-outlined text-[13px]">verified</span>
                        Vault snapshot cached
                      </span>
                      <button class="activity-restore-btn px-2 py-0.5 rounded text-emerald hover:bg-surface-bright font-code-sm" data-target="${item.targetFile}" style="background-color: var(--color-surface-high); border: none; cursor: pointer; font-size: 10px;">
                        Restore
                      </button>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- SESSION ROLLBACK INTERACTION -->
        <div class="tactical-card p-3.5 flex flex-col gap-2" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[18px]">settings_backup_restore</span>
              <h3 class="font-headline-sm font-bold text-on-surface" style="font-size: 13.5px;">SESSION RECOVERY & ROLLBACK</h3>
            </div>
            <span class="badge-normal font-code-sm" style="font-size: 9.5px;">SNAPSHOT: v14.2</span>
          </div>
          <div class="p-2.5 rounded flex flex-col gap-1 border border-outline-variant/30" style="background-color: var(--color-surface-high); border: 1px solid rgba(63, 72, 80, 0.35);">
            <p class="font-body-sm text-on-surface" style="font-size: 12px;">
              Undo all <strong class="text-primary">14 file operations</strong> executed by <strong class="text-on-surface">Claude Code</strong> in this active session.
            </p>
            <p class="font-code-sm text-outline" style="font-size: 10.5px;">
              Target directory tree will be atomically restored to clean working state prior to Agent PID 84920 invocation.
            </p>
          </div>
          <button id="undo-session-trigger-btn" class="btn-primary w-full py-2.5" style="font-size: 11px;">
            <span class="material-symbols-outlined text-[16px]">settings_backup_restore</span>
            <span>↺ UNDO ENTIRE SESSION</span>
          </button>

          <!-- Undo Progress Container (Hidden until clicked) -->
          <div id="undo-progress-box" class="hidden p-3 rounded flex-col gap-1.5 border border-primary/40" style="background-color: var(--color-surface-container); border: 1px solid var(--color-primary);">
            <div class="flex items-center justify-between font-code-sm" style="font-size: 11px;">
              <span class="text-primary font-bold flex items-center gap-1" id="undo-progress-label">
                <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                Restoring session: 9 / 14 files restored
              </span>
              <span class="text-on-surface font-bold" id="undo-progress-percent">64%</span>
            </div>
            <div class="w-full h-2 rounded-full overflow-hidden" style="background-color: var(--color-surface-highest);">
              <div id="undo-progress-bar-inner" class="h-full transition-all duration-300" style="width: 64%; background-color: var(--color-primary);"></div>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: Tabbed Manager (Vault, Agent Registry, Policy Manager) (6 cols) -->
      <div class="lg:col-span-6 flex flex-col gap-2">
        
        <!-- Tab Navigation -->
        <div class="flex items-center gap-1 p-1 rounded border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
          <button class="agent-mgr-tab active flex-1 py-1.5 px-2 rounded font-code-sm font-bold flex items-center justify-center gap-1.5" data-tab="vault" style="cursor: pointer; border: none; font-size: 11px;">
            <span class="material-symbols-outlined text-[15px]">lock</span>
            <span>SECURE VAULT</span>
          </button>
          <button class="agent-mgr-tab flex-1 py-1.5 px-2 rounded font-code-sm font-medium flex items-center justify-center gap-1.5" data-tab="registry" style="cursor: pointer; border: none; font-size: 11px;">
            <span class="material-symbols-outlined text-[15px]">smart_toy</span>
            <span>AGENT REGISTRY</span>
          </button>
          <button class="agent-mgr-tab flex-1 py-1.5 px-2 rounded font-code-sm font-medium flex items-center justify-center gap-1.5" data-tab="policies" style="cursor: pointer; border: none; font-size: 11px;">
            <span class="material-symbols-outlined text-[15px]">policy</span>
            <span>POLICY MANAGER</span>
          </button>
        </div>

        <!-- Tab Content Container -->
        <div class="tactical-card p-3.5 flex flex-col gap-3" id="agent-tab-content" style="border: 1px solid rgba(63, 72, 80, 0.45);">
          <!-- Dynamic Content rendered below -->
        </div>

      </div>

    </section>
  `;

  // Countdown timer logic
  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdown = 24;
    const textEl = container.querySelector('#countdown-text');
    const barEl = container.querySelector('#countdown-bar');

    countdownTimer = setInterval(() => {
      countdown--;
      if (textEl) textEl.textContent = `Auto-block in ${countdown}s`;
      if (barEl) barEl.style.width = `${(countdown / 24) * 100}%`;

      if (countdown <= 0) {
        clearInterval(countdownTimer);
        toast.show('Action auto-blocked due to timeout safety policy.', 'error');
        if (textEl) textEl.textContent = 'BLOCKED (TIMEOUT)';
      }
    }, 1000);
  }
  startCountdown();

  // Tab Rendering
  function renderTabContent() {
    const contentBox = container.querySelector('#agent-tab-content');
    if (!contentBox) return;

    if (currentTab === 'vault') {
      contentBox.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
          <div>
            <h4 class="font-headline-sm font-bold text-on-surface" style="font-size: 13.5px;">SECURE VAULT STORAGE</h4>
            <span class="font-code-sm text-outline" style="font-size: 10.5px;">12 files protected | 18.4 MB (AES-256 encrypted at rest)</span>
          </div>
          <span class="badge-emerald font-code-sm">IMMUTABLE</span>
        </div>

        <div class="overflow-x-auto w-full">
          <table class="w-full text-left font-code-sm" style="font-size: 11px; border-collapse: collapse;">
            <thead>
              <tr class="font-label-caps text-outline border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35); font-size: 9.5px;">
                <th class="py-2 px-2.5">FILE</th>
                <th class="py-2 px-2.5">PATH</th>
                <th class="py-2 px-2.5">BACKUP</th>
                <th class="py-2 px-2.5">STATUS</th>
                <th class="py-2 px-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/20">
              ${vaultFiles.map(file => `
                <tr class="hover:bg-surface-high transition-colors">
                  <td class="py-2 px-2.5 font-bold text-on-surface flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px] text-primary">description</span>
                    ${file.name}
                  </td>
                  <td class="py-2 px-2.5 text-outline truncate max-w-[100px]">${file.path}</td>
                  <td class="py-2 px-2.5 text-on-surface-variant">${file.backupTime}</td>
                  <td class="py-2 px-2.5">
                    <span class="text-emerald font-bold font-code-sm">${file.status}</span>
                  </td>
                  <td class="py-2 px-2.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button class="vault-restore-btn px-2 py-0.5 rounded font-bold text-emerald hover:bg-surface-bright" data-file="${file.name}" style="background-color: var(--color-surface-high); border: none; cursor: pointer; font-size: 10px;">
                        RESTORE
                      </button>
                      <button class="vault-download-btn p-1 rounded hover:bg-surface-bright text-outline hover:text-on-surface" data-file="${file.name}" style="background: none; border: none; cursor: pointer;">
                        <span class="material-symbols-outlined text-[14px]">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      contentBox.querySelectorAll('.vault-restore-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const fn = btn.getAttribute('data-file');
          toast.show(`Restored ${fn} from vault snapshot.`, 'success');
        });
      });

      contentBox.querySelectorAll('.vault-download-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const fn = btn.getAttribute('data-file');
          toast.show(`Downloading isolated sha256 archive for ${fn}...`, 'success');
        });
      });

    } else if (currentTab === 'registry') {
      contentBox.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
          <div>
            <h4 class="font-headline-sm font-bold text-on-surface" style="font-size: 13.5px;">REGISTERED AI AGENTS</h4>
            <span class="font-code-sm text-outline" style="font-size: 10.5px;">3 AI Agent runtimes monitored via eBPF sockets</span>
          </div>
          <button class="btn-primary py-1 px-2.5 font-label-caps" id="add-agent-btn" style="font-size: 10px;">
            + REGISTER AGENT
          </button>
        </div>

        <div class="flex flex-col gap-2">
          ${agentRegistry.map(agent => `
            <div class="p-3 rounded flex flex-col gap-1.5 border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-headline-sm font-bold text-on-surface" style="font-size: 13px;">${agent.name}</span>
                  <span class="font-code-sm text-outline">(PID: ${agent.pid})</span>
                </div>
                <span class="badge-emerald font-code-sm">${agent.status}</span>
              </div>
              <div class="flex flex-wrap items-center justify-between font-code-sm text-outline" style="font-size: 10.5px;">
                <span>Runtime: <strong class="text-on-surface">${agent.runtime}</strong></span>
                <span>Mode: <strong class="text-primary">${agent.permissions}</strong></span>
                <span class="text-emerald">${agent.allowedActions} allowed / ${agent.blockedActions} blocked</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      const addBtn = contentBox.querySelector('#add-agent-btn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          toast.show('Agent registration wizard initialized.', 'success');
        });
      }

    } else if (currentTab === 'policies') {
      contentBox.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-outline-variant/30" style="border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
          <div>
            <h4 class="font-headline-sm font-bold text-on-surface" style="font-size: 13.5px;">SECURITY POLICIES & ENFORCEMENT</h4>
            <span class="font-code-sm text-outline" style="font-size: 10.5px;">4 automated runtime protection rules</span>
          </div>
          <span class="badge-normal font-code-sm">KERNEL MODE</span>
        </div>

        <div class="flex flex-col gap-2">
          ${securityPolicies.map(pol => `
            <div class="p-3 rounded flex flex-col gap-1 border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-primary font-code-sm" style="font-size: 11px;">${pol.id}</span>
                  <span class="font-bold text-on-surface" style="font-size: 12px;">${pol.name}</span>
                </div>
                <span class="${pol.severity === 'Critical' ? 'badge-critical' : 'badge-high'}" style="font-size: 9.5px;">${pol.severity}</span>
              </div>
              <p class="font-body-sm text-on-surface-variant" style="font-size: 11px;">${pol.description}</p>
              <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 font-code-sm" style="font-size: 10px;">
                <span class="text-outline">Action: <strong class="text-primary">${pol.action}</strong></span>
                <label class="flex items-center gap-1 text-emerald cursor-pointer">
                  <input type="checkbox" checked class="accent-primary" />
                  <span>Enforced</span>
                </label>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  function updateTabs() {
    container.querySelectorAll('.agent-mgr-tab').forEach(tab => {
      const tabName = tab.getAttribute('data-tab');
      if (tabName === currentTab) {
        tab.style.backgroundColor = 'var(--color-primary-container)';
        tab.style.color = 'var(--color-on-primary-container)';
        tab.style.fontWeight = '700';
      } else {
        tab.style.backgroundColor = 'transparent';
        tab.style.color = 'var(--color-on-surface-variant)';
        tab.style.fontWeight = '500';
      }
    });
    renderTabContent();
  }

  container.querySelectorAll('.agent-mgr-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.getAttribute('data-tab');
      updateTabs();
    });
  });

  updateTabs();

  // Dialog action buttons
  const blockBtn = container.querySelector('#prompt-block-btn');
  const allowOnceBtn = container.querySelector('#prompt-allow-once-btn');
  const allowSessionBtn = container.querySelector('#prompt-allow-session-btn');
  const copyTargetBtn = container.querySelector('#copy-intercept-target-btn');

  if (copyTargetBtn) {
    copyTargetBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(currentInterception.target);
      toast.show('Path copied to clipboard.', 'success');
    });
  }

  if (blockBtn) {
    blockBtn.addEventListener('click', () => {
      if (countdownTimer) clearInterval(countdownTimer);
      const textEl = container.querySelector('#countdown-text');
      if (textEl) textEl.textContent = 'BLOCKED BY USER';
      toast.show('Interception #84920-A BLOCKED. Agent file deletion aborted.', 'error');
    });
  }

  if (allowOnceBtn) {
    allowOnceBtn.addEventListener('click', () => {
      if (countdownTimer) clearInterval(countdownTimer);
      const textEl = container.querySelector('#countdown-text');
      if (textEl) textEl.textContent = 'AUTHORIZED (ONCE)';
      toast.show('Action authorized once. Vault snapshot locked.', 'success');
    });
  }

  if (allowSessionBtn) {
    allowSessionBtn.addEventListener('click', () => {
      if (countdownTimer) clearInterval(countdownTimer);
      const textEl = container.querySelector('#countdown-text');
      if (textEl) textEl.textContent = 'AUTHORIZED (SESSION)';
      toast.show('Allowed for Claude Code session PID 84920.', 'success');
    });
  }

  // Session Undo button simulation
  const undoBtn = container.querySelector('#undo-session-trigger-btn');
  const undoBox = container.querySelector('#undo-progress-box');
  const undoProgressLabel = container.querySelector('#undo-progress-label');
  const undoProgressPercent = container.querySelector('#undo-progress-percent');
  const undoProgressBar = container.querySelector('#undo-progress-bar-inner');

  if (undoBtn && undoBox) {
    undoBtn.addEventListener('click', () => {
      undoBox.style.display = 'flex';
      let progress = 10;
      undoBtn.disabled = true;
      undoBtn.style.opacity = '0.6';

      const interval = setInterval(() => {
        progress += 18;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          if (undoProgressLabel) undoProgressLabel.innerHTML = '<span class="material-symbols-outlined text-[16px] text-emerald">check_circle</span> 14/14 Files Restored from Vault!';
          if (undoProgressPercent) undoProgressPercent.textContent = '100%';
          if (undoProgressBar) {
            undoProgressBar.style.width = '100%';
            undoProgressBar.style.backgroundColor = 'var(--color-emerald)';
          }
          toast.show('All 14 session mutations rolled back cleanly.', 'success');
          setTimeout(() => {
            undoBtn.disabled = false;
            undoBtn.style.opacity = '1';
          }, 3000);
        } else {
          if (undoProgressLabel) undoProgressLabel.innerHTML = `<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Restoring session: ${Math.round((progress/100)*14)} / 14 files restored`;
          if (undoProgressPercent) undoProgressPercent.textContent = `${progress}%`;
          if (undoProgressBar) undoProgressBar.style.width = `${progress}%`;
        }
      }, 300);
    });
  }

  const restartBtn = container.querySelector('#restart-daemon-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      toast.show('Sentinel Daemon restarted. IPC socket active on port 8765.', 'success');
    });
  }

  return container;
}
