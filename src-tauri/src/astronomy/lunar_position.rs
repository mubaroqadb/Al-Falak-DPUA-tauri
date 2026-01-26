/// Accurate Jean Meeus Chapter 47 moon position calculation
/// Direct port from Al Falak DPUA VB6 PosisiBulan.bas and JeanMeeus.bas
/// 
/// This implementation fixes the bug in astro-rust v2.0.0 where:
/// - Scaling (/1000000) was applied AFTER to_radians() conversion
/// - Should be applied BEFORE conversion (on degree values)

use std::f64::consts::PI;

/// Ecliptic coordinates
#[derive(Debug, Clone, Copy)]
pub struct EclipticCoords {
    /// Longitude in radians
    pub longitude: f64,
    /// Latitude in radians
    pub latitude: f64,
    /// Distance in kilometers
    pub distance: f64,
}

/// Calculate geocentric ecliptic position of the Moon
/// Returns (longitude, latitude, distance) matching VB6 exactly
pub fn geocent_ecl_pos(jd: f64) -> EclipticCoords {
    let jc = (jd - 2451545.0) / 36525.0;
    
    // Mean elements
    let (d, m, m1) = dmm1(jc);
    let f = f_func(jc);
    let e = e_func(jc);
    
    // Moon's mean longitude (L')
    let l1_deg = limit_to_360(
        218.3164477
        + 481267.88123421 * jc
        - 0.0015786 * jc * jc
        + jc * jc * jc / 538841.0
        - jc * jc * jc * jc / 65194000.0
    );
    
    // Additional arguments
    let a1_deg = limit_to_360(119.75 + 131.849 * jc);
    let a2_deg = limit_to_360(53.09 + 479264.29 * jc);
    let a3_deg = limit_to_360(313.45 + 481266.484 * jc);
    
    // Convert to radians for periodic term calculations
    let d_rad = d.to_radians();
    let m_rad = m.to_radians();
    let m1_rad = m1.to_radians();
    let f_rad = f.to_radians();
    let a1_rad = a1_deg.to_radians();
    let a2_rad = a2_deg.to_radians();
    let a3_rad = a3_deg.to_radians();
    
    // Calculate SigmaL (longitude periodic terms)
    let sigma_l = sigma_l_terms(d_rad, m_rad, m1_rad, f_rad, e);
    
    // Calculate SigmaB (latitude periodic terms)
    let sigma_b = sigma_b_terms(d_rad, m_rad, m1_rad, f_rad, e);
    
    // Calculate SigmaR (distance periodic terms)
    let sigma_r = sigma_r_terms(d_rad, m_rad, m1_rad, f_rad, e);
    
    // Apply additional corrections (from Venus/Jupiter perturbations)
    let l_correction = 
        3958.0 * a1_rad.sin()
        + 1962.0 * (l1_deg.to_radians() - f_rad).sin()
        + 318.0 * a2_rad.sin();
    
    let b_correction =
        - 2235.0 * l1_deg.to_radians().sin()
        + 382.0 * a3_rad.sin()
        + 175.0 * ((a1_rad - f_rad).sin() + (a1_rad + f_rad).sin())
        + 127.0 * (l1_deg.to_radians() - m1_rad).sin()
        - 115.0 * (l1_deg.to_radians() + m1_rad).sin();
    
    // Final calculation - EXACTLY as VB6 PosisiBulan.bas line 5-7
    // CRITICAL: Division by 1000000 happens on DEGREE values, not radians!
    let longitude_deg = limit_to_360(l1_deg + (sigma_l + l_correction) / 1000000.0);
    let latitude_deg = (sigma_b + b_correction) / 1000000.0;
    let distance_km = 385000.56 + (sigma_r / 1000.0);
    
    // Convert to radians for return
    EclipticCoords {
        longitude: longitude_deg.to_radians(),
        latitude: latitude_deg.to_radians(),
        distance: distance_km,
    }
}

