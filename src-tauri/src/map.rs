//! Module untuk logika visualisasi peta

use serde::{Deserialize, Serialize};

/// Struktur untuk zona visibilitas hilal
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VisibilityZone {
    pub latitude: f64,
    pub longitude_start: f64,
    pub longitude_end: f64,
    pub step: f64,
    pub is_visible: bool,
    pub q_value: f64,
    pub visibility_level: i32, // 0: Impossible, 1: Difficult, 2: Aid Required, 3: Visible, 4: Easy
    pub criteria: String,
}

/// Struktur untuk data hilal mendalam (digunakan oleh Detail view)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetailedHilalData {
    pub conjunction_jd: f64,
    pub conjunction_date: String,
    pub sunset_time: f64,
    pub moonset_time: f64,
    pub moon_age_hours: f64,
    pub moon_altitude: f64,
    pub moon_azimuth: f64,
    pub sun_altitude: f64,
    pub sun_azimuth: f64,
    pub elongation: f64,
    pub moon_distance_km: f64,
    pub sun_distance_km: f64,
    pub moon_semidiameter: f64,
    pub sun_semidiameter: f64,
    pub parallax: f64,
    pub refraction: f64,
    pub arcv: f64,
    pub crescent_width: f64,
    pub day_name: String,
}

/// Struktur untuk kurva jadwal shalat di peta
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrayerTimeCurve {
    pub name: String,
    pub points: Vec<(f64, f64)>, // (lat, lon) pairs
}

/// Fungsi untuk menghitung zona visibilitas (internal) - High Fidelity Version
pub fn calculate_visibility_zones_internal(
    observation_jd: f64,
    criteria: &str,
    step_degrees: f64,
) -> Vec<VisibilityZone> {
    let mut zones = Vec::new();

    // 1. Cari Konjungsi terdekat (sebelum tanggal observasi)
    // Map visibilitas selalu dihitung relatif terhadap maghrib pertama setelah ijtima'
    let obs_date = crate::calendar::jd_to_gregorian(observation_jd);
    let conjunction = crate::astronomy::conjunction::find_conjunction(&obs_date);
    let conj_jd = conjunction.jd_utc;

    // Grid untuk latitude dan longitude
    // Resolusi tinggi untuk kurva yang mulus
    let lat_start = -60.0;
    let lat_end = 60.0;
    let lon_start = -180.0;
    let lon_end = 180.0;

    let step = step_degrees.max(1.0).min(5.0);

    let mut lat = lat_start;
    while lat < lat_end {
        let mut lon = lon_start;
        while lon < lon_end {
            // Logika "First Sunset after Conjunction":
            // Kita cari sunset di lokasi (lat, lon) pada hari H (obs_date)
            // Jika sunset itu terjadi sebelum konjungsi, maka kita cari sunset hari berikutnya.

            let mut eval_date = obs_date.clone();
            let location = crate::GeoLocation {
                name: None,
                latitude: lat,
                longitude: lon,
                elevation: 0.0,
                timezone: 0.0, // UT reference
            };

            // Hitung sunset di lokasi ini (UT)
            let mut sunset_hour = crate::astronomy::calculate_sunset(&location, &eval_date);

            // Perlakuan jika tidak ada sunset (kutub)
            if sunset_hour > 900.0 {
                lon += step;
                continue;
            }

            let sunset_jd = crate::calendar::gregorian_to_jd(&eval_date) + (sunset_hour / 24.0);

            // STRICT DATE adherence: Do NOT auto-advance the date.
            // If the user selects a date before conjunction, the map should simply show "Impossible" (Red).
            // This ensures consistency with the text result.

            // Hitung visibilitas mendalam menggunakan Odeh pada waktu sunset tersebut
            let odeh = crate::criteria::odeh::evaluate_odeh(&location, &eval_date);

            // Standard AHC Levels (A-E)
            let mut level = if odeh.moon_altitude <= 0.0 {
                0 // E: Impossible (Below horizon)
            } else if odeh.q_value > 5.65 {
                4 // A: Easy
            } else if odeh.q_value > 0.216 {
                3 // B: Visible
            } else if odeh.q_value > -0.014 {
                2 // C: Aid
            } else if odeh.q_value > -0.5 {
                1 // D: Difficult
            } else {
                0 // E: Impossible
            };

            let is_visible = check_visibility_at_location(&location, &eval_date, criteria);

            // STRICT CONSISTENCY: If using binary criteria (like MABIMS), override the gradient level.
            // This ensures map shows Red/Green matching the boolean result.
            if criteria != "ODEH" && criteria != "YALLOP" && criteria != "Turkey" {
                if is_visible {
                    level = 3; // Force Visible Color
                } else {
                    level = 0; // Force Invisible Color
                }
            }

            zones.push(VisibilityZone {
                latitude: lat,
                longitude_start: lon,
                longitude_end: lon + step,
                step,
                is_visible,
                q_value: odeh.q_value,
                visibility_level: level,
                criteria: criteria.to_string(),
            });

            lon += step;
        }
        lat += step;
    }

    zones
}

