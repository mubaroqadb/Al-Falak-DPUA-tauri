// Module untuk kriteria visibilitas Odeh
// Port dari: Muhammad Odeh's criterion (Muhammad Ali Odeh dari Kuwait)
//
// Kriteria Odeh menggunakan formula yang lebih kompleks dengan ARCV dan parallax
// Formula: q = ARCV - threshold, dimana threshold = -0.1018*w³ + 0.7319*w² - 6.3226*w + 7.1651
// w = crescent width dalam arc-minutes
//
// Hasil:
// - q > 5.65: Easily visible
// - 0.216 < q < 5.65: Visible dengan optical aid
// - -0.014 < q < 0.216: Visible untuk observers dengan exceptional visual acuity
// - q < -0.014: Not visible

use crate::{GeoLocation, GregorianDate};

/// Struktur hasil evaluasi Odeh criterion
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OdehResult {
    pub is_visible: bool,
    pub moon_altitude: f64,
    pub sun_altitude: f64,
    pub arcv: f64,
    pub crescent_width: f64,
    pub q_value: f64,
    pub visibility_type: String, // "easily_visible", "visible", "difficult", "not_visible"
}

/// Evaluasi kriteria Odeh
///
/// Port dari: OdehVisibilityAtSunset di KumpulanFungsiAtSunset.bas
pub fn evaluate_odeh(
    location: &GeoLocation,
    date: &GregorianDate,
) -> OdehResult {
    // Hitung parameter hilal pada saat maghrib (TOPOCENTRIC)
    let moon_altitude = crate::astronomy::altitude_at_sunset(location, date, true);
    let _elongation = crate::astronomy::elongation_at_sunset(location, date, true);
    let sun_altitude = calculate_sun_altitude_at_sunset(location, date);
    let crescent_width = crate::astronomy::crescent_width_at_sunset(location, date, true);
    
    // Hitung Julian Day dan time at sunset
    let jd = crate::calendar::gregorian_to_jd(date);
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_jd = jd + (sunset_hour / 24.0);
    
    // Hitung horizontal parallax bulan
    let moon_parallax = crate::astronomy::horizontal_moon_parallax(sunset_jd);
    
    // Hitung sun distance (dalam AU)
    let (_, sun_distance) = astro::sun::geocent_ecl_pos(sunset_jd);
    
    // Hitung ARCV
    let arcv = crate::astronomy::calculate_arcv(moon_altitude, sun_altitude, moon_parallax, sun_distance);
    
    // Hitung threshold dari crescent width
    let w = crescent_width;
    let threshold = calculate_odeh_threshold(w);
    
    // Hitung q value
    let q = arcv - threshold;
    
    // Evaluasi visibilitas berdasarkan q value
    let (is_visible, visibility_type) = evaluate_q_value(q);
    
    OdehResult {
        is_visible,
        moon_altitude,
        sun_altitude,
        arcv,
        crescent_width,
        q_value: q,
        visibility_type,
    }
}

/// Hitung threshold untuk Odeh criterion
///
/// Threshold = -0.1018*w³ + 0.7319*w² - 6.3226*w + 7.1651
/// w = crescent width dalam arc-minutes
fn calculate_odeh_threshold(w: f64) -> f64 {
    -0.1018 * w.powi(3) + 0.7319 * w.powi(2) - 6.3226 * w + 7.1651
}

/// Evaluasi q value untuk menentukan visibilitas
fn evaluate_q_value(q: f64) -> (bool, String) {
    if q > 5.65 {
        (true, "easily_visible".to_string())
    } else if q > 0.216 {
        (true, "visible_with_optical_aid".to_string())
    } else if q > -0.014 {
        (true, "visible_exceptional_acuity".to_string())
    } else {
        (false, "not_visible".to_string())
    }
}

/// Helper: Hitung altitude matahari pada saat maghrib
fn calculate_sun_altitude_at_sunset(location: &GeoLocation, date: &GregorianDate) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_jd = jd + (sunset_hour / 24.0);
    
    // Sun altitude pada sunset adalah approximately -0.833 degrees (accounting for refraction)
    // Untuk perhitungan lebih akurat, hitung dari sun position
    let sun_pos = crate::astronomy::sun_position(sunset_jd);
    
    // Konversi dari ekliptika ke equatorial
    let obliquity = astro::ecliptic::mn_oblq_laskar(astro::time::julian_cent(sunset_jd));
    
    let ra = ((sun_pos.longitude.to_radians().sin() * obliquity.cos() -
              sun_pos.latitude.to_radians().tan() * obliquity.sin())
             .atan2(sun_pos.longitude.to_radians().cos())).to_degrees();
    
    let dec = (sun_pos.latitude.to_radians().sin() * obliquity.cos() +
              sun_pos.longitude.to_radians().cos() * 
              sun_pos.latitude.to_radians().sin() * obliquity.sin()).asin().to_degrees();
    
    // Hitung altitude
    let lat = location.latitude.to_radians();
    let dec_rad = dec.to_radians();
    
    // Local Sidereal Time
    let lst = local_sidereal_time(location.longitude, sunset_jd);
    let ha = (lst - ra).to_radians();
    
    let altitude = (lat.sin() * dec_rad.sin() + 
                   lat.cos() * dec_rad.cos() * ha.cos()).asin().to_degrees();
    
    altitude
}

/// Helper: Hitung Local Sidereal Time
fn local_sidereal_time(longitude: f64, jd: f64) -> f64 {
    let t = astro::time::julian_cent(jd);
    let gmst_hours = 18.697374558 + 879000.0513367 * t + 0.093104 * t * t - 6.2e-6 * t * t * t;
    let gmst_hours = gmst_hours % 24.0;
    let gmst_deg = (gmst_hours * 15.0) % 360.0;
    
    let lst = (gmst_deg + longitude) % 360.0;
    
    if lst < 0.0 {
        lst + 360.0
    } else {
        lst
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_odeh_threshold_formula() {
        // Test threshold formula dengan beberapa nilai w
        let w1 = 1.0;
        let threshold1 = calculate_odeh_threshold(w1);
        assert!(threshold1 > 0.0); // Threshold seharusnya positif untuk w kecil
        
        let w2 = 5.0;
        let threshold2 = calculate_odeh_threshold(w2);
        assert!(threshold2 < threshold1); // Threshold menurun seiring w meningkat
    }

    #[test]
    fn test_q_value_evaluation() {
        let (visible, type_str) = evaluate_q_value(10.0);
        assert!(visible);
        assert_eq!(type_str, "easily_visible");
        
        let (visible, _) = evaluate_q_value(-0.05);
        assert!(!visible);
    }
}