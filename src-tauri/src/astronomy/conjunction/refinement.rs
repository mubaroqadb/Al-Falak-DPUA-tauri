//! Algoritma refinement untuk konjungsi (iterasi untuk convergence)

/// Konfigurasi untuk refinement algorithm
pub struct RefinementConfig {
    pub max_iterations: usize,
    pub tolerance: f64, // dalam hari
}

impl Default for RefinementConfig {
    fn default() -> Self {
        Self {
            max_iterations: 10,
            tolerance: 0.00001, // ~0.86 detik
        }
    }
}

/// Refine waktu konjungsi menggunakan iterasi Newton-Raphson
///
/// Mencari waktu ketika selisih longitude bulan-matahari = 0 (konjungsi)
/// FIX: Menggunakan Longitude Difference sebagai target, bukan Elongasi,
/// karena elongasi jarang mencapai 0 akibat latitude bulan.
pub fn refine_conjunction_time(jd_initial: f64, config: RefinementConfig) -> f64 {
    let mut jd = jd_initial;
    let mut iterations = 0;

    loop {
        let (longitude_diff, derivative) = compute_longitude_difference_and_derivative(jd);

        if should_stop(derivative, iterations, &config) {
            break;
        }

        // Newton-Raphson: x_new = x - f(x)/f'(x)
        let correction = -longitude_diff / derivative;
        jd += correction;
        iterations += 1;

        if correction.abs() < config.tolerance {
            break;
        }
    }

    jd
}

/// Hitung selisih longitude dan derivative-nya
fn compute_longitude_difference_and_derivative(jd: f64) -> (f64, f64) {
    let longitude_diff = compute_longitude_difference(jd);

    // Hitung derivative menggunakan finite difference (1 jam = 1/24 hari)
    let delta = 1.0 / 24.0;
    let jd_next = jd + delta;
    let longitude_diff_next = compute_longitude_difference(jd_next);

    let derivative = (longitude_diff_next - longitude_diff) / delta;
    (longitude_diff, derivative)
}

/// Hitung selisih longitude antara bulan dan matahari
/// Returns selisih longitude dalam derajat (normalized ke [-180, 180])
fn compute_longitude_difference(jd: f64) -> f64 {
    let moon_pos = crate::astronomy::moon_position(jd);
    let sun_pos = crate::astronomy::sun_position(jd);

    // Selisih longitude: L_moon - L_sun
    let mut diff = moon_pos.longitude - sun_pos.longitude;

    // Normalize ke [-180, 180] derajat
    while diff > 180.0 {
        diff -= 360.0;
    }
    while diff < -180.0 {
        diff += 360.0;
    }

    diff
}

/// Hitung elongasi angle antara bulan-matahari pada waktu jd
/// Returns the absolute elongation angle (0 to π)
/// NOTE: Fungsi ini dipertahankan untuk kompatibilitas dan reporting
fn compute_elongation_angle(jd: f64) -> f64 {
    let moon_pos = crate::astronomy::moon_position(jd);
    let sun_pos = crate::astronomy::sun_position(jd);

    // Calculate angular separation using spherical law of cosines
    let dlon = (moon_pos.longitude - sun_pos.longitude).to_radians();

    // Spherical law of cosines for angular separation
    let moon_lat_rad = moon_pos.latitude.to_radians();
    let sun_lat_rad = sun_pos.latitude.to_radians();

    let cos_angle = moon_lat_rad.sin() * sun_lat_rad.sin()
        + moon_lat_rad.cos() * sun_lat_rad.cos() * dlon.cos();

    // Clamp to valid range and return angle
    let cos_angle = cos_angle.clamp(-1.0, 1.0);
    cos_angle.acos()
}

/// Normalize angle ke [-π, π]
fn normalize_angle(mut angle: f64) -> f64 {
    const TWO_PI: f64 = 2.0 * std::f64::consts::PI;

    while angle > std::f64::consts::PI {
        angle -= TWO_PI;
    }
    while angle < -std::f64::consts::PI {
        angle += TWO_PI;
    }

    angle
}

/// Cek apakah iterasi harus dihentikan
fn should_stop(derivative: f64, iterations: usize, config: &RefinementConfig) -> bool {
    derivative.abs() < 1e-10 || iterations >= config.max_iterations
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_angle() {
        let angle = 2.0 * std::f64::consts::PI + 0.5;
        let normalized = normalize_angle(angle);
        assert!((normalized - 0.5).abs() < 1e-10);
    }

    #[test]
    fn test_refinement_config_default() {
        let config = RefinementConfig::default();
        assert_eq!(config.max_iterations, 10);
        assert!(config.tolerance < 0.0001);
    }
}
