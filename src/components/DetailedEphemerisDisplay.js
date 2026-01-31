// Detailed Ephemeris Display Component - VB6-like Output
// Shows complete astronomical data matching VB6 calculation output

import { i18n } from '../services/i18n.js';

export class DetailedEphemerisDisplay extends HTMLElement {
  constructor() {
    super();
    this.ephemerisData = null;
    this.locationData = null;
    this.observationDate = null;
    this.i18n = i18n;
  }

  connectedCallback() {
    try {
      this.render();
      this.setupLanguageChangeListener();
    } catch (error) {
      console.error('❌ Error rendering DetailedEphemerisDisplay:', error);
      this.innerHTML = `
        <div class="ephemeris-display">
          <div class="error-state">
            <p><svg class="w-5 h-5 text-warning inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Failed to load component</p>
            <p>${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  setupLanguageChangeListener() {
    window.addEventListener('language-changed', () => {
      console.log('🔄 DetailedEphemerisDisplay: Language changed, re-rendering');
      if (this.ephemerisData) {
        this.renderEphemeris();
      }
    });
  }

  t(key, defaultValue = key) {
    if (this.i18n && this.i18n.t) {
      return this.i18n.t(key, defaultValue);
    }
    return defaultValue;
  }

  formatRA(degrees) {
    const isNegative = degrees < 0;
    const absDegrees = (Math.abs(degrees) + 360) % 360;
    const hours = absDegrees / 15;
    const h = Math.floor(hours);
    const minDecimal = (hours - h) * 60;
    const m = Math.floor(minDecimal);
    const s = ((minDecimal - m) * 60).toFixed(2);
    
    const sign = isNegative ? '-' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  render() {
    this.innerHTML = `
      <div class="ephemeris-display">
        <h3 class="flex items-center gap-2">
          <svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          ${this.t('tabLabels.ephemeris', 'Detailed Ephemeris Data')}
        </h3>
        
        <div id="ephemeris-content" class="ephemeris-content">
          <div class="no-data">
            <p><svg class="w-5 h-5 inline mr-1 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg> ${this.t('messages.noData', 'Perform a calculation to see detailed ephemeris data')}</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-base-300">
          <button id="export-ephemeris-txt" class="btn btn-outline btn-sm btn-info gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            ${this.t('export.saveTXT', 'Save TXT')}
          </button>
          <button id="export-ephemeris-csv" class="btn btn-outline btn-sm btn-success gap-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            ${this.t('export.saveCSV', 'Save CSV')}
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
            <p><svg class="w-5 h-5 text-error inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> No ephemeris data available</p>
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
          <p><svg class="w-5 h-5 inline mr-1 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg> Perform a calculation to see detailed ephemeris data</p>
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
              <svg class="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ${this.t('app.title', 'HISAB HILAL')} - ${this.formatDate()}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 opacity-80 text-sm">
              <p class="flex items-center gap-1">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <strong>${this.t('labels.location', 'Location')}:</strong> ${this.formatLocation()}
              </p>
              <p class="flex items-center gap-1">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <strong>${this.t('labels.coordinates', 'Coordinates')}:</strong> ${this.formatCoordinates()}
              </p>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>${this.t('ephemeris.timeInfo', 'Time Information')}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right">${this.t('ephemeris.value', 'Value')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>${this.t('results.conjunction', 'Conjunction (Ijtima\'')}</td><td class="text-right font-mono">${eph?.conjunction_date ?? 'N/A'}</td></tr>
                <tr><td>${this.t('results.sunsetTime', 'Sunset Time')}</td><td class="text-right font-mono text-primary font-bold">${eph?.sunset_time ?? 'N/A'}</td></tr>
                <tr><td>${this.t('results.moonsetTime', 'Moonset Time')}</td><td class="text-right font-mono">${eph?.moonset_time ?? 'N/A'}</td></tr>
                <tr><td>${this.t('results.lagTime', 'Lag Time')}</td><td class="text-right font-mono font-bold text-secondary">${eph?.lag_time ?? 'N/A'}</td></tr>
                <tr><td>${this.t('results.deltaT', 'Delta T')}</td><td class="text-right font-mono">${eph?.delta_t?.toFixed(2) ?? 'N/A'}s</td></tr>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>${this.t('ephemeris.distances', 'Distances & Semidiameters')}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right">${this.t('ephemeris.value', 'Value')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>${this.t('results.sunDistance', 'Sun Distance')}</td><td class="text-right font-mono">${eph.sun_distance_km.toLocaleString()} km</td></tr>
                <tr><td>${this.t('results.moonDistance', 'Moon Distance')}</td><td class="text-right font-mono">${eph.moon_distance_km.toLocaleString()} km</td></tr>
                <tr><td>${this.t('results.sunSemiDiameter', 'Sun Semidiameter')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_semidiameter_deg)}</td></tr>
                <tr><td>${this.t('results.moonSemiDiameter', 'Moon Semidiameter')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_semidiameter_deg)}</td></tr>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span>Ecliptic Coordinates</span>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Equatorial Coordinates</span>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Horizontal Coordinates</span>
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
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <span>Corrections & Parallax</span>
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
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
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

