//! Utility functions for detailed ephemeris calculations matching VB6 output

use crate::{GeoLocation, GregorianDate};

/// Calculate azimuth of a celestial body
/// Based on hour angle, declination, and observer's latitude
pub fn calculate_azimuth(hour_angle_deg: f64, declination_deg: f64, latitude_deg: f64) -> f64 {
    let ha_rad = hour_angle_deg.to_radians();
    let dec_rad = declination_deg.to_radians();
    let lat_rad = latitude_deg.to_radians();

    let y = ha_rad.sin();
    let x = ha_rad.cos() * lat_rad.sin() - dec_rad.tan() * lat_rad.cos();

    let azimuth_rad = y.atan2(x);
    let mut azimuth_deg = azimuth_rad.to_degrees();

    // Normalize to 0-360
    if azimuth_deg < 0.0 {
        azimuth_deg += 360.0;
    }

    azimuth_deg
}

/// Helper function to format timezone offset as a string (e.g., "UTC+07:00")
pub fn format_timezone_label(timezone: f64) -> String {
    let abs_tz = timezone.abs();
    let hours = abs_tz.floor() as i32;
    let minutes = ((abs_tz - hours as f64) * 60.0).round() as i32;
    let sign = if timezone >= 0.0 { "+" } else { "-" };
    format!("UTC{}{:02}:{:02}", sign, hours, minutes)
}

/// Calculate moonset time for a given location and date
/// Returns hours from midnight in local time
///
/// CRITICAL FIX: This function now properly searches for when moon altitude
/// crosses ZERO (horizon), not just minimum altitude.
pub fn calculate_moonset(location: &GeoLocation, date: &GregorianDate) -> f64 {
    // jd_start represents the start of the Gregorian day in UT
    let jd_start = crate::calendar::gregorian_to_jd(date);

    // To find moonset in LOCAL day, we should search around the local day
    // Local day starts at jd_start - (timezone / 24.0)
    // We search from 12:00 local to 24:00 local (typically moonset is in the afternoon/evening for hilal)

    let mut prev_alt = super::topocentric::moon_altitude_topocentric(
        location,
        jd_start + ((12.0 - location.timezone) / 24.0),
    );
    let mut moonset_hour_local = 18.0; // Default guess in local time

    // Search in 1-minute increments from 12:00 local to 24:00 local
    for minutes in (12 * 60)..(24 * 60) {
        let hour_local = minutes as f64 / 60.0;
        let hour_ut = hour_local - location.timezone;
        let jd = jd_start + (hour_ut / 24.0);

        let moon_alt = super::topocentric::moon_altitude_topocentric(location, jd);

        // Check if moon crosses horizon (positive to negative)
        if prev_alt > 0.0 && moon_alt <= 0.0 {
            // Found the crossing point, refine with linear interpolation
            let fraction = prev_alt / (prev_alt - moon_alt);
            moonset_hour_local = hour_local - (1.0 / 60.0) * (1.0 - fraction);
            break;
        }

        prev_alt = moon_alt;
    }

    moonset_hour_local
}

/// Calculate lag time (difference between sunset and moonset)
/// Returns formatted string like "-00h 03m 42s" or "+00h 15m 30s"
pub fn calculate_lag_time(sunset_hour: f64, moonset_hour: f64) -> String {
    let diff_hours = moonset_hour - sunset_hour;
    let is_negative = diff_hours < 0.0;
    let abs_hours = diff_hours.abs();

    let hours = abs_hours.floor() as i32;
    let remaining_minutes = (abs_hours - hours as f64) * 60.0;
    let minutes = remaining_minutes.floor() as i32;
    let seconds = ((remaining_minutes - minutes as f64) * 60.0).round() as i32;

    let sign = if is_negative { "-" } else { "+" };
    format!(
        "{}{}h {:02}m {:02}s",
        sign,
        hours.abs(),
        minutes.abs(),
        seconds.abs()
    )
}

/// Format JD to local time string
pub fn format_jd_to_local_time(jd: f64, timezone: f64) -> String {
    // JD is in UTC, add timezone offset
    let local_jd = jd + (timezone / 24.0);

    // Extract time components
    let day_fraction = local_jd.fract();
    let hours = (day_fraction * 24.0).floor();
    let minutes = ((day_fraction * 24.0 - hours) * 60.0).floor();
    let seconds = (((day_fraction * 24.0 - hours) * 60.0 - minutes) * 60.0).round();

    let tz_label = format_timezone_label(timezone);
    format!(
        "{:02}:{:02}:{:02} {}",
        hours as i32, minutes as i32, seconds as i32, tz_label
    )
}

