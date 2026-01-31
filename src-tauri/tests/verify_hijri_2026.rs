use tauri_app_lib::{calendar, criteria, GeoLocation, GregorianDate};

#[test]
fn verify_hijri_dates_2026_mabims() {
    // Coordinates for Jakarta (Reference for MABIMS Indonesia)
    let location = GeoLocation {
        name: Some("Jakarta".to_string()),
        latitude: -6.1751,
        longitude: 106.8650,
        elevation: 10.0,
        timezone: 7.0,
    };

    // User provided dates (Target: 1st of Hijri Month)
    let test_cases = vec![
        // (Year, Month, Day, HijriYear, HijriMonthName)
        (2026, 1, 20, 1447, "Sya'ban"),
        (2026, 2, 19, 1447, "Ramadhan"),
        (2026, 3, 21, 1447, "Syawal"),
        (2026, 4, 19, 1447, "DzulQo'dah"),
        (2026, 5, 18, 1447, "Dzulhijjah"),
        (2026, 6, 17, 1448, "Muharram"),
        (2026, 7, 16, 1448, "Safar"),
        (2026, 8, 14, 1448, "Rabiul Awal"),
        (2026, 9, 13, 1448, "Rabiul Akhir"),
        (2026, 10, 12, 1448, "Jumadil Ula"),
        (2026, 11, 11, 1448, "Jumadil Tsani"), // Fix: User date likely needs checking
        (2026, 12, 11, 1448, "Rajab"),
        (2027, 1, 9, 1448, "Sya'ban"),
    ];

    println!("\n=== Hijri Verification 2026 (MABIMS Baru: 3°/6.4°) ===\n");
    let mut failures = 0;

    for (g_year, g_month, g_day, h_year, h_month_name) in test_cases {
        // To verify if "g_day" is the 1st of the month, we check the sunset of the previous day.
        // If visible on (g_day - 1) sunset -> 1st is g_day.
        // If NOT visible on (g_day - 1) sunset -> 1st is g_day + 1. (Mismatch)
        // Also check (g_day - 2) sunset. If visible there, then 1st was g_day - 1. (Mismatch)

        // Check Observation Date = Target Date - 1
        let target_date = GregorianDate {
            year: g_year,
            month: g_month,
            day: g_day as f64,
        };
        let target_jd = calendar::gregorian_to_jd(&target_date);

        let observation_jd = target_jd - 1.0;
        let obs_date = calendar::jd_to_gregorian(observation_jd);

        // Calculate Conjunction (approximate search backward from observation)
        // In a real app we'd use a better search, but here we can just ensure we have the correct conjunction
        // For simplicity in test, let's rely on criteria evaluating at sunset vs conjunction
        // The evaluate_new_mabims needs conjunction JD.

        // Find nearest conjunction before observation sunset
        let sunset_hour = tauri_app_lib::astronomy::calculate_sunset(&location, &obs_date);
        let sunset_jd_obs = observation_jd + (sunset_hour - location.timezone) / 24.0;

        let sunset_date = calendar::jd_to_gregorian(sunset_jd_obs);
        let conjunction = tauri_app_lib::astronomy::conjunction::find_conjunction(&sunset_date);

        let result = criteria::evaluate_new_mabims(&location, conjunction.jd_utc, sunset_jd_obs);

        println!(
            "Target 1 {}: {} {} {} (Check sunset {})",
            h_month_name,
            g_day,
            month_str(g_month),
            g_year,
            obs_date.day as u8
        );
        println!(
            "  -> Alt: {:.2}°, Elong: {:.2}°, Age: {:.2}h, Visible: {}",
            result.moon_altitude,
            result.geocentric_elongation,
            result.moon_age_hours,
            result.is_visible
        );

        if result.is_visible {
            println!(
                "  [PASS] Moon visible on eve of {}. 1st is {}.",
                g_day, g_day
            );
        } else {
            println!(
                "  [FAIL] Moon NOT visible on eve of {}. 1st should be {}.",
                g_day,
                g_day + 1
            );
            // Check if it was visible the day BEFORE (meaning date is late)
            let prev_obs_jd = observation_jd - 1.0;
            let prev_sunset_jd = prev_obs_jd + (sunset_hour - location.timezone) / 24.0; // approx
            let prev_sunset_date = calendar::jd_to_gregorian(prev_sunset_jd);
            let prev_conj =
                tauri_app_lib::astronomy::conjunction::find_conjunction(&prev_sunset_date);
            let prev_res =
                criteria::evaluate_new_mabims(&location, prev_conj.jd_utc, prev_sunset_jd);

            if prev_res.is_visible {
                println!(
                    "    (Actually visible on prev day, so 1st was {} - 1)",
                    g_day
                );
            }

            failures += 1;
        }
        println!("--------------------------------------------------");
    }

    if failures > 0 {
        panic!("{} test cases failed!", failures);
    }
}

fn month_str(m: u8) -> &'static str {
    match m {
        1 => "Jan",
        2 => "Feb",
        3 => "Mar",
        4 => "Apr",
        5 => "May",
        6 => "Jun",
        7 => "Jul",
        8 => "Aug",
        9 => "Sep",
        10 => "Oct",
        11 => "Nov",
        12 => "Dec",
        _ => "?",
    }
}
