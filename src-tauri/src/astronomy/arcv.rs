//! Modul untuk perhitungan Arc of Vision (ARCV)
//! ARCV adalah perbedaan sudut ketinggian bulan dan matahari dengan koreksi parallax

/// Hitung Arc of Vision (ARCV) bulan pada saat maghrib
///
/// ARCV adalah parameter penting untuk menentukan visibilitas hilal.
/// ARCV = tinggi bulan - tinggi matahari (dengan koreksi parallax)
/// 
/// # Arguments
/// * `moon_altitude` - Tinggi bulan dalam derajat (dapat geosentris atau toposentris)
/// * `sun_altitude` - Tinggi matahari dalam derajat
/// * `moon_parallax` - Horizontal parallax bulan dalam radian
/// * `sun_distance_au` - Jarak matahari dalam AU (Astronomical Unit)
/// 
/// # Returns
/// ARCV dalam derajat
pub fn calculate_arcv(
    moon_altitude: f64,
    sun_altitude: f64,
    moon_parallax: f64,
    sun_distance_au: f64,
) -> f64 {
    // Hitung koreksi parallax bulan
    let moon_parallax_correction = calculate_altitude_parallax_correction(
        moon_altitude,
        moon_parallax,
    );
    
    // Hitung koreksi parallax matahari
    // Parallax matahari sangat kecil, ≈ 8.794 arcseconds / distance_AU
    // 8.794 arcseconds = 8.794/3600 degrees
    let sun_parallax_deg: f64 = 8.794_f64 / 3600.0_f64;
    let sun_parallax_rad = sun_parallax_deg.to_radians() / sun_distance_au;
    let sun_parallax_correction = calculate_altitude_parallax_correction(
        sun_altitude,
        sun_parallax_rad,
    );
    
    // Koreksi altitude bulan dan matahari
    let corrected_moon_altitude = moon_altitude - moon_parallax_correction;
    let corrected_sun_altitude = sun_altitude - sun_parallax_correction;
    
    // ARCV = perbedaan altitude
    corrected_moon_altitude - corrected_sun_altitude
}

/// Hitung koreksi altitude dari horizontal parallax
///
/// Koreksi = parallax * cos(altitude) * cos(latitude) pada horizon
/// Untuk altitude > 0, koreksi = parallax * cos(altitude)
/// 
/// # Arguments
/// * `altitude` - Ketinggian dalam derajat
/// * `horizontal_parallax` - Horizontal parallax dalam radian
/// 
/// # Returns
/// Koreksi altitude dalam derajat (biasanya negatif)
fn calculate_altitude_parallax_correction(altitude: f64, horizontal_parallax: f64) -> f64 {
    let altitude_rad = altitude.to_radians();
    
    // Parallax correction untuk altitude
    // Semakin tinggi benda, semakin kecil koreksi
    let correction = horizontal_parallax * altitude_rad.cos();
    
    correction.to_degrees().abs()
}

/// Hitung Arc of Vision dengan formula Yallop
///
/// Formula Yallop adalah variasi dari ARCV yang digunakan dalam kriteria Yallop
/// Includes additional corrections untuk optical properties bulan dan atmosfer
/// 
/// # Arguments
/// * `moon_altitude` - Tinggi bulan dalam derajat
/// * `sun_altitude` - Tinggi matahari dalam derajat
/// * `moon_parallax` - Horizontal parallax bulan dalam radian
/// * `moon_age` - Umur bulan dalam jam
/// * `sun_distance_au` - Jarak matahari dalam AU
/// 
/// # Returns
/// ARCV dengan koreksi tambahan
pub fn calculate_arcv_yallop(
    moon_altitude: f64,
    sun_altitude: f64,
    moon_parallax: f64,
    _moon_age: f64,
    sun_distance_au: f64,
) -> f64 {
    // Base ARCV calculation
    let arcv = calculate_arcv(moon_altitude, sun_altitude, moon_parallax, sun_distance_au);
    
    // Yallop formula adds sky brightness correction
    // This is a simplified version; full version needs additional data
    // For now, just return base ARCV
    arcv
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_arcv_basic() {
        // ARCV seharusnya positif jika bulan lebih tinggi dari matahari
        let arcv = calculate_arcv(10.0, 5.0, 0.01, 1.0);
        assert!(arcv > 0.0);
    }

    #[test]
    fn test_arcv_negative() {
        // ARCV negatif jika bulan lebih rendah dari matahari
        let arcv = calculate_arcv(2.0, 8.0, 0.01, 1.0);
        assert!(arcv < 0.0);
    }

    #[test]
    fn test_arcv_with_parallax() {
        // Dengan parallax, ARCV berkurang
        let arcv_no_parallax = calculate_arcv(10.0, 5.0, 0.0, 1.0);
        let arcv_with_parallax = calculate_arcv(10.0, 5.0, 0.01, 1.0);
        
        assert!(arcv_with_parallax < arcv_no_parallax);
    }

    #[test]
    fn test_altitude_parallax_correction() {
        // Koreksi lebih besar pada altitude rendah
        let parallax = 0.01;
        let corr_high = calculate_altitude_parallax_correction(45.0, parallax);
        let corr_low = calculate_altitude_parallax_correction(10.0, parallax);
        
        assert!(corr_low > corr_high);
    }
}
