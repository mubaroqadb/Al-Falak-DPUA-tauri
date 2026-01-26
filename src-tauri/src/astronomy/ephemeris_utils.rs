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

/// Calculate moonset time for a given location and date
/// Returns hours from midnight in local time
pub fn calculate_moonset(location: &GeoLocation, date: &GregorianDate) -> f64 {
    let jd_start = crate::calendar::gregorian_to_jd(date);

    // Search for moonset (when moon altitude crosses horizon)
    // Start from noon and search forward
    let mut best_time = 18.0; // Default estimate
    let mut min_altitude_diff = f64::MAX;

    // Search in 1-minute increments around sunset time
    for minutes in 0..(24 * 60) {
        let hour = minutes as f64 / 60.0;
        let jd = jd_start + (hour / 24.0);

        let moon_alt = super::topocentric::moon_altitude_topocentric(location, jd);
        let altitude_diff = moon_alt.abs(); // Distance from horizon

        if altitude_diff < min_altitude_diff && hour > 12.0 {
            min_altitude_diff = altitude_diff;
            best_time = hour;
        }
    }

    best_time
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

    format!(
        "{:02}:{:02}:{:02} WIB",
        hours as i32, minutes as i32, seconds as i32
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

    format!(
        "{} : {:02}:{:02}:{:02} LT",
        day_names[dow], hours as i32, minutes as i32, seconds as i32
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

/// Calculate crescent width (approximate)
pub fn calculate_crescent_width(
    elongation_deg: f64,
    moon_semidiameter_deg: f64,
    _sun_semidiameter_deg: f64,
) -> f64 {
    // Simplified formula based on elongation
    let elongation_rad = elongation_deg.to_radians();
    let width = 2.0 * moon_semidiameter_deg * elongation_rad.sin();
    width.max(0.0)
}

/// Calculate crescent direction (position angle of bright limb)
pub fn calculate_crescent_direction(
    sun_azimuth: f64,
    moon_azimuth: f64,
    moon_altitude: f64,
) -> f64 {
    // Simplified: angle from north through east
    let azimuth_diff = moon_azimuth - sun_azimuth;
    let altitude_rad = moon_altitude.to_radians();

    let direction = azimuth_diff + 90.0 * (1.0 - altitude_rad.cos());

    // Normalize to 0-360
    let mut normalized = direction % 360.0;
    if normalized < 0.0 {
        normalized += 360.0;
    }
    normalized
}

/// Calculate illumination percentage
pub fn calculate_illumination(elongation_deg: f64) -> f64 {
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
}
