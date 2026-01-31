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
        this.renderEphemerisTableAndUpdateDOM();
      } else {
        // Re-render the entire component including header and buttons
        this.render();
      }
    });
  }

  renderEphemerisTableAndUpdateDOM() {
    const content = this.querySelector('#ephemeris-content');
    if (content) {
      content.innerHTML = this.renderEphemerisTable();
    }
    // Also update the header and buttons text
    this.updateStaticText();
  }

  updateStaticText() {
    // Update header title
    const header = this.querySelector('h3');
    if (header) {
      header.innerHTML = `
        <svg class="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        ${this.t('tabLabels.ephemeris', 'Detailed Ephemeris Data')}
      `;
    }
    // Update buttons
    const exportTxtBtn = this.querySelector('#export-ephemeris-txt');
    const exportCsvBtn = this.querySelector('#export-ephemeris-csv');
    const printBtn = this.querySelector('#print-ephemeris');
    
    if (exportTxtBtn) {
      exportTxtBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        ${this.t('export.saveTXT', 'Save TXT')}
      `;
    }
    if (exportCsvBtn) {
      exportCsvBtn.innerHTML = `
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        ${this.t('export.saveCSV', 'Save CSV')}
      `;
    }
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
          ${this.t('ephemeris.title', 'Detailed Ephemeris Data')}
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
            ${this.t('buttons.print', 'Print')}
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
            <p><svg class="w-5 h-5 text-error inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${this.t('messages.noData', 'No ephemeris data available')}</p>
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
            <p><svg class="w-5 h-5 text-error inline mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${this.t('messages.error', 'Error displaying ephemeris data')}</p>
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
          <p><svg class="w-5 h-5 inline mr-1 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg> ${this.t('messages.noData', 'Perform a calculation to see detailed ephemeris data')}</p>
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
    const s = this.t('labels.secondsShort', 's');
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
                <tr><td>${this.t('results.deltaT', 'Delta T')}</td><td class="text-right font-mono">${eph?.delta_t?.toFixed(2) ?? 'N/A'}${s}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderDistanceSection() {
    const eph = this.ephemerisData;
    const km = this.t('labels.km', 'km');
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
                <tr><td>${this.t('results.sunDistance', 'Sun Distance')}</td><td class="text-right font-mono">${eph.sun_distance_km.toLocaleString()} ${km}</td></tr>
                <tr><td>${this.t('results.moonDistance', 'Moon Distance')}</td><td class="text-right font-mono">${eph.moon_distance_km.toLocaleString()} ${km}</td></tr>
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
            <span>${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right">${this.t('ephemeris.geocentric', 'Geocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.topocentric', 'Topocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.difference', 'Difference')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>${this.t('ephemeris.sunLongitude', 'Sun Longitude')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.sunLatitude', 'Sun Latitude')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonLongitude', 'Moon Longitude')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonLatitude', 'Moon Latitude')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo)}</td></tr>
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
            <span>${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right">${this.t('ephemeris.geocentric', 'Geocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.topocentric', 'Topocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.difference', 'Difference')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>${this.t('ephemeris.sunRA', 'Sun RA')}</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_geo)}</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_topo)}</td><td class="text-right font-mono">${this.formatRA(eph.sun_ra_topo - eph.sun_ra_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.sunDec', 'Sun Dec')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonRA', 'Moon RA')}</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_geo)}</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_topo)}</td><td class="text-right font-mono">${this.formatRA(eph.moon_ra_topo - eph.moon_ra_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonDec', 'Moon Dec')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo)}</td></tr>
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
            <span>${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}</span>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra table-sm w-full">
              <thead>
                <tr>
                  <th>${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right">${this.t('ephemeris.geocentric', 'Geocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.topocentric', 'Topocentric')}</th>
                  <th class="text-right">${this.t('ephemeris.difference', 'Difference')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>${this.t('ephemeris.sunAltAirless', 'Sun Alt (Airless)')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airless_topo - eph.sun_altitude_airless_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.sunAzimuth', 'Sun Azimuth')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_azimuth_airless_topo - eph.sun_azimuth_airless_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonAltAirless', 'Moon Alt (Airless)')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airless_topo - eph.moon_altitude_airless_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonAzimuth', 'Moon Azimuth')}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_azimuth_airless_topo - eph.moon_azimuth_airless_geo)}</td></tr>
                <tr class="bg-base-300/30 font-bold"><td colspan="4">${this.t('ephemeris.withRefraction', 'With Refraction (Airy)')}</td></tr>
                <tr><td>${this.t('ephemeris.sunAltAiry', 'Sun Alt (Airy)')}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_geo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.sun_altitude_airy_topo - eph.sun_altitude_airy_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.moonAltAiry', 'Moon Alt (Airy)')}</td><td class="text-right font-mono font-bold text-primary">${this.formatDMS(eph.moon_altitude_airy_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.moon_altitude_airy_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.moon_altitude_airy_topo - eph.moon_altitude_airy_geo)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderCorrectionsSection() {
    const eph = this.ephemerisData;
    const sAttr = '"';
    const mAttr = "'";
    return `
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-0">
          <div class="bg-base-300/50 px-4 py-2 font-bold flex items-center gap-2 rounded-t-xl border-b border-base-300 shadow-sm">
            <svg class="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <span>${this.t('ephemeris.corrections', 'Corrections & Parallax')}</span>
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
                <tr><td>${this.t('ephemeris.nutationLon', 'Nutation Lon')}</td><td class="text-right font-mono">${eph.nutation_longitude.toFixed(2)}${sAttr}</td></tr>
                <tr><td>${this.t('ephemeris.nutationObl', 'Nutation Obl')}</td><td class="text-right font-mono">${eph.nutation_obliquity.toFixed(2)}${sAttr}</td></tr>
                <tr><td>${this.t('ephemeris.sunAberration', 'Sun Aberration')}</td><td class="text-right font-mono">${eph.sun_aberration.toFixed(2)}${sAttr}</td></tr>
                <tr><td>${this.t('ephemeris.sunRefraction', 'Sun Refraction')}</td><td class="text-right font-mono">${(eph.sun_refraction / 60.0).toFixed(2)}${mAttr}</td></tr>
                <tr><td>${this.t('ephemeris.moonRefraction', 'Moon Refraction')}</td><td class="text-right font-mono">${(eph.moon_refraction / 60.0).toFixed(2)}${mAttr}</td></tr>
                <tr><td>${this.t('ephemeris.sunHP', 'Sun HP')}</td><td class="text-right font-mono">${eph.sun_horizontal_parallax.toFixed(2)}${sAttr}</td></tr>
                <tr><td>${this.t('ephemeris.moonHP', 'Moon HP')}</td><td class="text-right font-mono">${(eph.moon_horizontal_parallax / 60.0).toFixed(2)}${mAttr}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  renderHilalDataSection() {
    const eph = this.ephemerisData;
    const mAttr = "'";
    return `
      <div class="card bg-primary text-primary-content shadow-xl">
        <div class="card-body p-0">
          <div class="px-6 py-4 border-b border-white/20">
            <h3 class="text-xl font-bold flex items-center gap-2">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
              ${this.t('ephemeris.hilalVisibilityData', 'Hilal Visibility Data (Detailed)')}
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="table w-full text-primary-content border-none">
              <thead class="text-primary-content/70 border-b border-white/10">
                <tr>
                  <th class="bg-transparent">${this.t('ephemeris.parameter', 'Parameter')}</th>
                  <th class="text-right bg-transparent">${this.t('ephemeris.geocentric', 'Geocentric')}</th>
                  <th class="text-right bg-transparent">${this.t('ephemeris.topocentric', 'Topocentric')}</th>
                  <th class="text-right bg-transparent">${this.t('ephemeris.difference', 'Difference')}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr><td>${this.t('results.moonAge', 'Moon Age')}</td><td class="text-right font-mono font-bold">${this.formatHours(eph.moon_age_hours_geo)}</td><td class="text-right font-mono font-bold">${this.formatHours(eph.moon_age_hours_topo)}</td><td class="text-right font-mono">${this.formatHours(eph.moon_age_hours_topo - eph.moon_age_hours_geo)}</td></tr>
                <tr><td>${this.t('results.elongation', 'Elongation')}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.elongation_geo)}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.elongation_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.elongation_topo - eph.elongation_geo)}</td></tr>
                <tr><td>${this.t('results.illumination', 'Illumination')}</td><td class="text-right font-mono font-bold">${eph.illumination_geo.toFixed(2)}%</td><td class="text-right font-mono font-bold">${eph.illumination_topo.toFixed(2)}%</td><td class="text-right font-mono">${(eph.illumination_topo - eph.illumination_geo).toFixed(2)}%</td></tr>
                <tr><td>${this.t('results.crescentWidth', 'Crescent Width')}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.crescent_width_geo * 60)}${mAttr}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.crescent_width_topo * 60)}${mAttr}</td><td class="text-right font-mono">${this.formatDMS((eph.crescent_width_topo - eph.crescent_width_geo) * 60)}${mAttr}</td></tr>
                <tr><td colspan="4" class="opacity-50 h-2 px-0"></td></tr>
                <tr><td>${this.t('ephemeris.relativeAlt', 'Relative Alt')}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.relative_altitude_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.relative_altitude_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.relative_altitude_topo - eph.relative_altitude_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.relativeAzim', 'Relative Azim')}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.relative_azimuth_geo)}</td><td class="text-right font-mono font-bold text-accent">${this.formatDMS(eph.relative_azimuth_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.relative_azimuth_topo - eph.relative_azimuth_geo)}</td></tr>
                <tr><td>${this.t('ephemeris.phaseAngle', 'Phase Angle')}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.phase_angle_geo)}</td><td class="text-right font-mono font-bold">${this.formatDMS(eph.phase_angle_topo)}</td><td class="text-right font-mono">${this.formatDMS(eph.phase_angle_topo - eph.phase_angle_geo)}</td></tr>
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
    const locale = this.i18n.getLocale();
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatLocation() {
    if (!this.locationData) return 'N/A';
    return `${this.t('labels.latitude', 'Lat')}: ${this.locationData.latitude.toFixed(4)}°, ${this.t('labels.longitude', 'Lon')}: ${this.locationData.longitude.toFixed(4)}°`;
  }

  formatCoordinates() {
    if (!this.locationData) return 'N/A';
    const latDir = this.locationData.latitude >= 0 ? this.t('labels.north', 'N') : this.t('labels.south', 'S');
    const lonDir = this.locationData.longitude >= 0 ? this.t('labels.east', 'E') : this.t('labels.west', 'W');
    const elev = this.t('labels.elevationShort', 'Elev');
    const tz = this.t('labels.timezone', 'TZ');
    return `${Math.abs(this.locationData.latitude).toFixed(4)}° ${latDir}, ${Math.abs(this.locationData.longitude).toFixed(4)}° ${lonDir}, ${elev}: ${this.locationData.elevation}m, ${tz}: GMT+${this.locationData.timezone}`;
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
      const locationName = (this.locationData && this.locationData.name) ? this.locationData.name.toUpperCase() : this.t('labels.location', 'MARKAZ PERHITUNGAN');
      const lines = [
        locationName,
        `"${this.t('results.title', 'DATA HILAL')} :  ${this.formatDate()}   - ${locationName}"`,
        `\t\t\t    ${this.t('labels.location', 'Lokasi Perhitungan')}\t(Markaz)\t"${this.formatLocation()}"`,
        `\t\t\t    ${this.t('results.sunsetTime', 'Waktu Perhitungan')}\t${this.t('results.sunsetTime', 'Saat Matahari Terbenam')}\t"${eph.sunset_time} ${this.t('labels.localTime', 'WIB')}"`,
        `\t\t\t    ${this.t('results.julianDay', 'Julian Datum (JD)')}\t${this.t('results.sunsetTime', 'Saat Waktu Perhitungan')}\t${eph.julian_date || 'N/A'}`,
        `\t\t\t    ${this.t('results.deltaT', 'Delta T')}\tD T (${this.t('results.sunsetTime', 'Saat Waktu Perhitungan')})\t${eph.delta_t.toFixed(2)} ${this.t('labels.seconds', 'detik')}`,
        `\t\t\t    ${this.t('results.sunsetTime', 'Matahari Terbenam')}\tSunset\t${eph.sunset_time} ${this.t('labels.localTime', 'WIB')}`,
        `\t\t\t    ${this.t('results.moonsetTime', 'Bulan Terbenam')}\tMoonset\t${eph.moonset_time} ${this.t('labels.localTime', 'WIB')}`,
        `\t\t\t    ${this.t('results.lagTime', 'Lama Hilal')}\tLag Time\t${eph.lag_time}`,
        `\t\t\t    ${this.t('results.sunDistance', 'Jarak Matahari')}\tSun's Distance from the Earth\t${(eph.sun_distance_km || 0).toFixed(3)} km`,
        `\t\t\t    ${this.t('results.moonDistance', 'Jarak Bulan')}\tMoon's Distance from the Earth\t${(eph.moon_distance_km || 0).toFixed(3)} km`,
        '',
        `\t\t${this.t('labels.ephemeris', 'Ephemeris')}\t\t\t${this.t('ephemeris.geocentric', 'Geocentric')}\t${this.t('ephemeris.topocentric', 'Topocentric')}\t${this.t('ephemeris.difference', 'Difference')}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t1\t    ${this.t('ephemeris.conjunctionTime', 'Conjunction Time')}\tConjunction\t${eph.conjunction_date}\t${eph.conjunction_date}\t-01:34:36`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t\t\t${eph.sunset_time} LT\t${eph.moonset_time} LT`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t2\t    ${this.t('ephemeris.sunSemidiameter', 'Sun Semidiameter')}\tSun's Semidiameter\t${this.formatDMS(eph.sun_semidiameter_deg)}\t${this.formatDMS(eph.sun_semidiameter_deg)}\t-0° 00' 00"`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t3\t    ${this.t('ephemeris.moonSemidiameter', 'Moon Semidiameter')}\tMoon's Semidiameter\t${this.formatDMS(eph.moon_semidiameter_deg)}\t${this.formatDMS(eph.moon_semidiameter_deg)}\t-0° 00' 00"`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t4\t    ${this.t('ephemeris.sunLongitude', 'Sun Longitude')}\tSun's Longitude\t${this.formatDMS(eph.sun_longitude_geo)}\t${this.formatDMS(eph.sun_longitude_topo)}\t${this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t5\t    ${this.t('ephemeris.sunLatitude', 'Sun Latitude')}\tSun's Latitude\t${this.formatDMS(eph.sun_latitude_geo)}\t${this.formatDMS(eph.sun_latitude_topo)}\t${this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t6\t    ${this.t('ephemeris.moonLongitude', 'Moon Longitude')}\tMoon's Longitude\t${this.formatDMS(eph.moon_longitude_geo)}\t${this.formatDMS(eph.moon_longitude_topo)}\t${this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t7\t    ${this.t('ephemeris.moonLatitude', 'Moon Latitude')}\tMoon's Latitude\t${this.formatDMS(eph.moon_latitude_geo)}\t${this.formatDMS(eph.moon_latitude_topo)}\t${this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t8\t    ${this.t('ephemeris.apparentCorrection', 'Apparent Correction')}\tApparent Correction`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t8a\t-  ${this.t('ephemeris.nutationLon', 'Nutation Lon')}\t- Nutation in Longitude\t${(eph.nutation_longitude || 0).toFixed(2)}"`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t8b\t-  ${this.t('ephemeris.nutationObl', 'Nutation Obl')}\t- Nutation in Obliquity\t${(eph.nutation_obliquity || 0).toFixed(2)}"`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t8c\t- ${this.t('ephemeris.sunAberration', 'Sun Aberration')}\t    - Sun's Aberration\t${(eph.sun_aberration || 0).toFixed(2)}"`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t9\t    ${this.t('ephemeris.apparentSunLongitude', 'Apparent Sun Longitude')}\tApparent Sun's Longitude\t${this.formatDMS(eph.sun_longitude_geo)}\t${this.formatDMS(eph.sun_longitude_topo)}\t${this.formatDMS(eph.sun_longitude_topo - eph.sun_longitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t10\t    ${this.t('ephemeris.apparentSunLatitude', 'Apparent Sun Latitude')}\tApparent Sun's Latitude\t${this.formatDMS(eph.sun_latitude_geo)}\t${this.formatDMS(eph.sun_latitude_topo)}\t${this.formatDMS(eph.sun_latitude_topo - eph.sun_latitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t11\t    ${this.t('ephemeris.apparentMoonLongitude', 'Apparent Moon Longitude')}\tApparent Moon's Longitude\t${this.formatDMS(eph.moon_longitude_geo)}\t${this.formatDMS(eph.moon_longitude_topo)}\t${this.formatDMS(eph.moon_longitude_topo - eph.moon_longitude_geo)}`,
        `${this.t('ephemeris.eclipticCoordinates', 'Ecliptic Coordinates')}\tAirless\t12\t    ${this.t('ephemeris.apparentMoonLatitude', 'Apparent Moon Latitude')}\tApparent Moon's Latitude\t${this.formatDMS(eph.moon_latitude_geo)}\t${this.formatDMS(eph.moon_latitude_topo)}\t${this.formatDMS(eph.moon_latitude_topo - eph.moon_latitude_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t13\t    ${this.t('ephemeris.sunDec', 'Sun Dec')}\tSun's Declination\t${this.formatDMS(eph.sun_dec_geo)}\t${this.formatDMS(eph.sun_dec_topo)}\t${this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t14\t    ${this.t('ephemeris.sunRA', 'Sun RA')}\tSun's Right Ascension\t${this.formatHMS(eph.sun_ra_geo)}\t${this.formatHMS(eph.sun_ra_topo)}\t${this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t15\t    ${this.t('ephemeris.moonDec', 'Moon Dec')}\tMoon's Declination\t${this.formatDMS(eph.moon_dec_geo)}\t${this.formatDMS(eph.moon_dec_topo)}\t${this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t16\t    ${this.t('ephemeris.moonRA', 'Moon RA')}\tMoon's Right Ascension\t${this.formatHMS(eph.moon_ra_geo)}\t${this.formatHMS(eph.moon_ra_topo)}\t${this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t17\t    ${this.t('ephemeris.apparentSunDec', 'Apparent Sun Dec')}\tApparent Sun's Declination\t${this.formatDMS(eph.sun_dec_geo)}\t${this.formatDMS(eph.sun_dec_topo)}\t${this.formatDMS(eph.sun_dec_topo - eph.sun_dec_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t18\t    ${this.t('ephemeris.apparentSunRA', 'Apparent Sun RA')}\tApparent Sun's Right Ascension\t${this.formatHMS(eph.sun_ra_geo)}\t${this.formatHMS(eph.sun_ra_topo)}\t${this.formatHMS(eph.sun_ra_topo - eph.sun_ra_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t19\t    ${this.t('ephemeris.apparentMoonDec', 'Apparent Moon Dec')}\tApparent Moon's Declination\t${this.formatDMS(eph.moon_dec_geo)}\t${this.formatDMS(eph.moon_dec_topo)}\t${this.formatDMS(eph.moon_dec_topo - eph.moon_dec_geo)}`,
        `${this.t('ephemeris.equatorialCoordinates', 'Equatorial Coordinates')}\tAirless\t20\t    ${this.t('ephemeris.apparentMoonRA', 'Apparent Moon RA')}\tApparent Moon's Right Ascension\t${this.formatHMS(eph.moon_ra_geo)}\t${this.formatHMS(eph.moon_ra_topo)}\t${this.formatHMS(eph.moon_ra_topo - eph.moon_ra_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t21\t    ${this.t('ephemeris.sunAltAirless', 'Sun Alt (Airless)')}\tSun's Altitude\t${this.formatDMS(eph.sun_altitude_airless_geo)}\t${this.formatDMS(eph.sun_altitude_airless_topo)}\t${this.formatDMS(eph.sun_altitude_airless_topo - eph.sun_altitude_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t22\t    ${this.t('ephemeris.sunAzimuth', 'Sun Azimuth')}\tSun's Azimuth\t${this.formatDMS(eph.sun_azimuth_airless_geo)}\t${this.formatDMS(eph.sun_azimuth_airless_topo)}\t${this.formatDMS(eph.sun_azimuth_airless_topo - eph.sun_azimuth_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t23\t    ${this.t('ephemeris.moonAltAirless', 'Moon Alt (Airless)')}\tMoon's Altitude\t${this.formatDMS(eph.moon_altitude_airless_geo)}\t${this.formatDMS(eph.moon_altitude_airless_topo)}\t${this.formatDMS(eph.moon_altitude_airless_topo - eph.moon_altitude_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t24\t    ${this.t('ephemeris.moonAzimuth', 'Moon Azimuth')}\tMoon's Azimuth\t${this.formatDMS(eph.moon_azimuth_airless_geo)}\t${this.formatDMS(eph.moon_azimuth_airless_topo)}\t${this.formatDMS(eph.moon_azimuth_airless_topo - eph.moon_azimuth_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t25\t    ${this.t('ephemeris.apparentSunAlt', 'Apparent Sun Alt')}\tApparent Sun's Altitude\t${this.formatDMS(eph.sun_altitude_apparent_airless_geo)}\t${this.formatDMS(eph.sun_altitude_apparent_airless_topo)}\t${this.formatDMS(eph.sun_altitude_apparent_airless_topo - eph.sun_altitude_apparent_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t26\t    ${this.t('ephemeris.apparentSunAzim', 'Apparent Sun Azim')}\tApparent Sun's Azimuth\t${this.formatDMS(eph.sun_azimuth_apparent_airless_geo)}\t${this.formatDMS(eph.sun_azimuth_apparent_airless_topo)}\t${this.formatDMS(eph.sun_azimuth_apparent_airless_topo - eph.sun_azimuth_apparent_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t27\t    ${this.t('ephemeris.apparentMoonAlt', 'Apparent Moon Alt')}\tApparent Moon's Altitude\t${this.formatDMS(eph.moon_altitude_apparent_airless_geo)}\t${this.formatDMS(eph.moon_altitude_apparent_airless_topo)}\t${this.formatDMS(eph.moon_altitude_apparent_airless_topo - eph.moon_altitude_apparent_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAirless\t28\t    ${this.t('ephemeris.apparentMoonAzim', 'Apparent Moon Azim')}\tApparent Moon's Azimuth\t${this.formatDMS(eph.moon_azimuth_apparent_airless_geo)}\t${this.formatDMS(eph.moon_azimuth_apparent_airless_topo)}\t${this.formatDMS(eph.moon_azimuth_apparent_airless_topo - eph.moon_azimuth_apparent_airless_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAiry\t29\t    ${this.t('ephemeris.sunAltAiry', 'Sun Alt (Airy)')}\tAiry Apparent Sun's Altitude\t${this.formatDMS(eph.sun_altitude_airy_geo)}\t${this.formatDMS(eph.sun_altitude_airy_topo)}\t${this.formatDMS(eph.sun_altitude_airy_topo - eph.sun_altitude_airy_geo)}`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAiry\t30\t    - ${this.t('ephemeris.sunRefraction', 'Sun Refraction')}\tRefraction of the Sun\t${((eph.sun_refraction || 0) / 60.0).toFixed(2)}'`,
        `${this.t('ephemeris.horizontalCoordinates', 'Horizontal Coordinates')}\tAiry\t31\t    ${this.t('ephemeris.moonAltAiry', 'Moon Alt (Airy)')}\tAiry Apparent Moon's Altitude\t${this.formatDMS(eph.moon_altitude_airy_geo)}\t${this.formatDMS(eph.moon_altitude_airy_topo)}\t${this.formatDMS(eph.moon_altitude_airy_topo - eph.moon_altitude_airy_geo)}`,
        `${this.t('labels.horizontalCoordinates', 'Koordinat Horizon')}\tAiry\t32\t    - ${this.t('results.moonRefraction', 'Koreksi refraksi')}\tRefraction of the Moon\t${((eph.moon_refraction || 0) / 60.0).toFixed(2)}'`,
        `${this.t('labels.corrections', 'Koreksi')}\t \t33\t    - ${this.t('results.sunHorizontalParallax', 'Horizontal Parallax Matahari')}\tSun's Horizontal Parallax\t${(eph.sun_horizontal_parallax || 0).toFixed(2)}"`,
        `${this.t('labels.corrections', 'Koreksi')}\t \t34\t    - ${this.t('results.moonHorizontalParallax', 'Horizontal Parallax Bulan')}\tMoon's Horizontal Parallax\t${(eph.moon_horizontal_parallax || 0).toFixed(2)}"`,
        '',
        `\t\t\t\t\t\t${this.t('labels.geocentric', 'Geosentrik')}\t${this.t('labels.topocentric', 'Toposentrik')}\t${this.t('labels.difference', 'Selisih')}`,
        `${this.t('results.moonAge', 'Umur Hilal')}\t\t\t\t\t${this.formatHours(eph.moon_age_hours_geo)}\t${this.formatHours(eph.moon_age_hours_topo)}\t${this.formatHours(eph.moon_age_hours_topo - eph.moon_age_hours_geo)}`,
        `${this.t('results.elongation', 'Elongasi')}\t\t\t\t\t${this.formatDMS(eph.elongation_geo)}\t${this.formatDMS(eph.elongation_topo)}\t${this.formatDMS(eph.elongation_topo - eph.elongation_geo)}`,
        `${this.t('results.illumination', 'Iluminasi')}\t\t\t\t\t${eph.illumination_geo.toFixed(2)}%\t${eph.illumination_topo.toFixed(2)}%\t${(eph.illumination_topo - eph.illumination_geo).toFixed(2)}%`,
        `${this.t('results.crescentWidth', 'Lebar Sabit')}\t\t\t\t\t${this.formatDMS(eph.crescent_width_geo * 60)}'\t${this.formatDMS(eph.crescent_width_topo * 60)}'\t${this.formatDMS((eph.crescent_width_topo - eph.crescent_width_geo) * 60)}'`,
        `${this.t('results.relativeAltitude', 'Tinggi Relatif')}\t\t\t\t\t${this.formatDMS(eph.relative_altitude_geo)}\t${this.formatDMS(eph.relative_altitude_topo)}\t${this.formatDMS(eph.relative_altitude_topo - eph.relative_altitude_geo)}`,
        `${this.t('results.relativeAzimuth', 'Azimuth Relatif')}\t\t\t\t\t${this.formatDMS(eph.relative_azimuth_geo)}\t${this.formatDMS(eph.relative_azimuth_topo)}\t${this.formatDMS(eph.relative_azimuth_topo - eph.relative_azimuth_geo)}`,
        `${this.t('results.phaseAngle', 'Sudut Fase')}\t\t\t\t\t${this.formatDMS(eph.phase_angle_geo)}\t${this.formatDMS(eph.phase_angle_topo)}\t${this.formatDMS(eph.phase_angle_topo - eph.phase_angle_geo)}`
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
        [`${this.t('app.title', 'HISAB HILAL')} - ${this.t('detailedEphemeris.title', 'Detailed Ephemeris Data')}`],
        [this.t('labels.location', 'Location'), this.formatLocation()],
        [this.t('labels.coordinates', 'Coordinates'), this.formatCoordinates()],
        [this.t('labels.observationDate', 'Observation Date'), this.formatDate()],
        [''],
        [this.t('detailedEphemeris.timeInfo', 'TIME INFORMATION').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.value', 'Value')],
        [this.t('results.conjunctionTime', 'Conjunction (Ijtima\')'), eph.conjunction_date],
        [this.t('results.sunsetTime', 'Sunset Time'), eph.sunset_time],
        [this.t('results.moonsetTime', 'Moonset Time'), eph.moonset_time],
        [this.t('results.lagTime', 'Lag Time'), eph.lag_time],
        [this.t('results.deltaT', 'Delta T'), `${eph.delta_t.toFixed(2)}s`],
        [''],
        [this.t('detailedEphemeris.distances', 'DISTANCES & SEMIDIAMETERS').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.moonDistance', 'Earth-Moon Distance'), `${(eph.moon_distance_km || 0).toFixed(2)} km`],
        [this.t('results.sunDistance', 'Earth-Sun Distance'), `${(eph.sun_distance_km || 0).toFixed(2)} km`],
        [this.t('results.moonSemidiameter', 'Moon Semidiameter'), `${this.formatDMS(eph.moon_semidiameter_deg)}`],
        [this.t('results.sunSemidiameter', 'Sun Semidiameter'), `${this.formatDMS(eph.sun_semidiameter_deg)}`],
        [''],
        [this.t('detailedEphemeris.moonEcliptic', 'MOON ECLIPTIC COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.moonLongitude', 'Longitude'), this.formatDMS(eph.moon_longitude_geo || 0), this.formatDMS(eph.moon_longitude_topo || 0)],
        [this.t('results.moonLatitude', 'Latitude'), this.formatDMS(eph.moon_latitude_geo || 0), this.formatDMS(eph.moon_latitude_topo || 0)],
        [''],
        [this.t('detailedEphemeris.sunEcliptic', 'SUN ECLIPTIC COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.sunLongitude', 'Longitude'), this.formatDMS(eph.sun_longitude_geo || 0), this.formatDMS(eph.sun_longitude_topo || 0)],
        [this.t('results.sunLatitude', 'Latitude'), this.formatDMS(eph.sun_latitude_geo || 0), this.formatDMS(eph.sun_latitude_topo || 0)],
        [''],
        [this.t('detailedEphemeris.moonEquatorial', 'MOON EQUATORIAL COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.moonRightAscension', 'Right Ascension'), this.formatHMS(eph.moon_ra_geo || 0), this.formatHMS(eph.moon_ra_topo || 0)],
        [this.t('results.moonDeclination', 'Declination'), this.formatDMS(eph.moon_dec_geo || 0), this.formatDMS(eph.moon_dec_topo || 0)],
        [''],
        [this.t('detailedEphemeris.sunEquatorial', 'SUN EQUATORIAL COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.sunRightAscension', 'Right Ascension'), this.formatHMS(eph.sun_ra_geo || 0), this.formatHMS(eph.sun_ra_topo || 0)],
        [this.t('results.sunDeclination', 'Declination'), this.formatDMS(eph.sun_dec_geo || 0), this.formatDMS(eph.sun_dec_topo || 0)],
        [''],
        [this.t('detailedEphemeris.moonHorizontal', 'MOON HORIZONTAL COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.moonAltitude', 'Altitude'), this.formatDMS(eph.moon_altitude_airless_geo || 0), this.formatDMS(eph.moon_altitude_airless_topo || 0)],
        [this.t('results.moonAzimuth', 'Azimuth'), this.formatDMS(eph.moon_azimuth_airless_geo || 0), this.formatDMS(eph.moon_azimuth_airless_topo || 0)],
        [''],
        [this.t('detailedEphemeris.sunHorizontal', 'SUN HORIZONTAL COORDINATES').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric')],
        [this.t('results.sunAltitude', 'Altitude'), this.formatDMS(eph.sun_altitude_airless_geo || 0), this.formatDMS(eph.sun_altitude_airless_topo || 0)],
        [this.t('results.sunAzimuth', 'Azimuth'), this.formatDMS(eph.sun_azimuth_airless_geo || 0), this.formatDMS(eph.sun_azimuth_airless_topo || 0)],
        [''],
        [this.t('labels.corrections', 'CORRECTIONS').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.value', 'Value')],
        [this.t('results.moonHorizontalParallax', 'Moon Parallax Correction'), `${(eph.moon_horizontal_parallax || 0).toFixed(4)}°`],
        [this.t('results.sunHorizontalParallax', 'Sun Parallax Correction'), `${(eph.sun_horizontal_parallax || 0).toFixed(4)}°`],
        [this.t('results.moonRefraction', 'Moon Refraction Correction'), `${(eph.moon_refraction || 0).toFixed(4)}°`],
        [this.t('results.sunRefraction', 'Sun Refraction Correction'), `${(eph.sun_refraction || 0).toFixed(4)}°`],
        [''],
        [this.t('detailedEphemeris.hilalVisibility', 'HILAL VISIBILITY DATA').toUpperCase()],
        [this.t('labels.parameter', 'Parameter'), this.t('labels.geocentric', 'Geocentric'), this.t('labels.topocentric', 'Topocentric'), this.t('labels.difference', 'Difference')],
        [this.t('results.moonAge', 'Moon Age'), this.formatHours(eph.moon_age_hours_geo || 0), this.formatHours(eph.moon_age_hours_topo || 0), this.formatHours((eph.moon_age_hours_topo || 0) - (eph.moon_age_hours_geo || 0))],
        [this.t('results.elongation', 'Elongation'), this.formatDMS(eph.elongation_geo || 0), this.formatDMS(eph.elongation_topo || 0), this.formatDMS((eph.elongation_topo || 0) - (eph.elongation_geo || 0))],
        [this.t('results.illumination', 'Illumination'), `${(eph.illumination_geo || 0).toFixed(2)}%`, `${(eph.illumination_topo || 0).toFixed(2)}%`, `${((eph.illumination_topo || 0) - (eph.illumination_geo || 0)).toFixed(2)}%`],
        [this.t('results.crescentWidth', 'Crescent Width'), `${this.formatDMS((eph.crescent_width_geo || 0) * 60)}'`, `${this.formatDMS((eph.crescent_width_topo || 0) * 60)}'`, `${this.formatDMS(((eph.crescent_width_topo || 0) - (eph.crescent_width_geo || 0)) * 60)}'`],
        [this.t('results.relativeAltitude', 'Relative Altitude'), this.formatDMS(eph.relative_altitude_geo || 0), this.formatDMS(eph.relative_altitude_topo || 0), this.formatDMS((eph.relative_altitude_topo || 0) - (eph.relative_altitude_geo || 0))],
        [this.t('results.relativeAzimuth', 'Relative Azimuth'), this.formatDMS(eph.relative_azimuth_geo || 0), this.formatDMS(eph.relative_azimuth_topo || 0), this.formatDMS((eph.relative_azimuth_topo || 0) - (eph.relative_azimuth_geo || 0))],
        [this.t('results.phaseAngle', 'Phase Angle'), this.formatDMS(eph.phase_angle_geo || 0), this.formatDMS(eph.phase_angle_topo || 0), this.formatDMS((eph.phase_angle_topo || 0) - (eph.phase_angle_geo || 0))]
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
