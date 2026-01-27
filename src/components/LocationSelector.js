// Location Selector Component
// Features: Searchable dropdown, VB6 city database integration, custom location registration

export class LocationSelector extends HTMLElement {
  constructor() {
    super();
    this.locations = [];
    this.customLocations = [];
    this.allCities = [];
    this.selectedCity = null;
    this.filteredCities = [];
    this.isDropdownOpen = false;
  }

  async connectedCallback() {
    await this.loadData();
    this.render();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      // 1. Load static database from VB6 extraction
      const response = await fetch('/locations.json');
      const data = await response.json();
      this.locations = data;

      // 2. Load custom locations from localStorage
      const saved = localStorage.getItem('alfalak_custom_locations');
      this.customLocations = saved ? JSON.parse(saved) : [];

      // 3. Flatten for easy searching
      this.allCities = [];
      
      // Process static data
      this.locations.forEach(country => {
        country.cities.forEach(city => {
          this.allCities.push({
            ...city,
            country: country.country,
            isCustom: false
          });
        });
      });

      // Process custom data
      this.customLocations.forEach(city => {
        this.allCities.push({
          ...city,
          isCustom: true
        });
      });

      // Default selection (Jakarta)
      this.selectedCity = this.allCities.find(c => c.name.toLowerCase() === 'jakarta') || this.allCities[0];
    } catch (error) {
      console.error('❌ Failed to load locations:', error);
    }
  }

  render() {
    if (!this.selectedCity) return;

    this.innerHTML = `
      <div class="space-y-4">
        <div class="relative w-full">
          <div class="join w-full">
            <div class="relative flex-1">
              <input type="text" id="city-search" 
                class="input input-bordered w-full join-item pr-10" 
                placeholder="Search city (e.g. Jakarta, London...)" 
                value="${this.selectedCity.name}" />
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 pointer-events-none">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button id="btn-register-location" class="btn btn-secondary join-item border-l-0" title="Register New Location">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Register
            </button>
          </div>

          <!-- Search Results Dropdown -->
          <ul id="city-results" class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-base-100 p-2 shadow-2xl border border-base-300 hidden">
            <!-- Results injected here -->
          </ul>
        </div>

        <!-- Selected Location Details (Compact Ref) -->
        <div class="bg-base-200/50 rounded-xl p-3 border border-base-300 grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
          <div class="flex flex-col">
            <span class="opacity-50 font-mono uppercase tracking-wider font-bold">Country</span>
            <span class="font-bold truncate">${this.selectedCity.country || 'Custom'}</span>
          </div>
          <div class="flex flex-col">
            <span class="opacity-50 font-mono uppercase tracking-wider font-bold">Latitude</span>
            <span class="font-bold font-mono text-primary">${this.selectedCity.lat.toFixed(4)}°</span>
          </div>
          <div class="flex flex-col">
            <span class="opacity-50 font-mono uppercase tracking-wider font-bold">Longitude</span>
            <span class="font-bold font-mono text-secondary">${this.selectedCity.lon.toFixed(4)}°</span>
          </div>
          <div class="flex flex-col">
            <span class="opacity-50 font-mono uppercase tracking-wider font-bold">Timezone</span>
            <span class="font-bold">UTC${this.selectedCity.tz >= 0 ? '+' : ''}${this.selectedCity.tz}</span>
          </div>
        </div>
      </div>

      <!-- Registration Modal -->
      <dialog id="modal-register-city" class="modal">
        <div class="modal-box max-w-sm">
          <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
            <svg class="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Register New City
          </h3>
          <form id="form-register-city" class="space-y-3">
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs">City Name</span></label>
              <input type="text" name="name" required class="input input-sm input-bordered" placeholder="e.g. Sukabumi" />
            </div>
            <div class="form-control">
              <label class="label p-1"><span class="label-text text-xs">Country</span></label>
              <input type="text" name="country" class="input input-sm input-bordered" placeholder="Indonesia" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="form-control">
                <label class="label p-1"><span class="label-text text-xs">Latitude</span></label>
                <input type="number" step="0.0001" name="lat" required class="input input-sm input-bordered" placeholder="-6.9" />
              </div>
              <div class="form-control">
                <label class="label p-1"><span class="label-text text-xs">Longitude</span></label>
                <input type="number" step="0.0001" name="lon" required class="input input-sm input-bordered" placeholder="106.9" />
              </div>
            </div>
             <div class="grid grid-cols-2 gap-2">
              <div class="form-control">
                <label class="label p-1"><span class="label-text text-xs">Timezone</span></label>
                <input type="number" step="0.5" name="tz" required class="input input-sm input-bordered" value="7" />
              </div>
              <div class="form-control">
                <label class="label p-1"><span class="label-text text-xs">Elevation (m)</span></label>
                <input type="number" name="elev" class="input input-sm input-bordered" value="0" />
              </div>
            </div>
            <div class="modal-action mt-6 gap-2">
              <button type="button" class="btn btn-ghost btn-sm" id="btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save Location</button>
            </div>
          </form>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    `;
  }

  setupEventListeners() {
    const searchInput = this.querySelector('#city-search');
    const resultsUl = this.querySelector('#city-results');
    const registerBtn = this.querySelector('#btn-register-location');
    const modal = this.querySelector('#modal-register-city');
    const closeModalBtn = this.querySelector('#btn-close-modal');
    const registerForm = this.querySelector('#form-register-city');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (query.length < 2) {
        resultsUl.classList.add('hidden');
        return;
      }

      this.filteredCities = this.allCities
        .filter(c => c.name.toLowerCase().includes(query) || (c.country && c.country.toLowerCase().includes(query)))
        .slice(0, 10);

      if (this.filteredCities.length > 0) {
        resultsUl.innerHTML = this.filteredCities.map((city, idx) => `
          <li class="p-2 cursor-pointer hover:bg-primary hover:text-primary-content rounded-lg transition-colors flex items-center gap-3 group" data-index="${idx}">
            <div class="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center group-hover:bg-primary-content/20">
              ${city.isCustom ? '👤' : '📍'}
            </div>
            <div class="flex-1">
              <div class="font-bold text-sm">${city.name}</div>
              <div class="text-[10px] opacity-60">${city.country || 'Custom Location'}</div>
            </div>
            <div class="text-[9px] font-mono opacity-50">${city.lat.toFixed(1)}, ${city.lon.toFixed(1)}</div>
          </li>
        `).join('');
        resultsUl.classList.remove('hidden');
      } else {
        resultsUl.classList.add('hidden');
      }
    });

    resultsUl.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) {
        const index = li.dataset.index;
        this.selectCity(this.filteredCities[index]);
        resultsUl.classList.add('hidden');
      }
    });

    // Handle clicks outside to close dropdown
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        resultsUl.classList.add('hidden');
      }
    });

    // Registration Logic
    registerBtn.addEventListener('click', () => modal.showModal());
    closeModalBtn.addEventListener('click', () => modal.close());

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const newCity = {
        name: formData.get('name'),
        country: formData.get('country'),
        lat: parseFloat(formData.get('lat')),
        lon: parseFloat(formData.get('lon')),
        tz: parseFloat(formData.get('tz')),
        elev: parseFloat(formData.get('elev')) || 0,
        isCustom: true
      };

      this.addCustomLocation(newCity);
      modal.close();
      registerForm.reset();
    });
  }

  selectCity(city) {
    this.selectedCity = city;
    this.render();
    this.setupEventListeners();
    
    // Dispatch event for components like app.js
    this.dispatchEvent(new CustomEvent('city-changed', {
      detail: { city },
      bubbles: true,
      composed: true
    }));
  }

  addCustomLocation(city) {
    this.customLocations.push(city);
    localStorage.setItem('alfalak_custom_locations', JSON.stringify(this.customLocations));
    
    // Update city list and select the new one
    this.allCities.push(city);
    this.selectCity(city);
  }

  getSelectedLocation() {
    return this.selectedCity;
  }
}

customElements.define('location-selector', LocationSelector);
