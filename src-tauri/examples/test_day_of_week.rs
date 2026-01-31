// Test untuk memeriksa day of week calculation
// Menguji format_jd_to_datetime dan get_hari_indo

use tauri_app_lib::*;

fn main() {
    println!("╔═══════════════════════════════════════════════════════════════════╗");
    println!("║     TEST: Day of Week Calculation                                 ║");
    println!("╚═══════════════════════════════════════════════════════════════════╝\n");

    // Test case: 18 Februari 2026
    let date_feb18 = GregorianDate {
        year: 2026,
        month: 2,
        day: 18.0,
    };

    // Test case: 17 Februari 2026
    let date_feb17 = GregorianDate {
        year: 2026,
        month: 2,
        day: 17.0,
    };

    // Konversi ke JD
    let jd_feb18 = calendar::gregorian_to_jd(&date_feb18);
    let jd_feb17 = calendar::gregorian_to_jd(&date_feb17);

    println!("JD for Feb 18, 2026 (start of day): {}", jd_feb18);
    println!("JD for Feb 17, 2026 (start of day): {}", jd_feb17);
    println!("Difference: {} days\n", jd_feb18 - jd_feb17);

    // Test get_hari_indo
    println!("=== Testing get_hari_indo ===");
    println!(
        "Feb 18, 2026: {}",
        calendar::javanese::get_hari_indo(jd_feb18)
    );
    println!(
        "Feb 17, 2026: {}",
        calendar::javanese::get_hari_indo(jd_feb17)
    );

    // Test format_jd_to_datetime dengan timezone UTC+7
    let timezone = 7.0;
    println!("\n=== Testing format_jd_to_datetime (UTC+7) ===");

    // Test dengan JD yang sama (start of day)
    println!("\nStart of day:");
    let formatted_feb18 = astronomy::ephemeris_utils::format_jd_to_datetime(jd_feb18, timezone);
    let formatted_feb17 = astronomy::ephemeris_utils::format_jd_to_datetime(jd_feb17, timezone);
    println!("Feb 18, 2026: {}", formatted_feb18);
    println!("Feb 17, 2026: {}", formatted_feb17);

    // Test dengan JD yang berbeda (menambahkan jam)
    println!("\nWith different times:");
    let jd_feb18_12pm = jd_feb18 + 0.5; // 12:00 UTC
    let jd_feb18_7pm = jd_feb18 + (12.0 / 24.0); // 12:00 UTC = 19:00 UTC+7
    let jd_feb17_7pm = jd_feb17 + (12.0 / 24.0); // 12:00 UTC = 19:00 UTC+7

    let formatted_feb18_12pm =
        astronomy::ephemeris_utils::format_jd_to_datetime(jd_feb18_12pm, timezone);
    let formatted_feb18_7pm =
        astronomy::ephemeris_utils::format_jd_to_datetime(jd_feb18_7pm, timezone);
    let formatted_feb17_7pm =
        astronomy::ephemeris_utils::format_jd_to_datetime(jd_feb17_7pm, timezone);

    println!("Feb 18, 2026 12:00 UTC: {}", formatted_feb18_12pm);
    println!("Feb 18, 2026 19:00 UTC+7: {}", formatted_feb18_7pm);
    println!("Feb 17, 2026 19:00 UTC+7: {}", formatted_feb17_7pm);

    // Test dengan conjunction time (misalnya sekitar 19:03 UTC+7 pada 17 Feb 2026)
    // VB6 reference: 2461088.970384
    let vb6_conjunction_jd = 2461088.970384;
    println!("\n=== VB6 Conjunction Reference ===");
    println!("VB6 JD: {}", vb6_conjunction_jd);
    let formatted_vb6 =
        astronomy::ephemeris_utils::format_jd_to_datetime(vb6_conjunction_jd, timezone);
    println!("Formatted: {}", formatted_vb6);

    // Calculate day of week manually
    println!("\n=== Manual Day of Week Calculation ===");
    println!("Formula: ((jd + 1.5) % 7.0).floor() as usize");
    println!(
        "Feb 18 JD: {} -> dow index: {}",
        jd_feb18,
        ((jd_feb18 + 1.5) % 7.0).floor() as usize
    );
    println!(
        "Feb 17 JD: {} -> dow index: {}",
        jd_feb17,
        ((jd_feb17 + 1.5) % 7.0).floor() as usize
    );
    println!(
        "VB6 JD: {} -> dow index: {}",
        vb6_conjunction_jd,
        ((vb6_conjunction_jd + 1.5) % 7.0).floor() as usize
    );

    // Day names array
    let day_names = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    println!("\nDay names array: {:?}", day_names);
    println!("Index 0 = Sunday, Index 2 = Tuesday");

    // Expected: Feb 18, 2026 adalah Rabu (Wednesday)
    // Expected: Feb 17, 2026 adalah Selasa (Tuesday)
    println!("\n=== Expected Results ===");
    println!("Feb 18, 2026 should be Wednesday (Rabu)");
    println!("Feb 17, 2026 should be Tuesday (Selasa)");
}
