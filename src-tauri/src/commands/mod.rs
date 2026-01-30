//! Tauri command handlers
//!
//! Module untuk mengelola command handlers yang terpisah per concern
//! Mengikuti clean code principles dengan separation of concerns

pub mod astronomical;
pub mod calendar_cmd;
pub mod hilal;
pub mod validation;

// Re-export untuk kemudahan akses dari lib.rs
pub use astronomical::get_astronomical_data_command;
pub use calendar_cmd::{gregorian_to_hijri_command, hijri_to_gregorian_command};
pub use hilal::{calculate_hilal_visibility_command, calculate_hilal_visibility_hijri_command};
pub use validation::run_validation_tests_command;
