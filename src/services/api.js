// API Service for communicating with Tauri Rust backend
// Handles all invoke calls to Rust functions

// Helper to safely obtain Tauri invoke (works in tauri dev/build, guards plain vite)
let cachedInvoke = null;
let isTauriContext = false;

async function getInvoke() {
  if (cachedInvoke) return cachedInvoke;

  // Log current environment for debugging
  console.log('Detecting Tauri context...');
  console.log('  window.__TAURI__ exists:', typeof window !== 'undefined' && !!window.__TAURI__);
  console.log('  window.__TAURI__.core:', window?.__TAURI__?.core);
  console.log('  window.__TAURI__.invoke:', window?.__TAURI__?.invoke);

  // Check if running in Tauri context
  if (typeof window !== 'undefined' && window.__TAURI__) {
    // Tauri 2.x API structure
    if (window.__TAURI__.core?.invoke) {
      cachedInvoke = window.__TAURI__.core.invoke.bind(window.__TAURI__.core);
      isTauriContext = true;
      console.log('Tauri invoke loaded from window.__TAURI__.core');
      return cachedInvoke;
    }
    
    // Fallback for older Tauri API structure
    if (window.__TAURI__.invoke) {
      cachedInvoke = window.__TAURI__.invoke.bind(window.__TAURI__);
      isTauriContext = true;
      console.log('Tauri invoke loaded from window.__TAURI__');
      return cachedInvoke;
    }
  }

  // Try dynamic import as fallback
  try {
    const tauriApi = await import('@tauri-apps/api/core');
    if (tauriApi?.invoke) {
      cachedInvoke = tauriApi.invoke;
      isTauriContext = true;
      console.log('Tauri invoke loaded via dynamic import');
      return cachedInvoke;
    }
  } catch (err) {
    console.warn('Tauri core import failed:', err.message);
  }

  // If still not available, show helpful error
  isTauriContext = false;
  const errorMsg = 'Tauri invoke tidak tersedia. Aplikasi harus dijalankan via "npm run tauri dev" atau Tauri build.';
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Check if we're in Tauri context
export function isTauri() {
  return isTauriContext || (typeof window !== 'undefined' && !!window.__TAURI__);
}

export class HilalAPI {
  constructor() {
    // Initialize any API-specific configuration here
  }

  /**
   * Calculate hilal visibility for all criteria
   * @param {Object} params - Calculation parameters
   * @param {Object} params.location - Location object {latitude, longitude, elevation, timezone}
   * @param {number} params.year - Gregorian year
   * @param {number} params.month - Gregorian month (1-12)
   * @param {number} params.day - Gregorian day (1-31)
   * @returns {Promise<Object>} All criteria results with visibility
   */
  async calculateHilalAllCriteria(params) {
    try {
      console.log('API Call - calculateHilalAllCriteria:', params);
      const invoke = await getInvoke();
      const result = await invoke('calculate_hilal_visibility_command', {
        location: params.location,
        year: params.year,
        month: params.month,
        day: params.day
      });

      console.log('API Response - calculateHilalAllCriteria:', result);
      return result;
    } catch (error) {
      console.error('API Error - calculateHilalAllCriteria:', error);
      throw new Error(`Failed to calculate hilal for all criteria: ${error.message}`);
    }
  }

  /**
   * Get visibility zones for given criteria and date
   * @param {Object} params - Zone calculation parameters
   * @param {Date} params.date - Date for calculation
   * @param {string} params.criteria - Visibility criteria
   * @param {number} params.step_degrees - Grid resolution in degrees
   * @returns {Promise<Array>} Array of visibility zones
   */
  async getVisibilityZones(params) {
    try {
      console.log('API Call - getVisibilityZones:', params);
      const invoke = await getInvoke();
      const result = await invoke('calculate_visibility_zones', {
        date: params.date.toISOString(),
        criteria: params.criteria,
        stepDegrees: params.step_degrees || 2.0
      });

      console.log('API Response - getVisibilityZones:', result);
      return result;
    } catch (error) {
      console.error('API Error - getVisibilityZones:', error);
      throw new Error(`Failed to get visibility zones: ${error.message}`);
    }
  }

  /**
   * Get ephemeris data for astronomical calculations
   * @param {Object} params - Ephemeris parameters
   * @param {Object} params.location - Location object
   * @param {Date} params.start_date - Start date
   * @param {Date} params.end_date - End date
   * @returns {Promise<Array>} Ephemeris data
   */
  async getEphemeris(params) {
    try {
      console.log('API Call - getEphemeris:', params);
      const invoke = await getInvoke();
      const result = await invoke('get_ephemeris_data', {
        location: params.location,
        start_date: params.start_date.toISOString(),
        end_date: params.end_date.toISOString()
      });

      console.log('API Response - getEphemeris:', result);
      return result;
    } catch (error) {
      console.error('API Error - getEphemeris:', error);
      throw new Error(`Failed to get ephemeris data: ${error.message}`);
    }
  }

  /**
   * Calculate Qibla direction
   * @param {Object} params - Qibla calculation parameters
   * @param {Object} params.location - Location object
   * @returns {Promise<Object>} Qibla direction data
   */
  async calculateQibla(params) {
    try {
      console.log('API Call - calculateQibla:', params);
      const invoke = await getInvoke();
      const result = await invoke('calculate_qibla_direction', {
        location: params.location
      });

      console.log('API Response - calculateQibla:', result);
      return result;
    } catch (error) {
      console.error('API Error - calculateQibla:', error);
      throw new Error(`Failed to calculate Qibla: ${error.message}`);
    }
  }

  /**
   * Get prayer times
   * @param {Object} params - Prayer times parameters
   * @param {Object} params.location - Location object
   * @param {Date} params.date - Date for calculation
   * @returns {Promise<Object>} Prayer times data
   */
  async getPrayerTimes(params) {
    try {
      console.log('API Call - getPrayerTimes:', params);
      const invoke = await getInvoke();
      const result = await invoke('get_prayer_times', {
        location: params.location,
        date: params.date.toISOString()
      });

      console.log('API Response - getPrayerTimes:', result);
      return result;
    } catch (error) {
      console.error('API Error - getPrayerTimes:', error);
      throw new Error(`Failed to get prayer times: ${error.message}`);
    }
  }

  /**
   * Get detailed hilal data for specific location and date
   * @param {Object} params - Parameters
   * @param {Object} params.location - Location object
   * @param {number} params.year - Year
   * @param {number} params.month - Month
   * @param {number} params.day - Day
   * @returns {Promise<Object>} Detailed hilal data
   */
  async getDetailedHilalData(params) {
    try {
      console.log('API Call - getDetailedHilalData:', params);
      const invoke = await getInvoke();
      const result = await invoke('get_detailed_hilal_data', {
        location: params.location,
        year: params.year,
        month: params.month,
        day: params.day
      });

      console.log('API Response - getDetailedHilalData:', result);
      return result;
    } catch (error) {
      console.error('API Error - getDetailedHilalData:', error);
      throw new Error(`Failed to get detailed hilal data: ${error.message}`);
    }
  }

  /**
   * Get astronomical data for specific location and time
   * @param {Object} params - Astronomical data parameters
   * @param {Object} params.location - Location object {latitude, longitude, elevation, timezone}
   * @param {number} params.year - Gregorian year
   * @param {number} params.month - Gregorian month (1-12)
   * @param {number} params.day - Gregorian day (1-31)
   * @param {number} params.hour - Hour (0-23)
   * @param {number} params.minute - Minute (0-59)
   * @returns {Promise<Object>} Astronomical data with sun/moon positions
   */
  async getAstronomicalDataNew(params) {
    try {
      console.log('API Call - getAstronomicalDataNew:', params);
      const invoke = await getInvoke();
      const result = await invoke('get_astronomical_data_command', {
        location: params.location,
        year: params.year,
        month: params.month,
        day: params.day,
        hour: params.hour || 12,
        minute: params.minute || 0
      });

      console.log('API Response - getAstronomicalDataNew:', result);
      return result;
    } catch (error) {
      console.error('API Error - getAstronomicalDataNew:', error);
      throw new Error(`Failed to get astronomical data: ${error.message}`);
    }
  }

  /**
   * Validate location coordinates
   * @param {Object} location - Location to validate
   * @returns {Promise<Object>} Validation result with error list
   */
  async validateLocation(location) {
    try {
      console.log('API Call - validateLocation:', location);
      const invoke = await getInvoke();
      const result = await invoke('validate_location_command', { location });

      console.log('API Response - validateLocation:', result);
      return result;
    } catch (error) {
      console.error('API Error - validateLocation:', error);
      throw new Error(`Failed to validate location: ${error.message}`);
    }
  }

  /**
   * Convert Gregorian date to Hijri
   * @param {number} year - Gregorian year
   * @param {number} month - Gregorian month (1-12)
   * @param {number} day - Gregorian day (1-31)
   * @returns {Promise<Object>} Hijri date {year, month, day}
   */
  async gregorianToHijri(year, month, day) {
    try {
      console.log('API Call - gregorianToHijri:', { year, month, day });
      const invoke = await getInvoke();
      const result = await invoke('gregorian_to_hijri_command', {
        year,
        month,
        day
      });

      console.log('API Response - gregorianToHijri:', result);
      return result;
    } catch (error) {
      console.error('API Error - gregorianToHijri:', error);
      throw new Error(`Failed to convert to Hijri: ${error.message}`);
    }
  }

  /**
   * Convert Hijri date to Gregorian
   * @param {number} year - Hijri year
   * @param {number} month - Hijri month (1-12)
   * @param {number} day - Hijri day (1-30)
   * @returns {Promise<Object>} Gregorian date {year, month, day}
   */
  async hijriToGregorian(year, month, day) {
    try {
      console.log('API Call - hijriToGregorian:', { year, month, day });
      const invoke = await getInvoke();
      const result = await invoke('hijri_to_gregorian_command', {
        year,
        month,
        day
      });

      console.log('API Response - hijriToGregorian:', result);
      return result;
    } catch (error) {
      console.error('API Error - hijriToGregorian:', error);
      throw new Error(`Failed to convert to Gregorian: ${error.message}`);
    }
  }

  /**
   * Run astronomical validation tests
   * @returns {Promise<Object>} Validation results {success, message, details}
   */
  async runValidationTests() {
    try {
      console.log('API Call - runValidationTests');
      const invoke = await getInvoke();
      const result = await invoke('run_validation_tests_command');

      console.log('API Response - runValidationTests:', result);
      return result;
    } catch (error) {
      console.error('API Error - runValidationTests:', error);
      throw new Error(`Failed to run validation tests: ${error.message}`);
    }
  }
}