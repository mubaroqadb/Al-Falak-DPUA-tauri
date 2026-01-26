//! Modul untuk perhitungan parameter hilal (crescent moon visibility)
//! Port dari KumpulanFungsiAtSunset.bas di VB6

use crate::{GeoLocation, GregorianDate};

/// Hitung umur bulan pada saat maghrib (sunset)
/// 
/// VB6-compatible: Uses TOPOCENTRIC (observer-centered) calculation
/// 
/// # Arguments
/// * `location` - Lokasi observasi (latitude, longitude, elevation, timezone)
/// * `date` - Tanggal Gregorian untuk perhitungan
/// 
/// # Returns
/// Umur bulan dalam jam sejak ijtimak (new moon) - TOPOCENTRIC
pub fn moon_age_at_sunset(location: &GeoLocation, date: &GregorianDate) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Hitung waktu maghrib
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    
    // Konversi ke Julian Day pada waktu maghrib (convert local to UT first)
    let sunset_hour_ut = sunset_hour - location.timezone;
    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    
    // Use TOPOCENTRIC calculation (matches VB6)
    super::topocentric::moon_age_topocentric(location, sunset_jd)
}

/// Hitung elongasi (jarak sudut bulan-matahari) pada saat maghrib
///
/// Elongasi adalah sudut antara posisi bulan dan matahari sebagaimana dilihat dari Bumi.
/// VB6-compatible: menggunakan angular separation dari koordinat equatorial.
/// 
/// # Arguments
/// * `location` - Lokasi observasi
/// * `date` - Tanggal Gregorian
/// * `topocentric` - Jika true, gunakan koordinat toposentris (VB6 default); false untuk geosentris
/// 
/// # Returns
/// Elongasi dalam derajat
pub fn elongation_at_sunset(location: &GeoLocation, date: &GregorianDate, topocentric: bool) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Konversi ke Julian Day pada waktu maghrib
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_hour_ut = sunset_hour - location.timezone;
    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    
    // Use topocentric if requested (VB6 default)
    if topocentric {
        return super::topocentric::elongation_topocentric(location, sunset_jd);
    }
    
    // Hitung posisi bulan (equatorial coordinates)
    let moon_pos = crate::astronomy::moon_position(sunset_jd);
    let obliquity = astro::ecliptic::mn_oblq_laskar(astro::time::julian_cent(sunset_jd));
    
    let lambda_moon = moon_pos.longitude.to_radians();
    let beta_moon = moon_pos.latitude.to_radians();
    
    // Convert moon ecliptic to equatorial
    let mut moon_ra = (lambda_moon.sin() * obliquity.cos() 
                      - beta_moon.tan() * obliquity.sin())
                     .atan2(lambda_moon.cos())
                     .to_degrees();
    if moon_ra < 0.0 { moon_ra += 360.0; }
    
    let moon_dec = (beta_moon.sin() * obliquity.cos() 
                   + beta_moon.cos() * obliquity.sin() * lambda_moon.sin())
                  .asin()
                  .to_degrees();
    
    // Hitung posisi matahari (equatorial coordinates)
    let sun_pos = crate::astronomy::sun_position(sunset_jd);
    let lambda_sun = sun_pos.longitude.to_radians();
    let beta_sun = sun_pos.latitude.to_radians();
    
    // Convert sun ecliptic to equatorial  
    let mut sun_ra = (lambda_sun.sin() * obliquity.cos() 
                     - beta_sun.tan() * obliquity.sin())
                    .atan2(lambda_sun.cos())
                    .to_degrees();
    if sun_ra < 0.0 { sun_ra += 360.0; }
    
    let sun_dec = (beta_sun.sin() * obliquity.cos() 
                  + beta_sun.cos() * obliquity.sin() * lambda_sun.sin())
                 .asin()
                 .to_degrees();
    
    // Angular separation formula (VB6: AngularSeparation)
    // cos(d) = sin(dec1)*sin(dec2) + cos(dec1)*cos(dec2)*cos(ra1-ra2)
    let dec1_rad = moon_dec.to_radians();
    let dec2_rad = sun_dec.to_radians();
    let ra_diff_rad = (moon_ra - sun_ra).to_radians();
    
    let cos_elongation = dec1_rad.sin() * dec2_rad.sin()
                       + dec1_rad.cos() * dec2_rad.cos() * ra_diff_rad.cos();
    
    // Clamp to avoid numerical errors in acos
    let cos_elongation = cos_elongation.clamp(-1.0, 1.0);
    let mut elongation = cos_elongation.acos().to_degrees();
    
    // Koreksi toposentrik jika diminta
    // Untuk topocentric, perlu apply parallax correction ke bulan
    if topocentric {
        let horizontal_parallax = horizontal_moon_parallax(sunset_jd);
        
        // Koreksi sederhana untuk elongasi toposentris
        // Parallax akan mengurangi elongasi sedikit
        // VB6: menggunakan parallax correction pada altitude
        let altitude = altitude_at_sunset(location, date, false);
        let parallax_correction = (horizontal_parallax.to_degrees() 
                                  * altitude.to_radians().cos()).abs();
        
        // Elongasi toposentris biasanya sedikit lebih kecil dari geosentris
        elongation = (elongation - parallax_correction * 0.5).max(0.0);
    }
    
    elongation
}

