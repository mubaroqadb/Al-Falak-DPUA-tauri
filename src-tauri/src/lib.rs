// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use chrono::{Datelike, Timelike};

// Tipe data fundamental
pub type JulianDay = f64;
pub type Degrees = f64;
pub type Radians = f64;
pub type Hours = f64;

// Struktur koordinat geografis
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GeoLocation {
    pub name: Option<String>, // Nama lokasi (misal: "Jakarta")
    pub latitude: Degrees,    // Lintang (positif = Utara)
    pub longitude: Degrees,   // Bujur (positif = Timur)
    pub elevation: f64,       // Ketinggian dalam meter
    pub timezone: f64,        // Zona waktu (WIB = 7.0)
}

// Struktur tanggal Gregorian
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GregorianDate {
    pub year: i32,
    pub month: u8,
    pub day: f64, // Termasuk jam (decimal)
}

// Struktur tanggal Hijriah
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HijriDate {
    pub year: i32,
    pub month: u8,
    pub day: u8,
}

// Posisi benda langit
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CelestialPosition {
    pub longitude: Degrees,       // Bujur ekliptika
    pub latitude: Degrees,        // Lintang ekliptika
    pub right_ascension: Degrees, // Asensio rekta
    pub declination: Degrees,     // Deklinasi
    pub distance: f64,            // Jarak (AU atau km)
}

// Data konjungsi (ijtimak)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Conjunction {
    pub jd: JulianDay,
    pub gregorian: GregorianDate,
    pub hijri_month: u8,
    pub hijri_year: i32,
}

// Data visibilitas hilal
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HilalVisibility {
    pub sunset_time: Hours,
    pub moonset_time: Hours,
    pub moon_age: Hours,        // Umur bulan sejak ijtimak
    pub elongation: Degrees,    // Elongasi (jarak sudut bulan-matahari)
    pub moon_altitude: Degrees, // Tinggi bulan saat maghrib
    pub arc_of_vision: Degrees, // ARCV
    pub width: f64,             // Lebar hilal (arc-minutes)
    pub best_time: Hours,       // Waktu terbaik untuk observasi
}

// Data astronomi lengkap
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AstronomicalData {
    pub sun_position: CelestialPosition,
    pub moon_position: CelestialPosition,
    pub conjunction: Option<Conjunction>,
    pub moon_phase: f64,
    pub moon_age: f64,
}

// Kriteria visibilitas
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum VisibilityCriteria {
    MABIMS,
    Odeh,
    WujudulHilal,
    Turkey,
    Danjon,
    Custom,
}

pub mod astronomy;
pub mod calendar;
pub mod commands;
pub mod criteria;
pub mod map;
pub mod validation;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Old placeholder commands - replaced by command handlers in commands/ module:
// - calculate_hilri_month_start → commands::hilal::calculate_hilal_visibility_command
// - get_astronomical_data → commands::astronomical::get_astronomical_data_command

// Helper functions
fn parse_date_string(date_str: &str) -> Result<GregorianDate, String> {
    // Parse ISO date string to GregorianDate
    // TODO: Implement proper date parsing
    let dt = chrono::DateTime::parse_from_rfc3339(date_str)
        .map_err(|e| format!("Invalid date format: {}", e))?;

    Ok(GregorianDate {
        year: dt.year(),
        month: dt.month() as u8,
        day: dt.day() as f64
            + (dt.hour() as f64 / 24.0)
            + (dt.minute() as f64 / 1440.0)
            + (dt.second() as f64 / 86400.0),
    })
}

// Old placeholder functions - replaced by command handlers in commands/ module
// These can be safely removed as they are now handled by:
// - commands::hilal::calculate_hilal_visibility_command
// - commands::astronomical::get_astronomical_data_command
// - commands::validation::validate_location_command

