//! Implementation of solar position calculations strictly following Al Falak DPUA VB6 logic
//!
//! This module replaces `astro-rust` for sun position to ensure 100% parity with legacy application.
//! It implements:
//! - Delta T correction (Astro.bas)
//! - Julian Century Ephemeris (Conversion.bas)
//! - Jean Meeus 64-term VSOP87 truncation (JeanMeeus.bas via sun_meeus.rs)
//! - Final coordinate logic (PosisiMatahari.bas)

use super::sun_meeus;
use crate::{CelestialPosition, JulianDay};

/// Calculate Geocentric Sun Position matching VB6 exactly
pub fn geocentric_position(jd: JulianDay) -> CelestialPosition {
    // Convert JD to Gregorian Date for Delta T calculation
    let date = crate::calendar::jd_to_gregorian(jd);

    // VB6 Logic:
    // 1. Calculate JCE (Julian Century Ephemeris) which includes Delta T
    let jce = ymd2jce(date.year, date.month, date.day);

    // 2. Calculate Longitude (Theta) using Jean Meeus 64-term series
    // Tau is in Millennia? JM_L0(tau).
    // VB6: tau = t / 10#. t is JCE.
    let tau = jce / 10.0;

    let longitude = jm_geo_sun_longitude_from_jce(jce, tau);

    // 3. Calculate Latitude (Beta)
    let latitude = jm_geo_sun_latitude_from_jce(jce, tau);

    // 4. Calculate Distance (R)
    let distance = jm_geo_sun_radius_jce(tau);

    // 5. Convert to Equatorial (RA/Dec)
    // VB6 uses standard obliquity for this conversion?
    // In PosisiMatahari.bas, it doesn't seem to export RA/Dec directly in the main function shown,
    // but we need it for the struct. We will use the same obliquity logic as existing code.
    let obliquity = crate::astronomy::coordinates::true_obliquity(jd);
    let (ra, decl) = crate::astronomy::coordinates::ecliptic_to_equatorial(
        longitude.to_radians(),
        latitude.to_radians(),
        obliquity,
    );

    CelestialPosition {
        longitude,
        latitude,
        right_ascension: ra.to_degrees(),
        declination: decl.to_degrees(),
        distance,
    }
}

// ==============================================================================
// Ported Helper Functions (deltaT, YMD2JCE, etc.)
// ==============================================================================

/// Ported from Conversion.bas: YMD2JD
fn ymd2jd(y: i32, m: u8, d: f64) -> f64 {
    let mut y = y;
    let mut m = m as i32;

    // VB6: If (m < 3) Then m = m + 12: y = y - 1
    if m < 3 {
        m += 12;
        y -= 1;
    }

    // VB6: aa = 10000# * y + 100# * m + d
    // Check Gregorian switch (1582-10-15)
    // VB6 implies 15821004.99999 cutoff for Julian calendar
    let aa = 10000.0 * y as f64 + 100.0 * m as f64 + d;

    let b = if aa <= 15821004.99999 {
        0.0
    } else {
        let a = (y as f64 / 100.0).floor();
        2.0 - a + (a / 4.0).floor()
    };

    // YMD2JD = Int(365.25 * (y + 4716)) + Int(30.6001 * (m + 1)) + d + b - 1524.5
    let term1 = (365.25 * (y as f64 + 4716.0)).floor();
    let term2 = (30.6001 * (m as f64 + 1.0)).floor();

    term1 + term2 + d + b - 1524.5
}

