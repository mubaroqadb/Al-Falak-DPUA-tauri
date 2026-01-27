class AboutModal extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  open() {
    this.isOpen = true;
    const overlay = this.querySelector('.modal-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    document.body.style.overflow = 'hidden';
    
    // Animate content
    const content = this.querySelector('.modal-content');
    content.classList.remove('scale-95', 'opacity-0');
    content.classList.add('scale-100', 'opacity-100');
  }

  close() {
    this.isOpen = false;
    const overlay = this.querySelector('.modal-overlay');
    const content = this.querySelector('.modal-content');
    
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
      document.body.style.overflow = '';
    }, 200);
  }

  setupEventListeners() {
    this.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.closest('.close-btn')) {
        this.close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    });
  }

  render() {
    this.innerHTML = `
      <div class="modal-overlay fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm hidden transition-all duration-300">
        <div class="modal-content glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl transition-all duration-300 transform scale-95 opacity-0 border border-base-content/10 bg-base-100/95">
          <div class="relative">
            <!-- Header with Gradient Area -->
            <div class="bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 p-8 pt-10 border-b border-base-content/5">
              <button class="close-btn absolute top-6 right-6 btn btn-circle btn-ghost btn-sm hover:rotate-90 transition-transform duration-300">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div class="flex flex-col items-center text-center gap-4 mb-2">
                 <div class="relative group">
                   <div class="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                   <img src="/src/assets/logo.png" alt="Logo" class="relative w-20 h-20 rounded-2xl shadow-xl border border-white/20" />
                 </div>
                 <div>
                    <h2 class="text-3xl font-black tracking-tight text-base-content" data-i18n="aboutDetails.title">About Al Falak DPUA</h2>
                    <div class="flex items-center justify-center gap-2 mt-1">
                      <span class="badge badge-primary badge-sm font-bold" data-i18n="aboutDetails.version">Version 2.0.0</span>
                      <span class="badge badge-ghost badge-sm opacity-50">STABLE</span>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Main Content Body -->
            <div class="p-8 pt-6">
              <p class="text-base leading-relaxed text-base-content/80 mb-10 text-center max-w-lg mx-auto" data-i18n="aboutDetails.description">
                Al Falak DPUA is a high-precision astronomical calculation tool developed to assist the Islamic community in hilal visibility prediction and prayer time scheduling.
              </p>

              <!-- Features & Tech Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <!-- Features Card -->
                <div class="bg-base-200/40 p-6 rounded-3xl border border-base-content/5 transition-all duration-300 hover:shadow-md hover:bg-base-200/60">
                  <h3 class="font-bold text-xs uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-primary/10">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span data-i18n="aboutDetails.coreFeatures">Core Features</span>
                  </h3>
                  <ul class="space-y-3.5">
                    <li class="flex items-start gap-3 group">
                      <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0"></div>
                      <span class="text-sm font-medium text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.feature1">Multi-criteria Hilal assessment</span>
                    </li>
                    <li class="flex items-start gap-3 group">
                      <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0"></div>
                      <span class="text-sm font-medium text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.feature2">Interactive visibility maps</span>
                    </li>
                    <li class="flex items-start gap-3 group">
                      <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0"></div>
                      <span class="text-sm font-medium text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.feature3">Precision prayer times</span>
                    </li>
                    <li class="flex items-start gap-3 group">
                      <div class="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0"></div>
                      <span class="text-sm font-medium text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.feature4">Detailed astronomical data</span>
                    </li>
                  </ul>
                </div>

                <!-- Tech Card -->
                <div class="bg-base-200/40 p-6 rounded-3xl border border-base-content/5 transition-all duration-300 hover:shadow-md hover:bg-base-200/60">
                  <h3 class="font-bold text-xs uppercase tracking-[0.2em] text-secondary mb-6 flex items-center gap-3">
                    <div class="p-2 rounded-xl bg-secondary/10">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                    </div>
                    <span>Technology</span>
                  </h3>
                  <div class="space-y-5">
                    <p class="text-sm font-medium text-base-content/80 leading-relaxed" data-i18n="aboutDetails.techStack">Built with Rust, Tauri, and Modern Web Standards</p>
                    <div class="flex flex-wrap gap-2 pt-2">
                      <span class="badge badge-ghost border-base-content/10 font-black text-[9px] tracking-widest px-3 py-3">RUST</span>
                      <span class="badge badge-ghost border-base-content/10 font-black text-[9px] tracking-widest px-3 py-3">TAURI</span>
                      <span class="badge badge-ghost border-base-content/10 font-black text-[9px] tracking-widest px-3 py-3">JS/ESM</span>
                      <span class="badge badge-ghost border-base-content/10 font-black text-[9px] tracking-widest px-3 py-3">VITE</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Academic References Section -->
              <div class="mb-10">
                <h3 class="font-bold text-xs uppercase tracking-[0.2em] text-base-content/40 mb-6 flex items-center gap-3">
                  <div class="p-2 rounded-xl bg-base-content/5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <span data-i18n="aboutDetails.referencesTitle">Academic References</span>
                </h3>
                
                <div class="grid grid-cols-1 gap-6">
                  <!-- Modern References (Full Width Now) -->
                  <div class="space-y-4">
                    <h4 class="text-[10px] font-black tracking-widest text-secondary/70 uppercase pl-1" data-i18n="aboutDetails.refModern">Modern Standards & Data</h4>
                    <div class="bg-base-200/30 rounded-2xl p-6 border border-base-content/5">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center gap-3 group">
                          <div class="w-1.5 h-1.5 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors"></div>
                          <span class="text-xs font-semibold text-base-content/70 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.modern1">Ephemeris Hisab Rukyat</span>
                        </div>
                        <div class="flex items-center gap-3 group">
                          <div class="w-1.5 h-1.5 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors"></div>
                          <span class="text-xs font-semibold text-base-content/70 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.modern2">MABIMS 2021 Criteria</span>
                        </div>
                        <div class="flex items-center gap-3 group">
                          <div class="w-1.5 h-1.5 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors"></div>
                          <span class="text-xs font-semibold text-base-content/70 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.modern3">Jean Meeus - Astronomical Algorithms</span>
                        </div>
                        <div class="flex items-center gap-3 group">
                          <div class="w-1.5 h-1.5 rounded-full bg-secondary/30 group-hover:bg-secondary transition-colors"></div>
                          <span class="text-xs font-semibold text-base-content/70 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.modern4">IMCCE - Institut de Mécanique Céleste</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Scientific Theory (Full width below) -->
                <div class="mt-6">
                  <h4 class="text-[10px] font-black tracking-widest text-base-content/40 uppercase pl-1 mb-4" data-i18n="aboutDetails.refScientific">Scientific Theories & Algorithms</h4>
                  <div class="bg-gradient-to-br from-base-200/50 to-base-300/30 rounded-2xl p-6 border border-base-content/5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div class="flex items-start gap-4 group">
                        <div class="mt-1 w-2 h-2 rounded bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                        <div class="space-y-1">
                          <p class="text-xs font-bold text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.algo1">VSOP87 Planetary Theory</p>
                          <p class="text-[10px] text-base-content/40 font-medium">Variations Séculaires des Orbites Planétaires</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-4 group">
                        <div class="mt-1 w-2 h-2 rounded bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                        <div class="space-y-1">
                          <p class="text-xs font-bold text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.algo2">ELP 2000 Lunar Theory</p>
                          <p class="text-[10px] text-base-content/40 font-medium">Éphéméride Lunaire Parisienne</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-4 group">
                        <div class="mt-1 w-2 h-2 rounded bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                        <div class="space-y-1">
                          <p class="text-xs font-bold text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.algo3">IAU 2000 Models</p>
                          <p class="text-[10px] text-base-content/40 font-medium">Nutation & Coordinate Systems</p>
                        </div>
                      </div>
                      <div class="flex items-start gap-4 group">
                        <div class="mt-1 w-2 h-2 rounded bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                        <div class="space-y-1">
                          <p class="text-xs font-bold text-base-content/80 group-hover:text-base-content transition-colors" data-i18n="aboutDetails.algo4">Delta T (ΔT) Models</p>
                          <p class="text-[10px] text-base-content/40 font-medium">Earth Rotation Variations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Special Thanks Section -->
              <div class="relative overflow-hidden bg-gradient-to-br from-base-200 to-base-300/50 p-8 rounded-[2rem] border border-base-content/5 mb-10 text-center">
                 <div class="absolute -top-10 -right-10 opacity-5">
                    <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                 </div>
                 <h3 class="text-lg font-black mb-3 text-base-content flex items-center justify-center gap-2" data-i18n="aboutDetails.thanksTitle">
                   Special Thanks
                 </h3>
                 <p class="text-base-content/70 italic text-sm leading-relaxed max-w-md mx-auto" data-i18n="aboutDetails.thanksContent">
                   Special thanks to all astronomical researchers and organizations providing the mathematical models and datasets used in this application.
                 </p>
              </div>

              <!-- Footer info -->
              <div class="text-center pt-6 border-t border-base-content/5">
                <p class="text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase mb-2" data-i18n="aboutDetails.developedBy">Developed by DPUA Research Team</p>
                <div class="flex items-center justify-center gap-4 text-[9px] text-base-content/30 tracking-widest font-bold">
                   <span>INDONESIA 2026</span>
                   <span>•</span>
                   <span>LICENSE: PROPRIETARY</span>
                   <span>•</span>
                   <span>AL FALAK DPUA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('about-modal', AboutModal);
