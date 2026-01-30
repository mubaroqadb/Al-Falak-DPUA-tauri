# Al-Falak-DPUA

Aplikasi Hisab Rukyat Hilal berbasis Tauri untuk perhitungan awal bulan Hijriah.


## Deskripsi

Aplikasi ini menggunakan algoritma astronomi untuk menghitung posisi Matahari dan Bulan, serta menerapkan berbagai kriteria rukyat hilal untuk menentukan awal bulan Hijriah.

## Screenshots

Berikut adalah beberapa tangkapan layar dari aplikasi:

![Halaman Utama](src/assets/Dokumentasi/Screenshot%202026-01-27%20at%2011.48.38.png)
*Halaman utama aplikasi dengan menu navigasi.*

![Multi Bahasa](src/assets/Dokumentasi/Screenshot%202026-01-27%20at%2011.49.09.png)
*Interface bahasa arab.*

![Hasil Perhitungan](src/assets/Dokumentasi/Screenshot%202026-01-27%20at%2012.45.32.png)
*Hasil perhitungan kriteria rukyat hilal.*

![Pengaturan Mode](src/assets/Dokumentasi/Screenshot%202026-01-27%20at%2011.50.37.png)
*Mode gelap.*

[Lihat Dokumentasi Lengkap](./src/assets/Dokumentasi/)

## Download

Unduh versi terbaru aplikasi:

