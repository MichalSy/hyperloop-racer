import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { BabylonEngine } from "../engine/BabylonEngine";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { TrackElementManager } from "./TrackElementManager";
import { Vector3 } from '@babylonjs/core';
import { Track } from "../data/Track";
import { AppConfig } from '../config/AppConfig';
import { TrackData } from '../data/types';

/**
 * EditorManager handles the track editor functionality
 */
export class EditorManager {
    private engine!: BabylonEngine;
    private canvasContainer!: HTMLElement;
    private canvas!: HTMLCanvasElement;
    private elementPanel!: HTMLElement;
    private propertiesPanel!: HTMLElement;
    private trackElementManager!: TrackElementManager;
    private trackElementLibrary!: TrackElementLibrary;
    private physicsSystem!: PhysicsSystem;
    private currentTrack!: Track;
    private autoSaveTimer: number | null = null;
    private isModified: boolean = false;

    constructor(container: HTMLElement) {
        this.initialize(container);
    }

    private async initialize(container: HTMLElement) {
        this.setupUI(container);
        this.engine = new BabylonEngine(this.canvas);
        this.physicsSystem = new PhysicsSystem(this.engine.getScene());
        this.trackElementLibrary = TrackElementLibrary.getInstance(
            this.engine.getScene()
        );
        this.trackElementManager = new TrackElementManager(
            this.engine.getScene(),
            this.trackElementLibrary,
            this.physicsSystem
        );
        this.currentTrack = new Track();

        // Move setupPanels here after trackElementLibrary is initialized
        this.setupPanels();
        
        this.setupEventListeners();
        this.populateElementPanel();
        this.trackElementManager.setOnSelectionChangeCallback(
            (instanceId: string, connectorId?: string) => {
                if (instanceId) {
                    this.updatePropertiesPanel(instanceId, connectorId || null);
                }
            }
        );
        this.setupAutoSave();
        
        // Add initial start segment
        this.initializeTrackWithStartSegment();
    }

    private initializeTrackWithStartSegment() {
        // Add a start segment at the center of the scene
        const startPosition = new Vector3(0, 0, 0);
        const instance = this.trackElementManager.createTrackElementInstance(
            'start-segment',
            startPosition,
            new Vector3(0, 0, 0)
        );
        
        if (instance) {
            this.currentTrack.addElement(instance);
            this.trackElementManager.selectElement(instance.id);
            this.markModified();
            
            // Position camera to view the start segment
            const camera = this.engine.getCamera();
            camera.position = new Vector3(0, 20, -30); // Position camera above and behind start segment
            camera.setTarget(new Vector3(0, 0, 0)); // Look at the center
        }
    }

    private setupUI(container: HTMLElement) {
        // Create main editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        
        // Create editor main section
        const editorMain = document.createElement('div');
        editorMain.className = 'editor-main';
        
        // Create panels and canvas
        this.elementPanel = document.createElement('div');
        this.elementPanel.className = 'element-panel';
        this.elementPanel.innerHTML = '<h3>Track Elements</h3>';
        
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'canvas-container';
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'editor-canvas';
        
        this.propertiesPanel = document.createElement('div');
        this.propertiesPanel.className = 'properties-panel';
        this.propertiesPanel.innerHTML = '<h3>Properties</h3>';
        
        // Assemble the structure
        this.canvasContainer.appendChild(this.canvas);
        editorMain.appendChild(this.elementPanel);
        editorMain.appendChild(this.canvasContainer);
        editorMain.appendChild(this.propertiesPanel);
        editorContainer.appendChild(editorMain);
        container.appendChild(editorContainer);
    }

    private setupPanels() {
        // Implementation of panel setup
        const elements = this.trackElementLibrary.getAllElements();
        this.elementPanel.innerHTML = `
            <div class="panel-header">Track Elements</div>
            <div class="element-list">
                ${elements.map(element => `
                    <div class="element-item" data-element-id="${element.id}">
                        <div class="element-preview"></div>
                        <div class="element-info">
                            <div class="element-name">${element.name}</div>
                            <div class="element-desc">${element.description || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });

        // Add element panel click handlers
        this.elementPanel.addEventListener('click', (e) => {
            const elementItem = (e.target as HTMLElement).closest('.element-item');
            if (elementItem) {
                const elementId = elementItem.getAttribute('data-element-id');
                if (elementId) {
                    this.handleElementSelection(elementId);
                }
            }
        });

