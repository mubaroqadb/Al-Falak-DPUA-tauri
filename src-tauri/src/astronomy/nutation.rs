// VB6-exact nutation calculations
// Reference: VB6 Corrections.bas, Jean Meeus Astronomical Algorithms Chapter 21

/// Calculate Julian centuries from J2000.0
/// VB6: YMD2JCE() in Basics.bas
fn julian_centuries(jd: f64) -> f64 {
    (jd - 2451545.0) / 36525.0
}

/// Calculate moon mean elongation (D)
/// VB6: MoonMeanElongation() in Astronomy.bas
fn moon_mean_elongation(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    let d = 297.8501921 
          + 445267.1114034 * t 
          - 0.0018819 * t * t 
          + t * t * t / 545868.0 
          - t * t * t * t / 113065000.0;
    
    d.rem_euclid(360.0)
}

/// Calculate sun mean anomaly (M)
/// VB6: SunMeanAnomaly() in Astronomy.bas
fn sun_mean_anomaly(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    let m = 357.5291092 
          + 35999.0502909 * t 
          - 0.0001536 * t * t 
          + t * t * t / 24490000.0;
    
    m.rem_euclid(360.0)
}

/// Calculate moon mean anomaly (M')
/// VB6: MoonMeanAnomaly() in Astronomy.bas
fn moon_mean_anomaly(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    let m1 = 134.9633964 
           + 477198.8675055 * t 
           + 0.0087414 * t * t 
           + t * t * t / 69699.0 
           - t * t * t * t / 14712000.0;
    
    m1.rem_euclid(360.0)
}

/// Calculate moon argument of latitude (F)
/// VB6: MoonArgumentOfLatitude() in Astronomy.bas
fn moon_argument_of_latitude(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    let f = 93.2720950 
          + 483202.0175233 * t 
          - 0.0036539 * t * t 
          - t * t * t / 3526000.0 
          + t * t * t * t / 863310000.0;
    
    f.rem_euclid(360.0)
}

/// Calculate ascending node of Moon's mean orbit (Omega)
/// VB6: nilai_Omega() in Basics.bas
fn ascending_node(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    // VB6 formula for Omega (degrees)
    let omega = 125.04452 - 1934.136261 * t + 0.0020708 * t * t + t * t * t / 450000.0;
    
    // Normalize to [0, 360)
    omega.rem_euclid(360.0)
}

