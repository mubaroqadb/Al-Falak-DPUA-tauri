//! Calendar conversion command handlers

use crate::{GregorianDate, calendar::HijriDate};

/// Convert Gregorian date to Hijri
#[tauri::command]
pub fn gregorian_to_hijri_command(
    year: i32,
    month: u8,
    day: u8,
) -> Result<HijriDate, String> {
    // Validate input
    if month < 1 || month > 12 {
        return Err("Invalid Gregorian month (1-12)".to_string());
    }
    if day < 1 || day > 31 {
        return Err("Invalid Gregorian day (1-31)".to_string());
    }

    let gregorian = GregorianDate {
        year,
        month,
        day: day as f64,
    };

    let hijri = crate::calendar::gregorian_to_hijri(&gregorian);
    Ok(hijri)
}

/// Convert Hijri date to Gregorian
#[tauri::command]
pub fn hijri_to_gregorian_command(
    year: i32,
    month: u8,
    day: u8,
) -> Result<GregorianDate, String> {
    // Validate input
    if month < 1 || month > 12 {
        return Err("Invalid Hijri month (1-12)".to_string());
    }
    if day < 1 || day > 30 {
        return Err("Invalid Hijri day (1-30)".to_string());
    }
    if year < 1 {
        return Err("Invalid Hijri year (must be positive)".to_string());
    }

    let hijri = HijriDate::new(year, month, day);
    let gregorian = crate::calendar::hijri_to_gregorian(&hijri);

    Ok(gregorian)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gregorian_to_hijri_invalid_month() {
        let result = gregorian_to_hijri_command(2024, 13, 1);
        assert!(result.is_err());
    }

    #[test]
    fn test_hijri_to_gregorian_invalid_month() {
        let result = hijri_to_gregorian_command(1445, 13, 1);
        assert!(result.is_err());
    }

    #[test]
    fn test_gregorian_to_hijri_valid() {
        let result = gregorian_to_hijri_command(2024, 1, 1);
        assert!(result.is_ok());
    }

    #[test]
    fn test_hijri_to_gregorian_valid() {
        let result = hijri_to_gregorian_command(1445, 1, 1);
        assert!(result.is_ok());
    }
}
