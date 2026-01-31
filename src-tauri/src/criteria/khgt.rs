// Module untuk kriteria KHGT (Kalender Hijriah Global Tunggal)
// Berdasarkan kriteria Istanbul 2016 yang diadopsi Muhammadiyah
//
// Kriteria:
// - Tinggi bulan ≥ 5°
// - Elongasi ≥ 8°
//

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi KHGT criteria
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct KhgtResult {
    pub is_visible: bool,
    pub moon_altitude: f64,
    pub elongation: f64,
    pub altitude_ok: bool,
    pub elongation_ok: bool,
}

/// Evaluasi kriteria KHGT (lokal untuk lokasi pengamatan)
pub fn evaluate_khgt(
    location: &GeoLocation,
    date: &GregorianDate,
    use_topocentric: bool,
) -> KhgtResult {
    // Hitung altitude bulan pada saat maghrib
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, use_topocentric);

    // Hitung elongasi pada saat maghrib
    let elongation = crate::astronomy::elongation_at_sunset(location, date, use_topocentric);

    // Evaluasi kriteria KHGT
    let altitude_ok = moon_altitude >= 5.0;
    let elongation_ok = elongation >= 8.0;
    let is_visible = altitude_ok && elongation_ok;

    KhgtResult {
        is_visible,
        moon_altitude,
        elongation,
        altitude_ok,
        elongation_ok,
    }
}
