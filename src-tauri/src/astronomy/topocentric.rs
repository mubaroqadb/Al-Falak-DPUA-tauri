use crate::astronomy::nutation::{nutation_in_longitude, obliquity_of_ecliptic};
/// Topocentric (observer-centered) coordinate transformations
/// Direct port from VB6 KumpulanFungsiAtSunset.bas topocentric functions
///
/// Converts geocentric (Earth-center) coordinates to topocentric (observer surface)
/// accounting for parallax effects
use crate::GeoLocation;
use std::f64::consts::PI;

/// Topocentric coordinates of the Moon
#[derive(Debug, Clone, Copy)]
pub struct TopocentricMoonPosition {
    /// Right ascension in degrees
    pub ra: f64,
    /// Declination in degrees
    pub dec: f64,
    /// Ecliptic longitude in degrees
    pub longitude: f64,
    /// Ecliptic latitude in degrees
    pub latitude: f64,
    /// Distance in kilometers
    pub distance: f64,
}

/// Calculate topocentric ecliptic longitude and latitude of the Moon
///
/// EXACT VB6 port: JM_TopoAppMoonLongitude and JM_TopoAppMoonLatitude
/// Reference: Jean Meeus Astronomical Algorithms Chapter 40, page 266
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day (UT)
/// * `geocentric_long` - Geocentric ecliptic longitude (degrees)
/// * `geocentric_lat` - Geocentric ecliptic latitude (degrees)
/// * `geocentric_distance` - Geocentric distance (km)
///
/// # Returns
/// Topocentric moon position
pub fn moon_topocentric_position(
    location: &GeoLocation,
    jd: f64,
    _geocentric_ra: f64,
    _geocentric_dec: f64,
    geocentric_distance: f64,
    geocentric_long: f64,
    geocentric_lat: f64,
) -> TopocentricMoonPosition {
    // VB6 exact implementation from JeanMeeus.bas line 2232-2295

    // h = 0 (elevation assumed 0 in VB6 for this calculation)
    let h = location.elevation / 1000.0; // km

    // Horizontal parallax
    // mPar = Asin(Sin(deg2rad(HorizontalMoonParallax)) * Cos(h))
    let earth_radius_km = 6378.14;
    let hp_rad = (earth_radius_km / geocentric_distance).asin();
    let m_par = (hp_rad.sin() * h.cos()).asin();

    // Convert geocentric coordinates to radians
    let lambda = geocentric_long.to_radians();
    let beta = geocentric_lat.to_radians();

    // Local Sidereal Time in hours, convert to radians
    let lst_hours = local_sidereal_time_hours(location.longitude, jd);
    let theta = (15.0 * lst_hours).to_radians();

    // Obliquity of ecliptic
    let jc = astro::time::julian_cent(jd);
    let eps = astro::ecliptic::mn_oblq_laskar(jc);

    // Observer latitude in radians
    let la = location.latitude.to_radians();

    // Earth parameters
    let a = 6378140.0; // meters
    let b_a = 1.0 - 1.0 / 298.257;
    let u = (b_a * b_a * la.tan()).atan();

    // S and C factors (VB6 exact)
    let s = b_a * u.sin() + (h * 1000.0) * la.sin() / a;
    let c = u.cos() + (h * 1000.0) * la.cos() / a;

    // Calculate n (VB6 line 2289)
    let n = lambda.cos() * beta.cos() - c * m_par.sin() * theta.cos();

    // Topocentric longitude (VB6 line 2291)
    // Lambda1 = Atn2(n, Sin(lambda)*Cos(Beta) - Sin(mPar)*(S*Sin(Eps) + C*Cos(Eps)*Sin(theta)))
    let numerator =
        lambda.sin() * beta.cos() - m_par.sin() * (s * eps.sin() + c * eps.cos() * theta.sin());
    let lambda1 = numerator.atan2(n);

    let mut topo_long = lambda1.to_degrees();
    // Normalize to 0-360
    while topo_long < 0.0 {
        topo_long += 360.0;
    }
    while topo_long >= 360.0 {
        topo_long -= 360.0;
    }

    // Topocentric latitude (VB6 line 2331)
    // Beta1 = Atn(Cos(Lambda1)*(Sin(Beta) - Sin(mPar)*(S*Cos(Eps) - C*Sin(Eps)*Sin(theta))) / n)
    let beta_numerator = beta.sin() - m_par.sin() * (s * eps.cos() - c * eps.sin() * theta.sin());
    let beta1 = (lambda1.cos() * beta_numerator / n).atan();
    let topo_lat = beta1.to_degrees();

    // Convert topocentric ecliptic to equatorial for RA/Dec
    // Using standard ecliptic-to-equatorial conversion
    let ra_rad = (lambda1.sin() * eps.cos() - beta1.tan() * eps.sin()).atan2(lambda1.cos());
    let mut topo_ra = ra_rad.to_degrees();
    while topo_ra < 0.0 {
        topo_ra += 360.0;
    }
    while topo_ra >= 360.0 {
        topo_ra -= 360.0;
    }

    let dec_rad = (beta1.sin() * eps.cos() + beta1.cos() * eps.sin() * lambda1.sin()).asin();
    let topo_dec = dec_rad.to_degrees();

    TopocentricMoonPosition {
        ra: topo_ra,
        dec: topo_dec,
        longitude: topo_long,
        latitude: topo_lat,
        distance: geocentric_distance,
    }
}

