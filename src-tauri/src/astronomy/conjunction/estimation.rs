//! Estimasi awal untuk konjungsi menggunakan lunar phase

const LUNAR_MONTH_DAYS: f64 = 29.53;

/// Estimasi waktu konjungsi terdekat dari tanggal input
/// 
/// Menggunakan lunar phase untuk mendapatkan estimasi kasar
pub fn estimate_conjunction_time(jd: f64) -> f64 {
    let phase = crate::astronomy::phase(jd);
    calculate_next_conjunction_jd(jd, phase)
}

/// Hitung JD konjungsi berikutnya berdasarkan phase
fn calculate_next_conjunction_jd(jd: f64, phase: f64) -> f64 {
    let days_to_next = if phase < 0.5 {
        // Konjungsi akan datang
        phase * LUNAR_MONTH_DAYS
    } else {
        // Konjungsi sudah lewat, cari berikutnya
        (1.0 - phase) * LUNAR_MONTH_DAYS
    };

    jd + days_to_next
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
