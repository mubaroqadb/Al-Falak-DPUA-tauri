// Complete test for Feb 18, 2026 matching VB6 reference
use tauri_app_lib::*;

fn main() {
    let location = GeoLocation {
        latitude: -7.0 - 4.0/60.0 - 26.0/3600.0,
        longitude: 106.0 + 31.0/60.0 + 53.0/3600.0,
        elevation: 10.0,
        timezone: 7.0,
    };
    
    let date = GregorianDate {
        year: 2026,
        month: 2,
        day: 18.0,
    };
    
    // Calculate sunset JD
    let jd = calendar::gregorian_to_jd(&date);
    let sunset_hour = astronomy::sun::calculate_sunset(&location, &date);
    let sunset_jd = jd + ((sunset_hour - location.timezone) / 24.0);
    
    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║     VALIDASI LENGKAP: TAURI vs VB6 - 18 Februari 2026             ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");
    
    println!("JD Maghrib: {:.12}", sunset_jd);
    println!("VB6 Ref:    2461089.970208\n");
    
    // Key parameters
    let age = astronomy::hilal::moon_age_at_sunset(&location, &date);
    let elong = astronomy::hilal::elongation_at_sunset(&location, &date, true);
    let alt = astronomy::hilal::altitude_at_sunset(&location, &date, true);
    
    println!("PARAMETER HISAB HILAL:");
    println!("  Moon Age:     {:.3} jam (VB6: 21.957)", age);
    println!("  Elongation:   {:.3}° (VB6: 11.096°)", elong);
    println!("  Altitude:     {:.3}° (VB6: 8.653°)", alt);
    println!();
    
    // Validate
    let age_pass = (age - 21.957).abs() < 0.1;
    let elong_pass = (elong - 11.096).abs() < 0.1;
    let alt_pass = (alt - 8.653).abs() < 0.1;
    
    println!("STATUS:");
    println!("  Age:          {} (error: {:.0} min)", if age_pass { "✅" } else { "❌" }, (age - 21.957).abs() * 60.0);
    println!("  Elongation:   {} (error: {:.1} as)", if elong_pass { "✅" } else { "❌" }, (elong - 11.096).abs() * 3600.0);
    println!("  Altitude:     {} (error: {:.0} as)", if alt_pass { "✅" } else { "❌" }, (alt - 8.653).abs() * 3600.0);
    println!();
    
    if age_pass && elong_pass && alt_pass {
        println!("✅ SEMUA PARAMETER PASS - Tauri implementation CORRECT");
    } else {
        println!("❌ ADA PARAMETER YANG FAIL");
        println!("\nDEBUGGING INFO:");
        
        // Check sun
        let sun_pos = astronomy::sun::geocentric_position(sunset_jd);
        println!("\nSun Position (Geocentric):");
        println!("  Tauri RA:  {:.3}°", sun_pos.right_ascension);
        println!("  VB6 RA:    330.943°");
        println!("  Error:     {:.3}°", (sun_pos.right_ascension - 330.943).abs());
        
        // Check moon
        let moon_pos = astronomy::moon::geocentric_position(sunset_jd);
        println!("\nMoon Position (Geocentric):");
        println!("  Tauri RA:  {:.3}°", moon_pos.right_ascension);
        println!("  VB6 RA:    343.021°");
        println!("  Error:     {:.3}°", (moon_pos.right_ascension - 343.021).abs());
    }
}
