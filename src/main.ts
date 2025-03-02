import './style.css'
import { AppConfig } from './config/AppConfig'
import { initializeEditor } from './editor/EditorManager'
import { initializeTestMode } from './test/TestManager'
import { App } from './app/App'

// Import Babylon.js core to ensure engines are loaded
import '@babylonjs/core/Engines/engine';

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

  // Create canvas element immediately
  const canvas = document.createElement('canvas');
  canvas.id = 'renderCanvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'none'; // Hide it initially
  appContainer.appendChild(canvas);

  try {
    // Initialize the app singleton with the pre-created canvas
    const app = App.getInstance();
    await app.initialize(canvas);
    
    // Determine the start mode - either from URL parameter or AppConfig
    let startMode = AppConfig.startMode;
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    
    if (modeParam === 'editor' || modeParam === 'test') {
      startMode = modeParam;
    }
    
    console.log(`Starting in ${startMode} mode`);
    
    // Now we can remove the temporary canvas we created
    if (canvas.parentNode === appContainer) {
      appContainer.removeChild(canvas);
    }
    
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
        <div class="error-message">
          ${error instanceof Error ? error.message : String(error)}
          <br><br>
          <details>
            <summary>Technical Details</summary>
            <pre>${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}</pre>
          </details>
        </div>
        <button onclick="location.reload()">Reload</button>
        <p>If the problem persists, please try a different browser.</p>
      </div>
    `;
  }
}

// Check if the DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  // DOM already loaded, run main directly
  main();
}