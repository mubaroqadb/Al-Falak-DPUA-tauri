// Module untuk kriteria visibilitas Ijtima Qobla Ghurub
// Port dari: Islamic criterion (Ijtima Qobla Ghurub = Conjunction before sunset)
//
// Kriteria Ijtima Qobla Ghurub:
// - Ijtimak (konjungsi/new moon) terjadi sebelum maghrib (sunset)
//
// Ini adalah kriteria paling sederhana yang hanya mengecek apakah konjungsi
// terjadi sebelum terbenamnya matahari pada tanggal pengamatan

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi Ijtima Qobla Ghurub
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct IjtimaQoblaGhuribResult {
    pub is_visible: bool,
    pub ijtimak_jd: f64,
    pub maghrib_jd: f64,
    pub ijtimak_before_maghrib: bool,
}

/// Evaluasi kriteria Ijtima Qobla Ghurub
///
/// Kriteria ini hanya memeriksa apakah ijtimak terjadi sebelum maghrib.
/// Tidak ada persyaratan tentang posisi bulan atau parameter lainnya.
pub fn evaluate_ijtima_qobla_ghurub(
    location: &GeoLocation,
    date: &GregorianDate,
    conjunction_jd: f64,
) -> IjtimaQoblaGhuribResult {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Hitung waktu maghrib dalam Julian Day
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let maghrib_jd = jd + (sunset_hour / 24.0);
    
    // Kondisi: Ijtimak sebelum maghrib
    let ijtimak_before_maghrib = conjunction_jd < maghrib_jd;
    
    IjtimaQoblaGhuribResult {
        is_visible: ijtimak_before_maghrib,
        ijtimak_jd: conjunction_jd,
        maghrib_jd,
        ijtimak_before_maghrib,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ijtima_qobla_ghurub_basic() {
        let location = GeoLocation {
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
        
        // Test dengan ijtimak sebelum maghrib
        let conjunction_jd = 2460374.2;
        let result = evaluate_ijtima_qobla_ghurub(&location, &date, conjunction_jd);
        
        // Result seharusnya konsisten: jika ijtimak sebelum maghrib, visible true
        assert_eq!(result.is_visible, result.ijtimak_before_maghrib);
    }

    #[test]
    fn test_ijtima_qobla_ghurub_logical() {
        let location = GeoLocation {
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
        
        let jd = crate::calendar::gregorian_to_jd(&date);
        let sunset_hour = crate::astronomy::calculate_sunset(&location, &date);
        let maghrib_jd = jd + (sunset_hour / 24.0);
        
        // Test ijtimak sebelum maghrib (30 menit sebelumnya)
        let conjunction_before = maghrib_jd - (30.0 / 1440.0);
        let result_before = evaluate_ijtima_qobla_ghurub(&location, &date, conjunction_before);
        assert!(result_before.is_visible);
        
        // Test ijtimak setelah maghrib (30 menit sesudahnya)
        let conjunction_after = maghrib_jd + (30.0 / 1440.0);
        let result_after = evaluate_ijtima_qobla_ghurub(&location, &date, conjunction_after);
        assert!(!result_after.is_visible);
    }
}
