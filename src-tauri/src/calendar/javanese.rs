//! Perhitungan Hari Pasaran Jawa
//! Legi, Pahing, Pon, Wage, Kliwon

/// Mendapatkan nama pasaran Jawa dari Julian Day
pub fn get_pasaran(jd: f64) -> &'static str {
    let pasaran = ["Legi", "Pahing", "Pon", "Wage", "Kliwon"];

    // JD dihitung dari jam 12:00 UT.
    // Start of Gregorian day adalah JD - 0.5.
    // Kita gunakan (jd + 0.5).floor() sebagai angka index hari.
    let jd_int = (jd + 0.5).floor() as i64;
    let index = (jd_int % 5) as usize;

    pasaran[index]
}

/// Mendapatkan nama hari (7 hari) dalam Bahasa Indonesia
pub fn get_hari_indo(jd: f64) -> &'static str {
    let hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

    let jd_int = (jd + 0.5).floor() as i64;
    let index = (jd_int % 7) as usize;

    hari[index]
}

/// Mendapatkan nama hari lengkap (Hari + Pasaran)
pub fn get_full_day_name(jd: f64) -> String {
    format!("{} {}", get_hari_indo(jd), get_pasaran(jd))
}