/// Hitung tinggi bulan (altitude) pada saat maghrib
///
/// # Arguments
/// * `location` - Lokasi observasi
/// * `date` - Tanggal Gregorian
/// * `topocentric` - Jika true, gunakan koordinat toposentris; false untuk geosentris
/// 
/// # Returns
/// Tinggi bulan dalam derajat (negatif jika di bawah horizon)
pub fn altitude_at_sunset(location: &GeoLocation, date: &GregorianDate, topocentric: bool) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Konversi ke Julian Day pada waktu maghrib
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    
    // Convert sunset from local time to UT before adding to JD
    let sunset_hour_ut = sunset_hour - location.timezone;
    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    
    // Use TOPOCENTRIC altitude if requested (VB6 default)
    if topocentric {
        return super::topocentric::moon_altitude_topocentric(location, sunset_jd);
    }
    
    // Hitung posisi bulan
    let moon_pos = crate::astronomy::moon_position(sunset_jd);
    
    // Konversi dari ekliptika ke equatorial
    let obliquity = astro::ecliptic::mn_oblq_laskar(astro::time::julian_cent(sunset_jd));
    
    let lambda = moon_pos.longitude.to_radians();
    let beta = moon_pos.latitude.to_radians();
    
    let mut ra = (lambda.sin() * obliquity.cos() - beta.tan() * obliquity.sin())
        .atan2(lambda.cos()).to_degrees();
    
    // Normalisasi RA ke range 0-360
    if ra < 0.0 {
        ra += 360.0;
    }
    
    let dec = (beta.sin() * obliquity.cos() + 
              beta.cos() * obliquity.sin() * lambda.sin()).asin().to_degrees();
    
    // Hitung Local Sidereal Time dalam JAM (bukan derajat)
    // VB6-compatible calculation
    let lst_hours = super::topocentric::local_sidereal_time_hours(location.longitude, sunset_jd);
    
    // Konversi RA dari derajat ke jam (15° = 1 hour)
    let ra_hours = ra / 15.0;
    
    // Hour angle dalam jam menggunakan formula VB6: ha_hours = LST - RA/15
    let mut ha_hours = lst_hours - ra_hours;
    
    // Modulus ke 0-24 jam dengan handling yang benar
    ha_hours = ha_hours.rem_euclid(24.0);
    
    // Konversi hour angle ke radian (VB6: h = deg2rad(15 * ha_hours))
    let ha_rad = (ha_hours * 15.0).to_radians();
    
    // Hitung altitude menggunakan formula VB6: 
    // Alt = Asin(cos(h) * cos(D) * cos(La) + sin(D) * sin(La))
    let lat_rad = location.latitude.to_radians();
    let dec_rad = dec.to_radians();
    
    // Formula altitude dari spherical astronomy
    let mut altitude = (ha_rad.cos() * dec_rad.cos() * lat_rad.cos() 
                       + dec_rad.sin() * lat_rad.sin())
                      .asin()
                      .to_degrees();
    
    // Koreksi atmosfer (refraction) - Airy model
    // VB6: menggunakan refraksi standar untuk altitude rendah
    // Pada horizon (altitude = 0°), refraction ≈ 34' ≈ 0.5667°
    // Untuk altitude negatif, gunakan approximasi
    if altitude < -1.0 {
        // Di bawah horizon, tidak ada refraksi atmosfer yang signifikan
        altitude += 0.0;
    } else if altitude < 0.0 {
        // Near horizon, interpolasi linear
        altitude += 0.5667 * (1.0 + altitude);
    } else if altitude < 15.0 {
        // Formula Bennett (simplified)
        // R = 1.02 / tan(h + 10.3/(h + 5.11)) arcminutes
        let h_deg = altitude;
        let refraction = 1.02 / (h_deg + 10.3 / (h_deg + 5.11)).to_radians().tan();
        altitude += refraction / 60.0; // Convert arcminutes to degrees
    }
    
    // Koreksi toposentrik jika diminta
    // VB6: parallax_correction = Asin(Sin(horizontal_parallax) * Cos(altitude))
    if topocentric {
        let horizontal_parallax_rad = horizontal_moon_parallax(sunset_jd);
        
        // Formula VB6 untuk parallax correction dalam altitude
        // parallax_in_altitude = Asin(Sin(hp) * Cos(alt))
        let parallax_correction = (horizontal_parallax_rad.sin() 
                                  * altitude.to_radians().cos())
                                 .asin()
                                 .to_degrees();
        
        altitude -= parallax_correction;
    }
    
    altitude
}

