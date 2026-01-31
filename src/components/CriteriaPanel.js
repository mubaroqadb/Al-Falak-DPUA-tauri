// Criteria Panel Component
// Enhanced input form with modern UI and validation

import { VISIBILITY_CRITERIA } from '../utils/constants.js';

class CriteriaPanel extends HTMLElement {
  constructor() {
    super();
    this.currentFormat = 'decimal'; // 'decimal' or 'dms'
    this.selectedCriteria = 'MABIMS';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="input-section">
        <h3>📅 Date Selection</h3>
        <div class="form-group">
          <label class="form-label" for="date-input">Calculation Date</label>
          <input 
            type="date" 
            id="date-input" 
            class="form-control" 
            value="${new Date().toISOString().split('T')[0]}"
            required
          >
          <span class="form-help">Select the date for hilal calculation</span>
        </div>
      </div>

      <div class="input-section">
        <h3>📍 Location</h3>
        
        <div class="format-toggle">
          <label class="form-label">Coordinate Format</label>
          <div class="toggle-buttons">
            <button class="toggle-btn active" data-format="decimal">
              Decimal (°)
            </button>
            <button class="toggle-btn" data-format="dms">
              DMS (° ′ ″)
            </button>
          </div>
        </div>

        <div class="location-inputs" id="decimal-inputs">
          <div class="form-group">
            <label class="form-label" for="latitude">Latitude</label>
            <input 
              type="number" 
              id="latitude" 
              class="form-control" 
              value="-6.2"
              step="0.0001"
              min="-90"
              max="90"
              required
              placeholder="e.g., -6.2"
            >
            <span class="form-help">Range: -90° to 90°</span>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="longitude">Longitude</label>
            <input 
              type="number" 
              id="longitude" 
              class="form-control" 
              value="106.816666"
              step="0.0001"
              min="-180"
              max="180"
              required
              placeholder="e.g., 106.816666"
            >
            <span class="form-help">Range: -180° to 180°</span>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="elevation">Elevation (meters)</label>
            <input 
              type="number" 
              id="elevation" 
              class="form-control" 
              value="8"
              min="0"
              required
              placeholder="e.g., 8"
            >
            <span class="form-help">Height above sea level</span>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="timezone">Timezone (UTC offset)</label>
            <input 
              type="number" 
              id="timezone" 
              class="form-control" 
              value="7"
              min="-12"
              max="14"
              required
              placeholder="e.g., 7"
            >
            <span class="form-help">UTC offset (e.g., +7 for WIB)</span>
          </div>
        </div>

        <div class="location-inputs hidden" id="dms-inputs">
          <div class="form-group">
            <label class="form-label">Latitude</label>
            <div class="dms-input-group">
              <input 
                type="number" 
                id="lat-deg" 
                class="form-control dms-deg" 
                value="6"
                min="0"
                max="90"
                required
                placeholder="°"
              >
              <span>°</span>
              <input 
                type="number" 
                id="lat-min" 
                class="form-control dms-min" 
                value="12"
                min="0"
                max="59"
                required
                placeholder="′"
              >
              <span>′</span>
              <input 
                type="number" 
                id="lat-sec" 
                class="form-control dms-sec" 
                value="0"
                min="0"
                max="59"
                step="0.01"
                required
                placeholder="″"
              >
              <span>″</span>
              <select id="lat-dir" class="form-control dms-dir">
                <option value="S">S (South)</option>
                <option value="N">N (North)</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Longitude</label>
            <div class="dms-input-group">
              <input 
                type="number" 
                id="lon-deg" 
                class="form-control dms-deg" 
                value="106"
                min="0"
                max="180"
                required
                placeholder="°"
              >
              <span>°</span>
              <input 
                type="number" 
                id="lon-min" 
                class="form-control dms-min" 
                value="49"
                min="0"
                max="59"
                required
                placeholder="′"
              >
              <span>′</span>
              <input 
                type="number" 
                id="lon-sec" 
                class="form-control dms-sec" 
                value="0"
                min="0"
                max="59"
                step="0.01"
                required
                placeholder="″"
              >
              <span>″</span>
              <select id="lon-dir" class="form-control dms-dir">
                <option value="E">E (East)</option>
                <option value="W">W (West)</option>
              </select>
            </div>
          
          <div class="form-group">
            <label class="form-label" for="elevation">Elevation (meters)</label>
            <input 
              type="number" 
              id="elevation" 
              class="form-control" 
              value="8"
              min="0"
              required
              placeholder="e.g., 8"
            >
            <span class="form-help">Height above sea level</span>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="timezone">Timezone (UTC offset)</label>
            <input 
              type="number" 
              id="timezone" 
              class="form-control" 
              value="7"
              min="-12"
              max="14"
              required
              placeholder="e.g., 7"
            >
            <span class="form-help">UTC offset (e.g., +7 for WIB)</span>
          </div>
        </div>

        <div class="location-presets">
          <label>Preset Locations</label>
          <div class="preset-buttons">
            <button class="preset-btn" data-location="jakarta">Jakarta</button>
            <button class="preset-btn" data-location="surabaya">Surabaya</button>
            <button class="preset-btn" data-location="makassar">Makassar</button>
            <button class="preset-btn" data-location="medan">Medan</button>
            <button class="preset-btn" data-location="bandung">Bandung</button>
            <button class="preset-btn" data-location="yogyakarta">Yogyakarta</button>
            <button class="preset-btn" data-location="semarang">Semarang</button>
            <button class="preset-btn" data-location="denpasar">Denpasar</button>
          </div>
        </div>
      </div>

      <div class="input-section">
        <h3>🔭 Visibility Criteria</h3>
        
        <div class="criteria-selector">
          ${this.renderCriteriaOptions()}
        </div>

        <div class="criteria-description" id="criteria-description">
          ${this.getCriteriaDescription(this.selectedCriteria)}
        </div>
      </div>

      <div class="criteria-actions">
        <button class="btn btn-primary" id="calculate-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3zm0 6a6 6 0 1 0 6 6 6 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0  Altitude ≥ 3°</p>
                <p><strong>Age of Moon:</strong> ≥ 8 hours</p>
              </div>
            </div>
            <div class="criteria-footer">
              <strong>MABIMS</strong> - Ministry of Religious Affairs Indonesia
            </div>
          </div>
        </div>

        <div class="criteria-option" data-criteria="ODEH">
          <div class="criteria-header">
            <input type="radio" name="criteria" id="criteria-odeh" value="ODEH">
            <label for="criteria-odeh">Odeh Criteria</label>
          </div>
          <div class="criteria-body">
            <div class="visibility-status">
              <span class="status-badge status-info">ℹ️</span>
              <span class="visibility-type">Optical criteria</span>
            </div>
            <div class="criteria-details">
              <p>Moon altitude ≥ 2° at sunset</p>
              <p>Age of moon ≥ 20 hours</p>
            </div>
            <div class="criteria-footer">
              <strong>Odeh</strong> - Dr. Mohammad Odeh
            </div>
          </div>

        </div>
      </div>
    `;
  }

  renderCriteriaOptions() {
    return Object.entries(VISIBILITY_CRITERIA).map(([key, criteria]) => `
      <div class="criteria-option ${this.selectedCriteria === key ? 'selected' : ''}" data-criteria="${key}">
        <div class="criteria-header">
          <input type="radio" name="criteria" id="criteria-${key}" value="${key}" ${this.selectedCriteria === key ? 'checked' : ''}>
          <label for="criteria-${key}">${criteria.name}</label>
        </div>
        <div class="criteria-body">
          <div class="visibility-status">
            <span class="status-badge status-info">ℹ️</span>
            <span class="visibility-type">${criteria.type}</span>
          </div>
          <div class="criteria-details">
            ${criteria.description}
          </div>
          <div class="criteria-footer">
            <strong>${key}</strong> - ${criteria.authority}
          </div>
        </div>
      </div>
    `).join('');
  }

  getCriteriaDescription(criteria) {
    const descriptions = {
      'MABIMS': {
        title: 'MABIMS Criteria',
        description: 'The criteria used by Ministry of Religious Affairs Indonesia for determining the beginning of Islamic months.',
        parameters: [
          'Moon altitude at sunset ≥ 3°',
          'Age of moon at sunset ≥ 8 hours'
        ]
      },
      'ODEH': {
        title: 'Odeh Criteria',
        description: 'Optical criteria proposed by Dr. Mohammad Odeh for lunar crescent visibility.',
        parameters: [
          'Moon altitude at sunset ≥ 2°',
          'Age of moon at sunset ≥ 20 hours'
        ]
      },
      'TURKEY': {
        title: 'Turkey Criteria',
        description: 'Criteria used by Turkey for determining the beginning of Islamic months.',
        parameters: [
          'Moon altitude at sunset ≥ 5°',
          'Age of moon at sunset ≥ 8 hours'
        ]
      },
      'LFNU': {
        title: 'LFNU Criteria',
        description: 'Criteria proposed by Lembaga Fiqih Nahdlatul Ulama for lunar crescent visibility.',
        parameters: [
          'Moon altitude at sunset ≥ 6.4°',
          'Elongation ≥ 7.6°'
        ]
      },
      'IJTIMA_QOBLA_GHURUB': {
        title: 'Ijtima Qobla Ghurub',
        description: 'Traditional criteria based on moonset after sunset.',
        parameters: [
          'Moon must set after sunset'
        ]
      },
      'KHGT': {
        title: 'KHGT Criteria',
        description: 'Kalender Hijriah Global Tunggal criteria (Muhammadiyah).',
        parameters: [
          'Moon altitude at sunset ≥ 5°',
          'Elongation ≥ 8°'
        ]
      }
    };

    const desc = descriptions[criteria] || descriptions['MABIMS'];
    return `
      <h4>${desc.title}</h4>
      <p>${desc.description}</p>
      <strong>Parameters:</strong>
      <ul>
        ${desc.parameters.map(param => `<li>${param}</li>`).join('')}
      </ul>
    `;
  }

  setupEventListeners() {
    // Date input
    const dateInput = document.getElementById('date-input');
    if (dateInput) {
      dateInput.addEventListener('change', () => this.handleDateChange());
    }

    // Format toggle
    const formatButtons = document.querySelectorAll('.toggle-btn');
    formatButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleFormatToggle(btn));
    });

    // Decimal inputs
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const elevInput = document.getElementById('elevation');
    const tzInput = document.getElementById('timezone');

    if (latInput) latInput.addEventListener('change', () => this.validateAndEmit());
    if (lonInput) lonInput.addEventListener('change', () => this.validateAndEmit());
    if (elevInput) elevInput.addEventListener('change', () => this.validateAndEmit());
    if (tzInput) tzInput.addEventListener('change', () => this.validateAndEmit());

    // DMS inputs
    const latDeg = document.getElementById('lat-deg');
    const latMin = document.getElementById('lat-min');
    const latSec = document.getElementById('lat-sec');
    const latDir = document.getElementById('lat-dir');
    const lonDeg = document.getElementById('lon-deg');
    const lonMin = document.getElementById('lon-min');
    const lonSec = document.getElementById('lon-sec');
    const lonDir = document.getElementById('lon-dir');

    if (latDeg) latDeg.addEventListener('change', () => this.validateAndEmit());
    if (latMin) latMin.addEventListener('change', () => this.validateAndEmit());
    if (latSec) latSec.addEventListener('change', () => this.validateAndEmit());
    if (latDir) latDir.addEventListener('change', () => this.validateAndEmit());
    if (lonDeg) lonDeg.addEventListener('change', () => this.validateAndEmit());
    if (lonMin) lonMin.addEventListener('change', () => this.validateAndEmit());
    if (lonSec) lonSec.addEventListener('change', () => this.validateAndEmit());
    if (lonDir) lonDir.addEventListener('change', () => this.validateAndEmit());

    // Criteria radio buttons
    const criteriaRadios = document.querySelectorAll('input[name="criteria"]');
    criteriaRadios.forEach(radio => {
      radio.addEventListener('change', (e) => this.handleCriteriaChange(e));
    });

    // Preset buttons
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handlePresetClick(btn));
    });

    // Calculate button
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => this.handleCalculate());
    }
  }

  handleDateChange() {
    const dateInput = document.getElementById('date-input');
    const date = new Date(dateInput.value);
    
    if (isNaN(date.getTime())) {
      this.showError('Please select a valid date');
      return;
    }

    document.dispatchEvent(new CustomEvent('date-changed', {
      detail: { date }
    }));
  }

  handleFormatToggle(button) {
    const format = button.getAttribute('data-format');
    
    // Update active state
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // Toggle input visibility
    const decimalInputs = document.getElementById('decimal-inputs');
    const dmsInputs = document.getElementById('dms-inputs');

    if (format === 'decimal') {
      decimalInputs.classList.remove('hidden');
      dmsInputs.classList.add('hidden');
      this.currentFormat = 'decimal';
    } else {
      decimalInputs.classList.add('hidden');
      dmsInputs.classList.remove('hidden');
      this.currentFormat = 'dms';
    }

    this.validateAndEmit();
  }

  handleCriteriaChange(event) {
    this.selectedCriteria = event.target.value;
    
    // Update UI
    document.querySelectorAll('.criteria-option').forEach(option => {
      option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`.criteria-option[data-criteria="${this.selectedCriteria}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    // Update description
    const descriptionEl = document.getElementById('criteria-description');
    if (descriptionEl) {
      descriptionEl.innerHTML = this.getCriteriaDescription(this.selectedCriteria);
    }

    // Emit event
    this.dispatchEvent('criteria-changed', { criteria: this.selectedCriteria });
  }

  handlePresetClick(button) {
    const location = button.getAttribute('data-location');
    const presets = {
      jakarta: { lat: -6.2, lon: 106.816666, elev: 8, tz: 7 },
      surabaya: { lat: -7.2578, lon: 112.7521, elev: 3, tz: 7 },
      makassar: { lat: -5.1478, lon: 119.4327, elev: 25, tz: 8 },
      medan: { lat: 3.595, lon: 98.6722, elev: 15, tz: 7 },
      bandung: { lat: -6.9175, lon: 107.6191, elev: 710, tz: 7 },
      yogyakarta: { lat: -7.78, lon: 110.365, elev: 100, tz: 7 },
      semarang: { lat: -6.9667, lon: 110.4203, elev: 3, tz: 7 },
      denpasar: { lat: -8.67, lon: 115.2122, elev: 10, tz: 8 }
    };

    const preset = presets[location];
    if (!preset) return;

    if (this.currentFormat === 'decimal') {
      document.getElementById('latitude').value = preset.lat;
      document.getElementById('longitude').value = preset.lon;
      document.getElementById('elevation').value = preset.elev;
      document.getElementById('timezone').value = preset.tz;
    } else {
      // Convert to DMS
      const dms = this.decimalToDMS(preset.lat, preset.lon);
      document.getElementById('lat-deg').value = dms.lat.deg;
      document.getElementById('lat-min').value = dms.lat.min;
      document.getElementById('lat-sec').value = dms.lat.sec;
      document.getElementById('lat-dir').value = dms.lat.dir;
      document.getElementById('lon-deg').value = dms.lon.deg;
      document.getElementById('lon-min').value = dms.lon.min;
      document.getElementById('lon-sec').value = dms.lon.sec;
      document.getElementById('lon-dir').value = dms.lon.dir;
      document.getElementById('elevation').value = preset.elev;
      document.getElementById('timezone').value = preset.tz;
    }

    this.validateAndEmit();
  }

  decimalToDMS(lat, lon) {
    const toDMS = (decimal) => {
      const abs = Math.abs(decimal);
      const deg = Math.floor(abs);
      const minFloat = (abs - deg) * 60;
      const min = Math.floor(minFloat);
      const sec = ((minFloat - min) * 60).toFixed(2);
      return {
        deg,
        min,
        sec: parseFloat(sec),
        dir: decimal >= 0 ? 'N' : 'S'
      };
    };

    return {
      lat: toDMS(lat),
      lon: toDMS(lon)
    };
  }

  DMSToDecimal() {
    if (this.currentFormat !== 'dms') return null;

    const latDeg = parseFloat(document.getElementById('lat-deg').value) || 0;
    const latMin = parseFloat(document.getElementById('lat-min').value) || 0;
    const latSec = parseFloat(document.getElementById('lat-sec').value) || 0;
    const latDir = document.getElementById('lat-dir').value;

    const lonDeg = parseFloat(document.getElementById('lon-deg').value) || 0;
    const lonMin = parseFloat(document.getElementById('lon-min').value) || 0;
    const lonSec = parseFloat(document.getElementById('lon-sec').value) || 0;
    const lonDir = document.getElementById('lon-dir').value;

    const toDecimal = (deg, min, sec, dir) => {
      let decimal = deg + (min / 60) + (sec / 3600);
      if (dir === 'S' || dir === 'W') decimal = -decimal;
      return decimal;
    };

    return {
      latitude: toDecimal(latDeg, latMin, latSec, latDir),
      longitude: toDecimal(lonDeg, lonMin, lonSec, lonDir),
      elevation: parseFloat(document.getElementById('elevation').value) || 0,
      timezone: parseFloat(document.getElementById('timezone').value) || 0
    };
  }

  validateAndEmit() {
    const location = this.currentFormat === 'decimal' ? this.getDecimalLocation() : this.DMSToDecimal();

    if (!this.validateLocation(location)) {
      return;
    }

    // Emit location selected event
    this.dispatchEvent('location-selected', { location });
  }

  getDecimalLocation() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lon = parseFloat(document.getElementById('longitude').value);
    const elev = parseFloat(document.getElementById('elevation').value);
    const tz = parseFloat(document.getElementById('timezone').value);

    return {
      latitude: lat,
      longitude: lon,
      elevation: elev,
      timezone: tz
    };
  }