/// Format JD to date and time string
pub fn format_jd_to_datetime(jd: f64, timezone: f64) -> String {
    let local_jd = jd + (timezone / 24.0);

    // Convert JD back to Gregorian date
    let z = (local_jd + 0.5).floor() as i32;
    let f = (local_jd + 0.5) - z as f64;

    let a = if z < 2299161 {
        z
    } else {
        let alpha = ((z as f64 - 1867216.25) / 36524.25).floor() as i32;
        z + 1 + alpha - (alpha / 4)
    };

    let b = a + 1524;
    let c = ((b as f64 - 122.1) / 365.25).floor() as i32;
    let d = (365.25 * c as f64).floor() as i32;
    let e = ((b - d) as f64 / 30.6001).floor() as i32;

    let day = b - d - (30.6001 * e as f64).floor() as i32;
    let month = if e < 14 { e - 1 } else { e - 13 };
    let year = if month > 2 { c - 4716 } else { c - 4715 };

    let hours = (f * 24.0).floor();
    let minutes = ((f * 24.0 - hours) * 60.0).floor();
    let seconds = (((f * 24.0 - hours) * 60.0 - minutes) * 60.0).round();

    let day_names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    let month_names = [
        "",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    // Calculate day of week
    let dow = ((jd + 1.5) % 7.0).floor() as usize;

    let tz_label = format_timezone_label(timezone);
    format!(
        "{} : {:02}:{:02}:{:02} {}",
        day_names[dow], hours as i32, minutes as i32, seconds as i32, tz_label
    )
}

/// Calculate Delta T (difference between TT and UT1)
/// Simplified polynomial approximation for years 2005-2050
pub fn calculate_delta_t(year: i32, month: u8) -> f64 {
    let y = year as f64 + (month as f64 - 0.5) / 12.0;

    // NASA polynomial for 2005-2050
    let t = y - 2000.0;
    let dt = 62.92 + 0.32217 * t + 0.005589 * t * t;

    dt
}

/// Calculate crescent width exactly as VB6/Meeus
pub fn calculate_crescent_width(
    elongation_deg: f64,
    moon_semidiameter_deg: f64,
    _sun_semidiameter_deg: f64,
) -> f64 {
    // VB6: 2 * Semidiameter * Illumination
    // Illumination = (1 - cos(elongation)) / 2 (approximate)
    let illumination = calculate_illumination(elongation_deg) / 100.0;
    let width = 2.0 * moon_semidiameter_deg * illumination;
    width.max(0.0)
}

/// Calculate crescent direction (position angle of bright limb)
/// Meeus Chapter 48 / VB6: JM_GeoMoonBrightLimb
pub fn calculate_crescent_direction(sun_ra: f64, sun_dec: f64, moon_ra: f64, moon_dec: f64) -> f64 {
    let d0 = sun_dec.to_radians();
    let d1 = moon_dec.to_radians();
    let a0 = sun_ra.to_radians();
    let a1 = moon_ra.to_radians();

    let y = d0.cos() * (a0 - a1).sin();
    let x = d0.sin() * d1.cos() - d0.cos() * d1.sin() * (a0 - a1).cos();

    let chi_rad = y.atan2(x);
    let mut chi_deg = chi_rad.to_degrees();

    // Normalize to 0-360
    if chi_deg < 0.0 {
        chi_deg += 360.0;
    }
    chi_deg
}

/// Calculate illumination percentage
pub fn calculate_illumination(elongation_deg: f64) -> f64 {
    // Meeus 48.1 / VB6: (1 - cos(elongation)) / 2
    // Technically it should use phase angle i, but for Hilal i ≈ 180 - elongation
    // so (1 + cos(i))/2 ≈ (1 - cos(elongation))/2
    let elongation_rad = elongation_deg.to_radians();
    ((1.0 - elongation_rad.cos()) / 2.0) * 100.0
}

/// Calculate phase angle
pub fn calculate_phase_angle(elongation_deg: f64) -> f64 {
    180.0 - elongation_deg
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_azimuth_calculation() {
        // Test azimuth calculation
        let az = calculate_azimuth(0.0, 0.0, 0.0);
        assert!(az >= 0.0 && az < 360.0);
    }

    #[test]
    fn test_lag_time_formatting() {
        let lag = calculate_lag_time(18.5, 18.25);
        assert!(lag.contains("-"));
    }

    #[test]
    fn test_illumination() {
        let illum = calculate_illumination(0.0);
        assert!((illum - 0.0).abs() < 0.1);

        let illum_180 = calculate_illumination(180.0);
        assert!((illum_180 - 100.0).abs() < 0.1);
    }

    #[test]
    fn test_timezone_label_formatting() {
        assert_eq!(format_timezone_label(7.0), "UTC+07:00");
        assert_eq!(format_timezone_label(9.0), "UTC+09:00");
        assert_eq!(format_timezone_label(-5.0), "UTC-05:00");
        assert_eq!(format_timezone_label(5.5), "UTC+05:30");
        assert_eq!(format_timezone_label(0.0), "UTC+00:00");
    }
}
