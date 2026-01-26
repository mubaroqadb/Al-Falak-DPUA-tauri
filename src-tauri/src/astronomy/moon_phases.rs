//! Jean Meeus Chapter 47 - Phases of the Moon
//! Exact port dari VB6 untuk perhitungan new moon yang akurat

use crate::JulianDay;

/// Hitung k (approximate lunation number)
/// VB6: nilai_K
fn calculate_k(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let y = year as f64 + (month as f64 - 0.5) / 12.0;
    let k = (y - 2000.0) * 12.36853;
    (k + phase).floor()
}

/// Hitung T (time parameter in Julian centuries)
/// VB6: nilai_T
fn calculate_t(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    k / 1236.85
}

/// Hitung E (eccentricity of Earth's orbit)
/// VB6: nilai_E
fn calculate_e(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let t = calculate_t(year, month, day, phase);
    1.0 - 0.002516 * t - 0.0000074 * t.powi(2)
}

/// Hitung M (Sun's mean anomaly)
/// VB6: nilai_M
fn calculate_m(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let t = calculate_t(year, month, day, phase);
    let m = 2.5534 + 29.10535670 * calculate_k(year, month, day, phase)
          - 0.0000014 * t.powi(2) - 0.00000011 * t.powi(3);
    m.rem_euclid(360.0)
}

/// Hitung M' (Moon's mean anomaly)
/// VB6: nilai_M1
fn calculate_m1(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    let t = calculate_t(year, month, day, phase);
    let m1 = 201.5643 + 385.81693528 * k
           + 0.0107582 * t.powi(2) + 0.00001238 * t.powi(3)
           - 0.000000058 * t.powi(4);
    m1.rem_euclid(360.0)
}

/// Hitung F (Moon's argument of latitude)
/// VB6: nilai_F
fn calculate_f(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    let t = calculate_t(year, month, day, phase);
    let f = 160.7108 + 390.67050284 * k
          - 0.0016118 * t.powi(2) - 0.00000227 * t.powi(3)
          + 0.000000011 * t.powi(4);
    f.rem_euclid(360.0)
}

/// Hitung Omega (longitude of ascending node)
/// VB6: nilai_O
fn calculate_omega(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    let t = calculate_t(year, month, day, phase);
    let omega = 124.7746 - 1.56375588 * k
              + 0.0020672 * t.powi(2) + 0.00000215 * t.powi(3);
    omega.rem_euclid(360.0)
}

/// Hitung JDE awal (approximate time of phase)
/// VB6: nilai_JDE
fn calculate_jde_initial(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    let t = calculate_t(year, month, day, phase);
    
    2451550.09766 + 29.530588861 * k
                  + 0.00015437 * t.powi(2)
                  - 0.000000150 * t.powi(3)
                  + 0.00000000073 * t.powi(4)
}

/// Koreksi untuk New Moon (Jean Meeus Astronomical Algorithms p.321-322)
/// VB6: KoreksiNewMoon
fn correction_new_moon(year: i32, month: u8, day: f64) -> f64 {
    let e = calculate_e(year, month, day, 0.0);
    let m = calculate_m(year, month, day, 0.0).to_radians();
    let m1 = calculate_m1(year, month, day, 0.0).to_radians();
    let f = calculate_f(year, month, day, 0.0).to_radians();
    let omega = calculate_omega(year, month, day, 0.0).to_radians();
    
    let mut df = 0.0;
    df -= 0.40720 * m1.sin();
    df += 0.17241 * e * m.sin();
    df += 0.01608 * (2.0 * m1).sin();
    df += 0.01039 * (2.0 * f).sin();
    df += 0.00739 * e * (m1 - m).sin();
    df -= 0.00514 * e * (m1 + m).sin();
    df += 0.00208 * e * e * (2.0 * m).sin();
    df -= 0.00111 * (m1 - 2.0 * f).sin();
    df -= 0.00057 * (m1 + 2.0 * f).sin();
    df += 0.00056 * e * (2.0 * m1 + m).sin();
    df -= 0.00042 * (3.0 * m1).sin();
    df += 0.00042 * e * (m + 2.0 * f).sin();
    df += 0.00038 * e * (m - 2.0 * f).sin();
    df -= 0.00024 * e * (2.0 * m1 - m).sin();
    df -= 0.00017 * omega.sin();
    df -= 0.00007 * (m1 + 2.0 * m).sin();
    df += 0.00004 * (2.0 * (m1 - f)).sin();
    df += 0.00004 * (3.0 * m).sin();
    df += 0.00003 * (m1 + m - 2.0 * f).sin();
    df += 0.00003 * (2.0 * (m1 + f)).sin();
    df -= 0.00003 * (m1 + m + 2.0 * f).sin();
    df += 0.00003 * (m1 - m + 2.0 * f).sin();
    df -= 0.00002 * (m1 - m - 2.0 * f).sin();
    df -= 0.00002 * (3.0 * m1 + m).sin();
    df += 0.00002 * (4.0 * m1).sin();
    
    df
}

