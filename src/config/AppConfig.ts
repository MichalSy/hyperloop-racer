/**
 * Main configuration settings for the Hyperloop Racer application
 */
export const AppConfig = {
  // Application mode (editor or test)
  startMode: __APP_MODE__,
  
  // Physics settings
  physics: {
    gravity: -9.81,
    defaultFriction: 0.5,
    defaultRestitution: 0.2,
  },
  
  // Track settings
  track: {
    cubikSize: 10, // Base size of a cubik unit
    connectorRadius: 0.5, // Size of connector spheres
    connectorArrowLength: 1, // Length of orientation arrows
  },
  
  // Vehicle settings
  vehicle: {
    speed: {
      acceleration: 1.5,
      deceleration: 2.0,
      maxSpeed: 30
    },
    turning: {
      speed: 0.05,
      maxAngle: Math.PI / 4
    }
  },
  
  // Storage keys
  storage: {
    trackElements: 'hyperloop-racer-track-elements',
    tracks: 'hyperloop-racer-tracks',
    settings: 'hyperloop-racer-settings',
    bestTimes: 'hyperloop-racer-best-times',
  },
  
  // Auto-save interval in milliseconds (30 seconds)
  autoSaveInterval: 30000,
};