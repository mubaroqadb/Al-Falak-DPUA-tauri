import { i18n } from '../services/i18n.js';

export class ModernCriteriaSelector extends HTMLElement {
  constructor() {
    super();
    this.selectedCriteria = 'MABIMS';
    this.i18n = i18n;
  }

  t(key, defaultValue = key) {
    if (this.i18n && this.i18n.t) {
      return this.i18n.t(key, defaultValue);
    }
    return defaultValue;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.setupLanguageChangeListener();
  }

  setupLanguageChangeListener() {
    window.addEventListener('language-changed', () => {
      this.render();
      this.setupEventListeners();
    });
  }

  render() {
    const criteria = [
      { id: 'MABIMS', name: 'MABIMS', icon: '🌙', desc: this.t('criteria.mabims_desc', 'Alt ≥ 3°, Elong ≥ 6.4°') },
      { id: 'Odeh', name: 'Odeh', icon: '🔭', desc: this.t('criteria.odeh_desc', 'Astronomical criteria') },
      { id: 'LFNU', name: 'LFNU', icon: '🕌', desc: this.t('criteria.lfnu_desc', 'Imkanur Rukyat NU') },
      { id: 'KHGT', name: 'KHGT', icon: '🌍', desc: this.t('criteria.khgt_desc', 'Alt ≥ 5°, Elong ≥ 8°') },
      { id: 'Turkey', name: 'Turkey', icon: '🌟', desc: this.t('criteria.turkey_desc', 'Alt ≥ 5°, Elong ≥ 8°') },
      { id: 'WujudulHilal', name: 'Wujudul Hilal', icon: '☪️', desc: this.t('criteria.wujudul_hilal_desc', 'Above horizon') }
    ];

    this.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="radiogroup" aria-label="Select Visibility Criteria">
        ${criteria.map(c => `
          <div class="card ${this.selectedCriteria === c.id ? 'bg-primary text-primary-content shadow-lg ring-2 ring-primary/50' : 'bg-base-100/50 hover:bg-base-100/80 hover:scale-[1.02] hover:shadow-md'} border border-base-content/5 cursor-pointer transition-all duration-300 criteria-card group backdrop-blur-sm" 
               data-criteria="${c.id}">
            <div class="card-body p-4 flex flex-row items-center gap-4">
              <div class="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">${c.icon}</div>
              <div class="flex-1 min-w-0">
                <div class="font-bold text-sm truncate">${c.name}</div>
                <div class="text-xs opacity-70 truncate">${c.desc}</div>
              </div>
              <div class="flex items-center">
                <input type="radio" name="criteria-radio" class="radio radio-primary radio-sm group-hover:scale-110 transition-transform" ${this.selectedCriteria === c.id ? 'checked' : ''} />
              </div>
            </div>
            <!-- Selection indicator effect -->
            ${this.selectedCriteria === c.id ? '<div class="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  setupEventListeners() {
    const cards = this.querySelectorAll('.criteria-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const criteria = card.dataset.criteria;
        this.selectCriteria(criteria);
      });
    });
  }

  selectCriteria(criteria) {
    this.selectedCriteria = criteria;
    this.render();
    this.setupEventListeners();
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('criteria-changed', {
      detail: { criteria },
      bubbles: true,
      composed: true
    }));
  }

  getSelectedCriteria() {
    return this.selectedCriteria;
  }
}

customElements.define('modern-criteria-selector', ModernCriteriaSelector);
