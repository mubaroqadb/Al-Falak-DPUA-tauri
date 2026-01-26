// Module untuk perhitungan posisi bulan

use crate::{JulianDay, CelestialPosition};
use super::lunar_position; // Use our VB6-compatible implementation

/// Hitung posisi bulan geosentris menggunakan VB6-compatible Jean Meeus
pub fn geocentric_position(jd: JulianDay) -> CelestialPosition {
    // Menggunakan implementasi lokal yang match VB6 EXACTLY
    let moon_ecl = lunar_position::geocent_ecl_pos(jd);

    // Konversi dari ekliptika ke equatorial
    let obliquity = crate::astronomy::coordinates::true_obliquity(jd);
    let (ra, decl) = crate::astronomy::coordinates::ecliptic_to_equatorial(
        moon_ecl.longitude,
        moon_ecl.latitude,
        obliquity,
    );

    CelestialPosition {
        longitude: moon_ecl.longitude.to_degrees(),
        latitude: moon_ecl.latitude.to_degrees(),
        right_ascension: ra.to_degrees(),
        declination: decl.to_degrees(),
        distance: moon_ecl.distance,
    }
}

/// Hitung fase bulan (0-1, dimana 0 = new moon, 0.5 = full moon)
/// Menghitung fase dari posisi relatif matahari dan bulan
pub fn phase(jd: JulianDay) -> f64 {
    let moon_ecl = lunar_position::geocent_ecl_pos(jd);
    let sun_pos = astro::sun::geocent_ecl_pos(jd).0;

    // Hitung sudut fase (phase angle)
    let dlon = moon_ecl.longitude - sun_pos.long;
    let dlat = moon_ecl.latitude - sun_pos.lat;

    // Phase angle menggunakan formula kosinus
    let phase_angle = (dlon.cos() * dlat.cos() - dlat.sin()).acos();

    // Konversi ke fase (0-1)
    // 0 = new moon, 0.5 = full moon, 1 = new moon again
    (1.0 - phase_angle.cos()) / 2.0
}

/// Hitung umur bulan sejak konjungsi terakhir (dalam jam)
/// VB6-compatible: menggunakan Jean Meeus Chapter 47 exact algorithm
pub fn age_since_new_moon(jd: JulianDay) -> f64 {
    // Convert JD to calendar date for Jean Meeus algorithm
    let date = crate::calendar::jd_to_gregorian(jd);
    
    // Cari new moon menggunakan Jean Meeus Chapter 47
    // Start from a few days before to ensure we find the previous new moon
    let search_date = crate::GregorianDate {
        year: date.year,
        month: date.month,
        day: (date.day - 2.0).max(1.0),
    };
    
    let new_moon_jd = crate::astronomy::moon_phases::calculate_new_moon_jde(
        search_date.year,
        search_date.month,
        search_date.day
    );
    
    // If new moon is in the future, search earlier month
    let final_new_moon_jd = if jd < new_moon_jd {
        let earlier_date = if date.month > 1 {
            crate::GregorianDate {
                year: date.year,
                month: date.month - 1,
                day: 15.0,
            }
        } else {
            crate::GregorianDate {
                year: date.year - 1,
                month: 12,
                day: 15.0,
            }
        };
        
        crate::astronomy::moon_phases::calculate_new_moon_jde(
            earlier_date.year,
            earlier_date.month,
            earlier_date.day
        )
    } else {
        new_moon_jd
    };
    
    // Return age dalam JAM
    (jd - final_new_moon_jd) * 24.0
}