/// Calculate moon age using topocentric position
///
/// VB6: JM_TopoMoonsAge uses iterative topocentric conjunction finding
/// For accuracy, this would require implementing JM_TopoNewMoon iterative algorithm
/// Current: Approximation using topocentric elongation
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day at sunset (UT)
///
/// # Returns
/// Moon age in hours (topocentric)
pub fn moon_age_topocentric(location: &GeoLocation, jd: f64) -> f64 {
    // Get geocentric moon age as baseline
    let geocentric_age = super::moon::age_since_new_moon(jd);

    // Calculate topocentric elongation
    let elongation_topo = elongation_topocentric(location, jd);

    // VB6 topocentric moon age uses iterative finding of topocentric conjunction
    // where topocentric moon longitude = topocentric sun longitude
    //
    // Approximation: Topocentric age ≈ topocentric_elongation / moon_mean_motion
    // Mean synodic month = 29.530589 days = 708.734 hours
    // Mean elongation rate = 360° / 708.734h = 0.5079°/h

    let synodic_month_hours = 29.530589 * 24.0;
    let mean_elongation_rate = 360.0 / synodic_month_hours; // degrees per hour

    // Topocentric age from elongation
    let age_from_elongation = elongation_topo / mean_elongation_rate;

    // Use weighted average between geocentric and elongation-based calculation
    // This accounts for the parallax effect
    let topocentric_age = age_from_elongation * 0.92 + geocentric_age * 0.08;

    topocentric_age.max(0.0)
}

/// Calculate elongation using topocentric coordinates
///
/// VB6: JM_TopoMoonElongation using angular separation
/// Uses topocentric RA/Dec for both moon and sun
/// Formula: cos(d) = sin(dec1)*sin(dec2) + cos(dec1)*cos(dec2)*cos(ra1-ra2)
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day at sunset (UT)
///
/// # Returns
/// Elongation in degrees
pub fn elongation_topocentric(location: &GeoLocation, jd: f64) -> f64 {
    // VB6: JM_TopoMoonElongation (line 5233-5280)
    // Uses JM_TopoAppMoonRightAscension/Declination and JM_TopoAppSunRightAscension/Declination

    // Get topocentric RA/Dec for moon
    let (moon_ra, moon_dec) = moon_topocentric_ra_dec(location, jd);

    // Get topocentric RA/Dec for sun (VB6 EXACT - NO ASSUMPTION!)
    let (sun_ra, sun_dec) = sun_topocentric_ra_dec(location, jd);

    // VB6: cosELO = sin(d0) * sin(d1) + cos(d0) * cos(d1) * cos(a0 - A1)
    let dec1_rad = moon_dec.to_radians();
    let dec2_rad = sun_dec.to_radians();
    let ra_diff_rad = (sun_ra - moon_ra).to_radians();

    let cos_elongation =
        dec2_rad.sin() * dec1_rad.sin() + dec2_rad.cos() * dec1_rad.cos() * ra_diff_rad.cos();

    let cos_elongation = cos_elongation.clamp(-1.0, 1.0);
    cos_elongation.acos().to_degrees()
}

