// verify_contrast.cjs
// Automated WCAG 2.1 contrast ratio verification for Daylight Light and Midnight Dark themes

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function parseColor(str, bgRgb = [255, 255, 255]) {
  if (str.startsWith('#')) return hexToRgb(str);
  if (str.startsWith('rgba')) {
    const m = str.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (m) {
      const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]), a = parseFloat(m[4]);
      // Alpha blend onto bgRgb
      return [
        Math.round(r * a + bgRgb[0] * (1 - a)),
        Math.round(g * a + bgRgb[1] * (1 - a)),
        Math.round(b * a + bgRgb[2] * (1 - a)),
      ];
    }
  }
  throw new Error('Unknown color format: ' + str);
}

function sRgbToLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(rgb) {
  const [r, g, b] = rgb.map(sRgbToLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrast(fg, bg, surfaceRgb) {
  const fgRgb = parseColor(fg, surfaceRgb);
  const bgRgb = parseColor(bg, surfaceRgb);
  const L1 = getLuminance(fgRgb);
  const L2 = getLuminance(bgRgb);
  const brightest = Math.max(L1, L2);
  const darkest = Math.min(L1, L2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const lightTokens = {
  canvas: '#F4F5F7',
  surface: '#FFFFFF',
  well: '#EEF1F5',
  ink1: '#0F1218',
  ink2: '#3F4856',
  ink3: '#5F6877',
  brand: '#1570E0',
  brandInk: '#0B4FA8',
  brandSoft: '#E6F1FD',
  safeInk: '#167A3E',
  safeSoft: '#E7F6EC',
  cautionInk: '#8A5300',
  cautionSoft: '#FFF3DC',
  highInk: '#C2410C',
  highSoft: '#FFEDE5',
  criticalInk: '#B42318',
  criticalSoft: '#FDECEE',
  aiInk: '#5B4BB7',
  aiSoft: '#F0EDFC',
  lime: '#D4F53C',
};

const darkTokens = {
  canvas: '#090B10',
  surface: '#0E121A',
  well: '#131823',
  ink1: '#F8FAFC',
  ink2: '#94A3B8',
  ink3: '#8B9BB4',
  brand: '#38BDF8',
  brandInk: '#38BDF8',
  brandSoft: 'rgba(56, 189, 248, 0.15)',
  safeInk: '#4ADE80',
  safeSoft: 'rgba(34, 197, 94, 0.15)',
  cautionInk: '#FBBF24',
  cautionSoft: 'rgba(245, 158, 11, 0.15)',
  highInk: '#FB923C',
  highSoft: 'rgba(249, 115, 22, 0.15)',
  criticalInk: '#F87171',
  criticalSoft: 'rgba(239, 68, 68, 0.15)',
  aiInk: '#A5B4FC',
  aiSoft: 'rgba(129, 140, 248, 0.15)',
  lime: '#A3E635',
};

function runAudit() {
  console.log('=== AUTOMATED WCAG AA CONTRAST AUDIT ===\n');

  const pairsLight = [
    { name: 'Headings / Primary Text (ink-1 on surface)', fg: lightTokens.ink1, bg: lightTokens.surface, req: 4.5 },
    { name: 'Secondary Text (ink-2 on surface)', fg: lightTokens.ink2, bg: lightTokens.surface, req: 4.5 },
    { name: 'Muted / Caption Text (ink-3 on surface)', fg: lightTokens.ink3, bg: lightTokens.surface, req: 4.5 },
    { name: 'Headings / Primary Text (ink-1 on well)', fg: lightTokens.ink1, bg: lightTokens.well, req: 4.5 },
    { name: 'Secondary Text (ink-2 on well)', fg: lightTokens.ink2, bg: lightTokens.well, req: 4.5 },
    { name: 'Muted / Caption Text (ink-3 on well)', fg: lightTokens.ink3, bg: lightTokens.well, req: 4.5 },
    { name: 'Primary Action / Brand Link (brand on surface)', fg: lightTokens.brand, bg: lightTokens.surface, req: 4.5 },
    { name: 'Brand Chip (brand-ink on brand-soft)', fg: lightTokens.brandInk, bg: lightTokens.brandSoft, req: 4.5 },
    { name: 'Safe Status Chip (safe-ink on safe-soft)', fg: lightTokens.safeInk, bg: lightTokens.safeSoft, req: 4.5 },
    { name: 'Caution Status Chip (caution-ink on caution-soft)', fg: lightTokens.cautionInk, bg: lightTokens.cautionSoft, req: 4.5 },
    { name: 'High Risk Status Chip (high-ink on high-soft)', fg: lightTokens.highInk, bg: lightTokens.highSoft, req: 4.5 },
    { name: 'Critical Status Chip (critical-ink on critical-soft)', fg: lightTokens.criticalInk, bg: lightTokens.criticalSoft, req: 4.5 },
    { name: 'AI Badge Chip (ai-ink on ai-soft)', fg: lightTokens.aiInk, bg: lightTokens.aiSoft, req: 4.5 },
    { name: 'Lime Badge Label (ink-1 on lime)', fg: lightTokens.ink1, bg: lightTokens.lime, req: 4.5 },
    { name: 'Sky Gradient Header Copy (#071E33 on Sky #8FDDF7)', fg: '#071E33', bg: '#8FDDF7', req: 4.5 },
    { name: 'Sky Gradient Header Bold Title (#071E33 on Sky-Mid #5BB8F0)', fg: '#071E33', bg: '#5BB8F0', req: 3.0 },
    { name: 'Sky Gradient Pill (#071E33 on rgba(255,255,255,0.9))', fg: '#071E33', bg: '#FFFFFF', req: 4.5 },
    { name: 'Button Primary Action (#FFFFFF on brand #1570E0)', fg: '#FFFFFF', bg: lightTokens.brand, req: 4.5 },
  ];

  console.log('--- DAYLIGHT LIGHT THEME ---');
  let passLight = 0, failLight = 0;
  for (const p of pairsLight) {
    const ratio = getContrast(p.fg, p.bg, [255, 255, 255]);
    const pass = ratio >= p.req;
    if (pass) passLight++; else failLight++;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${p.name}: ${ratio.toFixed(2)}:1 (req: ${p.req}:1)`);
  }

  const pairsDark = [
    { name: 'Headings / Primary Text (ink-1 on surface)', fg: darkTokens.ink1, bg: darkTokens.surface, req: 4.5 },
    { name: 'Secondary Text (ink-2 on surface)', fg: darkTokens.ink2, bg: darkTokens.surface, req: 4.5 },
    { name: 'Muted / Caption Text (ink-3 on surface)', fg: darkTokens.ink3, bg: darkTokens.surface, req: 4.5 },
    { name: 'Headings / Primary Text (ink-1 on well)', fg: darkTokens.ink1, bg: darkTokens.well, req: 4.5 },
    { name: 'Secondary Text (ink-2 on well)', fg: darkTokens.ink2, bg: darkTokens.well, req: 4.5 },
    { name: 'Muted / Caption Text (ink-3 on well)', fg: darkTokens.ink3, bg: darkTokens.well, req: 4.5 },
    { name: 'Primary Action / Brand Link (brand on surface)', fg: darkTokens.brand, bg: darkTokens.surface, req: 4.5 },
    { name: 'Brand Chip (brand-ink on brand-soft)', fg: darkTokens.brandInk, bg: darkTokens.brandSoft, req: 4.5 },
    { name: 'Safe Status Chip (safe-ink on safe-soft)', fg: darkTokens.safeInk, bg: darkTokens.safeSoft, req: 4.5 },
    { name: 'Caution Status Chip (caution-ink on caution-soft)', fg: darkTokens.cautionInk, bg: darkTokens.cautionSoft, req: 4.5 },
    { name: 'High Risk Status Chip (high-ink on high-soft)', fg: darkTokens.highInk, bg: darkTokens.highSoft, req: 4.5 },
    { name: 'Critical Status Chip (critical-ink on critical-soft)', fg: darkTokens.criticalInk, bg: darkTokens.criticalSoft, req: 4.5 },
    { name: 'AI Badge Chip (ai-ink on ai-soft)', fg: darkTokens.aiInk, bg: darkTokens.aiSoft, req: 4.5 },
    { name: 'Lime Badge Label (#090B10 on lime #A3E635)', fg: '#090B10', bg: darkTokens.lime, req: 4.5 },
    { name: 'Sky Gradient Title (#FFFFFF on Dark Sky Gradient #0369A1)', fg: '#FFFFFF', bg: '#0369A1', req: 3.0 },
    { name: 'Button Primary Action (#090B10 on brand #38BDF8)', fg: '#090B10', bg: darkTokens.brand, req: 4.5 },
  ];

  console.log('\n--- MIDNIGHT DARK THEME ---');
  let passDark = 0, failDark = 0;
  for (const p of pairsDark) {
    const ratio = getContrast(p.fg, p.bg, [14, 18, 26]);
    const pass = ratio >= p.req;
    if (pass) passDark++; else failDark++;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${p.name}: ${ratio.toFixed(2)}:1 (req: ${p.req}:1)`);
  }

  console.log(`\nLight Theme: ${passLight} Passed, ${failLight} Failed`);
  console.log(`Dark Theme: ${passDark} Passed, ${failDark} Failed`);
  if (failLight > 0 || failDark > 0) {
    process.exit(1);
  }
}

runAudit();