        this.trackElementManager.setOnSelectionChangeCallback(
            (instanceId: string, connectorId?: string) => {
                this.updatePropertiesPanel(instanceId, connectorId || null);
            }
        );
    }

    private handleElementSelection(elementId: string) {
        const element = this.trackElementLibrary.getElementById(elementId);
        if (element) {
            // Convert position to BabylonJS Vector3
            const position = new Vector3(
                element.position.x,
                element.position.y,
                element.position.z
            );
            this.trackElementManager.moveElement(elementId, position);
        }
    }

    public startEditor() {
        if (this.engine) {
            this.engine.startRenderLoop();
        }
    }

    private populateElementPanel() {
        // Clear existing content (except title)
        const title = this.elementPanel.querySelector('h3');
        this.elementPanel.innerHTML = '';
        if (title) this.elementPanel.appendChild(title);
        
        // Create element list
        const elementList = document.createElement('div');
        elementList.className = 'element-list';
        
        // Get all track elements
        const elements = this.trackElementLibrary.getAllElements();
        
        elements.forEach((element: any) => {
            const elementItem = document.createElement('div');
            elementItem.className = 'element-item';
            elementItem.dataset.elementId = element.id;
            
            // Create thumbnail or icon
            const thumbnail = document.createElement('div');
            thumbnail.className = 'element-thumbnail';
            
            // Visualization of the element shape based on dimensions
            const shape = document.createElement('div');
            shape.className = 'element-shape';
            // Position und Rotation statt Dimensionen verwenden
            shape.style.width = '40px';  // Standard-Größe
            shape.style.height = '40px';
            shape.style.transform = `translate3d(${element.position.x}px, ${element.position.y}px, ${element.position.z}px) 
                                   rotate3d(${element.rotation.x}rad, ${element.rotation.y}rad, ${element.rotation.z}rad)`;
            thumbnail.appendChild(shape);
            
            // Create element name
            const name = document.createElement('div');
            name.className = 'element-name';
            name.textContent = element.elementId;
            
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
        
        const elements = this.trackElementLibrary.getAllElements();
        const element = elements.find((e: any) => e.id === instance?.elementId);
        
        if (!element) return;
        
        // Element properties section
        const elementProps = document.createElement('div');
        elementProps.className = 'properties-section';
        
        const elementTitle = document.createElement('h4');
        elementTitle.textContent = element.id;
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
            if (this.trackElementManager.rotateElement) {
                this.trackElementManager.rotateElement(0, Math.PI / 2, 0);
            }
            this.markModified();
            this.updatePropertiesPanel(instanceId, connectorId);
        });
        
        const flipButton = document.createElement('button');
        flipButton.textContent = 'Flip';
        flipButton.addEventListener('click', () => {
            if (this.trackElementManager.rotateElement) {
                this.trackElementManager.rotateElement(Math.PI, 0, 0);
            }
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
            this.handleElementDeletion(instanceId);
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
                
                const selectedElement = this.trackElementManager.getSelectedElement();
                if (selectedElement) {
                    this.trackElementManager.moveElement(selectedElement.id,
                        new Vector3(x, y, z)
                    );
                    this.markModified();
                }
            };
            
            const updateRotation = () => {
                const x = parseFloat(rotX.value);
                const y = parseFloat(rotY.value);
                const z = parseFloat(rotZ.value);
                
                const selectedElement = this.trackElementManager.getSelectedElement();
                if (selectedElement) {
                    this.trackElementManager.rotateElement(x, y, z);
                    this.markModified();
                }
            };
            
            posX.addEventListener('change', updatePosition);
            posY.addEventListener('change', updatePosition);
            posZ.addEventListener('change', updatePosition);
            rotX.addEventListener('change', updateRotation);
            rotY.addEventListener('change', updateRotation);
            rotZ.addEventListener('change', updateRotation);
        }
        
        // Add connector information if a connector is selected
        if (instance?.connectors && connectorId) {
            const connector = instance.connectors.find(c => c.id === connectorId);
            if (connector) {
                const connectorProps = document.createElement('div');
                connectorProps.className = 'properties-section';
                
                const connectorTitle = document.createElement('h4');
                connectorTitle.textContent = `Connector: ${connector.id}`;
                connectorProps.appendChild(connectorTitle);
                
                // Connector position/rotation anzeigen statt type
                const positionInfo = document.createElement('div');
                positionInfo.textContent = `Position: (${connector.position.x}, ${connector.position.y}, ${connector.position.z})`;
                connectorProps.appendChild(positionInfo);
                
                this.propertiesPanel.appendChild(connectorProps);
            }
        }
    }

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

    private markModified() {
        this.isModified = true;
    }

    private updatePosition(instanceId: string, position: Vector3) {
        const selectedElement = this.trackElementManager.getSelectedElement();
        if (selectedElement) {
            this.trackElementManager.moveElement(selectedElement.id, position);
            this.markModified();
        }
    }

    private updateRotation(instanceId: string, rotation: Vector3) {
        const selectedElement = this.trackElementManager.getSelectedElement();
        if (selectedElement) {
            this.trackElementManager.rotateElement(rotation.x, rotation.y, rotation.z);
            this.markModified();
        }
    }

    private addTrackElement(elementId: string) {
        const camera = this.engine.getCamera();
        const forward = camera.getTarget().subtract(camera.position).normalize();
        const position = camera.position.add(forward.scale(20));
        
        const instance = this.trackElementManager.createTrackElementInstance(
            elementId,
            position,
            new Vector3(0, 0, 0)
        );
        
        if (instance) {
            this.trackElementManager.selectElement(instance.id);
            this.markModified();
        }
    }

    private saveTrack(silent: boolean = false) {
        // Get current track elements from the manager
        const instances = this.trackElementManager.getTrackElementInstances();
        
        // Update track data
        const trackData = this.currentTrack.getData();
        trackData.elements = instances;
        trackData.updatedAt = new Date().toISOString();
        
        // Create a new track instance with updated data
        this.currentTrack = new Track(trackData);
        
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

    private handleElementDeletion(instanceId: string) {
        if (confirm('Are you sure you want to delete this element?')) {
            // this.trackElementManager.removeElement(instanceId);
            this.markModified();
        }
    }

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

// Export the editor manager for use in other modules
export let activeEditorManager: EditorManager | null = null;

export async function initializeEditor(container: HTMLElement): Promise<void> {
    console.log('Initializing editor mode...');
    container.innerHTML = '';
    activeEditorManager = new EditorManager(container);
    return Promise.resolve();
}