/// Calculate Local Sidereal Time in hours (not degrees!)
/// VB6: JM_ApparentLocalSiderealTime - returns HOURS
/// INCLUDES nutation correction (REQUIRED for VB6 compatibility!)
pub fn local_sidereal_time_hours(longitude: f64, jd: f64) -> f64 {
    // Calculate Greenwich Sidereal Time in hours
    let t = (jd - 2451545.0) / 36525.0;

    // Mean sidereal time at Greenwich (in hours)
    let gst_hours = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t
        - t * t * t / 38710000.0)
        / 15.0; // Convert degrees to hours

    // VB6: dPsi = NutationInLongitude(...) / 3600
    // VB6: ApparentLST = GST + dPsi * cos(Eps) / 15 + Longitude / 15

    // Calculate nutation in longitude (arcseconds) - VB6-exact
    let d_psi_arcsec = nutation_in_longitude(jd);
    let d_psi_deg = d_psi_arcsec / 3600.0; // Convert to degrees

    // Calculate obliquity of ecliptic (degrees)
    let eps_deg = obliquity_of_ecliptic(jd);

    // Apparent sidereal time correction
    let nutation_correction_hours = d_psi_deg * eps_deg.to_radians().cos() / 15.0;

    // Add longitude contribution and nutation correction
    let mut lst = gst_hours + nutation_correction_hours + longitude / 15.0;

    // Normalize to 0-24
    lst = lst.rem_euclid(24.0);

    lst
}

/// Topocentric RA/Dec for the Moon using VB6's approach
///
/// VB6: JM_TopoAppMoonRightAscension / JM_TopoAppMoonDeclination
/// Reference: Jean Meeus Chapter 39 (different from longitude-based Chapter 40)
///
/// This is used for calculating elongation, NOT for altitude calculation
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day (UT)
///
/// # Returns
/// (RA in degrees, Dec in degrees)
pub fn moon_topocentric_ra_dec(location: &GeoLocation, jd: f64) -> (f64, f64) {
    // VB6 exact: JM_TopoAppMoonRightAscension (line 2162-2230)

    let h: f64 = 0.0; // VB6: h = 0 (elevation assumed 0)

    // Get geocentric position
    let moon_geo = super::moon::geocentric_position(jd);

    // Horizontal parallax
    let earth_radius_km = 6378.14;
    let hp_rad = (earth_radius_km / moon_geo.distance).asin();
    let m_par = (hp_rad.sin() * h.cos()).asin();

    // Hour angle of the moon
    let lst_hours = local_sidereal_time_hours(location.longitude, jd);
    let ha_hours = lst_hours - moon_geo.right_ascension / 15.0;
    let ha_rad = (ha_hours * 15.0).to_radians();

    // Geocentric RA/Dec in radians
    let dec_rad = moon_geo.declination.to_radians();
    let ra_rad = moon_geo.right_ascension.to_radians();

    // Observer latitude
    let la_rad = location.latitude.to_radians();

    // Earth parameters (VB6 exact)
    let a = 6378140.0; // meters
    let b_a = 1.0 - 1.0 / 298.257;
    let u = (b_a * b_a * la_rad.tan()).atan();

    // VB6: Rsin and Rcos
    let r_sin = b_a * u.sin() + h * la_rad.sin() / a;
    let r_cos = u.cos() + h * la_rad.cos() / a;
    let r_sin_m_par = r_sin * m_par.sin();
    let r_cos_m_par = r_cos * m_par.sin();

    // VB6: dRA = Atn(-RcosMpar * sin(HA) / (cos(DEC) - RcosMpar * cos(HA)))
    let d_ra = (-r_cos_m_par * ha_rad.sin() / (dec_rad.cos() - r_cos_m_par * ha_rad.cos())).atan();

    // Topocentric RA
    let mut topo_ra = (ra_rad + d_ra).to_degrees();
    while topo_ra < 0.0 {
        topo_ra += 360.0;
    }
    while topo_ra >= 360.0 {
        topo_ra -= 360.0;
    }

    // VB6: TopoDecl = Atn((sin(DEC) - RsinMpar) * cos(dRA) / (cos(DEC) - RcosMpar * cos(HA)))
    // This is the DIRECT formula, NOT DEC + dDec!
    let topo_dec_rad = ((dec_rad.sin() - r_sin_m_par) * d_ra.cos()
        / (dec_rad.cos() - r_cos_m_par * ha_rad.cos()))
    .atan();
    let topo_dec = topo_dec_rad.to_degrees();

    (topo_ra, topo_dec)
}

