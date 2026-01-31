// Results Display Web Component
// Shows calculation results and astronomical data

import { i18n } from '../services/i18n.js';

export class ResultsDisplay extends HTMLElement {
  constructor() {
    super();
    this.currentResult = null;
    this.i18n = i18n;
  }

  connectedCallback() {
    this.render();
    this.setupLanguageChangeListener();
  }

  setupLanguageChangeListener() {
    window.addEventListener('language-changed', () => {
      console.log('🔄 ResultsDisplay: Language changed, re-rendering results');
      if (this.currentResult) {
        this.updateResults(this.currentResult);
      }
    });
  }

  t(key, defaultValue = key) {
    if (this.i18n && this.i18n.t) {
      return this.i18n.t(key, defaultValue);
    }
    return defaultValue;
  }

  render() {
    this.innerHTML = `
      <div class="results-display">
        <h3>${this.t('results.title', 'Calculation Results')}</h3>

        <div id="results-content" class="results-content">
          <div class="no-results flex flex-col items-center justify-center p-8 opacity-60">
            <svg class="w-12 h-12 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
            <p>${this.t('messages.noData', 'Select a location and criteria to see calculation results')}</p>
          </div>
        </div>

        <div class="results-actions">
          <button id="export-results">${this.t('buttons.export', 'Export Results')}</button>
          <button id="print-results">${this.t('buttons.print', 'Print')}</button>
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
    
    // DEBUG: Trace converted_date_info flow
    console.log('DEBUG [ResultsDisplay]: Received result for rendering:', result);
    if (result && result.converted_date_info) {
       console.log('DEBUG [ResultsDisplay]: converted_date_info found:', result.converted_date_info);
    } else if (result) {
       console.warn('DEBUG [ResultsDisplay]: converted_date_info is MISSING in result object');
    }

    const content = this.querySelector('#results-content');

    if (!result) {
      content.innerHTML = `
        <div class="no-results flex flex-col items-center justify-center p-8 opacity-60">
          <svg class="w-12 h-12 mb-4 text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <p class="font-bold">No calculation results available</p>
          <p class="text-xs">Please select a location and criteria, then click calculate.</p>
        </div>
      `;
      return;
    }

    // Handle different result formats
    if (result.error) {
      content.innerHTML = `
        <div class="error-results flex flex-col items-center justify-center p-8 text-error bg-error/10 rounded-xl">
          <svg class="w-12 h-12 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p class="font-bold">Calculation Error</p>
          <p class="text-sm">${result.error}</p>
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
          <h4 class="flex items-center gap-2">
            <svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            ${this.t('results.basicInfo', 'Basic Information')}
          </h4>
          <div class="result-item">
            <span class="label">${this.t('labels.date', 'Date')}:</span>
            <span class="value font-mono">${this.formatDate(result.date)}</span>
          </div>
          ${result.converted_date_info ? `
          <div class="result-item">
            <span class="label">${this.t('results.dateInfo', 'Date Information')}:</span>
            <span class="value font-mono text-primary font-bold">${this.formatConvertedDateWithDayName(result)}</span>
          </div>
          ` : ''}
          <div class="result-item">
            <span class="label">${this.t('labels.location', 'Location')}:</span>
            <span class="value font-mono">${result.location?.latitude?.toFixed(4)}°, ${result.location?.longitude?.toFixed(4)}°</span>
          </div>
          <div class="result-item">
            <span class="label">${this.t('labels.criteria', 'Criteria')}:</span>
            <span class="value font-mono">${result.criteria || this.t('criteria.notSpecified', 'Not specified')}</span>
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
                    <h4 class="text-sm font-bold uppercase opacity-70 mb-3">🌙 ${this.t('results.moonPosition', 'Moon Position')}</h4>
                    <div class="space-y-2 text-sm">
                         <div class="flex justify-between"><span>${this.t('results.altitude', 'Altitude')}:</span> <span class="font-mono font-bold">${result.moon_altitude ? result.moon_altitude.toFixed(4) + '°' : 'N/A'}</span></div>
                         <div class="flex justify-between"><span>${this.t('results.azimuth', 'Azimuth')}:</span> <span class="font-mono">${result.moon_azimuth ? result.moon_azimuth.toFixed(4) + '°' : 'N/A'}</span></div>
                         <div class="flex justify-between"><span>${this.t('results.elongation', 'Elongation')}:</span> <span class="font-mono">${result.elongation ? result.elongation.toFixed(4) + '°' : 'N/A'}</span></div>
                    </div>
                </div>
            </div>

            <!-- Detailed Data Column -->
            <div class="glass-panel p-4 rounded-xl">
              <h4 class="text-sm font-bold uppercase opacity-70 mb-3">📋 ${this.t('tabLabels.ephemeris', 'Detailed Ephemeris')}</h4>
              <div class="space-y-2 text-sm overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  <div class="result-item">
                    <span class="label">${this.t('results.conjunction', 'Conjunction (Ijtimak)')}:</span>
                    <span class="value font-mono text-right">${result.conjunction_date || 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.moonAge', 'Moon Age')}:</span>
                    <span class="value font-mono text-right">${result.moon_age_hours ? result.moon_age_hours.toFixed(2) + ' h' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.arcv', 'ARCV (Arc of Vision)')}:</span>
                    <span class="value font-mono text-right">${result.arcv ? result.arcv.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.crescentWidth', 'Crescent Width')}:</span>
                    <span class="value font-mono text-right">${result.crescent_width ? result.crescent_width.toFixed(4) + "'" : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.moonDistance', 'Moon Distance')}:</span>
                    <span class="value font-mono text-right">${result.moon_distance_km ? result.moon_distance_km.toFixed(0) + ' km' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.moonSemiDiameter', 'Moon Semi-Diameter')}:</span>
                    <span class="value font-mono text-right">${result.moon_semidiameter ? result.moon_semidiameter.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.parallax', 'Parallax')}:</span>
                    <span class="value font-mono text-right">${result.parallax ? result.parallax.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
                  <div class="result-item">
                    <span class="label">${this.t('results.refraction', 'Refraction')}:</span>
                    <span class="value font-mono text-right">${result.refraction ? result.refraction.toFixed(4) + '°' : 'N/A'}</span>
                  </div>
              </div>
            </div>
        </div>

        <!-- Solar Data -->
        <div class="result-section">
          <h4 class="flex items-center gap-2">
            <svg class="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            Solar Data
          </h4>
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
          <h4 class="flex items-center gap-2">
            <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Visibility Assessment
          </h4>
          <div class="visibility-result ${result.is_visible ? 'visible' : 'not-visible'}">
            <div class="visibility-status">
              <span class="status-icon">
                ${result.is_visible ? 
                  '<svg class="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' : 
                  '<svg class="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'}
              </span>
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
            <h4 class="flex items-center gap-2">
              <svg class="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Additional Data
            </h4>
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
      checks.push(`<li class="${altCheck ? 'pass' : 'fail'} flex items-center gap-2">
        <span>Altitude > 3°: ${result.moon_altitude.toFixed(2)}°</span>
        ${altCheck ? 
          '<svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : 
          '<svg class="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'}
      </li>`);
    }

    // Elongation check
    if (result.elongation !== undefined) {
      const elongCheck = result.elongation > 6.4;
      checks.push(`<li class="${elongCheck ? 'pass' : 'fail'} flex items-center gap-2">
        <span>Elongation > 6.4°: ${result.elongation.toFixed(2)}°</span>
        ${elongCheck ? 
          '<svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : 
          '<svg class="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'}
      </li>`);
    }

    // Age check
    if (result.moon_age !== undefined) {
      const ageCheck = result.moon_age > 0;
      checks.push(`<li class="${ageCheck ? 'pass' : 'fail'} flex items-center gap-2">
        <span>Age > 0h: ${result.moon_age.toFixed(2)}h</span>
        ${ageCheck ? 
          '<svg class="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>' : 
          '<svg class="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'}
      </li>`);
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

  /**
   * Format converted date with day name (Hari Jawa)
   * Examples:
   * - "01 Ramadhan 1447 H bertepatan dengan Kamis Pahing, 19 Februari 2026 M"
   * - "Kamis Pahing, 18 Februari 2026 M bertepatan dengan 01 Ramadhan 1447 H"
   */
  formatConvertedDateWithDayName(result) {
    if (!result.converted_date_info) return '';
    
    const { original, converted, label } = result.converted_date_info;
    const dayName = result.day_name || '';
    
    // Determine if this is Hijri->Gregorian or Gregorian->Hijri conversion
    // by checking the label
    const isHijriToGregorian = label === 'Bertepatan dengan';
    
    if (isHijriToGregorian) {
      // Hijri to Gregorian: "01 Ramadhan 1447 H bertepatan dengan Kamis Pahing, 19 Februari 2026 M"
      return `${original} bertepatan dengan ${dayName ? dayName + ', ' : ''}${converted}`;
    } else {
      // Gregorian to Hijri: "Kamis Pahing, 18 Februari 2026 M bertepatan dengan 01 Ramadhan 1447 H"
      return `${dayName ? dayName + ', ' : ''}${original} bertepatan dengan ${converted}`;
    }
  }

  exportResults() {
    console.log('🔘 Export button clicked in ResultsDisplay');
    this.dispatchEvent(new CustomEvent('export-click', {
      bubbles: true,
      composed: true
    }));
  }

  printResults() {
    console.log('🖨️ Print button clicked in ResultsDisplay');
    this.dispatchEvent(new CustomEvent('print-click', {
      bubbles: true,
      composed: true
    }));
  }
}

// Register custom element
customElements.define('results-display', ResultsDisplay);