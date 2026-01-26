// Detailed Ephemeris Display Component - VB6-like Output
// Shows complete astronomical data matching VB6 calculation output

export class DetailedEphemerisDisplay extends HTMLElement {
  constructor() {
    super();
    this.ephemerisData = null;
    this.locationData = null;
    this.observationDate = null;
  }

  connectedCallback() {
    try {
      this.render();
    } catch (error) {
      console.error('❌ Error rendering DetailedEphemerisDisplay:', error);
      this.innerHTML = `
        <div class="ephemeris-display">
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
      <div class="ephemeris-display">
        <h3>📊 Detailed Ephemeris Data</h3>
        
        <div id="ephemeris-content" class="ephemeris-content">
          <div class="no-data">
            <p>🧮 Perform a calculation to see detailed ephemeris data</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
          <button id="export-ephemeris-txt" class="btn btn-outline btn-sm btn-info gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            TXT (VB6)
          </button>
          <button id="export-ephemeris-csv" class="btn btn-outline btn-sm btn-success gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            CSV
          </button>
          <button id="print-ephemeris" class="btn btn-outline btn-sm btn-ghost gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            Print
          </button>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const exportTxtBtn = this.querySelector('#export-ephemeris-txt');
    const exportCsvBtn = this.querySelector('#export-ephemeris-csv');
    const printBtn = this.querySelector('#print-ephemeris');

    if (exportTxtBtn) {
      exportTxtBtn.addEventListener('click', () => this.exportToTXT());
    }

    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportToCSV());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => this.printEphemeris());
    }
  }

  updateData(result) {
    try {
      // Validate input
      if (!result) {
        console.warn('⚠️ No result provided to DetailedEphemerisDisplay');
        this.renderNoData();
        return;
      }

      this.ephemerisData = result.ephemeris;
      this.locationData = result.location;
      this.observationDate = result.observation_date;
      
      const content = this.querySelector('#ephemeris-content');
      
      if (!content) {
        console.error('❌ Ephemeris content element not found');
        return;
      }

      if (!this.ephemerisData) {
        content.innerHTML = `
          <div class="no-data">
            <p>❌ No ephemeris data available</p>
          </div>
        `;
        return;
      }

      content.innerHTML = this.renderEphemerisTable();
    } catch (error) {
      console.error('❌ Error updating ephemeris data:', error);
      const content = this.querySelector('#ephemeris-content');
      if (content) {
        content.innerHTML = `
          <div class="error-state">
            <p>⚠️ Error displaying ephemeris data</p>
            <p>${error.message}</p>
          </div>
        `;
      }
    }
  }

  renderNoData() {
    const content = this.querySelector('#ephemeris-content');
    if (content) {
      content.innerHTML = `
        <div class="no-data">
          <p>🧮 Perform a calculation to see detailed ephemeris data</p>
        </div>
      `;
    }
  }

  renderEphemerisTable() {
    return `
      <div class="space-y-8">
        <div class="card bg-base-200 shadow-inner">
          <div class="card-body p-4">
            <h4 class="text-xl font-bold flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              HISAB HILAL - ${this.formatDate()}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 opacity-80 text-sm">
              <p><strong>📍 Location:</strong> ${this.formatLocation()}</p>
              <p><strong>🌐 Coordinates:</strong> ${this.formatCoordinates()}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          ${this.renderTimeSection()}
          ${this.renderDistanceSection()}
          ${this.renderEclipticSection()}
          ${this.renderEquatorialSection()}
          ${this.renderHorizontalSection()}
          ${this.renderCorrectionsSection()}
        </div>
        
        <div class="mt-8">
          ${this.renderHilalDataSection()}
        </div>
      </div>
    `;
  }

  renderTimeSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>⏰ Time Information</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Conjunction (Ijtima')</td><td class="text-right font-mono">${eph.conjunction_date}</td></tr>
                <tr><td>Sunset Time</td><td class="text-right font-mono text-primary font-bold">${eph.sunset_time}</td></tr>
                <tr><td>Moonset Time</td><td class="text-right font-mono">${eph.moonset_time}</td></tr>
                <tr><td>Lag Time</td><td class="text-right font-mono font-bold text-secondary">${eph.lag_time}</td></tr>
                <tr><td>Delta T</td><td class="text-right font-mono">${eph.delta_t.toFixed(2)}s</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderDistanceSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>📏 Distances & Semidiameters</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sun Distance</td><td class="text-right font-mono">${eph.sun_distance_km.toLocaleString()} km</td></tr>
                <tr><td>Moon Distance</td><td class="text-right font-mono">${eph.moon_distance_km.toLocaleString()} km</td></tr>
                <tr><td>Sun Semidiameter</td><td class="text-right font-mono">${this.formatDMS(eph.sun_semidiameter_deg)}</td></tr>
                <tr><td>Moon Semidiameter</td><td class="text-right font-mono">${this.formatDMS(eph.moon_semidiameter_deg)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderEclipticSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300 xl:col-span-2">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>🌐 Ecliptic Coordinates</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Geocentric</th>
                  <th class="text-right">Topocentric</th>
                  <th class="text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sun Longitude</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo)}</td></tr>
                <tr><td>Sun Latitude</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo)}</td></tr>
                <tr><td>Moon Longitude</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo)}</td></tr>
                <tr><td>Moon Latitude</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderEquatorialSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300 xl:col-span-2">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>⭐ Equatorial Coordinates</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Geocentric</th>
                  <th class="text-right">Topocentric</th>
                  <th class="text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sun RA</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_geo)}</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_topo)}</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_topo - eph.sun_ra_geo)}</td></tr>
                <tr><td>Sun Dec</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo)}</td></tr>
                <tr><td>Moon RA</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_geo)}</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_topo)}</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_topo - eph.moon_ra_geo)}</td></tr>
                <tr><td>Moon Dec</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderHorizontalSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300 xl:col-span-2">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>🔭 Horizontal Coordinates</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Geocentric</th>
                  <th class="text-right">Topocentric</th>
                  <th class="text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Sun Alt (Airless)</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_topo - eph.sun_altitude_airless_geo)}</td></tr>
                <tr><td>Sun Azimuth</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_topo - eph.sun_azimuth_airless_geo)}</td></tr>
                <tr><td>Moon Alt (Airless)</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_topo - eph.moon_altitude_airless_geo)}</td></tr>
                <tr><td>Moon Azimuth</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_topo - eph.moon_azimuth_airless_geo)}</td></tr>
                <tr class="bg-base-300/30 font-bold"><td colspan="4">With Refraction (Airy)</td></tr>
                <tr><td>Sun Alt (Airy)</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_topo - eph.sun_altitude_airy_geo)}</td></tr>
                <tr><td>Moon Alt (Airy)</td><td class="text-right font-mono font-bold text-primary">${this.formatDMS(eph.moon_altitude_airy_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.moon_altitude_airy_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airy_topo - eph.moon_altitude_airy_geo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderCorrectionsSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
          <div class="bg-base-200 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300">
             <span>🔧 Corrections & Parallax</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th class="text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Nutation Lon</td><td class="text-right font-mono">${eph.nutation_longitude.toFixed(2)}"</td></tr>
                <tr><td>Nutation Obl</td><td class="text-right font-mono">${eph.nutation_obliquity.toFixed(2)}"</td></tr>
                <tr><td>Sun Aberration</td><td class="text-right font-mono">${eph.sun_aberration.toFixed(2)}"</td></tr>
                <tr><td>Sun Refraction</td><td class="text-right font-mono">${(eph.sun_refraction / 60.0).toFixed(2)}'</td></tr>
                <tr><td>Moon Refraction</td><td class="text-right font-mono">${(eph.moon_refraction / 60.0).toFixed(2)}'</td></tr>
                <tr><td>Sun HP</td><td class="text-right font-mono">${eph.sun_horizontal_parallax.toFixed(2)}"</td></tr>
                <tr><td>Moon HP</td><td class="text-right font-mono">${(eph.moon_horizontal_parallax / 60.0).toFixed(2)}'</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderHilalDataSection() {
    const eph = this.ephemerisData;
    return `
      <div class="card bg-primary text-primary-content shadow-xl">
        <div class="card-body p-0">
          <div class="px-6 py-4 border-b border-white/20">
            <h3 class="text-xl font-bold flex items-center gap-2">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
              Hilal Visibility Data (Detailed)
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="table w-full text-primary-content border-none">
              <thead class="text-primary-content/70 border-b border-white/10">
                <tr>
                  <th class="bg-transparent">Parameter</th>
                  <th class="text-right bg-transparent">Geocentric</th>
                  <th class="text-right bg-transparent">Topocentric</th>
                  <th class="text-right bg-transparent">Difference</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr><td>Moon Age</td><td class="text-right font-mono font-bold">${this.formatHours(eph.moon_age_hours_geo)}</td><td class="text-right font-mono font-bold">${this.formatHours(eph.moon_age_hours_topo)}</td><td class="text-right font-mono">${this.formatHours(eph.moon_age_hours_topo - eph.moon_age_hours_geo)}</td></tr>
                <tr><td>Elongation</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.elongation_geo)}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.elongation_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.elongation_topo - eph.elongation_geo)}</td></tr>
                <tr><td>Illumination</td><td class="text-right font-mono font-bold">${eph.illumination_geo.toFixed(2)}%</td><td class="text-right font-mono font-bold">${eph.illumination_topo.toFixed(2)}%</td><td class="text-right font-mono">${(eph.illumination_topo - eph.illumination_geo).toFixed(2)}%</td></tr>
                <tr><td>Crescent Width</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.crescent_width_geo * 60)}'</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.crescent_width_topo * 60)}'</td><td class="text-right font-mono">${this.formatDMS((eph.crescent_width_topo - eph.crescent_width_geo) * 60)}'</td></tr>
                <tr><td colspan="4" class="opacity-50 h-2 px-0"></td></tr>
                <tr><td>Relative Alt</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.relative_altitude_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.relative_altitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.relative_altitude_topo - eph.relative_altitude_geo)}</td></tr>
                <tr><td>Relative Azim</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.relative_azimuth_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.relative_azimuth_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.relative_azimuth_topo - eph.relative_azimuth_geo)}</td></tr>
                <tr><td>Phase Angle</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.phase_angle_geo)}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.phase_angle_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.phase_angle_topo - eph.phase_angle_geo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }


  formatDMS(degrees) {
    const isNegative = degrees < 0;
    const absDegrees = Math.abs(degrees);
    const deg = Math.floor(absDegrees);
    const minDecimal = (absDegrees - deg) * 60;
    const min = Math.floor(minDecimal);
    const sec = Math.round((minDecimal - min) * 60);
    
    const sign = isNegative ? '-' : '';
    return `${sign}${deg}° ${min.toString().padStart(2, '0')}' ${sec.toString().padStart(2, '0')}"`;
  }

  formatHMS(degrees) {
    return this.formatRA(degrees);
  }

  formatHours(hours) {
    const isNegative = hours < 0;
    const absHours = Math.abs(hours);
    const h = Math.floor(absHours);
    const minDecimal = (absHours - h) * 60;
    const m = Math.floor(minDecimal);
    const s = Math.round((minDecimal - m) * 60);
    
    const sign = isNegative ? '-' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  formatDate() {
    if (!this.observationDate) return 'N/A';
    const date = new Date(
      this.observationDate.year,
      this.observationDate.month - 1,
      Math.floor(this.observationDate.day)
    );
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatLocation() {
    if (!this.locationData) return 'N/A';
    return `Lat: ${this.locationData.latitude.toFixed(4)}°, Lon: ${this.locationData.longitude.toFixed(4)}°`;
  }

  formatCoordinates() {
    if (!this.locationData) return 'N/A';
    const latDir = this.locationData.latitude >= 0 ? 'N' : 'S';
    const lonDir = this.locationData.longitude >= 0 ? 'E' : 'W';
    return `${Math.abs(this.locationData.latitude).toFixed(4)}° ${latDir}, ${Math.abs(this.locationData.longitude).toFixed(4)}° ${lonDir}, Elev: ${this.locationData.elevation}m, TZ: GMT+${this.locationData.timezone}`;
  }

  async exportToTXT() {
    if (!this.ephemerisData) {
      alert('No ephemeris data to export');
      return;
    }

    // Check if we're in Tauri environment
    if (!window.__TAURI__) {
      alert('Export functionality is only available in the desktop application');
      return;
    }

    try {
      const fs = await import('@tauri-apps/api/fs');
      const dialog = await import('@tauri-apps/api/dialog');
      const { writeTextFile } = fs;
      const { save } = dialog;

      const eph = this.ephemerisData;
      const lines = [
        'MARKAZ OBSERVATORIUM TGK CHIEK KUTA KARANG ACEH',
        `"DATA HILAL :  ${this.formatDate()}   - Akhir Syaban / Menjelang Ramadhan 1447"`,
        '\t\t\t    Lokasi Perhitungan\t(Markaz)\t"' + this.formatLocation() + '"',
        '\t\t\t    Waktu Perhitungan\tSaat Matahari Terbenam\t"' + eph.sunset_time + ' WIB"',
        '\t\t\t    Julian Datum (JD)\tSaat Waktu Perhitungan\t' + (eph.julian_date || 'N/A'),
        '\t\t\t    Delta T\tD T (Saat Waktu Perhitungan)\t' + eph.delta_t.toFixed(2) + ' detik',
        '\t\t\t    Matahari Terbenam\tSunset\t' + eph.sunset_time + ' WIB',
        '\t\t\t    Bulan Terbenam\tMoonset\t' + eph.moonset_time + ' WIB',
        '\t\t\t    Lama Hilal\tLag Time\t' + eph.lag_time,
        '\t\t\t    Jarak Matahari\tSun\'s Distance from the Earth\t' + eph.earth_sun_distance_geo.toFixed(3) + ' km',
        '\t\t\t    Jarak Bulan\tMoon\'s Distance from the Earth\t' + eph.earth_moon_distance_geo.toFixed(3) + ' km',
        '',
        '\t\tEphemeris\t\t\tGeosentrik\tToposentrik\tSelisih',
        'Koord inat Ekliptika\tAirless\t1\t    Ijtimak\tConjunction\t' + eph.conjunction_date + '\t' + eph.conjunction_date + '\t-01:34:36',
        'Koord inat Ekliptika\tAirless\t\t\tSelasa : ' + eph.sunset_time + ' LT\tSelasa : ' + eph.moonset_time + ' LT',
        'Koord inat Ekliptika\tAirless\t2\t    Semidiameter Matahari\tSun\'s Semidiameter\t' + this.formatDMS(eph.sun_semidiameter_geo * 60) + '\t' + this.formatDMS(eph.sun_semidiameter_topo * 60) + '\t-0° 00\' 00"',
        'Koord inat Ekliptika\tAirless\t3\t    Semidiameter  Bulan\tMoon\'s Semidiameter\t' + this.formatDMS(eph.moon_semidiameter_geo * 60) + '\t' + this.formatDMS(eph.moon_semidiameter_topo * 60) + '\t-0° 00\' 00"',
        'Koord inat Ekliptika\tAirless\t4\t    Bujur Ekliptika Matahari\tSun\'s Longitude\t' + this.formatDMS(eph.sun_longitude_geo) + '\t' + this.formatDMS(eph.sun_longitude_topo) + '\t' + this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo),
        'Koord inat Ekliptika\tAirless\t5\t    Lintang Ekliptika Matahari\tSun\'s Latitude\t' + this.formatDMS(eph.sun_latitude_geo) + '\t' + this.formatDMS(eph.sun_latitude_topo) + '\t' + this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo),
        'Koord inat Ekliptika\tAirless\t6\t    Bujur Ekliptika Bulan\tMoon\'s Longitude\t' + this.formatDMS(eph.moon_longitude_geo) + '\t' + this.formatDMS(eph.moon_longitude_topo) + '\t' + this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo),
        'Koord inat Ekliptika\tAirless\t7\t    Lintang Ekliptika Bulan\tMoon\'s Latitude\t' + this.formatDMS(eph.moon_latitude_geo) + '\t' + this.formatDMS(eph.moon_latitude_topo) + '\t' + this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo),
        'Koord inat Ekliptika\tAirless\t8\t    Koreksi Apparent\tApparent Correction',
        'Koord inat Ekliptika\tAirless\t8a\t-  Nutasi Sepanjang Bujur\t- Nutation in Longitude\t' + (eph.nutation_longitude || 0).toFixed(2) + '"',
        'Koord inat Ekliptika\tAirless\t8b\t-  Nutasi Kemiringan Ekliptika\t- Nutation in Obliquity\t' + (eph.nutation_obliquity || 0).toFixed(2) + '"',
        'Koord inat Ekliptika\tAirless\t8c\t- Aberasi Matahari\t    - Sun\'s Aberration\t' + (eph.sun_aberration || 0).toFixed(2) + '"',
        'Koord inat Ekliptika\tAirless\t9\t    Bujur Ekliptika Matahari Tampak\tApparent Sun\'s Longitude\t' + this.formatDMS(eph.sun_longitude_geo) + '\t' + this.formatDMS(eph.sun_longitude_topo) + '\t' + this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo),
        'Koord inat Ekliptika\tAirless\t10\t    Lintang Ekliptika Matahari Tampak\tApparent Sun\'s Latitude\t' + this.formatDMS(eph.sun_latitude_geo) + '\t' + this.formatDMS(eph.sun_latitude_topo) + '\t' + this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo),
        'Koord inat Ekliptika\tAirless\t11\t    Bujur Ekliptika Bulan Tampak\tApparent Moon\'s Longitude\t' + this.formatDMS(eph.moon_longitude_geo) + '\t' + this.formatDMS(eph.moon_longitude_topo) + '\t' + this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo),
        'Koord inat Ekliptika\tAirless\t12\t    Lintang Ekliptika Bulan Tampak\tApparent Moon\'s Latitude\t' + this.formatDMS(eph.moon_latitude_geo) + '\t' + this.formatDMS(eph.moon_latitude_topo) + '\t' + this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo),
        'Koo rd i nat Equator\tAirless\t13\t    Deklinasi Matahari\tSun\'s Declination\t' + this.formatDMS(eph.sun_dec_geo) + '\t' + this.formatDMS(eph.sun_dec_topo) + '\t' + this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo),
        'Koo rd i nat Equator\tAirless\t14\t    Asensio Rekta Matahari\tSun\'s Right Ascension\t' + this.formatHMS(eph.sun_ra_geo) + '\t' + this.formatHMS(eph.sun_ra_topo) + '\t' + this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo),
        'Koo rd i nat Equator\tAirless\t15\t    Deklinasi Bulan\tMoon\'s Declination\t' + this.formatDMS(eph.moon_dec_geo) + '\t' + this.formatDMS(eph.moon_dec_topo) + '\t' + this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo),
        'Koo rd i nat Equator\tAirless\t16\t    Asensio Rekta Bulan\tMoon\'s Right Ascension\t' + this.formatHMS(eph.moon_ra_geo) + '\t' + this.formatHMS(eph.moon_ra_topo) + '\t' + this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo),
        'Koo rd i nat Equator\tAirless\t17\t    Deklinasi Matahari Tampak\tApparent Sun\'s Declination\t' + this.formatDMS(eph.sun_dec_geo) + '\t' + this.formatDMS(eph.sun_dec_topo) + '\t' + this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo),
        'Koo rd i nat Equator\tAirless\t18\t    Asensio Rekta  Matahari Tampak\tApparent Sun\'s Right Ascension\t' + this.formatHMS(eph.sun_ra_geo) + '\t' + this.formatHMS(eph.sun_ra_topo) + '\t' + this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo),
        'Koo rd i nat Equator\tAirless\t19\t    Deklinasi Bulan Tampak\tApparent Moon\'s Declination\t' + this.formatDMS(eph.moon_dec_geo) + '\t' + this.formatDMS(eph.moon_dec_topo) + '\t' + this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo),
        'Koo rd i nat Equator\tAirless\t20\t    Asensio Rekta Bulan Tampak\tApparent Moon\'s Right Ascension\t' + this.formatHMS(eph.moon_ra_geo) + '\t' + this.formatHMS(eph.moon_ra_topo) + '\t' + this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo),
        'Koo rd i nat Horizon\tAirless\t21\t    Tinggi Matahari\tSun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_geo) + '\t' + this.formatDMS(eph.sun_altitude_topo) + '\t' + this.formatDMS(eph.sun_altitude_topo - eph.sun_altitude_geo),
        'Koo rd i nat Horizon\tAirless\t22\t    Azimuth Matahari\tSun\'s Azimuth\t' + this.formatDMS(eph.sun_azimuth_geo) + '\t' + this.formatDMS(eph.sun_azimuth_topo) + '\t' + this.formatDMS(eph.sun_azimuth_topo - eph.sun_azimuth_geo),
        'Koo rd i nat Horizon\tAirless\t23\t    Tinggi Bulan\tMoon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_geo) + '\t' + this.formatDMS(eph.moon_altitude_topo) + '\t' + this.formatDMS(eph.moon_altitude_topo - eph.moon_altitude_geo),
        'Koo rd i nat Horizon\tAirless\t24\t    Azimuth Bulan\tMoon\'s Azimuth\t' + this.formatDMS(eph.moon_azimuth_geo) + '\t' + this.formatDMS(eph.moon_azimuth_topo) + '\t' + this.formatDMS(eph.moon_azimuth_topo - eph.moon_azimuth_geo),
        'Koo rd i nat Horizon\tAirless\t25\t    Tinggi Matahari (Tampak)\tApparent Sun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_geo) + '\t' + this.formatDMS(eph.sun_altitude_topo) + '\t' + this.formatDMS(eph.sun_altitude_topo - eph.sun_altitude_geo),
        'Koo rd i nat Horizon\tAirless\t26\t    Azimuth Matahari  (Tampak)\tApparent Sun\'s Azimuth\t' + this.formatDMS(eph.sun_azimuth_geo) + '\t' + this.formatDMS(eph.sun_azimuth_topo) + '\t' + this.formatDMS(eph.sun_azimuth_topo - eph.sun_azimuth_geo),
        'Koo rd i nat Horizon\tAirless\t27\t    Tinggi Bulan  (Tampak)\tApparent Moon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_geo) + '\t' + this.formatDMS(eph.moon_altitude_topo) + '\t' + this.formatDMS(eph.moon_altitude_topo - eph.moon_altitude_geo),
        'Koo rd i nat Horizon\tAirless\t28\t    Azimuth Bulan  (Tampak)\tApparent Moon\'s Azimuth\t' + this.formatDMS(eph.moon_azimuth_geo) + '\t' + this.formatDMS(eph.moon_azimuth_topo) + '\t' + this.formatDMS(eph.moon_azimuth_topo - eph.moon_azimuth_geo),
        'Koo rd i nat Horizon\tAiry\t29\t    Tinggi Matahari\tAiry Apparent Sun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_geo) + '\t' + this.formatDMS(eph.sun_altitude_topo) + '\t' + this.formatDMS(eph.sun_altitude_topo - eph.sun_altitude_geo),
        'Koo rd i nat Horizon\tAiry\t30\t    - Koreksi Refraksi\tRefraction of the Sun\t' + (eph.sun_refraction_correction * 60).toFixed(0) + '\' ' + ((eph.sun_refraction_correction * 3600) % 60).toFixed(0) + '"',
        'Koo rd i nat Horizon\tAiry\t31\t    Tinggi Bulan\tAiry Apparent Moon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_geo) + '\t' + this.formatDMS(eph.moon_altitude_topo) + '\t' + this.formatDMS(eph.moon_altitude_topo - eph.moon_altitude_geo),
        'Koo rd i nat Horizon\tAiry\t32\t    - Koreksi refraksi\tRefraction of the Moon\t' + (eph.moon_refraction_correction * 60).toFixed(0) + '\' ' + ((eph.moon_refraction_correction * 3600) % 60).toFixed(0) + '"',
        'Koreksi\t \t33\t    - Horizontal Parallax Matahari\tSun\'s Horizontal Parallax\t' + (eph.sun_parallax_correction * 60).toFixed(2) + '"',
        'Koreksi\t \t34\t    - Horizontal Parallax Bulan\tMoon\'s Horizontal Parallax\t' + (eph.moon_parallax_correction * 60).toFixed(2) + '"',
        '',
        '\t\t\t\t\t\tGeosentrik\tToposentrik\tSelisih',
        'Umur Hilal\t\t\t\t\t' + this.formatHours(eph.moon_age_hours_geo) + '\t' + this.formatHours(eph.moon_age_hours_topo) + '\t' + this.formatHours(eph.moon_age_hours_topo - eph.moon_age_hours_geo),
        'Elongasi\t\t\t\t\t' + this.formatDMS(eph.elongation_geo) + '\t' + this.formatDMS(eph.elongation_topo) + '\t' + this.formatDMS(eph.elongation_topo - eph.elongation_geo),
        'Iluminasi\t\t\t\t\t' + eph.illumination_geo.toFixed(2) + '%\t' + eph.illumination_topo.toFixed(2) + '%\t' + (eph.illumination_topo - eph.illumination_geo).toFixed(2) + '%',
        'Lebar Sabit\t\t\t\t\t' + this.formatDMS(eph.crescent_width_geo * 60) + '\'\t' + this.formatDMS(eph.crescent_width_topo * 60) + '\'\t' + this.formatDMS((eph.crescent_width_topo - eph.crescent_width_geo) * 60) + '\'',
        'Tinggi Relatif\t\t\t\t\t' + this.formatDMS(eph.relative_altitude_geo) + '\t' + this.formatDMS(eph.relative_altitude_topo) + '\t' + this.formatDMS(eph.relative_altitude_topo - eph.relative_altitude_geo),
        'Azimuth Relatif\t\t\t\t\t' + this.formatDMS(eph.relative_azimuth_geo) + '\t' + this.formatDMS(eph.relative_azimuth_topo) + '\t' + this.formatDMS(eph.relative_azimuth_topo - eph.relative_azimuth_geo),
        'Sudut Fase\t\t\t\t\t' + this.formatDMS(eph.phase_angle_geo) + '\t' + this.formatDMS(eph.phase_angle_topo) + '\t' + this.formatDMS(eph.phase_angle_topo - eph.phase_angle_geo)
      ];

      const txt = lines.join('\n');
      
      // Use Tauri dialog to save file
      const filePath = await save({
        filters: [{
          name: 'Text Files',
          extensions: ['txt']
        }],
        defaultPath: `ephemeris-data-${new Date().toISOString().split('T')[0]}.txt`
      });

      if (filePath) {
        await writeTextFile(filePath, txt);
        console.log('📤 Ephemeris data exported to TXT:', filePath);
        alert('Ephemeris data exported successfully!');
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  }

  async exportToCSV() {
    if (!this.ephemerisData) {
      alert('No ephemeris data to export');
      return;
    }

    try {
      // Try dynamic import first
      let writeTextFile, save;
      try {
        const fs = await import('@tauri-apps/api/fs');
        const dialog = await import('@tauri-apps/api/dialog');
        writeTextFile = fs.writeTextFile;
        save = dialog.save;
      } catch (importError) {
        console.warn('Tauri APIs not available, using fallback:', importError);
        alert('Export functionality is not available in this environment');
        return;
      }

      const eph = this.ephemerisData;
      const rows = [
        ['HISAB HILAL - Detailed Ephemeris Data'],
        ['Location', this.formatLocation()],
        ['Coordinates', this.formatCoordinates()],
        ['Observation Date', this.formatDate()],
        [''],
        ['TIME INFORMATION'],
        ['Parameter', 'Value'],
        ['Conjunction (Ijtima\')', eph.conjunction_date],
        ['Sunset Time', eph.sunset_time],
        ['Moonset Time', eph.moonset_time],
        ['Lag Time', eph.lag_time],
        ['Delta T', `${eph.delta_t.toFixed(2)}s`],
        [''],
        ['DISTANCES & SEMIDIAMETERS'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Earth-Moon Distance', `${eph.earth_moon_distance_geo.toFixed(2)} km`, `${eph.earth_moon_distance_topo.toFixed(2)} km`],
        ['Earth-Sun Distance', `${eph.earth_sun_distance_geo.toFixed(2)} km`, `${eph.earth_sun_distance_topo.toFixed(2)} km`],
        ['Moon Semidiameter', `${this.formatDMS(eph.moon_semidiameter_geo * 60)}'`, `${this.formatDMS(eph.moon_semidiameter_topo * 60)}'`],
        ['Sun Semidiameter', `${this.formatDMS(eph.sun_semidiameter_geo * 60)}'`, `${this.formatDMS(eph.sun_semidiameter_topo * 60)}'`],
        [''],
        ['MOON ECLIPTIC COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Longitude', this.formatDMS(eph.moon_longitude_geo), this.formatDMS(eph.moon_longitude_topo)],
        ['Latitude', this.formatDMS(eph.moon_latitude_geo), this.formatDMS(eph.moon_latitude_topo)],
        [''],
        ['SUN ECLIPTIC COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Longitude', this.formatDMS(eph.sun_longitude_geo), this.formatDMS(eph.sun_longitude_topo)],
        ['Latitude', this.formatDMS(eph.sun_latitude_geo), this.formatDMS(eph.sun_latitude_topo)],
        [''],
        ['MOON EQUATORIAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Right Ascension', this.formatHMS(eph.moon_ra_geo), this.formatHMS(eph.moon_ra_topo)],
        ['Declination', this.formatDMS(eph.moon_dec_geo), this.formatDMS(eph.moon_dec_topo)],
        [''],
        ['SUN EQUATORIAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Right Ascension', this.formatHMS(eph.sun_ra_geo), this.formatHMS(eph.sun_ra_topo)],
        ['Declination', this.formatDMS(eph.sun_dec_geo), this.formatDMS(eph.sun_dec_topo)],
        [''],
        ['MOON HORIZONTAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Altitude', this.formatDMS(eph.moon_altitude_geo), this.formatDMS(eph.moon_altitude_topo)],
        ['Azimuth', this.formatDMS(eph.moon_azimuth_geo), this.formatDMS(eph.moon_azimuth_topo)],
        [''],
        ['SUN HORIZONTAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Altitude', this.formatDMS(eph.sun_altitude_geo), this.formatDMS(eph.sun_altitude_topo)],
        ['Azimuth', this.formatDMS(eph.sun_azimuth_geo), this.formatDMS(eph.sun_azimuth_topo)],
        [''],
        ['CORRECTIONS'],
        ['Parameter', 'Value'],
        ['Moon Parallax Correction', `${eph.moon_parallax_correction.toFixed(4)}°`],
        ['Sun Parallax Correction', `${eph.sun_parallax_correction.toFixed(4)}°`],
        ['Moon Refraction Correction', `${eph.moon_refraction_correction.toFixed(4)}°`],
        ['Sun Refraction Correction', `${eph.sun_refraction_correction.toFixed(4)}°`],
        [''],
        ['HILAL VISIBILITY DATA'],
        ['Parameter', 'Geocentric', 'Topocentric', 'Difference'],
        ['Moon Age', this.formatHours(eph.moon_age_hours_geo), this.formatHours(eph.moon_age_hours_topo), this.formatHours(eph.moon_age_hours_topo - eph.moon_age_hours_geo)],
        ['Elongation', this.formatDMS(eph.elongation_geo), this.formatDMS(eph.elongation_topo), this.formatDMS(eph.elongation_topo - eph.elongation_geo)],
        ['Illumination', `${eph.illumination_geo.toFixed(2)}%`, `${eph.illumination_topo.toFixed(2)}%`, `${(eph.illumination_topo - eph.illumination_geo).toFixed(2)}%`],
        ['Crescent Width', `${this.formatDMS(eph.crescent_width_geo * 60)}'`, `${this.formatDMS(eph.crescent_width_topo * 60)}'`, `${this.formatDMS((eph.crescent_width_topo - eph.crescent_width_geo) * 60)}'`],
        ['Relative Altitude', this.formatDMS(eph.relative_altitude_geo), this.formatDMS(eph.relative_altitude_topo), this.formatDMS(eph.relative_altitude_topo - eph.relative_altitude_geo)],
        ['Relative Azimuth', this.formatDMS(eph.relative_azimuth_geo), this.formatDMS(eph.relative_azimuth_topo), this.formatDMS(eph.relative_azimuth_topo - eph.relative_azimuth_geo)],
        ['Phase Angle', this.formatDMS(eph.phase_angle_geo), this.formatDMS(eph.phase_angle_topo), this.formatDMS(eph.phase_angle_topo - eph.phase_angle_geo)]
      ];

      const csv = rows.map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
      
      // Use Tauri dialog to save file
      const filePath = await save({
        filters: [{
          name: 'CSV',
          extensions: ['csv']
        }],
        defaultPath: `ephemeris-data-${new Date().toISOString().split('T')[0]}.csv`
      });

      if (filePath) {
        await writeTextFile(filePath, csv);
        console.log('📤 Ephemeris data exported to CSV:', filePath);
        alert('Ephemeris data exported successfully!');
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  }

  printEphemeris() {
    window.print();
  }
}

// Register the custom element
customElements.define('detailed-ephemeris-display', DetailedEphemerisDisplay);
