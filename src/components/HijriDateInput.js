// Hijri Date Input Component
// Allows user to select date using Hijri calendar (Tanggal Hijriyah)

import { i18n } from '../services/i18n.js';

export class HijriDateInput extends HTMLElement {
  constructor() {
    super();
    this.hijriYear = 1446;
    this.hijriMonth = 7; // Ramadan default
    this.hijriDay = 1;
    this.dateMode = 'gregorian'; // 'gregorian' or 'hijri'
    this.i18n = i18n;
  }

  connectedCallback() {
    // Set default to current Hijri date (approximate)
    this.setDefaultHijriDate();
    this.render();
    this.setupEventListeners();
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
        </div>
      </div>

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
      gregorianInput.value = new Date().toISOString().split('T')[0];
      gregorianInput.addEventListener('change', (e) => {
        this.dispatchGregorianDateChange(new Date(e.target.value));
      });
    }

    // Hijri day select
    const hijriDay = this.querySelector('#hijri-day');
    if (hijriDay) {
      hijriDay.addEventListener('change', (e) => {
        this.hijriDay = parseInt(e.target.value);
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
      });
    }

    // Hijri month select
    const hijriMonth = this.querySelector('#hijri-month');
    if (hijriMonth) {
      hijriMonth.addEventListener('change', (e) => {
        this.hijriMonth = parseInt(e.target.value);
        // Adjust day if it exceeds the month's max days
        if (this.hijriDay > 29) {
          this.hijriDay = 29;
          this.querySelector('#hijri-day').value = 29;
        }
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
      });
    }

    // Hijri year input
    const hijriYear = this.querySelector('#hijri-year');
    if (hijriYear) {
      hijriYear.addEventListener('change', (e) => {
        this.hijriYear = parseInt(e.target.value) || 1446;
        this.updateHijriDisplay();
        this.dispatchHijriDateChange();
      });
    }
  }

  setDateMode(mode) {
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

    // Dispatch initial date change
    if (mode === 'gregorian') {
      const gregorianInput = this.querySelector('#calc-date');
      if (gregorianInput) {
        this.dispatchGregorianDateChange(new Date(gregorianInput.value));
      }
    } else {
      this.dispatchHijriDateChange();
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
