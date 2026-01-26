// More detailed sun debug
use tauri_app_lib::*;

fn main() {
    let sunset_jd = 2461089.970208;
    
    let date = calendar::jd_to_gregorian(sunset_jd);
    let jce = astronomy::sun_vb6::ymd2jce(date.year, date.month, date.day);
    let tau = jce / 10.0;
    
    println!("Date: {}-{:02}-{:.2}", date.year, date.month, date.day);
    println!("JCE: {:.12}", jce);
    println!("Tau: {:.12}\n", tau);
    
    // Raw sums
    let l0 = astronomy::sun_meeus::jm_l0(tau);
    let l1 = astronomy::sun_meeus::jm_l1(tau);
    let l2 = astronomy::sun_meeus::jm_l2(tau);
    let l3 = astronomy::sun_meeus::jm_l3(tau);
    let l4 = astronomy::sun_meeus::jm_l4(tau);
    let l5 = astronomy::sun_meeus::jm_l5(tau);
    
    println!("L0: {:.2}", l0);
    println!("L1: {:.2}", l1);
    println!("L1 * tau: {:.2}", l1 * tau);
    println!("L2: {:.2}", l2);
    println!("L2 * tau^2: {:.2}", l2 * tau.powi(2));
    
    // Calculate step by step
    let step1 = l0;
    println!("\nAfter L0: {:.2}", step1);
    
    let step2 = step1 + l1 * tau;
    println!("After L1*tau: {:.2}", step2);
    println!("Contribution: {:.2}", l1 * tau);
    
    let step3 = step2 + l2 * tau.powi(2);
    println!("After L2*tau^2: {:.2}", step3);
    println!("Contribution: {:.2}", l2 * tau.powi(2));
    
    // Check: what should these be?
    // For Feb 18, 2026, sun longitude should be ~328.802°
    // Which in radians is 328.802 * π/180 ≈ 5.738 rad
    // Times 10^8 would be 573800000
    
    println!("\nExpected: ~573800000 (for 328.802° in rad*10^8)");
    println!("Actual step3: {:.2}", step3);
    println!("Difference: {:.2}", (step3 - 573800000.0).abs());
}