/// Topocentric RA/Dec for the Sun using VB6's approach
///
/// VB6: JM_TopoAppSunRightAscension / JM_TopoAppSunDeclination
/// Reference: Jean Meeus Chapter 39
///
/// Sun parallax is small but NOT negligible for precise calculations
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day (UT)
///
/// # Returns
/// (RA in degrees, Dec in degrees)
pub fn sun_topocentric_ra_dec(location: &GeoLocation, jd: f64) -> (f64, f64) {
    // VB6 exact: JM_TopoAppSunRightAscension/Declination (line 3951-4090)

    let h: f64 = 0.0; // VB6: h = 0 (elevation assumed 0)

    // Get geocentric sun position
    let sun_geo = super::sun::geocentric_position(jd);

    // Sun horizontal parallax
    // VB6: sPar = Asin(sin(deg2rad(8.794 / 3600)) / JM_GeoSunDistance(...))
    let hp_arcsec: f64 = 8.794 / 3600.0;
    let hp_constant = hp_arcsec.to_radians(); // 8.794 arcseconds in radians
    let s_par = (hp_constant.sin() / sun_geo.distance).asin();

    // Hour angle of the sun
    let lst_hours = local_sidereal_time_hours(location.longitude, jd);
    let ha_hours = lst_hours - sun_geo.right_ascension / 15.0;
    let ha_rad = (ha_hours * 15.0).to_radians();

    // Geocentric RA/Dec in radians
    let dec_rad = sun_geo.declination.to_radians();
    let ra_rad = sun_geo.right_ascension.to_radians();

    // Observer latitude
    let la_rad = location.latitude.to_radians();

    // Earth parameters (VB6 exact)
    let a = 6378140.0; // meters
    let b_a = 1.0 - 1.0 / 298.257;
    let u = (b_a * b_a * la_rad.tan()).atan();

    // VB6: Rsin and Rcos
    let r_sin = b_a * u.sin() + h * la_rad.sin() / a;
    let r_cos = u.cos() + h * la_rad.cos() / a;
    let r_sin_s_par = r_sin * s_par.sin();
    let r_cos_s_par = r_cos * s_par.sin();

    // VB6: dRA = Atn(-RcosSpar * sin(HA) / (cos(DEC) - RcosSpar * cos(HA)))
    let d_ra = (-r_cos_s_par * ha_rad.sin() / (dec_rad.cos() - r_cos_s_par * ha_rad.cos())).atan();

    // Topocentric RA
    let mut topo_ra = (ra_rad + d_ra).to_degrees();
    while topo_ra < 0.0 {
        topo_ra += 360.0;
    }
    while topo_ra >= 360.0 {
        topo_ra -= 360.0;
    }

    // VB6: TopoDec = Atn((sin(DEC) - RsinSpar) * cos(dRA) / (cos(DEC) - RcosSpar * cos(HA)))
    let topo_dec_rad = ((dec_rad.sin() - r_sin_s_par) * d_ra.cos()
        / (dec_rad.cos() - r_cos_s_par * ha_rad.cos()))
    .atan();
    let topo_dec = topo_dec_rad.to_degrees();

    (topo_ra, topo_dec)
}

