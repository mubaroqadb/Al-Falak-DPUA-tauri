//! Module untuk perhitungan astronomi dasar

pub mod arcv;
pub mod conjunction;
pub mod coordinates;
pub mod ephemeris_utils;
pub mod hilal;
pub mod lunar_position;
pub mod moon;
pub mod moon_phases;
pub mod nutation;
pub mod parallax;
pub mod prayer;
pub mod sun;
pub mod sun_meeus;
pub mod sun_vb6;
pub mod topocentric;
pub mod visibility;

// Re-export untuk kemudahan akses
pub use moon::{age_since_new_moon, phase};
pub use moon_phases::calculate_new_moon_jde;
pub use sun::{calculate_sunset, declination, equation_of_time};

// Re-export posisi dengan nama spesifik untuk menghindari konflik
pub use moon::geocentric_position as moon_position;
pub use sun::geocentric_position as sun_position;

// Re-export hilal functions
pub use hilal::{
    altitude_at_sunset, crescent_width_at_sunset, elongation_at_sunset, horizontal_moon_parallax,
    illumination_at_sunset, moon_age_at_sunset,
};

// Re-export parallax functions
pub use parallax::{moon_topocentric_correction, parallax_correction_azimuth};

// Re-export ARCV functions
pub use arcv::{calculate_arcv, calculate_arcv_yallop};

// Re-export conjunction functions
pub use conjunction::{
    find_conjunction, find_conjunction_after, find_conjunction_before, find_conjunction_for_month,
    find_conjunction_with_config, Conjunction, RefinementConfig,
};
