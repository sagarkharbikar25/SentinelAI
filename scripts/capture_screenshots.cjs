const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = "C:\\Users\\asus\\.gemini\\antigravity\\brain\\9875b6ec-76bf-4bf0-bc24-1efd4c9b79b5";
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function waitUrl(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Timeout waiting for ${url}`));
        }
      });
    }, 500);
  });
}

const CHROME_PROFILE = path.join(process.env.TEMP, "chrome-scr-profile");

function takeScreenshot(url, outputPath, width = 1920, height = 1080, budget = 4000) {
  console.log(`Capturing ${url} (${width}x${height}) -> ${path.basename(outputPath)}`);
  const args = [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir="${CHROME_PROFILE}"`,
    `--window-size=${width},${height}`,
    `--screenshot="${outputPath}"`,
    '--hide-scrollbars',
    `--virtual-time-budget=${budget}`,
    `"${url}"`
  ];
  execSync(`"${CHROME}" ${args.join(' ')}`, { stdio: 'ignore' });
  console.log(`Saved ${path.basename(outputPath)} (${fs.statSync(outputPath).size} bytes)`);
}

async function warmup(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log("=== STEP 1: Starting Next.js Production Server on port 3000 ===");
  const nextBin = path.resolve(__dirname, '../frontend/node_modules/next/dist/bin/next');
  const nextApp = spawn(process.execPath, [nextBin, 'start', '-p', '3000', '-H', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '../frontend'),
    stdio: 'inherit'
  });

  try {
    await waitUrl('http://127.0.0.1:3000/', 25000);
    console.log("Next.js server is ready at http://127.0.0.1:3000/");

    // Pre-warm routes
    console.log("Pre-warming routes...");
    await warmup('http://127.0.0.1:3000/');
    await warmup('http://127.0.0.1:3000/vault');
    await warmup('http://127.0.0.1:3000/audit-logs');
    await warmup('http://127.0.0.1:3000/lab');
    await new Promise(r => setTimeout(r, 1000));

    // 1. CAPTURE OFFLINE (Daemon is NOT running)
    console.log("\n=== STEP 2: Capturing LIGHT THEME - OFFLINE ===");
    takeScreenshot('http://127.0.0.1:3000/?theme=light', path.join(SCREENSHOT_DIR, 'home_light_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/vault?theme=light', path.join(SCREENSHOT_DIR, 'vault_light_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/audit-logs?theme=light', path.join(SCREENSHOT_DIR, 'audit_light_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/lab?theme=light', path.join(SCREENSHOT_DIR, 'lab_light_offline.png'));

    console.log("\n=== STEP 3: Capturing DARK THEME - OFFLINE ===");
    takeScreenshot('http://127.0.0.1:3000/?theme=dark', path.join(SCREENSHOT_DIR, 'home_dark_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/vault?theme=dark', path.join(SCREENSHOT_DIR, 'vault_dark_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/audit-logs?theme=dark', path.join(SCREENSHOT_DIR, 'audit_dark_offline.png'));
    takeScreenshot('http://127.0.0.1:3000/lab?theme=dark', path.join(SCREENSHOT_DIR, 'lab_dark_offline.png'));

    // 2. START DAEMON
    console.log("\n=== STEP 4: Starting SentinelAI Python Daemon on port 8765 ===");
    let pythonExe = process.env.LOCALAPPDATA + "\\Programs\\Python\\Python311\\python.exe";
    if (!fs.existsSync(pythonExe)) pythonExe = 'python';

    const daemonProc = spawn(pythonExe, ['-m', 'sentinel.main'], {
      cwd: path.resolve(__dirname, '../daemon'),
      stdio: 'ignore'
    });

    try {
      console.log("Waiting for daemon on http://127.0.0.1:8765/daemon/status ...");
      await waitUrl('http://127.0.0.1:8765/daemon/status', 20000);
      console.log("Daemon is ONLINE!");

      // Wait 4s so frontend DaemonProvider polls /health and updates context to online
      await new Promise(r => setTimeout(r, 4500));

      console.log("\n=== STEP 5: Capturing LIGHT THEME - ONLINE ===");
      takeScreenshot('http://127.0.0.1:3000/?theme=light', path.join(SCREENSHOT_DIR, 'home_light_online.png'), 1920, 1080, 5000);
      takeScreenshot('http://127.0.0.1:3000/vault?theme=light', path.join(SCREENSHOT_DIR, 'vault_light_online.png'), 1920, 1080, 4000);
      takeScreenshot('http://127.0.0.1:3000/audit-logs?theme=light', path.join(SCREENSHOT_DIR, 'audit_light_online.png'), 1920, 1080, 4000);
      takeScreenshot('http://127.0.0.1:3000/lab?theme=light', path.join(SCREENSHOT_DIR, 'lab_light_online.png'), 1920, 1080, 4000);

      console.log("\n=== STEP 6: Capturing DARK THEME - ONLINE ===");
      takeScreenshot('http://127.0.0.1:3000/?theme=dark', path.join(SCREENSHOT_DIR, 'home_dark_online.png'), 1920, 1080, 5000);
      takeScreenshot('http://127.0.0.1:3000/vault?theme=dark', path.join(SCREENSHOT_DIR, 'vault_dark_online.png'), 1920, 1080, 4000);
      takeScreenshot('http://127.0.0.1:3000/audit-logs?theme=dark', path.join(SCREENSHOT_DIR, 'audit_dark_online.png'), 1920, 1080, 4000);
      takeScreenshot('http://127.0.0.1:3000/lab?theme=dark', path.join(SCREENSHOT_DIR, 'lab_dark_online.png'), 1920, 1080, 4000);

    } finally {
      console.log("Stopping Daemon...");
      try { daemonProc.kill('SIGKILL'); } catch (e) {}
      try { execSync('taskkill /F /IM python.exe /T', { stdio: 'ignore' }); } catch (e) {}
    }

  } finally {
    console.log("Stopping Next.js Server...");
    try { nextApp.kill('SIGKILL'); } catch (e) {}
    try { execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq next*"', { stdio: 'ignore' }); } catch (e) {}
  }

  console.log("\n=== All 16 screenshots captured successfully! ===");
}

run().catch(err => {
  console.error("Error during screenshot capture:", err);
  process.exit(1);
});
