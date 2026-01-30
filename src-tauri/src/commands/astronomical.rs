//! Astronomical data command handler

use crate::{CelestialPosition, GeoLocation, GregorianDate};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct AstronomicalDataResponse {
    pub observation_date: GregorianDate,
    pub location: GeoLocation,
    pub sun_position: CelestialPosition,
    pub moon_position: CelestialPosition,
    pub moon_phase: f64,       // 0-1 (0=new, 0.5=full, 1=new)
    pub moon_age_hours: f64,   // Jam sejak new moon
    pub moon_altitude: f64,    // Altitude di atas horizon
    pub moon_distance_km: f64, // Distance ke bumi
    pub sunset_time: f64,      // Waktu maghrib dalam jam
    pub day_name: String,      // Hari + Pasaran (e.g. "Senin Legi")
    pub timestamp: String,
}

/// Get astronomical data untuk lokasi dan tanggal tertentu
#[tauri::command]
pub fn get_astronomical_data_command(
    location: GeoLocation,
    year: i32,
    month: u8,
    day: u8,
    hour: f64,
    minute: f64,
) -> Result<AstronomicalDataResponse, String> {
    // Validate input
    if hour < 0.0 || hour >= 24.0 {
        return Err("Invalid hour (0-23)".to_string());
    }
    if minute < 0.0 || minute >= 60.0 {
        return Err("Invalid minute (0-59)".to_string());
    }

    // Create date dengan waktu
    let observation_date = GregorianDate {
        year,
        month,
        day: day as f64 + (hour / 24.0) + (minute / 1440.0),
    };

    // Convert to Julian Day
    let jd = crate::calendar::gregorian_to_jd(&observation_date);

    // Get celestial positions
    let sun_pos = crate::astronomy::sun_position(jd);
    let moon_pos = crate::astronomy::moon_position(jd);

    // Get lunar information
    let moon_phase = crate::astronomy::phase(jd);
    let moon_age_hours = crate::astronomy::age_since_new_moon(jd);

    // Get sunset time
    let sunset_hour = crate::astronomy::calculate_sunset(&location, &observation_date);

    // Get moon altitude at observation time
    let moon_altitude = crate::astronomy::altitude_at_sunset(&location, &observation_date, false);

    // Convert moon distance from AU to km
    let moon_distance_km = moon_pos.distance * 149_597_870.7;

    Ok(AstronomicalDataResponse {
        observation_date,
        location,
        sun_position: sun_pos,
        moon_position: moon_pos,
        moon_phase,
        moon_age_hours,
        moon_altitude,
        moon_distance_km,
        sunset_time: sunset_hour,
        timestamp: chrono::Local::now().to_rfc3339(),
    })
}

/// Get astronomical data menggunakan tanggal Hijriah
#[tauri::command]
pub fn get_astronomical_data_hijri_command(
    location: GeoLocation,
    hijri_year: i32,
    hijri_month: u8,
    hijri_day: u8,
    hour: f64,
    minute: f64,
) -> Result<AstronomicalDataResponse, String> {
    // Validate time input
    if hour < 0.0 || hour >= 24.0 {
        return Err("Invalid hour (0-23)".to_string());
    }
    if minute < 0.0 || minute >= 60.0 {
        return Err("Invalid minute (0-59)".to_string());
    }

    // Convert Hijri to Gregorian
    let hijri_date = crate::calendar::HijriDate::new(hijri_year, hijri_month, hijri_day);
    let gregorian_date = crate::calendar::hijri_to_gregorian(&hijri_date);

    // Call the Gregorian version with the converted date
    get_astronomical_data_command(
        location,
        gregorian_date.year,
        gregorian_date.month,
        gregorian_date.day as u8,
        hour,
        minute,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_hour() {
        let location = GeoLocation {
            name: None,
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };

        let result = get_astronomical_data_command(location, 2024, 1, 15, 25.0, 0.0);
        assert!(result.is_err());
    }

    #[test]
    fn test_valid_input() {
        let location = GeoLocation {
            name: None,
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };

        let result = get_astronomical_data_command(location, 2024, 1, 15, 12.0, 0.0);
        assert!(result.is_ok());
    }
}
