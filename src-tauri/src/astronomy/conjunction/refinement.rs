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
/// Mencari waktu ketika elongasi bulan-matahari minimum (= konjungsi)
pub fn refine_conjunction_time(jd_initial: f64, config: RefinementConfig) -> f64 {
    let mut jd = jd_initial;
    let mut iterations = 0;

    loop {
        let (angle_a, derivative) = compute_angle_and_derivative(jd);

        if should_stop(derivative, iterations, &config) {
            break;
        }

        let correction = -angle_a / derivative;
        jd += correction;
        iterations += 1;

        if correction.abs() < config.tolerance {
            break;
        }
    }

    jd
}

/// Hitung angle elongasi dan derivative
fn compute_angle_and_derivative(jd: f64) -> (f64, f64) {
    let angle_a = compute_elongation_angle(jd);

    // Hitung derivative menggunakan finite difference (1 hari ke depan)
    let jd_next = jd + 1.0;
    let angle_b = compute_elongation_angle(jd_next);

    let derivative = angle_b - angle_a;
    (angle_a, derivative)
}

/// Hitung elongasi angle antara bulan-matahari pada waktu jd
fn compute_elongation_angle(jd: f64) -> f64 {
    let moon_pos = crate::astronomy::moon_position(jd);
    let sun_pos = crate::astronomy::sun_position(jd);
    let dlon = (moon_pos.longitude - sun_pos.longitude).to_radians();

    normalize_angle(dlon)
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
