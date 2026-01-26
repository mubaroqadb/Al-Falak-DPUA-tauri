// Validation Panel Component
// Handles astronomical calculation validation

import { HilalAPI } from '../services/api.js';

export class ValidationPanel extends HTMLElement {
  constructor() {
    super();
    this.api = new HilalAPI();
    this.isRunning = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="validation-panel">
        <h3>🔬 Astronomical Validation</h3>
        <p class="validation-description">
          Validate astronomical calculations against reference data from Astronomical Almanac and NASA Horizons.
        </p>

        <div class="validation-controls">
          <button id="run-validation-btn" class="run-validation-btn" ${this.isRunning ? 'disabled' : ''}>
            ${this.isRunning ? '⏳ Running Tests...' : '🧪 Run Validation Tests'}
          </button>
        </div>

        <div id="validation-results" class="validation-results" style="display: none;">
          <h4>Validation Results</h4>
          <div id="results-content" class="results-content"></div>
        </div>

        <div class="validation-info">
          <h4>Test Coverage</h4>
          <ul>
            <li>✅ Conjunction calculations (New Moon timing)</li>
            <li>✅ Solar position accuracy</li>
            <li>✅ Lunar position accuracy</li>
            <li>✅ Visibility criteria evaluation</li>
            <li>✅ Julian Day conversions</li>
          </ul>

          <h4>Data Sources</h4>
          <ul>
            <li>Astronomical Almanac 2024-2026</li>
            <li>NASA Horizons ephemeris data</li>
            <li>Islamic Crescent Observation Project (ICOP)</li>
            <li>Historical rukyatul hilal records</li>
          </ul>
        </div>
      </div>
    `;

    this.updateButtonState();
  }

  setupEventListeners() {
    const runBtn = this.querySelector('#run-validation-btn');
    runBtn.addEventListener('click', () => this.runValidationTests());
  }

  async runValidationTests() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateButtonState();

    const resultsDiv = this.querySelector('#validation-results');
    const resultsContent = this.querySelector('#results-content');

    resultsDiv.style.display = 'block';
    resultsContent.innerHTML = '<div class="loading">⏳ Running validation tests...</div>';

    try {
      const result = await this.api.runValidationTests();

      let html = `
        <div class="validation-summary ${result.success ? 'success' : 'error'}">
          <h5>${result.success ? '✅' : '❌'} ${result.message}</h5>
        </div>
        <div class="validation-details">
      `;

      result.details.forEach(detail => {
        const isSuccess = detail.includes('✅') || detail.includes('successfully');
        const isError = detail.includes('❌') || detail.includes('failed') || detail.includes('error');

        let className = 'neutral';
        if (isSuccess) className = 'success';
        if (isError) className = 'error';

        html += `<div class="detail-item ${className}">${detail}</div>`;
      });

      html += '</div>';
      resultsContent.innerHTML = html;

    } catch (error) {
      resultsContent.innerHTML = `
        <div class="validation-summary error">
          <h5>❌ Validation Failed</h5>
          <p>Error: ${error.message}</p>
        </div>
      `;
    } finally {
      this.isRunning = false;
      this.updateButtonState();
    }
  }

  updateButtonState() {
    const runBtn = this.querySelector('#run-validation-btn');
    if (runBtn) {
      runBtn.disabled = this.isRunning;
      runBtn.textContent = this.isRunning ? '⏳ Running Tests...' : '🧪 Run Validation Tests';
    }
  }
}

// Register the custom element
customElements.define('validation-panel', ValidationPanel);