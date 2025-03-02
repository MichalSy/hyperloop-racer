import { BabylonEngine } from "../engine/BabylonEngine";
import { Track } from "../data/Track";
import { TrackType, Track as TrackData, Vector3 as TrackVector3 } from "../data/types";
import { AppConfig } from "../config/AppConfig";
import { Vehicle } from "./Vehicle";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { Vector3, HemisphericLight, Color3, Mesh, TransformNode, SceneLoader, ArcRotateCamera } from "babylonjs";
import { LapCounter } from "../counter";
import { formatTime } from "../utils/helpers";

/**
 * TestManager handles the track testing functionality
 */
export class TestManager {
  private engine: BabylonEngine;
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private currentTrack: Track | null = null;
  private trackData: TrackData | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private currentTime: number = 0;
  private hudElement: HTMLElement;
  private vehicle: Vehicle | null = null;
  private physicsSystem: PhysicsSystem;
  private trackElementLibrary: TrackElementLibrary;
  private trackMeshes: Mesh[] = [];
  private lapCounter: LapCounter;
  private checkpoints: string[] = [];
  private playerName: string = "Player";
  
  /**
   * Creates a new TestManager instance
   * @param container Parent container element 
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupUI();
    
    // Initialize BabylonEngine with the created canvas
    this.engine = new BabylonEngine(this.canvas);
    
    // Set up camera
    const camera = this.engine.getCamera();
    camera.radius = 20;
    camera.alpha = Math.PI / 4;
    camera.beta = Math.PI / 3;
    
    // Add better lighting
    const scene = this.engine.getScene();
    const light = new HemisphericLight("mainLight", new Vector3(0.5, 1, 0.5), scene);
    light.intensity = 0.8;
    light.diffuse = new Color3(1, 1, 0.9);
    light.specular = new Color3(1, 1, 1);
    
    // Initialize physics system
    this.physicsSystem = new PhysicsSystem(scene);
    
    // Initialize track element library
    this.trackElementLibrary = TrackElementLibrary.getInstance(scene, this.physicsSystem);
    
    // Initialize lap counter
    this.lapCounter = new LapCounter();
    
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
    startButton.id = 'start-button';
    startButton.addEventListener('click', () => this.startRace());
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', () => this.resetRace());
    
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.id = 'pause-button';
    pauseButton.addEventListener('click', () => this.togglePause());
    pauseButton.style.display = 'none'; // Initially hidden
    
    const backButton = document.createElement('button');
    backButton.textContent = 'Back to Editor';
    backButton.addEventListener('click', () => this.backToEditor());
    
    controls.appendChild(startButton);
    controls.appendChild(pauseButton);
    controls.appendChild(resetButton);
    controls.appendChild(backButton);
    
    testContainer.appendChild(controls);
    
    // Create best times panel
    const bestTimesPanel = document.createElement('div');
    bestTimesPanel.className = 'best-times-panel';
    bestTimesPanel.innerHTML = '<h3>Best Times</h3><div id="best-times-list"></div>';
    testContainer.appendChild(bestTimesPanel);
    
    // Add to the main container
    this.container.appendChild(testContainer);
  }
  
  /**
   * Sets up the test mode game logic
   */
  private setupTestMode() {
    // Add camera follow for vehicle
    const scene = this.engine.getScene();
    
    // Create a follow camera
    const camera = new ArcRotateCamera(
      "followCamera",
      -Math.PI / 2,
      Math.PI / 3,
      20,
      Vector3.Zero(),
      scene
    );
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    camera.attachControl(this.canvas, true);
    
    // Follow camera behavior
    scene.registerBeforeRender(() => {
      if (this.vehicle) {
        const vehiclePos = this.vehicle.getPosition();
        camera.target = vehiclePos;
        
        if (this.isRunning && !this.isPaused) {
          this.currentTime = (Date.now() - this.startTime) / 1000;
          this.updateHUD();
        }
      }
    });
    
    // Load demo track if no track loaded
    if (!this.trackData) {
      this.loadDemoTrack();
    }
  }
  
