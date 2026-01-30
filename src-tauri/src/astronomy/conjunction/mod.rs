//! Module untuk perhitungan konjungsi (New Moon/Ijtimak)
//!
//! # Struktur Modular
//! - `types.rs`: Tipe data Conjunction
//! - `estimation.rs`: Estimasi awal berdasarkan lunar phase
//! - `refinement.rs`: Algoritma iterasi untuk convergence
//! - `calculations.rs`: Logika perhitungan utama
//!
//! # Referensi
//! - Jean Meeus: Astronomical Algorithms, Chapter 49
//! - Port dari: Astronomy.bas & JeanMeeus.bas (VB6)

mod calculations;
mod estimation;
mod refinement;
mod types;

// Re-export public API
pub use calculations::{
    find_conjunction, find_conjunction_after, find_conjunction_before, find_conjunction_for_month,
    find_conjunction_with_config, find_topocentric_conjunction,
};
pub use refinement::RefinementConfig;
pub use types::Conjunction;
