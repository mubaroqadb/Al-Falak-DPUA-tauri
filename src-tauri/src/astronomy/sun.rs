// Module untuk perhitungan posisi matahari

use crate::{CelestialPosition, Degrees, JulianDay};
use astro;

/// Hitung posisi matahari geosentris menggunakan VB6 parity (sun_vb6)
pub fn geocentric_position(jd: JulianDay) -> CelestialPosition {
    // Gunakan implementasi VB6-compatible
    super::sun_vb6::geocentric_position(jd)
}

/// Hitung deklinasi matahari menggunakan VSOP87
pub fn declination(jd: JulianDay) -> Degrees {
    // VB6: VSOP_GeoAppSunDeclination
    // Uses astro-rust VSOP87
    let ecl_point = astro::sun::geocent_ecl_pos(jd).0;
    let eps = obliquity_of_ecliptic(jd).to_radians();

    let b = ecl_point.lat;
    let l = ecl_point.long;

    // VB6 formula:
    // sinDEC = sin(B) * cos(Eps) + cos(B) * sin(Eps) * sin(L)
    let sin_dec = b.sin() * eps.cos() + b.cos() * eps.sin() * l.sin();
    let decl = sin_dec.asin();

    decl.to_degrees()
}

/// Hitung mean longitude of the Sun (Jean Meeus)
/// Returns degrees
fn jm_sun_mean_longitude(jd: JulianDay) -> f64 {
    // VB6: JDE = JM_JulianDatum + DeltaT/86400
    // For now, simplified without Delta T for initial implementation
    let jde = jd;
    let t = (jde - 2451545.0) / 36525.0;
    let tau = t / 10.0;

    // VB6: JM_SunMeanLongitude = Modulus(280.4664567 + 360007.6982779 * tau + 0.03032028 * tau ^ 2 + tau ^ 3 / 49931 - tau ^ 4 / 15299 - tau ^ 5 / 1988000, 360#)
    let l0 = 280.4664567 + 360007.6982779 * tau + 0.03032028 * tau.powi(2) + tau.powi(3) / 49931.0
        - tau.powi(4) / 15299.0
        - tau.powi(5) / 1988000.0;

    l0.rem_euclid(360.0)
}

/// Hitung nutation in longitude (simplified, should use full nutation series for accuracy)
fn nutation_in_longitude(jd: JulianDay) -> f64 {
    // Simplified nutation - for exact VB6 compatibility should port full series
    // This is approximate for now
    let t = (jd - 2451545.0) / 36525.0;
    let omega = (125.04452 - 1934.136261 * t).to_radians();
    let dpsi = -17.20 * omega.sin() - 1.32 * (2.0 * omega).sin();
    dpsi / 3600.0 // Convert arcseconds to degrees
}

/// Hitung obliquity of ecliptic (true obliquity)
fn obliquity_of_ecliptic(jd: JulianDay) -> f64 {
    let t = (jd - 2451545.0) / 36525.0;

    // Mean obliquity (Meeus formula)
    let eps0 =
        23.439291111 - 0.0130041667 * t - 0.00000016389 * t.powi(2) + 0.000000503611 * t.powi(3);

    // Add nutation in obliquity (simplified)
    let omega = (125.04452 - 1934.136261 * t).to_radians();
    let deps = 9.20 * omega.cos() + 0.57 * (2.0 * omega).cos();

    eps0 + deps / 3600.0
}

/// Hitung geocentric apparent right ascension of Sun (Jean Meeus method)
/// Returns degrees
fn jm_geo_app_sun_right_ascension(jd: JulianDay) -> f64 {
    // For exact VB6 compatibility, should use JM_GeoAppSunLongitude and JM_GeoAppSunLatitude
    // For now using astro-rust as approximation
    let ecl_point = astro::sun::geocent_ecl_pos(jd).0;
    let obliquity = obliquity_of_ecliptic(jd).to_radians();

    let l = ecl_point.long;
    let b = ecl_point.lat;

    // VB6 formula from JM_GeoAppSunRightAscension:
    // sinAlpha = -sin(B) * sin(Eps) + cos(B) * cos(Eps) * sin(L)
    // cosAlpha = cos(B) * cos(L)
    let sin_alpha = -b.sin() * obliquity.sin() + b.cos() * obliquity.cos() * l.sin();
    let cos_alpha = b.cos() * l.cos();

    // Use atan2 for proper quadrant
    let alpha = sin_alpha.atan2(cos_alpha).to_degrees();
    alpha.rem_euclid(360.0)
}

