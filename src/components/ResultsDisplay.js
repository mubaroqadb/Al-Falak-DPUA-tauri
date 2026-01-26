// Results Display Web Component
// Shows calculation results and astronomical data

export class ResultsDisplay extends HTMLElement {
  constructor() {
    super();
    this.currentResult = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="results-display">
        <h3>Calculation Results</h3>

        <div id="results-content" class="results-content">
          <div class="no-results">
            <p>🧮 Select a location and criteria to see calculation results</p>
          </div>
        </div>

        <div class="results-actions">
          <button id="export-results">Export Results</button>
          <button id="print-results">Print</button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const exportBtn = this.querySelector('#export-results');
    const printBtn = this.querySelector('#print-results');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportResults());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => this.printResults());
    }
  }

  updateResults(result) {
    this.currentResult = result;
    const content = this.querySelector('#results-content');

    if (!result) {
      content.innerHTML = `
        <div class="no-results">
          <p>❌ No calculation results available</p>
          <p>Please select a location and criteria, then click calculate.</p>
        </div>
      `;
      return;
    }

    // Handle different result formats
    if (result.error) {
      content.innerHTML = `
        <div class="error-results">
          <p>⚠️ Calculation Error</p>
          <p>${result.error}</p>
        </div>
      `;
      return;
    }

    content.innerHTML = this.renderResults(result);
  }

  showSkeleton() {
    const content = this.querySelector('#results-content');
    content.innerHTML = `
      <div class="results-grid animate-pulse">
        <div class="result-section">
          <div class="h-6 w-48 skeleton mb-4"></div>
          <div class="space-y-3">
            <div class="flex justify-between"><div class="h-4 w-20 skeleton"></div><div class="h-4 w-32 skeleton"></div></div>
            <div class="flex justify-between"><div class="h-4 w-20 skeleton"></div><div class="h-4 w-40 skeleton"></div></div>
            <div class="flex justify-between"><div class="h-4 w-20 skeleton"></div><div class="h-4 w-24 skeleton"></div></div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
           <div class="flex flex-col gap-4">
              <div class="h-48 w-full skeleton rounded-xl"></div>
              <div class="h-32 w-full skeleton rounded-xl"></div>
           </div>
           <div class="h-full w-full skeleton rounded-xl"></div>
        </div>
      </div>
    `;
  }

  renderResults(result) {
    return `
      <div class="results-grid">
        <!-- Basic Information -->
        <div class="result-section">
          <h4>📅 Basic Information</h4>
          <div class="result-item">
            <span class="label">Date:</span>
            <span class="value font-mono">${this.formatDate(result.date)}</span>
          </div>
          <div class="result-item">
            <span class="label">Location:</span>
            <span class="value font-mono">${result.location?.latitude?.toFixed(4)}°, ${result.location?.longitude?.toFixed(4)}°</span>
          </div>
          <div class="result-item">
            <span class="label">Criteria:</span>
            <span class="value font-mono">${result.criteria || 'Not specified'}</span>
          </div>
        </div>

        <!-- Astronomical Data -->
        <!-- Astronomical Data Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Visualizer Column -->
            <div class="flex flex-col gap-4">
                <moon-phase-visualizer 
                    illumination="${result.illumination || 0.005}" 
                    age="${result.moon_age_hours || 0}">
                </moon-phase-visualizer>
                
                <div class="glass-panel p-4 rounded-xl">
                    <h4 class="text-sm font-bold uppercase opacity-70 mb-3">🌙 Moon Position</h4>
                    <div class="space-y-2 text-sm">
                         <div class="flex justify-between"><span>Altitude:</span> <span class="font-mono font-bold">${result.moon_altitude ? result.moon_altitude.toFixed(4) + '°' : 'N/A'}</span></div>
                         <div class="flex justify-between"><span>Azimuth:</span> <span class="font-mono">${result.moon_azimuth ? result.moon_azimuth.toFixed(4) + '°' : 'N/A'}</span></div>
                         <div class="flex justify-between"><span>Elongation:</span> <span class="font-mono">${result.elongation ? result.elongation.toFixed(4) + '°' : 'N/A'}</span></div>
                    </div>
                </div>
            </div>

            <!-- Detailed Data Column -->
            <div class="glass-panel p-4 rounded-xl">
              <h4 class="text-sm font-bold uppercase opacity-70 mb-3">📋 Detailed Ephemeris</h4>
              <div class="space-y-2 text-sm overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  <div class="result-item">
                    <span class="label">Conjunction (Ijtimak):</span>
                    <span class="value font-mono text-right">${result.conjunction_date || 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Moon Age:</span>
                    <span class="value font-mono text-right">${result.moon_age_hours ? result.moon_age_hours.toFixed(2) + ' h' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">ARCV (Arc of Vision):</span>
                    <span class="value font-mono text-right">${result.arcv ? result.arcv.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Crescent Width:</span>
                    <span class="value font-mono text-right">${result.crescent_width ? result.crescent_width.toFixed(4) + "'" : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Moon Distance:</span>
                    <span class="value font-mono text-right">${result.moon_distance_km ? result.moon_distance_km.toFixed(0) + ' km' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Moon Semi-Diameter:</span>
                    <span class="value font-mono text-right">${result.moon_semidiameter ? result.moon_semidiameter.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Parallax:</span>
                    <span class="value font-mono text-right">${result.parallax ? result.parallax.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">Refraction:</span>
                    <span class="value font-mono text-right">${result.refraction ? result.refraction.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
              </div>
            </div>
        </div>

        <!-- Solar Data -->
        <div class="result-section">
          <h4>☀️ Solar Data</h4>
          <div class="result-item">
            <span class="label">Sunset Time:</span>
            <span class="value font-mono">${result.sunset_time ? this.formatTime(result.sunset_time) : 'N/A'}</span>
          </div>
          <div class="result-item">
            <span class="label">Sun Altitude:</span>
            <span class="value font-mono">${result.sun_altitude ? result.sun_altitude.toFixed(2) + '°' : 'N/A'}</span>
          </div>
          <div class="result-item">
            <span class="label">Equation of Time:</span>
            <span class="value font-mono">${result.equation_of_time ? result.equation_of_time.toFixed(2) + ' min' : 'N/A'}</span>
          </div>
        </div>

        <!-- Visibility Assessment -->
        <div class="result-section">
          <h4>👁️ Visibility Assessment</h4>
          <div class="visibility-result ${result.is_visible ? 'visible' : 'not-visible'}">
            <div class="visibility-status">
              <span class="status-icon">${result.is_visible ? '✅' : '❌'}</span>
              <span class="status-text">${result.is_visible ? 'HILAL TERLIHAT' : 'HILAL TIDAK TERLIHAT'}</span>
            </div>
            <div class="visibility-details">
              <p><strong>Criteria Check:</strong></p>
              <ul>
                ${this.renderCriteriaChecks(result)}
              </ul>
            </div>
          </div>
        </div>

        <!-- Additional Data -->
        ${result.additional_data ? `
          <div class="result-section">
            <h4>📊 Additional Data</h4>
            <div class="additional-data">
              ${this.renderAdditionalData(result.additional_data)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderCriteriaChecks(result) {
    const checks = [];

    // Altitude check
    if (result.moon_altitude !== undefined) {
      const altCheck = result.moon_altitude > 3;
      checks.push(`<li class="${altCheck ? 'pass' : 'fail'}">Altitude > 3°: ${result.moon_altitude.toFixed(2)}° ${altCheck ? '✅' : '❌'}</li>`);
    }

    // Elongation check
    if (result.elongation !== undefined) {
      const elongCheck = result.elongation > 6.4;
      checks.push(`<li class="${elongCheck ? 'pass' : 'fail'}">Elongation > 6.4°: ${result.elongation.toFixed(2)}° ${elongCheck ? '✅' : '❌'}</li>`);
    }

    // Age check
    if (result.moon_age !== undefined) {
      const ageCheck = result.moon_age > 0;
      checks.push(`<li class="${ageCheck ? 'pass' : 'fail'}">Age > 0h: ${result.moon_age.toFixed(2)}h ${ageCheck ? '✅' : '❌'}</li>`);
    }

    return checks.join('');
  }

  renderAdditionalData(additionalData) {
    if (typeof additionalData === 'object') {
      return Object.entries(additionalData)
        .map(([key, value]) => `
          <div class="result-item">
            <span class="label">${this.formatLabel(key)}:</span>
            <span class="value font-mono">${this.formatValue(value)}</span>
          </div>
        `)
        .join('');
    }
    return `<pre>${JSON.stringify(additionalData, null, 2)}</pre>`;
  }

  formatDate(date) {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  }

  formatTime(time) {
    if (!time) return 'N/A';
    try {
      return new Date(time).toLocaleTimeString('id-ID');
    } catch {
      return time;
    }
  }

  formatLabel(key) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatValue(value) {
    if (typeof value === 'number') {
      return value.toFixed ? value.toFixed(2) : value;
    }
    return value;
  }

  exportResults() {
    if (!this.currentResult) {
      alert('No results to export');
      return;
    }

    const dataStr = JSON.stringify(this.currentResult, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `hilal-results-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log('📤 Results exported to:', exportFileDefaultName);
  }

  printResults() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const resultsHtml = this.renderResults(this.currentResult);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hisab Hilal Results</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .result-section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; }
            .result-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; }
            .value { font-family: "JetBrains Mono", monospace; }
            .visibility-result { padding: 15px; border-radius: 5px; }
            .visible { background: #d4edda; border: 1px solid #c3e6cb; }
            .not-visible { background: #f8d7da; border: 1px solid #f5c6cb; }
            .pass { color: #28a745; }
            .fail { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>Hisab Hilal Calculation Results</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          ${resultsHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  }
}

// Register custom element
customElements.define('results-display', ResultsDisplay);