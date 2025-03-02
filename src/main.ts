import './style.css'
import { AppConfig } from './config/AppConfig'
import { initializeEditor } from './editor/EditorManager'
import { initializeTestMode } from './test/TestManager'
import { App } from './app/App'

/**
 * Main application entry point
 */
async function main() {
  const appContainer = document.getElementById('app') as HTMLElement;
  
  // Create a loading screen
  const loadingScreen = document.createElement('div');
  loadingScreen.className = 'loading-screen';
  loadingScreen.innerHTML = `
    <div class="loading-content">
      <h1>Hyperloop Racer</h1>
      <p>Loading...</p>
      <div class="progress-bar"><div class="progress"></div></div>
    </div>
  `;
  appContainer.appendChild(loadingScreen);

  try {
    // Initialize the app singleton
    const app = App.getInstance();
    await app.initialize();
    
    // Determine the start mode - either from URL parameter or AppConfig
    let startMode = AppConfig.startMode;
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    if (modeParam === 'editor' || modeParam === 'test') {
      startMode = modeParam;
    }
    
    console.log(`Starting in ${startMode} mode`);
    
    // Initialize the application based on the start mode
    if (startMode === 'editor') {
      await initializeEditor(appContainer);
    } else if (startMode === 'test') {
      await initializeTestMode(appContainer);
    } else {
      console.error(`Unknown start mode: ${startMode}`);
      throw new Error(`Unknown start mode: ${startMode}`);
    }
    
    // Remove loading screen
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      if (loadingScreen.parentNode === appContainer) {
        appContainer.removeChild(loadingScreen);
      }
    }, 1000); // Fade out over 1 second
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    loadingScreen.innerHTML = `
      <div class="loading-content error">
        <h1>Error</h1>
        <p>Failed to initialize Hyperloop Racer</p>
        <p class="error-message">${error}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}

// Start the application when the DOM is ready
document.addEventListener('DOMContentLoaded', main);