  /**
   * Loads a demo track for testing
   */
  private loadDemoTrack() {
    const demoTrack: TrackData = {
      id: 'demo-track',
      name: 'Demo Track',
      author: 'System',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [
        {
          elementId: 'straight-segment',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          connectors: {}
        },
        {
          elementId: 'curve-90',
          position: { x: 0, y: 0, z: 30 },
          rotation: { x: 0, y: 0, z: 0 },
          connectors: {}
        },
        {
          elementId: 'straight-segment',
          position: { x: 15, y: 0, z: 45 },
          rotation: { x: 0, y: Math.PI / 2, z: 0 },
          connectors: {}
        },
        {
          elementId: 'curve-90',
          position: { x: 45, y: 0, z: 45 },
          rotation: { x: 0, y: Math.PI / 2, z: 0 },
          connectors: {}
        },
        {
          elementId: 'straight-segment',
          position: { x: 60, y: 0, z: 15 },
          rotation: { x: 0, y: Math.PI, z: 0 },
          connectors: {}
        },
        {
          elementId: 'curve-90',
          position: { x: 60, y: 0, z: -15 },
          rotation: { x: 0, y: Math.PI, z: 0 },
          connectors: {}
        },
        {
          elementId: 'straight-segment',
          position: { x: 30, y: 0, z: -30 },
          rotation: { x: 0, y: -Math.PI / 2, z: 0 },
          connectors: {}
        },
        {
          elementId: 'curve-90',
          position: { x: 0, y: 0, z: -30 },
          rotation: { x: 0, y: -Math.PI / 2, z: 0 },
          connectors: {}
        }
      ],
      bestTimes: []
    };
    
    this.loadTrack(demoTrack);
  }
  
