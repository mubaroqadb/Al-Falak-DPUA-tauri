// Hijri Date Input Component
// Allows user to select date using Hijri calendar (Tanggal Hijriyah)

import { i18n } from '../services/i18n.js';
import { HilalAPI, isTauri } from '../services/api.js';

export class HijriDateInput extends HTMLElement {
  constructor() {
    super();
    this.hijriYear = 1446;
    this.hijriMonth = 7; // Ramadan default
    this.hijriDay = 1;
    this.dateMode = 'gregorian'; // 'gregorian' or 'hijri'
    this.i18n = i18n;
    this.api = new HilalAPI();

    // Store converted dates for display
    this.convertedHijriDate = null;
    this.convertedGregorianDate = null;
    this.isConverting = false;

    // Track if event listeners have been set up to avoid duplicates
    this.eventListenersSetup = false;
  }

  async connectedCallback() {
    // Set default to current Hijri date (approximate)
    this.setDefaultHijriDate();
    this.render();
    this.setupEventListeners();

    // Initial conversion on load - only if Tauri is available
    if (isTauri()) {
      // Small delay to ensure DOM is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (this.dateMode === 'gregorian') {
        const gregorianInput = this.querySelector('#calc-date');
        if (gregorianInput && gregorianInput.value) {
          await this.convertGregorianToHijri(new Date(gregorianInput.value));
        }
      } else {
        await this.convertHijriToGregorian();
      }
    }
  }

  setDefaultHijriDate() {
    const now = new Date();
    // Approximate conversion - in production, use backend API
    const approximateHijriYear = 1446;
    const approximateHijriMonth = 7;
    const approximateHijriDay = Math.min(now.getDate(), 30);
    
    this.hijriYear = approximateHijriYear;
    this.hijriMonth = approximateHijriMonth;
    this.hijriDay = approximateHijriDay;
  }

  getHijriMonths() {
    return [
      { value: 1, label: 'Muharram', arabic: 'محرّم' },
      { value: 2, label: 'Safar', arabic: 'صفر' },
      { value: 3, label: 'Rabi\'ul Awal', arabic: 'ربيع الأول' },
      { value: 4, label: 'Rabi\'ul Akhir', arabic: 'ربيع الثاني' },
      { value: 5, label: 'Jumadil Awal', arabic: 'جمادى الأولى' },
      { value: 6, label: 'Jumadil Akhir', arabic: 'جمادى الثانية' },
      { value: 7, label: 'Rajab', arabic: 'رجب' },
      { value: 8, label: 'Sha\'ban', arabic: 'شعبان' },
      { value: 9, label: 'Ramadan', arabic: 'رمضان' },
      { value: 10, label: 'Syawwal', arabic: 'شوال' },
      { value: 11, label: 'Dzulqa\'dah', arabic: 'ذو القعدة' },
      { value: 12, label: 'Dzulhijjah', arabic: 'ذو الحجة' }
    ];
  }

  getLocalizedText(key) {
    if (this.i18n && this.i18n.t) {
      return this.i18n.t(key);
    }
    // Fallback to default values
    const fallback = {
      'hijriDate.gregorian': 'Gregorian',
      'hijriDate.hijri': 'Hijri',
      'hijriDate.day': 'Day',
      'hijriDate.month': 'Month',
      'hijriDate.year': 'Year',
      'labels.date': 'Calculation Date'
    };
    return fallback[key] || key;
  }

  render() {
    const months = this.getHijriMonths();
    const currentMonth = months.find(m => m.value === this.hijriMonth);
    const t = (key) => this.getLocalizedText(key);
    
    this.innerHTML = `
      <div class="hijri-date-input">
        <div class="date-mode-toggle">
          <button class="mode-btn ${this.dateMode === 'gregorian' ? 'active' : ''}" data-mode="gregorian">
            ${t('hijriDate.gregorian')}
          </button>
          <button class="mode-btn ${this.dateMode === 'hijri' ? 'active' : ''}" data-mode="hijri">
            ${t('hijriDate.hijri')}
          </button>
        </div>

        <div id="gregorian-input" class="date-input-section ${this.dateMode === 'gregorian' ? 'active' : ''}">
          <label for="calc-date">${t('labels.date')}</label>
          <input type="date" id="calc-date" class="date-input" />
        </div>

        <div id="hijri-input" class="date-input-section ${this.dateMode === 'hijri' ? 'active' : ''}">
          <label>${t('hijriDate.title')}</label>
          <div class="hijri-selectors">
            <div class="selector-group">
              <label for="hijri-day">${t('hijriDate.day')}</label>
              <select id="hijri-day" class="hijri-select">
                ${this.generateDayOptions()}
              </select>
            </div>
            <div class="selector-group">
              <label for="hijri-month">${t('hijriDate.month')}</label>
              <select id="hijri-month" class="hijri-select">
                ${months.map(m => `
                  <option value="${m.value}" ${m.value === this.hijriMonth ? 'selected' : ''}>
                    ${m.label} (${m.arabic})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="selector-group">
              <label for="hijri-year">${t('hijriDate.year')}</label>
              <input type="number" id="hijri-year" class="hijri-select hijri-year-input" 
                     value="${this.hijriYear}" min="1" max="9999" />
            </div>
          </div>
          <p class="hijri-date-display" id="hijri-date-display">
            ${this.hijriDay} ${currentMonth?.label || ''} ${this.hijriYear} ${t('hijriDate.arabicYearSuffix')}
          </p>
          ${this.renderConvertedDateDisplay()}
        </div>
      </div>
      ${this.renderDualDateDisplay()}

      <style>
        .hijri-date-input {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .date-mode-toggle {
          display: flex;
          gap: 8px;
          background: #f1f3f5;
          padding: 4px;
          border-radius: 8px;
        }

        .mode-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          color: #495057;
        }

        .mode-btn:hover {
          background: #e9ecef;
        }

        .mode-btn.active {
          background: white;
          color: #1971c2;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .date-input-section {
          display: none;
          flex-direction: column;
          gap: 8px;
        }

        .date-input-section.active {
          display: flex;
        }

        .date-input-section label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #495057;
        }

        .date-input {
          padding: 12px 16px;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
        }

        .date-input:focus {
          outline: none;
          border-color: #1971c2;
          box-shadow: 0 0 0 3px rgba(25, 113, 194, 0.1);
        }

        .hijri-selectors {
          display: flex;
          gap: 8px;
        }

        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .selector-group:first-child {
          flex: 0 0 70px;
        }

        .selector-group:nth-child(2) {
          flex: 1;
        }

        .selector-group:nth-child(3) {
          flex: 0 0 90px;
        }

        .selector-group label {
          font-size: 0.75rem;
          color: #868e96;
        }

        .hijri-select {
          padding: 10px 12px;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background: white;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .hijri-select:focus {
          outline: none;
          border-color: #1971c2;
        }

        .hijri-year-input {
          width: 100%;
        }

        .hijri-date-display {
          text-align: center;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1971c2;
          padding: 12px;
          background: #e7f5ff;
          border-radius: 8px;
          margin-top: 8px;
        }

        .converted-date-display {
          text-align: center;
          font-size: 0.9rem;
          color: #495057;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .conversion-label {
          font-size: 0.75rem;
          color: #868e96;
        }

        .converted-date {
          font-weight: 500;
          color: #1971c2;
        }

        .dual-date-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #e7f5ff 0%, #fff4e6 100%);
          border-radius: 12px;
          margin-top: 12px;
          position: relative;
        }

        .dual-date-display.converting {
          opacity: 0.7;
        }

        .date-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
        }

        .date-label {
          font-size: 0.75rem;
          color: #868e96;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-value {
          font-size: 1rem;
          font-weight: 600;
          color: #212529;
          text-align: center;
        }

        .hijri-box .date-value {
          color: #1971c2;
        }

        .gregorian-box .date-value {
          color: #e8590c;
        }

        .conversion-arrow {
          font-size: 1.5rem;
          color: #adb5bd;
          font-weight: 300;
        }

        .conversion-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
          color: #1971c2;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      </style>
    `;
  }

  generateDayOptions() {
    let options = '';
    for (let day = 1; day <= 30; day++) {
      options += `<option value="${day}" ${day === this.hijriDay ? 'selected' : ''}>${day}</option>`;
    }
    return options;
  }

  setupEventListeners() {
    // Only set up event listeners once to avoid duplicates
    if (this.eventListenersSetup) {
      return;
    }

    // Mode toggle buttons
    const modeButtons = this.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setDateMode(e.target.dataset.mode);
      });
    });

    // Gregorian date input
    const gregorianInput = this.querySelector('#calc-date');
    if (gregorianInput) {
      // Only set default value if input is empty (first initialization)
      if (!gregorianInput.value) {
        gregorianInput.value = new Date().toISOString().split('T')[0];
      }
      gregorianInput.addEventListener('change', async (e) => {
        // Prevent changes during conversion
        if (this.isConverting) {
          console.warn('Cannot change date during conversion');
          return;
        }
        const date = new Date(e.target.value);
        this.dispatchGregorianDateChange(date);
        // Convert to Hijri automatically
        await this.convertGregorianToHijri(date);
      });
    }

    // Hijri day select
    const hijriDay = this.querySelector('#hijri-day');
    if (hijriDay) {
      hijriDay.addEventListener('change', async (e) => {
        // Prevent changes during conversion
        if (this.isConverting) {
          console.warn('Cannot change date during conversion');
          return;
        }
        this.hijriDay = parseInt(e.target.value);
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
        // Convert to Gregorian automatically
        await this.convertHijriToGregorian();
      });
    }

    // Hijri month select
    const hijriMonth = this.querySelector('#hijri-month');
    if (hijriMonth) {
      hijriMonth.addEventListener('change', async (e) => {
        // Prevent changes during conversion
        if (this.isConverting) {
          console.warn('Cannot change date during conversion');
          return;
        }
        this.hijriMonth = parseInt(e.target.value);
        // Adjust day if it exceeds the month's max days
        if (this.hijriDay > 29) {
          this.hijriDay = 29;
          this.querySelector('#hijri-day').value = 29;
        }
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
        // Convert to Gregorian automatically
        await this.convertHijriToGregorian();
      });
    }

    // Hijri year input
    const hijriYear = this.querySelector('#hijri-year');
    if (hijriYear) {
      hijriYear.addEventListener('change', async (e) => {
        // Prevent changes during conversion
        if (this.isConverting) {
          console.warn('Cannot change date during conversion');
          return;
        }
        this.hijriYear = parseInt(e.target.value) || 1446;
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
        // Convert to Gregorian automatically
        await this.convertHijriToGregorian();
      });
    }

    this.eventListenersSetup = true;
  }

  setDateMode(mode) {
    // Prevent mode switching during conversion
    if (this.isConverting) {
      console.warn('Cannot switch date mode during conversion');
      return;
    }

    this.dateMode = mode;

    // Update toggle buttons
    const modeButtons = this.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide input sections
    const gregorianSection = this.querySelector('#gregorian-input');
    const hijriSection = this.querySelector('#hijri-input');
    gregorianSection?.classList.toggle('active', mode === 'gregorian');
    hijriSection?.classList.toggle('active', mode === 'hijri');

    // Dispatch mode change event
    this.dispatchEvent(new CustomEvent('date-mode-changed', {
      detail: { mode: this.dateMode }
    }));

    // Dispatch initial date change and convert
    if (mode === 'gregorian') {
      const gregorianInput = this.querySelector('#calc-date');
      if (gregorianInput && gregorianInput.value) {
        const date = new Date(gregorianInput.value);
        this.dispatchGregorianDateChange(date);
        this.convertGregorianToHijri(date);
      }
    } else {
      this.dispatchHijriDateChange();
      this.convertHijriToGregorian();
    }
  }

  updateHijriDisplay() {
    const months = this.getHijriMonths();
    const currentMonth = months.find(m => m.value === this.hijriMonth);
    const display = this.querySelector('#hijri-date-display');
    if (display) {
      display.textContent = `${this.hijriDay} ${currentMonth?.label || ''} ${this.hijriYear} H`;
    }
  }

  dispatchGregorianDateChange(date) {
    this.dispatchEvent(new CustomEvent('date-changed', {
      detail: { 
        date: date,
        mode: 'gregorian'
      }
    }));
  }

  dispatchHijriDateChange() {
    this.dispatchEvent(new CustomEvent('date-changed', {
      detail: {
        hijriYear: this.hijriYear,
        hijriMonth: this.hijriMonth,
        hijriDay: this.hijriDay,
        mode: 'hijri'
      }
    }));
  }

  // Render converted date display for Hijri input mode
  renderConvertedDateDisplay() {
    if (this.dateMode !== 'hijri' || !this.convertedGregorianDate) {
      return '';
    }
    const { year, month, day } = this.convertedGregorianDate;
    const gregorianDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return `
      <div class="converted-date-display">
        <span class="conversion-label">Bertepatan dengan:</span>
        <span class="converted-date">${gregorianDateStr} M</span>
      </div>
    `;
  }

  // Render dual date display showing both dates
  renderDualDateDisplay() {
    if (!this.convertedHijriDate && !this.convertedGregorianDate) {
      return '';
    }

    let hijriStr = '';
    let gregorianStr = '';

    if (this.convertedHijriDate) {
      const months = this.getHijriMonths();
      const monthName = months.find(m => m.value === this.convertedHijriDate.month)?.label || '';
      hijriStr = `${this.convertedHijriDate.day} ${monthName} ${this.convertedHijriDate.year} H`;
    } else if (this.dateMode === 'hijri') {
      const months = this.getHijriMonths();
      const monthName = months.find(m => m.value === this.hijriMonth)?.label || '';
      hijriStr = `${this.hijriDay} ${monthName} ${this.hijriYear} H`;
    }

    if (this.convertedGregorianDate) {
      const { year, month, day } = this.convertedGregorianDate;
      gregorianStr = `${day} ${this.getGregorianMonthName(month)} ${year} M`;
    }

    return `
      <div class="dual-date-display ${this.isConverting ? 'converting' : ''}">
        <div class="date-box hijri-box">
          <span class="date-label">Tanggal Hijriah</span>
          <span class="date-value">${hijriStr || '-'}</span>
        </div>
        <div class="conversion-arrow">⇄</div>
        <div class="date-box gregorian-box">
          <span class="date-label">Tanggal Masehi</span>
          <span class="date-value">${gregorianStr || '-'}</span>
        </div>
        ${this.isConverting ? '<div class="conversion-loading">Menghitung...</div>' : ''}
      </div>
    `;
  }

  getGregorianMonthName(month) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || '';
  }

  // Convert Hijri to Gregorian using API
  async convertHijriToGregorian() {
    if (!isTauri()) {
      console.warn('Cannot convert date - Tauri context not available');
      return;
    }

    this.isConverting = true;
    this.render();

    try {
      const result = await this.api.hijriToGregorian({
        year: this.hijriYear,
        month: this.hijriMonth,
        day: this.hijriDay
      });
      this.convertedGregorianDate = result;
      console.log('Converted Hijri to Gregorian:', this.hijriYear, this.hijriMonth, this.hijriDay, '->', result);
    } catch (error) {
      console.error('Failed to convert Hijri to Gregorian:', error);
      this.convertedGregorianDate = null;
    } finally {
      this.isConverting = false;
      this.render();
      // Don't call setupEventListeners() here - it's already set up once
    }
  }

  // Convert Gregorian to Hijri using API
  async convertGregorianToHijri(date) {
    if (!isTauri()) {
      console.warn('Cannot convert date - Tauri context not available');
      return;
    }

    this.isConverting = true;
    this.render();

    try {
      const result = await this.api.gregorianToHijri({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
      });
      this.convertedHijriDate = result;
      console.log('Converted Gregorian to Hijri:', date, '->', result);
    } catch (error) {
      console.error('Failed to convert Gregorian to Hijri:', error);
      this.convertedHijriDate = null;
    } finally {
      this.isConverting = false;
      this.render();
      // Don't call setupEventListeners() here - it's already set up once
    }
  }

  // Public methods for external control
  getDate() {
    if (this.dateMode === 'gregorian') {
      const input = this.querySelector('#calc-date');
      return input ? new Date(input.value) : new Date();
    } else {
      return {
        hijriYear: this.hijriYear,
        hijriMonth: this.hijriMonth,
        hijriDay: this.hijriDay
      };
    }
  }

  setDate(date) {
    if (date instanceof Date && !isNaN(date)) {
      this.setDateMode('gregorian');
      const input = this.querySelector('#calc-date');
      if (input) {
        input.value = date.toISOString().split('T')[0];
      }
    } else if (date.hijriYear) {
      this.setDateMode('hijri');
      this.hijriYear = date.hijriYear;
      this.hijriMonth = date.hijriMonth;
      this.hijriDay = date.hijriDay;
      
      // Update selects
      const daySelect = this.querySelector('#hijri-day');
      const monthSelect = this.querySelector('#hijri-month');
      const yearInput = this.querySelector('#hijri-year');
      
      if (daySelect) daySelect.value = this.hijriDay;
      if (monthSelect) monthSelect.value = this.hijriMonth;
      if (yearInput) yearInput.value = this.hijriYear;
      
      this.updateHijriDisplay();
    }
  }
}

customElements.define('hijri-date-input', HijriDateInput);
