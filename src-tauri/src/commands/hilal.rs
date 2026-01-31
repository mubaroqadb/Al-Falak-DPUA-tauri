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
    pub observation_date_hijri: String,
    pub day_name: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct HilalCalculationResult {
    pub location: GeoLocation,
    pub observation_date: GregorianDate,
    pub observation_date_hijri: String,
    pub day_name: String,
    pub conjunction_jd: f64,
    pub criteria_results: HashMap<String, HilalCriteriaResult>,
    pub ephemeris: DetailedEphemeris,
    pub timestamp: String,
}

/// Calculate hilal visibility untuk semua kriteria (dengan input Gregorian)
#[tauri::command]
pub fn calculate_hilal_visibility_command(
    location: GeoLocation,
    year: i32,
    month: u8,
    day: u8,
) -> Result<HilalCalculationResult, String> {
    calculate_hilal_visibility_internal(location, year, month, day, false)
}

/// Calculate hilal visibility dengan input tanggal Hijriah
/// Input: tahun, bulan Hijriah, dan hari (biasanya 29 atau 30 untuk akhir bulan)
#[tauri::command]
pub fn calculate_hilal_visibility_hijri_command(
    location: GeoLocation,
    hijri_year: i32,
    hijri_month: u8,
    hijri_day: u8,
) -> Result<HilalCalculationResult, String> {
    // Konversi tanggal Hijriah ke Gregorian
    let hijri_date = crate::calendar::HijriDate::new(hijri_year, hijri_month, hijri_day);
    let gregorian_date = crate::calendar::hijri_to_gregorian(&hijri_date);

    println!(
        "📅 Input Hijri: {}-{}-{} -> Gregorian: {}-{}-{}",
        hijri_year,
        hijri_month,
        hijri_day,
        gregorian_date.year,
        gregorian_date.month,
        gregorian_date.day
    );

    calculate_hilal_visibility_internal(
        location,
        gregorian_date.year,
        gregorian_date.month,
        gregorian_date.day as u8,
        true, // Flag untuk menandai input dari Hijriah
    )
}

