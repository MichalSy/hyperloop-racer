import './style.css'
import { AppConfig } from './config/AppConfig'
import { initializeEditor } from './editor/EditorManager'
import { initializeTestMode } from './test/TestManager'

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
    // Initialize the application based on the start mode
    if (AppConfig.startMode === 'editor') {
      await initializeEditor(appContainer);
    } else if (AppConfig.startMode === 'test') {
      await initializeTestMode(appContainer);
    } else {
      console.error(`Unknown start mode: ${AppConfig.startMode}`);
      throw new Error(`Unknown start mode: ${AppConfig.startMode}`);
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
