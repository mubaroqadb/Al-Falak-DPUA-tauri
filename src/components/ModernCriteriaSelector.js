// Modern Criteria Selector Component - DaisyUI Version
// Visual card-based criteria selection with DaisyUI styling

export class ModernCriteriaSelector extends HTMLElement {
  constructor() {
    super();
    this.selectedCriteria = 'MABIMS';
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const criteria = [
      { id: 'MABIMS', name: 'MABIMS', icon: '🌙', desc: 'Alt ≥ 3°, Elong ≥ 6.4°' },
      { id: 'ODEH', name: 'Odeh', icon: '🔭', desc: 'Astronomical criteria' },
      { id: 'LFNU', name: 'LFNU', icon: '🕌', desc: 'Imkanur Rukyat NU' },
      { id: 'TURKEY', name: 'Turkey', icon: '🌟', desc: 'Alt ≥ 5°, Elong ≥ 8°' },
      { id: 'Wujudul_Hilal', name: 'Wujudul Hilal', icon: '☪️', desc: 'Muhammadiyah' }
    ];

    this.innerHTML = `
      <div class="space-y-2">
        ${criteria.map(c => `
          <div class="card ${this.selectedCriteria === c.id ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'} cursor-pointer transition-all duration-200 criteria-card" 
               data-criteria="${c.id}">
            <div class="card-body p-3 flex-row items-center gap-3">
              <div class="text-2xl">${c.icon}</div>
              <div class="flex-1">
                <div class="font-bold text-sm">${c.name}</div>
                <div class="text-xs opacity-70">${c.desc}</div>
              </div>
              <div class="flex items-center">
                <input type="radio" name="criteria-radio" class="radio radio-primary radio-sm" ${this.selectedCriteria === c.id ? 'checked' : ''} />
              </div>
            </div>
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
