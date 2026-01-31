// Application constants and configuration

export const APP_CONFIG = {
  name: 'Al Falak DPUA - Hisab Hilal',
  version: '1.0.0',
  author: 'DPUA - Teams',
  description: 'Aplikasi perhitungan visibilitas hilal dengan berbagai kriteria astronomi'
};

export const ASTRONOMICAL_CONSTANTS = {
  // Earth's equatorial radius in kilometers
  EARTH_RADIUS: 6371,

  // Moon's synodic period in days
  MOON_SYNODIC_PERIOD: 29.530588,

  // Astronomical unit in kilometers
  AU: 149597870.7,

  // Speed of light in km/s
  SPEED_OF_LIGHT: 299792.458,

  // Julian day for J2000.0 epoch
  J2000: 2451545.0,

  // Solar radius in kilometers
  SOLAR_RADIUS: 696340,

  // Lunar radius in kilometers
  LUNAR_RADIUS: 1737.4
};

export const VISIBILITY_CRITERIA = {
  MABIMS: {
    name: 'MABIMS',
    description: 'Majlis Agama Brunei, Indonesia, Malaysia dan Singapura - Kriteria baru (sejak 2021)',
    requirements: {
      altitude: 3, // degrees
      elongation: 6.4, // degrees
      age: 0 // hours
    }
  },

  MABIMSLama: {
    name: 'MABIMS Lama',
    description: 'MABIMS Kriteria lama (sebelum 2021) - Tinggi ≥ 2°, Elongasi ≥ 3°, Umur ≥ 8 jam',
    requirements: {
      altitude: 2, // degrees
      elongation: 3, // degrees
      age: 8 // hours
    }
  },

  MABIMSBaru: {
    name: 'MABIMS Baru',
    description: 'MABIMS Kriteria baru (sejak 2021) - Tinggi ≥ 3°, Elongasi ≥ 6.4°',
    requirements: {
      altitude: 3, // degrees
      elongation: 6.4, // degrees
      age: 0 // hours
    }
  },

  WujudulHilal: {
    name: 'Wujudul Hilal',
    description: 'Kriteria Wujudul Hilal - Ijtimak sebelum maghrib, bulan di atas ufuk',
    requirements: {
      altitude: -0.2575, // degrees
      elongation: 0, // degrees
      age: 0 // hours
    }
  },

  IjtimaQoblaGhurub: {
    name: 'Ijtima Qobla Ghurub',
    description: 'Kriteria Ijtima Qobla Ghurub - Hanya cek ijtimak sebelum maghrib',
    requirements: {
      altitude: 0, // degrees
      elongation: 0, // degrees
      age: 0 // hours
    }
  },

  Odeh: {
    name: 'Odeh',
    description: 'Kriteria Muhammad Odeh - Formula kompleks dengan ARCV calculation',
    requirements: {
      altitude: 5, // degrees
      elongation: 6.4, // degrees
      age: 0 // hours
    }
  },

  Turkey: {
    name: 'Turkey',
    description: 'Kriteria Turki - Tinggi ≥ 5°, Elongasi ≥ 8°',
    requirements: {
      altitude: 5, // degrees
      elongation: 8, // degrees
      age: 0 // hours
    }
  },

  LFNU: {
    name: 'LFNU',
    description: 'Lembaga Falakiyah NU - Sama dengan MABIMS lama',
    requirements: {
      altitude: 2, // degrees
      elongation: 3, // degrees
      age: 8 // hours
    }
  },

  KIG: {
    name: 'KIG',
    description: 'Kriteria KIG - Definisi belum jelas, perlu investigasi lebih lanjut',
    requirements: {
      altitude: 0, // degrees
      elongation: 0, // degrees
      age: 0 // hours
    }
  },

  Kriteria29: {
    name: 'Kriteria 29',
    description: 'Kriteria 29 - Definisi belum jelas, perlu investigasi',
    requirements: {
      altitude: 0, // degrees
      elongation: 0, // degrees
      age: 0 // hours
    }
  },

  KHGT: {
    name: 'KHGT',
    description: 'Kalender Hijriah Global Tunggal (Muhammadiyah) - Tinggi ≥ 5°, Elongasi ≥ 8°',
    requirements: {
      altitude: 5,
      elongation: 8,
      age: 0
    }
  }
};

export const MAP_CONFIG = {
  defaultCenter: [-6.2088, 106.8456], // Jakarta coordinates
  defaultZoom: 6,
  maxZoom: 18,
  minZoom: 3,

  // Tile layers
  tileLayers: {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    }
  },

  // Visibility zones colors
  visibilityZones: {
    visible: '#28a745',    // Green
    marginal: '#ffc107',   // Yellow
    notVisible: '#dc3545'  // Red
  }
};

export const UI_CONFIG = {
  // Animation durations
  animationDuration: 300, // ms

  // Toast notification settings
  toastDuration: 3000, // ms

  // Date picker settings
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',

  // Number formatting
  coordinateDecimals: 4,
  angleDecimals: 2,
  distanceDecimals: 0,

  // Table settings
  pageSize: 50,
  maxRows: 1000
};

export const API_ENDPOINTS = {
  // Tauri invoke commands
  calculateVisibility: 'calculate_hilal_visibility',
  getEphemeris: 'get_ephemeris_data',
  calculateQibla: 'calculate_qibla_direction',
  getPrayerTimes: 'get_prayer_times',

  // External APIs (if needed)
  geocoding: 'https://api.opencagedata.com/geocode/v1/json',
  timezone: 'https://api.timezonedb.com/v2.1/get-time-zone'
};

export const ERROR_MESSAGES = {
  INVALID_COORDINATES: 'Koordinat yang dimasukkan tidak valid',
  INVALID_DATE: 'Tanggal yang dimasukkan tidak valid',
  CALCULATION_ERROR: 'Terjadi kesalahan dalam perhitungan',
  NETWORK_ERROR: 'Tidak dapat terhubung ke server',
  LOCATION_NOT_FOUND: 'Lokasi tidak ditemukan',
  CRITERIA_NOT_FOUND: 'Kriteria visibilitas tidak ditemukan'
};

export const SUCCESS_MESSAGES = {
  CALCULATION_COMPLETE: 'Perhitungan selesai',
  DATA_EXPORTED: 'Data berhasil diekspor',
  LOCATION_SAVED: 'Lokasi berhasil disimpan',
  SETTINGS_UPDATED: 'Pengaturan berhasil diperbarui'
};