// Main Application Entry Point
// Hisab Hilal Calculator - Enhanced Frontend

import { HilalApp } from './app.js';
import { i18n } from './services/i18n.js';
import './components/NavBar.js';
import './components/TauriStatusBanner.js';
import './components/MapVisualization.js';
import './components/CriteriaPanel.js';
import './components/ResultsDisplay.js';
import './components/CriteriaResultsDisplay.js';
import './components/ValidationPanel.js';
import './components/DetailedEphemerisDisplay.js';
import './components/PrayerTimesDisplay.js';
import './components/CalculateButton.js';
import './components/CalculateButton.js';
import './components/ModernCriteriaSelector.js';
import './components/MoonPhaseVisualizer.js';
import './components/LocationSelector.js';
import './components/LanguageSwitcher.js';
import './components/ThemeToggle.js';
import './components/AboutModal.js';


// Theme Management
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
    
    // Listen for theme-changed event from ThemeToggle component
    window.addEventListener('theme-changed', (e) => {
      this.currentTheme = e.detail.theme;
      this.applyTheme(this.currentTheme);
    });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// Export Manager
class ExportManager {
  constructor() {
    this.currentData = null;
  this.setupEventListeners();
  }

  setupEventListeners() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.showExportModal());
    }
  }

  showExportModal() {
    if (!this.currentData) {
      this.showToast('No data to export. Please calculate first.', 'warning');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
      <div class="export-modal-content">
        <div class="export-modal-header">
          <h2>Export Data</h2>
          <button class="export-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="export-options">
          <label class="export-option">
            <input type="radio" name="export-format" value="csv" checked>
            <span class="export-option-label">CSV (Spreadsheet)</span>
          </label>
          <label class="export-option">
            <input type="radio" name="export-format" value="txt">
            <span class="export-option-label">Text File (TXT)</span>
          </label>
          <label class="export-option">
            <input type="radio" name="export-format" value="pdf">
            <span class="export-option-label">PDF (Report)</span>
          </label>
        </div>
        <div class="export-modal-actions">
          <button class="btn btn-primary" id="confirm-export">Export</button>
          <button class="btn btn-secondary" id="cancel-export">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    document.getElementById('confirm-export').addEventListener('click', () => this.exportData());
    document.getElementById('cancel-export').addEventListener('click', () => this.closeModal(modal));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal);
      }
    });
  }

  closeModal(modal) {
    modal.style.animation = 'toastFadeOut 0.3s ease-out';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }

  exportData() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const filename = `hisab-hilal-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        this.exportCSV(filename);
        break;
      case 'txt':
        this.exportTXT(filename);
        break;
      case 'pdf':
        this.exportPDF(filename);
        break;
    }

    this.closeModal(document.querySelector('.export-modal'));
  }

  async exportCSV(filename) {
    const csv = this.convertToCSV(this.currentData);
    
    if (window.__TAURI__) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        
        const filePath = await save({
          filters: [{ name: 'CSV', extensions: ['csv'] }],
          defaultPath: `${filename}.csv`
        });

        if (filePath) {
          await writeTextFile(filePath, csv);
          this.showToast('CSV exported via Tauri.', 'success');
        }
      } catch (error) {
        console.error('Tauri CSV export failed:', error);
        this.downloadFile(csv, `${filename}.csv`, 'text/csv');
      }
    } else {
      this.downloadFile(csv, `${filename}.csv`, 'text/csv');
      this.showToast('CSV downloaded via browser.', 'success');
    }
  }

  async exportTXT(filename) {
    const txt = this.convertToTXT(this.currentData);
    
    if (window.__TAURI__) {
      try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeTextFile } = await import('@tauri-apps/plugin-fs');
        
        const filePath = await save({
          filters: [{ name: 'Text Files', extensions: ['txt'] }],
          defaultPath: `${filename}.txt`
        });

        if (filePath) {
          await writeTextFile(filePath, txt);
          this.showToast('TXT exported via Tauri.', 'success');
        }
      } catch (error) {
        console.error('Tauri TXT export failed:', error);
        this.downloadFile(txt, `${filename}.txt`, 'text/plain');
      }
    } else {
      this.downloadFile(txt, `${filename}.txt`, 'text/plain');
      this.showToast('TXT downloaded via browser.', 'success');
    }
  }

  exportPDF(filename) {
    // Create a simple HTML-based PDF
    const content = this.generatePDFContent(this.currentData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      this.showToast('Print dialog opened.', 'info');
    } else {
      this.showToast('Popup blocked. Please allow popups to print.', 'error');
    }
  }

  convertToCSV(data) {
    if (!data) return '';

    let csv = '"HISAB HILAL CALCULATION REPORT"\n';
    csv += `"Date","${data.observation_date?.day}/${data.observation_date?.month}/${data.observation_date?.year}"\n`;
    csv += `"Location","${data.location?.latitude?.toFixed(6)}","${data.location?.longitude?.toFixed(6)}"\n`;
    csv += `"Timezone","GMT${data.location?.timezone >= 0 ? '+' : ''}${data.location?.timezone}"\n\n`;

    csv += '"VISIBILITY CRITERIA RESULTS"\n';
    csv += '"Criteria","Status","Method Type","Technical Details"\n';

    if (data.criteria_results) {
      Object.entries(data.criteria_results).forEach(([key, result]) => {
        const visibility = result.is_visible ? 'VISIBLE' : 'NOT VISIBLE';
        csv += `"${result.criteria_name}","${visibility}","${result.visibility_type}","${(result.additional_info || '').replace(/"/g, '""')}"\n`;
      });
    }

    csv += '\n"DETAILED EPHEMERIS DATA"\n';
    csv += '"Parameter","Value"\n';

    if (data.ephemeris) {
      Object.entries(data.ephemeris).forEach(([key, value]) => {
        if (typeof value !== 'object' && value !== null) {
           csv += `"${this.formatLabel(key)}","${value}"\n`;
        }
      });
    }

    return csv;
  }

  convertToTXT(data) {
    if (!data) return '';

    let txt = '==================================================\n';
    txt += '         AL FALAK DPUA - HISAB HILAL REPORT        \n';
    txt += '==================================================\n\n';
    
    txt += `Observation Date : ${data.observation_date?.day}/${data.observation_date?.month}/${data.observation_date?.year}\n`;
    txt += `Location         : ${data.location?.latitude?.toFixed(6)}, ${data.location?.longitude?.toFixed(6)}\n`;
    txt += `Elevation        : ${data.location?.elevation}m\n`;
    txt += `Timezone         : GMT${data.location?.timezone >= 0 ? '+' : ''}${data.location?.timezone}\n`;
    txt += `Generated at     : ${new Date().toLocaleString()}\n\n`;

    txt += '--- VISIBILITY CRITERIA RESULTS ---\n';
    txt += ''.padEnd(50, '-') + '\n';
    if (data.criteria_results) {
      Object.entries(data.criteria_results).forEach(([key, result]) => {
        const visibility = result.is_visible ? '[YES]' : '[NO ]';
        txt += `${visibility} ${result.criteria_name.padEnd(25)} | ${result.visibility_type}\n`;
        if (result.additional_info) {
          txt += `      Info: ${result.additional_info}\n`;
        }
      });
    }
    txt += '\n';

    txt += '--- DETAILED EPHEMERIS DATA ---\n';
    txt += ''.padEnd(50, '-') + '\n';
    if (data.ephemeris) {
      Object.entries(data.ephemeris).forEach(([key, value]) => {
        if (typeof value !== 'object' && value !== null) {
           txt += `${this.formatLabel(key).padEnd(30)}: ${value}\n`;
        }
      });
    }

    txt += '\n==================================================\n';
    txt += '      © 2026 Al Falak DPUA - Hisab Hilal          \n';
    txt += '==================================================\n';

    return txt;
  }

  generatePDFContent(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hisab Hilal Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .meta { margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
    th, td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; color: #475569; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .visible { color: #16a34a; font-weight: bold; }
    .not-visible { color: #dc2626; font-weight: bold; }
    .ephemeris-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-family: monospace; }
    .ephemeris-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 2px 0; }
  </style>
</head>
<body>
  <h1>Hisab Hilal Calculation Report</h1>
  
  <div class="meta">
    <p><strong>Observation Date:</strong> ${data.observation_date?.day} / ${data.observation_date?.month} / ${data.observation_date?.year}</p>
    <p><strong>Location:</strong> ${data.location?.latitude?.toFixed(4)}°, ${data.location?.longitude?.toFixed(4)}° (Elev: ${data.location?.elevation}m)</p>
    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
  </div>
  
  <h2>Visibility Criteria Results</h2>
  <table>
    <thead>
      <tr>
        <th>Criteria</th>
        <th>Status</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${this.generatePDFCriteriaRows(data)}
    </tbody>
  </table>

  <h2>Detailed Ephemeris</h2>
  <table>
    <thead>
        <tr>
            <th>Parameter</th>
            <th>Value</th>
        </tr>
    </thead>
    <tbody>
        ${this.generatePDFEphemerisRows(data)}
    </tbody>
  </table>
  
  <script>
    window.print();
  </script>
</body>
</html>
    `;
  }

  generatePDFCriteriaRows(data) {
    if (!data.criteria_results) return '';

    return Object.entries(data.criteria_results).map(([criteria, result]) => {
      const statusClass = result.is_visible ? 'visible' : 'not-visible';
      const statusText = result.is_visible ? 'VISIBLE' : 'NOT VISIBLE';
      
      return `
        <tr>
          <td>${criteria}</td>
          <td class="${statusClass}">${statusText}</td>
          <td>${result.additional_info || 'N/A'}</td>
        </tr>
      `;
    }).join('');
  }

  generatePDFEphemerisRows(data) {
      if (!data.ephemeris) return '';
      
      return Object.entries(data.ephemeris)
        .filter(([_, value]) => typeof value !== 'object' && value !== null)
        .map(([key, value]) => `
            <tr>
                <td>${this.formatLabel(key)}</td>
                <td style="font-family: monospace;">${value}</td>
            </tr>
        `).join('');
  }

  formatLabel(key) {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1') // Add space before camelCase text if any
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter
  }

  formatValue(val) {
      return (val !== undefined && val !== null && typeof val === 'number') ? val.toFixed(4) : (val || 'N/A');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconHtml = {
      'success': '<svg class="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'error': '<svg class="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
      'warning': '<svg class="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
      'info': '<svg class="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${iconHtml[type] || iconHtml.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  setData(data) {
    this.currentData = data;
  }
}

// Tab Manager
class TabManager {
  constructor() {
    this.init();
  }

  init() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    // Remove active class from all buttons and contents
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    // Add active class to selected button and content
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    
    if (activeButton) {
      activeButton.classList.add('active');
    }
    if (activeContent) {
      activeContent.classList.add('active');
    }
  }
}

// Map Controls Manager
class MapControlsManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const zoomInBtn = document.getElementById('map-zoom-in');
    const zoomOutBtn = document.getElementById('map-zoom-out');
    const resetBtn = document.getElementById('map-reset');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomIn());
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetView());
    }
  }

  zoomIn() {
    const map = window.mapInstance;
    if (map) {
      map.zoomIn();
    }
  }

  zoomOut() {
    const map = window.mapInstance;
    if (map) {
      map.zoomOut();
    }
  }

  resetView() {
    const map = window.mapInstance;
    if (map) {
      map.setView([-6.2, 106.816666], 6);
    }
  }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Enhanced Hisab Hilal Application...');

  // Initialize i18n first
  await i18n.init();
  console.log(`i18n initialized (language: ${i18n.getLanguage()})`);

  // Listen for language changes
  window.addEventListener('language-changed', (event) => {
    console.log(`Language changed event received: ${event.detail.language}`);
  });

  // Initialize managers
  const themeManager = new ThemeManager();
  const exportManager = new ExportManager();
  const tabManager = new TabManager();
  const mapControlsManager = new MapControlsManager();

  // Initialize main app
  const app = new HilalApp();
  
  // CRITICAL: Initialize the app to attach event listeners
  app.init().then(() => {
    console.log('HilalApp initialized successfully');
  }).catch(error => {
    console.error('Failed to initialize HilalApp:', error);
  });
  
  // Make app available globally for hero button
  window.app = app;
  
  // Make export manager available globally
  window.exportManager = exportManager;

  // Listen for calculation results to update export data
  document.addEventListener('calculation-complete', (event) => {
    exportManager.setData(event.detail);
    console.log('Export data updated');
  });

  // Listen for export requests from components
  document.addEventListener('export-click', () => {
    console.log('Export event received');
    exportManager.showExportModal();
  });

  document.addEventListener('print-click', () => {
    console.log('Print event received');
    const filename = `hisab-hilal-${new Date().toISOString().split('T')[0]}`;
    exportManager.exportPDF(filename);
  });

  // Handle About Page trigger
  const aboutBtn = document.getElementById('about-nav-btn');
  const aboutModal = document.querySelector('about-modal');
  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      aboutModal.open();
    });
  }

  // Map toggle functionality
  const mapToggleBtn = document.getElementById('map-toggle');
  const bottomRow = document.querySelector('.bottom-row');
  const mapToggleText = document.getElementById('map-toggle-text');
  const mapToggleIcon = document.getElementById('map-toggle-icon');
  
  if (mapToggleBtn && bottomRow) {
    mapToggleBtn.addEventListener('click', () => {
      bottomRow.classList.toggle('collapsed');
      const isCollapsed = bottomRow.classList.contains('collapsed');
      
      mapToggleText.textContent = isCollapsed ? 'Show Map' : 'Hide Map';
      mapToggleIcon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Initialize ARIA states
  tabs.forEach(tab => {
    const tabId = tab.dataset.tab;
    tab.setAttribute('aria-controls', `tab-${tabId}`);
    tab.setAttribute('aria-selected', tab.classList.contains('tab-active') ? 'true' : 'false');
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. Reset all tabs to inactive state
      tabs.forEach(t => {
        t.classList.remove('tab-active', '!bg-primary', '!text-primary-content', 'shadow-sm', 'font-extrabold');
        t.classList.add('font-bold'); // Default weight
        t.setAttribute('aria-selected', 'false');
      });

      // 2. Apply active state to clicked tab
      tab.classList.add('tab-active', '!bg-primary', '!text-primary-content', 'shadow-sm', 'font-extrabold');
      tab.classList.remove('font-bold');
      tab.setAttribute('aria-selected', 'true');
      
      // 3. Toggle content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });
      
      const tabName = tab.dataset.tab;
      const targetContent = document.getElementById(`tab-${tabName}`);
      if (targetContent) {
        targetContent.classList.add('active');
        targetContent.classList.remove('hidden');
        
        // 4. Handle map rendering when tab becomes visible
        if (tabName === 'map') {
          const mapComp = document.querySelector('map-visualization');
          if (mapComp) {
            setTimeout(() => {
              mapComp.invalidateSize();
            }, 150);
          }
        }
      }
    });
  });

  // Hero Calculate Button
  const heroCalculateBtn = document.getElementById('hero-calculate-btn');
  const heroLoading = document.getElementById('hero-loading');
  
  if (heroCalculateBtn) {
    heroCalculateBtn.addEventListener('click', async () => {
      console.log('Hero Calculate clicked');
      
      // Show loading
      heroCalculateBtn.classList.add('btn-disabled');
      heroLoading.classList.remove('hidden');
      
      try {
        // Show skeleton loader
        const resultsDisplay = document.querySelector('results-display');
        if (resultsDisplay && typeof resultsDisplay.showSkeleton === 'function') {
          resultsDisplay.showSkeleton();
        }

        // Trigger calculation (reuse existing app logic)
        if (window.app) {
          await window.app.updateVisibilityZones();
          await window.app.updateCalculations();
          
          // Trigger rolling numbers animation
          const stats = [
            { id: 'stat-altitude', suffix: '°' },
            { id: 'stat-elongation', suffix: '°' },
            { id: 'stat-age', suffix: 'h' }
          ];

          stats.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (el) {
              const finalValue = parseFloat(el.innerText);
              if (!isNaN(finalValue)) {
                animateValue(el, 0, finalValue, 1500, stat.suffix);
              }
            }
          });
        }
      } finally {
        // Hide loading
        heroCalculateBtn.classList.remove('btn-disabled');
        heroLoading.classList.add('hidden');
      }
    });
  }

  // Rolling Number Animation Utility
  function animateValue(obj, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic function for smooth roll
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const current = progress * (end - start) + start;
      obj.innerHTML = current.toFixed(2) + suffix;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerHTML = end.toFixed(2) + suffix;
      }
    };
    window.requestAnimationFrame(step);
  }

  console.log('Application initialized successfully');
});