/// Check visibilitas di lokasi tertentu menggunakan algoritma akurat
fn check_visibility_at_location(
    location: &crate::GeoLocation,
    date: &crate::GregorianDate,
    criteria: &str,
) -> bool {
    // Gunakan perhitungan toposentris yang akurat (sesuai VB6/AHC)
    // Altitude
    let altitude = crate::astronomy::hilal::altitude_at_sunset(location, date, true);

    // Jika altitude sudah pasti di bawah limit minimum kriteria terendah (-10), skip perhitungan berat lainnya
    if altitude < -10.0 {
        return false;
    }

    // Elongation
    let elongation = crate::astronomy::hilal::elongation_at_sunset(location, date, true);

    // Moon Age
    let moon_age = crate::astronomy::hilal::moon_age_at_sunset(location, date);

    // Evaluasi berdasarkan kriteria
    // TODO: Update dengan kriteria yang lebih lengkap/akurat sesuai setting
    match criteria {
        "MABIMS" => {
            // MABIMS Baru (Neo-MABIMS 2016): Alt >= 3.0 && Elong >= 6.4
            // MABIMS Lama (2-3-8): Alt >= 2.0 && Elong >= 3.0 && Age >= 8.0

            // Implementasi Default: Neo-MABIMS (karena lebih standar sekarang)
            // Namun code sebelumnya mengimplikasikan MABIMS Lama.
            // Mari kita support keduanya atau gunakan yang lebih umum.
            // Untuk keamanan, kita gunakan Neo-MABIMS sebagai "MABIMS" default jika tidak dispesifikasikan

            // Cek jika user mengharapkan old criteria dari UI?
            // CriteriaPanel.js menyebutkan "Alt >= 3, Age >= 8" -> Ini campuran aneh.
            // Mari gunakan Neo-MABIMS yang standar: 3 derajat & 6.4 derajat elongasi
            altitude >= 3.0 && elongation >= 6.4
        }
        "ODEH" => {
            // Odeh Criteria (Visual)
            // Kompleks, tapi simplifikasinya:
            // V = ARCV - ( -0.1018*width^3 + 0.7319*width^2 - 6.3226*width + 7.1651 )
            // Jika V >= 5.65 -> Visible

            // Gunakan simplifikasi parameter input saja untuk peta cepat:
            // Alt >= 2.0 && Elong >= 8.0 (sesuai kode sebelumnya)
            altitude >= 5.0 && elongation >= 8.0 // Kode sebelumnya 5 & 8
        }
        "LFNU" => {
            // LFNU (Lembaga Falakiyah NU)
            // Imkanur Rukyat NU: Alt >= 3 derajat & Elong >= 6.4 derajat (Sama dengan Neo-MABIMS)
            // Atau Qat'iyur Rukyat: Alt >= 4 derajat
            altitude >= 3.0 && elongation >= 6.4
        }
        "TURKEY" => altitude >= 5.0 && elongation >= 8.0,
        "WujudulHilal" => {
            // Muhammadiyah: Disk piringan atas > 0 setelah matahari terbenam
            // Moonset > Sunset
            // Secara matematis: Altitude (geocentric) > 0 ATAU Altitude (topocentric) > 0?
            // Biasanya Wujudul Hilal menggunakan Geocentric center > 0
            // Tapi untuk peta visibilitas umum, Topo > 0 cukup mendekati logika "wujud"
            altitude > 0.0
        }
        _ => altitude >= 2.0 && elongation >= 3.0, // Fallback conservative
    }
}

/// Fungsi untuk menghitung kurva jadwal shalat
pub fn calculate_prayer_curves(_date_jd: f64, _timezone: f64) -> Vec<PrayerTimeCurve> {
    // TODO: Implementasi perhitungan kurva shalat
    vec![]
}
