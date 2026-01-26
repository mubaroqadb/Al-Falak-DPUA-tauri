// Prayer Times Display Component
// Shows prayer times schedule

export class PrayerTimesDisplay extends HTMLElement {
  constructor() {
    super();
    this.prayerTimes = null;
    this.locationData = null;
    this.date = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="prayer-times-display">
        <div id="prayer-content" class="prayer-content">
          <div class="no-data">
            <p>🕌 Perform a calculation to see prayer times</p>
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
        <div class="no-data">
          <p>🕌 Perform a calculation to see prayer times</p>
        </div>
      `;
    }
  }

  renderTable() {
    // Order of prayers to display
    const order = [
      { key: 'imsak', label: 'Imsak', icon: '🌌' },
      { key: 'shubuh', label: 'Shubuh', icon: '🌅' },
      { key: 'syuruq', label: 'Terbit (Syuruq)', icon: '🌄' },
      { key: 'dhuha', label: 'Dhuha', icon: '🌤️' },
      { key: 'dzuhur', label: 'Dzuhur', icon: '☀️' },
      { key: 'ashr', label: 'Ashr', icon: '🌥️' },
      { key: 'maghrib', label: 'Maghrib', icon: '🌇' },
      { key: 'isya', label: 'Isya', icon: 'cw' }, // cw? Maybe '🌃'
      { key: 'tengah_malam', label: 'Tengah Malam', icon: '🌑' },
      { key: 'p3_malam', label: '1/3 Akhir Malam', icon: '🌠' }
    ];
    
    const dateStr = this.date ? new Date(this.date).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';

    return `
      <div class="prayer-schedule">
        <div class="schedule-header">
          <h4>Jadwal Shalat</h4>
          <p>${dateStr}</p>
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
      </style>
    `;
  }
  
  formatLocation() {
    if (!this.locationData) return '';
    return `${this.locationData.latitude.toFixed(4)}°, ${this.locationData.longitude.toFixed(4)}°`;
  }
}

customElements.define('prayer-times-display', PrayerTimesDisplay);
