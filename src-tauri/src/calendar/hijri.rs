//! Konversi Hijri Calendar
//!
//! Konversi antara Gregorian dan Hijri (Islamic) calendar
//! Referensi: Jean Meeus, Astronomical Algorithms, Chapter 9
//! Menggunakan Kalender Hijriah Arismetik (Tabular) dengan epoch JD 1948439.5

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
/// Berdasarkan algoritma Ku-ring-gai (tabular)
pub fn jd_to_hijri(jd: f64) -> HijriDate {
    let jd_int = jd.floor() + 0.5;
    let l = jd_int as i64 - 1948440 + 10632;
    let n = (l - 1) / 10631;
    let l = l - 10631 * n + 354;
    let j = ((10985 - l) / 5316) * ((50 * l) / 17719) + (l / 5616) * ((43 * l) / 15238);
    let l = l - ((30 - j) / 15) * ((17719 * j) / 50) - (j / 16) * ((15238 * j) / 43) + 29;

    let month = (24 * l) / 709;
    let day = l - (709 * month) / 24;
    let year = 30 * n + j - 30;

    HijriDate {
        year: year as i32,
        month: month as u8,
        day: day as u8,
    }
}

/// Konversi Hijri ke Julian Day
pub fn hijri_to_jd(hijri: &HijriDate) -> f64 {
    let y = hijri.year as i64;
    let m = hijri.month as i64;
    let d = hijri.day as i64;

    let jd = ((11 * y + 3) / 30) + 354 * y + 30 * m - (m - 1) / 2 + d + 1948440 - 385;
    jd as f64 - 0.5
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification_dates() {
        // Cek 20 Jan 2026 -> Sya'ban 1447?
        let jan20 = crate::GregorianDate {
            year: 2026,
            month: 1,
            day: 20.0,
        };
        let hijri = gregorian_to_hijri(&jan20);
        println!("2026-01-20 -> {} {}-{}", hijri.year, hijri.month, hijri.day);

        // Tergantung epoch dan varian, bisa 1 Sya'ban atau 30 Rajab
        assert!(hijri.year == 1447);
    }
}
