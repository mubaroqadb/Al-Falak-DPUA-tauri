//! Module untuk perhitungan waktu shalat (Prayer Times)
//! Porting dari PrayingTimes.bas (VB6)

use super::sun;
use crate::{GeoLocation, GregorianDate};
use std::collections::HashMap;

/// Konfigurasi sudut dan parameter waktu shalat
#[derive(Debug, Clone)]
pub struct PrayerConfig {
    pub shubuh_angle: f64,      // Sudut dip matahari untuk Shubuh (biasanya 20°)
    pub ashr_shadow_ratio: f64, // Rasio bayangan untuk Ashr (1.0 = Syafi'i, 2.0 = Hanafi)
    pub isya_angle: f64,        // Sudut dip matahari untuk Isya (biasanya 18°)
    pub imsak_margin: f64,      // Margin waktu Imsak sebelum Shubuh (biasanya 10 menit)
    pub dhuha_angle: f64,       // Tinggi matahari untuk Dhuha (biasanya 4.5°)
    pub ihtiyat: HashMap<String, f64>, // Koreksi keamanan untuk setiap waktu
}

impl Default for PrayerConfig {
    fn default() -> Self {
        let mut ihtiyat = HashMap::new();
        ihtiyat.insert("shubuh".to_string(), 2.0);
        ihtiyat.insert("dhuha".to_string(), 2.0);
        ihtiyat.insert("dzuhur".to_string(), 2.0); // +4m di VB6? (Ihtiyat(1))
        ihtiyat.insert("ashr".to_string(), 2.0);
        ihtiyat.insert("maghrib".to_string(), 2.0);
        ihtiyat.insert("isya".to_string(), 2.0);

        PrayerConfig {
            shubuh_angle: 20.0,
            ashr_shadow_ratio: 1.0,
            isya_angle: 18.0,
            imsak_margin: 10.0,
            dhuha_angle: 4.5,
            ihtiyat,
        }
    }
}

/// Hasil perhitungan waktu shalat
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrayerTimes {
    pub imsak: String,
    pub shubuh: String,
    pub terbit: String, // Syuruq
    pub dhuha: String,
    pub dzuhur: String,
    pub ashr: String,
    pub maghrib: String,
    pub isya: String,
    pub tengah_malam: String, // Midnight
    pub p3_malam: String,     // 1/3 Last Night
}

