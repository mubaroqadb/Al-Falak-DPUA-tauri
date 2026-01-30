// Main Application Class for Hisab Hilal
// Manages overall application state and coordination

import { HilalAPI, isTauri } from './services/api.js';
import { DataStore } from './services/DataStore.js';
import { VISIBILITY_CRITERIA } from './utils/constants.js';

export class HilalApp {
  constructor() {
    this.dataStore = new DataStore();
    this.api = new HilalAPI();

    // UI Components (Web Components)
    this.mapVisualization = null;
    this.criteriaPanel = null;
    this.resultsDisplay = null;
    this.criteriaResultsDisplay = null;
    this.detailedEphemerisDisplay = null;
    this.hijriDateInput = null;

    // Current application state
    this.currentLocation = {
      name: 'Jakarta',
      latitude: -6.2, // Jakarta coordinates as default
      longitude: 106.816666,
      elevation: 8,
      timezone: 7
    };

    this.currentDate = new Date();
    this.currentHijriDate = { hijriYear: 1446, hijriMonth: 7, hijriDay: 1 };
    this.selectedCriteria = 'MABIMS';
    this.currentCalculation = null;
    this.dateMode = 'gregorian'; // 'gregorian' or 'hijri'
  }

  async init() {
    console.log('Initializing UI components...');

    // Wait for DOM to be ready and components to be defined
    await this.waitForComponents();

    // Get component references
    this.getComponentReferences();

    // Setup event listeners
    this.setupEventListeners();

    // Load initial data
    await this.loadInitialData();

    console.log('Application ready for use');
  }

  async waitForComponents() {
    // Wait for custom elements to be defined
    const components = ['map-visualization', 'criteria-panel', 'results-display', 'criteria-results-display', 'validation-panel', 'detailed-ephemeris-display', 'prayer-times-display', 'hijri-date-input'];

    for (const component of components) {
      await customElements.whenDefined(component);
    }
  }

  getComponentReferences() {
    this.mapVisualization = document.querySelector('map-visualization');
    this.criteriaPanel = document.querySelector('criteria-panel');
    this.resultsDisplay = document.querySelector('results-display');
    this.criteriaResultsDisplay = document.querySelector('criteria-results-display');
    this.validationPanel = document.querySelector('validation-panel');
    this.detailedEphemerisDisplay = document.querySelector('detailed-ephemeris-display');
    this.prayerTimesDisplay = document.querySelector('prayer-times-display');
    this.calculateButton = document.querySelector('calculate-button');
    this.locationSelector = document.querySelector('location-selector');
    this.hijriDateInput = document.querySelector('hijri-date-input');
  }