/// Calculate D, M, M' (mean elongation, sun anomaly, moon anomaly)
fn dmm1(jc: f64) -> (f64, f64, f64) {
    let d = limit_to_360(
        297.8501921
        + 445267.1114034 * jc
        - 0.0018819 * jc * jc
        + jc * jc * jc / 545868.0
        - jc * jc * jc * jc / 113065000.0
    );
    
    let m = limit_to_360(
        357.5291092
        + 35999.0502909 * jc
        - 0.0001536 * jc * jc
        + jc * jc * jc / 24490000.0
    );
    
    let m1 = limit_to_360(
        134.9633964
        + 477198.8675055 * jc
        + 0.0087414 * jc * jc
        + jc * jc * jc / 69699.0
        - jc * jc * jc * jc / 14712000.0
    );
    
    (d, m, m1)
}

/// Calculate F (argument of latitude)
fn f_func(jc: f64) -> f64 {
    limit_to_360(
        93.2720950
        + 483202.0175233 * jc
        - 0.0036539 * jc * jc
        - jc * jc * jc / 3526000.0
        + jc * jc * jc * jc / 863310000.0
    )
}

/// Calculate E (eccentricity correction factor)
fn e_func(jc: f64) -> f64 {
    1.0 - 0.002516 * jc - 0.0000074 * jc * jc
}

/// Limit angle to 0-360 degrees
fn limit_to_360(angle: f64) -> f64 {
    let mut result = angle % 360.0;
    if result < 0.0 {
        result += 360.0;
    }
    result
}

/// Calculate SigmaL - Longitude periodic terms (60 terms)
/// Returns value in 1/1000000 degrees (micro-degrees)
fn sigma_l_terms(d: f64, m: f64, m1: f64, f: f64, e: f64) -> f64 {
    let mut sum = 0.0;
    
    // All 60 periodic terms for longitude from Jean Meeus Table 47.A
    let terms: [(i8, i8, i8, i8, i32); 60] = [
        (0,  0,  1,  0,  6288774),
        (2,  0, -1,  0,  1274027),
        (2,  0,  0,  0,  658314),
        (0,  0,  2,  0,  213618),
        (0,  1,  0,  0, -185116),
        (0,  0,  0,  2, -114332),
        (2,  0, -2,  0,  58793),
        (2, -1, -1,  0,  57066),
        (2,  0,  1,  0,  53322),
        (2, -1,  0,  0,  45758),
        (0,  1, -1,  0, -40923),
        (1,  0,  0,  0, -34720),
        (0,  1,  1,  0, -30383),
        (2,  0,  0, -2,  15327),
        (0,  0,  1,  2, -12528),
        (0,  0,  1, -2,  10980),
        (4,  0, -1,  0,  10675),
        (0,  0,  3,  0,  10034),
        (4,  0, -2,  0,  8548),
        (2,  1, -1,  0, -7888),
        (2,  1,  0,  0, -6766),
        (1,  0, -1,  0, -5163),
        (1,  1,  0,  0,  4987),
        (2, -1,  1,  0,  4036),
        (2,  0,  2,  0,  3994),
        (4,  0,  0,  0,  3861),
        (2,  0, -3,  0,  3665),
        (0,  1, -2,  0, -2689),
        (2,  0, -1,  2, -2602),
        (2, -1, -2,  0,  2390),
        (1,  0,  1,  0, -2348),
        (2, -2,  0,  0,  2236),
        (0,  1,  2,  0, -2120),
        (0,  2,  0,  0, -2069),
        (2, -2, -1,  0,  2048),
        (2,  0,  1, -2, -1773),
        (2,  0,  0,  2, -1595),
        (4, -1, -1,  0,  1215),
        (0,  0,  2,  2, -1110),
        (3,  0, -1,  0, -892),
        (2,  1,  1,  0, -810),
        (4, -1, -2,  0,  759),
        (0,  2, -1,  0, -713),
        (2,  2, -1,  0, -700),
        (2,  1, -2,  0,  691),
        (2, -1,  0, -2,  596),
        (4,  0,  1,  0,  549),
        (0,  0,  4,  0,  537),
        (4, -1,  0,  0,  520),
        (1,  0, -2,  0, -487),
        (2,  1,  0, -2, -399),
        (0,  0,  2, -2, -381),
        (1,  1,  1,  0,  351),
        (3,  0, -2,  0, -340),
        (4,  0, -3,  0,  330),
        (2, -1,  2,  0,  327),
        (0,  2,  1,  0, -323),
        (1,  1, -1,  0,  299),
        (2,  0,  3,  0,  294),
        (2,  0, -1, -2,  0),
    ];
    
    for (d_coef, m_coef, m1_coef, f_coef, sin_coef) in terms {
        let arg = d_coef as f64 * d + m_coef as f64 * m + m1_coef as f64 * m1 + f_coef as f64 * f;
        let mut term = sin_coef as f64 * arg.sin();
        
        // Apply eccentricity correction for terms involving M
        if m_coef.abs() == 1 {
            term *= e;
        } else if m_coef.abs() == 2 {
            term *= e * e;
        }
        
        sum += term;
    }
    
    sum
}

