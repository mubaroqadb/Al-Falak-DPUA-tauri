// Module untuk kriteria visibilitas MABIMS

use crate::{JulianDay, Degrees, GeoLocation};

/// Struktur hasil evaluasi kriteria MABIMS
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct MabimsResult {
    pub is_visible: bool,
    pub moon_altitude: Degrees,
    pub geocentric_elongation: Degrees,
    pub moon_age_hours: f64,
}

/// Evaluasi kriteria visibilitas MABIMS untuk lokasi dan waktu tertentu
/// Kriteria MABIMS: altitude >= 2°, geocentric elongation >= 3°, moon age >= 8 hours
pub fn evaluate_criteria(location: &GeoLocation, conjunction_jd: JulianDay, observation_jd: JulianDay) -> MabimsResult {
    // Hitung umur bulan dalam jam
    let moon_age = (observation_jd - conjunction_jd) * 24.0;
    
    println!("🔍 MABIMS eval - Conjunction JD: {}, Observation JD: {}, Age: {} h", 
             conjunction_jd, observation_jd, moon_age);
    
    // Log exact JD being sent to function
    eprintln!("⚡ MABIMS: About to call moon_altitude_topocentric with JD = {}", observation_jd);
    
    // Gunakan topocentric altitude calculation dari astronomy::topocentric module
    let moon_alt = crate::astronomy::topocentric::moon_altitude_topocentric(
        location,
        observation_jd
    );
    
    eprintln!("✨ MABIMS: moon_alt RETURNED = {:.6}°", moon_alt);
    
    // CATATAN: MABIMS menggunakan elongasi geosentris (bukan topocentric)
    // Hitung elongasi geosentris 
    let moon_pos = crate::astronomy::moon_position(observation_jd);
    let sun_pos = crate::astronomy::sun_position(observation_jd);
    
    let mut elongation = moon_pos.longitude - sun_pos.longitude;
    if elongation < 0.0 {
        elongation += 360.0;
    }

    // Evaluasi kriteria MABIMS: altitude >= 2, elongation >= 3, age >= 8
    let is_visible = moon_alt >= 2.0 && elongation >= 3.0 && moon_age >= 8.0;

    MabimsResult {
        is_visible,
        moon_altitude: moon_alt,
        geocentric_elongation: elongation,
        moon_age_hours: moon_age,
    }
}