/* Commented out - not yet implemented
#[tauri::command]
fn get_ephemeris_data(
    _location: GeoLocation,
    start_date: String,
    end_date: String,
) -> Result<Vec<AstronomicalData>, String> {
    // TODO: Implement ephemeris data retrieval for date range
    let _start = parse_date_string(&start_date)?;
    let _end = parse_date_string(&end_date)?;

    Ok(vec![])
}
*/

#[tauri::command]
fn calculate_qibla_direction(location: GeoLocation) -> Result<f64, String> {
    // TODO: Implement qibla direction calculation
    // For now, return a placeholder value
    Ok(calculate_qibla(&location))
}

fn calculate_qibla(location: &GeoLocation) -> f64 {
    // Placeholder: Calculate qibla direction (bearing to Mecca)
    // Mecca coordinates: 21.4225°N, 39.8262°E
    let mecca_lat = 21.4225_f64.to_radians();
    let mecca_lon = 39.8262_f64.to_radians();

    let lat = location.latitude.to_radians();
    let lon = location.longitude.to_radians();

    let dlon = mecca_lon - lon;
    let y = dlon.sin() * mecca_lat.cos();
    let x = lat.cos() * mecca_lat.sin() - lat.sin() * mecca_lat.cos() * dlon.cos();

    let qibla = y.atan2(x).to_degrees();
    (qibla + 360.0) % 360.0 // Normalize to 0-360
}

#[tauri::command]
fn get_prayer_times(
    location: GeoLocation,
    date: String,
) -> Result<std::collections::HashMap<String, String>, String> {
    let parsed_date = parse_date_string(&date)?;

    // Gunakan konfigurasi default dulu (bisa ditambahkan parameter config nanti)
    let config = astronomy::prayer::PrayerConfig::default();

    let times = astronomy::prayer::calculate_prayer_times(&location, &parsed_date, &config);

    let mut map = std::collections::HashMap::new();
    map.insert("imsak".to_string(), times.imsak);
    map.insert("shubuh".to_string(), times.shubuh);
    map.insert("syuruq".to_string(), times.terbit); // Mapping "terbit" -> "syuruq"
    map.insert("dhuha".to_string(), times.dhuha);
    map.insert("dzuhur".to_string(), times.dzuhur);
    map.insert("ashr".to_string(), times.ashr);
    map.insert("maghrib".to_string(), times.maghrib);
    map.insert("isya".to_string(), times.isya);
    map.insert("tengah_malam".to_string(), times.tengah_malam);
    map.insert("p3_malam".to_string(), times.p3_malam);

    Ok(map)
}

#[tauri::command]
fn calculate_visibility_zones(
    date: String,
    criteria: String,
    step_degrees: f64,
) -> Result<Vec<map::VisibilityZone>, String> {
    // Parse date string to JD
    let dt = chrono::DateTime::parse_from_rfc3339(&date)
        .map_err(|e| format!("Invalid date format: {}", e))?;

    let gregorian = GregorianDate {
        year: dt.year(),
        month: dt.month() as u8,
        day: dt.day() as f64
            + (dt.hour() as f64 / 24.0)
            + (dt.minute() as f64 / 1440.0)
            + (dt.second() as f64 / 86400.0),
    };

    let jd = calendar::gregorian_to_jd(&gregorian);

    // Call the calculation function
    let zones = map::calculate_visibility_zones_internal(jd, &criteria, step_degrees);
    Ok(zones)
}

