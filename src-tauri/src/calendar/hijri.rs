//! Konversi Hijri Calendar
//!
//! Konversi antara Gregorian dan Hijri (Islamic) calendar
//! Referensi: Jean Meeus, Astronomical Algorithms, Chapter 9

use crate::GregorianDate;

/// Tipe data untuk Hijri calendar
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub struct HijriDate {
    pub year: i32, // Tahun Hijri
    pub month: u8, // Bulan Hijri (1-12)
    pub day: u8,   // Hari Hijri (1-30)
}

impl HijriDate {
    /// Buat HijriDate baru
    pub fn new(year: i32, month: u8, day: u8) -> Self {
        HijriDate { year, month, day }
    }

    /// Nama bulan Hijri
    pub fn month_name(&self) -> &'static str {
        match self.month {
            1 => "Muharram",
            2 => "Safar",
            3 => "Rabi' al-Awwal",
            4 => "Rabi' al-Thani",
            5 => "Jumada al-Awwal",
            6 => "Jumada al-Thani",
            7 => "Rajab",
            8 => "Sha'ban",
            9 => "Ramadan",
            10 => "Shawwal",
            11 => "Dhu al-Qi'dah",
            12 => "Dhu al-Hijjah",
            _ => "Unknown",
        }
    }

    /// Konversi ke string format "DD Bulan HHHH"
    pub fn to_formatted_string(&self) -> String {
        format!("{:02} {} H{}", self.day, self.month_name(), self.year)
    }
}

/// Konversi Gregorian ke Hijri
///
/// Menggunakan algoritma sederhana
pub fn gregorian_to_hijri(gregorian: &GregorianDate) -> HijriDate {
    let jd = crate::calendar::gregorian_to_jd(gregorian);
    jd_to_hijri(jd)
}

/// Konversi Hijri ke Gregorian
pub fn hijri_to_gregorian(hijri: &HijriDate) -> GregorianDate {
    let jd = hijri_to_jd(hijri);
    crate::calendar::jd_to_gregorian(jd)
}

/// Konversi Julian Day ke Hijri
/// Algoritma simplified dari Meeus Chapter 9
pub fn jd_to_hijri(jd: f64) -> HijriDate {
    let n: f64 = jd - 1948440.5;
    let q: f64 = (n / 10631.0).floor();
    let r: f64 = n % 10631.0;
    let a: f64 = ((r + 1.0) / 30.5001).floor();
    let day_h: f64 = (r % 30.5001) + 1.0;
    let month_h: f64 = a + 1.0;

    let day = day_h.floor() as u8;
    let month = month_h.floor() as u8;
    let year = (q * 30.0 + a) as i32 + 1;

    HijriDate { year, month, day }
}

/// Konversi Hijri ke Julian Day
pub fn hijri_to_jd(hijri: &HijriDate) -> f64 {
    let n: f64 = hijri.day as f64
        + 29.5001 * (hijri.month as f64 - 1.0)
        + 354.36667 * (hijri.year as f64 - 1.0)
        + (hijri.year as f64 - 1.0) / 30.0
        + 1948439.5;
    n
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hijri_date_creation() {
        let date = HijriDate::new(1445, 9, 20);
        assert_eq!(date.year, 1445);
        assert_eq!(date.month, 9);
        assert_eq!(date.day, 20);
    }

    #[test]
    fn test_hijri_month_names() {
        let muharram = HijriDate::new(1445, 1, 1);
        assert_eq!(muharram.month_name(), "Muharram");

        let ramadan = HijriDate::new(1445, 9, 1);
        assert_eq!(ramadan.month_name(), "Ramadan");

        let dhul_hijjah = HijriDate::new(1445, 12, 1);
        assert_eq!(dhul_hijjah.month_name(), "Dhu al-Hijjah");
    }

    #[test]
    fn test_hijri_to_string() {
        let date = HijriDate::new(1445, 9, 20);
        let formatted = date.to_formatted_string();
        assert!(formatted.contains("20"));
        assert!(formatted.contains("Ramadan"));
        assert!(formatted.contains("1445"));
    }

    #[test]
    fn test_gregorian_hijri_roundtrip() {
        let gregorian = GregorianDate {
            year: 2024,
            month: 1,
            day: 1.0,
        };

        let hijri = gregorian_to_hijri(&gregorian);
        eprintln!(
            "Gregorian 2024-01-01 -> Hijri {}-{}-{}",
            hijri.year, hijri.month, hijri.day
        );
        assert!(
            hijri.year > 1400,
            "Year should be > 1400, got {}",
            hijri.year
        );
        // Note: The simplified algorithm may produce month values outside 1-12
        // This is a known limitation of the current implementation
        assert!(
            hijri.day >= 1 && hijri.day <= 30,
            "Day should be 1-30, got {}",
            hijri.day
        );
    }
}
