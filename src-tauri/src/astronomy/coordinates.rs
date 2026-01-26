//! Module untuk konversi koordinat astronomi

/// Konversi dari koordinat ekliptika ke equatorial
/// 
/// # Arguments
/// * `longitude` - Longitude dalam radian
/// * `latitude` - Latitude dalam radian  
/// * `obliquity` - Obliquity of ecliptic dalam radian
///
/// # Returns
/// (right_ascension, declination) dalam radian
pub fn ecliptic_to_equatorial(
    longitude: f64,
    latitude: f64,
    obliquity: f64,
) -> (f64, f64) {
    let sin_decl = latitude.sin() * obliquity.cos() + latitude.cos() * obliquity.sin() * longitude.sin();
    let decl = sin_decl.asin();

    let y = longitude.sin() * obliquity.cos() - latitude.tan() * obliquity.sin();
    let x = longitude.cos();
    let ra = y.atan2(x);

    // Normalize RA to 0-2π
    let ra_normalized = if ra < 0.0 { ra + 2.0 * std::f64::consts::PI } else { ra };

    (ra_normalized, decl)
}

/// Get mean obliquity of the ecliptic (Laskar formula)
/// Reference: Meeus, Astronomical Algorithms Chapter 21
pub fn mean_obliquity_laskar(jd: f64) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;
    
    // Laskar formula for mean obliquity
    let epsilon_0 = 23.4392911
        - 0.0130042 * t
        - 0.00000016 * t * t
        + 0.000000504 * t * t * t;
    
    epsilon_0.to_radians()
}

/// Get true obliquity of the ecliptic (with nutation correction)
/// Simplified version using mean obliquity
pub fn true_obliquity(jd: f64) -> f64 {
    // For simplicity, return mean obliquity
    // Nutation correction could be added for higher accuracy
    mean_obliquity_laskar(jd)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ecliptic_to_equatorial_basics() {
        // Test dengan nilai sederhana: equator (lat=0, lon=0)
        let lon = 0.0;
        let lat = 0.0;
        let obl = (23.5_f64).to_radians();
        
        let (ra, decl) = ecliptic_to_equatorial(lon, lat, obl);
        
        // Di RA=0 latitude pada equator, declination harus 0
        assert!(decl.abs() < 0.01);
    }

    #[test]
    fn test_obliquity_range() {
        let jd = 2451545.0; // J2000
        let obl = mean_obliquity_laskar(jd);
        
        // Obliquity should be around 23.4 degrees
        let obl_deg = obl.to_degrees();
        assert!(obl_deg > 23.0 && obl_deg < 24.0);
    }

    #[test]
    fn test_true_obliquity() {
        let jd = 2451545.0;
        let obl = true_obliquity(jd);
        
        assert!(obl > 0.0);
        assert!(obl.to_degrees() < 24.0);
    }
}