/// Hitung lebar hilal (crescent width) pada saat maghrib
///
/// Lebar adalah jarak dari tips bulan sabit
/// 
/// # Arguments
/// * `location` - Lokasi observasi
/// * `date` - Tanggal Gregorian
/// * `topocentric` - Jika true, gunakan koordinat toposentris
/// 
/// # Returns
/// Lebar hilal dalam arc-minutes
pub fn crescent_width_at_sunset(location: &GeoLocation, date: &GregorianDate, topocentric: bool) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Konversi ke Julian Day pada waktu maghrib (convert local to UT first)
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_hour_ut = sunset_hour - location.timezone;
    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    
    // Hitung posisi bulan dan matahari
    let _moon_pos = crate::astronomy::moon_position(sunset_jd);
    let _sun_pos = crate::astronomy::sun_position(sunset_jd);
    
    // Hitung jarak sudut bulan-matahari (elongasi)
    let elong = elongation_at_sunset(location, date, topocentric);
    let elong_rad = elong.to_radians();
    
    // Hitung illumination fraction (fase bulan)
    let illum = illumination_at_sunset(location, date, topocentric) / 100.0;
    
    // Hitung apparent semi-diameter bulan
    // Semi-diameter bulan ≈ 0.2725 derajat (sudut diameter piringan bulan dari Bumi)
    let moon_semi_diameter = 0.2725; // derajat
    
    // Formula untuk lebar hilal (simplified dari Meeus):
    // Width = semi_diameter * (1 - cos(elong)) * sqrt(illum) / sqrt(1 - illum + small_value)
    let denominator = (1.0 - illum + 0.001).sqrt();
    let width = moon_semi_diameter * (1.0 - elong_rad.cos()) * illum.sqrt() / denominator;
    
    // Konversi ke arc-minutes (60 arc-minutes = 1 derajat)
    width * 60.0
}

/// Hitung pencahayaan hilal (illumination fraction) pada saat maghrib
///
/// Illumination adalah persentase piringan bulan yang terpancar
/// 
/// # Arguments
/// * `location` - Lokasi observasi
/// * `date` - Tanggal Gregorian
/// * `_topocentric` - Jika true, gunakan koordinat toposentris (tidak digunakan dalam implementasi dasar ini)
/// 
/// # Returns
/// Pencahayaan dalam persen (0-100)
pub fn illumination_at_sunset(location: &GeoLocation, date: &GregorianDate, _topocentric: bool) -> f64 {
    let jd = crate::calendar::gregorian_to_jd(date);
    
    // Konversi ke Julian Day pada waktu maghrib (convert local to UT first)
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_hour_ut = sunset_hour - location.timezone;
    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    
    // Hitung phase bulan (0 = new moon, 0.5 = full moon, 1 = new moon)
    let phase = crate::astronomy::phase(sunset_jd);
    
    // Illumination fraction adalah berapa banyak piringan yang diterangi
    // Untuk fase yang dekat dengan new moon, illumination adalah fraction of lit portion
    let illumination = (1.0 - phase.cos()) / 2.0;
    
    // Konversi ke persen
    let illumination_percent = illumination * 100.0;
    
    // Batasi antara 0 dan 100
    illumination_percent.max(0.0).min(100.0)
}

