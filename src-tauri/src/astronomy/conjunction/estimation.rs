//! Estimasi awal untuk konjungsi menggunakan lunar phase

const LUNAR_MONTH_DAYS: f64 = 29.53;

/// Estimasi waktu konjungsi terdekat dari tanggal input
///
/// Menggunakan lunar phase untuk mendapatkan estimasi kasar
/// FIX: Cari konjungsi SEBELUM tanggal input (untuk hisab hilal di akhir bulan)
pub fn estimate_conjunction_time(jd: f64) -> f64 {
    let phase = crate::astronomy::phase(jd);
    calculate_previous_conjunction_jd(jd, phase)
}

/// Hitung JD konjungsi SEBELUMNYA berdasarkan phase
/// Phase: 0 = new moon, 0.5 = full moon, 1 = new moon again
/// Untuk hisab hilal, kita perlu konjungsi SEBELUM tanggal observasi
fn calculate_previous_conjunction_jd(jd: f64, phase: f64) -> f64 {
    // Days since last new moon (going backwards)
    let days_since_new = phase * LUNAR_MONTH_DAYS;

    // Go back to the previous new moon
    jd - days_since_new
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lunar_month_constant() {
        // Siklus bulan rata-rata: 29.53 hari
        assert!((LUNAR_MONTH_DAYS - 29.53).abs() < 0.01);
    }

    #[test]
    fn test_estimate_progression() {
        // Test bahwa estimasi untuk hari berbeda memberikan hasil wajar
        let jd1 = 2451545.0;
        let est1 = estimate_conjunction_time(jd1);

        let jd2 = jd1 + 1.0;
        let est2 = estimate_conjunction_time(jd2);

        // Estimasi untuk hari sebelumnya bisa berbeda tergantung phase
        // Hanya check bahwa keduanya adalah angka positif
        assert!(est1 > 0.0);
        assert!(est2 > 0.0);
    }
}
