// Language Switcher Component
// Allows users to change application language

import { i18n } from '../services/i18n.js';

export class LanguageSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupLanguageChangeListener();
  }

  render() {
    const currentLang = i18n.getLanguage();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --switch-bg: rgba(255, 255, 255, 0.2);
          --switch-active-bg: rgba(255, 255, 255, 0.95);
          --switch-active-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .language-switcher {
          display: flex;
          gap: 6px;
          background: var(--switch-bg);
          border-radius: 12px;
          padding: 4px;
          width: fit-content;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .lang-btn {
          padding: 6px 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 8px;
          font-size: 1.5rem; /* Large flags */
          line-height: 1;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.6;
          filter: grayscale(0.8); /* Muted by default */
          transform: scale(0.9);
        }

        .lang-btn:hover {
          opacity: 1;
          filter: grayscale(0);
          background: rgba(255,255,255,0.2);
          transform: scale(1.05);
        }

        .lang-btn.active {
          opacity: 1;
          filter: grayscale(0);
          background: var(--switch-active-bg);
          box-shadow: var(--switch-active-shadow);
          transform: scale(1.1);
        }

        /* RTL Support */
        :host([dir="rtl"]) .language-switcher {
          flex-direction: row-reverse;
        }
      </style>

      <div class="language-switcher" role="tablist" aria-label="Language Selection">
        <button 
          class="lang-btn ${currentLang === 'en' ? 'active' : ''}" 
          data-lang="en"
          role="tab"
          aria-selected="${currentLang === 'en'}"
          title="English"
        >
          🇬🇧
        </button>
        <button 
          class="lang-btn ${currentLang === 'id' ? 'active' : ''}" 
          data-lang="id"
          role="tab"
          aria-selected="${currentLang === 'id'}"
          title="Bahasa Indonesia"
        >
          🇮🇩
        </button>
        <button 
          class="lang-btn ${currentLang === 'ar' ? 'active' : ''}" 
          data-lang="ar"
          role="tab"
          aria-selected="${currentLang === 'ar'}"
          title="العربية"
        >
          🇸🇦
        </button>
      </div>
    `;
    
    // Critical: Re-attach listeners because innerHTML replaced the elements
    this.setupEventListeners();
  }

  setupEventListeners() {
    const buttons = this.shadowRoot.querySelectorAll('.lang-btn');
    console.log(`🎯 LanguageSwitcher: Setting up ${buttons.length} button listeners`);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        console.log(`🖱️ LanguageSwitcher: Button clicked for language '${lang}'`);
        i18n.setLanguage(lang);

        // Update UI
        buttons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Dispatch custom event for app to listen
        console.log(`📢 LanguageSwitcher: Dispatching 'language-changed' event for '${lang}'`);
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { language: lang } }));
      });
    });
  }

  setupLanguageChangeListener() {
    window.addEventListener('language-changed', (event) => {
      console.log(`🔄 LanguageSwitcher: Language changed to ${event.detail.language}, re-rendering`);
      this.render();
    });
  }
}

customElements.define('language-switcher', LanguageSwitcher);
