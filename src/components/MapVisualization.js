// Map Visualization Web Component
// Handles interactive map display with Leaflet

export class MapVisualization extends HTMLElement {
  constructor() {
    super();
    this.map = null;
    this.visibilityLayers = [];
    this.prayerTimeLayers = [];
    this.markers = [];

    // Bind methods
    this.handleMapClick = this.handleMapClick.bind(this);
    this.handleLocationSelect = this.handleLocationSelect.bind(this);
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="map-visualization">
        <div id="map" class="map-container"></div>
        <div class="map-controls">
          <div class="map-control-group">
            <button id="clear-markers" title="Clear all markers">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
            <button id="fit-bounds" title="Fit to data">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="layer-controls" id="layer-controls" style="display: none;">
          <h4>Map Layers</h4>
          <div class="layer-item">
            <input type="checkbox" id="visibility-layer" class="layer-checkbox" checked>
            <label for="visibility-layer" class="layer-label">Visibility Zones</label>
          </div>
          <div class="layer-item">
            <input type="checkbox" id="prayer-layer" class="layer-checkbox" checked>
            <label for="prayer-layer" class="layer-label">Prayer Times</label>
          </div>
        </div>
      </div>
    `;

    // Delay map initialization to ensure DOM is ready and Leaflet is loaded
    setTimeout(() => {
      this.initMap();
      this.setupEventListeners();
    }, 100);
  }

  disconnectedCallback() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  initMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.error('❌ Leaflet library not loaded');
      return;
    }

    // Initialize Leaflet map
    const mapElement = this.querySelector('#map');
    if (!mapElement) {
      console.error('❌ Map element not found');
      return;
    }

    try {
      // Set default view to Jakarta/Indonesia
      this.map = L.map(mapElement, {
        center: [-6.2, 106.816666],
        zoom: 5,
        zoomControl: true,
        attributionControl: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        minZoom: 2
      }).addTo(this.map);

      // Add scale control
      L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
      }).addTo(this.map);

      // Force map to refresh its size
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);

      console.log('✅ Map initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }

  setupEventListeners() {
    if (!this.map) return;

    // Map click handler
    this.map.on('click', this.handleMapClick);

    // Control button handlers
    const clearBtn = this.querySelector('#clear-markers');
    const fitBtn = this.querySelector('#fit-bounds');

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearMarkers());
    }

    if (fitBtn) {
      fitBtn.addEventListener('click', () => this.fitToData());
    }
  }

  handleMapClick(event) {
    const { lat, lng } = event.latlng;

    // Create marker at clicked location
    const marker = L.marker([lat, lng]).addTo(this.map);

    // Add popup with coordinates
    marker.bindPopup(`
      <b>Location Selected</b><br>
      Latitude: ${lat.toFixed(6)}<br>
      Longitude: ${lng.toFixed(6)}<br>
      <button onclick="this.closest('.leaflet-popup').remove()">Select This Location</button>
    `).openPopup();

    // Store marker
    this.markers.push(marker);

    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('location-selected', {
      detail: {
        location: {
          latitude: lat,
          longitude: lng,
          elevation: 0, // Default elevation
          timezone: this.calculateTimezone(lng)
        }
      },
      bubbles: true
    }));
  }

  handleLocationSelect() {
    // Handle location selection from popup
    console.log('📍 Location selected');
  }

  // Render visibility zones using specialized Canvas overlay for scientific fidelity
  // Render visibility zones using Asynchronous Time-Slicing (Chunked Rendering)
  async renderVisibilityZones(visibilityData) {
    console.log('🎨 Rendering high-fidelity visibility zones (Async):', visibilityData ? visibilityData.length : 0);

    this.clearVisibilityLayers();

    if (!visibilityData || visibilityData.length === 0) return;

    // Standard AHC palette (Translucent for scientific overlay feel)
    const colors = {
      4: { color: 'rgba(50, 205, 50, 0.4)', label: 'A: Easily Visible' },
      3: { color: 'rgba(255, 0, 255, 0.4)', label: 'B: Visible with Aid' },
      2: { color: 'rgba(0, 255, 255, 0.4)', label: 'C: Optical Aid Required' },
      1: { color: 'rgba(65, 105, 225, 0.4)', label: 'D: Difficult' },
      0: { color: 'rgba(220, 20, 60, 0.15)', label: 'E: Impossible' }
    };

    // Use Canvas renderer to eliminate seams/gaps between segments
    // Padding ensures tiles render slightly outside viewport for smoothness during pan
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const layerGroup = L.layerGroup().addTo(this.map);
    this.visibilityLayers.push(layerGroup);

    // Performance Tuning:
    // Batch size determines how many zones to draw before yielding.
    // Too small = overhead from yielding. Too large = UI jank.
    // 100-200 is usually a sweet spot for simple rectangles on desktop.
    const BATCH_SIZE = 150; 
    let processedIndex = 0;

    // Helper: Promisified RequestAnimationFrame for clean yielding
    const yieldToBrowser = () => new Promise(resolve => requestAnimationFrame(resolve));

    // Update legend immediately so user sees what keys mean
    this.updateLegend(colors);

    // Chunked Processing Loop
    while (processedIndex < visibilityData.length) {
      const batchEnd = Math.min(processedIndex + BATCH_SIZE, visibilityData.length);
      
      // Process current batch
      for (let i = processedIndex; i < batchEnd; i++) {
        const zone = visibilityData[i];
        
        // Safety check for invalid coords
        if (isNaN(zone.latitude) || isNaN(zone.longitude_start)) continue;

        const step = zone.step || 1.0;
        const bounds = [
          [zone.latitude, zone.longitude_start],
          [zone.latitude + step, zone.longitude_end]
        ];

        const style = colors[zone.visibility_level] || colors[0];

        const rect = L.rectangle(bounds, {
          stroke: false,
          fillColor: style.color.replace(/rgba\((.*),.*\)/, 'rgb($1)'), 
          fillOpacity: parseFloat(style.color.match(/0\.\d+/)[0]),
          renderer: canvasRenderer,
          interactive: true
        });

        // Scientific Tooltip (Lightweight)
        // Note: binding thousands of tooltips can be heavy. considering lightweight alternative if still slow.
        // For now, standard binding is okay with virtual rendering.
        rect.bindTooltip(`
          <div class="text-[10px]">
            <span class="font-bold">${style.label}</span><br>
            q: ${zone.q_value.toFixed(2)}<br>
            Lat: ${zone.latitude.toFixed(1)}
          </div>
        `, { sticky: true, opacity: 0.9, direction: 'top' });
        
        rect.addTo(layerGroup);
      }

      processedIndex = batchEnd;

      // Critical: Yield to main thread to allow browser to paint loading spinner frame
      await yieldToBrowser();
    }
    
    console.log('✅ Async rendering complete');
  }

  updateLegend(colors) {
    const legendContainer = document.getElementById('map-legend-list');
    if (!legendContainer) return;

    legendContainer.innerHTML = Object.entries(colors)
      .reverse()
      .map(([level, info]) => `
        <div class="flex items-center gap-2 p-2 bg-base-100 rounded-lg shadow-xs border border-base-200">
          <div class="w-4 h-4 rounded-xs shrink-0 ring-1 ring-black/10" style="background-color: ${info.color.replace('0.4', '0.8')};"></div>
          <div class="flex flex-col">
            <span class="text-[10px] font-bold leading-tight">${info.label.split(':')[0]}</span>
            <span class="text-[9px] opacity-60 leading-tight">${info.label.split(':')[1]}</span>
          </div>
        </div>
      `).join('');
  }

  // Set the primary marker for the calculation site
  updateCurrentLocationMarker(location, ephemeris = null) {
    if (!this.map) return;
    
    // Clear previous focal marker
    if (this.currentLocationMarker) {
      this.map.removeLayer(this.currentLocationMarker);
    }

    const { latitude, longitude } = location;
    
    // Primary Calculation Point with Pulse
    this.currentLocationMarker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'custom-location-icon',
        html: `<div class="w-5 h-5 bg-primary border-2 border-white rounded-full shadow-lg pulse-animation"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      }),
      zIndexOffset: 1000
    }).addTo(this.map);

    this.currentLocationMarker.bindPopup(`
      <div class="p-2 min-w-[120px]">
        <div class="text-[9px] uppercase font-mono opacity-50 mb-1">Observation Site</div>
        <div class="text-xs font-bold border-b border-base-200 pb-1 mb-1">Global Reference Point</div>
        <div class="text-[10px] space-y-1">
          <div class="flex justify-between"><span>LAT:</span> <span class="font-mono">${latitude.toFixed(4)}°</span></div>
          <div class="flex justify-between"><span>LON:</span> <span class="font-mono">${longitude.toFixed(4)}°</span></div>
        </div>
      </div>
    `, { className: 'modern-popup' });

    this.map.setView([latitude, longitude], this.map.getZoom() || 5);
  }


  // Render prayer time curves as polylines
  renderPrayerTimes(prayerData) {
    console.log('🕌 Rendering prayer times:', prayerData);
    this.clearPrayerTimeLayers();
    if (!prayerData || !Array.isArray(prayerData)) return;

    prayerData.forEach(curve => {
      if (!curve.coordinates || !Array.isArray(curve.coordinates)) return;
      const polyline = L.polyline(curve.coordinates, {
        color: this.getPrayerTimeColor(curve.prayerType),
        weight: 2,
        opacity: 0.8
      });
      polyline.addTo(this.map);
      this.prayerTimeLayers.push(polyline);
      polyline.bindPopup(`<b>${curve.prayerType}</b><br>Time: ${curve.time || 'N/A'}`);
    });
  }

  getPrayerTimeColor(prayerType) {
    const colors = { 'Fajr': '#4a90e2', 'Dhuhr': '#f5a623', 'Asr': '#e94b3c', 'Maghrib': '#9b59b6', 'Isha': '#2ecc71', 'default': '#95a5a6' };
    return colors[prayerType] || colors.default;
  }

  calculateTimezone(longitude) {
    return Math.round(longitude / 15);
  }

  clearMarkers() {
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
    console.log('🧹 Cleared all markers');
  }

  // Handle map click
  handleMapClick(event) {
    const { lat, lng } = event.latlng;
    const marker = L.marker([lat, lng]).addTo(this.map);
    marker.bindPopup(`
      <div class="text-xs">
        <b>Location Selected</b><br>
        Lat: ${lat.toFixed(6)}<br>
        Lon: ${lng.toFixed(6)}<br>
        <button class="btn btn-xs btn-primary mt-2" id="btn-select-this-final">Use This Location</button>
      </div>
    `).openPopup();
    this.markers.push(marker);

    setTimeout(() => {
      const btn = document.getElementById('btn-select-this-final');
      if (btn) {
        btn.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('location-selected', {
            detail: { location: { latitude: lat, longitude: lng, elevation: 0, timezone: this.calculateTimezone(lng) } },
            bubbles: true
          }));
          marker.closePopup();
        });
      }
    }, 100);
  }

  fitToData() {
    const allLayers = [...this.visibilityLayers, ...this.prayerTimeLayers, ...this.markers];
    if (allLayers.length > 0 && this.map) {
      const group = L.featureGroup(allLayers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  clearVisibilityLayers() {
    this.visibilityLayers.forEach(layer => this.map.removeLayer(layer));
    this.visibilityLayers = [];
  }

  clearPrayerTimeLayers() {
    this.prayerTimeLayers.forEach(layer => this.map.removeLayer(layer));
    this.prayerTimeLayers = [];
  }

  invalidateSize() {
    if (this.map) this.map.invalidateSize();
  }

  setCenter(latitude, longitude, zoom = 8) {
    if (this.map) this.map.setView([latitude, longitude], zoom);
  }
}


// Register custom element
customElements.define('map-visualization', MapVisualization);