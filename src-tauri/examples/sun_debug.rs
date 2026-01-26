// Debug sun position calculation step by step
use tauri_app_lib::*;

fn main() {
    let sunset_jd = 2461089.970208;
    
    println!("JD: {:.12}\n", sunset_jd);
    
    // Step 1: Convert to gregorian
    let date = calendar::jd_to_gregorian(sunset_jd);
    println!("Gregorian Date: {}-{:02}-{:.2}", date.year, date.month, date.day);
    
    // Step 2: Calculate JCE
    let jce = astronomy::sun_vb6::ymd2jce(date.year, date.month, date.day);
    println!("JCE: {:.12}", jce);
    
    // Step 3: Get tau
    let tau = jce / 10.0;
    println!("Tau (JCE/10): {:.12}\n", tau);
    
    // Step 4: Get Jean Meeus components
    println!("Jean Meeus L0-L5 (radians * 10^8):");
    println!("  JM_L0: {:.0}", astronomy::sun_meeus::jm_l0(tau));
    println!("  JM_L1: {:.0}", astronomy::sun_meeus::jm_l1(tau));
    println!("  JM_L2: {:.0}", astronomy::sun_meeus::jm_l2(tau));
    println!("  JM_L3: {:.0}", astronomy::sun_meeus::jm_l3(tau));
    println!("  JM_L4: {:.0}", astronomy::sun_meeus::jm_l4(tau));
    println!("  JM_L5: {:.0}", astronomy::sun_meeus::jm_l5(tau));
    
    // Calculate raw theta
    let theta_raw = astronomy::sun_meeus::jm_l0(tau)
        + astronomy::sun_meeus::jm_l1(tau) * tau
        + astronomy::sun_meeus::jm_l2(tau) * tau.powi(2)
        + astronomy::sun_meeus::jm_l3(tau) * tau.powi(3)
        + astronomy::sun_meeus::jm_l4(tau) * tau.powi(4)
        + astronomy::sun_meeus::jm_l5(tau) * tau.powi(5);
    
    println!("\nRaw Theta Sum: {:.0}", theta_raw);
    
    let theta_rad = theta_raw / 100000000.0;
    println!("Theta in Radians: {:.12}", theta_rad);
    
    let theta_deg = 180.0 + theta_rad.to_degrees();
    println!("Theta in Degrees (180 + rad2deg): {:.6}", theta_deg);
    
    // This should be around 328.80° for Feb 18
    println!("\nVB6 Reference: 328.802°");
    println!("Error: {:.6}°\n", (theta_deg - 328.802).abs());
}
