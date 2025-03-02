import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElement, TrackElementInstance, Track } from "../data/types";
import { AppConfig } from "../config/AppConfig";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { TrackElementManager } from "./TrackElementManager";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { Track as TrackClass } from "../data/Track";
import { Vector3 } from "babylonjs";
import { generateUUID } from "../utils/helpers";
import JSZip from "jszip";

/**
 * EditorManager handles the track editor functionality
 */
export class EditorManager {
  private engine: BabylonEngine;
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private canvas: HTMLCanvasElement;
  private elementPanel: HTMLElement;
  private propertiesPanel: HTMLElement;
  private trackElementManager: TrackElementManager;
  private trackElementLibrary: TrackElementLibrary;
  private physicsSystem: PhysicsSystem;
  private currentTrack: TrackClass;
  private autoSaveTimer: number | null = null;
  private isModified: boolean = false;

  /**
   * Creates a new EditorManager instance
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
    this.trackElementLibrary = TrackElementLibrary.getInstance(
      this.engine.getScene(),
      this.physicsSystem
    );
    
    // Initialize track element manager
    this.trackElementManager = new TrackElementManager(
      this.engine.getScene(),
      this.physicsSystem
    );
    
    // Initialize with empty track
    this.currentTrack = new TrackClass();
    
    // Populate element panel
    this.populateElementPanel();
    
    // Set up selection change handler
    this.trackElementManager.setOnSelectionChangeCallback(
      (instanceId, connectorId) => this.updatePropertiesPanel(instanceId, connectorId)
    );
    
    // Set up auto-save
    this.setupAutoSave();
  }
  
  /**
   * Sets up the editor UI
   */
  private setupUI() {
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-container';
    
    // Create toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';
    
    const toolbarLeft = document.createElement('div');
    toolbarLeft.className = 'toolbar-section';
    
    const newButton = document.createElement('button');
    newButton.textContent = 'New Track';
    newButton.addEventListener('click', () => this.newTrack());
    
    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load Track';
    loadButton.addEventListener('click', () => this.loadTrack());
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Track';
    saveButton.addEventListener('click', () => this.saveTrack());
    
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export Track';
    exportButton.addEventListener('click', () => this.exportTrack());
    
    toolbarLeft.appendChild(newButton);
    toolbarLeft.appendChild(loadButton);
    toolbarLeft.appendChild(saveButton);
    toolbarLeft.appendChild(exportButton);
    
    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'toolbar-section';
    
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Track';
    testButton.addEventListener('click', () => this.testTrack());
    
    const helpButton = document.createElement('button');
    helpButton.textContent = 'Help';
    helpButton.addEventListener('click', () => this.showHelp());
    
    toolbarRight.appendChild(testButton);
    toolbarRight.appendChild(helpButton);
    
    toolbar.appendChild(toolbarLeft);
    toolbar.appendChild(toolbarRight);
    
    // Create main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'editor-main';
    
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'editor-sidebar';
    
    const elementsPanelTitle = document.createElement('h3');
    elementsPanelTitle.textContent = 'Track Elements';
    
    this.elementPanel = document.createElement('div');
    this.elementPanel.className = 'editor-panel';
    this.elementPanel.appendChild(elementsPanelTitle);
    this.elementPanel.id = 'trackElementsPanel';
    
    this.propertiesPanel = document.createElement('div');
    this.propertiesPanel.className = 'editor-panel';
    
    const propertiesPanelTitle = document.createElement('h3');
    propertiesPanelTitle.textContent = 'Properties';
    this.propertiesPanel.appendChild(propertiesPanelTitle);
    this.propertiesPanel.id = 'propertiesPanel';
    
    sidebar.appendChild(this.elementPanel);
    sidebar.appendChild(this.propertiesPanel);
    
    // Create canvas container
    this.canvasContainer = document.createElement('div');
    this.canvasContainer.className = 'editor-canvas-container';
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'renderCanvas';
    this.canvasContainer.appendChild(this.canvas);
    
    // Assemble the UI
    mainContent.appendChild(sidebar);
    mainContent.appendChild(this.canvasContainer);
    
    editorContainer.appendChild(toolbar);
    editorContainer.appendChild(mainContent);
    
    // Add to the main container
    this.container.appendChild(editorContainer);
  }
  
