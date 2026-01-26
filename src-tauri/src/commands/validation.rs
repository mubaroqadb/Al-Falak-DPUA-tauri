//! Validation command handler

use crate::GeoLocation;

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct AstronomicalValidationResult {
    pub success: bool,
    pub message: String,
    pub details: Vec<String>,
}

/// Validate location coordinates
#[tauri::command]
pub fn validate_location_command(location: GeoLocation) -> Result<ValidationResult, String> {
    let mut errors = Vec::new();

    // Validate latitude
    if location.latitude < -90.0 || location.latitude > 90.0 {
        errors.push("Latitude must be between -90 and 90".to_string());
    }

    // Validate longitude
    if location.longitude < -180.0 || location.longitude > 180.0 {
        errors.push("Longitude must be between -180 and 180".to_string());
    }

    // Validate elevation
    if location.elevation < -500.0 || location.elevation > 10000.0 {
        errors.push("Elevation must be between -500m and 10000m".to_string());
    }

    // Validate timezone
    if location.timezone < -12.0 || location.timezone > 14.0 {
        errors.push("Timezone must be between -12 and +14 hours".to_string());
    }

    let is_valid = errors.is_empty();

    Ok(ValidationResult { is_valid, errors })
}

/// Jalankan semua test validasi perhitungan astronomi
#[tauri::command]
pub fn run_validation_tests_command() -> Result<AstronomicalValidationResult, String> {
    let mut details = Vec::new();

    match crate::validation::run_all_validation_tests() {
        Ok(_) => {
            details.push("All validation tests completed successfully".to_string());
            Ok(AstronomicalValidationResult {
                success: true,
                message: "Validation completed successfully".to_string(),
                details,
            })
        }
        Err(e) => {
            details.push(format!("Validation failed: {}", e));
            Ok(AstronomicalValidationResult {
                success: false,
                message: "Validation failed".to_string(),
                details,
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_location() {
        let location = GeoLocation {
            latitude: -6.2,
            longitude: 106.8,
            elevation: 0.0,
            timezone: 7.0,
        };

        let result = validate_location_command(location).unwrap();
        assert!(result.is_valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_invalid_latitude() {
        let location = GeoLocation {
            latitude: 91.0,
            longitude: 0.0,
            elevation: 0.0,
            timezone: 0.0,
        };

        let result = validate_location_command(location).unwrap();
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
    }

    #[test]
    fn test_invalid_longitude() {
        let location = GeoLocation {
            latitude: 0.0,
            longitude: 181.0,
            elevation: 0.0,
            timezone: 0.0,
        };

        let result = validate_location_command(location).unwrap();
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
    }
}
