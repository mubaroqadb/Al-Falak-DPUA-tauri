// TauriStatusBanner.js - Visual indicator for Tauri context
import { isTauri } from '../services/api.js';

export class TauriStatusBanner extends HTMLElement {
  constructor() {
    super();
    this.checkStatus();
  }

  async checkStatus() {
    // Small delay to allow Tauri to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hasTauri = isTauri();
    
    if (!hasTauri) {
      this.showWarning();
    } else {
      this.showSuccess();
      // Auto-hide success message after 3 seconds
      setTimeout(() => this.remove(), 3000);
    }
  }

  showWarning() {
    this.innerHTML = `
      <div class="tauri-status-banner warning">
        <div class="banner-content">
          <span class="banner-icon">⚠️</span>
          <div class="banner-text">
            <strong>Mode Browser Terdeteksi</strong>
            <p>Aplikasi berjalan di browser, bukan Tauri window. Fitur backend tidak tersedia.</p>
            <p><small>Gunakan <code>npm run tauri dev</code> untuk menjalankan aplikasi lengkap, atau tutup tab browser dan gunakan window Tauri yang terbuka.</small></p>
          </div>
          <button class="banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      </div>
    `;
  }

  showSuccess() {
    this.innerHTML = `
      <div class="tauri-status-banner success">
        <div class="banner-content">
          <span class="banner-icon">✅</span>
          <div class="banner-text">
            <strong>Tauri Mode Aktif</strong>
            <p>Aplikasi berjalan dengan backend Rust.</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('tauri-status-banner', TauriStatusBanner);
