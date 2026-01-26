//! Logika perhitungan konjungsi

use super::types::Conjunction;
use super::refinement::{refine_conjunction_time, RefinementConfig};
use super::estimation::estimate_conjunction_time;
use crate::GregorianDate;

/// Cari konjungsi terdekat untuk tanggal tertentu
pub fn find_conjunction(date: &GregorianDate) -> Conjunction {
    find_conjunction_with_config(date, RefinementConfig::default())
}

/// Cari konjungsi dengan konfigurasi custom
pub fn find_conjunction_with_config(date: &GregorianDate, config: RefinementConfig) -> Conjunction {
    let jd_start = crate::calendar::gregorian_to_jd(date);

    // Step 1: Estimasi awal
    let jd_estimate = estimate_conjunction_time(jd_start);

    // Step 2: Refinement
    let jd_conjunction = refine_conjunction_time(jd_estimate, config);

    // Step 3: Hitung hasil
    compute_conjunction_info(jd_conjunction)
}

/// Cari konjungsi untuk bulan tertentu
pub fn find_conjunction_for_month(year: i32, month: u8) -> Conjunction {
    let date = GregorianDate {
        year,
        month,
        day: 15.0, // Tengah bulan
    };
    find_conjunction(&date)
}

/// Cari konjungsi sebelum tanggal tertentu
pub fn find_conjunction_before(date: &GregorianDate) -> Conjunction {
    let jd_date = crate::calendar::gregorian_to_jd(date);
    let jd_search = jd_date - 15.0;
    let search_date = crate::calendar::jd_to_gregorian(jd_search);

    find_conjunction(&search_date)
}

/// Cari konjungsi setelah tanggal tertentu
pub fn find_conjunction_after(date: &GregorianDate) -> Conjunction {
    let jd_date = crate::calendar::gregorian_to_jd(date);
    let jd_search = jd_date + 15.0;
    let search_date = crate::calendar::jd_to_gregorian(jd_search);

    find_conjunction(&search_date)
}

/// Hitung informasi lengkap konjungsi dari JD
fn compute_conjunction_info(jd: f64) -> Conjunction {
    let gregorian = crate::calendar::jd_to_gregorian(jd);
    let elongation = calculate_elongation_at_jd(jd);

    Conjunction {
        jd_utc: jd,
        year: gregorian.year,
        month: gregorian.month,
        day: gregorian.day,
        elongation,
    }
}

/// Hitung elongasi bulan-matahari pada waktu jd
fn calculate_elongation_at_jd(jd: f64) -> f64 {
    let moon_pos = crate::astronomy::moon_position(jd);
    let sun_pos = crate::astronomy::sun_position(jd);

    let dlon = (moon_pos.longitude - sun_pos.longitude).to_radians();
    let dlat = (moon_pos.latitude - sun_pos.latitude).to_radians();

    (dlon.cos() * dlat.cos()).acos().to_degrees()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_conjunction_valid_structure() {
        let date = GregorianDate {
            year: 2024,
            month: 1,
            day: 15.0,
        };

        let conj = find_conjunction(&date);
        assert!(conj.jd_utc > 0.0);
        assert!(conj.month >= 1 && conj.month <= 12);
    }

    #[test]
    fn test_find_conjunction_for_month() {
        let conj = find_conjunction_for_month(2024, 1);
        assert_eq!(conj.year, 2024);
        assert_eq!(conj.month, 1);
    }

    #[test]
    fn test_conjunction_progression() {
        let conj1 = find_conjunction_for_month(2024, 1);
        let conj2 = find_conjunction_for_month(2024, 2);

        // Bulan Februari harus lebih lambat
        assert!(conj2.jd_utc > conj1.jd_utc);

        // Perbedaan sekitar satu bulan lunar (~29.53 hari)
        let diff = conj2.jd_utc - conj1.jd_utc;
        assert!(diff > 28.0 && diff < 31.0);
    }
}
