// Moon Phase Visualizer Component
// Renders an accurate SVG representation of the moon phase

export class MoonPhaseVisualizer extends HTMLElement {
  static get observedAttributes() {
    return ['illumination', 'age', 'width'];
  }

  constructor() {
    super();
    this.illumination = 0; // 0 to 1
    this.age = 0; // Days
    this.width = 100; // Pixel width for rendering
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'illumination') this.illumination = parseFloat(newValue);
    if (name === 'age') this.age = parseFloat(newValue);
    if (name === 'width') this.width = parseInt(newValue);
    this.render();
  }

  render() {
    // Calculate phase characteristics
    // Illumination is 0 (New) -> 0.5 (Quarter) -> 1 (Full)
    // We need to determine if waxing or waning based on age. 
    // New Moon = 0, Full Moon ~14.7, New Moon ~29.5
    // However, our input 'illumination' is usally calculated geometrically.
    // For simplicity in this visualizer, we'll assume standard crescent logic if only illumination is provided,
    // or use age to determine the shadow side.
    
    // Radius of the moon
    const r = 50;
    const cx = 50;
    const cy = 50;
    
    // Determine the curve of the shadow (terminator)
    // -1 (New) to 0 (Quarter) to 1 (Full) logic for the curve control point? 
    // No, standard SVG path for moon phase involves elliptical arcs.
    
    // Simplified Visual Logic:
    // We are drawing the lighted part.
    // Full moon is a circle. New moon is empty.
    // Waning/Waxing depends on age.
    // Age < 15: Waxing (Light on Right for Northern Hemisphere users usually, but let's stick to astronomical standard)
    // Actually, Hilal is NEW moon (Waxing Crescent). So Light is on the RIGHT/BOTTOM depending on latitude.
    // For a generic "Hilal" app, we are looking for the YOUNG CRESCENT.
    // So we primarily render a thin crescent on the right/bottom suitable for Hilal context.
    
    // Let's use a mask-based approach for accurate phase rendering
    // A black rectangle covering a white circle, with a "phase" circle masking it.
    
    const phase = this.illumination; // 0.0 to 1.0 covering the disc? 
    // Actually, let's map illumination % to visual width.
    
    // Dynamic glow based on visibility
    const glowColor = this.illumination > 0.01 ? '#fbbf24' : '#52525b';
    const glowOpacity = Math.min(this.illumination * 2, 0.8);
    
    // Accessibility label
    const phasePercent = (this.illumination * 100).toFixed(1);
    const ageLabel = this.age.toFixed(1);
    const a11yLabel = `Moon phase visualization: illumination ${phasePercent}%, moon age ${ageLabel} hours`;

    this.innerHTML = `
      <div class="flex flex-col items-center justify-center p-4 rounded-xl glass-panel relative overflow-hidden" 
           role="img" 
           aria-label="${a11yLabel}">
        <div class="relative w-32 h-32">
          <!-- Atmosphere Glow -->
          <div class="absolute inset-0 rounded-full" 
               style="background: radial-gradient(circle, ${glowColor} 0%, transparent 70%); opacity: ${glowOpacity}; filter: blur(10px);"></div>
          
          <!-- Moon Base (Shadow Side) -->
          <svg viewBox="0 0 100 100" class="w-full h-full relative z-10 drop-shadow-2xl">
            <defs>
              <radialGradient id="moonGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="85%" stop-color="#3f3f46" />
                <stop offset="100%" stop-color="#18181b" />
              </radialGradient>
              <filter id="crescentGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            
            <!-- Dark Disc -->
            <circle cx="50" cy="50" r="48" fill="url(#moonGradient)" stroke="none" />
            
            <!-- Lit Crescent (Approximation for Hilal Context) -->
            <!-- We draw a path that represents the illuminated sliver -->
            <!-- The 'd' output needs to be dynamic based on illumination width -->
            ${this.renderCrescentPath(this.illumination)}
            
          </svg>
        </div>
        
        <div class="mt-4 text-center">
          <div class="text-xs uppercase tracking-widest opacity-60 font-bold">Illumination</div>
          <div class="text-xl font-mono text-primary font-bold">${(this.illumination * 100).toFixed(2)}%</div>
          <div class="text-xs opacity-50 font-mono mt-1">Age: ${this.age.toFixed(2)}h</div>
        </div>
      </div>
    `;
  }
  
  renderCrescentPath(illumination) {
    // For very small illumination (Hilal), we render a sliver on the right side.
    // M indicates Move to, A indicates Arc
    
    // Scale factor for the "bulge" of the terminator
    // If illumination is 0, factor is -1 (concave matching outer rim -> invisible)
    // If illumination is 0.5, factor is 0 (straight line)
    // If illumination is 1, factor is 1 (convex matching outer rim -> full)
    
    // However, for Hilal (Waxing Crescent), we strictly deal with 0 -> 0.5 range usually.
    // The "Light" is on the West/Sun side.
    
    if (illumination <= 0.001) return ''; // Invisible
    
    // Simple elliptical arc approximation for crescent
    // Outer arc is always a semi-circle (right side)
    // Inner arc is an ellipse that varies width
    
    // Let's create a path for the Right Half of the moon, masked by an ellipse?
    
    // Better: Draw the illuminated shape directly.
    // M 50,2 (Top)
    // A 48,48 0 0 1 50,98 (Outer Arc to Bottom)
    // A Rx,Ry 0 0 0 50,2 (Inner Arc back to Top)
    // Where Rx varies based on phase.
    
    // Visual Illusion Width (w)
    // At New Moon (0%), Rx = 48 (matching outer, but swept opposite?) -> No, actually Rx=48 sweep 1 means full.
    // At Quarter (50%), Rx = 0 (straight line).
    // At Full (100%), Rx = -48 (convex).
    
    // Illum 0..1
    // offset = 48 * (2 * illum - 1)
    // But for Hilal (0..0.1), illum is small.
    // offset approx -48.
    
    // Let's stick to a simple visual representation of the sliver.
    const rx = 48 * Math.cos(illumination * Math.PI); // Approximation
    // Use white/yellow for light
    
    // Direction of light? Usually from Sun (below horizon).
    // But standard icon representation is vertical.
    
    return `
      <path d="M 50,2 A 48,48 0 1,1 50,98 A ${Math.abs(rx)},48 0 0,${illumination > 0.5 ? 1 : 0} 50,2" 
            fill="#fbbf24" 
            stroke="none" 
            style="filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.5));" />
    `;
  }
}

customElements.define('moon-phase-visualizer', MoonPhaseVisualizer);
