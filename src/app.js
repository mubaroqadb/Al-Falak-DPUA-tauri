// Main Application Class for Hisab Hilal
// Manages overall application state and coordination

import { HilalAPI, isTauri } from './services/api.js';
import { DataStore } from './services/DataStore.js';
import { VISIBILITY_CRITERIA } from './utils/constants.js';
import { i18n } from './services/i18n.js';

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
          // Use requestAnimationFrame for more reliable yielding
          await new Promise(resolve => requestAnimationFrame(resolve));

          // Prepare date for calculation (convert if needed)
          if (this.hijriDateInput) {
            await this.hijriDateInput.prepareForCalculation();
          }

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
          // Use requestAnimationFrame for more reliable yielding
          await new Promise(resolve => requestAnimationFrame(resolve));

          // Prepare date for calculation (convert if needed)
          if (this.hijriDateInput) {
            await this.hijriDateInput.prepareForCalculation();
          }

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
    // Note: This is handled by the HijriDateInput component itself
    // The component dispatches 'date-changed' events which we listen to below
    // We don't need to add a separate listener here as it would conflict

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

      // Always use Gregorian date for visibility zones
      // If in Hijri mode, get the converted Gregorian date
      const calculationDate = this.hijriDateInput ?
        this.hijriDateInput.getGregorianDateForCalculation() :
        this.currentDate;

      const params = {
        date: calculationDate,
        criteria: this.selectedCriteria,
        step_degrees: 2.0
      };
      console.log('Sending Gregorian params for visibility zones:', JSON.stringify(params, null, 2));

      const visibilityData = await this.api.getVisibilityZones(params);

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

      // Always use Gregorian date for prayer times
      // If in Hijri mode, get the converted Gregorian date
      const calculationDate = this.hijriDateInput ?
        this.hijriDateInput.getGregorianDateForCalculation() :
        this.currentDate;

      const params = {
        location: this.currentLocation,
        date: calculationDate
      };
      console.log('Sending Gregorian params for prayer times:', JSON.stringify(params, null, 2));

      const prayerTimes = await this.api.getPrayerTimes(params);

      if (this.prayerTimesDisplay) {
        // Pass the appropriate date info to display
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
      console.log('Hijri Date Input Reference:', !!this.hijriDateInput);

      let result;
      let convertedDateInfo = null;

      // DEBUG: Verify hijriDateInput reference
      console.log('DEBUG: hijriDateInput present:', !!this.hijriDateInput);
      if (!this.hijriDateInput && this.dateMode === 'hijri') {
         console.error('CRITICAL: Hijri mode active but hijriDateInput component not found!');
         // Try to find it again
         this.hijriDateInput = document.querySelector('hijri-date-input');
      }

      // Handle Date Conversion based on mode
      let calculationDate;
      const hijriInput = this.hijriDateInput;

      if (this.dateMode === 'hijri' && hijriInput) {
        // Mode Hijri: We need to convert Hijri -> Gregorian for calculation
        
        const hijriDate = hijriInput.getDate(); // returns object {hijriYear...}
        console.log('Calculating for Hijri Date object:', JSON.stringify(hijriDate));
        
        // 1. Convert Hijri -> Gregorian
        const gregResult = await this.api.hijriToGregorian({
           year: hijriDate.hijriYear,
           month: hijriDate.hijriMonth,
           day: hijriDate.hijriDay
        });
        console.log('API hijriToGregorian Result:', gregResult);
        
        if (gregResult) {
            calculationDate = new Date(gregResult.year, gregResult.month - 1, gregResult.day);
            
            // Prepare info for display
            convertedDateInfo = {
            original: `${hijriDate.hijriDay} ${this.getHijriMonthName(hijriDate.hijriMonth)} ${hijriDate.hijriYear} H`,
            converted: `${gregResult.day} ${this.getGregorianMonthName(gregResult.month)} ${gregResult.year} M`,
            type: 'hijri-to-gregorian'
            };
            console.log('Generated convertedDateInfo (Hijri Mode):', convertedDateInfo);
        } else {
             console.error('Failed to get Gregorian result from API');
             // DEBUG: Alert on failure
             alert('Debug: API hijriToGregorian returned null');
             calculationDate = new Date(); // Fallback
        }

      } else {
        // Mode Gregorian
        // Get date from input or state
        calculationDate = this.currentDate;
        console.log('Calculating fro Gregorian Date:', calculationDate);
        
        // 1. Convert Gregorian -> Hijri for display
        const year = calculationDate.getFullYear();
        const month = calculationDate.getMonth() + 1;
        const day = calculationDate.getDate();
        
        const hijriResult = await this.api.gregorianToHijri({ year, month, day });
        console.log('API gregorianToHijri Result:', hijriResult);
        
        if (hijriResult) {
            // Prepare info for display
            convertedDateInfo = {
            original: `${day} ${this.getGregorianMonthName(month)} ${year} M`,
            converted: `${hijriResult.day} ${this.getHijriMonthName(hijriResult.month)} ${hijriResult.year} H`,
            type: 'gregorian-to-hijri'
            };
             console.log('Generated convertedDateInfo (Gregorian Mode):', convertedDateInfo);
        }
      }

      const year = calculationDate.getFullYear();
      const month = calculationDate.getMonth() + 1;
      const day = calculationDate.getDate();

      const params = {
        location: this.currentLocation,
        year,
        month,
        day
      };
      
      console.log('Sending Gregorian params to backend:', JSON.stringify(params, null, 2));

      // Calculate for all criteria using Gregorian date
      result = await this.api.calculateHilalAllCriteria(params);

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

      // Inject converted date info into result
      if (convertedDateInfo) {
        result.converted_date_info = convertedDateInfo;
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
      
      // DEBUG: Inspect Altitude
      if (result.ephemeris && result.ephemeris.moon_altitude_airy_topo) {
          const alt = result.ephemeris.moon_altitude_airy_topo;
          if (alt > 90 || alt < -90) {
             console.error(`DEBUG: Suspicious Altitude detected: ${alt}`);
             alert(`DEBUG: Suspicious Altitude: ${alt}`);
          }
      }

      // Also calculate prayer times
      await this.updatePrayerTimes();

      // Update dashboard stats
      this.updateDashboardStats(result);
      
      // Emit calculation complete event for export manager
      document.dispatchEvent(new CustomEvent('calculation-complete', {
        detail: result
      }));

      // Force update ResultsDisplay to show converted date
      if (this.resultsDisplay) {
        this.resultsDisplay.updateResults(result);
      }

      console.log('Calculations updated successfully');

    } catch (error) {
      console.error('Error updating calculations:', error);
      this.showError('Failed to update calculations: ' + error.message);
    } 
    // finally block removed, handled by caller
  }

  getHijriMonthName(month) {
    const locale = i18n.getLocale();
    // Use Intl.DateTimeFormat with Islamic calendar if possible, or fallback to fixed names
    const monthNames = [
      'Muharram', 'Safar', 'Rabi\'ul Awal', 'Rabi\'ul Akhir',
      'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Syawwal', 'Dzulqa\'dah', 'Dzulhijjah'
    ];
    return monthNames[month - 1] || '';
  }

  getGregorianMonthName(month) {
    const date = new Date(2000, month - 1, 1);
    const locale = i18n.getLocale();
    return date.toLocaleDateString(locale, { month: 'long' });
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

    if (altEl && eph.moon_altitude_airy_topo !== null && eph.moon_altitude_airy_topo !== undefined) {
      altEl.textContent = `${eph.moon_altitude_airy_topo.toFixed(2)}°`;
    } else {
      if (altEl) altEl.textContent = '--°';
    }

    if (elongEl && eph.elongation_topo !== null && eph.elongation_topo !== undefined) {
      elongEl.textContent = `${eph.elongation_topo.toFixed(2)}°`;
    } else {
      if (elongEl) elongEl.textContent = '--°';
    }

    if (ageEl && eph.moon_age_hours_topo !== null && eph.moon_age_hours_topo !== undefined) {
      ageEl.textContent = `${eph.moon_age_hours_topo.toFixed(2)}h`;
    } else {
      if (ageEl) ageEl.textContent = '--h';
    }
    
    // Visibility status comes from criteria check
    if (visEl && stats) {
      visEl.textContent = stats.is_visible ? i18n.t('criteriaResults.visible', 'Visible') : i18n.t('criteriaResults.notVisible', 'Not Visible');
      visEl.className = `stat-value text-3xl ${stats.is_visible ? 'text-success' : 'text-error'}`;
    }
    
    if (visDescEl && stats) {
      visDescEl.textContent = stats.is_visible ? i18n.t('results.visible', 'HILAL TERLIHAT') : i18n.t('results.notVisible', 'HILAL TIDAK TERLIHAT');
      visDescEl.className = `stat-desc font-bold ${stats.is_visible ? 'text-success' : 'text-error'}`;
    }
  }
}