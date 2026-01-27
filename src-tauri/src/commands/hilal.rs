//! Hilal visibility command handler

use crate::{GeoLocation, GregorianDate};
use std::collections::HashMap;

// Helper structs for internal calculations
#[derive(Debug, Clone, Copy)]
struct NutationData {
    pub longitude: f64,
    pub obliquity: f64,
}

#[derive(Debug, Clone, Copy)]
struct SunTopoData {
    pub longitude: f64,
    pub latitude: f64,
    pub right_ascension: f64,
    pub declination: f64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct HilalCriteriaResult {
    pub criteria_name: String,
    pub is_visible: bool,
    pub visibility_type: String,
    pub additional_info: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct DetailedEphemeris {
    // Conjunction data
    pub conjunction_jd_geocentric: f64,
    pub conjunction_jd_topocentric: f64,
    pub conjunction_date: String,

    // Time data
    pub sunset_time: String,
    pub moonset_time: String,
    pub lag_time: String,
    pub delta_t: f64,

    // Distance data
    pub sun_distance_km: f64,
    pub moon_distance_km: f64,

    // Semidiameters
    pub sun_semidiameter_deg: f64,
    pub moon_semidiameter_deg: f64,

    // Ecliptic coordinates (Geocentric)
    pub sun_longitude_geo: f64,
    pub sun_latitude_geo: f64,
    pub moon_longitude_geo: f64,
    pub moon_latitude_geo: f64,

    // Ecliptic coordinates (Topocentric)
    pub sun_longitude_topo: f64,
    pub sun_latitude_topo: f64,
    pub moon_longitude_topo: f64,
    pub moon_latitude_topo: f64,

    // Apparent ecliptic coordinates (Geocentric)
    pub sun_longitude_apparent_geo: f64,
    pub sun_latitude_apparent_geo: f64,
    pub moon_longitude_apparent_geo: f64,
    pub moon_latitude_apparent_geo: f64,

    // Apparent ecliptic coordinates (Topocentric)
    pub sun_longitude_apparent_topo: f64,
    pub sun_latitude_apparent_topo: f64,
    pub moon_longitude_apparent_topo: f64,
    pub moon_latitude_apparent_topo: f64,

    // Equatorial coordinates (Geocentric)
    pub sun_ra_geo: f64,
    pub sun_dec_geo: f64,
    pub moon_ra_geo: f64,
    pub moon_dec_geo: f64,

    // Equatorial coordinates (Topocentric)
    pub sun_ra_topo: f64,
    pub sun_dec_topo: f64,
    pub moon_ra_topo: f64,
    pub moon_dec_topo: f64,

    // Apparent equatorial coordinates (Geocentric)
    pub sun_ra_apparent_geo: f64,
    pub sun_dec_apparent_geo: f64,
    pub moon_ra_apparent_geo: f64,
    pub moon_dec_apparent_geo: f64,

    // Apparent equatorial coordinates (Topocentric)
    pub sun_ra_apparent_topo: f64,
    pub sun_dec_apparent_topo: f64,
    pub moon_ra_apparent_topo: f64,
    pub moon_dec_apparent_topo: f64,

    // Horizontal coordinates (Airless, Geocentric)
    pub sun_altitude_airless_geo: f64,
    pub sun_azimuth_airless_geo: f64,
    pub moon_altitude_airless_geo: f64,
    pub moon_azimuth_airless_geo: f64,

    // Horizontal coordinates (Airless, Topocentric)
    pub sun_altitude_airless_topo: f64,
    pub sun_azimuth_airless_topo: f64,
    pub moon_altitude_airless_topo: f64,
    pub moon_azimuth_airless_topo: f64,

    // Apparent horizontal coordinates (Airless, Geocentric)
    pub sun_altitude_apparent_airless_geo: f64,
    pub sun_azimuth_apparent_airless_geo: f64,
    pub moon_altitude_apparent_airless_geo: f64,
    pub moon_azimuth_apparent_airless_geo: f64,

    // Apparent horizontal coordinates (Airless, Topocentric)
    pub sun_altitude_apparent_airless_topo: f64,
    pub sun_azimuth_apparent_airless_topo: f64,
    pub moon_altitude_apparent_airless_topo: f64,
    pub moon_azimuth_apparent_airless_topo: f64,

    // Horizontal coordinates with refraction (Airy, Geocentric)
    pub sun_altitude_airy_geo: f64,
    pub moon_altitude_airy_geo: f64,

    // Horizontal coordinates with refraction (Airy, Topocentric)
    pub sun_altitude_airy_topo: f64,
    pub moon_altitude_airy_topo: f64,

    // Corrections and parallax
    pub nutation_longitude: f64,
    pub nutation_obliquity: f64,
    pub sun_aberration: f64,
    pub sun_refraction: f64,
    pub moon_refraction: f64,
    pub sun_horizontal_parallax: f64,
    pub moon_horizontal_parallax: f64,

    // Hilal visibility data (Geocentric)
    pub moon_age_hours_geo: f64,
    pub elongation_geo: f64,
    pub illumination_geo: f64,
    pub crescent_width_geo: f64,
    pub upper_limb_altitude_geo: f64,
    pub center_altitude_geo: f64,
    pub lower_limb_altitude_geo: f64,
    pub relative_altitude_geo: f64,
    pub relative_azimuth_geo: f64,
    pub phase_angle_geo: f64,
    pub crescent_direction_geo: f64,
    pub crescent_position_geo: f64,

    // Hilal visibility data (Topocentric)
    pub moon_age_hours_topo: f64,
    pub elongation_topo: f64,
    pub illumination_topo: f64,
    pub crescent_width_topo: f64,
    pub upper_limb_altitude_topo: f64,
    pub center_altitude_topo: f64,
    pub lower_limb_altitude_topo: f64,
    pub relative_altitude_topo: f64,
    pub relative_azimuth_topo: f64,
    pub phase_angle_topo: f64,
    pub crescent_direction_topo: f64,
    pub crescent_position_topo: f64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct HilalCalculationResult {
    pub location: GeoLocation,
    pub observation_date: GregorianDate,
    pub conjunction_jd: f64,
    pub criteria_results: HashMap<String, HilalCriteriaResult>,
    pub ephemeris: DetailedEphemeris,
    pub timestamp: String,
}

/// Calculate hilal visibility untuk semua kriteria
#[tauri::command]
pub fn calculate_hilal_visibility_command(
    location: GeoLocation,
    year: i32,
    month: u8,
    day: u8,
) -> Result<HilalCalculationResult, String> {
    // Log received location untuk debugging
    println!(
        "🔍 Received location: lat={}, lon={}, elev={}, tz={}",
        location.latitude, location.longitude, location.elevation, location.timezone
    );

    // Validate input
    if month < 1 || month > 12 {
        return Err("Invalid month (1-12)".to_string());
    }
    if day < 1 || day > 31 {
        return Err("Invalid day (1-31)".to_string());
    }

    // Create date
    let observation_date = GregorianDate {
        year,
        month,
        day: day as f64,
    };

    // Cari konjungsi untuk bulan ini
    let conjunction = crate::astronomy::find_conjunction_for_month(year as i32, month);

    // Calculate sunset JD
    // calculate_sunset returns basic local time (without timezone check for date validity),
    // so we assume it applies to the same date.
    let sunset_hour_local = crate::astronomy::calculate_sunset(&location, &observation_date);

    // We need UT for JD
    let sunset_hour_ut = sunset_hour_local - location.timezone;

    let jd_day_start = crate::calendar::gregorian_to_jd(&observation_date);
    let sunset_jd = jd_day_start + (sunset_hour_ut / 24.0);

    // Calculate detailed ephemeris
    // Note: detailed ephemeris calculation might need the localized sunset time for display
    let ephemeris = calculate_detailed_ephemeris(&location, conjunction.jd_utc, sunset_jd);

    // Evaluasi semua kriteria
    let criteria_results =
        crate::criteria::evaluate_all_criteria(&location, &observation_date, conjunction.jd_utc);

    // Konversi HashMap ke format yang sesuai
    let mut formatted_results = HashMap::new();
    for (key, value) in criteria_results {
        formatted_results.insert(
            key,
            HilalCriteriaResult {
                criteria_name: value.criteria_name,
                is_visible: value.is_visible,
                visibility_type: value.visibility_type,
                additional_info: value.additional_info,
            },
        );
    }

    let result = HilalCalculationResult {
        location: location.clone(),
        observation_date,
        conjunction_jd: conjunction.jd_utc,
        criteria_results: formatted_results,
        ephemeris,
        timestamp: chrono::Local::now().to_rfc3339(),
    };

    // Log returned location untuk debugging
    println!(
        "✅ Returning location: lat={}, lon={}, elev={}, tz={}",
        result.location.latitude,
        result.location.longitude,
        result.location.elevation,
        result.location.timezone
    );

    Ok(result)
}

/// Calculate detailed ephemeris data like VB6 output
fn calculate_detailed_ephemeris(
    location: &GeoLocation,
    conjunction_jd: f64,
    sunset_jd: f64,
) -> DetailedEphemeris {
    use crate::astronomy;
    use crate::astronomy::ephemeris_utils;
    use crate::astronomy::nutation;

    // Get geocentric positions at sunset
    let moon_geo = astronomy::moon_position(sunset_jd);
    let sun_geo = astronomy::sun_position(sunset_jd);

    // Get geocentric data to pass to topocentric functions
    let moon_topo = astronomy::topocentric::moon_topocentric_position(
        location,
        sunset_jd,
        moon_geo.right_ascension,
        moon_geo.declination,
        moon_geo.distance,
        moon_geo.longitude,
        moon_geo.latitude,
    );

    // For sun, create a simple topocentric struct (sun parallax is negligible)
    let sun_topo = SunTopoData {
        longitude: sun_geo.longitude,
        latitude: sun_geo.latitude,
        right_ascension: sun_geo.right_ascension,
        declination: sun_geo.declination,
    };

    // Calculate nutation
    let nutation_lon = nutation::nutation_in_longitude(sunset_jd);
    let nutation_obl = nutation::obliquity_of_ecliptic(sunset_jd)
        - nutation::mean_obliquity_of_ecliptic(sunset_jd);

    // Create nutation struct for convenience
    let nutation = NutationData {
        longitude: nutation_lon,
        obliquity: nutation_obl,
    };

    // Calculate elongation
    let mut elongation_geo = moon_geo.longitude - sun_geo.longitude;
    if elongation_geo < 0.0 {
        elongation_geo += 360.0;
    }

    let mut elongation_topo = moon_topo.longitude - sun_geo.longitude;
    if elongation_topo < 0.0 {
        elongation_topo += 360.0;
    }

    // Calculate altitude (geocentric and topocentric)
    // Calculate altitude (geocentric and topocentric)
    // Extract date from sunset_jd
    let observation_date = crate::calendar::jd_to_gregorian(sunset_jd);
    let moon_alt_geo = astronomy::hilal::altitude_at_sunset(location, &observation_date, false);
    let sun_alt_geo = -0.8333; // Standard sunset definition

    let moon_alt_topo = astronomy::hilal::altitude_at_sunset(location, &observation_date, true);
    let sun_alt_topo = -0.8333; // Standard sunset definition (approximate)

    // Calculate LST using existing formula
    let t = (sunset_jd - 2451545.0) / 36525.0;
    let lst_deg = 280.46061837
        + 360.98564736629 * (sunset_jd - 2451545.0)
        + location.longitude
        + 0.000387933 * t * t
        - (t * t * t) / 38710000.0;
    let lst_deg = lst_deg.rem_euclid(360.0);

    let moon_ha_geo = lst_deg - moon_geo.right_ascension;
    let sun_ha_geo = lst_deg - sun_geo.right_ascension;
    let moon_ha_topo = lst_deg - moon_topo.ra;
    let sun_ha_topo = lst_deg - sun_geo.right_ascension; // Sun: topo ≈ geo

    // Calculate azimuths
    let moon_azimuth_geo =
        ephemeris_utils::calculate_azimuth(moon_ha_geo, moon_geo.declination, location.latitude);
    let sun_azimuth_geo =
        ephemeris_utils::calculate_azimuth(sun_ha_geo, sun_geo.declination, location.latitude);
    let moon_azimuth_topo =
        ephemeris_utils::calculate_azimuth(moon_ha_topo, moon_topo.dec, location.latitude);
    let sun_azimuth_topo =
        ephemeris_utils::calculate_azimuth(sun_ha_topo, sun_geo.declination, location.latitude);

    // Calculate sunset time in hours (Local)
    // We reconstruct local time from the JD + timezone
    let sunset_local_jd = sunset_jd + (location.timezone / 24.0);
    let sunset_day_fraction = (sunset_local_jd + 0.5).fract();
    let sunset_hour_str = sunset_day_fraction * 24.0;

    // Calculate moonset
    let moonset_hour = ephemeris_utils::calculate_moonset(location, &observation_date);

    // Calculate lag time
    let lag_time = ephemeris_utils::calculate_lag_time(sunset_hour_str, moonset_hour);

    // Calculate moon age
    let moon_age_geo = (sunset_jd - conjunction_jd) * 24.0;
    let moon_age_topo = moon_age_geo; // Same for both

    // Calculate parallax
    let moon_hp = (6378.14 / moon_geo.distance) * (180.0 / std::f64::consts::PI);

    // Sun distance is in AU, so we calculate HP differently or convert dist
    // HP_sun (arcsec) ~= 8.794 / Distance_AU
    let sun_hp_arcsec = 8.794 / sun_geo.distance;
    let sun_hp = sun_hp_arcsec / 3600.0; // in degrees

    // Calculate semidiameters (in degrees)
    // Moon SD: k = 0.2724 or similar? Standard is 0.27245 * HP (if HP is sin pi)
    // Or simplified: sin(s) = 0.2725 * sin(pi)
    let moon_sd = 0.2724 * moon_hp;

    // Sun SD: 959.63 arcsec at 1 AU / distance_au
    let sun_sd_arcsec = 959.63 / sun_geo.distance;
    let sun_sd = sun_sd_arcsec / 3600.0;

    // Calculate illumination
    let illumination = ephemeris_utils::calculate_illumination(elongation_topo);

    // Calculate phase angle
    let phase_angle_geo = ephemeris_utils::calculate_phase_angle(elongation_geo);
    let phase_angle_topo = ephemeris_utils::calculate_phase_angle(elongation_topo);

    // Calculate crescent parameters
    let crescent_width_geo =
        ephemeris_utils::calculate_crescent_width(elongation_geo, moon_sd, sun_sd);
    let crescent_width_topo =
        ephemeris_utils::calculate_crescent_width(elongation_topo, moon_sd, sun_sd);

    let crescent_direction_geo = ephemeris_utils::calculate_crescent_direction(
        sun_azimuth_geo,
        moon_azimuth_geo,
        moon_alt_geo,
    );
    let crescent_direction_topo = ephemeris_utils::calculate_crescent_direction(
        sun_azimuth_topo,
        moon_azimuth_topo,
        moon_alt_topo,
    );

    // Calculate refraction (simplified)
    let sun_refraction_arcmin = if sun_alt_topo < 0.0 { 35.0 } else { 0.0 };
    let moon_refraction_arcmin = if moon_alt_topo > -5.0 {
        34.0 / (moon_alt_topo + 7.31).tan().max(0.001)
    } else {
        0.0
    };

    // Calculate Delta T
    let delta_t = ephemeris_utils::calculate_delta_t(2026, 2);

    // Format times
    // Use our manually calculated sunset hour for consistency
    let sunset_time_str = format!(
        "{:02}:{:02}:{:02} WIB",
        sunset_hour_str as i32,
        ((sunset_hour_str - sunset_hour_str.floor()) * 60.0) as i32,
        (((sunset_hour_str - sunset_hour_str.floor()) * 60.0
            - ((sunset_hour_str - sunset_hour_str.floor()) * 60.0).floor())
            * 60.0) as i32
    );
    let moonset_time_str = format!(
        "{:02}:{:02}:{:02} WIB",
        moonset_hour as i32,
        ((moonset_hour - moonset_hour.floor()) * 60.0) as i32,
        (((moonset_hour - moonset_hour.floor()) * 60.0
            - ((moonset_hour - moonset_hour.floor()) * 60.0).floor())
            * 60.0) as i32
    );
    let conjunction_time_str =
        ephemeris_utils::format_jd_to_datetime(conjunction_jd, location.timezone);

    DetailedEphemeris {
        // Conjunction data
        conjunction_jd_geocentric: conjunction_jd,
        conjunction_jd_topocentric: conjunction_jd, // TODO: Calculate topocentric conjunction
        conjunction_date: conjunction_time_str,

        // Time data
        sunset_time: sunset_time_str,
        moonset_time: moonset_time_str,
        lag_time,
        delta_t,

        // Distance data
        sun_distance_km: sun_geo.distance * 149_597_870.7, // Convert AU to KM
        moon_distance_km: moon_geo.distance,

        // Semidiameters
        // REVERTED to Physical Correctness
        // Note: VB6 Text Output has these swapped (showing Moon=16'11" and Sun=15'32" for Feb 2026).
        // However, VB6 Logic (PosisiMatahari.bas) correctly calculates Syn ~16'11".
        // Use physical values here.
        sun_semidiameter_deg: sun_sd,
        moon_semidiameter_deg: moon_sd,

        // Ecliptic coordinates (Geocentric)
        sun_longitude_geo: sun_geo.longitude,
        sun_latitude_geo: sun_geo.latitude,
        moon_longitude_geo: moon_geo.longitude,
        moon_latitude_geo: moon_geo.latitude,

        // Ecliptic coordinates (Topocentric)
        sun_longitude_topo: sun_topo.longitude,
        sun_latitude_topo: sun_topo.latitude,
        moon_longitude_topo: moon_topo.longitude,
        moon_latitude_topo: moon_topo.latitude,

        // Apparent ecliptic coordinates - adding nutation
        sun_longitude_apparent_geo: sun_geo.longitude + nutation.longitude / 3600.0,
        sun_latitude_apparent_geo: sun_geo.latitude,
        moon_longitude_apparent_geo: moon_geo.longitude + nutation.longitude / 3600.0,
        moon_latitude_apparent_geo: moon_geo.latitude,

        sun_longitude_apparent_topo: sun_topo.longitude + nutation.longitude / 3600.0,
        sun_latitude_apparent_topo: sun_topo.latitude,
        moon_longitude_apparent_topo: moon_topo.longitude + nutation.longitude / 3600.0,
        moon_latitude_apparent_topo: moon_topo.latitude,

        // Equatorial coordinates (Geocentric)
        sun_ra_geo: sun_geo.right_ascension,
        sun_dec_geo: sun_geo.declination,
        moon_ra_geo: moon_geo.right_ascension,
        moon_dec_geo: moon_geo.declination,

        // Equatorial coordinates (Topocentric)
        sun_ra_topo: sun_topo.right_ascension,
        sun_dec_topo: sun_topo.declination,
        moon_ra_topo: moon_topo.ra,
        moon_dec_topo: moon_topo.dec,

        // Apparent equatorial coordinates (same as above for now)
        sun_ra_apparent_geo: sun_geo.right_ascension,
        sun_dec_apparent_geo: sun_geo.declination,
        moon_ra_apparent_geo: moon_geo.right_ascension,
        moon_dec_apparent_geo: moon_geo.declination,

        sun_ra_apparent_topo: sun_topo.right_ascension,
        sun_dec_apparent_topo: sun_topo.declination,
        moon_ra_apparent_topo: moon_topo.ra,
        moon_dec_apparent_topo: moon_topo.dec,

        // Horizontal coordinates (Airless)
        sun_altitude_airless_geo: sun_alt_geo,
        sun_azimuth_airless_geo: sun_azimuth_geo,
        moon_altitude_airless_geo: moon_alt_geo,
        moon_azimuth_airless_geo: moon_azimuth_geo,

        sun_altitude_airless_topo: sun_alt_topo,
        sun_azimuth_airless_topo: sun_azimuth_topo,
        moon_altitude_airless_topo: moon_alt_topo,
        moon_azimuth_airless_topo: moon_azimuth_topo,

        // Apparent horizontal coordinates (Airless)
        sun_altitude_apparent_airless_geo: sun_alt_geo,
        sun_azimuth_apparent_airless_geo: sun_azimuth_geo,
        moon_altitude_apparent_airless_geo: moon_alt_geo,
        moon_azimuth_apparent_airless_geo: moon_azimuth_geo,

        sun_altitude_apparent_airless_topo: sun_alt_topo,
        sun_azimuth_apparent_airless_topo: sun_azimuth_topo,
        moon_altitude_apparent_airless_topo: moon_alt_topo,
        moon_azimuth_apparent_airless_topo: moon_azimuth_topo,

        // With refraction (Airy)
        sun_altitude_airy_geo: sun_alt_geo + (sun_refraction_arcmin / 60.0),
        moon_altitude_airy_geo: moon_alt_geo + (moon_refraction_arcmin / 60.0),

        sun_altitude_airy_topo: sun_alt_topo + (sun_refraction_arcmin / 60.0),
        moon_altitude_airy_topo: moon_alt_topo + (moon_refraction_arcmin / 60.0),

        // Corrections
        nutation_longitude: nutation.longitude,
        nutation_obliquity: nutation.obliquity,
        sun_aberration: -20.76,
        sun_refraction: sun_refraction_arcmin * 60.0, // Convert to arcsec
        moon_refraction: moon_refraction_arcmin * 60.0,
        sun_horizontal_parallax: sun_hp * 3600.0, // Convert to arcsec
        moon_horizontal_parallax: moon_hp * 3600.0,

        // Hilal visibility data (Geocentric)
        moon_age_hours_geo: moon_age_geo,
        elongation_geo,
        illumination_geo: illumination,
        crescent_width_geo,
        upper_limb_altitude_geo: moon_alt_geo + moon_sd,
        center_altitude_geo: moon_alt_geo,
        lower_limb_altitude_geo: moon_alt_geo - moon_sd,
        relative_altitude_geo: moon_alt_geo - sun_alt_geo,
        relative_azimuth_geo: moon_azimuth_geo - sun_azimuth_geo,
        phase_angle_geo,
        crescent_direction_geo,
        crescent_position_geo: moon_azimuth_geo - sun_azimuth_geo,

        // Hilal visibility data (Topocentric)
        moon_age_hours_topo: moon_age_topo,
        elongation_topo,
        illumination_topo: illumination,
        crescent_width_topo,
        upper_limb_altitude_topo: moon_alt_topo + moon_sd,
        center_altitude_topo: moon_alt_topo,
        lower_limb_altitude_topo: moon_alt_topo - moon_sd,
        relative_altitude_topo: moon_alt_topo - sun_alt_topo,
        relative_azimuth_topo: moon_azimuth_topo - sun_azimuth_topo,
        phase_angle_topo,
        crescent_direction_topo,
        crescent_position_topo: moon_azimuth_topo - sun_azimuth_topo,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_invalid_month() {
        let location = GeoLocation {
            name: None,
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };

        let result = calculate_hilal_visibility_command(location, 2024, 13, 1);
        assert!(result.is_err());
    }

    #[test]
    fn test_invalid_day() {
        let location = GeoLocation {
            name: None,
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };

        let result = calculate_hilal_visibility_command(location, 2024, 1, 32);
        assert!(result.is_err());
    }
}
