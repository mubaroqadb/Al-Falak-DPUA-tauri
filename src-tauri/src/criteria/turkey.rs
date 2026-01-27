// Module untuk kriteria visibilitas Turkey (Diyanet)
// Port dari: Turkish Religious Affairs (Diyanet) 2016 criteria
//
// Kriteria Turkey:
// - Tinggi bulan ≥ 5°
// - Elongasi ≥ 8° (topocentric preferred)
//
// Ini adalah kriteria yang lebih ketat daripada MABIMS

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi Turkey criteria
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TurkeyResult {
    pub is_visible: bool,
    pub moon_altitude: f64,
    pub elongation: f64,
    pub altitude_ok: bool,
    pub elongation_ok: bool,
}

/// Evaluasi kriteria Turkey/Diyanet
pub fn evaluate_turkey(
    location: &GeoLocation,
    date: &GregorianDate,
    use_topocentric: bool,
) -> TurkeyResult {
    // Hitung altitude bulan pada saat maghrib
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, use_topocentric);

    // Hitung elongasi pada saat maghrib
    let elongation = crate::astronomy::elongation_at_sunset(location, date, use_topocentric);

    // Evaluasi kriteria Turkey
    let altitude_ok = moon_altitude >= 5.0;
    let elongation_ok = elongation >= 8.0;
    let is_visible = altitude_ok && elongation_ok;

    TurkeyResult {
        is_visible,
        moon_altitude,
        elongation,
        altitude_ok,
        elongation_ok,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_turkey_criteria_requirements() {
        let location = GeoLocation {
            name: None,
            latitude: 39.0,
            longitude: 35.0,
            elevation: 0.0,
            timezone: 3.0,
        };
        let date = GregorianDate {
            year: 2024,
            month: 3,
            day: 30.0,
        };

        let result = evaluate_turkey(&location, &date, false);

        // Hasil harus konsisten dengan komponen-nya
        if result.altitude_ok && result.elongation_ok {
            assert!(result.is_visible);
        } else {
            assert!(!result.is_visible);
        }
    }
}
