// Criteria Results Display Component
// Shows visibility results for all hilal visibility criteria

export class CriteriaResultsDisplay extends HTMLElement {
  constructor() {
    super();
    this.criteriaResults = null;
    this.locationData = null;
    this.observationDate = null;
  }

  connectedCallback() {
    try {
      this.render();
    } catch (error) {
      console.error('❌ Error rendering CriteriaResultsDisplay:', error);
      this.innerHTML = `
        <div class="criteria-results-display">
          <div class="error-state">
            <p>⚠️ Failed to load component</p>
            <p>${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  render() {
    this.innerHTML = `
      <div class="criteria-results-display">
        <h3>📊 Visibility Criteria Analysis</h3>

        <div id="criteria-content" class="criteria-content">
          <div class="no-results">
            <p>🧮 Perform a calculation to see criteria results</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
          <button id="export-criteria" class="btn btn-outline btn-sm btn-info gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            CSV
          </button>
          <button id="export-json" class="btn btn-outline btn-sm btn-secondary gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 18V6h16v12H4zm2-2h2v2H6v-2zm0-4h2v2H6v-2zm0-4h2v2H6V8zm4 8h8v2h-8v-2zm0-4h8v2h-8v-2zm0-4h8v2h-8V8z"/></svg>
            JSON
          </button>
          <button id="print-criteria" class="btn btn-outline btn-sm btn-ghost gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            Print
          </button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const exportCsvBtn = this.querySelector('#export-criteria');
    const exportJsonBtn = this.querySelector('#export-json');
    const printBtn = this.querySelector('#print-criteria');

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportCSV());
    }

    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => this.exportJSON());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => this.printResults());
    }
  }

  updateResults(result) {
    try {
      // Validate input
      if (!result) {
        console.warn('⚠️ No result provided to CriteriaResultsDisplay');
        this.renderNoResults();
        return;
      }

      this.criteriaResults = result.criteria_results;
      this.locationData = result.location;
      this.observationDate = result.observation_date;

      // Debug: Log MABIMS data
      if (this.criteriaResults && this.criteriaResults.MABIMS) {
        console.log('🔍 MABIMS Data from Backend:', this.criteriaResults.MABIMS);
      }

      const content = this.querySelector('#criteria-content');

      if (!content) {
        console.error('❌ Criteria content element not found');
        return;
      }

      if (!this.criteriaResults || Object.keys(this.criteriaResults).length === 0) {
        content.innerHTML = `
          <div class="no-results">
            <p>❌ No criteria results available</p>
          </div>
        `;
        return;
      }

      content.innerHTML = this.renderCriteriaResults();
    } catch (error) {
      console.error('❌ Error updating criteria results:', error);
      const content = this.querySelector('#criteria-content');
      if (content) {
        content.innerHTML = `
          <div class="error-state">
            <p>⚠️ Error displaying results</p>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  renderNoResults() {
    const content = this.querySelector('#criteria-content');
    if (content) {
      content.innerHTML = `
        <div class="no-results">
          <p>🧮 Perform a calculation to see criteria results</p>
        </div>
      `;
    }
  }

  renderCriteriaResults() {
    const criteria = Object.entries(this.criteriaResults);
    const visibleCount = criteria.filter(([, data]) => data.is_visible).length;
    const totalCount = criteria.length;

    return `
      <div class="space-y-6">
        <div class="stats stats-vertical lg:stats-horizontal shadow-md bg-base-200 w-full">
          <div class="stat">
            <div class="stat-title">Total Criteria</div>
            <div class="stat-value text-sm">${totalCount} Methods</div>
          </div>
          <div class="stat">
            <div class="stat-title text-success font-bold">Visible</div>
            <div class="stat-value text-success">${visibleCount}</div>
          </div>
          <div class="stat">
            <div class="stat-title text-error font-bold">Not Visible</div>
            <div class="stat-value text-error">${totalCount - visibleCount}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${criteria.map(([key, data]) => this.renderCriteriaCard(key, data)).join('')}
        </div>
      </div>
    `;
  }

  renderCriteriaCard(key, data) {
    const isVisible = data.is_visible;
    const badgeClass = isVisible ? 'badge-success' : 'badge-error';
    const borderClass = isVisible ? 'border-success/30' : 'border-error/30';
    const shadowClass = isVisible ? 'shadow-success/10' : 'shadow-error/10';
    const icon = isVisible ? 
      '<svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : 
      '<svg class="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    return `
      <div class="card bg-base-100 border ${borderClass} shadow-md ${shadowClass} hover:shadow-lg transition-all duration-200">
        <div class="card-body p-4">
          <div class="flex justify-between items-start">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-base-200 rounded-lg">
                ${icon}
              </div>
              <div>
                <h4 class="font-bold text-lg leading-tight">${data.criteria_name}</h4>
                <div class="badge ${badgeClass} badge-sm font-bold mt-1">${isVisible ? 'VISIBLE' : 'NOT VISIBLE'}</div>
              </div>
            </div>
          </div>

          <div class="mt-4 text-sm bg-base-200/50 p-3 rounded-lg">
             <div class="font-semibold opacity-70 mb-1">Details:</div>
             <p class="font-mono text-xs">${data.additional_info || 'No technical data available'}</p>
          </div>

          <div class="mt-3 pt-3 border-t border-base-300 flex justify-between items-center">
            <span class="text-xs opacity-60 italic">${this.getCriteriaDescription(key)}</span>
            <span class="badge badge-ghost badge-xs uppercase opacity-50">${data.visibility_type}</span>
          </div>
        </div>
      </div>
    `;
  }

  getCriteriaDescription(key) {
    const descriptions = {
      'MABIMS_Lama': 'MABIMS criteria (Traditional)',
      'MABIMS_Baru': 'MABIMS criteria (Updated)',
      'Wujudul_Hilal': 'Wujudul Hilal (Muhammadiyah)',
      'Turkey': 'Turkey/Diyanet criteria',
      'Odeh': 'Odeh Astronomical criteria',
      'Ijtima_Qobla_Ghurub': 'Conjunction before sunset',
      'LFNU': 'LFNU criteria',
      'Additional': 'Additional criteria'
    };
    return descriptions[key] || key;
  }

  formatDate(year, month, day) {
    if (!year || !month || !day) return 'N/A';
    const date = new Date(year, month - 1, Math.floor(day));
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  exportCSV() {
    if (!this.criteriaResults) {
      alert('No results to export');
      return;
    }

    const rows = [
      ['Criteria', 'Visible', 'Type', 'Details'],
      ...Object.entries(this.criteriaResults).map(([name, data]) => [
        data.criteria_name,
        data.is_visible ? 'YES' : 'NO',
        data.visibility_type,
        data.additional_info || ''
      ])
    ];

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criteria-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('📤 Results exported to CSV');
  }

  exportJSON() {
    if (!this.criteriaResults) {
      alert('No results to export');
      return;
    }

    const data = {
      timestamp: new Date().toISOString(),
      location: this.locationData,
      observation_date: this.observationDate,
      criteria_results: this.criteriaResults
    };

    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `criteria-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    console.log('📤 Results exported to JSON');
  }

  printResults() {
    if (!this.criteriaResults) {
      alert('No results to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const criteriaHtml = this.renderCriteriaResults();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hilal Visibility Criteria Results</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              background: #f5f5f5;
            }
            h1 { color: #333; text-align: center; }
            .criteria-summary {
              background: white;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .summary-stats {
              display: flex;
              gap: 20px;
              margin-bottom: 15px;
            }
            .stat-item {
              flex: 1;
              text-align: center;
              padding: 10px;
              background: #f9f9f9;
              border-radius: 3px;
            }
            .stat-value { 
              font-size: 24px; 
              font-weight: bold;
              display: block;
            }
            .observation-info {
              font-size: 14px;
              color: #666;
            }
            .criteria-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .criteria-card {
              background: white;
              border-left: 4px solid #ccc;
              padding: 15px;
              border-radius: 3px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .criteria-card.visible {
              border-left-color: #28a745;
              background: #f0fff4;
            }
            .criteria-card.not-visible {
              border-left-color: #dc3545;
              background: #fff5f5;
            }
            .criteria-name { margin: 0; color: #333; }
            .visibility-type {
              display: inline-block;
              margin-top: 5px;
              font-size: 12px;
              color: #666;
              background: #f0f0f0;
              padding: 2px 6px;
              border-radius: 3px;
            }
            .criteria-details { 
              margin-top: 10px;
              font-size: 13px;
              color: #555;
            }
            .criteria-footer {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid #eee;
              color: #999;
            }
            @media print {
              body { background: white; }
              .criteria-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <h1>Hilal Visibility Criteria Analysis</h1>
          <p style="text-align: center; color: #999;">Generated on: ${new Date().toLocaleString()}</p>
          ${criteriaHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  }
}

// Register custom element
customElements.define('criteria-results-display', CriteriaResultsDisplay);