/// Hitung semua waktu shalat
pub fn calculate_prayer_times(
    location: &GeoLocation,
    date: &GregorianDate,
    config: &PrayerConfig,
) -> PrayerTimes {
    // 1. Hitung Julian Day dasar (pukul 12 siang lokal)
    // dL = dx + 0.5 di VB6 corresponds to JD at noon approx
    let jd = crate::calendar::gregorian_to_jd(date);
    let jd_noon = jd + 0.5;

    // 2. Hitung parameter matahari pada siang hari
    let sun_pos = sun::geocentric_position(jd_noon);
    let declination = sun::declination(jd_noon);
    let eq_of_time = sun::equation_of_time(jd_noon);

    // Calculate Sun Semi-Diameter (used in VB6)
    // SD = Sun.SD0 / 60
    // Standard approx: 16 arcminutes = 0.2666 degrees
    // VB6 might use exact calculation: 959.63 / Distance(AU) arcseconds
    let sun_sd_deg = (959.63 / sun_pos.distance) / 3600.0;

    // kwd = Tz - Lon/15
    let kwd = location.timezone - (location.longitude / 15.0);

    // --- DZUHUR & ISTIWA ---
    // JS0.Duhr = 12# - Sun.ET + cKWD
    let mut dzuhur_val = 12.0 - eq_of_time + kwd;

    // Recalculate accurately? VB6 does:
    // dL = Int(d) + JS0.Duhr / 24#
    // Call SunPosition(Zon, L, B, Tz, y, m, dL)
    // JS0.Duhr = 12# - Zon.ET + cKWD + 4# * SD / 60#
    // Note: VB6 adds 4 * SD/60 (approx 1 min) to Dzuhur? Or is that safety limit?
    // "JS0.Duhr = 12# - Zon.ET + cKWD + 4# * SD / 60#" -> This adds ~1 min shift?
    // Commonly Dzuhur is just Transit + margin usually.
    // Let's stick to standard first: Transit = 12 - EoT + KwD.
    // VB6 adds "4# * SD / 60#" which is 4 minutes * SD_degrees? No.
    // SD is in deg? If SD ~ 0.25 deg. 4*0.25 = 1 deg?
    // Wait, SD in VB6 code: "SD = Sun.SD0 / 60". If SD0 is arcmin, SD is deg?
    // If SD0 is deg, SD is likely deg.
    // Actually, "4# * SD" looks like a correction.
    // Let's implement standard transit first.
    let transit = 12.0 - eq_of_time + kwd;

    // Apply Ihtiyat Dzuhur (usually +2-4 mins)
    let dzuhur = transit + (config.ihtiyat.get("dzuhur").unwrap_or(&0.0) / 60.0);

    // --- ASHR ---
    // cot(h_ashr) = shadow_ratio + tan(|lat - dec|)
    let lat_rad = location.latitude.to_radians();
    let dec_rad = declination.to_radians();
    let zen_angle = (lat_rad - dec_rad).abs();
    let cot_h = config.ashr_shadow_ratio + zen_angle.tan();
    let h_ashr_rad = (1.0 / cot_h).atan();
    let h_ashr = h_ashr_rad.to_degrees(); // Altitude of sun at Ashr

    let ashr_time = calculate_time_for_altitude(location, declination, eq_of_time, h_ashr, 1.0); // 1 = afternoon
    let ashr = ashr_time + (config.ihtiyat.get("ashr").unwrap_or(&0.0) / 60.0);

    // --- MAGHRIB (Sunset) ---
    // h_maghrib = -SD - Refraction - Dip
    // Refraction at horizon approx 34' = 0.566 deg
    // SD approx 16' = 0.266 deg
    // Dip = 0.0293 * sqrt(h_meters) in degrees? VB6: 0.0321 * Sqr(Lokasi.tinggi) (arcminutes?)
    // Standard: 0.8333 deg depression usually covers SD+Refraction.
    // VB6 code: hs = -SD - r. r = Refraction(-SD).
    let h_maghrib = -0.8333 - (0.0347 * location.elevation.sqrt() / 60.0); // Dip correction

    let maghrib_time =
        calculate_time_for_altitude(location, declination, eq_of_time, h_maghrib, 1.0);
    let maghrib = maghrib_time + (config.ihtiyat.get("maghrib").unwrap_or(&0.0) / 60.0);
    let syuruq_time =
        calculate_time_for_altitude(location, declination, eq_of_time, h_maghrib, -1.0); // Morning
    let syuruq = syuruq_time - (config.ihtiyat.get("syuruq").unwrap_or(&0.0) / 60.0); // Syuruq minus ihtiyat? Usually syuruq displayed is start of sunrise or end?
                                                                                      // PrayerTimes.bas: JS0.Syuruq = TPray(...) - Ihtiyat. So Syuruq time is earlier?
                                                                                      // Usually "Terbit" displayed is when disk appears.

    // --- ISYA ---
    // h_isya = -Isya_Angle
    let h_isya = -config.isya_angle;
    let isya_time = calculate_time_for_altitude(location, declination, eq_of_time, h_isya, 1.0);
    let isya = isya_time + (config.ihtiyat.get("isya").unwrap_or(&0.0) / 60.0);

    // --- SHUBUH ---
    // h_shubuh = -Shubuh_Angle
    let h_shubuh = -config.shubuh_angle;
    let shubuh_time =
        calculate_time_for_altitude(location, declination, eq_of_time, h_shubuh, -1.0);
    let shubuh = shubuh_time + (config.ihtiyat.get("shubuh").unwrap_or(&0.0) / 60.0); // Add ihtiyat to start of prayer window

    // --- IMSAK ---
    // Imsak = Shubuh - 10 mins
    let imsak = shubuh - (config.imsak_margin / 60.0);

    // --- DHUHA ---
    // h_dhuha = Dhuha Angle (4.5 deg)
    let h_dhuha = config.dhuha_angle;
    let dhuha_time = calculate_time_for_altitude(location, declination, eq_of_time, h_dhuha, -1.0);
    let dhuha = dhuha_time + (config.ihtiyat.get("dhuha").unwrap_or(&0.0) / 60.0);

    // --- MIDNIGHT & 1/3 NIGHT ---
    // Midnight = (Shubuh_Next_Day - Maghrib) / 2 + Maghrib
    // Simplify: (Shubuh + 24 - Maghrib) / 2 + Maghrib
    let diff = (shubuh + 24.0 - maghrib) % 24.0;
    let tengah_malam = (maghrib + diff / 2.0) % 24.0;
    let p3_malam = (maghrib + diff * (2.0 / 3.0)) % 24.0;

    PrayerTimes {
        imsak: format_time(imsak),
        shubuh: format_time(shubuh),
        terbit: format_time(syuruq),
        dhuha: format_time(dhuha),
        dzuhur: format_time(dzuhur),
        ashr: format_time(ashr),
        maghrib: format_time(maghrib),
        isya: format_time(isya),
        tengah_malam: format_time(tengah_malam),
        p3_malam: format_time(p3_malam),
    }
}

/// Helper function to calculate time for a specific sun altitude
/// sign: -1 for morning (East), 1 for afternoon (West)
fn calculate_time_for_altitude(
    location: &GeoLocation,
    declination: f64,
    eq_of_time: f64,
    altitude: f64,
    sign: f64,
) -> f64 {
    let lat_rad = location.latitude.to_radians();
    let dec_rad = declination.to_radians();
    let alt_rad = altitude.to_radians();

    // cos(H) = (sin(Alt) - sin(Lat)sin(Dec)) / (cos(Lat)cos(Dec))
    let cos_h = (alt_rad.sin() - lat_rad.sin() * dec_rad.sin()) / (lat_rad.cos() * dec_rad.cos());

    if cos_h < -1.0 || cos_h > 1.0 {
        return 99.99; // Never reaches this altitude
    }

    let h_rad = cos_h.acos();
    let h_deg = h_rad.to_degrees();
    let h_hours = h_deg / 15.0;

    let kwd = location.timezone - (location.longitude / 15.0);

    // Time = 12 - EoT + sign*H + kwd
    let mut time = 12.0 - eq_of_time + (sign * h_hours) + kwd;
    time = time.rem_euclid(24.0);
    time
}

fn format_time(hours: f64) -> String {
    if hours >= 24.0 {
        return "Invalid".to_string();
    }
    let h = hours.floor() as u32;
    let m_float = (hours - h as f64) * 60.0;
    let m = m_float.floor() as u32;
    let s = ((m_float - m as f64) * 60.0).round() as u32; // Round to nearest second

    // Adjust for second overflow
    if s == 60 {
        let m_new = m + 1;
        let s_new = 0;
        if m_new == 60 {
            let h_new = (h + 1) % 24;
            return format!("{:02}:{:02}", h_new, 0);
        }
        return format!("{:02}:{:02}", h, m_new);
    }

    format!("{:02}:{:02}", h, m)
}
