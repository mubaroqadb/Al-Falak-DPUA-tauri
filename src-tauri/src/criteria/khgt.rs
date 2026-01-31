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
    pub ijtima_ok: bool,
}

/// Evaluasi kriteria KHGT (Kalender Hijriah Global Tunggal)
/// Sesuai kriteria Istanbul 2016:
/// 1. Ijtimak terjadi sebelum 00:00 UTC (GMT)
/// 2. Tinggi bulan (Toposentrik) ≥ 5° saat Maghrib
/// 3. Elongasi (Geosentrik) ≥ 8° saat Maghrib
pub fn evaluate_khgt(
    location: &GeoLocation,
    date: &GregorianDate,
    _use_topocentric: bool, // parameter is ignored, we force requirements
) -> KhgtResult {
    // 1. Hitung altitude bulan pada saat maghrib (Toposentrik)
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, true);

    // 2. Hitung elongasi pada saat maghrib (Geosentrik)
    let elongation = crate::astronomy::elongation_at_sunset(location, date, false);

    // 3. Periksa waktu ijtimak
    // Ijtimak harus terjadi sebelum 00:00 UTC hari yang sama (tengah malam transisi ke hari berikutnya)
    let jd_start = crate::calendar::gregorian_to_jd(date); // JD at 00:00 UTC
    let midnight_end_utc = jd_start + 1.0;

    // Cari ijtimak terdekat sebelum maghrib
    // Gunakan JD maghrib sebagai batas atas
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_jd = jd_start + ((sunset_hour - location.timezone) / 24.0);

    // Konversi sunset_jd ke GregorianDate untuk find_conjunction_before
    let sunset_date = crate::calendar::jd_to_gregorian(sunset_jd);
    let conj = crate::astronomy::find_conjunction_before(&sunset_date);
    let ijtima_ok = conj.jd_utc < midnight_end_utc;

    // Evaluasi kriteria KHGT
    let altitude_ok = moon_altitude >= 5.0;
    let elongation_ok = elongation >= 8.0;

    // Semua syarat harus terpenuhi
    let is_visible = altitude_ok && elongation_ok && ijtima_ok;

    KhgtResult {
        is_visible,
        moon_altitude,
        elongation,
        altitude_ok,
        elongation_ok,
        ijtima_ok,
    }
}
