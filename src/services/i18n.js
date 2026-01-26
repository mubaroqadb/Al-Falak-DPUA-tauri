// Simple i18n Manager
// Lightweight internationalization without external dependencies

class I18nManager {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
    this.fallbackLanguage = 'en';
    this.rtlLanguages = ['ar'];
  }

  // Load translations from JSON files
  async loadTranslations(languages = ['en', 'id']) {
    try {
      for (const lang of languages) {
        const url = `/i18n/${lang}.json`;
        console.log(`🔄 i18n: Attempting to load ${lang} from ${url}`);
        const response = await fetch(url);
        console.log(`📡 i18n: Fetch response for ${lang}:`, response.status, response.statusText);
        if (response.ok) {
          this.translations[lang] = await response.json();
          console.log(`✅ i18n: Successfully loaded ${lang} translations (${Object.keys(this.translations[lang]).length} keys)`);
        } else {
          console.warn(`⚠️ i18n: Failed to load ${lang} translations - Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('❌ i18n: Error loading translations:', error);
    }
  }

  // Set current language
  setLanguage(lang) {
    console.log(`🌐 i18n: setLanguage called with '${lang}'`);
    if (this.translations[lang]) {
      this.currentLanguage = lang;
      this.applyLanguageToDOM(lang);
      localStorage.setItem('app-language', lang);
      console.log(`✅ i18n: Language changed to: ${lang} (RTL: ${this.isRTL()})`);
    } else {
      console.warn(`⚠️ i18n: Language '${lang}' not available. Available: ${Object.keys(this.translations).join(', ')}`);
    }
  }

  // Get current language
  getLanguage() {
    return this.currentLanguage;
  }

  // Get translated string using dot notation
  // Example: t('labels.date') returns "📅 Calculation Date" (EN) or "📅 Tanggal Perhitungan" (ID)
  t(key, defaultValue = key) {
    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  }

  // Get all translations for current language
  getAll() {
    return this.translations[this.currentLanguage] || {};
  }

  // Check if language is RTL
  isRTL() {
    return this.rtlLanguages.includes(this.currentLanguage);
  }

  // Apply language to document direction and element translations
  applyLanguageToDOM(lang) {
    console.log(`🔄 i18n: Applying language '${lang}' to DOM`);
    const isRTL = this.rtlLanguages.includes(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    console.log(`📝 i18n: Set document lang='${lang}', dir='${isRTL ? 'rtl' : 'ltr'}'`);

    // Update all data-i18n attributes
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`🔍 i18n: Found ${elements.length} elements with data-i18n attributes`);
    elements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key, key);
      console.log(`📝 i18n: Translating '${key}' → '${translation}'`);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('data-i18n-placeholder')) {
          el.placeholder = translation;
        } else {
          el.value = translation;
        }
      } else {
        el.textContent = translation;
      }
    });

    // Update data-i18n-attr attributes (for attributes like title, placeholder, etc.)
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const attr = el.getAttribute('data-i18n-attr');
      const key = el.getAttribute('data-i18n');
      if (attr && key) {
        const translation = this.t(key, key);
        el.setAttribute(attr, translation);
      }
    });
  }

  // Initialize i18n (load translations and set initial language)
  async init() {
    // Load translations
    await this.loadTranslations(['en', 'id', 'ar']);

    // Get saved language or use default
    const savedLanguage = localStorage.getItem('app-language') || 'en';
    this.setLanguage(savedLanguage);

    return this;
  }
}

// Create global instance
export const i18n = new I18nManager();

// Shorthand function for translations
export function t(key, defaultValue = key) {
  return i18n.t(key, defaultValue);
}
