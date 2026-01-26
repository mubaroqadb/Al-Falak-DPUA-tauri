//! Module untuk berbagai kriteria visibilitas hilal
//! 
//! Modul ini menyediakan implementasi berbagai kriteria visibilitas hilal
//! yang digunakan oleh berbagai organisasi Islam di seluruh dunia

pub mod mabims;
pub mod odeh;
pub mod wujudul_hilal;
pub mod turkey;
pub mod ijtima_qobla_ghurub;
pub mod lfnu;
pub mod additional;

// Re-export tipe data dan fungsi
pub use mabims::{MabimsResult, evaluate_criteria as evaluate_mabims};
pub use odeh::{OdehResult, evaluate_odeh};
pub use wujudul_hilal::{WujudulHilalResult, evaluate_wujudul_hilal};
pub use turkey::{TurkeyResult, evaluate_turkey};
pub use ijtima_qobla_ghurub::{IjtimaQoblaGhuribResult, evaluate_ijtima_qobla_ghurub};
pub use lfnu::{LfnuResult, evaluate_lfnu};
pub use additional::{KigResult, Kriteria29Result, evaluate_kig, evaluate_kriteria_29};

use crate::{GeoLocation, GregorianDate};

/// Enum untuk tipe visibilitas
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, PartialEq)]
pub enum VisibilityType {
    Visible,
    NotVisible,
    Uncertain,
}

/// Struktur hasil evaluasi visibilitas secara umum
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct VisibilityResult {
    pub criteria_name: String,
    pub is_visible: bool,
    pub visibility_type: String,
    pub additional_info: String,
}

/// Master function untuk mengevaluasi semua kriteria sekaligus
/// 
/// # Arguments
/// * `location` - Lokasi pengamatan
/// * `date` - Tanggal Gregorian
/// * `conjunction_jd` - Julian Day dari ijtimak (konjungsi bulan-matahari)
/// 
/// # Returns
/// HashMap dengan hasil evaluasi untuk setiap kriteria
pub fn evaluate_all_criteria(
    location: &GeoLocation,
    date: &GregorianDate,
    conjunction_jd: f64,
) -> std::collections::HashMap<String, VisibilityResult> {
    let mut results = std::collections::HashMap::new();
    
    let jd = crate::calendar::gregorian_to_jd(date);
    let sunset_hour = crate::astronomy::calculate_sunset(location, date);
    let sunset_jd = jd + (sunset_hour / 24.0);
    
    println!("📅 Observation date: {}-{}-{}", date.year, date.month, date.day);
    println!("🌙 Conjunction JD: {}", conjunction_jd);
    println!("🌅 Sunset JD: {}", sunset_jd);
    println!("⏱️  Moon age: {} hours", (sunset_jd - conjunction_jd) * 24.0);
    
    // Evaluasi MABIMS
    let mabims_result = evaluate_mabims(location, conjunction_jd, sunset_jd);
    results.insert(
        "MABIMS".to_string(),
        VisibilityResult {
            criteria_name: "MABIMS".to_string(),
            is_visible: mabims_result.is_visible,
            visibility_type: if mabims_result.is_visible {
                "Visible".to_string()
            } else {
                "Not Visible".to_string()
            },
            additional_info: format!(
                "Altitude: {:.2}°, Elongation: {:.2}°, Age: {:.1}h",
                mabims_result.moon_altitude,
                mabims_result.geocentric_elongation,
                mabims_result.moon_age_hours
            ),
        },
    );
    
    // Evaluasi Wujudul Hilal
    let wujudul_result = evaluate_wujudul_hilal(location, date, conjunction_jd);
    results.insert(
        "WujudulHilal".to_string(),
        VisibilityResult {
            criteria_name: "Wujudul Hilal".to_string(),
            is_visible: wujudul_result.is_visible,
            visibility_type: if wujudul_result.is_visible {
                "Visible".to_string()
            } else {
                "Not Visible".to_string()
            },
            additional_info: format!(
                "Ijtimak before maghrib: {}, Moon altitude: {:.2}°",
                wujudul_result.ijtimak_before_maghrib,
                wujudul_result.moon_altitude
            ),
        },
    );
    
    // Evaluasi Turkey (menggunakan topocentric)
    let turkey_result = evaluate_turkey(location, date, true);
    results.insert(
        "Turkey".to_string(),
        VisibilityResult {
            criteria_name: "Turkey (Diyanet)".to_string(),
            is_visible: turkey_result.is_visible,
            visibility_type: if turkey_result.is_visible {
                "Visible".to_string()
            } else {
                "Not Visible".to_string()
            },
            additional_info: format!(
                "Altitude: {:.2}°, Elongation: {:.2}°",
                turkey_result.moon_altitude,
                turkey_result.elongation
            ),
        },
    );
    
    // Evaluasi Odeh
    let odeh_result = evaluate_odeh(location, date);
    results.insert(
        "Odeh".to_string(),
        VisibilityResult {
            criteria_name: "Odeh".to_string(),
            is_visible: odeh_result.is_visible,
            visibility_type: odeh_result.visibility_type.clone(),
            additional_info: format!(
                "ARCV: {:.2}°, Width: {:.2}', q-value: {:.3}",
                odeh_result.arcv,
                odeh_result.crescent_width,
                odeh_result.q_value
            ),
        },
    );
    
    // Evaluasi Ijtima Qobla Ghurub
    let ijtima_result = evaluate_ijtima_qobla_ghurub(location, date, conjunction_jd);
    results.insert(
        "IjtimaQoblaGhurub".to_string(),
        VisibilityResult {
            criteria_name: "Ijtima Qobla Ghurub".to_string(),
            is_visible: ijtima_result.is_visible,
            visibility_type: if ijtima_result.is_visible {
                "Visible".to_string()
            } else {
                "Not Visible".to_string()
            },
            additional_info: format!(
                "Ijtimak sebelum maghrib: {}",
                ijtima_result.ijtimak_before_maghrib
            ),
        },
    );
    
    // Evaluasi LFNU
    let lfnu_result = evaluate_lfnu(location, date);
    results.insert(
        "LFNU".to_string(),
        VisibilityResult {
            criteria_name: "LFNU (Lembaga Falakiyah NU)".to_string(),
            is_visible: lfnu_result.is_visible,
            visibility_type: if lfnu_result.is_visible {
                "Visible".to_string()
            } else {
                "Not Visible".to_string()
            },
            additional_info: format!(
                "Altitude: {:.2}°, Elongation: {:.2}°",
                lfnu_result.moon_altitude,
                lfnu_result.elongation
            ),
        },
    );
    
    results
}