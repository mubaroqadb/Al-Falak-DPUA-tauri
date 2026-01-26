// Validasi posisi Matahari - Cek error terhadap VB6
use tauri_app_lib::*;

fn main() {
    // Feb 18, 2026 sunset
    let sunset_jd = 2461089.970208;
    
    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║            VALIDASI POSISI MATAHARI - SUN POSITION                ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");
    
    println!("JD Input: {:.12}", sunset_jd);
    println!("Date: 18 Februari 2026 Pukul 18:17:06 WIB\n");
    
    let sun_pos = astronomy::sun::geocentric_position(sunset_jd);
    
    println!("TAURI OUTPUT:");
    println!("  RA:  {:3.3}°  ({:.0}h {:.0}m {:.2}s)", 
        sun_pos.right_ascension,
        sun_pos.right_ascension / 15.0,
        (sun_pos.right_ascension / 15.0 % 1.0) * 60.0,
        ((sun_pos.right_ascension / 15.0 % 1.0) * 60.0 % 1.0) * 60.0);
    println!("  Dec: {:3.3}°  ({:.0}° {:.0}' {:.2}\")", 
        sun_pos.declination,
        sun_pos.declination.abs() as i32,
        ((sun_pos.declination.abs() % 1.0) * 60.0) as i32,
        ((sun_pos.declination.abs() * 3600.0) % 60.0));
    println!("  Lon: {:3.3}°", sun_pos.longitude);
    println!("  Lat: {:3.3}°", sun_pos.latitude);
    println!("  Dist: {:.3} km\n", sun_pos.distance);
    
    println!("VB6 REFERENCE:");
    println!("  RA:  330.943°  (22h 03m 46s)");
    println!("  Dec: -11.890°  (-11° 53' 24\")");
    println!("  Lon: 328.802°");
    println!("  Lat: -0.000°");
    println!("  Dist: 147862777 km\n");
    
    println!("ERROR:");
    println!("  RA:   {:.3}° = {:.1} arcsec", 
        (sun_pos.right_ascension - 330.943).abs(),
        (sun_pos.right_ascension - 330.943).abs() * 3600.0);
    println!("  Dec:  {:.3}° = {:.1} arcsec", 
        (sun_pos.declination - (-11.890)).abs(),
        (sun_pos.declination - (-11.890)).abs() * 3600.0);
    println!("  Lon:  {:.3}° = {:.1} arcsec", 
        (sun_pos.longitude - 328.802).abs(),
        (sun_pos.longitude - 328.802).abs() * 3600.0);
    println!("  Dist: {:.0} km\n", (sun_pos.distance * 149597870.7 - 147862777.092).abs());
    
    // Check which is wrong - RA/Dec conversion or Longitude/Latitude?
    println!("DIAGNOSTIC:");
    
    // If Lon/Lat are wrong, the problem is in Jean Meeus
    // If RA/Dec are wrong but Lon/Lat are correct, problem is in conversion
    
    println!("  Longitude error: {:.3}°", (sun_pos.longitude - 328.802).abs());
    println!("  -> This is Jean Meeus VSOP87 (fundamental ephemeris)");
    println!();
    println!("  RA/Dec error from Lon/Lat: Need to check conversion");
    
    // Try to understand the discrepancy
    // VB6 uses: RA = 330.943° = 22h 03m 46s
    // Tauri uses: Different formula?
    
    println!();
    println!("HYPOTHESIS:");
    if (sun_pos.longitude - 328.802).abs() > 0.01 {
        println!("  ❌ Longitude is wrong - Check sun_meeus.rs Jean Meeus implementation");
    } else {
        println!("  ✅ Longitude is correct");
    }
    
    if (sun_pos.right_ascension - 330.943).abs() > 0.01 {
        println!("  ❌ RA calculation is wrong - Check ecliptic_to_equatorial conversion");
    } else {
        println!("  ✅ RA is correct");
    }
}
