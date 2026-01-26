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

  formatRA(degrees) {
    // Convert degrees to hours (15 degrees = 1 hour)
    const hours = degrees / 15.0;
    const h = Math.floor(hours);
    const minDecimal = (hours - h) * 60;
    const m = Math.floor(minDecimal);
    const s = Math.round((minDecimal - m) * 60);
    
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
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

  exportToTXT() {
    // TODO: Implement TXT export matching VB6 format
    alert('TXT export will be implemented');
  }

  exportToCSV() {
    // TODO: Implement CSV export
    alert('CSV export will be implemented');
  }

  printEphemeris() {
    window.print();
  }
}

// Register the custom element
customElements.define('detailed-ephemeris-display', DetailedEphemerisDisplay);
