// Utility functions for astronomical calculations and formatting

export class AstroUtils {
  /**
   * Convert degrees to radians
   */
  static degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Convert radians to degrees
   */
  static radToDeg(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Normalize angle to 0-360 degrees
   */
  static normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calculate bearing between two points
   */
  static calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = this.degToRad(lon2 - lon1);
    const lat1Rad = this.degToRad(lat1);
    const lat2Rad = this.degToRad(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    const bearing = this.radToDeg(Math.atan2(y, x));
    return this.normalizeAngle(bearing);
  }

  /**
   * Calculate moon phase from age
   */
  static getMoonPhase(moonAge) {
    const phase = (moonAge / 29.53) * 360;
    const normalizedPhase = this.normalizeAngle(phase);

    if (normalizedPhase < 45) return 'New Moon';
    if (normalizedPhase < 90) return 'Waxing Crescent';
    if (normalizedPhase < 135) return 'First Quarter';
    if (normalizedPhase < 180) return 'Waxing Gibbous';
    if (normalizedPhase < 225) return 'Full Moon';
    if (normalizedPhase < 270) return 'Waning Gibbous';
    if (normalizedPhase < 315) return 'Last Quarter';
    return 'Waning Crescent';
  }

  /**
   * Check visibility criteria
   */
  static checkVisibilityCriteria(data, criteria = 'MABIMS') {
    const checks = {
      altitude: false,
      elongation: false,
      age: false,
      overall: false
    };

    // Basic checks
    if (data.moon_altitude > 3) checks.altitude = true;
    if (data.elongation > 6.4) checks.elongation = true;
    if (data.moon_age > 0) checks.age = true;

    // Criteria-specific checks
    switch (criteria.toUpperCase()) {
      case 'MABIMS':
        checks.overall = checks.altitude && checks.elongation && checks.age;
        break;
      case 'ODEH':
        checks.overall = checks.altitude && checks.elongation && checks.age &&
                        data.moon_altitude > 5;
        break;
      case 'YALLIOPOULOS':
        checks.overall = checks.altitude && checks.elongation && checks.age &&
                        data.elongation > 8;
        break;
      case 'SAYOGYA':
        checks.overall = checks.altitude && checks.elongation && checks.age &&
                        data.moon_altitude > 4.5;
        break;
      default:
        checks.overall = checks.altitude && checks.elongation && checks.age;
    }

    return checks;
  }
}

export class FormatUtils {
  /**
   * Format date to Indonesian locale
   */
  static formatDate(date, options = {}) {
    if (!date) return 'N/A';

    const defaultOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };

    try {
      return new Date(date).toLocaleDateString('id-ID', defaultOptions);
    } catch {
      return date;
    }
  }

  /**
   * Format time to Indonesian locale
   */
  static formatTime(time, options = {}) {
    if (!time) return 'N/A';

    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...options
    };

    try {
      return new Date(time).toLocaleTimeString('id-ID', defaultOptions);
    } catch {
      return time;
    }
  }

  /**
   * Format number with specified decimal places
   */
  static formatNumber(num, decimals = 2) {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  }

  /**
   * Format angle with degree symbol
   */
  static formatAngle(angle, decimals = 2) {
    if (typeof angle !== 'number' || isNaN(angle)) return 'N/A';
    return `${angle.toFixed(decimals)}°`;
  }

  /**
   * Format distance in kilometers
   */
  static formatDistance(distance, decimals = 0) {
    if (typeof distance !== 'number' || isNaN(distance)) return 'N/A';
    return `${distance.toFixed(decimals)} km`;
  }

  /**
   * Format time duration in hours and minutes
   */
  static formatDuration(hours) {
    if (typeof hours !== 'number' || isNaN(hours)) return 'N/A';

    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  /**
   * Format coordinates
   */
  static formatCoordinates(lat, lon, decimals = 4) {
    if (typeof lat !== 'number' || typeof lon !== 'number' ||
        isNaN(lat) || isNaN(lon)) return 'N/A';

    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';

    return `${Math.abs(lat).toFixed(decimals)}°${latDir}, ${Math.abs(lon).toFixed(decimals)}°${lonDir}`;
  }

  /**
   * Format label from camelCase or snake_case to Title Case
   */
  static formatLabel(str) {
    if (!str) return '';

    return str
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export class ValidationUtils {
  /**
   * Validate latitude (-90 to 90)
   */
  static isValidLatitude(lat) {
    return typeof lat === 'number' && lat >= -90 && lat <= 90;
  }

  /**
   * Validate longitude (-180 to 180)
   */
  static isValidLongitude(lon) {
    return typeof lon === 'number' && lon >= -180 && lon <= 180;
  }

  /**
   * Validate date string or Date object
   */
  static isValidDate(date) {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  /**
   * Validate astronomical data object
   */
  static validateAstronomicalData(data) {
    const errors = [];

    if (!data) {
      errors.push('Data is required');
      return errors;
    }

    if (!this.isValidLatitude(data.latitude)) {
      errors.push('Invalid latitude');
    }

    if (!this.isValidLongitude(data.longitude)) {
      errors.push('Invalid longitude');
    }

    if (!this.isValidDate(data.date)) {
      errors.push('Invalid date');
    }

    if (typeof data.moon_altitude !== 'number' || isNaN(data.moon_altitude)) {
      errors.push('Invalid moon altitude');
    }

    if (typeof data.elongation !== 'number' || isNaN(data.elongation)) {
      errors.push('Invalid elongation');
    }

    return errors;
  }
}