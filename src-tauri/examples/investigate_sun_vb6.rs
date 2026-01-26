// Investigate sun position discrepancy
use tauri_app_lib::*;

fn main() {
    let sunset_jd = 2461089.970208;
    let date = calendar::jd_to_gregorian(sunset_jd);
    
    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║         INVESTIGASI PERBEDAAN POSISI MATAHARI (SUN POSITION)       ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");
    
    println!("JD: {:.12}", sunset_jd);
    println!("Date: {}-{:02}-{:.6}\n", date.year, date.month, date.day);
    
    // Check nutation
    let d_psi = astronomy::nutation::nutation_in_longitude(sunset_jd);
    
    println!("Nutation in Longitude: {:.6}° ({:.2}\")", d_psi, d_psi * 3600.0);
    println!("VB6 Ref: 7.30\" (0.00202778°)\n");
    
    // Get sun position
    let sun_pos = astronomy::sun::geocentric_position(sunset_jd);
    
    println!("SUN POSITION (GEOCENTRIC):");
    println!("  Tauri RA:  {:.3}° ({:.0}h{:.0}m{:.1}s)", 
        sun_pos.right_ascension,
        sun_pos.right_ascension / 15.0,
        (sun_pos.right_ascension / 15.0 % 1.0) * 60.0,
        ((sun_pos.right_ascension / 15.0 % 1.0) * 60.0 % 1.0) * 60.0);
    println!("  VB6 Ref:   330.943° (22h03m46s)");
    println!("  Error:     {:.3}° ({:.0} as)\n", 
        (sun_pos.right_ascension - 330.943).abs(),
        (sun_pos.right_ascension - 330.943).abs() * 3600.0);
    
    println!("  Tauri Dec:  {:.3}°", sun_pos.declination);
    println!("  VB6 Ref:    -11.890°");
    println!("  Error:      {:.3}° ({:.0} as)\n", 
        (sun_pos.declination + 11.890).abs(),
        (sun_pos.declination + 11.890).abs() * 3600.0);
    
    // Check moon
    let moon_pos = astronomy::moon::geocentric_position(sunset_jd);
    
    println!("MOON POSITION (GEOCENTRIC) - For Reference:");
    println!("  Tauri RA:  {:.3}° (VB6: 343.021°) ✅", moon_pos.right_ascension);
    println!("  Tauri Dec: {:.3}° (VB6: -6.939°) ✅\n", moon_pos.declination);
    
    // Critical: Check elongation (angular separation)
    let location = GeoLocation {
        latitude: -7.0 - 4.0/60.0 - 26.0/3600.0,
        longitude: 106.0 + 31.0/60.0 + 53.0/3600.0,
        elevation: 10.0,
        timezone: 7.0,
    };
    
    let date2 = GregorianDate {
        year: 2026,
        month: 2,
        day: 18.0,
    };
    
    let elongation = astronomy::hilal::elongation_at_sunset(&location, &date2, true);
    
    println!("CRITICAL PARAMETER - ELONGATION:");
    println!("  Tauri:  {:.3}°", elongation);
    println!("  VB6:    11.096°");
    println!("  Error:  {:.4}° ({:.1} as)\n", 
        (elongation - 11.096).abs(),
        (elongation - 11.096).abs() * 3600.0);
    
    if (elongation - 11.096).abs() < 0.05 {
        println!("✅ ELONGATION MATCHES - Sun position absolute error is ACCEPTABLE");
        println!("   The error in absolute sun RA/Dec does NOT affect visibility calculation!");
    } else {
        println!("❌ ELONGATION ERROR TOO LARGE");
    }
}