/// Internal function untuk menghitung hilal visibility
fn calculate_hilal_visibility_internal(
    location: GeoLocation,
    year: i32,
    month: u8,
    day: u8,
    is_hijri_input: bool,
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

    // Cari konjungsi terdekat dengan tanggal observasi
    // Ini lebih akurat daripada find_conjunction_for_month untuk hilal di akhir bulan
    let conjunction = crate::astronomy::conjunction::find_conjunction(&observation_date);

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
    let ephemeris =
        calculate_detailed_ephemeris(&location, conjunction.jd_utc, sunset_jd, &observation_date);

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

    // Calculate JD for the observation date to get the day name
    let jd_obs = crate::calendar::gregorian_to_jd(&observation_date);

    let result = HilalCalculationResult {
        location: location.clone(),
        observation_date_hijri: crate::calendar::gregorian_to_hijri(&observation_date)
            .to_formatted_string(),
        observation_date,
        day_name: crate::calendar::javanese::get_full_day_name(jd_obs),
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
    observation_date: &GregorianDate,
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

    // Get topocentric data for Sun (including solar parallax)
    let (sun_ra_topo, sun_dec_topo) =
        astronomy::topocentric::sun_topocentric_ra_dec(location, sunset_jd);

    // We don't have a full struct for Sun topo in ecliptic, so we approximate or use RA/Dec
    let sun_topo = SunTopoData {
        longitude: sun_geo.longitude, // Approximation for longitude
        latitude: sun_geo.latitude,
        right_ascension: sun_ra_topo,
        declination: sun_dec_topo,
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

    // Calculate elongation using library function (Reuse logic)
    let elongation_geo = astronomy::hilal::elongation_at_sunset(location, &observation_date, false);
    let elongation_topo = astronomy::hilal::elongation_at_sunset(location, &observation_date, true);

    // Calculate LST using existing formula
    let t = (sunset_jd - 2451545.0) / 36525.0;
    let lst_deg = 280.46061837
        + 360.98564736629 * (sunset_jd - 2451545.0)
        + location.longitude
        + 0.000387933 * t * t
        - (t * t * t) / 38710000.0;
    let lst_deg = lst_deg.rem_euclid(360.0);

    // Calculate altitude (geocentric and topocentric) - AIRLESS bases
    // We calculate these directly from equatorial coordinates to ensure we have airless values
    let lat_rad = location.latitude.to_radians();

    // Moon Geocentric Airless
    let moon_ha_geo_rad = (lst_deg - moon_geo.right_ascension).to_radians();
    let moon_dec_geo_rad = moon_geo.declination.to_radians();
    let moon_alt_geo_airless = (lat_rad.sin() * moon_dec_geo_rad.sin()
        + lat_rad.cos() * moon_dec_geo_rad.cos() * moon_ha_geo_rad.cos())
    .asin()
    .to_degrees();

    // Sun Geocentric Airless
    let sun_ha_geo_rad = (lst_deg - sun_geo.right_ascension).to_radians();
    let sun_dec_geo_rad = sun_geo.declination.to_radians();
    let sun_alt_geo_airless = (lat_rad.sin() * sun_dec_geo_rad.sin()
        + lat_rad.cos() * sun_dec_geo_rad.cos() * sun_ha_geo_rad.cos())
    .asin()
    .to_degrees();

    // Moon Topocentric Airless
    let moon_ha_topo_rad = (lst_deg - moon_topo.ra).to_radians();
    let moon_dec_topo_rad = moon_topo.dec.to_radians();
    let moon_alt_topo_airless = (lat_rad.sin() * moon_dec_topo_rad.sin()
        + lat_rad.cos() * moon_dec_topo_rad.cos() * moon_ha_topo_rad.cos())
    .asin()
    .to_degrees();

    // Sun Topocentric Airless
    let sun_ha_topo_rad = (lst_deg - sun_topo.right_ascension).to_radians();
    let sun_dec_topo_rad = sun_topo.declination.to_radians();
    let sun_alt_topo_airless = (lat_rad.sin() * sun_dec_topo_rad.sin()
        + lat_rad.cos() * sun_dec_topo_rad.cos() * sun_ha_topo_rad.cos())
    .asin()
    .to_degrees();

    // --- START LITERAL VB6 PORT (PosisiBulan.bas / Corrections.bas) ---
    // This replicates the logic in 'Public Sub MoonPosition' and 'KoreksiRefraksi'

    // 1. Refraction: Moon.Ref = RefractionApparentAltitude(Moon.h0, 1010#, 10#)
    let calculate_refraction_vb6 = |h_airless: f64| -> f64 {
        if h_airless <= -0.27 {
            return 0.0;
        } // VB6 check: If h0 > -0.27
        let r = 1.0 / (h_airless + 7.31 / (h_airless + 4.4)).to_radians().tan() + 0.0013515;
        let dr1 = -0.06 * ((14.7 * r / 60.0) + 13.0).to_radians().sin();
        let dr2 = 1.0; // P=1010, T=10 makes (P/1010)*(283/(273+T)) = 1.0
        (r + dr1 / 60.0) * dr2 // returns arcminutes
    };

    let moon_refraction_arcmin = calculate_refraction_vb6(moon_alt_geo_airless);
    let sun_refraction_arcmin = calculate_refraction_vb6(sun_alt_geo_airless);

    // 2. Parallax: Moon.Par = rad2deg(Asin(6378.14 / Moon.Dis))
    let moon_hp_deg = (6378.14 / moon_geo.distance).asin().to_degrees();
    let sun_hp_deg = 8.794 / 3600.0 / sun_geo.distance; // HP = 8.794" / Distance(AU)

    // 3. Topocentric Altitude (Apparent): Moon.h1 = Moon.h0 + Ref - Par
    // In VB6, h0 is Geocentric Airless, Ref is Moon.Ref/60, Par is Horizontal Parallax
    let moon_alt_airy_topo = moon_alt_geo_airless + (moon_refraction_arcmin / 60.0) - moon_hp_deg;
    let sun_alt_airy_topo = sun_alt_geo_airless + (sun_refraction_arcmin / 60.0) - sun_hp_deg;

    // 4. Semidiameter: Moon.SD0 = (358473400# / Moon.Dis) / 60#
    let moon_sd_deg = (358473400.0 / moon_geo.distance) / 3600.0; // Div 60 then 60 for degrees
    let sun_sd_deg = (959.63 / sun_geo.distance) / 3600.0; // Div 3600 for degrees

    // --- END LITERAL VB6 PORT ---

    // Calculate azimuths (Rigorous)
    let moon_azimuth_geo = ephemeris_utils::calculate_azimuth(
        lst_deg - moon_geo.right_ascension,
        moon_geo.declination,
        location.latitude,
    );
    let sun_azimuth_geo = ephemeris_utils::calculate_azimuth(
        lst_deg - sun_geo.right_ascension,
        sun_geo.declination,
        location.latitude,
    );

    // Calculate sunset time in hours (Local)
    let sunset_local_jd = sunset_jd + (location.timezone / 24.0);
    let sunset_day_fraction = (sunset_local_jd + 0.5).fract();
    let sunset_hour_str = sunset_day_fraction * 24.0;

    // Calculate moonset and lag
    let moonset_hour = ephemeris_utils::calculate_moonset(location, &observation_date);
    let lag_time = ephemeris_utils::calculate_lag_time(sunset_hour_str, moonset_hour);

    // Calculate moon age (Geocentric)
    let moon_age_geo = (sunset_jd - conjunction_jd) * 24.0;

    // Calculate illumination and phase
    let illumination = ephemeris_utils::calculate_illumination(elongation_topo);
    let phase_angle_geo = ephemeris_utils::calculate_phase_angle(elongation_geo);
    let phase_angle_topo = ephemeris_utils::calculate_phase_angle(elongation_topo);

    // Calculate crescent parameters (Topocentric)
    let crescent_width_topo =
        ephemeris_utils::calculate_crescent_width(elongation_topo, moon_sd_deg, sun_sd_deg);

    let crescent_direction_topo = ephemeris_utils::calculate_crescent_direction(
        sun_ra_topo,
        sun_dec_topo,
        moon_topo.ra,
        moon_topo.dec,
    );

    // Calculate Delta T
    let delta_t =
        ephemeris_utils::calculate_delta_t(observation_date.year, observation_date.month as u8);

    // Calculate Topocentric Conjunction
    let conjunction_topo =
        astronomy::conjunction::find_topocentric_conjunction(observation_date, location);

    // Format times using dynamic timezone labels
    let tz_label = ephemeris_utils::format_timezone_label(location.timezone);
    let sunset_time_str = format!(
        "{:02}:{:02}:{:02} {}",
        sunset_hour_str as i32,
        ((sunset_hour_str - sunset_hour_str.floor()) * 60.0) as i32,
        (((sunset_hour_str - sunset_hour_str.floor()) * 60.0
            - ((sunset_hour_str - sunset_hour_str.floor()) * 60.0).floor())
            * 60.0) as i32,
        tz_label
    );
    let moonset_time_str = format!(
        "{:02}:{:02}:{:02} {}",
        moonset_hour as i32,
        ((moonset_hour - moonset_hour.floor()) * 60.0) as i32,
        (((moonset_hour - moonset_hour.floor()) * 60.0
            - ((moonset_hour - moonset_hour.floor()) * 60.0).floor())
            * 60.0) as i32,
        tz_label
    );
    // Debug: Print conjunction JD to verify it's valid
    println!("DEBUG: conjunction_jd = {}", conjunction_jd);
    println!(
        "DEBUG: conjunction_topo.jd_utc = {}",
        conjunction_topo.jd_utc
    );

    let conjunction_time_str =
        ephemeris_utils::format_jd_to_datetime(conjunction_jd, location.timezone);

    DetailedEphemeris {
        // Conjunction data
        conjunction_jd_geocentric: conjunction_jd,
        conjunction_jd_topocentric: conjunction_topo.jd_utc,
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
        sun_semidiameter_deg: sun_sd_deg,
        moon_semidiameter_deg: moon_sd_deg,

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

        // Apparent equatorial coordinates (including nutation and aberration)
        sun_ra_apparent_geo: sun_geo.right_ascension + (nutation.longitude / 3600.0),
        sun_dec_apparent_geo: sun_geo.declination,
        moon_ra_apparent_geo: moon_geo.right_ascension + (nutation.longitude / 3600.0),
        moon_dec_apparent_geo: moon_geo.declination,

        sun_ra_apparent_topo: sun_ra_topo + (nutation.longitude / 3600.0),
        sun_dec_apparent_topo: sun_dec_topo,
        moon_ra_apparent_topo: moon_topo.ra + (nutation.longitude / 3600.0),
        moon_dec_apparent_topo: moon_topo.dec,

        // Horizontal coordinates (Airless)
        sun_altitude_airless_geo: sun_alt_geo_airless,
        sun_azimuth_airless_geo: sun_azimuth_geo,
        moon_altitude_airless_geo: moon_alt_geo_airless,
        moon_azimuth_airless_geo: moon_azimuth_geo,

        sun_altitude_airless_topo: sun_alt_geo_airless - sun_hp_deg, // Simplified Topo Airless
        sun_azimuth_airless_topo: sun_azimuth_geo,
        moon_altitude_airless_topo: moon_alt_geo_airless - moon_hp_deg, // Simplified Topo Airless
        moon_azimuth_airless_topo: moon_azimuth_geo,

        // Apparent horizontal coordinates (Airless)
        sun_altitude_apparent_airless_geo: sun_alt_geo_airless,
        sun_azimuth_apparent_airless_geo: sun_azimuth_geo,
        moon_altitude_apparent_airless_geo: moon_alt_geo_airless,
        moon_azimuth_apparent_airless_geo: moon_azimuth_geo,

        sun_altitude_apparent_airless_topo: sun_alt_geo_airless - sun_hp_deg,
        sun_azimuth_apparent_airless_topo: sun_azimuth_geo,
        moon_altitude_apparent_airless_topo: moon_alt_geo_airless - moon_hp_deg,
        moon_azimuth_apparent_airless_topo: moon_azimuth_geo,

        // With refraction (Airy)
        sun_altitude_airy_geo: sun_alt_geo_airless + (sun_refraction_arcmin / 60.0),
        moon_altitude_airy_geo: moon_alt_geo_airless + (moon_refraction_arcmin / 60.0),

        sun_altitude_airy_topo: sun_alt_airy_topo,
        moon_altitude_airy_topo: moon_alt_airy_topo,

        // Corrections
        nutation_longitude: nutation.longitude,
        nutation_obliquity: nutation.obliquity,
        sun_aberration: -20.76,
        sun_refraction: sun_refraction_arcmin / 60.0,
        moon_refraction: moon_refraction_arcmin / 60.0,
        sun_horizontal_parallax: sun_hp_deg,
        moon_horizontal_parallax: moon_hp_deg,

        // Hilal visibility data (Geocentric)
        moon_age_hours_geo: moon_age_geo,
        elongation_geo,
        illumination_geo: illumination,
        crescent_width_geo: (crescent_width_topo * 1.0), // Geocentric crescent width doesn't exist in same way
        upper_limb_altitude_geo: moon_alt_geo_airless + moon_sd_deg,
        center_altitude_geo: moon_alt_geo_airless,
        lower_limb_altitude_geo: moon_alt_geo_airless - moon_sd_deg,
        relative_altitude_geo: moon_alt_geo_airless - sun_alt_geo_airless,
        relative_azimuth_geo: moon_azimuth_geo - sun_azimuth_geo,
        phase_angle_geo,
        crescent_direction_geo: crescent_direction_topo,
        crescent_position_geo: moon_azimuth_geo - sun_azimuth_geo,

        // Hilal visibility data (Topocentric)
        moon_age_hours_topo: moon_age_geo,
        elongation_topo,
        illumination_topo: illumination,
        crescent_width_topo,
        upper_limb_altitude_topo: moon_alt_airy_topo + moon_sd_deg,
        center_altitude_topo: moon_alt_airy_topo,
        lower_limb_altitude_topo: moon_alt_airy_topo - moon_sd_deg,
        relative_altitude_topo: moon_alt_airy_topo - sun_alt_airy_topo,
        relative_azimuth_topo: moon_azimuth_geo - sun_azimuth_geo, // Using Geo Azimuth per VB6 MoonPosition (Moon.aA1 = Moon.aA0)
        phase_angle_topo,
        crescent_direction_topo,
        crescent_position_topo: moon_azimuth_geo - sun_azimuth_geo,
        observation_date_hijri: crate::calendar::gregorian_to_hijri(observation_date)
            .to_formatted_string(),
        day_name: crate::calendar::javanese::get_full_day_name(crate::calendar::gregorian_to_jd(
            observation_date,
        )),
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
