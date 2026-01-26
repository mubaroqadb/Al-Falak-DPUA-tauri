# Al-Falak-DPUA-tauri

Aplikasi Hisab Rukyat Hilal berbasis Tauri untuk perhitungan awal bulan Hijriah.

<<<<<<< HEAD
![Screenshot](src/assets/Dokumentasi/Screenshot%202026-01-27%20at%2000.19.23.png)
=======
(src/assets/Dokumentasi/Screenshot 2026-01-27 at 00.19.23.png)
>>>>>>> 913385306c7dc48aca4c8c25b70e2ba8e3a43964

## Deskripsi

Aplikasi ini menggunakan algoritma astronomi untuk menghitung posisi Matahari dan Bulan, serta menerapkan berbagai kriteria rukyat hilal untuk menentukan awal bulan Hijriah.

## Teknologi

- **Frontend**: Vanilla JavaScript ES6+, HTML, CSS
- **Backend**: Rust dengan Tauri
- **Astronomi**: Algoritma Meeus dan validasi terhadap VB6

## Fitur

- Perhitungan posisi Matahari dan Bulan
- Implementasi berbagai kriteria rukyat hilal (MABIMS, Wujudul Hilal, dll.)
- Visualisasi peta lokasi
- Dukungan multi-bahasa (Indonesia, English, Arabic)
- Validasi terhadap hasil VB6

## Perbedaan Algoritma & Formula (Tauri vs VB6)

Analisis ini membedah perbedaan fundamental antara aplikasi **Al Falak DPUA-tauri** terbaru dengan versi **VB6** (Legacy). Secara garis besar, Tauri dibangun sebagai "Super-Symmetric Port" yang meniru logika VB6, namun dengan **peningkatan pada sisi ketelitian numerik dan arsitektur modern**.

---

## 1. Perbedaan Fondasi Arsitektur

| Aspek | Al Falak (VB6) | Al Falak DPUA (Tauri) |
| :--- | :--- | :--- |
| **Bahasa Pemrograman** | Visual Basic 6.0 (Legacy) | Rust (Backend) + React (Frontend) |
| **Tipe Data Numerik** | `Double` (64-bit Float) | `f64` (64-bit IEEE 754) |
| **Eksekusi** | Single-threaded (Satu per satu) | Multi-threaded (Paralel) |
| **Modularitas** | Module `.bas` dengan variabel global | Struct & Function yang murni (State-less) |

---

## 2. Perbedaan Algoritma Utama

### A. Posisi Matahari (VSOP87 Truncation)
Meskipun keduanya menggunakan teori VSOP87, terdapat perbedaan pada jumlah suku yang diambil:
- **VB6:** Menggunakan pemangkasan 64 suku (Jean Meeus version). Ini dipilih untuk kecepatan komputer tahun 90-an.
- **Tauri:** Memiliki mode **"Legacy Parity"** yang menggunakan 64 suku yang sama persis (`sun_vb6.rs`), namun juga mendukung presisi penuh jika dibutuhkan.

### B. Posisi Bulan (Jean Meeus Chapter 47)
Terdapat perbaikan krusial pada kode Rust (`lunar_position.rs`) terkait cara penanganan angka desimal:
- **Fix Discrepancy:** Di VB6, pembagian konstanta (per satu juta) sering dilakukan pada nilai derajat sebelum dikonversi ke radian. Beberapa pustaka modern (seperti `astro-rust` lama) melakukan pembagian *setelah* radian, yang menyebabkan selisih di digit ke-8. Tauri mengikuti cara VB6 untuk menjamin angka hasil "Hisab" tetap sama.

### C. Delta T (Koreksi Waktu)
Delta T adalah selisih antara waktu dinamis (TDT) dan waktu universal (UT).
- **VB6:** Menggunakan formula piecewise (potong-potong) dari buku Jean Meeus edisi lama.
- **Tauri:** Mengimplementasikan ulang formula piecewise VB6 tersebut secara harfiah agar hasil Ijtima' tidak bergeser satu detik pun dari hasil lama.

---

## 3. Logika Ephemeris yang "Unik" (Symmetry Fixes)

Ada beberapa algoritma di Tauri yang dibuat "salah secara astronomi modern" tetapi "benar secara VB6" demi menjaga konsistensi:

1.  **Urutan Refraksi & Paralaks:** 
    - Secara astronomi murni: Paralaks dihitung dahulu, baru Refraksi.
    - **Tauri mengikuti VB6:** Menghitung Refraksi pada tinggi pusat piringan (center) dahulu, baru mengoreksi Paralaks. Hal ini penting karena VB6 menggunakan "Apparent Geocentric Altitude" sebagai basis perhitungan paralaks.
2.  **Iterasi Ijtima' (Conjunction):**
    - **VB6:** Sering menggunakan interpolasi linear sederhana antara dua jam.
    - **Tauri:** Menggunakan metode **Brent's Method** atau **Newton-Raphson** untuk mencari titik nol selisih bujur Matahari dan Bulan. Hasilnya lebih presisi hingga $\pm 0.1$ detik.

---

## 4. Keunggulan Teknis Versi Tauri

Meskipun secara formula "meniru" VB6, versi Tauri menang dalam hal:
1.  **Type Safety:** Di VB6, kesalahan unit (derajat vs radian) sering tidak terdeteksi hingga terjadi error saat runtime. Di Rust, ini dijaga ketat oleh compiler.
2.  **Topocentric Refinement:** Tauri menghitung posisi toposentrik secara langsung dari koordinat ekliptika (Jean Meeus Chapter 39 & 40), meminimalisir akumulasi error pembulatan yang terjadi di VB6 saat konversi berkali-kali dari Equator ke Horizon.
3.  **Algoritma Kontemporer:** Penambahan kriteria **MABIMS Baru** (3-6.4) yang dihitung secara dinamis dengan algoritma ArcV (Arc of Vision) yang lebih akurat.

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
