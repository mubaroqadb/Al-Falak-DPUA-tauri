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
import './components/ModernCriteriaSelector.js';
import './components/LocationSelector.js';
import './components/LanguageSwitcher.js';


// Theme Management
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    this.applyTheme(this.currentTheme);
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
            <input type="radio" name="export-format" value="json">
            <span class="export-option-label">JSON (Data)</span>
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
      case 'json':
        this.exportJSON(filename);
        break;
      case 'pdf':
        this.exportPDF(filename);
        break;
    }

    this.closeModal(document.querySelector('.export-modal'));
    this.showToast(`Data exported as ${format.toUpperCase()}`, 'success');
  }

  exportCSV(filename) {
    const csv = this.convertToCSV(this.currentData);
    this.downloadFile(csv, `${filename}.csv`, 'text/csv');
  }

  exportJSON(filename) {
    const json = JSON.stringify(this.currentData, null, 2);
    this.downloadFile(json, `${filename}.json`, 'application/json');
  }

  exportPDF(filename) {
    // Create a simple HTML-based PDF
    const content = this.generatePDFContent(this.currentData);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
  }

  convertToCSV(data) {
    if (!data) return '';

    let csv = 'Criteria,Status,Moon Altitude,Sun Altitude,Elongation,Age of Moon,Visibility\n';

    if (data.criteria_results) {
      Object.entries(data.criteria_results).forEach(([criteria, result]) => {
        const moonAlt = result.moon_altitude?.toFixed(2) || 'N/A';
        const sunAlt = result.sun_altitude?.toFixed(2) || 'N/A';
        const elongation = result.elongation?.toFixed(2) || 'N/A';
        const age = result.age_of_moon?.toFixed(2) || 'N/A';
        const visibility = result.is_visible ? 'Visible' : 'Not Visible';
        
        csv += `"${criteria}","${visibility}","${moonAlt}","${sunAlt}","${elongation}","${age}"\n`;
      });
    }

    return csv;
  }

  generatePDFContent(data) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hisab Hilal Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #dee2e6; padding: 12px; text-align: left; }
    th { background: #f8f9fa; font-weight: bold; }
    .visible { color: #27ae60; font-weight: bold; }
    .not-visible { color: #e74c3c; font-weight: bold; }
    .marginal { color: #f39c12; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Hisab Hilal Calculation Report</h1>
  <p><strong>Date:</strong> ${data.ephemeris?.date || 'N/A'}</p>
  <p><strong>Location:</strong> ${data.location?.latitude?.toFixed(4)}°, ${data.location?.longitude?.toFixed(4)}°</p>
  
  <h2>Visibility Criteria Results</h2>
  <table>
    <thead>
      <tr>
        <th>Criteria</th>
        <th>Status</th>
        <th>Moon Altitude</th>
        <th>Sun Altitude</th>
        <th>Elongation</th>
        <th>Age of Moon</th>
      </tr>
    </thead>
    <tbody>
      ${this.generatePDFTableRows(data)}
    </tbody>
  </table>
  
  <script>
    window.print();
  </script>
</body>
</html>
    `;
  }

  generatePDFTableRows(data) {
    if (!data.criteria_results) return '';

    return Object.entries(data.criteria_results).map(([criteria, result]) => {
      const statusClass = result.is_visible ? 'visible' : (result.is_marginal ? 'marginal' : 'not-visible');
      const statusText = result.is_visible ? 'Visible' : (result.is_marginal ? 'Marginal' : 'Not Visible');
      
      return `
        <tr>
          <td>${criteria}</td>
          <td class="${statusClass}">${statusText}</td>
          <td>${result.moon_altitude?.toFixed(2) || 'N/A'}°</td>
          <td>${result.sun_altitude?.toFixed(2) || 'N/A'}°</td>
          <td>${result.elongation?.toFixed(2) || 'N/A'}°</td>
          <td>${result.age_of_moon?.toFixed(2) || 'N/A'} hours</td>
        </tr>
      `;
    }).join('');
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
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
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
  console.log('🚀 Initializing Enhanced Hisab Hilal Application...');

  // Initialize i18n first
  await i18n.init();
  console.log(`🌐 i18n initialized (language: ${i18n.getLanguage()})`);

  // Listen for language changes
  window.addEventListener('language-changed', (event) => {
    console.log(`🌐 Language changed event received: ${event.detail.language}`);
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
    console.log('✅ HilalApp initialized successfully');
  }).catch(error => {
    console.error('❌ Failed to initialize HilalApp:', error);
  });
  
  // Make app available globally for hero button
  window.app = app;
  
  // Make export manager available globally
  window.exportManager = exportManager;

  // Listen for calculation results to update export data
  document.addEventListener('calculation-complete', (event) => {
    exportManager.setData(event.detail);
    console.log('📊 Export data updated');
  });

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
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. Reset all tabs to inactive state
      tabs.forEach(t => {
        t.classList.remove('tab-active', '!bg-primary', '!text-primary-content', 'shadow-sm', 'font-extrabold');
        t.classList.add('font-bold'); // Default weight
      });

      // 2. Apply active state to clicked tab
      tab.classList.add('tab-active', '!bg-primary', '!text-primary-content', 'shadow-sm', 'font-extrabold');
      tab.classList.remove('font-bold');
      
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
      console.log('🧮 Hero Calculate clicked');
      
      // Show loading
      heroCalculateBtn.classList.add('btn-disabled');
      heroLoading.classList.remove('hidden');
      
      try {
        // Trigger calculation (reuse existing app logic)
        if (window.app) {
          await window.app.updateVisibilityZones();
          await window.app.updateCalculations();
        }
      } finally {
        // Hide loading
        heroCalculateBtn.classList.remove('btn-disabled');
        heroLoading.classList.add('hidden');
      }
    });
  }

  console.log('✅ Application initialized successfully');
});