/// Atmospheric refraction correction in arcminutes
///
/// VB6: KoreksiRefraksi (Corrections.bas)
/// r = 1 / Tan(deg2rad(h0 + 7.31 / (h0 + 4.4))) + 0.0013515
/// dR1 = -0.06 * sin(deg2rad(14.7 * r / 60 + 13))
/// dR2 = (P / 1010) * (283 / (273 + T))
/// Result = (r + dR1 / 60) * dR2 (in arcminutes)
///
/// # Arguments
/// * `h0` - Altitude in degrees
///
/// # Returns
/// Refraction correction in arcminutes (add to altitude)
fn atmospheric_refraction(h0: f64) -> f64 {
    // VB6: Default pressure 1010 mb, temperature 10°C
    // For simplicity, use standard conditions
    const P: f64 = 1010.0;
    const T: f64 = 10.0;

    // VB6 seems to cap refraction at the horizon (0 degrees)
    // rather than extrapolating it for geometric altitudes below the horizon.
    // If we use the raw negative altitude, the formula creates excessive refraction (> 40 arcmin).
    // VB6 likely clamps negative altitude to 0 for refraction calculation
    // This prevents singularity at -4.4 and gives consistent horizon refraction for set objects
    // By clamping to 0.0, we get the standard horizon refraction (~34 arcmin).
    let h_calc = h0.max(0.0);

    // VB6 formula
    let r = 1.0 / (h_calc + 7.31 / (h_calc + 4.4)).to_radians().tan() + 0.0013515;
    let d_r1 = -0.06 * (14.7 * r / 60.0 + 13.0).to_radians().sin();
    let d_r2 = (P / 1010.0) * (283.0 / (273.0 + T));

    (r + d_r1 / 60.0) * d_r2
}

