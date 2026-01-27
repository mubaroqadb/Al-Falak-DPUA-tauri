// Module untuk kriteria visibilitas LFNU (Lembaga Falakiyah Nahdlatul Ulama)
// Port dari: LFNU criterion (Indonesian Islamic organization)
//
// Kriteria LFNU (Lembaga Falakiyah Nahdlatul Ulama):
// - Tinggi bulan ≥ 2°
// - Elongasi ≥ 3° (jarak sudut bulan-matahari)
//
// Kriteria LFNU sama dengan MABIMS (Lama) untuk praktisnya
// Referensi: PBNU/Nahdlatul Ulama

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi LFNU
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct LfnuResult {
    pub is_visible: bool,
    pub moon_altitude: f64,
    pub elongation: f64,
    pub altitude_ok: bool,
    pub elongation_ok: bool,
}

/// Evaluasi kriteria LFNU
///
/// Kriteria LFNU dari Lembaga Falakiyah Nahdlatul Ulama
/// Standar praktis yang sama dengan MABIMS (Lama)
pub fn evaluate_lfnu(location: &GeoLocation, date: &GregorianDate) -> LfnuResult {
    // Hitung altitude bulan pada saat maghrib (TOPOCENTRIC)
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, true);

    // Hitung elongasi pada saat maghrib (TOPOCENTRIC)
    let elongation = crate::astronomy::elongation_at_sunset(location, date, true);

    // Evaluasi kriteria LFNU
    let altitude_ok = moon_altitude >= 2.0;
    let elongation_ok = elongation >= 3.0;
    let is_visible = altitude_ok && elongation_ok;

    LfnuResult {
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
    fn test_lfnu_criteria_requirements() {
        let location = GeoLocation {
            name: None,
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };
        let date = GregorianDate {
            year: 2024,
            month: 3,
            day: 30.0,
        };

        let result = evaluate_lfnu(&location, &date);

        // Hasil harus konsisten dengan komponen-nya
        if result.altitude_ok && result.elongation_ok {
            assert!(result.is_visible);
        } else {
            assert!(!result.is_visible);
        }
    }

    #[test]
    fn test_lfnu_altitude_threshold() {
        // Test bahwa altitude ≥ 2° adalah threshold
        let location = GeoLocation {
            name: None,
            latitude: 0.0,
            longitude: 0.0,
            elevation: 0.0,
            timezone: 0.0,
        };
        let date = GregorianDate {
            year: 2024,
            month: 3,
            day: 1.0,
        };

        let result = evaluate_lfnu(&location, &date);

        // Threshold check
        assert_eq!(result.altitude_ok, result.moon_altitude >= 2.0);
        assert_eq!(result.elongation_ok, result.elongation >= 3.0);
    }
}
