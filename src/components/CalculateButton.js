// Floating Calculate Button Component - DaisyUI Version
// Modern floating action button with DaisyUI styling

export class CalculateButton extends HTMLElement {
  constructor() {
    super();
    this.isCalculating = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }
  render() {
    this.innerHTML = `
      <button class="btn btn-primary btn-lg gap-2 fixed bottom-8 right-8 shadow-2xl z-50 transition-all duration-300 hover:scale-105 active:scale-95" id="fab-calculate">
        <svg class="w-6 h-6 fab-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span class="fab-text font-bold">CALCULATE</span>
        <span class="loading loading-spinner loading-md fab-loading hidden"></span>
      </button>
    `;
  }

  setupEventListeners() {
    const button = this.querySelector('#fab-calculate');
    if (button) {
      button.addEventListener('click', () => this.handleClick());
    }
  }

  handleClick() {
    if (this.isCalculating) return;
    
    // Dispatch calculate event
    const event = new CustomEvent('fab-calculate', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  setCalculating(calculating) {
    this.isCalculating = calculating;
    const button = this.querySelector('#fab-calculate');
    const icon = this.querySelector('.fab-icon');
    const text = this.querySelector('.fab-text');
    const loading = this.querySelector('.fab-loading');
    
    if (calculating) {
      button.classList.add('pointer-events-none', 'cursor-wait');
      button.classList.remove('animate-pulse');
      // Keep button primary color but slightly transparent
      button.style.opacity = '0.9'; 
      
      icon.classList.add('hidden');
      text.textContent = 'Calculating...';
      loading.classList.remove('hidden');
    } else {
      button.classList.remove('pointer-events-none', 'cursor-wait');
      button.style.opacity = '1';
      icon.classList.remove('hidden');
      text.textContent = 'CALCULATE';
      loading.classList.add('hidden');
    }
  }
}

customElements.define('calculate-button', CalculateButton);