  formatRA(degrees) {
    const isNegative = degrees < 0;
    const absDegrees = (Math.abs(degrees) + 360) % 360;
    const hours = absDegrees / 15;
    const h = Math.floor(hours);
    const minDecimal = (hours - h) * 60;
    const m = Math.floor(minDecimal);
    const s = ((minDecimal - m) * 60).toFixed(2);
    
    const sign = isNegative ? '-' : '';
    return `${sign}${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
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
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const { save } = await import('@tauri-apps/plugin-dialog');

      const eph = this.ephemerisData;
      const locationName = (this.locationData && this.locationData.name) ? this.locationData.name.toUpperCase() : 'MARKAZ PERHITUNGAN';
      const lines = [
        locationName,
        `"DATA HILAL :  ${this.formatDate()}   - ${locationName}"`,
        '\t\t\t    Lokasi Perhitungan\t(Markaz)\t"' + this.formatLocation() + '"',
        '\t\t\t    Waktu Perhitungan\tSaat Matahari Terbenam\t"' + eph.sunset_time + ' WIB"',
        '\t\t\t    Julian Datum (JD)\tSaat Waktu Perhitungan\t' + (eph.julian_date || 'N/A'),
        '\t\t\t    Delta T\tD T (Saat Waktu Perhitungan)\t' + eph.delta_t.toFixed(2) + ' detik',
        '\t\t\t    Matahari Terbenam\tSunset\t' + eph.sunset_time + ' WIB',
        '\t\t\t    Bulan Terbenam\tMoonset\t' + eph.moonset_time + ' WIB',
        '\t\t\t    Lama Hilal\tLag Time\t' + eph.lag_time,
        '\t\t\t    Jarak Matahari\tSun\'s Distance from the Earth\t' + (eph.sun_distance_km || 0).toFixed(3) + ' km',
        '\t\t\t    Jarak Bulan\tMoon\'s Distance from the Earth\t' + (eph.moon_distance_km || 0).toFixed(3) + ' km',
        '',
        '\t\tEphemeris\t\t\tGeosentrik\tToposentrik\tSelisih',
        'Koordinat Ekliptika\tAirless\t1\t    Ijtimak\tConjunction\t' + eph.conjunction_date + '\t' + eph.conjunction_date + '\t-01:34:36',
        'Koordinat Ekliptika\tAirless\t\t\t' + eph.sunset_time + ' LT\t' + eph.moonset_time + ' LT',
        'Koordinat Ekliptika\tAirless\t2\t    Semidiameter Matahari\tSun\'s Semidiameter\t' + this.formatDMS(eph.sun_semidiameter_deg) + '\t' + this.formatDMS(eph.sun_semidiameter_deg) + '\t-0° 00\' 00"',
        'Koordinat Ekliptika\tAirless\t3\t    Semidiameter  Bulan\tMoon\'s Semidiameter\t' + this.formatDMS(eph.moon_semidiameter_deg) + '\t' + this.formatDMS(eph.moon_semidiameter_deg) + '\t-0° 00\' 00"',
        'Koordinat Ekliptika\tAirless\t4\t    Bujur Ekliptika Matahari\tSun\'s Longitude\t' + this.formatDMS(eph.sun_longitude_geo) + '\t' + this.formatDMS(eph.sun_longitude_topo) + '\t' + this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo),
        'Koordinat Ekliptika\tAirless\t5\t    Lintang Ekliptika Matahari\tSun\'s Latitude\t' + this.formatDMS(eph.sun_latitude_geo) + '\t' + this.formatDMS(eph.sun_latitude_topo) + '\t' + this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo),
        'Koordinat Ekliptika\tAirless\t6\t    Bujur Ekliptika Bulan\tMoon\'s Longitude\t' + this.formatDMS(eph.moon_longitude_geo) + '\t' + this.formatDMS(eph.moon_longitude_topo) + '\t' + this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo),
        'Koordinat Ekliptika\tAirless\t7\t    Lintang Ekliptika Bulan\tMoon\'s Latitude\t' + this.formatDMS(eph.moon_latitude_geo) + '\t' + this.formatDMS(eph.moon_latitude_topo) + '\t' + this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo),
        'Koordinat Ekliptika\tAirless\t8\t    Koreksi Apparent\tApparent Correction',
        'Koordinat Ekliptika\tAirless\t8a\t-  Nutasi Sepanjang Bujur\t- Nutation in Longitude\t' + (eph.nutation_longitude || 0).toFixed(2) + '"',
        'Koordinat Ekliptika\tAirless\t8b\t-  Nutasi Kemiringan Ekliptika\t- Nutation in Obliquity\t' + (eph.nutation_obliquity || 0).toFixed(2) + '"',
        'Koordinat Ekliptika\tAirless\t8c\t- Aberasi Matahari\t    - Sun\'s Aberration\t' + (eph.sun_aberration || 0).toFixed(2) + '"',
        'Koordinat Ekliptika\tAirless\t9\t    Bujur Ekliptika Matahari Tampak\tApparent Sun\'s Longitude\t' + this.formatDMS(eph.sun_longitude_geo) + '\t' + this.formatDMS(eph.sun_longitude_topo) + '\t' + this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo),
        'Koordinat Ekliptika\tAirless\t10\t    Lintang Ekliptika Matahari Tampak\tApparent Sun\'s Latitude\t' + this.formatDMS(eph.sun_latitude_geo) + '\t' + this.formatDMS(eph.sun_latitude_topo) + '\t' + this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo),
        'Koordinat Ekliptika\tAirless\t11\t    Bujur Ekliptika Bulan Tampak\tApparent Moon\'s Longitude\t' + this.formatDMS(eph.moon_longitude_geo) + '\t' + this.formatDMS(eph.moon_longitude_topo) + '\t' + this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo),
        'Koordinat Ekliptika\tAirless\t12\t    Lintang Ekliptika Bulan Tampak\tApparent Moon\'s Latitude\t' + this.formatDMS(eph.moon_latitude_geo) + '\t' + this.formatDMS(eph.moon_latitude_topo) + '\t' + this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo),
        'Koordinat Equator\tAirless\t13\t    Deklinasi Matahari\tSun\'s Declination\t' + this.formatDMS(eph.sun_dec_geo) + '\t' + this.formatDMS(eph.sun_dec_topo) + '\t' + this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo),
        'Koordinat Equator\tAirless\t14\t    Asensio Rekta Matahari\tSun\'s Right Ascension\t' + this.formatHMS(eph.sun_ra_geo) + '\t' + this.formatHMS(eph.sun_ra_topo) + '\t' + this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo),
        'Koordinat Equator\tAirless\t15\t    Deklinasi Bulan\tMoon\'s Declination\t' + this.formatDMS(eph.moon_dec_geo) + '\t' + this.formatDMS(eph.moon_dec_topo) + '\t' + this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo),
        'Koordinat Equator\tAirless\t16\t    Asensio Rekta Bulan\tMoon\'s Right Ascension\t' + this.formatHMS(eph.moon_ra_geo) + '\t' + this.formatHMS(eph.moon_ra_topo) + '\t' + this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo),
        'Koordinat Equator\tAirless\t17\t    Deklinasi Matahari Tampak\tApparent Sun\'s Declination\t' + this.formatDMS(eph.sun_dec_geo) + '\t' + this.formatDMS(eph.sun_dec_topo) + '\t' + this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo),
        'Koordinat Equator\tAirless\t18\t    Asensio Rekta  Matahari Tampak\tApparent Sun\'s Right Ascension\t' + this.formatHMS(eph.sun_ra_geo) + '\t' + this.formatHMS(eph.sun_ra_topo) + '\t' + this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo),
        'Koordinat Equator\tAirless\t19\t    Deklinasi Bulan Tampak\tApparent Moon\'s Declination\t' + this.formatDMS(eph.moon_dec_geo) + '\t' + this.formatDMS(eph.moon_dec_topo) + '\t' + this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo),
        'Koordinat Equator\tAirless\t20\t    Asensio Rekta Bulan Tampak\tApparent Moon\'s Right Ascension\t' + this.formatHMS(eph.moon_ra_geo) + '\t' + this.formatHMS(eph.moon_ra_topo) + '\t' + this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo),
        'Koordinat Horizon\tAirless\t21\t    Tinggi Matahari\tSun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_airless_geo) + '\t' + this.formatDMS(eph.sun_altitude_airless_topo) + '\t' + this.formatDMS(eph.sun_altitude_airless_topo - eph.sun_altitude_airless_geo),
        'Koordinat Horizon\tAirless\t22\t    Azimuth Matahari\tSun\'s Azimuth\t' + this.formatDMS(eph.sun_azimuth_airless_geo) + '\t' + this.formatDMS(eph.sun_azimuth_airless_topo) + '\t' + this.formatDMS(eph.sun_azimuth_airless_topo - eph.sun_azimuth_airless_geo),
        'Koordinat Horizon\tAirless\t23\t    Tinggi Bulan\tMoon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_airless_geo) + '\t' + this.formatDMS(eph.moon_altitude_airless_topo) + '\t' + this.formatDMS(eph.moon_altitude_airless_topo - eph.moon_altitude_airless_geo),
        'Koordinat Horizon\tAirless\t24\t    Azimuth Bulan\tMoon\'s Azimuth\t' + this.formatDMS(eph.moon_azimuth_airless_geo) + '\t' + this.formatDMS(eph.moon_azimuth_airless_topo) + '\t' + this.formatDMS(eph.moon_azimuth_airless_topo - eph.moon_azimuth_airless_geo),
        'Koordinat Horizon\tAirless\t25\t    Tinggi Matahari (Tampak)\tApparent Sun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_apparent_airless_geo) + '\t' + this.formatDMS(eph.sun_altitude_apparent_airless_topo) + '\t' + this.formatDMS(eph.sun_altitude_apparent_airless_topo - eph.sun_altitude_apparent_airless_geo),
        'Koordinat Horizon\tAirless\t26\t    Azimuth Matahari  (Tampak)\tApparent Sun\'s Azimuth\t' + this.formatDMS(eph.sun_azimuth_apparent_airless_geo) + '\t' + this.formatDMS(eph.sun_azimuth_apparent_airless_topo) + '\t' + this.formatDMS(eph.sun_azimuth_apparent_airless_topo - eph.sun_azimuth_apparent_airless_geo),
        'Koordinat Horizon\tAirless\t27\t    Tinggi Bulan  (Tampak)\tApparent Moon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_apparent_airless_geo) + '\t' + this.formatDMS(eph.moon_altitude_apparent_airless_topo) + '\t' + this.formatDMS(eph.moon_altitude_apparent_airless_topo - eph.moon_altitude_apparent_airless_geo),
        'Koordinat Horizon\tAirless\t28\t    Azimuth Bulan  (Tampak)\tApparent Moon\'s Azimuth\t' + this.formatDMS(eph.moon_azimuth_apparent_airless_geo) + '\t' + this.formatDMS(eph.moon_azimuth_apparent_airless_topo) + '\t' + this.formatDMS(eph.moon_azimuth_apparent_airless_topo - eph.moon_azimuth_apparent_airless_geo),
        'Koordinat Horizon\tAiry\t29\t    Tinggi Matahari\tAiry Apparent Sun\'s Altitude\t' + this.formatDMS(eph.sun_altitude_airy_geo) + '\t' + this.formatDMS(eph.sun_altitude_airy_topo) + '\t' + this.formatDMS(eph.sun_altitude_airy_topo - eph.sun_altitude_airy_geo),
        'Koordinat Horizon\tAiry\t30\t    - Koreksi Refraksi\tRefraction of the Sun\t' + ((eph.sun_refraction || 0) / 60.0).toFixed(2) + "'",
        'Koordinat Horizon\tAiry\t31\t    Tinggi Bulan\tAiry Apparent Moon\'s Altitude\t' + this.formatDMS(eph.moon_altitude_airy_geo) + '\t' + this.formatDMS(eph.moon_altitude_airy_topo) + '\t' + this.formatDMS(eph.moon_altitude_airy_topo - eph.moon_altitude_airy_geo),
        'Koordinat Horizon\tAiry\t32\t    - Koreksi refraksi\tRefraction of the Moon\t' + ((eph.moon_refraction || 0) / 60.0).toFixed(2) + "'",
        'Koreksi\t \t33\t    - Horizontal Parallax Matahari\tSun\'s Horizontal Parallax\t' + (eph.sun_horizontal_parallax || 0).toFixed(2) + '"',
        'Koreksi\t \t34\t    - Horizontal Parallax Bulan\tMoon\'s Horizontal Parallax\t' + (eph.moon_horizontal_parallax || 0).toFixed(2) + '"',
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
      alert('Export failed: ' + (error.message || error));
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
        const { writeTextFile: wt } = await import('@tauri-apps/plugin-fs');
        const { save: s } = await import('@tauri-apps/plugin-dialog');
        writeTextFile = wt;
        save = s;
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
        ['Earth-Moon Distance', `${(eph.moon_distance_km || 0).toFixed(2)} km`],
        ['Earth-Sun Distance', `${(eph.sun_distance_km || 0).toFixed(2)} km`],
        ['Moon Semidiameter', `${this.formatDMS(eph.moon_semidiameter_deg)}`],
        ['Sun Semidiameter', `${this.formatDMS(eph.sun_semidiameter_deg)}`],
        [''],
        ['MOON ECLIPTIC COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Longitude', this.formatDMS(eph.moon_longitude_geo || 0), this.formatDMS(eph.moon_longitude_topo || 0)],
        ['Latitude', this.formatDMS(eph.moon_latitude_geo || 0), this.formatDMS(eph.moon_latitude_topo || 0)],
        [''],
        ['SUN ECLIPTIC COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Longitude', this.formatDMS(eph.sun_longitude_geo || 0), this.formatDMS(eph.sun_longitude_topo || 0)],
        ['Latitude', this.formatDMS(eph.sun_latitude_geo || 0), this.formatDMS(eph.sun_latitude_topo || 0)],
        [''],
        ['MOON EQUATORIAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Right Ascension', this.formatHMS(eph.moon_ra_geo || 0), this.formatHMS(eph.moon_ra_topo || 0)],
        ['Declination', this.formatDMS(eph.moon_dec_geo || 0), this.formatDMS(eph.moon_dec_topo || 0)],
        [''],
        ['SUN EQUATORIAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Right Ascension', this.formatHMS(eph.sun_ra_geo || 0), this.formatHMS(eph.sun_ra_topo || 0)],
        ['Declination', this.formatDMS(eph.sun_dec_geo || 0), this.formatDMS(eph.sun_dec_topo || 0)],
        [''],
        ['MOON HORIZONTAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Altitude', this.formatDMS(eph.moon_altitude_airless_geo || 0), this.formatDMS(eph.moon_altitude_airless_topo || 0)],
        ['Azimuth', this.formatDMS(eph.moon_azimuth_airless_geo || 0), this.formatDMS(eph.moon_azimuth_airless_topo || 0)],
        [''],
        ['SUN HORIZONTAL COORDINATES'],
        ['Parameter', 'Geocentric', 'Topocentric'],
        ['Altitude', this.formatDMS(eph.sun_altitude_airless_geo || 0), this.formatDMS(eph.sun_altitude_airless_topo || 0)],
        ['Azimuth', this.formatDMS(eph.sun_azimuth_airless_geo || 0), this.formatDMS(eph.sun_azimuth_airless_topo || 0)],
        [''],
        ['CORRECTIONS'],
        ['Parameter', 'Value'],
        ['Moon Parallax Correction', `${(eph.moon_horizontal_parallax || 0).toFixed(4)}°`],
        ['Sun Parallax Correction', `${(eph.sun_horizontal_parallax || 0).toFixed(4)}°`],
        ['Moon Refraction Correction', `${(eph.moon_refraction || 0).toFixed(4)}°`],
        ['Sun Refraction Correction', `${(eph.sun_refraction || 0).toFixed(4)}°`],
        [''],
        ['HILAL VISIBILITY DATA'],
        ['Parameter', 'Geocentric', 'Topocentric', 'Difference'],
        ['Moon Age', this.formatHours(eph.moon_age_hours_geo || 0), this.formatHours(eph.moon_age_hours_topo || 0), this.formatHours((eph.moon_age_hours_topo || 0) - (eph.moon_age_hours_geo || 0))],
        ['Elongation', this.formatDMS(eph.elongation_geo || 0), this.formatDMS(eph.elongation_topo || 0), this.formatDMS((eph.elongation_topo || 0) - (eph.elongation_geo || 0))],
        ['Illumination', `${(eph.illumination_geo || 0).toFixed(2)}%`, `${(eph.illumination_topo || 0).toFixed(2)}%`, `${((eph.illumination_topo || 0) - (eph.illumination_geo || 0)).toFixed(2)}%`],
        ['Crescent Width', `${this.formatDMS((eph.crescent_width_geo || 0) * 60)}'`, `${this.formatDMS((eph.crescent_width_topo || 0) * 60)}'`, `${this.formatDMS(((eph.crescent_width_topo || 0) - (eph.crescent_width_geo || 0)) * 60)}'`],
        ['Relative Altitude', this.formatDMS(eph.relative_altitude_geo || 0), this.formatDMS(eph.relative_altitude_topo || 0), this.formatDMS((eph.relative_altitude_topo || 0) - (eph.relative_altitude_geo || 0))],
        ['Relative Azimuth', this.formatDMS(eph.relative_azimuth_geo || 0), this.formatDMS(eph.relative_azimuth_topo || 0), this.formatDMS((eph.relative_azimuth_topo || 0) - (eph.relative_azimuth_geo || 0))],
        ['Phase Angle', this.formatDMS(eph.phase_angle_geo || 0), this.formatDMS(eph.phase_angle_topo || 0), this.formatDMS((eph.phase_angle_topo || 0) - (eph.phase_angle_geo || 0))]
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
      alert('Export failed: ' + (error.message || error));
    }
  }

  printEphemeris() {
    window.print();
  }
}

// Register the custom element
customElements.define('detailed-ephemeris-display', DetailedEphemerisDisplay);