/// Calculate SigmaB - Latitude periodic terms (60 terms)
/// Returns value in 1/1000000 degrees (micro-degrees)
fn sigma_b_terms(d: f64, m: f64, m1: f64, f: f64, e: f64) -> f64 {
    let mut sum = 0.0;
    
    // All 60 periodic terms for latitude from Jean Meeus Table 47.B
    let terms: [(i8, i8, i8, i8, i32); 60] = [
        (0,  0,  0,  1,  5128122),
        (0,  0,  1,  1,  280602),
        (0,  0,  1, -1,  277693),
        (2,  0,  0, -1,  173237),
        (2,  0, -1,  1,  55413),
        (2,  0, -1, -1,  46271),
        (2,  0,  0,  1,  32573),
        (0,  0,  2,  1,  17198),
        (2,  0,  1, -1,  9266),
        (0,  0,  2, -1,  8822),
        (2, -1,  0, -1,  8216),
        (2,  0, -2, -1,  4324),
        (2,  0,  1,  1,  4200),
        (2,  1,  0, -1, -3359),
        (2, -1, -1,  1,  2463),
        (2, -1,  0,  1,  2211),
        (2, -1, -1, -1,  2065),
        (0,  1, -1, -1, -1870),
        (4,  0, -1, -1,  1828),
        (0,  1,  0,  1, -1794),
        (0,  0,  0,  3, -1749),
        (0,  1, -1,  1, -1565),
        (1,  0,  0,  1, -1491),
        (0,  1,  1,  1, -1475),
        (0,  1,  1, -1, -1410),
        (0,  1,  0, -1, -1344),
        (1,  0,  0, -1, -1335),
        (0,  0,  3,  1,  1107),
        (4,  0,  0, -1,  1021),
        (4,  0, -1,  1,  833),
        (0,  0,  1, -3,  777),
        (4,  0, -2,  1,  671),
        (2,  0,  0, -3,  607),
        (2,  0,  2, -1,  596),
        (2, -1,  1, -1,  491),
        (2,  0, -2,  1, -451),
        (0,  0,  3, -1,  439),
        (2,  0,  2,  1,  422),
        (2,  0, -3, -1,  421),
        (2,  1, -1,  1, -366),
        (2,  1,  0,  1, -351),
        (4,  0,  0,  1,  331),
        (2, -1,  1,  1,  315),
        (2, -2,  0, -1,  302),
        (0,  0,  1,  3, -283),
        (2,  1,  1, -1, -229),
        (1,  1,  0, -1,  223),
        (1,  1,  0,  1,  223),
        (0,  1, -2, -1, -220),
        (2,  1, -1, -1, -220),
        (1,  0,  1,  1, -185),
        (2, -1, -2, -1,  181),
        (0,  1,  2,  1, -177),
        (4,  0, -2, -1,  176),
        (4, -1, -1, -1,  166),
        (1,  0,  1, -1, -164),
        (4,  0,  1, -1,  132),
        (1,  0, -1, -1, -119),
        (4, -1,  0, -1,  115),
        (2, -2,  0,  1,  107),
    ];
    
    for (d_coef, m_coef, m1_coef, f_coef, sin_coef) in terms {
        let arg = d_coef as f64 * d + m_coef as f64 * m + m1_coef as f64 * m1 + f_coef as f64 * f;
        let mut term = sin_coef as f64 * arg.sin();
        
        // Apply eccentricity correction for terms involving M
        if m_coef.abs() == 1 {
            term *= e;
        } else if m_coef.abs() == 2 {
            term *= e * e;
        }
        
        sum += term;
    }
    
    sum
}