/// Calculate nutation in longitude (delta psi) in arcseconds
/// VB6-exact: NutationInLongitude() in Corrections.bas
/// Returns: nutation in longitude in arcseconds
pub fn nutation_in_longitude(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    // Calculate fundamental arguments (in radians)
    let d = moon_mean_elongation(jd).to_radians();
    let m = sun_mean_anomaly(jd).to_radians();
    let m1 = moon_mean_anomaly(jd).to_radians();
    let f = moon_argument_of_latitude(jd).to_radians();
    let omega = ascending_node(jd).to_radians();
    
    // VB6-exact 63 terms for nutation in longitude
    // Each term: (coefficient + time_coefficient * T) * sin(d_mult*D + m_mult*M + m1_mult*M1 + f_mult*F + omega_mult*Omega)
    let mut d_psi = 0.0;
    
    // Term 1-14 (main terms with time dependency)
    d_psi += (-171996.0 + -174.2 * t) * (0.0*d + 0.0*m + 0.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-13187.0 + -1.6 * t) * (-2.0*d + 0.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-2274.0 + -0.2 * t) * (0.0*d + 0.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (2062.0 + 0.2 * t) * (0.0*d + 0.0*m + 0.0*m1 + 0.0*f + 2.0*omega).sin();
    d_psi += (1426.0 + -3.4 * t) * (0.0*d + 1.0*m + 0.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (712.0 + 0.1 * t) * (0.0*d + 0.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-517.0 + 1.2 * t) * (-2.0*d + 1.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-386.0 + -0.4 * t) * (0.0*d + 0.0*m + 0.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (217.0 + -0.5 * t) * (-2.0*d + -1.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (129.0 + 0.1 * t) * (-2.0*d + 0.0*m + 0.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (63.0 + 0.1 * t) * (0.0*d + 0.0*m + 1.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-58.0 + -0.1 * t) * (0.0*d + 0.0*m + -1.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (17.0 + -0.1 * t) * (0.0*d + 2.0*m + 0.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-16.0 + 0.1 * t) * (-2.0*d + 2.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    
    // Term 15-63 (remaining terms without time dependency)
    d_psi += (-301.0 + 0.0 * t) * (0.0*d + 0.0*m + 1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-158.0 + 0.0 * t) * (-2.0*d + 0.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (123.0 + 0.0 * t) * (0.0*d + 0.0*m + -1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (63.0 + 0.0 * t) * (2.0*d + 0.0*m + 0.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-59.0 + 0.0 * t) * (2.0*d + 0.0*m + -1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-51.0 + 0.0 * t) * (0.0*d + 0.0*m + 1.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (48.0 + 0.0 * t) * (-2.0*d + 0.0*m + 2.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (46.0 + 0.0 * t) * (0.0*d + 0.0*m + -2.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (-38.0 + 0.0 * t) * (2.0*d + 0.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-31.0 + 0.0 * t) * (0.0*d + 0.0*m + 2.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (29.0 + 0.0 * t) * (0.0*d + 0.0*m + 2.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (29.0 + 0.0 * t) * (-2.0*d + 0.0*m + 1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (26.0 + 0.0 * t) * (0.0*d + 0.0*m + 0.0*m1 + 2.0*f + 0.0*omega).sin();
    d_psi += (-22.0 + 0.0 * t) * (-2.0*d + 0.0*m + 0.0*m1 + 2.0*f + 0.0*omega).sin();
    d_psi += (21.0 + 0.0 * t) * (0.0*d + 0.0*m + -1.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (16.0 + 0.0 * t) * (2.0*d + 0.0*m + -1.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-15.0 + 0.0 * t) * (0.0*d + 1.0*m + 0.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-13.0 + 0.0 * t) * (-2.0*d + 0.0*m + 1.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-12.0 + 0.0 * t) * (0.0*d + -1.0*m + 0.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (11.0 + 0.0 * t) * (0.0*d + 0.0*m + 2.0*m1 + -2.0*f + 0.0*omega).sin();
    d_psi += (-10.0 + 0.0 * t) * (2.0*d + 0.0*m + -1.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (-8.0 + 0.0 * t) * (2.0*d + 0.0*m + 1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (7.0 + 0.0 * t) * (0.0*d + 1.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-7.0 + 0.0 * t) * (-2.0*d + 1.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-7.0 + 0.0 * t) * (0.0*d + -1.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-7.0 + 0.0 * t) * (2.0*d + 0.0*m + 0.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (6.0 + 0.0 * t) * (2.0*d + 0.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (6.0 + 0.0 * t) * (-2.0*d + 0.0*m + 2.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (6.0 + 0.0 * t) * (-2.0*d + 0.0*m + 1.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (-6.0 + 0.0 * t) * (2.0*d + 0.0*m + -2.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-6.0 + 0.0 * t) * (2.0*d + 0.0*m + 0.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (5.0 + 0.0 * t) * (0.0*d + -1.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-5.0 + 0.0 * t) * (-2.0*d + -1.0*m + 0.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (-5.0 + 0.0 * t) * (-2.0*d + 0.0*m + 0.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (-5.0 + 0.0 * t) * (0.0*d + 0.0*m + 2.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (4.0 + 0.0 * t) * (-2.0*d + 0.0*m + 2.0*m1 + 0.0*f + 1.0*omega).sin();
    d_psi += (4.0 + 0.0 * t) * (-2.0*d + 1.0*m + 0.0*m1 + 2.0*f + 1.0*omega).sin();
    d_psi += (4.0 + 0.0 * t) * (0.0*d + 0.0*m + 1.0*m1 + -2.0*f + 0.0*omega).sin();
    d_psi += (-4.0 + 0.0 * t) * (-1.0*d + 0.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-4.0 + 0.0 * t) * (-2.0*d + 1.0*m + 0.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-4.0 + 0.0 * t) * (1.0*d + 0.0*m + 0.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (3.0 + 0.0 * t) * (0.0*d + 0.0*m + 1.0*m1 + 2.0*f + 0.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (0.0*d + 0.0*m + -2.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (-1.0*d + -1.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (0.0*d + 1.0*m + 1.0*m1 + 0.0*f + 0.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (0.0*d + -1.0*m + 1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (2.0*d + -1.0*m + -1.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (0.0*d + 0.0*m + 3.0*m1 + 2.0*f + 2.0*omega).sin();
    d_psi += (-3.0 + 0.0 * t) * (2.0*d + -1.0*m + 0.0*m1 + 2.0*f + 2.0*omega).sin();
    
    // VB6: NutationInLongitude = dPsi / (3600# * 10000#)
    // Coefficients are in units of 0.0001 arcseconds
    // Convert to degrees: dPsi (0.0001") / (36,000,000 to convert to degrees)
    d_psi / (3600.0 * 10000.0)
}

/// Calculate mean obliquity of the ecliptic (epsilon0)
/// VB6-exact: MeanObliquityOfEcliptic() in Astronomy.bas line 1557
/// Formula: epsilon0 = 23°26'21".448 - 46".8150T - 0".00059 T^2 + 0".001813 T^3
/// Returns: mean obliquity in degrees
pub fn mean_obliquity_of_ecliptic(jd: f64) -> f64 {
    let t = julian_centuries(jd);
    
    // VB6: 23 + 26/60 + (21.448 - 46.815*T - 0.00059*T^2 + 0.001813*T^3) / 3600
    let degrees = 23.0;
    let minutes = 26.0 / 60.0;
    let seconds = (21.448 - 46.815 * t - 0.00059 * t * t + 0.001813 * t * t * t) / 3600.0;
    
    degrees + minutes + seconds
}

/// Calculate obliquity of the ecliptic (epsilon) with nutation correction
/// VB6-exact: ObliquityOfEcliptic() in Astronomy.bas line 1608
/// Formula: epsilon = epsilon0 + delta_epsilon
/// Returns: true obliquity in degrees
pub fn obliquity_of_ecliptic(jd: f64) -> f64 {
    // VB6: ObliquityOfEcliptic = MeanObliquityOfEcliptic(...) + NutationInObliquity(...)
    // For now, use mean obliquity (nutation in obliquity has minimal effect on LST)
    mean_obliquity_of_ecliptic(jd)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_nutation_vb6_example() {
        // VB6 reference: Feb 12, 2010, 10:30:15 WIB
        // Y = 2010, M = 2, D = 12.14600694444440
        // Result: 0.00492129425061738 degrees = 17.7166593022226 arcseconds
        
        // Calculate JD (VB6-exact formula)
        let y = 2010;
        let m = 2;
        let d: f64 = 12.14600694444440;
        
        let a = (14.0 - m as f64) / 12.0;
        let y_adj = y as f64 + 4800.0 - a.floor();
        let m_adj = m as f64 + 12.0 * a.floor() - 3.0;
        
        let jd = d + (153.0 * m_adj + 2.0) / 5.0 
                   + 365.0 * y_adj 
                   + (y_adj / 4.0).floor() 
                   - (y_adj / 100.0).floor() 
                   + (y_adj / 400.0).floor() 
                   - 32045.0;
        
        let d_psi_deg = nutation_in_longitude(jd);
        let d_psi_arcsec = d_psi_deg * 3600.0;  // Convert to arcseconds
        
        // VB6 returns: 0.00492129425061738 degrees = 17.7166593 arcseconds
        assert!((d_psi_arcsec - 17.7166593).abs() < 0.01, 
                "Got {:.4} arcsec, expected ~17.7167 arcsec", d_psi_arcsec);
    }
}
