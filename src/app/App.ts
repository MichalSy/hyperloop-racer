import { AppConfig } from '../config/AppConfig';
import { safeLocalStorageLoad, safeLocalStorageSave } from '../utils/helpers';
import { BabylonEngine } from '../engine/BabylonEngine';
import { PhysicsSystem } from '../engine/PhysicsSystem';

/**
 * Main application class that manages application lifecycle
 */
export class App {
  private static instance: App;
  private settings: any = {};
  private initialized: boolean = false;
  private engine: BabylonEngine | null = null;
  private physicsSystem: PhysicsSystem | null = null;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Private constructor
  }
  
  /**
   * Gets the singleton instance
   */
  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    
    return App.instance;
  }
  
  /**
   * Initializes the application
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log(`Initializing Hyperloop Racer in ${AppConfig.startMode} mode`);
    
    // Load application settings
    this.loadSettings();
    
    // Initialize core systems
    this.engine = new BabylonEngine(document.querySelector('#renderCanvas') as HTMLCanvasElement);
    this.physicsSystem = new PhysicsSystem(this.engine.getScene());
    
    // Set up event listeners for application lifecycle
    window.addEventListener('beforeunload', () => this.onBeforeUnload());
    window.addEventListener('resize', () => this.onResize());
    
    // Set up auto-save timer
    setInterval(() => this.autoSave(), AppConfig.autoSaveInterval);
    
    this.initialized = true;
  }

  /**
   * Gets the Babylon engine instance
   */
  public getEngine(): BabylonEngine | null {
    return this.engine;
  }

  /**
   * Gets the physics system instance
   */
  public getPhysicsSystem(): PhysicsSystem | null {
    return this.physicsSystem;
  }
  
  /**
   * Handles window resize event
   */
  private onResize(): void {
    if (this.engine) {
      this.engine.getEngine().resize();
    }
  }
  
  /**
   * Loads settings from local storage
   */
  private loadSettings(): void {
    this.settings = safeLocalStorageLoad(
      AppConfig.storage.settings,
      { 
        volume: 0.5,
        showFps: true,
        quality: 'high'
      }
    );
    
    console.log('Settings loaded:', this.settings);
  }
  
  /**
   * Gets application settings
   */
  public getSettings(): any {
    return { ...this.settings };
  }
  
  /**
   * Updates application settings and persists them
   * @param newSettings The new settings to merge
   */
  public updateSettings(newSettings: any): void {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    safeLocalStorageSave(AppConfig.storage.settings, this.settings);
  }
  
  /**
   * Auto-save handler
   */
  private autoSave(): void {
    // This will be implemented by each mode (editor or test)
    // to save its current state
    const event = new CustomEvent('hyperloop-racer:auto-save');
    window.dispatchEvent(event);
  }
  
  /**
   * Before unload handler
   */
  private onBeforeUnload(): void {
    // Trigger any final saves
    const event = new CustomEvent('hyperloop-racer:before-unload');
    window.dispatchEvent(event);
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.engine) {
      this.engine.dispose();
    }
    this.engine = null;
    this.physicsSystem = null;
    this.initialized = false;
  }
}