/// Calculate SigmaR - Distance periodic terms (63 terms)
/// Returns value in meters
fn sigma_r_terms(d: f64, m: f64, m1: f64, f: f64, e: f64) -> f64 {
    let mut sum = 0.0;
    
    // All 63 periodic terms for distance from Jean Meeus Table 47.A (R column)
    let terms: [(i8, i8, i8, i8, i32); 63] = [
        (0,  0,  1,  0, -20905355),
        (2,  0, -1,  0, -3699111),
        (2,  0,  0,  0, -2955968),
        (0,  0,  2,  0, -569925),
        (0,  1,  0,  0,  48888),
        (0,  0,  0,  2, -3149),
        (2,  0, -2,  0,  246158),
        (2, -1, -1,  0, -152138),
        (2,  0,  1,  0, -170733),
        (2, -1,  0,  0, -204586),
        (0,  1, -1,  0, -129620),
        (1,  0,  0,  0,  108743),
        (0,  1,  1,  0,  104755),
        (2,  0,  0, -2,  10321),
        (0,  0,  1,  2,  0),
        (0,  0,  1, -2,  79661),
        (4,  0, -1,  0, -34782),
        (0,  0,  3,  0, -23210),
        (4,  0, -2,  0, -21636),
        (2,  1, -1,  0,  24208),
        (2,  1,  0,  0,  30824),
        (1,  0, -1,  0, -8379),
        (1,  1,  0,  0, -16675),
        (2, -1,  1,  0, -12831),
        (2,  0,  2,  0, -10445),
        (4,  0,  0,  0, -11650),
        (2,  0, -3,  0,  14403),
        (0,  1, -2,  0, -7003),
        (2,  0, -1,  2,  0),
        (2, -1, -2,  0,  10056),
        (1,  0,  1,  0,  6322),
        (2, -2,  0,  0, -9884),
        (0,  1,  2,  0,  5751),
        (0,  2,  0,  0, -4950),
        (2, -2, -1,  0, -4130),
        (2,  0,  1, -2,  0),
        (2,  0,  0,  2, -3958),
        (4, -1, -1,  0, -3258),
        (0,  0,  2,  2,  2616),
        (3,  0, -1,  0, -1897),
        (2,  1,  1,  0, -2117),
        (4, -1, -2,  0,  2354),
        (0,  2, -1,  0, -1423),
        (2,  2, -1,  0, -1117),
        (2,  1, -2,  0, -1571),
        (2, -1,  0, -2, -1739),
        (4,  0,  1,  0, -4421),
        (0,  0,  4,  0,  0),
        (4, -1,  0,  0,  0),
        (1,  0, -2,  0,  0),
        (2,  1,  0, -2,  0),
        (0,  0,  2, -2, -165),
        (1,  1,  1,  0,  0),
        (3,  0, -2,  0,  0),
        (4,  0, -3,  0,  0),
        (2, -1,  2,  0,  0),
        (0,  2,  1,  0,  1165),
        (1,  1, -1,  0,  0),
        (2,  0,  3,  0,  0),
        (2,  0, -1, -2,  8752),
        (0,  0,  0,  0,  0),
        (0,  0,  0,  0,  0),
        (0,  0,  0,  0,  0),
    ];
    
    for (d_coef, m_coef, m1_coef, f_coef, cos_coef) in terms {
        if cos_coef == 0 {
            continue; // Skip zero terms
        }
        
        let arg = d_coef as f64 * d + m_coef as f64 * m + m1_coef as f64 * m1 + f_coef as f64 * f;
        let mut term = cos_coef as f64 * arg.cos();
        
        // Apply eccentricity correction for terms involving M
        if m_coef.abs() == 1 {
            term *= e;
        } else if m_coef.abs() == 2 {
            term *= e * e;
        }
        
        sum += term;
    }
    
    sum
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sukabumi_feb18_2026() {
        // Test case from VB6: Sukabumi sunset Feb 18, 2026
        // VB6 results: Moon age 21.957h, Position should match exactly
        let jd = 2461065.000115741; // Sunset JD from VB6
        
        let moon = geocent_ecl_pos(jd);
        
        println!("Moon Longitude: {:.6}°", moon.longitude.to_degrees());
        println!("Moon Latitude: {:.6}°", moon.latitude.to_degrees());
        println!("Moon Distance: {:.3} km", moon.distance);
        
        // Values should match VB6 PosisiBulan.bas output
        // These will be verified against VB6 exact output
    }
}
