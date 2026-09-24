export function createGlobalThreatMap() {
  const container = document.createElement('div');
  container.className = 'flex flex-col rounded overflow-hidden tactical-card';
  container.style.border = '1px solid rgba(63, 72, 80, 0.45)';

  container.innerHTML = `
    <!-- Header Strip -->
    <div class="px-4 py-2.5 flex items-center justify-between border-b border-outline-variant/30" style="background-color: var(--color-surface-low); border-bottom: 1px solid rgba(63, 72, 80, 0.35);">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-[18px]" style="color: var(--color-primary);">public</span>
        <span class="font-headline-md text-on-surface uppercase tracking-wide font-bold" style="font-size: 14px;">GLOBAL THREAT INGRESS HUD</span>
      </div>
      <span class="font-code-sm text-outline" style="font-size: 10.5px;">
        GEO-TARGETED VECTORS // 4 REGIONS
      </span>
    </div>

    <div class="p-4 flex flex-col flex-1 justify-between gap-2.5" style="background-color: var(--color-surface-lowest);">
      <!-- Vector Map HUD Canvas Container -->
      <div class="relative w-full h-64 rounded overflow-hidden flex items-center justify-center border border-outline-variant/30" style="background-color: var(--color-surface-low); border: 1px solid rgba(63, 72, 80, 0.35);">
        
        <!-- Dark Vector World Map Silhouette + Ingress Beams -->
        <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 400">
          <!-- Latitude/Longitude Coordinates Grid -->
          <g stroke="#3f4850" stroke-opacity="0.25" stroke-width="1">
            <line x1="0" x2="800" y1="100" y2="100" stroke-dasharray="2,4"></line>
            <line x1="0" x2="800" y1="200" y2="200" stroke-dasharray="2,4"></line>
            <line x1="0" x2="800" y1="300" y2="300" stroke-dasharray="2,4"></line>
            <line x1="200" x2="200" y1="0" y2="400" stroke-dasharray="2,4"></line>
            <line x1="400" x2="400" y1="0" y2="400" stroke-dasharray="2,4"></line>
            <line x1="600" x2="600" y1="0" y2="400" stroke-dasharray="2,4"></line>
          </g>

          <!-- Stylized World Continents Shapes -->
          <g fill="#262a34" fill-opacity="0.6">
            <!-- North America -->
            <path d="M 120,60 L 250,70 L 290,120 L 240,160 L 190,165 L 140,230 L 110,180 L 100,100 Z"></path>
            <!-- South America -->
            <path d="M 230,220 L 280,240 L 310,290 L 270,370 L 230,350 L 210,260 Z"></path>
            <!-- Europe & North Africa -->
            <path d="M 390,70 L 480,60 L 510,110 L 460,160 L 400,150 L 370,110 Z"></path>
            <!-- Africa -->
            <path d="M 400,170 L 480,180 L 510,240 L 460,340 L 410,320 L 380,220 Z"></path>
            <!-- Asia & India -->
            <path d="M 500,50 L 710,60 L 740,140 L 680,180 L 590,210 L 530,140 Z"></path>
            <!-- Indo-Pacific & Australia -->
            <path d="M 640,250 L 720,260 L 740,320 L 660,340 L 620,290 Z"></path>
          </g>

          <!-- Attack Vector Trajectory Arc Rays -->
          <!-- Ray 1: East Europe -> New Delhi / US East -->
          <path d="M 480,95 Q 350,50 240,130" fill="none" stroke="#ffb4ab" stroke-dasharray="6,4" stroke-width="2" opacity="0.85"></path>
          
          <!-- Ray 2: Indo-Pacific -> US West / Frankfurt -->
          <path d="M 670,140 Q 420,10 180,120" fill="none" stroke="#ffb4ab" stroke-dasharray="4,4" stroke-width="1.5" opacity="0.75"></path>
          
          <!-- Ray 3: Monitored Node Mesh -->
          <path d="M 240,130 Q 330,140 430,120" fill="none" stroke="#93ccff" stroke-dasharray="2,2" stroke-width="1.5" opacity="0.6"></path>

          <!-- Threat Origin Nodes (Red) -->
          <g fill="#ffb4ab">
            <!-- Eastern Europe Threat -->
            <circle cx="480" cy="95" r="5"></circle>
            <circle cx="480" cy="95" r="12" fill="none" stroke="#ffb4ab" stroke-width="1.5" opacity="0.6" class="pulse-anim"></circle>
            <!-- East Asia Threat Origin -->
            <circle cx="670" cy="140" r="5"></circle>
            <circle cx="670" cy="140" r="10" fill="none" stroke="#ffb4ab" stroke-width="1.5" opacity="0.5" class="pulse-anim"></circle>
            <!-- South American C2 Proxy -->
            <circle cx="280" cy="270" r="4"></circle>
          </g>

          <!-- Defense Infrastructure Nodes (Blue) -->
          <g fill="#93ccff">
            <!-- New Delhi DC-01 -->
            <circle cx="560" cy="165" r="5.5"></circle>
            <circle cx="560" cy="165" r="14" fill="none" stroke="#93ccff" stroke-width="1.5" opacity="0.7" class="pulse-anim"></circle>
            <text x="572" y="169" fill="#93ccff" font-family="JetBrains Mono" font-size="10" font-weight="bold">NODE::DELHI (HQ)</text>
            
            <!-- US East DC-01 -->
            <circle cx="240" cy="130" r="5"></circle>
            <circle cx="240" cy="130" r="11" fill="none" stroke="#93ccff" stroke-width="1" opacity="0.5"></circle>
            <!-- London Hub -->
            <circle cx="410" cy="100" r="4"></circle>
            <!-- Tokyo Sovereign Edge -->
            <circle cx="700" cy="130" r="4"></circle>
          </g>

          <!-- Sovereign Authenticated Data Centers (Green/Amber) -->
          <g fill="#ffb95f">
            <circle cx="440" cy="200" r="4"></circle>
            <circle cx="170" cy="140" r="4"></circle>
          </g>
        </svg>

        <!-- Real-time HUD Map Overlay Callout -->
        <div class="absolute bottom-2 left-2 right-2 p-2 px-3 rounded flex flex-wrap items-center justify-between gap-2 border border-outline-variant/30" style="background: rgba(10, 14, 23, 0.9); backdrop-filter: blur(4px); border: 1px solid rgba(63, 72, 80, 0.4);">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-error text-[18px] pulse-anim" style="color: var(--color-error);">radar</span>
            <span class="font-code-sm text-on-surface" style="font-size: 11px;">
              CURRENT TARGET: <span class="text-error font-bold" style="color: var(--color-error);">POWER SCADA LINKS // INTERCEPTED</span>
            </span>
          </div>
          <div class="font-code-sm text-primary font-semibold" style="font-size: 10.5px; color: var(--color-primary);">
            VECTOR: AS-4819 PROTOCOL ABUSE
          </div>
        </div>
      </div>

      <!-- Nodes Status Legend -->
      <div class="flex flex-wrap items-center justify-between font-code-sm text-on-surface-variant pt-1" style="font-size: 10.5px;">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background-color: var(--color-error);"></span> Malicious Ingress</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background-color: var(--color-primary);"></span> Monitored Gateway</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full" style="background-color: var(--color-tertiary);"></span> Authenticated Core</span>
        </div>
        <span class="text-outline">GEOLOC SENSOR ARRAY: ONLINE</span>
      </div>
    </div>
  `;

  return container;
}
