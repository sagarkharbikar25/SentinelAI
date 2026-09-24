import { initialStats, defaultThreatResult, initialIncidents } from './data/threatsData.js';
import { createSidebar } from './components/Navigation/Sidebar.js';
import { createHeader } from './components/Navigation/Header.js';
import { createHeroOverview } from './components/Dashboard/HeroOverview.js';
import { createMetricGrid } from './components/Dashboard/MetricGrid.js';
import { createScannerModule } from './components/Dashboard/ScannerModule.js';
import { createThreatAnalysisResult } from './components/Dashboard/ThreatAnalysisResult.js';
import { createTelemetryChart } from './components/Dashboard/TelemetryChart.js';
import { createGlobalThreatMap } from './components/Dashboard/GlobalThreatMap.js';
import { createIncidentAuditTable } from './components/Dashboard/IncidentAuditTable.js';
import { createAgentSecurityView } from './components/AgentSecurity/AgentSecurityView.js';
import { createThreatIntelView } from './components/ThreatIntel/ThreatIntelView.js';
import { createReportsView } from './components/Reports/ReportsView.js';
import { createIncidentModal } from './components/Common/IncidentModal.js';
import { createToastManager } from './components/Common/Toast.js';

class SentinalApp {
  constructor() {
    this.currentRoute = 'dashboard';
    this.stats = { ...initialStats };
    this.threatResult = { ...defaultThreatResult };
    this.incidents = [...initialIncidents];
    this.toast = createToastManager();

    this.initApp();
  }

  initApp() {
    const root = document.getElementById('app');
    root.className = 'app-container';
    root.innerHTML = '';

    // Modal Instance
    this.modal = createIncidentModal(
      () => {},
      (incident) => {
        this.toast.show(`Applied emergency airgap isolation for ${incident.id}. Threat contained.`, 'error');
        incident.status = 'Isolated';
        this.renderCurrentView();
      }
    );
    document.body.appendChild(this.modal.element);

    // Sidebar
    this.sidebar = createSidebar(this.currentRoute, (route) => {
      this.navigate(route);
    });
    root.appendChild(this.sidebar);

    // Main Container
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';

    // Header
    this.header = createHeader(
      this.getRouteTitle(this.currentRoute),
      (query) => this.handleSearch(query),
      () => this.toast.show('3 Active Telemetry Interceptions in queue.', 'info')
    );
    mainContent.appendChild(this.header);

    // Page View Wrapper
    this.pageWrapper = document.createElement('main');
    this.pageWrapper.className = 'page-wrapper';
    mainContent.appendChild(this.pageWrapper);

    root.appendChild(mainContent);

    this.renderCurrentView();
  }

  getRouteTitle(route) {
    switch (route) {
      case 'dashboard': return 'SOC TELEMETRY // OVERVIEW';
      case 'agent-security': return 'AGENT INTERCEPTOR & PERMISSION VAULT';
      case 'threat-detection': return 'HEURISTIC SCANNER & SANDBOX';
      case 'threat-map': return 'GLOBAL THREAT INGRESS HUD';
      case 'threat-intel': return 'NATIONAL THREAT INTEL VAULT';
      case 'reports': return 'OFFICIAL INTELLIGENCE REPORTS';
      default: return 'SOC TELEMETRY';
    }
  }

