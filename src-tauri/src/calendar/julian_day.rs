//! Konversi Julian Day

use crate::GregorianDate;

/// Konversi Gregorian ke Julian Day
pub fn gregorian_to_jd(date: &crate::GregorianDate) -> f64 {
    let y = if date.month <= 2 {
        date.year - 1
    } else {
        date.year
    } as f64;

    let m = if date.month <= 2 {
        date.month + 12
    } else {
        date.month
    } as f64;

    let a = (y / 100.0).floor();
    let b = 2.0 - a + (a / 4.0).floor();

    let jd = (365.25 * (y + 4716.0)).floor()
        + (30.6001 * (m + 1.0)).floor()
        + date.day
        + b
        - 1524.5;

    jd
}

/// Konversi Julian Day ke Gregorian
pub fn jd_to_gregorian(jd: f64) -> GregorianDate {
    let jd = jd + 0.5;
    let z = jd.floor();
    let f = jd - z;

    let a = if z < 2299161.0 {
        z
    } else {
        let alpha = ((z - 1867216.25) / 36524.25).floor();
        z + 1.0 + alpha - (alpha / 4.0).floor()
    };

    let b = a + 1524.0;
    let c = ((b - 122.1) / 365.25).floor();
    let d = (365.25 * c).floor();
    let e = ((b - d) / 30.6001).floor();

    let day = b - d - (30.6001 * e).floor() + f;
    let month = if e < 14.0 {
        e - 1.0
    } else {
        e - 13.0
    };
    let year = if month > 2.0 {
        c - 4716.0
    } else {
        c - 4715.0
    };

    GregorianDate {
        year: year as i32,
        month: month as u8,
        day,
    }
}