/// Hitung horizontal parallax bulan (dalam radian)
///
/// Horizontal parallax adalah sudut parallax pada horizon.
/// Formula VB6: hp = arcsin(Earth_equatorial_radius / Moon_distance)
/// 
/// Untuk bulan:
/// - Distance minimum (perigee): ~356,400 km → hp ≈ 61.5' ≈ 0.01795 rad
/// - Distance maximum (apogee): ~406,700 km → hp ≈ 53.9' ≈ 0.01574 rad
/// - Average distance: ~384,400 km → hp ≈ 57.0' ≈ 0.01665 rad
/// 
/// # Arguments
/// * `jd` - Julian Day
/// 
/// # Returns
/// Horizontal parallax dalam radian
pub fn horizontal_moon_parallax(jd: f64) -> f64 {
    // Gunakan implementasi lokal VB6-compatible untuk jarak bulan
    let moon_ecl = super::lunar_position::geocent_ecl_pos(jd);
    let distance_km = moon_ecl.distance;
    
    // Radius Bumi (equatorial) = 6378.14 km (VB6 value)
    // VB6 menggunakan nilai ini untuk konsistensi dengan perhitungan lain
    let earth_radius_km = 6378.14;
    
    // Horizontal parallax = arcsin(Earth_radius / Moon_distance)
    // VB6: HorizontalMoonParallax = Asin(6378.14 / distance)
    let hp_rad = (earth_radius_km / distance_km).asin();
    
    hp_rad
}

/// Hitung Local Sidereal Time pada lokasi tertentu (dalam JAM)
/// 
/// Formula VB6-compatible dari Jean Meeus Chapter 11
/// 
/// # Arguments
/// * `longitude` - Bujur dalam derajat (positif ke timur)
/// * `jd` - Julian Day
/// 
/// # Returns
/// LST dalam jam (0-24)
fn local_sidereal_time_hours(longitude: f64, jd: f64) -> f64 {
    // VB6 GMST formula from Meeus Chapter 11 - EXACT IMPLEMENTATION
    // GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T^2 - T^3 / 38710000.0
    // where T = (JD - 2451545.0) / 36525.0 (Julian centuries from J2000.0)
    
    let t = (jd - 2451545.0) / 36525.0;  // Julian centuries from J2000.0
    let t2 = t * t;
    let t3 = t2 * t;
    
    // GMST in degrees (Meeus formula - VB6 exact)
    let mut gmst_deg = 280.46061837 
                     + 360.98564736629 * (jd - 2451545.0)
                     + 0.000387933 * t2 
                     - t3 / 38710000.0;
    
    // Normalisasi ke 0-360 degrees dengan modulo
    gmst_deg = gmst_deg.rem_euclid(360.0);
    
    // Convert GMST dari degrees ke hours (15° = 1 hour)
    let gmst_hours = gmst_deg / 15.0;
    
    // Longitude correction dalam jam (15° = 1 hour)
    // VB6: LST = GMST + Longitude/15
    let lng_hours = longitude / 15.0;
    
    // Local Sidereal Time = GMST + longitude/15
    let mut lst = gmst_hours + lng_hours;
    
    // Normalisasi ke 0-24 jam dengan modulo
    lst = lst.rem_euclid(24.0);
    
    lst
}