#[tauri::command]
fn get_detailed_hilal_data(
    location: GeoLocation,
    year: i32,
    month: u8,
    day: u8,
) -> Result<map::DetailedHilalData, String> {
    // Create date
    let observation_date = GregorianDate {
        year,
        month,
        day: day as f64,
    };

    let jd = calendar::gregorian_to_jd(&observation_date);
    let conjunction = astronomy::find_conjunction_for_month(year, month);

    // Calculate sunset
    let sunset_hour = astronomy::calculate_sunset(&location, &observation_date);
    let sunset_jd = jd + (sunset_hour / 24.0);

    // Get positions at sunset
    let moon_pos = astronomy::moon_position(sunset_jd);
    let sun_pos = astronomy::sun_position(sunset_jd);

    // Calculate parameters
    let moon_age_hours = (sunset_jd - conjunction.jd_utc) * 24.0;
    let mut elongation = moon_pos.longitude - sun_pos.longitude;
    if elongation < 0.0 {
        elongation += 360.0;
    }

    Ok(map::DetailedHilalData {
        conjunction_jd: conjunction.jd_utc,
        conjunction_date: format!("{}-{:02}-{:02}", year, month, day),
        sunset_time: sunset_hour,
        moonset_time: sunset_hour + 1.0, // Simplified
        moon_age_hours,
        moon_altitude: 5.0,  // Placeholder
        moon_azimuth: 270.0, // Placeholder
        sun_altitude: 0.0,
        sun_azimuth: 270.0,
        elongation,
        moon_distance_km: moon_pos.distance,
        sun_distance_km: sun_pos.distance,
        moon_semidiameter: 0.25,
        sun_semidiameter: 0.25,
        parallax: 0.95,
        refraction: 0.6,
        arcv: elongation - 5.0,
        crescent_width: 0.5,
    })
}

#[tauri::command]
fn get_ephemeris_data(
    location: GeoLocation,
    start_date: String,
    end_date: String,
) -> Result<Vec<AstronomicalData>, String> {
    // TODO: Implement ephemeris data retrieval for date range
    let _start = parse_date_string(&start_date)?;
    let _end = parse_date_string(&end_date)?;
    let _loc = location;

    // Placeholder: return empty array until implemented
    Ok(vec![])
}

// Replaced by commands::validation::validate_location_command

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            crate::commands::hilal::calculate_hilal_visibility_command,
            crate::commands::astronomical::get_astronomical_data_command,
            crate::commands::calendar_cmd::gregorian_to_hijri_command,
            crate::commands::calendar_cmd::hijri_to_gregorian_command,
            crate::commands::validation::validate_location_command,
            crate::commands::validation::run_validation_tests_command,
            calculate_visibility_zones,
            get_detailed_hilal_data,
            get_ephemeris_data,
            calculate_qibla_direction,
            get_prayer_times,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sukabumi_vb6_validation() {
        println!("\n{}", "=".repeat(80));
        println!("VB6 VALIDATION - SUKABUMI (18 Feb 2026)");
        println!("{}", "=".repeat(80));

        let sukabumi = GeoLocation {
            name: Some("Sukabumi".to_string()),
            latitude: -7.0739,
            longitude: 106.5314,
            elevation: 10.0,
            timezone: 7.0,
        };
        let date = GregorianDate {
            year: 2026,
            month: 2,
            day: 18.0,
        };

        // Sunset
        let sunset_time = astronomy::sun::calculate_sunset(&sukabumi, &date);
        println!(
            "\n🌅 Sunset: {:.4}h (VB6: 18.285h) Δ={:.3}h",
            sunset_time,
            sunset_time - 18.285
        );

        // Altitude - KEY METRIC
        let altitude = astronomy::hilal::altitude_at_sunset(&sukabumi, &date, false);
        println!(
            "📏 Altitude: {:.3}° (VB6: 8.653°) Δ={:.3}° {}",
            altitude,
            altitude - 8.653,
            if (altitude - 8.653).abs() < 2.0 {
                "✅"
            } else {
                "❌"
            }
        );

        // Assertions
        assert!(
            (sunset_time - 18.285).abs() < 0.15,
            "Sunset diff: {:.3}h",
            sunset_time - 18.285
        );
        assert!(
            (altitude - 8.653).abs() < 2.5,
            "Altitude diff: {:.3}°",
            altitude - 8.653
        );

        println!("{}\n", "=".repeat(80));
    }
}