- **macOS (ARM64)**: [Al Falak DPUA_2.0.0_aarch64.dmg](https://github.com/mubaroqadb/Al-Falak-DPUA-tauri/raw/main/src-tauri/target/release/bundle/dmg/Al%20Falak%20DPUA_2.0.0_aarch64.dmg)
- **Windows (x64)**: [Al Falak DPUA_2.0.0_x64-setup.exe](https://github.com/mubaroqadb/Al-Falak-DPUA-tauri/raw/main/src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/Al%20Falak%20DPUA_2.0.0_x64-setup.exe)

## Teknologi

- **Frontend**: Vanilla JavaScript ES6+, HTML, CSS
- **Backend**: Rust dengan Tauri 2.0
- **Astronomi**: Algoritma Meeus dan validasi terhadap VB6

## Fitur

- Perhitungan posisi Matahari dan Bulan yang presisi.
- Implementasi berbagai kriteria rukyat hilal (MABIMS, Wujudul Hilal, dll.).
- **Dukungan Hari Pasaran Jawa** (Legi, Pahing, Pon, Wage, Kliwon) di seluruh output data.
- **Konversi Kalender Hijriah Terpadu** menggunakan algoritma *Civil Hijri (Tabular)* yang robust.
- Visualisasi peta lokasi dan kurva visibilitas.
- Dukungan multi-bahasa (Indonesia, English, Arabic).
- Validasi ketat terhadap hasil referensi VB6.
- Label zona waktu dinamis (WIB, WITA, WIT) berdasarkan offset lokasi.

## Perbedaan Algoritma & Formula (Tauri vs VB6)

Analisis ini membedah perbedaan fundamental antara aplikasi **Al Falak DPUA-tauri** terbaru dengan versi **VB6** (Legacy). Secara garis besar, Tauri dibangun sebagai "Super-Symmetric Port" yang meniru logika VB6, namun dengan **peningkatan pada sisi ketelitian numerik dan arsitektur modern**.

---

## 1. Perbedaan Fondasi Arsitektur

| Aspek | Al Falak (VB6) | Al Falak DPUA (Tauri) |
| :--- | :--- | :--- |
| **Teknologi Frontend**| VB6 Form (Desktop) | Vanilla HTML/JS (WebView) |
| **Backend Core** | Visual Basic 6.0 Runtime | Rust dengan Tauri 2.0 |
| **Tipe Data Numerik** | `Double` (64-bit Float) | `f64` (64-bit IEEE 754) |
| **Kalender & Pasaran** | Masehi & Hijriah | Masehi, Hijriah, & Pasaran Jawa |
| **Algoritma Konjungsi**| Geosentrik (Meeus Series) | Toposentrik (Newton-Raphson Iteration) |
| **Eksekusi & Modul** | Single-threaded (VB6) | Multi-threaded (Rust Modules) |

---

## 2. Perbedaan Algoritma Utama

### 1. High-Fidelity VB6 Parity
Untuk menjaga kepercayaan pengguna terhadap hasil hisab tradisional, implementasi backend Rust menggunakan mode kepatuhan logic yang ketat terhadap kode sumber VB6 asli:
- **VSOP87 64-Term Truncation**: Menyamai presisi VB6 `JeanMeeus` yang membatasi suku perturbasi matahari untuk sinkronisasi hasil.
- **Piecewise Delta T**: Mengimplementasikan formula Delta T bertahap dari Meeus (1991) sesuai logic VB6 `Astro` (mencakup rentang tahun <500 SM hingga >2000 M).
- **Refraction-Parallax Sequence**: Mengikuti urutan koreksi di VB6 `Transformasi` (Refraksi Airy diterapkan pada *Apparent Altitude* sebelum koreksi Parallaks), berbeda dengan urutan standar IAU namun identik dengan referensi.
- **Moon scaling bug fix**: Menyamai perlakuan nilai `SigmaL` di VB6 `PosisiBulan` di mana pembagian konstanta (1.000.000) dilakukan pada nilai derajat sebelum konversi radian.

### 2. Kalender Hijriah & Pasaran Jawa
- **Penanggalan Hijriah**: Menggunakan algoritma aritmatik Civil Hijri (Kuwaiti) dengan konstanta hari `354.367056` yang identik dengan VB6 `Calendar_Conversion`.
- **Siklus Pasaran**: Implementasi formula `(JD + 0.5) mod 5` untuk menentukan hari pasaran (Legi, Pahing, Pon, Wage, Kliwon) secara akurat sesuai tradisi Jawa.

### 3. Topocentric Conjunction & MABIMS
- **Topocentric Iteration**: Peningkatan dari ijtima' geosentrik standar menjadi pencarian konjungsi berbasis pengamat lokal (*topocentric*) menggunakan iterasi Newton-Raphson untuk akurasi konvergensi waktu yang lebih tinggi.
- **Kriteria MABIMS Baru**: Implementasi kriteria MABIMS Baru (Tinggi 3°, Elongasi 6.4°) berbasis parameter toposentrik (Altitude & Elongation) yang telah divalidasi silang dengan subrutin `MabimsVisibility` pada VB6.

### 4. Metodologi Perhitungan Konjungsi (Ijtimak)

#### 4.1 Pendekatan Numerik vs Tabular

| Aspek | VB6 (Jean Meeus) | Tauri (Modern) |
|-------|------------------|----------------|
| **Metode** | Tabular/Analitik (Mean Motion) | Numerik (Ephemeris + Newton-Raphson) |
| **Estimasi Awal** | `nilai_JDE()`: Rumus mean lunar motion | `estimate_conjunction_time()`: Fase bulan |
| **Refinement** | Iterasi ±10 hari dengan koreksi tabular | Newton-Raphson pada posisi ephemeris |
| **Target** | Pencarian bulan konjungsi | `Longitude Difference = 0` |
| **Akurasi** | ±1-2 arcminute | Sub-arcsecond (dengan model akurat) |

#### 4.2 Mengapa Newton-Raphson pada Longitude Difference?

1. **Masalah Elongasi**: Elongasi (jarak sudut) jarang mencapai tepat 0° karena Bulan memiliki latitude ekliptik non-nol. Minimum elongasi adalah sudut inklinasi orbit (~5°), bukan 0°.

2. **Solusi Longitude Difference**: Dengan mencari saat ketika **selisih longitude** (L_bulan - L_matahari) = 0, kita menemukan titik konjungsi yang tepat.

3. **Formulasi Matematis**:
   ```
   f(JD) = Longitude_Bulan(JD) - Longitude_Matahari(JD)
   Newton-Raphson: JD_new = JD_old - f(JD_old) / f'(JD_old)
   ```

4. **Handling NaN**: Saat derivatif mendekati 0 (titik kritis), algoritma fallback menggunakan step ±0.01 hari untuk melewati area tersebut.

#### 4.3 Validasi
- 55 test cases lulus
- Perbandingan VB6: Selisih Moon Altitude < 0.06°, Elongation < 0.05°

---

> [!IMPORTANT]
> **Kesimpulan:** Perbedaan utama bukan terletak pada "rumus mana yang dipakai" (karena keduanya berbasis Jean Meeus), melainkan pada **ketelitian eksekusi** (Numerics) dan **penanganan bug-paralaks** yang ada pada versi lama yang kini telah distandarisasi di versi Tauri.


## Setup Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Install Dependencies

```bash
npm install
```

### Run Development

```bash
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