  /**
   * Updates the HUD with current information
   */
  private updateHUD() {
    if (this.hudElement && this.vehicle) {
      const speed = Math.abs(this.vehicle.getSpeed());
      const currentLap = this.lapCounter.getCurrentLap();
      const lapTime = formatTime(this.lapCounter.getCurrentLapTime());
      const bestLap = this.lapCounter.getBestLapTime() 
        ? formatTime(this.lapCounter.getBestLapTime()) 
        : "N/A";
      
      this.hudElement.innerHTML = `
        <div class="hud-content">
          <h3>${this.trackData ? this.trackData.name : 'No Track Loaded'}</h3>
          <p>Lap: ${currentLap}</p>
          <p>Current Time: ${lapTime}</p>
          <p>Best Lap: ${bestLap}</p>
          <p>Speed: ${speed.toFixed(1)} units/s</p>
          <div class="controls-hint">
            <p>Controls:</p>
            <p>W - Accelerate</p>
            <p>S - Brake</p>
            <p>A/D - Turn Left/Right</p>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Updates the best times list display
   */
  private updateBestTimesList() {
    if (!this.trackData || !this.trackData.bestTimes) return;
    
    const bestTimesList = document.getElementById('best-times-list');
    if (!bestTimesList) return;
    
    if (this.trackData.bestTimes.length === 0) {
      bestTimesList.innerHTML = '<p>No records yet!</p>';
      return;
    }
    
    let html = '<ul class="best-times">';
    this.trackData.bestTimes.forEach((time, index) => {
      html += `
        <li>
          <span class="position">${index + 1}.</span>
          <span class="player">${time.playerName}</span>
          <span class="time">${formatTime(time.time)}</span>
          <span class="date">${new Date(time.date).toLocaleDateString()}</span>
        </li>
      `;
    });
    html += '</ul>';
    
    bestTimesList.innerHTML = html;
  }
  
  /**
   * Loads a track for testing
   * @param track The track to load
   */
  public loadTrack(track: TrackData) {
    this.trackData = track;
    
    // Create track instance if needed
    if (!this.currentTrack || this.currentTrack.getData().id !== track.id) {
      this.currentTrack = new Track(track);
    }
    
    // Clear existing track meshes
    const scene = this.engine.getScene();
    this.trackMeshes.forEach(mesh => {
      mesh.dispose();
    });
    this.trackMeshes = [];
    
    // Load track elements
    track.elements.forEach(element => {
      try {
        // Create track element mesh
        const elementMesh = this.trackElementLibrary.createTrackElementMesh(element.elementId);
        
        // Set position and rotation
        const position = new Vector3(
          element.position.x, 
          element.position.y, 
          element.position.z
        );
        
        const rotation = new Vector3(
          element.rotation.x, 
          element.rotation.y, 
          element.rotation.z
        );
        
        elementMesh.position = position;
        elementMesh.rotation = rotation;
        
        // Add to track meshes
        this.trackMeshes.push(elementMesh);
      } catch (error) {
        console.error(`Failed to create track element ${element.elementId}:`, error);
      }
    });
    
    console.log(`Loaded track with ${this.trackMeshes.length} elements`);
    
    // Setup checkpoints
    this.setupCheckpoints();
    
    // Create vehicle if not exists
    if (!this.vehicle) {
      this.vehicle = new Vehicle(scene, this.physicsSystem);
    }
    
    // Tell vehicle about track meshes
    this.vehicle.setTrackMeshes(this.trackMeshes);
    
    // Position vehicle at start
    this.resetVehiclePosition();
    
    // Update best times display
    this.updateBestTimesList();
  }
  
  /**
   * Sets up checkpoints for the track
   */
  private setupCheckpoints() {
    // Clear existing checkpoints
    this.checkpoints = [];
    
    if (!this.trackData || this.trackData.elements.length === 0) return;
    
    // Start with first element as start/finish line
    this.checkpoints.push(this.trackData.elements[0].elementId);
    
    // Add rest of track elements as checkpoints
    for (let i = 1; i < this.trackData.elements.length; i++) {
      this.checkpoints.push(this.trackData.elements[i].elementId);
    }
    
    // Update lap counter
    this.lapCounter.setCheckpoints(this.checkpoints);
    
    console.log('Checkpoints set up:', this.checkpoints);
  }
  
  /**
   * Resets vehicle to start position
   */
  private resetVehiclePosition() {
    if (!this.vehicle || !this.trackData || this.trackData.elements.length === 0) return;
    
    // Get start element
    const startElement = this.trackData.elements[0];
    const startPos = new Vector3(
      startElement.position.x, 
      startElement.position.y + 2, // Lift slightly above track
      startElement.position.z
    );
    
    // Calculate direction from rotation
    const direction = new Vector3(
      Math.sin(startElement.rotation.y),
      0,
      Math.cos(startElement.rotation.y)
    );
    
    // Place vehicle
    this.vehicle.placeAt(startPos, direction);
  }
  
  /**
   * Starts the race
   */
  private startRace() {
    if (!this.trackData || !this.vehicle) {
      alert('No track or vehicle loaded!');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.vehicle.reset(); // Reset vehicle state
    this.lapCounter.startRace();
    
    // Update UI
    const startButton = document.getElementById('start-button') as HTMLElement;
    const pauseButton = document.getElementById('pause-button') as HTMLElement;
    
    if (startButton) startButton.style.display = 'none';
    if (pauseButton) pauseButton.style.display = 'inline-block';
    
    console.log('Race started!');
  }
  
  /**
   * Toggles pause state
   */
  private togglePause() {
    if (!this.isRunning) return;
    
    this.isPaused = !this.isPaused;
    
    const pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
    if (pauseButton) {
      pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    if (this.isPaused) {
      // Store current time
      this.currentTime = (Date.now() - this.startTime) / 1000;
    } else {
      // Adjust start time to maintain current time
      this.startTime = Date.now() - (this.currentTime * 1000);
    }
  }
  
  /**
   * Resets the race
   */
  private resetRace() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentTime = 0;
    
    // Reset vehicle
    this.resetVehiclePosition();
    if (this.vehicle) {
      this.vehicle.reset();
    }
    
    // Reset lap counter
    this.lapCounter.reset();
    
    // Update UI
    this.updateHUD();
    
    const startButton = document.getElementById('start-button') as HTMLElement;
    const pauseButton = document.getElementById('pause-button') as HTMLElement;
    
    if (startButton) startButton.style.display = 'inline-block';
    if (pauseButton) {
      pauseButton.style.display = 'none';
      pauseButton.textContent = 'Pause';
    }
  }
  
  /**
   * Processes checkpoint passing
   * @param checkpointId ID of the checkpoint passed
   */
  private passCheckpoint(checkpointId: string) {
    const valid = this.lapCounter.passCheckpoint(checkpointId);
    
    if (valid) {
      console.log(`Passed checkpoint ${checkpointId}`);
      
      // If this completes a lap
      if (this.lapCounter.getCurrentLap() > 1) {
        const lapTime = this.lapCounter.getLapTimes()[this.lapCounter.getLapTimes().length - 1];
        
        // Add to best times if we have a track
        if (this.currentTrack && lapTime) {
          this.currentTrack.addBestTime(this.playerName, lapTime);
          this.updateBestTimesList();
          
          // Save track with updated best times
          this.currentTrack.saveToStorage();
        }
      }
    }
  }
  
  /**
   * Returns to the editor mode
   */
  private backToEditor() {
    // Switch to editor mode
    window.location.href = `${window.location.origin}${window.location.pathname}?mode=editor`;
  }
  
  /**
   * Sets the player name
   * @param name Player name
   */
  public setPlayerName(name: string) {
    this.playerName = name;
  }
  
  /**
   * Disposes resources and cleans up
   */
  public dispose() {
    if (this.vehicle) {
      this.vehicle.dispose();
    }
    
    this.trackMeshes.forEach(mesh => {
      mesh.dispose();
    });
    
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
    
    return Promise.resolve();
}