import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElement, TrackElementInstance, Track } from "../data/types";
import { AppConfig } from "../config/AppConfig";

/**
 * EditorManager handles the track editor functionality
 */
export class EditorManager {
  private engine: BabylonEngine;
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private canvas: HTMLCanvasElement;
  private trackElements: TrackElement[] = [];
  private currentTrack: Track;

  /**
   * Creates a new EditorManager instance
   * @param container Parent container element
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.setupUI();
    
    // Initialize BabylonEngine with the created canvas
    this.engine = new BabylonEngine(this.canvas);
    
    // Initialize with empty track
    this.currentTrack = this.createEmptyTrack();
    
    // Load available track elements
    this.loadTrackElements();
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
    
    toolbarLeft.appendChild(newButton);
    toolbarLeft.appendChild(loadButton);
    toolbarLeft.appendChild(saveButton);
    
    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'toolbar-section';
    
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Track';
    testButton.addEventListener('click', () => this.testTrack());
    
    toolbarRight.appendChild(testButton);
    
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
    
    const elementsPanel = document.createElement('div');
    elementsPanel.className = 'editor-panel';
    elementsPanel.appendChild(elementsPanelTitle);
    elementsPanel.id = 'trackElementsPanel';
    
    const propertiesPanel = document.createElement('div');
    propertiesPanel.className = 'editor-panel';
    
    const propertiesPanelTitle = document.createElement('h3');
    propertiesPanelTitle.textContent = 'Properties';
    propertiesPanel.appendChild(propertiesPanelTitle);
    propertiesPanel.id = 'propertiesPanel';
    
    sidebar.appendChild(elementsPanel);
    sidebar.appendChild(propertiesPanel);
    
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
   * Creates a new empty track
   */
  private createEmptyTrack(): Track {
    return {
      id: Date.now().toString(),
      name: 'New Track',
      author: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
      bestTimes: []
    };
  }
  
  /**
   * Loads available track elements
   */
  private loadTrackElements() {
    // TODO: Implement loading track elements from storage or predefined ones
    console.log('Loading track elements...');
    
    // For now, we'll just create some dummy elements
    // In a real implementation, we would load these from a database or file
  }
  
  /**
   * Creates a new track
   */
  private newTrack() {
    if (confirm('Are you sure? Unsaved changes will be lost.')) {
      this.currentTrack = this.createEmptyTrack();
      // TODO: Clear the scene and reset the editor
      console.log('Created new track');
    }
  }
  
  /**
   * Loads a track from storage
   */
  private loadTrack() {
    // TODO: Implement track loading from storage
    console.log('Load track dialog not implemented yet');
  }
  
  /**
   * Saves the current track to storage
   */
  private saveTrack() {
    // TODO: Implement track saving to storage
    console.log('Save track not implemented yet');
  }
  
  /**
   * Launches test mode with the current track
   */
  private testTrack() {
    // TODO: Implement switching to test mode with current track
    console.log('Test track not implemented yet');
  }
  
  /**
   * Disposes resources and cleans up
   */
  public dispose() {
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