/// Ported from Astro.bas: deltaT
/// Returns Delta T in seconds
pub fn delta_t(y: i32, m: u8, d: f64) -> f64 {
    // mY = y + (YMD2JD(y, m, d) - YMD2JD(y, 1, 0)) / 365.25
    let jd_current = ymd2jd(y, m, d);
    let jd_start_year = ymd2jd(y, 1, 0.0);
    let my = y as f64 + (jd_current - jd_start_year) / 365.25;

    let mut dt = 0.0;

    // < -500
    if my <= -500.0 {
        let c = my / 100.0;
        dt = -20.0 + 32.0 * (c - 18.2).powi(2);
    }
    // -500 to 500
    else if my <= 500.0 {
        let c = my / 100.0;
        dt = 10583.6 - 1014.41 * c + 33.78311 * c.powi(2)
            - 5.952053 * c.powi(3)
            - 0.1798452 * c.powi(4)
            + 0.022174192 * c.powi(5)
            + 0.0090316521 * c.powi(6);
    }
    // 500 to 1600
    else if my <= 1600.0 {
        let c = my / 100.0 - 10.0;
        dt = 1574.2 - 556.01 * c + 71.23472 * c.powi(2) + 0.319781 * c.powi(3)
            - 0.8503463 * c.powi(4)
            - 0.005050998 * c.powi(5)
            + 0.0083572073 * c.powi(6);
    }
    // 1600 to 1700
    else if my <= 1700.0 {
        let c = my - 1600.0;
        dt = 120.0 - 0.9808 * c - 0.01532 * c.powi(2) + c.powi(3) / 7129.0;
    }
    // 1700 to 1800
    else if my <= 1800.0 {
        let c = my - 1700.0;
        dt = 8.83 + 0.1603 * c - 0.0059285 * c.powi(2) + 0.00013336 * c.powi(3)
            - c.powi(4) / 1174000.0;
    }
    // 1800 to 1860
    else if my <= 1860.0 {
        let c = my - 1800.0;
        dt = 13.72 - 0.332447 * c + 0.0068612 * c.powi(2) + 0.0041116 * c.powi(3)
            - 0.00037436 * c.powi(4)
            + 0.0000121272 * c.powi(5)
            - 0.0000001699 * c.powi(6)
            + 0.000000000875 * c.powi(7);
    }
    // 1860 to 1900
    else if my <= 1900.0 {
        let c = my - 1860.0;
        dt = 7.62 + 0.5737 * c - 0.251754 * c.powi(2) + 0.01680668 * c.powi(3)
            - 0.0004473624 * c.powi(4)
            + c.powi(5) / 233174.0;
    }
    // 1900 to 1920
    else if my <= 1920.0 {
        let c = my - 1900.0;
        dt = -2.79 + 1.494119 * c - 0.0598939 * c.powi(2) + 0.0061966 * c.powi(3)
            - 0.000197 * c.powi(4);
    }
    // 1920 to 1941
    else if my <= 1941.0 {
        let c = my - 1920.0;
        dt = 21.2 + 0.84493 * c - 0.0761 * c.powi(2) + 0.0020936 * c.powi(3);
    }
    // 1941 to 1961
    else if my <= 1961.0 {
        let c = my - 1950.0;
        dt = 29.07 + 0.407 * c - c.powi(2) / 233.0 + c.powi(3) / 2547.0;
    }
    // 1961 to 1986
    else if my <= 1986.0 {
        let c = my - 1975.0;
        dt = 45.45 + 1.067 * c - c.powi(2) / 260.0 - c.powi(3) / 718.0;
    }
    // 1986 to 2005
    else if my <= 2005.0 {
        let c = my - 2000.0;
        dt = 63.86 + 0.3345 * c - 0.060374 * c.powi(2)
            + 0.0017275 * c.powi(3)
            + 0.000651814 * c.powi(4)
            + 0.00002373599 * c.powi(5);
    }
    // 2005 to 2050
    else if my <= 2050.0 {
        let c = my - 2000.0;
        dt = 62.92 + 0.32217 * c + 0.005589 * c.powi(2);
    }
    // 2050 to 2150
    else if my <= 2150.0 {
        let c = (my - 1820.0) / 100.0;
        dt = -20.0 + 32.0 * c.powi(2) - 0.5628 * (2150.0 - my);
    }
    // > 2150
    else {
        let c = (my - 1820.0) / 100.0;
        dt = -20.0 + 32.0 * c.powi(2);
    }

    dt
}

/// Ported from Conversion.bas: YMD2JCE
/// Returns Julian Century Ephemeris
pub fn ymd2jce(y: i32, m: u8, d: f64) -> f64 {
    // YMD2JDE = YMD2JD(y, m, d) + deltaT(y, m, d) / 86400#
    let jd = ymd2jd(y, m, d);
    let dt = delta_t(y, m, d);
    let jde = jd + dt / 86400.0;

    // YMD2JCE = (YMD2JDE(y, m, d) - 2451545#) / 36525#
    (jde - 2451545.0) / 36525.0
}

