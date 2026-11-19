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

function waitUrl(url, timeoutMs = 15000) {
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

function takeScreenshot(url, outputPath, width = 1920, height = 1080, budget = 3500) {
  console.log(`Capturing ${url} (${width}x${height}, budget: ${budget}ms) -> ${outputPath}`);
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
  console.log(`Saved ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
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
  console.log("=== STEP 1: Start Next.js Server on port 3000 ===");
  const nextApp = spawn('npx.cmd', ['next', 'start', '-p', '3000', '-H', '127.0.0.1'], {
    cwd: path.resolve(__dirname, '../frontend'),
    stdio: 'ignore',
    shell: true
  });

  try {
    await waitUrl('http://127.0.0.1:3000/', 25000);
    console.log("Next.js server is ready at http://127.0.0.1:3000/");

    // Pre-warm routes so server has everything compiled and cached
    console.log("Pre-warming routes...");
    await warmup('http://127.0.0.1:3000/');
    await warmup('http://127.0.0.1:3000/vault');
    await warmup('http://127.0.0.1:3000/audit-logs');
    await warmup('http://127.0.0.1:3000/lab');
    await new Promise(r => setTimeout(r, 1000));

    // 1. OFFLINE SCREENSHOTS (Daemon not running)
    console.log("\n=== STEP 2: Capturing OFFLINE state ===");
    takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOT_DIR, 'home_offline_1920.png'), 1920, 1080);
    takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOT_DIR, 'home_offline_1366.png'), 1366, 768);
    takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOT_DIR, 'home_offline_1280.png'), 1280, 720);
    takeScreenshot('http://127.0.0.1:3000/vault', path.join(SCREENSHOT_DIR, 'vault_offline_1920.png'), 1920, 1080);
    takeScreenshot('http://127.0.0.1:3000/audit-logs', path.join(SCREENSHOT_DIR, 'audit_offline_1920.png'), 1920, 1080);
    takeScreenshot('http://127.0.0.1:3000/lab', path.join(SCREENSHOT_DIR, 'lab_offline_1920.png'), 1920, 1080);

    // 2. START DAEMON
    console.log("\n=== STEP 3: Starting SentinelAI Python Daemon on port 8765 ===");
    const pythonExe = process.env.LOCALAPPDATA + "\\Programs\\Python\\Python311\\python.exe";
    const daemonProc = spawn(pythonExe, ['-m', 'sentinel.main'], {
      cwd: path.resolve(__dirname, '../daemon'),
      stdio: 'ignore',
      shell: true
    });

    try {
      console.log("Waiting for daemon on http://127.0.0.1:8765/daemon/status ...");
      await waitUrl('http://127.0.0.1:8765/daemon/status', 20000);
      console.log("Daemon is ONLINE!");

      // Wait 4s so frontend DaemonProvider polls and updates context
      await new Promise(r => setTimeout(r, 4500));

      console.log("\n=== STEP 4: Capturing ONLINE state ===");
      takeScreenshot('http://127.0.0.1:3000/', path.join(SCREENSHOT_DIR, 'home_online_1920.png'), 1920, 1080, 6000);
      takeScreenshot('http://127.0.0.1:3000/vault', path.join(SCREENSHOT_DIR, 'vault_online_1920.png'), 1920, 1080, 5000);
      takeScreenshot('http://127.0.0.1:3000/audit-logs', path.join(SCREENSHOT_DIR, 'audit_online_1920.png'), 1920, 1080, 5000);
      takeScreenshot('http://127.0.0.1:3000/lab', path.join(SCREENSHOT_DIR, 'lab_online_1920.png'), 1920, 1080, 5000);

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

  console.log("\n=== Finished all screenshots successfully! ===");
}

run().catch(err => {
  console.error("Error during execution:", err);
  process.exit(1);
});
