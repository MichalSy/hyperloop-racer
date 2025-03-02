import { BabylonEngine } from "../engine/BabylonEngine";
import { Track } from "../data/types";
import { AppConfig } from "../config/AppConfig";
import { Vehicle } from "./Vehicle";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { Vector3 } from "@babylonjs/core";

/**
 * TestManager handles the track testing functionality
 */
export class TestManager {
  private engine: BabylonEngine;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private currentTrack: Track | null = null;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private currentTime: number = 0;
  private hudElement: HTMLElement;
  private vehicle: Vehicle | null = null;
  private physicsSystem: PhysicsSystem;
  private trackElementLibrary: TrackElementLibrary;
  
  /**
   * Creates a new TestManager instance
   * @param container Parent container element 
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupUI();
    
    // Initialize BabylonEngine with the created canvas
    this.engine = new BabylonEngine(this.canvas);
    
    // Initialize physics system
    this.physicsSystem = new PhysicsSystem(this.engine.getScene());
    
    // Initialize track element library
    this.trackElementLibrary = new TrackElementLibrary(this.engine.getScene());
    
    // Set up game logic
    this.setupTestMode();
  }
  
  /**
   * Sets up the test mode UI
   */
  private setupUI() {
    // Create test container
    const testContainer = document.createElement('div');
    testContainer.className = 'test-container';
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'renderCanvas';
    testContainer.appendChild(this.canvas);
    
    // Create HUD
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'test-hud';
    this.updateHUD();
    testContainer.appendChild(this.hudElement);
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'test-controls';
    
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Race';
    startButton.addEventListener('click', () => this.startRace());
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => this.resetRace());
    
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Editor';
    backButton.addEventListener('click', () => this.backToEditor());
    
    controls.appendChild(startButton);
    controls.appendChild(resetButton);
    controls.appendChild(backButton);
    
    testContainer.appendChild(controls);
    
    // Add to the main container
    this.container.appendChild(testContainer);
  }
  
  /**
   * Sets up the test mode game logic
   */
  private setupTestMode() {
    // TODO: Add event listeners for keyboard controls
    
    // Add render loop hook for game logic
    const scene = this.engine.getScene();
    scene.registerBeforeRender(() => {
      if (this.isRunning) {
        this.currentTime = (Date.now() - this.startTime) / 1000;
        this.updateHUD();
      }
    });
  }
  
  /**
   * Updates the HUD with current information
   */
  private updateHUD() {
    if (this.hudElement && this.vehicle) {
      const speed = Math.abs(this.vehicle.getSpeed());
      this.hudElement.innerHTML = `
        <div>
          <h3>${this.currentTrack ? this.currentTrack.name : 'No Track Loaded'}</h3>
          <p>Time: ${this.currentTime.toFixed(2)}s</p>
          <p>Speed: ${speed.toFixed(1)} units/s</p>
          <p>Use WASD to control your vehicle</p>
        </div>
      `;
    }
  }
  
  /**
   * Loads a track for testing
   * @param track The track to load
   */
  public loadTrack(track: Track) {
    this.currentTrack = track;
    
    // Clear existing track meshes
    const scene = this.engine.getScene();
    scene.meshes.slice().forEach(mesh => {
      if (mesh.name.startsWith('track-')) {
        mesh.dispose();
      }
    });
    
    // Load track elements
    track.elements.forEach(element => {
      const mesh = this.trackElementLibrary.createTrackElementMesh(element);
      this.trackElementLibrary.updateTrackElementTransform(
        mesh,
        Vector3.FromObject(element.position),
        Vector3.FromObject(element.rotation)
      );
    });
    
    // Create vehicle if not exists
    if (!this.vehicle) {
      this.vehicle = new Vehicle(scene, this.physicsSystem);
    }
    
    // Position vehicle at start
    if (track.elements.length > 0) {
      const startElement = track.elements[0];
      const startPos = Vector3.FromObject(startElement.position);
      const startDir = Vector3.FromObject(startElement.rotation);
      this.vehicle.placeAt(startPos, startDir);
    }
    
    this.updateHUD();
  }
  
  /**
   * Starts the race
   */
  private startRace() {
    if (!this.currentTrack || !this.vehicle) {
      alert('No track or vehicle loaded!');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.vehicle.reset(); // Reset vehicle state
  }
  
  /**
   * Resets the race
   */
  private resetRace() {
    this.isRunning = false;
    this.currentTime = 0;
    
    if (this.vehicle && this.currentTrack && this.currentTrack.elements.length > 0) {
      const startElement = this.currentTrack.elements[0];
      const startPos = Vector3.FromObject(startElement.position);
      const startDir = Vector3.FromObject(startElement.rotation);
      this.vehicle.placeAt(startPos, startDir);
      this.vehicle.reset();
    }
    
    this.updateHUD();
  }
  
  /**
   * Returns to the editor mode
   */
  private backToEditor() {
    // TODO: Implement proper mode switching
    window.location.href = window.location.href.replace('?mode=test', '');
  }
  
  /**
   * Disposes resources and cleans up
   */
  public dispose() {
    if (this.vehicle) {
      this.vehicle.dispose();
    }
    if (this.engine) {
      this.engine.dispose();
    }
  }
}

/**
 * Initializes the test mode
 * @param container The container element
 */
export async function initializeTestMode(container: HTMLElement): Promise<void> {
  console.log('Initializing test mode...');
  
  // Clear container
  container.innerHTML = '';
  
  // Create and initialize the test manager
  const testManager = new TestManager(container);
  
  // TODO: Load track from URL parameter or storage
  
  return Promise.resolve();
}