/// Ported from PosisiMatahari.bas: JM_GeoSunLongitude
/// Logic split for modularity
fn jm_geo_sun_longitude_from_jce(t: f64, tau: f64) -> f64 {
    // theta = JM_L0(tau) + JM_L1(tau) * tau + ...
    let mut theta = sun_meeus::jm_l0(tau)
        + sun_meeus::jm_l1(tau) * tau
        + sun_meeus::jm_l2(tau) * tau.powi(2)
        + sun_meeus::jm_l3(tau) * tau.powi(3)
        + sun_meeus::jm_l4(tau) * tau.powi(4)
        + sun_meeus::jm_l5(tau) * tau.powi(5);

    theta = theta / 100000000.0;

    // Beta = (JM_B0(tau) + JM_B1(tau) * tau) / 100000000#
    // Beta = -(rad2deg(Beta))
    // Note: VB6 uses rad2deg here?
    // Wait, JeanMeeus functions usually output in RADIANS/10^8 or DEGREES?
    // VSOP87 usually outputs radians.
    // Astro-rust handles this.
    // Let's check JeanMeeus.bas. JM_L0=175347046 which is 1.75 rad * 10^8.
    // L0 constant in VSOP87 is 1.75347... rad.
    // So theta is in radians after division.
    // But VB6 code says: theta = 180# + rad2deg(theta)
    // So it converts to degrees and adds 180?
    // Let's re-verify VB6 code:
    // theta = theta / 100000000#
    // theta = 180# + rad2deg(theta)
    let theta_deg = 180.0 + theta.to_degrees();

    // Beta calculation needed for correction
    let beta_raw = (sun_meeus::jm_b0(tau) + sun_meeus::jm_b1(tau) * tau) / 100000000.0;
    let mut beta_deg = -(beta_raw.to_degrees());

    // Mencari sudut Theta di antara 0 dan 360 derajat
    let theta_deg = limit_to_360(theta_deg);

    // Menghitung koreksi Theta (Bujur Matahari)
    // Lambda1 = theta - 1.397 * t - 0.00031 * t ^ 2
    let lambda1 = theta_deg - 1.397 * t - 0.00031 * t.powi(2);

    // dBeta = 0.03916 * (cos(deg2rad(Lambda1)) - sin(deg2rad(Lambda1))) / 3600#
    let lambda1_rad = lambda1.to_radians();
    let d_beta = 0.03916 * (lambda1_rad.cos() - lambda1_rad.sin()) / 3600.0;

    beta_deg = beta_deg + d_beta;

    // dTheta = (-0.09033 + 0.03916 * (cos(deg2rad(Lambda1)) + sin(deg2rad(Lambda1))) * Tan(Beta)) / 3600#
    let beta_rad = beta_deg.to_radians();
    let d_theta =
        (-0.09033 + 0.03916 * (lambda1_rad.cos() + lambda1_rad.sin()) * beta_rad.tan()) / 3600.0;

    limit_to_360(theta_deg + d_theta)
}

/// Ported logic for Latitude
fn jm_geo_sun_latitude_from_jce(t: f64, tau: f64) -> f64 {
    // Similar logic to longitude but returning Beta
    let mut theta = sun_meeus::jm_l0(tau)
        + sun_meeus::jm_l1(tau) * tau
        + sun_meeus::jm_l2(tau) * tau.powi(2)
        + sun_meeus::jm_l3(tau) * tau.powi(3)
        + sun_meeus::jm_l4(tau) * tau.powi(4)
        + sun_meeus::jm_l5(tau) * tau.powi(5);
    theta = theta / 100000000.0;
    let theta_deg = limit_to_360(180.0 + theta.to_degrees());

    let beta_raw = (sun_meeus::jm_b0(tau) + sun_meeus::jm_b1(tau) * tau) / 100000000.0;
    let beta_deg = -(beta_raw.to_degrees());

    // Correction
    let lambda1 = theta_deg - 1.397 * t - 0.00031 * t.powi(2);
    let lambda1_rad = lambda1.to_radians();

    let d_beta = 0.03916 * (lambda1_rad.cos() - lambda1_rad.sin()) / 3600.0;

    beta_deg + d_beta
}

/// Ported logic for Distance (Radius Vector)
fn jm_geo_sun_radius_jce(tau: f64) -> f64 {
    // R = JM_R0(tau) + JM_R1(tau) * tau + ...
    let r = sun_meeus::jm_r0(tau)
        + sun_meeus::jm_r1(tau) * tau
        + sun_meeus::jm_r2(tau) * tau.powi(2)
        + sun_meeus::jm_r3(tau) * tau.powi(3)
        + sun_meeus::jm_r4(tau) * tau.powi(4);

    r / 100000000.0
}

fn limit_to_360(val: f64) -> f64 {
    let mut v = val % 360.0;
    if v < 0.0 {
        v += 360.0;
    }
    v
}