  /**
   * Populates the element panel with track elements
   */
  private populateElementPanel() {
    // Clear existing content (except title)
    const title = this.elementPanel.querySelector('h3');
    this.elementPanel.innerHTML = '';
    if (title) this.elementPanel.appendChild(title);
    
    // Create element list
    const elementList = document.createElement('div');
    elementList.className = 'element-list';
    
    // Get all track elements
    const elements = this.trackElementManager.getTrackElements();
    
    // Add each element to the list
    elements.forEach(element => {
      const elementItem = document.createElement('div');
      elementItem.className = 'element-item';
      elementItem.dataset.elementId = element.id;
      
      // Create thumbnail or icon
      const thumbnail = document.createElement('div');
      thumbnail.className = 'element-thumbnail';
      
      // Visualization of the element shape based on dimensions
      const shape = document.createElement('div');
      shape.className = 'element-shape';
      shape.style.width = `${element.dimensions.width * 2}px`;
      shape.style.height = `${element.dimensions.height * 2}px`;
      shape.style.depth = `${element.dimensions.depth * 2}px`;
      thumbnail.appendChild(shape);
      
      // Create element name
      const name = document.createElement('div');
      name.className = 'element-name';
      name.textContent = element.name;
      
      elementItem.appendChild(thumbnail);
      elementItem.appendChild(name);
      
      // Set up drag and drop
      elementItem.draggable = true;
      elementItem.addEventListener('dragstart', (event) => {
        if (event.dataTransfer) {
          event.dataTransfer.setData('text/plain', element.id);
          event.dataTransfer.effectAllowed = 'copy';
        }
      });
      
      // Add click handler to add the element
      elementItem.addEventListener('click', () => {
        this.addTrackElement(element.id);
      });
      
      elementList.appendChild(elementItem);
    });
    
    this.elementPanel.appendChild(elementList);
  }
  
