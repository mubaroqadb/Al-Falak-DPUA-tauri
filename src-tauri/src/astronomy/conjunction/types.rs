//! Tipe-tipe data untuk perhitungan konjungsi

use crate::GregorianDate;

/// Informasi konjungsi (new moon/ijtimak)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Conjunction {
    pub jd_utc: f64,      // Julian Day dalam UTC
    pub year: i32,        // Tahun
    pub month: u8,        // Bulan (1-12)
    pub day: f64,         // Hari (decimal)
    pub elongation: f64,  // Elongasi pada konjungsi (derajat)
}

impl Conjunction {
    /// Konversi Conjunction ke GregorianDate
    pub fn to_gregorian_date(&self) -> GregorianDate {
        GregorianDate {
            year: self.year,
            month: self.month,
            day: self.day,
        }
    }

    /// Buat Conjunction dari Julian Day
    pub fn from_jd(jd: f64) -> Self {
        let gregorian = crate::calendar::jd_to_gregorian(jd);
        Self {
            jd_utc: jd,
            year: gregorian.year,
            month: gregorian.month,
            day: gregorian.day,
            elongation: 0.0, // Akan dihitung oleh caller
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_conjunction_conversion() {
        let conj = Conjunction {
            jd_utc: 2451545.0,
            year: 2000,
            month: 1,
            day: 1.5,
            elongation: 0.1,
        };

        let date = conj.to_gregorian_date();
        assert_eq!(date.year, 2000);
        assert_eq!(date.month, 1);
    }
}