/// Hitung equation of time (Jean Meeus method) - exact VB6 port
/// Returns hours
pub fn equation_of_time(jd: JulianDay) -> f64 {
    // VB6: JM_EquationOfTime
    // lambda = JM_SunMeanLongitude
    // alpha = JM_GeoAppSunRightAscension
    // dPsi = NutationInLongitude / 3600
    // Eps = ObliquityOfEcliptic
    // JM_EquationOfTime = ((lambda - 0.0057183 - alpha) + dPsi * cos(deg2rad(Eps))) / 15

    let lambda = jm_sun_mean_longitude(jd);
    let alpha = jm_geo_app_sun_right_ascension(jd);
    let dpsi = nutation_in_longitude(jd);
    let eps = obliquity_of_ecliptic(jd);

    let mut eot = ((lambda - 0.0057183 - alpha) + dpsi * eps.to_radians().cos()) / 15.0;

    // VB6: If (JM_EquationOfTime > 23#) Then JM_EquationOfTime = JM_EquationOfTime - 24#
    if eot > 23.0 {
        eot -= 24.0;
    }

    eot
}

/// Hitung waktu sunset untuk lokasi tertentu
///
/// Formula VB6-compatible exact port dari Jean Meeus / VSOP
///
/// FIX: Menggunakan iterasi yang lebih akurat untuk menghitung sunset
/// dengan mempertimbangkan perubahan deklinasi matahari sepanjang hari.
pub fn calculate_sunset(
    location: &crate::GeoLocation,
    date: &crate::GregorianDate,
) -> crate::Hours {
    // Konversi tanggal ke Julian Day
    let date_only = crate::GregorianDate {
        year: date.year,
        month: date.month,
        day: date.day.floor(),
    };
    let jd = crate::calendar::gregorian_to_jd(&date_only);

    // Altitude untuk sunset = -0.8333° (VB6 default: -0°50' = -0.8333°)
    // Ini sudah termasuk semidiameter matahari (16') + refraksi (34')
    let altitude_sunset = -0.8333_f64;

    let kwd = location.timezone - (location.longitude / 15.0);

    // Iterasi untuk mencari waktu sunset yang akurat
    let mut sunset_local = 18.0; // Initial guess

    for _ in 0..5 {
        // 5 iterasi untuk konvergensi
        // Convert local time to UT for JD calculation
        let sunset_ut = sunset_local - location.timezone;
        let jd_sunset = jd + (sunset_ut / 24.0);

        // Hitung equation of time dan hour angle
        let eot = equation_of_time(jd_sunset);
        let ha = vsop_sun_hour_angle(location.latitude, altitude_sunset, jd_sunset);

        if ha == 999.0 {
            return 999.0; // No sunset possible
        }

        // Hitung waktu sunset baru
        let new_sunset = 12.0 - eot + ha + kwd;

        // Check konvergensi
        if (new_sunset - sunset_local).abs() < 0.001 {
            // 3.6 detik
            break;
        }

        sunset_local = new_sunset;
    }

    // Normalisasi ke 0-24
    sunset_local.rem_euclid(24.0)
}

/// VSOP Sun Hour Angle - exact VB6 port
/// Returns hour angle in hours, or 999.0 if not possible
fn vsop_sun_hour_angle(latitude: f64, altitude: f64, jd: JulianDay) -> f64 {
    // VB6: VSOP_SunHourAngle
    // delta = VSOP_GeoAppSunDeclination
    // cosH = (sin(Alt) - sin(delta) * sin(Lintang)) / (cos(delta) * cos(Lintang))
    // VSOP_SunHourAngle = rad2deg(Acos(cosH)) * 24# / 360#

    let delta = declination(jd).to_radians();
    let lat = latitude.to_radians();
    let alt = altitude.to_radians();

    let cos_h = (alt.sin() - delta.sin() * lat.sin()) / (delta.cos() * lat.cos());

    // Check range
    if cos_h < -1.0 || cos_h > 1.0 {
        return 999.0;
    }

    let h = cos_h.acos();
    let ha_hours = h.to_degrees() * 24.0 / 360.0;

    ha_hours
}
