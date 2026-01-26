# Al-Falak-DPUA-tauri

Aplikasi Hisab Rukyat Hilal berbasis Tauri untuk perhitungan awal bulan Hijriah.

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