  /**
   * Updates the properties panel based on selection
   */
  private updatePropertiesPanel(instanceId: string | null, connectorId: string | null) {
    // Clear existing content (except title)
    const title = this.propertiesPanel.querySelector('h3');
    this.propertiesPanel.innerHTML = '';
    if (title) this.propertiesPanel.appendChild(title);
    
    if (!instanceId) {
      // No selection
      const noSelection = document.createElement('p');
      noSelection.textContent = 'No element selected';
      this.propertiesPanel.appendChild(noSelection);
      return;
    }
    
    const instance = this.trackElementManager
      .getTrackElementInstances()
      .find(i => i.elementId === instanceId);
    
    if (!instance) return;
    
    const elements = this.trackElementManager.getTrackElements();
    const element = elements.find(e => e.id === instance.elementId);
    
    if (!element) return;
    
    // Element properties section
    const elementProps = document.createElement('div');
    elementProps.className = 'properties-section';
    
    const elementTitle = document.createElement('h4');
    elementTitle.textContent = element.name;
    elementProps.appendChild(elementTitle);
    
    // Position controls
    const positionSection = document.createElement('div');
    positionSection.className = 'property-group';
    positionSection.innerHTML = `
      <label>Position:</label>
      <div class="property-controls">
        <div class="property-row">
          <label>X:</label>
          <input type="number" id="pos-x" value="${instance.position.x}" step="1" />
        </div>
        <div class="property-row">
          <label>Y:</label>
          <input type="number" id="pos-y" value="${instance.position.y}" step="1" />
        </div>
        <div class="property-row">
          <label>Z:</label>
          <input type="number" id="pos-z" value="${instance.position.z}" step="1" />
        </div>
      </div>
    `;
    elementProps.appendChild(positionSection);
    
    // Rotation controls
    const rotationSection = document.createElement('div');
    rotationSection.className = 'property-group';
    rotationSection.innerHTML = `
      <label>Rotation:</label>
      <div class="property-controls">
        <div class="property-row">
          <label>X:</label>
          <input type="number" id="rot-x" value="${instance.rotation.x}" step="0.1" />
        </div>
        <div class="property-row">
          <label>Y:</label>
          <input type="number" id="rot-y" value="${instance.rotation.y}" step="0.1" />
        </div>
        <div class="property-row">
          <label>Z:</label>
          <input type="number" id="rot-z" value="${instance.rotation.z}" step="0.1" />
        </div>
      </div>
    `;
    elementProps.appendChild(rotationSection);
    
    // Rotation buttons
    const rotationButtons = document.createElement('div');
    rotationButtons.className = 'property-buttons';
    
    const rotateYButton = document.createElement('button');
    rotateYButton.textContent = 'Rotate 90°';
    rotateYButton.addEventListener('click', () => {
      this.trackElementManager.rotateSelectedElement(0, Math.PI / 2, 0);
      this.markModified();
      this.updatePropertiesPanel(instanceId, connectorId);
    });
    
    const flipButton = document.createElement('button');
    flipButton.textContent = 'Flip';
    flipButton.addEventListener('click', () => {
      this.trackElementManager.rotateSelectedElement(Math.PI, 0, 0);
      this.markModified();
      this.updatePropertiesPanel(instanceId, connectorId);
    });
    
    rotationButtons.appendChild(rotateYButton);
    rotationButtons.appendChild(flipButton);
    elementProps.appendChild(rotationButtons);
    
    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete Element';
    deleteButton.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this element?')) {
        this.trackElementManager.removeTrackElementInstance(instanceId);
        this.markModified();
      }
    });
    elementProps.appendChild(deleteButton);
    
    // Add event listeners for property changes
    this.propertiesPanel.appendChild(elementProps);
    
    // Set up position and rotation input handlers
    const posX = document.getElementById('pos-x') as HTMLInputElement;
    const posY = document.getElementById('pos-y') as HTMLInputElement;
    const posZ = document.getElementById('pos-z') as HTMLInputElement;
    const rotX = document.getElementById('rot-x') as HTMLInputElement;
    const rotY = document.getElementById('rot-y') as HTMLInputElement;
    const rotZ = document.getElementById('rot-z') as HTMLInputElement;
    
    if (posX && posY && posZ && rotX && rotY && rotZ) {
      const updatePosition = () => {
        const x = parseFloat(posX.value);
        const y = parseFloat(posY.value);
        const z = parseFloat(posZ.value);
        
        this.trackElementManager.moveTrackElementInstance(
          instanceId,
          { x, y, z },
          instance.rotation
        );
        this.markModified();
      };
      
      const updateRotation = () => {
        const x = parseFloat(rotX.value);
        const y = parseFloat(rotY.value);
        const z = parseFloat(rotZ.value);
        
        this.trackElementManager.moveTrackElementInstance(
          instanceId,
          instance.position,
          { x, y, z }
        );
        this.markModified();
      };
      
      posX.addEventListener('change', updatePosition);
      posY.addEventListener('change', updatePosition);
      posZ.addEventListener('change', updatePosition);
      rotX.addEventListener('change', updateRotation);
      rotY.addEventListener('change', updateRotation);
      rotZ.addEventListener('change', updateRotation);
    }
    
    // Add connector information if a connector is selected
    if (connectorId) {
      // Find the connector
      const connector = element.connectors.find(c => c.id === connectorId);
      if (connector) {
        const connectorProps = document.createElement('div');
        connectorProps.className = 'properties-section';
        
        const connectorTitle = document.createElement('h4');
        connectorTitle.textContent = `Connector: ${connector.type}`;
        connectorProps.appendChild(connectorTitle);
        
        // Connector type selection
        const typeSection = document.createElement('div');
        typeSection.className = 'property-group';
        typeSection.innerHTML = `
          <label>Type:</label>
          <select id="connector-type">
            <option value="entry" ${connector.type === 'entry' ? 'selected' : ''}>Entry</option>
            <option value="exit" ${connector.type === 'exit' ? 'selected' : ''}>Exit</option>
            <option value="checkpoint" ${connector.type === 'checkpoint' ? 'selected' : ''}>Checkpoint</option>
          </select>
        `;
        connectorProps.appendChild(typeSection);
        
        this.propertiesPanel.appendChild(connectorProps);
        
        // Set up connector type change handler
        const typeSelect = document.getElementById('connector-type') as HTMLSelectElement;
        if (typeSelect) {
          typeSelect.addEventListener('change', () => {
            // Update connector type
            // This would require deeper integration with the element system
            // Not implemented in this example
            alert('Changing connector types is not implemented in this demo');
          });
        }
      }
    }
  }
  
  /**
   * Sets up auto-save functionality
   */
  private setupAutoSave() {
    // Set up auto-save interval
    this.autoSaveTimer = window.setInterval(() => {
      if (this.isModified) {
        console.log('Auto-saving track...');
        this.saveTrack(true); // Auto-save silently
        this.isModified = false;
      }
    }, AppConfig.autoSaveInterval);
    
    // Set up event listeners for window events
    window.addEventListener('hyperloop-racer:auto-save', () => {
      if (this.isModified) {
        this.saveTrack(true);
        this.isModified = false;
      }
    });
    
    window.addEventListener('hyperloop-racer:before-unload', () => {
      if (this.isModified) {
        this.saveTrack(true);
      }
    });
    
    // Also listen for actual beforeunload
    window.addEventListener('beforeunload', (event) => {
      if (this.isModified) {
        // Save before leaving
        this.saveTrack(true);
        
        // Show confirmation dialog if changes might be lost
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }
  
  /**
   * Marks the track as modified for auto-save
   */
  private markModified() {
    this.isModified = true;
  }
  
  /**
   * Adds a track element to the scene
   * @param elementId ID of the element to add
   */
  private addTrackElement(elementId: string) {
    // Get camera position to place element in front of camera
    const camera = this.engine.getCamera();
    const forward = camera.getTarget().subtract(camera.position).normalize();
    
    // Calculate position 20 units in front of camera
    const position = camera.position.add(forward.scale(20));
    
    // Create instance
    const instanceId = this.trackElementManager.createTrackElementInstance(
      elementId,
      {
        x: position.x,
        y: position.y,
        z: position.z
      },
      { x: 0, y: 0, z: 0 }
    );
    
    if (instanceId) {
      console.log(`Added track element ${elementId} with instance ID ${instanceId}`);
      
      // Select the new instance
      this.trackElementManager.selectInstance(instanceId);
      
      // Mark as modified
      this.markModified();
    }
  }
  
  /**
   * Creates a new track
   */
  private newTrack() {
    if (this.isModified) {
      const confirmNew = confirm('You have unsaved changes. Are you sure you want to create a new track?');
      if (!confirmNew) return;
    }
    
    // Show dialog for track details
    const trackName = prompt('Enter a name for the new track:', 'New Track');
    if (!trackName) return; // User cancelled
    
    const authorName = prompt('Enter your name as the author:', 'Anonymous');
    if (!authorName) return; // User cancelled
    
    // Create new track
    this.currentTrack = new TrackClass({
      id: generateUUID(),
      name: trackName,
      author: authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
      bestTimes: []
    });
    
    // Clear scene
    this.trackElementManager.updateFromTrack([]);
    
    // Reset modified flag
    this.isModified = false;
    
    console.log(`Created new track: ${trackName} by ${authorName}`);
  }
  
  /**
   * Loads a track from storage
   */
  private loadTrack() {
    if (this.isModified) {
      const confirmLoad = confirm('You have unsaved changes. Are you sure you want to load another track?');
      if (!confirmLoad) return;
    }
    
    // Get available tracks
    const tracks = TrackClass.getAllTracks();
    
    if (tracks.length === 0) {
      alert('No saved tracks found.');
      return;
    }
    
    // Create a dialog to select a track
    const dialog = document.createElement('dialog');
    dialog.className = 'track-select-dialog';
    
    let dialogContent = `
      <h2>Select a Track</h2>
      <div class="track-list">
    `;
    
    tracks.forEach(track => {
      dialogContent += `
        <div class="track-item" data-track-id="${track.id}">
          <div class="track-info">
            <h3>${track.name}</h3>
            <p>By ${track.author}</p>
            <p>Last updated: ${new Date(track.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      `;
    });
    
    dialogContent += `
      </div>
      <div class="dialog-buttons">
        <button id="cancel-load">Cancel</button>
      </div>
    `;
    
    dialog.innerHTML = dialogContent;
    document.body.appendChild(dialog);
    
    // Set up event handlers
    dialog.querySelector('#cancel-load')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
    
    dialog.querySelectorAll('.track-item').forEach(item => {
      item.addEventListener('click', () => {
        const trackId = (item as HTMLElement).dataset.trackId;
        if (trackId) {
          const loadedTrack = TrackClass.loadFromStorage(trackId);
          if (loadedTrack) {
            this.currentTrack = loadedTrack;
            
            // Load track elements into scene
            this.trackElementManager.updateFromTrack(loadedTrack.getData().elements);
            
            console.log(`Loaded track: ${loadedTrack.getData().name}`);
            this.isModified = false;
          }
        }
        
        dialog.close();
        dialog.remove();
      });
    });
    
    // Show the dialog
    dialog.showModal();
  }
  
  /**
   * Saves the current track to storage
   * @param silent Whether to suppress notifications
   */
  private saveTrack(silent: boolean = false) {
    // Get current track elements from the manager
    const instances = this.trackElementManager.getTrackElementInstances();
    
    // Update track data
    const trackData = this.currentTrack.getData();
    trackData.elements = instances;
    trackData.updatedAt = new Date().toISOString();
    
    // Create a new track instance with updated data
    this.currentTrack = new TrackClass(trackData);
    
    // Save to storage
    const success = this.currentTrack.saveToStorage();
    
    if (success) {
      console.log(`Saved track: ${this.currentTrack.getData().name}`);
      this.isModified = false;
      
      if (!silent) {
        alert('Track saved successfully!');
      }
    } else {
      console.error('Failed to save track');
      
      if (!silent) {
        alert('Failed to save track. Please try again.');
      }
    }
  }
  
  /**
   * Exports the current track as a file
   */
  private async exportTrack() {
    // Make sure track is saved first
    if (this.isModified) {
      const confirmExport = confirm('You have unsaved changes. Save before exporting?');
      if (confirmExport) {
        this.saveTrack(true);
      }
    }
    
    try {
      // Export to zip
      const blob = await this.currentTrack.exportToZip();
      
      // Create download link
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${this.currentTrack.getData().name.replace(/\s+/g, '_')}.zip`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log(`Exported track: ${this.currentTrack.getData().name}`);
    } catch (error) {
      console.error('Failed to export track:', error);
      alert('Failed to export track. Please try again.');
    }
  }
  
  /**
   * Launches test mode with the current track
   */
  private testTrack() {
    // Make sure track is saved first
    if (this.isModified) {
      const confirmTest = confirm('You have unsaved changes. Save before testing?');
      if (confirmTest) {
        this.saveTrack(true);
      }
    }
    
    // Get the current track ID
    const trackId = this.currentTrack.getData().id;
    
    // Navigate to test mode with track ID
    window.location.href = `${window.location.origin}${window.location.pathname}?mode=test&track=${trackId}`;
  }
  
  /**
   * Shows help information
   */
  private showHelp() {
    const dialog = document.createElement('dialog');
    dialog.className = 'help-dialog';
    
    dialog.innerHTML = `
      <h2>Hyperloop Racer Editor Help</h2>
      
      <h3>Basic Controls</h3>
      <ul>
        <li><strong>Camera:</strong> Click and drag to rotate, scroll to zoom</li>
        <li><strong>Add Elements:</strong> Click on track elements in the left panel</li>
        <li><strong>Select Elements:</strong> Click on elements in the 3D view</li>
        <li><strong>Move Elements:</strong> Click and drag selected elements</li>
        <li><strong>Delete Element:</strong> Select element and press Delete or use button in Properties panel</li>
        <li><strong>Rotate Element:</strong> Select element and press R or use button in Properties panel</li>
      </ul>
      
      <h3>Track Building Tips</h3>
      <ul>
        <li>Connect elements by dragging them close to each other's connectors</li>
        <li>Entry connectors (green) connect to Exit connectors (red)</li>
        <li>Use checkpoint connectors (yellow) to control the track path</li>
        <li>Save often to avoid losing work</li>
      </ul>
      
      <div class="dialog-buttons">
        <button id="close-help">Close</button>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Set up close button
    dialog.querySelector('#close-help')?.addEventListener('click', () => {
      dialog.close();
      dialog.remove();
    });
    
    // Show the dialog
    dialog.showModal();
  }
  
  /**
   * Disposes resources and cleans up
   */
  public dispose() {
    // Clear auto-save timer
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
    }
    
    // Make sure to save any changes
    if (this.isModified) {
      this.saveTrack(true);
    }
    
    // Dispose track element manager
    this.trackElementManager.dispose();
    
    // Dispose engine
    if (this.engine) {
      this.engine.dispose();
    }
  }
}

/**
 * Initializes the editor mode
 * @param container The container element
 */
export async function initializeEditor(container: HTMLElement): Promise<void> {
  console.log('Initializing editor mode...');
  
  // Clear container
  container.innerHTML = '';
  
  // Create and initialize the editor manager
  const editorManager = new EditorManager(container);
  
  return Promise.resolve();
}