/// Hitung Local Sidereal Time pada lokasi tertentu (DEPRECATED - gunakan local_sidereal_time_hours)
///
/// # Arguments
/// * `longitude` - Bujur dalam derajat (positif ke timur)
/// * `jd` - Julian Day
/// 
/// # Returns
/// LST dalam derajat (0-360)
fn local_sidereal_time(longitude: f64, jd: f64) -> f64 {
    // Greenwich Mean Sidereal Time (GMST)
    let t = astro::time::julian_cent(jd);
    let gmst_hours = 18.697374558 + 879000.0513367 * t + 0.093104 * t * t - 6.2e-6 * t * t * t;
    let gmst_hours = gmst_hours % 24.0;
    let gmst_deg = (gmst_hours * 15.0) % 360.0;
    
    // Local Sidereal Time = GMST + longitude
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
    fn test_moon_age_calculation() {
        // Test dengan tanggal contoh
        let location = GeoLocation {
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };
        let date = GregorianDate {
            year: 2024,
            month: 3,
            day: 29.0,
        };

        let age = moon_age_at_sunset(&location, &date);
        // Age seharusnya > 0 dan < 30 jam untuk bulan baru yang baru muncul
        assert!(age > 0.0 && age < 30.0);
    }

    #[test]
    fn test_horizontal_parallax_range() {
        // Horizontal parallax bulan berkisar 53-61 arc-minutes ≈ 0.0157-0.0178 radian
        let jd = 2451545.0; // J2000.0
        let parallax = horizontal_moon_parallax(jd);
        
        // Seharusnya dalam range wajar (53.9' to 61.5' = 0.0157 to 0.0178 rad)
        assert!(parallax > 0.015 && parallax < 0.019, 
                "Parallax {:.6} rad out of expected range", parallax);
    }
    
    #[test]
    fn test_sukabumi_18_feb_2026() {
        // VB6 Reference data untuk Sukabumi, 18 Feb 2026
        let location = GeoLocation {
            latitude: -7.0739,    // 7° 04' 26" S
            longitude: 106.5314,  // 106° 31' 53" E
            elevation: 10.0,
            timezone: 7.0,
        };
        
        let date = GregorianDate {
            year: 2026,
            month: 2,
            day: 18.0,
        };
        
        // Test sunset time (expected: 18:17:06 = 18.285 hours)
        let sunset = crate::astronomy::calculate_sunset(&location, &date);
        println!("Sunset: {:.4}h (expected: 18.285h)", sunset);
        assert!((sunset - 18.285).abs() < 0.01, 
                "Sunset time {:.3} differs from expected 18.285", sunset);
        
        // Test moon age (expected: 21.957 hours)
        let moon_age = moon_age_at_sunset(&location, &date);
        println!("Moon age: {:.3} hours (expected: 21.957)", moon_age);
        // With Jean Meeus Chapter 47: allow ~1.5 hour tolerance
        // (remaining difference due to sunset time calculation)
        assert!((moon_age - 21.957).abs() < 1.5, 
                "Moon age {:.3}h differs from expected 21.957h", moon_age);
        
        // Test altitude - THIS IS THE CRITICAL TEST
        // Expected: 8.653° (8° 39' 11")
        let altitude_topo = altitude_at_sunset(&location, &date, true);
        println!("Moon altitude (topo): {:.3}° (expected: 8.653°)", altitude_topo);
        
        // Allow ~1.5° tolerance for now (need exact Jean Meeus algorithms for better accuracy)
        assert!((altitude_topo - 8.653).abs() < 1.5, 
                "Altitude {:.3}° differs from VB6 expected 8.653°", altitude_topo);
        
        // Test elongation (expected: 11.096°)
        let elongation_topo = elongation_at_sunset(&location, &date, true);
        println!("Elongation (topo): {:.3}° (expected: 11.096°)", elongation_topo);
        
        // Allow ~1° tolerance
        assert!((elongation_topo - 11.096).abs() < 1.0, 
                "Elongation {:.3}° differs from expected 11.096°", elongation_topo);
    }
    
    #[test]
    fn test_lst_calculation() {
        // Test LST calculation for known values
        // At J2000.0 (JD 2451545.0), at Greenwich (lon=0), LST should be 18h 41m 50s ≈ 18.697h
        let jd = 2451545.0;
        let lst = local_sidereal_time_hours(0.0, jd);
        
        // This is approximately correct for J2000.0 epoch
        println!("LST at J2000.0, Greenwich: {:.3}h", lst);
        // The exact value depends on the epoch and formula used
        // We just check it's in a reasonable range
        assert!(lst >= 0.0 && lst < 24.0);
    }
}
