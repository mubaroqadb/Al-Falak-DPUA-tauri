//! Modul untuk perhitungan parallax bulan
//! Parallax adalah pergeseran sudut posisi benda langit akibat posisi observer di permukaan Bumi

/// Hitung topocentric correction untuk altitude (dari geosentris ke toposentris)
///
/// Koreksi ini diperlukan ketika mengamati dari permukaan Bumi (tidak dari pusat Bumi)
/// 
/// # Arguments
/// * `latitude` - Lintang lokasi pengamatan dalam derajat
/// * `altitude_geo` - Tinggi geosentris dalam derajat
/// * `horizontal_parallax` - Horizontal parallax dalam radian
/// 
/// # Returns
/// Koreksi altitude dalam derajat (negatif, mengurangi altitude)
pub fn moon_topocentric_correction(
    latitude: f64,
    altitude_geo: f64,
    horizontal_parallax: f64,
) -> f64 {
    // Konversi ke radian
    let lat_rad = latitude.to_radians();
    let alt_rad = altitude_geo.to_radians();
    
    // Koreksi topocentric altitude
    // ΔH = -parallax * cos(altitude) * cos(latitude) 
    // Ini adalah koreksi altitude dasar dari parallax
    let correction = -horizontal_parallax * alt_rad.cos() * lat_rad.cos();
    
    // Konversi kembali ke derajat
    correction.to_degrees()
}

/// Hitung topocentric correction untuk jarak sudut (elongasi/azimuth)
///
/// # Arguments
/// * `altitude_geo` - Tinggi geosentris dalam derajat
/// * `azimuth` - Azimuth dalam derajat (tidak digunakan dalam formula dasar)
/// * `horizontal_parallax` - Horizontal parallax dalam radian
/// 
/// # Returns
/// Koreksi dalam derajat
pub fn parallax_correction_azimuth(
    altitude_geo: f64,
    _azimuth: f64,
    horizontal_parallax: f64,
) -> f64 {
    // Koreksi azimuth/elongasi dari parallax
    // Koreksi lebih kecil dibanding altitude
    let alt_rad = altitude_geo.to_radians();
    
    // Koreksi approximation: parallax * sin(altitude)
    let correction = horizontal_parallax * alt_rad.sin();
    
    correction.to_degrees()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_topocentric_correction_sign() {
        // Topocentric correction harus negatif (mengurangi altitude)
        let latitude = -6.2;
        let altitude_geo = 10.0;
        let parallax = 0.0095; // radian
        
        let correction = moon_topocentric_correction(latitude, altitude_geo, parallax);
        assert!(correction < 0.0);
    }

    #[test]
    fn test_parallax_correction_altitude_dependency() {
        // Koreksi lebih besar saat altitude rendah (cos(alt) lebih besar)
        let latitude = 0.0;
        let parallax = 0.0095;
        
        let correction_high = moon_topocentric_correction(latitude, 45.0, parallax);
        let correction_low = moon_topocentric_correction(latitude, 5.0, parallax);
        
        // Correction untuk altitude rendah harus lebih besar (lebih negatif)
        assert!(correction_low < correction_high);
    }
}