  navigate(route) {
    this.currentRoute = route;

    // Update Header breadcrumb
    const breadcrumbEl = document.getElementById('header-breadcrumb');
    if (breadcrumbEl) {
      breadcrumbEl.textContent = this.getRouteTitle(route);
    }

    // Rebuild sidebar with active link
    const oldSidebar = document.querySelector('aside');
    if (oldSidebar) {
      const newSidebar = createSidebar(this.currentRoute, (r) => this.navigate(r));
      oldSidebar.replaceWith(newSidebar);
      this.sidebar = newSidebar;
    }

    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleSearch(query) {
    if (!query) return;
    const term = query.toLowerCase();
    const found = this.incidents.find(i => 
      i.id.toLowerCase().includes(term) ||
      i.type.toLowerCase().includes(term) ||
      i.sourceDetail.toLowerCase().includes(term)
    );
    if (found) {
      this.toast.show(`Located threat match: ${found.id} (${found.type})`, 'info');
    }
  }

  renderCurrentView() {
    this.pageWrapper.innerHTML = '';

    if (this.currentRoute === 'dashboard' || this.currentRoute === 'threat-detection') {
      // 1. Hero Overview
      const hero = createHeroOverview(() => {
        this.toast.show('Applied tactical filter to MIL-SPEC telemetry ingress feeds.', 'info');
      });
      this.pageWrapper.appendChild(hero);

      // 2. 4 Tactical Metric Cards
      const metrics = createMetricGrid(this.stats);
      this.pageWrapper.appendChild(metrics);

      // 3. Scanner Suite (5 Cols) + Threat Analysis Result (7 Cols)
      const scanSection = document.createElement('section');
      scanSection.className = 'grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch';

      const scannerCol = document.createElement('div');
      scannerCol.className = 'lg:col-span-5 flex flex-col';
      const scanner = createScannerModule((target, mode) => {
        this.runSimulatedScan(target, mode);
      });
      scannerCol.appendChild(scanner);

      const resultCol = document.createElement('div');
      resultCol.className = 'lg:col-span-7 flex flex-col';
      const resultPanel = createThreatAnalysisResult(
        this.threatResult,
        () => {
          this.toast.show('Threat Block rule pushed to edge firewalls & BGP routers.', 'error');
          this.stats.blocked += 1;
          this.stats.critical = Math.max(0, this.stats.critical - 1);
          this.renderCurrentView();
        },
        () => {
          this.toast.show(`Deep heuristic sandbox inspection initiated on ${this.threatResult.id}.`, 'info');
        },
        () => {
          this.toast.show(`Compiling official SOC Incident Debrief for ${this.threatResult.id}...`, 'success');
        }
      );
      resultCol.appendChild(resultPanel);

      scanSection.appendChild(scannerCol);
      scanSection.appendChild(resultCol);
      this.pageWrapper.appendChild(scanSection);

      // 4. Telemetry Graph (6 Cols) + Global Threat Map (6 Cols)
      const visualSection = document.createElement('section');
      visualSection.className = 'grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch';

      const chartCol = document.createElement('div');
      chartCol.className = 'lg:col-span-6 flex flex-col';
      chartCol.appendChild(createTelemetryChart());

      const mapCol = document.createElement('div');
      mapCol.className = 'lg:col-span-6 flex flex-col';
      mapCol.appendChild(createGlobalThreatMap());

      visualSection.appendChild(chartCol);
      visualSection.appendChild(mapCol);
      this.pageWrapper.appendChild(visualSection);

      // 5. Recent Threats Table
      const table = createIncidentAuditTable(
        this.incidents,
        (incident) => this.modal.show(incident),
        () => this.exportCsv()
      );
      this.pageWrapper.appendChild(table);

    } else if (this.currentRoute === 'agent-security') {
      const agentSecView = createAgentSecurityView(this.toast);
      this.pageWrapper.appendChild(agentSecView);

    } else if (this.currentRoute === 'threat-map') {
      const hero = createHeroOverview();
      this.pageWrapper.appendChild(hero);
      const mapCard = createGlobalThreatMap();
      this.pageWrapper.appendChild(mapCard);
      const chartCard = createTelemetryChart();
      this.pageWrapper.appendChild(chartCard);

    } else if (this.currentRoute === 'threat-intel') {
      const intelView = createThreatIntelView(this.toast);
      this.pageWrapper.appendChild(intelView);

    } else if (this.currentRoute === 'reports') {
      const reportsView = createReportsView(this.toast);
      this.pageWrapper.appendChild(reportsView);
    }
  }

  runSimulatedScan(target, mode) {
    this.toast.show(`AI Neural Sandbox scanned ${mode.toUpperCase()} target: ${target.substring(0, 32)}...`, 'success');
    
    // Dynamically customize result for variety
    if (mode === 'ip') {
      this.threatResult = {
        ...defaultThreatResult,
        id: 'INC-90142',
        score: 94,
        classification: 'SUSPICIOUS BGP INGRESS',
        subVector: 'AS40201 Port Scan',
        verdict: 'Target IP identified in malicious ASN registry. Emitted 1,400 syn-packets attempting unauthorized SCADA bridge access.'
      };
    } else if (mode === 'file') {
      this.threatResult = {
        ...defaultThreatResult,
        id: 'INC-91024',
        score: 89,
        classification: 'POLYMORPHIC MALWARE',
        subVector: 'Obfuscated Stage-2 Shellcode',
        verdict: 'Target binary payload contains heuristic signature matches for memory injection and token extraction tools.'
      };
    } else {
      this.threatResult = { ...defaultThreatResult };
    }

    this.renderCurrentView();
  }

  exportCsv() {
    let csv = 'Threat ID,Type,Source Type,Source Detail,Risk Score,Severity,Status,Time\n';
    this.incidents.forEach(i => {
      csv += `"${i.id}","${i.type}","${i.sourceType}","${i.sourceDetail}","${i.riskScore}","${i.severity}","${i.status}","${i.time}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinal_threat_audit_${Date.now()}.csv`;
    a.click();
    this.toast.show('Exported incident audit log CSV.', 'success');
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new SentinalApp();
});
