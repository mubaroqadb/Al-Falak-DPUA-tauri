class ThemeToggle extends HTMLElement {
  constructor() {
    super();
    this.currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  connectedCallback() {
    this.render();
    this.updateIcon();
    this.setupEventListener();
  }

  setupEventListener() {
    const button = this.querySelector('button');
    if (button) {
      button.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.currentTheme);
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateIcon();
    
    // Dispatch event for other components if needed
    this.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: this.currentTheme },
      bubbles: true,
      composed: true
    }));
  }

  updateIcon() {
    const sunIcon = this.querySelector('.sun-icon');
    const moonIcon = this.querySelector('.moon-icon');
    
    if (this.currentTheme === 'dark') {
      // Dark mode active: Show Sun icon (to switch to light)
      sunIcon?.classList.remove('rotate-90', 'scale-0', 'opacity-0');
      sunIcon?.classList.add('rotate-0', 'scale-100', 'opacity-100');
      
      moonIcon?.classList.add('-rotate-90', 'scale-0', 'opacity-0');
      moonIcon?.classList.remove('rotate-0', 'scale-100', 'opacity-100');
    } else {
      // Light mode active: Show Moon icon (to switch to dark)
      sunIcon?.classList.add('rotate-90', 'scale-0', 'opacity-0');
      sunIcon?.classList.remove('rotate-0', 'scale-100', 'opacity-100');
      
      moonIcon?.classList.remove('-rotate-90', 'scale-0', 'opacity-0');
      moonIcon?.classList.add('rotate-0', 'scale-100', 'opacity-100');
    }
  }

  render() {
    this.innerHTML = `
      <button class="btn btn-ghost btn-circle theme-toggle-btn relative overflow-hidden" aria-label="Toggle theme">
        <!-- Sun Icon (shown in dark mode) -->
        <svg class="sun-icon w-6 h-6 absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
        <!-- Moon Icon (shown in light mode) -->
        <svg class="moon-icon w-6 h-6 absolute transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    `;
  }
}

customElements.define('theme-toggle', ThemeToggle);
