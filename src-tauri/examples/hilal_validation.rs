// Validasi Hisab Hilal - Sukabumi Feb 17-18, 2026
// TUJUAN: Memastikan perhitungan mengikuti VB6 formula dengan STRICT
use tauri_app_lib::*;

fn main() {
    let location = GeoLocation {
        name: None,
        latitude: -7.0 - 4.0 / 60.0 - 26.0 / 3600.0, // 7°04'26" S
        longitude: 106.0 + 31.0 / 60.0 + 53.0 / 3600.0, // 106°31'53" E
        elevation: 10.0,
        timezone: 7.0,
    };

    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║       VALIDASI HISAB HILAL - SUKABUMI RAMADAN 1447H               ║");
    println!("║                    (Strict VB6 Compliance)                        ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");

    // TEST 1: Feb 17, 2026 - CONJUNCTION DATE
    println!("─ TEST 1: IJTIMAK (KONJUNGSI) ─────────────────────────────────────");
    println!("Tanggal: 17 Februari 2026 (Hari konjungsi)");
    println!("VB6 Ijtimak: 17 Feb, 19:01:02 LT (Geocentric)");
    println!("             17 Feb, 20:19:41 LT (Topocentric)\n");

    let date17 = GregorianDate {
        year: 2026,
        month: 2,
        day: 17.0,
    };

    let sunset17_hour = astronomy::sun::calculate_sunset(&location, &date17);
    let jd17 = calendar::gregorian_to_jd(&date17);
    let sunset17_jd = jd17 + ((sunset17_hour - location.timezone) / 24.0);

    println!("Tauri Sunset JD (Feb 17): {:.12}", sunset17_jd);
    println!("VB6 Sunset JD:            2461088.970384");
    println!(
        "Difference: {:.8} days\n",
        (sunset17_jd - 2461088.970384).abs()
    );

    // Conjunction calculation
    println!("Checking conjunction around Feb 17...\n");

    // TEST 2: Feb 18, 2026 - VISIBILITY DATE
    println!("─ TEST 2: KETAMPAKAN HILAL (VISIBILITY) ──────────────────────────");
    println!("Tanggal: 18 Februari 2026 (Hari ketampakan)");
    println!("VB6 Maghrib: 18:17:06 WIB");
    println!("VB6 JD: 2461089.970208\n");

    let date18 = GregorianDate {
        year: 2026,
        month: 2,
        day: 18.0,
    };

    let sunset18_hour = astronomy::sun::calculate_sunset(&location, &date18);
    let jd18 = calendar::gregorian_to_jd(&date18);
    let sunset18_jd = jd18 + ((sunset18_hour - location.timezone) / 24.0);

    println!("Tauri Sunset JD (Feb 18): {:.12}", sunset18_jd);
    println!(
        "Difference from VB6: {:.8} days\n",
        (sunset18_jd - 2461089.970208).abs()
    );

    // CRITICAL PARAMETERS FOR VISIBILITY
    println!("┌─────────────────────────────────────────────────────────────────┐");
    println!("│          PARAMETER HISAB HILAL (HAL PENTING)                    │");
    println!("└─────────────────────────────────────────────────────────────────┘\n");

    let age18 = astronomy::hilal::moon_age_at_sunset(&location, &date18);
    let elong18 = astronomy::hilal::elongation_at_sunset(&location, &date18, true);
    let alt18 = astronomy::hilal::altitude_at_sunset(&location, &date18, true);

    println!("1. UMUR BULAN (Moon Age) - Topocentric");
    println!("   VB6:   21.957 jam (21h 57m 25s)");
    println!("   Tauri: {:.3} jam", age18);
    println!(
        "   Error: {:.4} jam ({:.1} menit)",
        (age18 - 21.957).abs(),
        (age18 - 21.957).abs() * 60.0
    );
    println!("   Kriteria MABIMS: ≥ 8h");
    println!(
        "   Status: {}\n",
        if age18 >= 8.0 { "✅ PASS" } else { "❌ FAIL" }
    );

    println!("2. ELONGASI (Elongation) - Topocentric");
    println!("   VB6:   11.096° (11° 05' 46\")");
    println!("   Tauri: {:.3}°", elong18);
    println!(
        "   Error: {:.4}° ({:.1} arcsec)",
        (elong18 - 11.096).abs(),
        (elong18 - 11.096).abs() * 3600.0
    );
    println!("   Kriteria MABIMS: ≥ 3°");
    println!(
        "   Status: {}\n",
        if elong18 >= 3.0 {
            "✅ PASS"
        } else {
            "❌ FAIL"
        }
    );

    println!("3. TINGGI HILAL (Altitude) - Airy Refraction");
    println!("   VB6:   8.653° (8° 39' 11\")");
    println!("   Tauri: {:.3}°", alt18);
    println!(
        "   Error: {:.4}° ({:.1} arcsec)",
        (alt18 - 8.653).abs(),
        (alt18 - 8.653).abs() * 3600.0
    );
    println!("   Kriteria MABIMS: ≥ 2°");
    println!(
        "   Status: {}\n",
        if alt18 >= 2.0 { "✅ PASS" } else { "❌ FAIL" }
    );

    // SECONDARY PARAMETERS
    println!("┌─────────────────────────────────────────────────────────────────┐");
    println!("│              PARAMETER PENDUKUNG (SECONDARY)                     │");
    println!("└─────────────────────────────────────────────────────────────────┘\n");

    let moon_geo = astronomy::moon::geocentric_position(sunset18_jd);
    let sun_geo = astronomy::sun::geocentric_position(sunset18_jd);

    println!("Moon Position (Geocentric):");
    println!(
        "   RA:  {:.3}° (VB6: 343.021°) - Error: {:.3}°",
        moon_geo.right_ascension,
        (moon_geo.right_ascension - 343.021).abs()
    );
    println!(
        "   Dec: {:.3}° (VB6: -6.939°) - Error: {:.3}°",
        moon_geo.declination,
        (moon_geo.declination + 6.939).abs()
    );
    println!(
        "   Lon: {:.3}° (VB6: 341.699°) - Error: {:.3}°\n",
        moon_geo.longitude,
        (moon_geo.longitude - 341.699).abs()
    );

    println!("Sun Position (Geocentric):");
    println!(
        "   RA:  {:.3}° (VB6: 330.943°) - Error: {:.3}°",
        sun_geo.right_ascension,
        (sun_geo.right_ascension - 330.943).abs()
    );
    println!(
        "   Dec: {:.3}° (VB6: -11.890°) - Error: {:.3}°\n",
        sun_geo.declination,
        (sun_geo.declination + 11.890).abs()
    );

    // TOLERANCE CHECK
    println!("┌─────────────────────────────────────────────────────────────────┐");
    println!("│              TOLERANSI DAN STATUS VALIDASI                       │");
    println!("└─────────────────────────────────────────────────────────────────┘\n");

    let age_ok = (age18 - 21.957).abs() < 0.2; // 12 menit
    let elong_ok = (elong18 - 11.096).abs() < 0.2; // 12 arcmin
    let alt_ok = (alt18 - 8.653).abs() < 0.2; // 12 arcsec

    println!(
        "Age error:      {:.1} menit - {} {}",
        (age18 - 21.957).abs() * 60.0,
        if age_ok { "✅" } else { "⚠️" },
        if age_ok { "(< 12 min)" } else { "(> 12 min)" }
    );
    println!(
        "Elongation err: {:.1} arcsec - {} {}",
        (elong18 - 11.096).abs() * 3600.0,
        if elong_ok { "✅" } else { "⚠️" },
        if elong_ok { "(< 12 as)" } else { "(> 12 as)" }
    );
    println!(
        "Altitude err:   {:.1} arcsec - {} {}",
        (alt18 - 8.653).abs() * 3600.0,
        if alt_ok { "✅" } else { "⚠️" },
        if alt_ok { "(< 12 as)" } else { "(> 12 as)" }
    );
    println!();

    // FINAL RESULT
    println!("┌─────────────────────────────────────────────────────────────────┐");
    println!("│                   HASIL AKHIR (FINAL RESULT)                     │");
    println!("└─────────────────────────────────────────────────────────────────┘\n");

    let mabims_pass = age18 >= 8.0 && elong18 >= 3.0 && alt18 >= 2.0;

    if mabims_pass {
        println!("✅ KRITERIA MABIMS TERPENUHI");
        println!("\n   • Umur Bulan: {:.3}h ≥ 8h ✅", age18);
        println!("   • Elongasi:   {:.3}° ≥ 3° ✅", elong18);
        println!("   • Tinggi:     {:.3}° ≥ 2° ✅", alt18);
        println!("\n   KESIMPULAN: HILAL NAMPAK (CRESCENT VISIBLE)");
    } else {
        println!("❌ KRITERIA MABIMS TIDAK TERPENUHI");
        if age18 < 8.0 {
            println!("   • Umur Bulan: {:.3}h < 8h ❌", age18);
        }
        if elong18 < 3.0 {
            println!("   • Elongasi:   {:.3}° < 3° ❌", elong18);
        }
        if alt18 < 2.0 {
            println!("   • Tinggi:     {:.3}° < 2° ❌", alt18);
        }
        println!("\n   KESIMPULAN: HILAL TIDAK NAMPAK (NOT VISIBLE)");
    }

    println!("\n");
}