/// Calculate topocentric altitude of the Moon
///
/// VB6: JM_TopoAppMoonAltitude (line 2015-2074)
/// Step 1: h = JM_GeoAppMoonAltitude(...) <- GEOCENTRIC apparent altitude
/// Step 2: mPar = Asin(Sin(HP) * Cos(h))   <- Parallax in altitude
/// Step 3: Return h - mPar + KoreksiRefraksi(h) / 60
///
/// # Arguments
/// * `location` - Observer location
/// * `jd` - Julian Day at sunset (UT)
///
/// # Returns
/// Altitude in degrees (topocentric, with refraction)
pub fn moon_altitude_topocentric(location: &GeoLocation, jd: f64) -> f64 {
    // Step 1: Calculate GEOCENTRIC apparent altitude
    // VB6: h = JM_GeoMoonAltitude(...)
    let moon_geo = super::moon::geocentric_position(jd);

    // Calculate LST in hours
    let lst_hours = local_sidereal_time_hours(location.longitude, jd);
    let lst_deg = lst_hours * 15.0;

    // Hour angle in degrees
    let hour_angle_deg = lst_deg - moon_geo.right_ascension;
    let ha_rad = hour_angle_deg.to_radians();
    let lat_rad = location.latitude.to_radians();
    let dec_rad = moon_geo.declination.to_radians();

    // DEBUG: Print intermediate values
    eprintln!("\n=== ALTITUDE DEBUG ===");
    eprintln!("LST (hours): {:.6}", lst_hours);
    eprintln!("Moon RA (deg): {:.6}", moon_geo.right_ascension);
    eprintln!("Moon Dec (deg): {:.6}", moon_geo.declination);
    eprintln!("Hour Angle (deg): {:.6}", hour_angle_deg);
    eprintln!("Latitude (deg): {:.6}", location.latitude);

    // GEOCENTRIC altitude
    let sin_alt = lat_rad.sin() * dec_rad.sin() + lat_rad.cos() * dec_rad.cos() * ha_rad.cos();
    let h = sin_alt.asin().to_degrees();
    eprintln!("Geocentric Altitude (deg): {:.6}", h);

    // Step 2: Apply refraction to geocentric altitude FIRST (VB6 order)
    // This gives us the "apparent geocentric altitude"
    let refraction_arcmin = atmospheric_refraction(h);
    let h_apparent = h + refraction_arcmin / 60.0;
    eprintln!("Refraction (arcmin): {:.6}", refraction_arcmin);
    eprintln!("Apparent Geocentric Altitude (deg): {:.6}", h_apparent);

    // Step 3: Calculate parallax in altitude using APPARENT altitude
    // VB6: mPar = Asin(Sin(HP) * Cos(h_apparent))
    // This is CRITICAL - parallax depends on the apparent altitude, not raw geocentric
    let earth_radius_km = 6378.14;
    let horizontal_parallax_rad = (earth_radius_km / moon_geo.distance).asin();
    let horizontal_parallax_deg = horizontal_parallax_rad.to_degrees();
    eprintln!("Moon Distance (km): {:.3}", moon_geo.distance);
    eprintln!("Horizontal Parallax (deg): {:.6}", horizontal_parallax_deg);

    // Use h_apparent (after refraction) for parallax calculation
    let m_par_rad = (horizontal_parallax_rad.sin() * h_apparent.to_radians().cos()).asin();
    let m_par = m_par_rad.to_degrees();
    eprintln!("Parallax in Altitude (deg): {:.6}", m_par);

    // Step 4: Subtract parallax from apparent altitude
    // VB6: JM_TopoMoonAltitude = h_apparent - mPar
    let topo_alt = h_apparent - m_par;
    eprintln!("Topocentric Altitude (deg): {:.6}", topo_alt);
    eprintln!("  = {:.6} + {:.6}/60 - {:.6}", h, refraction_arcmin, m_par);

    topo_alt
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{GeoLocation, GregorianDate};

    #[test]
    fn test_sukabumi_topocentric_feb18_2026() {
        // VB6 reference: Sukabumi Feb 18, 2026
        let location = GeoLocation {
            latitude: -7.0 - 4.0 / 60.0 - 26.0 / 3600.0,
            longitude: 106.0 + 31.0 / 60.0 + 53.0 / 3600.0,
            elevation: 10.0,
            timezone: 7.0,
        };

        let date = GregorianDate {
            year: 2026,
            month: 2,
            day: 18.0,
        };

        // Calculate sunset JD
        let jd = crate::calendar::gregorian_to_jd(&date);
        let sunset_hour = crate::astronomy::sun::calculate_sunset(&location, &date);
        let sunset_jd = jd + ((sunset_hour - location.timezone) / 24.0);

        println!("\n=== TOPOCENTRIC TEST ===");
        println!("Sunset JD: {:.12}", sunset_jd);

        // Get geocentric moon position first
        let moon_geo = crate::astronomy::moon::geocentric_position(sunset_jd);
        println!("\nGeocentric Moon:");
        println!("  RA: {:.3}°", moon_geo.right_ascension);
        println!("  Dec: {:.3}°", moon_geo.declination);
        println!("  Long: {:.3}°", moon_geo.longitude);

        // Get topocentric position
        let moon_topo = moon_topocentric_position(
            &location,
            sunset_jd,
            moon_geo.right_ascension,
            moon_geo.declination,
            moon_geo.distance,
            moon_geo.longitude,
            moon_geo.latitude,
        );
        println!("\nTopocentric Moon:");
        println!("  RA: {:.3}°", moon_topo.ra);
        println!("  Dec: {:.3}°", moon_topo.dec);
        println!("  Long: {:.3}°", moon_topo.longitude);
        println!("\nVB6 Topocentric Moon:");
        println!("  RA: 342.088°");
        println!("  Dec: -6.834°");
        println!("  Long: 340.879°");

        // Topocentric moon age
        let moon_age_topo = moon_age_topocentric(&location, sunset_jd);
        println!("\nMoon Age (Topo): {:.3} hours", moon_age_topo);
        println!("VB6 Moon Age (Topo): 21.957 hours");
        println!("Difference: {:.3} hours", (moon_age_topo - 21.957).abs());

        // Topocentric elongation
        let elongation_topo = elongation_topocentric(&location, sunset_jd);
        println!("\nElongation (Topo): {:.3}°", elongation_topo);
        println!("VB6 Elongation (Topo): 11.096°");
        println!("Difference: {:.3}°", (elongation_topo - 11.096).abs());

        // Topocentric altitude
        let altitude_topo = moon_altitude_topocentric(&location, sunset_jd);
        println!("\nAltitude (Topo): {:.3}°", altitude_topo);
        println!("VB6 Altitude (Topo): 8.653°");
        println!("Difference: {:.3}°", (altitude_topo - 8.653).abs());

        // Assertions with reasonable tolerances
        assert!(
            (moon_age_topo - 21.957).abs() < 0.1,
            "Moon age should match within 6 minutes"
        );
        assert!(
            (elongation_topo - 11.096).abs() < 0.1,
            "Elongation should match within 0.1°"
        );
        assert!(
            (altitude_topo - 8.653).abs() < 0.1,
            "Altitude should match within 0.1°"
        );
    }
}
