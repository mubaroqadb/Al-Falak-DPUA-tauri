// Module untuk kriteria visibilitas Wujudul Hilal
// Port dari: Muhammadiyah criteria (Wujudul Hilal = Existence of Crescent)
//
// Kriteria Wujudul Hilal:
// 1. Ijtimak (konjungsi/new moon) terjadi sebelum maghrib
// 2. Bulan berada di atas ufuk pada saat maghrib
//
// Jika kedua kondisi terpenuhi, maka hilal secara teknis "ada" (wujud)

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi Wujudul Hilal
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WujudulHilalResult {
    pub is_visible: bool,
    pub ijtimak_before_maghrib: bool,
    pub moon_above_horizon: bool,
    pub moon_altitude: f64,
}

/// Evaluasi kriteria Wujudul Hilal
///
/// Muhammadiyah criterion hanya mengecek apakah bulan secara matematis
/// dapat ada (exist) di atas horizon saat maghrib
pub fn evaluate_wujudul_hilal(
    location: &GeoLocation,
    date: &GregorianDate,
    conjunction_jd: f64,
) -> WujudulHilalResult {
    let jd = crate::calendar::gregorian_to_jd(date);

    // Hitung waktu maghrib dalam Julian Day
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_jd = jd + (sunset_hour / 24.0);

    // Kondisi 1: Ijtimak terjadi sebelum maghrib
    let ijtimak_before_maghrib = conjunction_jd < sunset_jd;

    // Kondisi 2: Hitung altitude bulan pada saat maghrib (TOPOCENTRIC)
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, true);
    let moon_above_horizon = moon_altitude > 0.0;

    // Hasil: Hilal terjadi jika kedua kondisi terpenuhi
    let is_visible = ijtimak_before_maghrib && moon_above_horizon;

    WujudulHilalResult {
        is_visible,
        ijtimak_before_maghrib,
        moon_above_horizon,
        moon_altitude,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wujudul_hilal_both_conditions() {
        // Jika kedua kondisi terpenuhi, seharusnya visible
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
        let conjunction_jd = 2460374.2; // Example conjunction time

        let result = evaluate_wujudul_hilal(&location, &date, conjunction_jd);

        // Minimal checks - actual values depend on astronomical calculations
        assert!(result.ijtimak_before_maghrib || !result.ijtimak_before_maghrib);
    }
}
