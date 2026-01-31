// Test script for Hijri to Gregorian conversion
// Run with: node test-hijri-conversion.js

// Expected results from user:
const expectedResults = [
  { hijri: { year: 1447, month: 7, day: 1 }, gregorian: { year: 2026, month: 1, day: 20 }, name: "Sya'ban 1447 H" },
  { hijri: { year: 1447, month: 9, day: 1 }, gregorian: { year: 2026, month: 2, day: 19 }, name: "Ramadhan 1447 H" },
  { hijri: { year: 1447, month: 10, day: 1 }, gregorian: { year: 2026, month: 3, day: 21 }, name: "Syawal 1447 H" },
  { hijri: { year: 1447, month: 11, day: 1 }, gregorian: { year: 2026, month: 4, day: 19 }, name: "DzulQo'dah 1447 H" },
  { hijri: { year: 1447, month: 12, day: 1 }, gregorian: { year: 2026, month: 5, day: 18 }, name: "Dzulhijjah 1447 H" },
  { hijri: { year: 1448, month: 1, day: 1 }, gregorian: { year: 2026, month: 6, day: 17 }, name: "Muharram 1448 H" },
  { hijri: { year: 1448, month: 2, day: 1 }, gregorian: { year: 2026, month: 7, day: 16 }, name: "Safar 1448 H" },
  { hijri: { year: 1448, month: 3, day: 1 }, gregorian: { year: 2026, month: 8, day: 14 }, name: "Rabiul Awal 1448 H" },
  { hijri: { year: 1448, month: 4, day: 1 }, gregorian: { year: 2026, month: 9, day: 13 }, name: "Rabiul Akhir 1448 H" },
  { hijri: { year: 1448, month: 5, day: 1 }, gregorian: { year: 2026, month: 10, day: 12 }, name: "Jumadil Ula 1448 H" },
  { hijri: { year: 1448, month: 6, day: 1 }, gregorian: { year: 2026, month: 11, day: 11 }, name: "Jumadil Tsani 1448 H" },
  { hijri: { year: 1448, month: 7, day: 1 }, gregorian: { year: 2026, month: 12, day: 11 }, name: "Rajab 1448 H" },
  { hijri: { year: 1448, month: 8, day: 1 }, gregorian: { year: 2027, month: 1, day: 9 }, name: "Sya'ban 1448 H" }
];

console.log('='.repeat(80));
console.log('TEST KONVERSI HIJRI KE MASEHI');
console.log('='.repeat(80));
console.log();

let passed = 0;
let failed = 0;

for (const test of expectedResults) {
  console.log(`\nTesting: ${test.name}`);
  console.log(`  Hijri: ${test.hijri.year}-${String(test.hijri.month).padStart(2, '0')}-${String(test.hijri.day).padStart(2, '0')}`);
  console.log(`  Expected Gregorian: ${test.gregorian.year}-${String(test.gregorian.month).padStart(2, '0')}-${String(test.gregorian.day).padStart(2, '0')}`);

  try {
    // Call the Tauri backend API
    const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
    if (!invoke) {
      console.log('  ❌ ERROR: Tauri API not available. Run this test in Tauri context.');
      failed++;
      continue;
    }

    const result = await invoke('hijri_to_gregorian_command', {
      year: test.hijri.year,
      month: test.hijri.month,
      day: test.hijri.day
    });

    const actualYear = result.year;
    const actualMonth = result.month;
    const actualDay = result.day;

    console.log(`  Actual Gregorian:   ${actualYear}-${String(actualMonth).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`);

    // Check if result matches expected
    const yearMatch = actualYear === test.gregorian.year;
    const monthMatch = actualMonth === test.gregorian.month;
    const dayMatch = actualDay === test.gregorian.day;

    if (yearMatch && monthMatch && dayMatch) {
      console.log('  ✅ PASS');
      passed++;
    } else {
      console.log('  ❌ FAIL');
      if (!yearMatch) console.log(`     Year mismatch: expected ${test.gregorian.year}, got ${actualYear}`);
      if (!monthMatch) console.log(`     Month mismatch: expected ${test.gregorian.month}, got ${actualMonth}`);
      if (!dayMatch) console.log(`     Day mismatch: expected ${test.gregorian.day}, got ${actualDay}`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    failed++;
  }
}

console.log();
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total tests: ${expectedResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success rate: ${((passed / expectedResults.length) * 100).toFixed(1)}%`);
console.log('='.repeat(80));
