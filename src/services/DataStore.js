// Data Store for application state management
// Simple observer pattern implementation for state management

export class DataStore {
  constructor() {
    this.state = {
      // Current calculation results
      calculationResult: null,

      // Visibility zones data
      visibilityData: [],

      // Astronomical data cache
      astronomicalData: new Map(),

      // UI state
      selectedLocation: null,
      selectedDate: new Date(),
      selectedCriteria: 'MABIMS',

      // Loading states
      isCalculating: false,
      isLoadingZones: false
    };

    this.listeners = new Map();
  }

  // Get current state
  getState() {
    return { ...this.state };
  }

  // Update state and notify listeners
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Notify listeners of changes
    this.notifyListeners(oldState, this.state);
  }

  // Subscribe to state changes
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of state changes
  notifyListeners(oldState, newState) {
    // Check for specific changes and notify relevant listeners
    if (oldState.calculationResult !== newState.calculationResult) {
      this.notifyEvent('calculation-updated', newState.calculationResult);
    }

    if (oldState.visibilityData !== newState.visibilityData) {
      this.notifyEvent('visibility-updated', newState.visibilityData);
    }

    if (oldState.selectedLocation !== newState.selectedLocation) {
      this.notifyEvent('location-changed', newState.selectedLocation);
    }

    if (oldState.selectedDate !== newState.selectedDate) {
      this.notifyEvent('date-changed', newState.selectedDate);
    }

    if (oldState.selectedCriteria !== newState.selectedCriteria) {
      this.notifyEvent('criteria-changed', newState.selectedCriteria);
    }

    // Notify general state change
    this.notifyEvent('state-changed', newState);
  }

  // Notify specific event type
  notifyEvent(eventType, data) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  // Specific state setters
  setCalculationResult(result) {
    this.setState({ calculationResult: result });
  }

  setVisibilityData(data) {
    this.setState({ visibilityData: data });
  }

  setSelectedLocation(location) {
    this.setState({ selectedLocation: location });
  }

  setSelectedDate(date) {
    this.setState({ selectedDate: date });
  }

  setSelectedCriteria(criteria) {
    this.setState({ selectedCriteria: criteria });
  }

  setLoading(isCalculating, isLoadingZones = false) {
    this.setState({
      isCalculating,
      isLoadingZones: isLoadingZones || isCalculating
    });
  }

  // Cache astronomical data
  cacheAstronomicalData(key, data) {
    this.state.astronomicalData.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCachedAstronomicalData(key) {
    const cached = this.state.astronomicalData.get(key);
    if (cached) {
      // Check if cache is still valid (5 minutes)
      const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000;
      if (isValid) {
        return cached.data;
      } else {
        // Remove expired cache
        this.state.astronomicalData.delete(key);
      }
    }
    return null;
  }

  // Clear all cached data
  clearCache() {
    this.state.astronomicalData.clear();
  }

  // Get current calculation result
  getCalculationResult() {
    return this.state.calculationResult;
  }

  // Get current visibility data
  getVisibilityData() {
    return this.state.visibilityData;
  }

  // Check if currently calculating
  isCalculating() {
    return this.state.isCalculating;
  }

  // Check if loading zones
  isLoadingZones() {
    return this.state.isLoadingZones;
  }
}