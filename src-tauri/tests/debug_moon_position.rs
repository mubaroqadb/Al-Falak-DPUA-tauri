// Debug test to compare VB6 vs Rust moon calculations step by step
use tauri_app_lib::*;

#[test]
fn debug_moon_position_sukabumi() {
    // Sukabumi, 18 Feb 2026, sunset
    let location = GeoLocation {
        name: None,
        latitude: -7.0 - 4.0 / 60.0 - 26.0 / 3600.0,
        longitude: 106.0 + 31.0 / 60.0 + 53.0 / 3600.0,
        elevation: 10.0,
        timezone: 7.0,
    };

    let date = GregorianDate {
        year: 2026,
        month: 2,
        day: 18.0,
    };

    // 1. Julian Day calculation
    let jd = calendar::gregorian_to_jd(&date);
    println!("JD for 2026-02-18: {:.10}", jd);

    // 2. Sunset time
    let sunset_hour = astronomy::calculate_sunset(&location, &date);
    println!("Sunset (local): {:.6} hours", sunset_hour);

    let sunset_hour_ut = sunset_hour - location.timezone;
    println!("Sunset (UT): {:.6} hours", sunset_hour_ut);

    let sunset_jd = jd + (sunset_hour_ut / 24.0);
    println!("Sunset JD: {:.10}", sunset_jd);

    // 3. Moon position (Geocentric)
    let moon_pos = astronomy::lunar_position::geocent_ecl_pos(sunset_jd);
    println!("\n=== MOON ECLIPTIC (Geocentric) ===");
    println!("Longitude: {:.10}°", moon_pos.longitude.to_degrees());
    println!("Latitude: {:.10}°", moon_pos.latitude.to_degrees());
    println!("Distance: {:.6} km", moon_pos.distance);

    // Topocentric Moon
    let moon_topo = astronomy::topocentric::moon_topocentric_position(
        &location,
        sunset_jd,
        0.0, // RA ignored by this function as it calculates it internally if needed or unused
        0.0, // Dec ignored
        moon_pos.distance,
        moon_pos.longitude.to_degrees(),
        moon_pos.latitude.to_degrees(),
    );
    println!("\n=== MOON TOPOCENTRIC ===");
    println!("Longitude: {:.10}°", moon_topo.longitude);
    println!("Latitude: {:.10}°", moon_topo.latitude);
    println!("RA: {:.10}°", moon_topo.ra);
    println!("Dec: {:.10}°", moon_topo.dec);

    // 5. Sun position (Geocentric VB6 Parity)
    let sun_pos = astronomy::sun::geocentric_position(sunset_jd);
    println!("\n=== SUN ECLIPTIC (VB6 Parity) ===");
    println!("Longitude: {:.10}°", sun_pos.longitude);
    println!("Latitude: {:.10}°", sun_pos.latitude);
    println!("Distance: {:.6} AU", sun_pos.distance);

    // 6. Elongation calculation (Topocentric)
    // Using strict VB6 port for topocentric elongation
    let elongation = astronomy::topocentric::elongation_topocentric(&location, sunset_jd);

    println!("\n=== ELONGATION ===");
    println!("Elongation (Topo): {:.6}°", elongation);

    // VB6 expected values from PDF
    println!("\n=== VB6 EXPECTED ===");
    println!("Moon age: 21.957 hours");
    println!("Altitude: 8.653°");
    println!("Elongation: 11.096°");

    println!("\n=== DIFFERENCES ===");
    println!("Elongation diff: {:.4}°", (elongation - 11.096).abs());

    // Moon Age Topo
    let moon_age = astronomy::topocentric::moon_age_topocentric(&location, sunset_jd);
    println!("Moon Age diff: {:.3} hours", (moon_age - 21.957).abs());

    // Altitude Topo
    let altitude = astronomy::topocentric::moon_altitude_topocentric(&location, sunset_jd);
    println!("Altitude diff: {:.3}°", (altitude - 8.653).abs());
}