  validateLocation(location) {
    if (isNaN(location.latitude) || location.latitude < -90 || location.latitude > 90) {
      this.showError('Latitude must be between -90° and 90°');
      return false;
    }

    if (isNaN(location.longitude) || location.longitude < -180 || location.longitude > 180) {
      this.showError('Longitude must be between -180° and 180°');
      return false;
    }

    if (isNaN(location.elevation) || location.elevation < 0) {
      this.showError('Elevation must be a positive number');
      return false;
    }

    if (isNaN(location.timezone) || location.timezone < -12 || location.timezone > 14) {
      this.showError('Timezone must be between -12 and +14');
      return false;
    }

    return true;
  }

  handleCalculate() {
    const location = this.currentFormat === 'decimal' ? this.getDecimalLocation() : this.DMSToDecimal();

    if (!this.validateLocation(location)) {
      return;
    }

    const dateInput = document.getElementById('date-input');
    const date = new Date(dateInput.value);

    if (isNaN(date.getTime())) {
      this.showError('Please select a valid date');
      return;
    }

    // Emit calculate event
    this.dispatchEvent('calculate-hilal', {
      criteria: this.selectedCriteria,
      date: date,
      location: location
    });
  }

  setSelectedCriteria(criteria) {
    this.selectedCriteria = criteria;
    
    // Update radio buttons
    const radio = document.querySelector(`input[name="criteria"][value="${criteria}"]`);
    if (radio) {
      radio.checked = true;
    }

    // Update selected state
    document.querySelectorAll('.criteria-option').forEach(option => {
      option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`.criteria-option[data-criteria="${criteria}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }

    // Update description
    const descriptionEl = document.getElementById('criteria-description');
    if (descriptionEl) {
      descriptionEl.innerHTML = this.getCriteriaDescription(criteria);
    }
  }

  dispatchEvent(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <span class="toast-icon">⚠️</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">&times;</button>
    `;

    // Add event listener to close button (safe approach - no inline onclick)
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.remove();
      });
    }
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      max-width: 400px;
      animation: toastSlideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastFadeOut 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }
}

customElements.define('criteria-panel', CriteriaPanel);
