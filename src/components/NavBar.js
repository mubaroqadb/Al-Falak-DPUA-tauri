class NavBar extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <nav class="bg-white border-b border-gray-200">
        <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex items-center shrink-0">
                <span class="text-xl font-bold text-gray-800">Al Falak DPUA</span>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-indigo-500">
                  Hilal Visibility
                </a>
                <a href="#" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700">
                  Prayer Times
                </a>
                <a href="#" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700">
                  Qibla
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    `;
  }
}

customElements.define('nav-bar', NavBar);
