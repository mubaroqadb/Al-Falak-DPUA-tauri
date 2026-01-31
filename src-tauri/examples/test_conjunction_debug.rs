// Debug test for conjunction calculation
use tauri_app_lib::*;

fn main() {
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

    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║     DEBUG: CONJUNCTION CALCULATION - 18 Februari 2026             ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");

    // Step 1: Get JD for the date
    let jd_start = calendar::gregorian_to_jd(&date);
    println!("Step 1: JD for Feb 18, 2026 = {}", jd_start);

    // Step 2: Estimate conjunction time using phase
    let phase = astronomy::phase(jd_start);
    let days_since_new = phase * 29.53;
    let days_to_next = 29.53 - days_since_new;
    let jd_estimate = jd_start + days_to_next;
    println!(
        "Step 2: Estimated conjunction JD = {} (phase = {})",
        jd_estimate, phase
    );

    // Step 3: Check moon and sun positions at estimated time
    let moon_pos = astronomy::moon_position(jd_estimate);
    let sun_pos = astronomy::sun_position(jd_estimate);
    println!("\nStep 3: Positions at estimated conjunction time:");
    println!("  Moon longitude: {}", moon_pos.longitude);
    println!("  Sun longitude: {}", sun_pos.longitude);
    println!(
        "  Longitude diff: {}",
        moon_pos.longitude - sun_pos.longitude
    );

    // Check if positions are valid
    if !moon_pos.longitude.is_finite() || !sun_pos.longitude.is_finite() {
        println!("\n❌ ERROR: Invalid positions (NaN or infinite)");

        // Try with a different JD
        println!("\nTrying with JD = 2461088.970384 (VB6 reference)...");
        let moon_pos2 = astronomy::moon_position(2461088.970384);
        let sun_pos2 = astronomy::sun_position(2461088.970384);
        println!("  Moon longitude: {}", moon_pos2.longitude);
        println!("  Sun longitude: {}", sun_pos2.longitude);
    }

    // Step 4: Try to find conjunction
    println!("\nStep 4: Calling find_conjunction...");
    let conjunction = astronomy::conjunction::find_conjunction(&date);
    println!("  Result JD: {}", conjunction.jd_utc);
    println!(
        "  Result Date: {}-{}-{}",
        conjunction.year, conjunction.month, conjunction.day
    );

    // VB6 Reference
    println!("\n=== VB6 REFERENCE ===");
    println!("VB6 Geocentric: 17 Februari 2026, 19:01:02 LT");
    println!("VB6 Topocentric: 17 Februari 2026, 20:19:41 LT");
    println!("VB6 JD: 2461088.970384");
}
