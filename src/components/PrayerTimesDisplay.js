// Prayer Times Display Component
// Shows prayer times schedule

import { i18n } from '../services/i18n.js';

export class PrayerTimesDisplay extends HTMLElement {
  constructor() {
    super();
    this.prayerTimes = null;
    this.locationData = null;
    this.date = null;
    this.i18n = i18n;
  }

  connectedCallback() {
    this.render();
    this.setupLanguageChangeListener();
  }

  setupLanguageChangeListener() {
    window.addEventListener('language-changed', () => {
      console.log('🔄 PrayerTimesDisplay: Language changed, re-rendering');
      if (this.prayerTimes) {
        this.updateData(this.prayerTimes, this.locationData, this.date);
      } else {
        this.render();
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
      <div class="prayer-times-display">
        <div id="prayer-content" class="prayer-content">
          <div class="no-data flex flex-col items-center justify-center p-8 opacity-60">
            <svg class="w-12 h-12 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 20v-2l-2-2V9a8 8 0 0 0-16 0v7l-2 2v2"/><path d="M6 20h12"/><path d="M12 2v2"/><path d="M12 7v5"/></svg>
            <p>${this.t('messages.noData', 'Perform a calculation to see prayer times')}</p>
          </div>
        </div>
      </div>
    `;
  }

  updateData(times, location, date) {
    this.prayerTimes = times;
    this.locationData = location;
    this.date = date;
    
    const content = this.querySelector('#prayer-content');
    if (!content) return;

    if (!times) {
      this.renderNoData();
      return;
    }

    content.innerHTML = this.renderTable();
  }

  renderNoData() {
    const content = this.querySelector('#prayer-content');
    if (content) {
      content.innerHTML = `
        <div class="no-data flex flex-col items-center justify-center p-8 opacity-60">
          <svg class="w-12 h-12 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 20v-2l-2-2V9a8 8 0 0 0-16 0v7l-2 2v2"/><path d="M6 20h12"/><path d="M12 2v2"/><path d="M12 7v5"/></svg>
          <p>${this.t('messages.noData', 'Perform a calculation to see prayer times')}</p>
        </div>
      `;
    }
  }

  renderTable() {
    // Order of prayers to display - using translation keys
    const order = [
      { key: 'imsak', label: this.t('prayerTimes.imsak', 'Imsak'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
      { key: 'shubuh', label: this.t('prayerTimes.shubuh', 'Shubuh'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
      { key: 'syuruq', label: this.t('prayerTimes.terbit', 'Terbit'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
      { key: 'dhuha', label: this.t('prayerTimes.dhuha', 'Dhuha'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
      { key: 'dzuhur', label: this.t('prayerTimes.dzuhur', 'Dzuhur'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
      { key: 'ashr', label: this.t('prayerTimes.ashr', 'Ashr'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
      { key: 'maghrib', label: this.t('prayerTimes.maghrib', 'Maghrib'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>' },
      { key: 'isya', label: this.t('prayerTimes.isya', 'Isya'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' },
      { key: 'tengah_malam', label: this.t('prayerTimes.tengahMalam', 'Tengah Malam'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 1 0 10 10"/></svg>' },
      { key: 'p3_malam', label: this.t('prayerTimes.p3Malam', '1/3 Akhir Malam'), icon: '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' }
    ];
    
    const locale = this.i18n.getLocale();
    const dateStr = this.date ? new Date(this.date).toLocaleDateString(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';

    // Get Hari Jawa (Javanese day name) from backend
    const hariJawa = this.prayerTimes.day_name || '';

    return `
      <div class="prayer-schedule">
        <div class="schedule-header">
          <h4>${this.t('prayerTimes.title', 'Prayer Schedule')}</h4>
          <p class="date-display">${dateStr}</p>
          ${hariJawa ? `<p class="hari-jawa">${hariJawa}</p>` : ''}
          <small>${this.formatLocation()}</small>
        </div>

        <div class="prayer-list">
          ${order.map(item => {
            const time = this.prayerTimes[item.key] || '--:--';
            return `
              <div class="prayer-item ${item.key}">
                <div class="prayer-label">
                  <span class="prayer-icon">${item.icon}</span>
                  <span>${item.label}</span>
                </div>
                <div class="prayer-time">${time}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <style>
        .prayer-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 15px;
        }
        .prayer-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #ddd;
          transition: transform 0.2s;
        }
        .prayer-item:hover {
          transform: translateX(2px);
          background: #f1f3f5;
        }
        .prayer-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          color: #495057;
        }
        .prayer-time {
          font-family: monospace;
          font-weight: bold;
          font-size: 1.1em;
          color: #212529;
        }
        /* Color coding for prayers */
        .prayer-item.shubuh { border-left-color: #4dabf7; }
        .prayer-item.dzuhur { border-left-color: #ffd43b; }
        .prayer-item.ashr { border-left-color: #ff922b; }
        .prayer-item.maghrib { border-left-color: #fa5252; }
        .prayer-item.isya { border-left-color: #5c7cfa; }

        /* Hari Jawa styling */
        .hari-jawa {
          font-size: 1.1em;
          font-weight: 600;
          color: #5c7cfa;
          margin: 4px 0;
          padding: 6px 12px;
          background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
          border-radius: 6px;
          display: inline-block;
        }
        .date-display {
          color: #868e96;
        }
      </style>
    `;
  }
  
  formatLocation() {
    if (!this.locationData) return '';
    return `${this.t('labels.latitude', 'Lat')}: ${this.locationData.latitude.toFixed(4)}°, ${this.t('labels.longitude', 'Lon')}: ${this.locationData.longitude.toFixed(4)}°`;
  }
}

customElements.define('prayer-times-display', PrayerTimesDisplay);