/// Planetary arguments correction (Jean Meeus p.321)
/// VB6: Koreksi_PlanetaryArguments
fn correction_planetary_arguments(year: i32, month: u8, day: f64, phase: f64) -> f64 {
    let k = calculate_k(year, month, day, phase);
    let t = calculate_t(year, month, day, phase);
    
    // Planetary arguments (page 321)
    let a01 = (299.77 + 0.107408 * k - 0.009173 * t.powi(2)).to_radians();
    let a02 = (251.88 + 0.016321 * k).to_radians();
    let a03 = (251.83 + 26.651886 * k).to_radians();
    let a04 = (349.42 + 36.412478 * k).to_radians();
    let a05 = (84.66 + 18.206239 * k).to_radians();
    let a06 = (141.74 + 53.303771 * k).to_radians();
    let a07 = (207.14 + 2.453732 * k).to_radians();
    let a08 = (154.84 + 7.30686 * k).to_radians();
    let a09 = (34.52 + 27.261239 * k).to_radians();
    let a10 = (207.19 + 0.121824 * k).to_radians();
    let a11 = (291.34 + 1.844379 * k).to_radians();
    let a12 = (161.72 + 24.198154 * k).to_radians();
    let a13 = (239.56 + 25.513099 * k).to_radians();
    let a14 = (331.55 + 3.592518 * k).to_radians();
    
    let mut cp = 0.0;
    cp += 0.000325 * a01.sin();
    cp += 0.000165 * a02.sin();
    cp += 0.000164 * a03.sin();
    cp += 0.000126 * a04.sin();
    cp += 0.000110 * a05.sin();
    cp += 0.000062 * a06.sin();
    cp += 0.000060 * a07.sin();
    cp += 0.000056 * a08.sin();
    cp += 0.000047 * a09.sin();
    cp += 0.000042 * a10.sin();
    cp += 0.000040 * a11.sin();
    cp += 0.000037 * a12.sin();
    cp += 0.000035 * a13.sin();
    cp += 0.000023 * a14.sin();
    
    cp
}

/// Hitung waktu new moon dengan Jean Meeus Chapter 47 (exact VB6 port)
/// VB6: JM_GeoNewMoon
pub fn calculate_new_moon_jde(year: i32, month: u8, day: f64) -> f64 {
    // Initial approximation
    let jde_initial = calculate_jde_initial(year, month, day, 0.0);
    
    // Corrections
    let correction = correction_new_moon(year, month, day);
    let planetary = correction_planetary_arguments(year, month, day, 0.0);
    
    // Final JDE
    let jde = jde_initial + correction + planetary;
    
    // Convert from TT to UT (subtract Delta T)
    // Simplified - full Delta T calculation would be more accurate
    let delta_t = estimate_delta_t(year) / 86400.0;
    
    jde - delta_t
}

/// Estimate Delta T for a given year (simplified)
fn estimate_delta_t(year: i32) -> f64 {
    // Simplified polynomial fit for modern era
    // Full implementation would use different polynomials for different eras
    let t = (year - 2000) as f64 / 100.0;
    
    if year >= 2005 && year <= 2050 {
        // Morrison & Stephenson 2004 for recent years
        62.92 + 0.32217 * t + 0.005589 * t * t
    } else if year >= 1986 && year <= 2005 {
        63.86 + 0.3345 * t - 0.060374 * t * t 
            + 0.0017275 * t.powi(3) + 0.000651814 * t.powi(4)
            + 0.00002373599 * t.powi(5)
    } else {
        // Rough estimate for other years
        32.0 * ((year - 1820) as f64 / 100.0).powi(2) - 20.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_new_moon_calculation_example_47a() {
        // Astronomical Algorithms Example 47.a
        // Calculate the instant of New Moon in February 1977
        let jde = calculate_new_moon_jde(1977, 2, 15.0);
        
        // Expected: JDE 2443192.65 (18 Feb 1977 03:36:54 UT)
        // Allow small tolerance due to Delta T approximation
        assert!((jde - 2443192.65).abs() < 0.01, 
                "New Moon JDE {:.2} differs from expected 2443192.65", jde);
    }
    
    #[test]
    fn test_new_moon_feb_2026() {
        // Test for our validation case - Feb 2026
        let jde = calculate_new_moon_jde(2026, 2, 17.0);
        
        // Expected around JD 2461089.0 (17 Feb 2026)
        println!("New Moon Feb 2026: JDE = {:.6}", jde);
        assert!(jde > 2461088.0 && jde < 2461090.0,
                "New Moon JDE {:.2} not in expected range for Feb 2026", jde);
    }
}