  setupEventListeners() {
    // Listen for FAB calculate button
    if (this.calculateButton) {
      this.calculateButton.addEventListener('fab-calculate', async () => {
        console.log('FAB Calculate clicked');
        this.calculateButton.setCalculating(true);
        this.showLoading('Calculating visibility maps and data...'); // Show immediately
        
        try {
          // Critical: Yield to event loop to allow UI paint
          await new Promise(resolve => setTimeout(resolve, 10));

          await this.updateVisibilityZones();
          await this.updateCalculations();
        } catch (error) {
          console.error("Calculation flow error:", error);
          this.showError("Calculation failed: " + error.message);
        } finally {
          this.calculateButton.setCalculating(false);
          this.hideLoading(); // Hide after everything is done
        }
      });
    }

    // Listen for Hero calculate button
    const heroBtn = document.getElementById('hero-calculate-btn');
    if (heroBtn) {
      heroBtn.addEventListener('click', async () => {
        console.log('Hero Calculate clicked');
        const spinner = document.getElementById('hero-loading');
        
        // UI State: Loading
        heroBtn.classList.add('btn-disabled');
        if (spinner) spinner.classList.remove('hidden');
        this.showLoading('Calculating visibility maps and data...'); // Show immediately
        
        try {
          // Critical: Yield to event loop to allow UI paint
          await new Promise(resolve => setTimeout(resolve, 10));

          await this.updateVisibilityZones();
          await this.updateCalculations();
        } catch (error) {
          console.error("Calculation flow error:", error);
          this.showError("Calculation failed: " + error.message);
        } finally {
          // UI State: Ready
          heroBtn.classList.remove('btn-disabled');
          if (spinner) spinner.classList.add('hidden');
          this.hideLoading(); // Hide after everything is done
        }
      });
    }

    // Listen for modern criteria selector
    const criteriaSelector = document.querySelector('modern-criteria-selector');
    if (criteriaSelector) {
      criteriaSelector.addEventListener('criteria-changed', (event) => {
        this.selectedCriteria = event.detail.criteria;
        console.log('Criteria changed to:', this.selectedCriteria);
      });
    }

    // Listen for location selector changes
    if (this.locationSelector) {
      this.locationSelector.addEventListener('city-changed', (event) => {
        const city = event.detail.city;
        this.currentLocation = {
          name: city.name,
          latitude: city.lat,
          longitude: city.lon,
          elevation: city.elev || 0,
          timezone: city.tz
        };
        console.log('City selected from database:', city.name, this.currentLocation);
      });
    }



    // Update date when input changes
    const dateInput = document.getElementById('calc-date');
    if (dateInput) {
      // Set default to today
      dateInput.value = new Date().toISOString().split('T')[0];
      
      dateInput.addEventListener('change', () => {
        this.currentDate = new Date(dateInput.value);
        console.log('Date changed to:', this.currentDate);
      });
    }

    // Listen for criteria changes
    if (this.criteriaPanel) {
      this.criteriaPanel.addEventListener('criteria-changed', (event) => {
        this.selectedCriteria = event.detail.criteria;
        console.log('Criteria changed to:', this.selectedCriteria);
        this.updateVisibilityZones();
        this.updateCalculations();
      });

      // Listen for calculation requests
      this.criteriaPanel.addEventListener('calculate-hilal', (event) => {
        console.log('Manual calculation requested for criteria:', event.detail.criteria);
        this.selectedCriteria = event.detail.criteria;
        this.updateCalculations();
      });
    }

    // Listen for location changes from map
    if (this.mapVisualization) {
      this.mapVisualization.addEventListener('location-selected', (event) => {
        this.currentLocation = event.detail.location;
        console.log('Location changed to:', this.currentLocation);
        this.updateCalculations();
      });

      // Listen for map clicks to update location
      this.mapVisualization.addEventListener('map-click', (event) => {
        const { lat, lng } = event.detail;
        this.currentLocation = {
          ...this.currentLocation,
          name: `Custom Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
          latitude: lat,
          longitude: lng
        };
        console.log('Map clicked at:', lat, lng);
        // Don't auto-calculate, wait for user to click Calculate button
      });
    }

    // Listen for calculate event from CriteriaPanel
    document.addEventListener('calculate-hilal', async (event) => {
      const { criteria, date, location } = event.detail;
      
      console.log('Calculate hilal requested:', { criteria, date, location });
      
      // Update app state
      this.selectedCriteria = criteria;
      this.currentDate = date;
      this.currentLocation = location;
      
      // Perform calculations
      await this.updateVisibilityZones();
      await this.updateCalculations();
    });

    // Listen for criteria changes
    document.addEventListener('criteria-changed', (event) => {
      this.selectedCriteria = event.detail.criteria;
      console.log('Criteria changed to:', this.selectedCriteria);
      // Update visibility zones with new criteria
      this.updateVisibilityZones();
    });

    // Listen for date changes from HijriDateInput component
    if (this.hijriDateInput) {
      this.hijriDateInput.addEventListener('date-changed', (event) => {
        if (event.detail.mode === 'gregorian') {
          this.dateMode = 'gregorian';
          this.currentDate = event.detail.date;
          console.log('Date changed (Gregorian):', this.currentDate);
        } else {
          this.dateMode = 'hijri';
          this.currentHijriDate = {
            hijriYear: event.detail.hijriYear,
            hijriMonth: event.detail.hijriMonth,
            hijriDay: event.detail.hijriDay
          };
          console.log('Date changed (Hijri):', this.currentHijriDate);
        }
        // Don't auto-update, wait for user to click Calculate
      });

      // Listen for date mode changes
      this.hijriDateInput.addEventListener('date-mode-changed', (event) => {
        this.dateMode = event.detail.mode;
        console.log('Date mode changed to:', this.dateMode);
      });
    }
  }

  async loadInitialData() {
    try {
      // Set initial criteria in the panel
      if (this.criteriaPanel) {
        this.criteriaPanel.setSelectedCriteria(this.selectedCriteria);
      }

      // Initialize map with default location
      if (this.mapVisualization) {
        this.mapVisualization.setCenter(
          this.currentLocation.latitude,
          this.currentLocation.longitude
        );
      }

      console.log('App initialized. Ready for user input.');
      console.log('Please select date, location, and criteria, then click Calculate button.');

      // NO auto-calculation - wait for user to click Calculate button

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to initialize application');
    }
  }

  async updateVisibilityZones() {
    // Skip if not in Tauri context
    if (!isTauri()) {
      console.warn('Skipping visibility zones update - Tauri context not available');
      return;
    }

    try {
      console.log('Updating visibility zones...');

      let visibilityData;
      if (this.dateMode === 'hijri') {
        // Use Hijri date input
        const params = {
          hijriYear: this.currentHijriDate.hijriYear,
          hijriMonth: this.currentHijriDate.hijriMonth,
          hijriDay: this.currentHijriDate.hijriDay,
          criteria: this.selectedCriteria,
          step_degrees: 2.0
        };
        visibilityData = await this.api.getVisibilityZonesHijri(params);
      } else {
        // Use Gregorian date input
        const params = {
          date: this.currentDate,
          criteria: this.selectedCriteria,
          step_degrees: 2.0
        };
        visibilityData = await this.api.getVisibilityZones(params);
      }

      if (this.mapVisualization) {
        // Await the chunked rendering process
        await this.mapVisualization.renderVisibilityZones(visibilityData);
      }

      // Store in data store
      this.dataStore.setVisibilityData(visibilityData);

    } catch (error) {
      console.error('Error updating visibility zones:', error);
      this.showError('Failed to update visibility zones');
    }
  }

  async updatePrayerTimes() {
    if (!isTauri()) return;

    try {
      console.log('Mosque: Updating prayer times...');
      
      let prayerTimes;
      if (this.dateMode === 'hijri') {
        const params = {
          location: this.currentLocation,
          hijriYear: this.currentHijriDate.hijriYear,
          hijriMonth: this.currentHijriDate.hijriMonth,
          hijriDay: this.currentHijriDate.hijriDay
        };
        prayerTimes = await this.api.getPrayerTimesHijri(params);
      } else {
        const params = {
          location: this.currentLocation,
          date: this.currentDate
        };
        prayerTimes = await this.api.getPrayerTimes(params);
      }
      
      if (this.prayerTimesDisplay) {
        if (this.dateMode === 'hijri') {
          // Pass hijri date info to display
          this.prayerTimesDisplay.updateData(prayerTimes, this.currentLocation, this.currentHijriDate);
        } else {
          this.prayerTimesDisplay.updateData(prayerTimes, this.currentLocation, this.currentDate);
        }
      }
      
      console.log('Prayer times updated:', prayerTimes);
    } catch (error) {
      console.error('Error updating prayer times:', error);
      // Don't show error toast here to avoid spamming if main calc succeeds
    }
  }

  async updateCalculations() {
    // Skip if not in Tauri context
    if (!isTauri()) {
      console.warn('Skipping calculations update - Tauri context not available');
      return;
    }

    // showLoading handled by caller to coordinate with map updates
    
    try {
      console.log('Updating calculations for location:', this.currentLocation);
      console.log('Location details - lat:', this.currentLocation.latitude, 'lon:', this.currentLocation.longitude);
      console.log('Date mode:', this.dateMode);

      let result;

      if (this.dateMode === 'hijri') {
        // Use Hijri date input
        const params = {
          location: this.currentLocation,
          hijriYear: this.currentHijriDate.hijriYear,
          hijriMonth: this.currentHijriDate.hijriMonth,
          hijriDay: this.currentHijriDate.hijriDay
        };
        console.log('Sending Hijri params to backend:', JSON.stringify(params, null, 2));

        // Calculate for all criteria using Hijri date
        result = await this.api.calculateHilalAllCriteriaHijri(params);
      } else {
        // Use Gregorian date input (original behavior)
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        const day = this.currentDate.getDate();

        const params = {
          location: this.currentLocation,
          year,
          month,
          day
        };
        console.log('Sending Gregorian params to backend:', JSON.stringify(params, null, 2));

        // Calculate for all criteria
        result = await this.api.calculateHilalAllCriteria(params);
      }

      // Validate result structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid result: result is null or not an object');
      }

      if (!result.criteria_results || typeof result.criteria_results !== 'object') {
        throw new Error('Invalid result: criteria_results is missing or invalid');
      }

      if (!result.ephemeris || typeof result.ephemeris !== 'object') {
        throw new Error('Invalid result: ephemeris data is missing or invalid');
      }

      if (!result.location) {
        throw new Error('Invalid result: location data is missing');
      }

      this.currentCalculation = result;

      console.log('Received result location:', result.location);
      console.log('Result details:', JSON.stringify(result, null, 2));

      // REMOVED: Detailed hilal data merge that was overwriting correct criteria results
      // The criteria_results already contain all necessary data from backend
      // No need to merge placeholder/incorrect data from get_detailed_hilal_data
      
      if (this.criteriaResultsDisplay) {
        this.criteriaResultsDisplay.updateResults(result);
      }

      // Update map marker
      if (this.mapVisualization) {
        this.mapVisualization.updateCurrentLocationMarker(result.location);
      }

      // Update detailed ephemeris display
      if (this.detailedEphemerisDisplay) {
        this.detailedEphemerisDisplay.updateData(result);
      }

      // Store in data store
      this.dataStore.setCalculationResult(result);

      // Also calculate prayer times
      await this.updatePrayerTimes();

      // Update dashboard stats
      this.updateDashboardStats(result);
      
      // Emit calculation complete event for export manager
      document.dispatchEvent(new CustomEvent('calculation-complete', {
        detail: result
      }));

      console.log('Calculations updated successfully');
      // Success toast removed as per user request (redundant with loading animation)
      // this.showSuccess('Calculation completed successfully');

    } catch (error) {
      console.error('Error updating calculations:', error);
      this.showError('Failed to update calculations: ' + error.message);
    } 
    // finally block removed, handled by caller
  }

  showLoading(message = 'Calculating...') {
    // Remove any existing loader first
    this.hideLoading();

    const loader = document.createElement('div');
    loader.id = 'global-loader';
    // Use high Z-index and flex layout. Start with opacity 0 but display flex.
    loader.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300';
    loader.style.opacity = '0';
    
    loader.innerHTML = `
      <div class="bg-base-100/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 min-w-[300px] border border-white/20 transform scale-95 transition-transform duration-300">
        <div class="loading loading-ring loading-lg text-primary scale-150"></div>
        <div class="text-center">
          <h3 class="font-bold text-lg text-base-content">Processing</h3>
          <p class="text-sm text-base-content/70 mt-1">${message}</p>
        </div>
      </div>
    `;

    document.body.appendChild(loader);
    
    // Force layout reflow
    loader.offsetHeight; 
    
    // Immediate visibility check - no RAF delay for initial show
    loader.style.opacity = '1';
    const inner = loader.querySelector('div');
    inner.classList.remove('scale-95');
    inner.classList.add('scale-100');
  }

  hideLoading() {
    const loader = document.getElementById('global-loader');
    if (loader && loader.parentNode) {
      // Fade out
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 300);
    }
  }

  showError(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
      <span class="toast-icon">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add toast styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
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
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'toast-fade-out 0.3s ease-out';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);
  }

  // showSuccess method removed as requested (redundant)

  updateDashboardStats(result) {
    if (!result || !result.ephemeris) return;
    
    // Use topographic values from ephemeris for display
    // These are the most accurate values covering all criteria
    const eph = result.ephemeris;
    const stats = result.criteria_results ? result.criteria_results[this.selectedCriteria] : null;

    const altEl = document.getElementById('stat-altitude');
    const elongEl = document.getElementById('stat-elongation');
    const ageEl = document.getElementById('stat-age');
    const visEl = document.getElementById('stat-visibility');
    const visDescEl = document.getElementById('stat-visibility-desc');

    if (altEl) altEl.textContent = `${eph.moon_altitude_airy_topo.toFixed(2)}°`;
    if (elongEl) elongEl.textContent = `${eph.elongation_topo.toFixed(2)}°`;
    if (ageEl) ageEl.textContent = `${eph.moon_age_hours_topo.toFixed(2)}h`;
    
    // Visibility status comes from criteria check
    if (visEl && stats) {
      visEl.textContent = stats.is_visible ? 'Visible' : 'Not Visible';
      visEl.className = `stat-value text-3xl ${stats.is_visible ? 'text-success' : 'text-error'}`;
    }
    
    if (visDescEl && stats) {
      visDescEl.textContent = stats.is_visible ? 'HILAL TERLIHAT' : 'HILAL TIDAK TERLIHAT';
      visDescEl.className = `stat-desc font-bold ${stats.is_visible ? 'text-success' : 'text-error'}`;
    }
  }
}