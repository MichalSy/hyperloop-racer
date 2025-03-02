import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3 as BabylonVector3, TransformNode, Mesh, LinesMesh, PointerEventTypes, PointerInfo, ActionManager, ExecuteCodeAction } from 'babylonjs';
import { TrackElement, TrackElementInstance, Vector3, ConnectorType } from '../data/types';
import { DefaultTrackElements } from '../data/track-elements/default-elements';
import { AppConfig } from '../config/AppConfig';
import { TrackElementLibrary } from '../data/track-elements/TrackElementLibrary';
import { generateUUID, toBabylonVector3, toAppVector3 } from '../utils/helpers';
import { PhysicsSystem } from '../engine/PhysicsSystem';

/**
 * Manages track elements and their instances in the editor
 */
export class TrackElementManager {
  private scene: Scene;
  private trackElements: Map<string, TrackElement> = new Map();
  private trackElementInstances: Map<string, TrackElementInstance> = new Map();
  private meshes: Map<string, TransformNode> = new Map();
  private selectedInstanceId: string | null = null;
  private selectedConnectorId: string | null = null;
  private isDragging: boolean = false;
  private dragStartPosition: BabylonVector3 | null = null;
  private trackElementLibrary: TrackElementLibrary;
  private physicsSystem: PhysicsSystem;
  private snapDistance: number = 1.5; // Distance for connectors to snap
  private onSelectionChange: ((instanceId: string | null, connectorId: string | null) => void) | null = null;
  private highlightMesh: Mesh | null = null;
  
  /**
   * Creates a new TrackElementManager instance
   * @param scene Babylon.js scene to use
   * @param physicsSystem Physics system
   */
  constructor(scene: Scene, physicsSystem: PhysicsSystem) {
    this.scene = scene;
    this.physicsSystem = physicsSystem;
    this.trackElementLibrary = TrackElementLibrary.getInstance(scene, physicsSystem);
    this.init();
  }
  
  /**
   * Initializes the manager by loading default track elements and setting up event handlers
   */
  private init() {
    // Register default track elements
    DefaultTrackElements.forEach(element => {
      this.registerTrackElement(element);
    });
    
    // Set up event handlers
    this.setupPointerHandlers();
    
    // Create highlight mesh
    this.createHighlightMesh();
  }
  
  /**
   * Creates a highlight mesh for selections
   */
  private createHighlightMesh(): void {
    this.highlightMesh = MeshBuilder.CreateBox(
      "highlight-mesh", 
      { size: 1 }, 
      this.scene
    );
    
    const material = new StandardMaterial("highlight-material", this.scene);
    material.diffuseColor = new Color3(0, 0.8, 0.8);
    material.alpha = 0.3;
    material.wireframe = true;
    
    this.highlightMesh.material = material;
    this.highlightMesh.isVisible = false;
  }
  
  /**
   * Sets up pointer event handlers for interaction
   */
  private setupPointerHandlers(): void {
    // Pointer down - start selection or dragging
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const pickResult = this.scene.pick(
          this.scene.pointerX, 
          this.scene.pointerY,
          (mesh) => mesh.name.startsWith('track-element-') || mesh.name.startsWith('connector-')
        );
        
        if (pickResult.hit) {
          const mesh = pickResult.pickedMesh;
          
          if (mesh) {
            if (mesh.name.startsWith('track-element-')) {
              // Picked a track element
              const instanceId = mesh.name.replace('track-element-', '');
              this.selectInstance(instanceId);
              
              // Start drag operation
              this.isDragging = true;
              this.dragStartPosition = pickResult.pickedPoint?.clone() || null;
            } else if (mesh.name.startsWith('connector-')) {
              // Picked a connector
              const connectorId = mesh.name.replace('connector-', '');
              const parentMesh = mesh.parent as Mesh;
              
              if (parentMesh && parentMesh.name.startsWith('track-element-')) {
                const instanceId = parentMesh.name.replace('track-element-', '');
                this.selectInstance(instanceId, connectorId);
              }
            }
          }
        } else {
          // Clicked on empty space, deselect
          this.selectInstance(null);
        }
      }
    }, PointerEventTypes.POINTERDOWN);
    
    // Pointer up - end dragging
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERUP) {
        if (this.isDragging && this.selectedInstanceId) {
          this.isDragging = false;
          this.dragStartPosition = null;
          
          // Check for connector snapping
          this.tryConnectorSnapping(this.selectedInstanceId);
        }
      }
    }, PointerEventTypes.POINTERUP);
    
    // Pointer move - handle dragging
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
        if (this.isDragging && this.selectedInstanceId && this.dragStartPosition) {
          const pickResult = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            (mesh) => mesh.name === 'ground' || mesh.name === 'grid'
          );
          
          if (pickResult.hit && pickResult.pickedPoint) {
            const delta = pickResult.pickedPoint.subtract(this.dragStartPosition);
            this.moveSelectedElement(delta);
            this.dragStartPosition = pickResult.pickedPoint.clone();
          }
        }
      }
    }, PointerEventTypes.POINTERMOVE);
    
    // Key handler for rotation and deletion
    window.addEventListener('keydown', (event) => {
      if (!this.selectedInstanceId) return;
      
      if (event.key === 'Delete') {
        // Delete selected element
        this.removeTrackElementInstance(this.selectedInstanceId);
        this.selectInstance(null);
      } else if (event.key === 'r' || event.key === 'R') {
        // Rotate element around Y axis
        this.rotateSelectedElement(0, Math.PI / 2, 0);
      } else if (event.key === 'f' || event.key === 'F') {
        // Flip element upside down
        this.rotateSelectedElement(Math.PI, 0, 0);
      }
    });
  }
  
  /**
   * Tries to snap the selected element to nearby connectors
   */
  private tryConnectorSnapping(instanceId: string): void {
    const instance = this.trackElementInstances.get(instanceId);
    if (!instance) return;
    
    const element = this.trackElements.get(instance.elementId);
    if (!element) return;
    
    // Get connectors of this instance
    const connectors = element.connectors;
    
    // For each connector on this element, check for nearby connectors
    for (const connector of connectors) {
      // Skip if not entry or exit connector
      if (connector.type !== ConnectorType.ENTRY && connector.type !== ConnectorType.EXIT) {
        continue;
      }
      
      // Get world position of this connector
      const mesh = this.meshes.get(instanceId);
      if (!mesh) continue;
      
      const connectorWorldPos = BabylonVector3.TransformCoordinates(
        toBabylonVector3(connector.position),
        mesh.getWorldMatrix()
      );
      
      // Check for other instances' connectors
      for (const [otherInstanceId, otherInstance] of this.trackElementInstances.entries()) {
        // Skip self
        if (otherInstanceId === instanceId) continue;
        
        const otherElement = this.trackElements.get(otherInstance.elementId);
        if (!otherElement) continue;
        
        const otherMesh = this.meshes.get(otherInstanceId);
        if (!otherMesh) continue;
        
        // Check each connector
        for (const otherConnector of otherElement.connectors) {
          // Skip if not compatible
          if (!this.areConnectorsCompatible(connector, otherConnector)) {
            continue;
          }
          
          // Get world position
          const otherConnectorWorldPos = BabylonVector3.TransformCoordinates(
            toBabylonVector3(otherConnector.position),
            otherMesh.getWorldMatrix()
          );
          
          // Check distance
          const distance = BabylonVector3.Distance(connectorWorldPos, otherConnectorWorldPos);
          
          if (distance < this.snapDistance) {
            // Snap this element to align with other connector
            this.snapConnectors(instanceId, connector, otherInstanceId, otherConnector);
            return; // Exit after first snap
          }
        }
      }
    }
  }
  
  /**
   * Determines if two connectors are compatible for connection
   */
  private areConnectorsCompatible(a: any, b: any): boolean {
    // Entry connects to exit and vice versa
    return (a.type === ConnectorType.ENTRY && b.type === ConnectorType.EXIT) ||
           (a.type === ConnectorType.EXIT && b.type === ConnectorType.ENTRY);
  }
  
  /**
   * Snaps two connectors together
   */
  private snapConnectors(
    instanceId: string,
    connector: any,
    otherInstanceId: string,
    otherConnector: any
  ): void {
    const mesh = this.meshes.get(instanceId);
    const otherMesh = this.meshes.get(otherInstanceId);
    
    if (!mesh || !otherMesh) return;
    
    // Get current positions and rotations
    const connectorLocalPos = toBabylonVector3(connector.position);
    const otherConnectorLocalPos = toBabylonVector3(otherConnector.position);
    
    // Get world positions
    const connectorWorldPos = BabylonVector3.TransformCoordinates(
      connectorLocalPos,
      mesh.getWorldMatrix()
    );
    
    const otherConnectorWorldPos = BabylonVector3.TransformCoordinates(
      otherConnectorLocalPos,
      otherMesh.getWorldMatrix()
    );
    
    // Get normal vectors (in world space)
    const connectorNormal = BabylonVector3.TransformNormal(
      toBabylonVector3(connector.normal),
      mesh.getWorldMatrix()
    ).normalize();
    
    const otherConnectorNormal = BabylonVector3.TransformNormal(
      toBabylonVector3(otherConnector.normal),
      otherMesh.getWorldMatrix()
    ).normalize();
    
    // Calculate rotation needed to align normals
    // We want connector normal to point in opposite direction of otherConnectorNormal
    const targetDirection = otherConnectorNormal.scale(-1);
    
    // Calculate new position - move connector to match otherConnector position
    const offset = connectorWorldPos.subtract(mesh.position);
    const newPosition = otherConnectorWorldPos.subtract(offset);
    
    // Update instance position and calculate new rotation
    const instance = this.trackElementInstances.get(instanceId);
    if (instance) {
      // Update position
      instance.position = toAppVector3(newPosition);
      mesh.position = newPosition;
      
      // TODO: Implement proper rotation alignment
      // This is a simplified approach that may not work for all cases
      // Calculate rotation to align normals
      
      // Update connectors with new world positions
      this.updateInstanceConnectors(instanceId);
      
      // Update visuals
      this.updateHighlight();
    }
  }
  
  /**
   * Updates the world positions of an instance's connectors
   */
  private updateInstanceConnectors(instanceId: string): void {
    const instance = this.trackElementInstances.get(instanceId);
    const element = instance ? this.trackElements.get(instance.elementId) : null;
    const mesh = this.meshes.get(instanceId);
    
    if (!instance || !element || !mesh) return;
    
    // Reset connectors object
    instance.connectors = {};
    
    // Update each connector's world position and orientation
    element.connectors.forEach(connector => {
      const worldMatrix = mesh.getWorldMatrix();
      
      const worldPosition = BabylonVector3.TransformCoordinates(
        toBabylonVector3(connector.position),
        worldMatrix
      );
      
      const worldNormal = BabylonVector3.TransformNormal(
        toBabylonVector3(connector.normal),
        worldMatrix
      );
      worldNormal.normalize();
      
      const worldUpVector = BabylonVector3.TransformNormal(
        toBabylonVector3(connector.upVector),
        worldMatrix
      );
      worldUpVector.normalize();
      
      instance.connectors[connector.id] = {
        worldPosition: toAppVector3(worldPosition),
        worldNormal: toAppVector3(worldNormal),
        worldUpVector: toAppVector3(worldUpVector)
      };
    });
  }
  
  /**
   * Selects a track element instance and optionally a connector
   */
  private selectInstance(instanceId: string | null, connectorId: string | null = null): void {
    this.selectedInstanceId = instanceId;
    this.selectedConnectorId = connectorId;
    
    // Update visual highlight
    this.updateHighlight();
    
    // Notify selection change
    if (this.onSelectionChange) {
      this.onSelectionChange(instanceId, connectorId);
    }
  }
  
  /**
   * Updates the highlight mesh to show selection
   */
  private updateHighlight(): void {
    if (!this.highlightMesh) return;
    
    if (this.selectedInstanceId) {
      const mesh = this.meshes.get(this.selectedInstanceId);
      
      if (mesh) {
        this.highlightMesh.isVisible = true;
        this.highlightMesh.position = mesh.position.clone();
        this.highlightMesh.rotation = mesh.rotation.clone();
        
        // Scale to match the selected element
        const instance = this.trackElementInstances.get(this.selectedInstanceId);
        const element = instance ? this.trackElements.get(instance.elementId) : null;
        
        if (element) {
          this.highlightMesh.scaling.set(
            element.dimensions.width + 0.1,
            element.dimensions.height + 0.1,
            element.dimensions.depth + 0.1
          );
        }
      }
    } else {
      this.highlightMesh.isVisible = false;
    }
  }
  
  /**
   * Moves the selected element by the specified delta
   */
  private moveSelectedElement(delta: BabylonVector3): void {
    if (!this.selectedInstanceId) return;
    
    const mesh = this.meshes.get(this.selectedInstanceId);
    const instance = this.trackElementInstances.get(this.selectedInstanceId);
    
    if (!mesh || !instance) return;
    
    // Update mesh position
    mesh.position.addInPlace(delta);
    
    // Update instance data
    instance.position = toAppVector3(mesh.position);
    
    // Update connectors
    this.updateInstanceConnectors(this.selectedInstanceId);
    
    // Update highlight
    this.updateHighlight();
  }
  
  /**
   * Rotates the selected element by the specified angles
   */
  private rotateSelectedElement(x: number, y: number, z: number): void {
    if (!this.selectedInstanceId) return;
    
    const mesh = this.meshes.get(this.selectedInstanceId);
    const instance = this.trackElementInstances.get(this.selectedInstanceId);
    
    if (!mesh || !instance) return;
    
    // Update mesh rotation
    mesh.rotation.x += x;
    mesh.rotation.y += y;
    mesh.rotation.z += z;
    
    // Update instance data
    instance.rotation = toAppVector3(mesh.rotation);
    
    // Update connectors
    this.updateInstanceConnectors(this.selectedInstanceId);
    
    // Update highlight
    this.updateHighlight();
  }
  
  /**
   * Registers a track element in the manager
   * @param element TrackElement to register
   * @returns true if successful, false if element already exists
   */
  public registerTrackElement(element: TrackElement): boolean {
    if (this.trackElements.has(element.id)) {
      console.warn(`Track element with ID ${element.id} already exists`);
      return false;
    }
    
    this.trackElements.set(element.id, { ...element });
    return true;
  }
  
  /**
   * Gets all available track elements
   * @returns Array of track elements
   */
  public getTrackElements(): TrackElement[] {
    return Array.from(this.trackElements.values());
  }
  
  /**
   * Creates an instance of a track element in the scene
   * @param elementId ID of the track element to instantiate
   * @param position Position in world space
   * @param rotation Rotation in world space (Euler angles)
   * @returns ID of the created instance or null if failed
   */
  public createTrackElementInstance(
    elementId: string,
    position: Vector3,
    rotation: Vector3
  ): string | null {
    const element = this.trackElements.get(elementId);
    
    if (!element) {
      console.error(`Track element with ID ${elementId} not found`);
      return null;
    }
    
    const instanceId = generateUUID();
    
    try {
      // Use the TrackElementLibrary to create the mesh
      const rootNode = this.trackElementLibrary.createTrackElementMesh(element);
      rootNode.name = `track-element-${instanceId}`;
      
      // Set position and rotation
      rootNode.position = toBabylonVector3(position);
      rootNode.rotation = new BabylonVector3(
        rotation.x,
        rotation.y,
        rotation.z
      );
      
      // Create instance data
      const instance: TrackElementInstance = {
        elementId: element.id,
        position,
        rotation,
        connectors: {}
      };
      
      // Register the instance
      this.trackElementInstances.set(instanceId, instance);
      this.meshes.set(instanceId, rootNode);
      
      // Update connector world positions
      this.updateInstanceConnectors(instanceId);
      
      return instanceId;
    } catch (error) {
      console.error(`Failed to create track element instance:`, error);
      return null;
    }
  }
  
  /**
   * Removes a track element instance from the scene
   * @param instanceId ID of the instance to remove
   * @returns true if successful, false if instance not found
   */
  public removeTrackElementInstance(instanceId: string): boolean {
    const mesh = this.meshes.get(instanceId);
    
    if (!mesh) {
      console.warn(`Track element instance with ID ${instanceId} not found`);
      return false;
    }
    
    mesh.dispose();
    this.meshes.delete(instanceId);
    this.trackElementInstances.delete(instanceId);
    
    // Clear selection if this was the selected instance
    if (this.selectedInstanceId === instanceId) {
      this.selectInstance(null);
    }
    
    return true;
  }
  
  /**
   * Gets all track element instances
   * @returns Array of track element instances
   */
  public getTrackElementInstances(): TrackElementInstance[] {
    return Array.from(this.trackElementInstances.values());
  }
  
  /**
   * Moves a track element instance to a new position
   * @param instanceId ID of the instance to move
   * @param position New position
   * @param rotation New rotation
   * @returns true if successful, false if instance not found
   */
  public moveTrackElementInstance(
    instanceId: string,
    position: Vector3,
    rotation: Vector3
  ): boolean {
    const instance = this.trackElementInstances.get(instanceId);
    const mesh = this.meshes.get(instanceId);
    
    if (!instance || !mesh) {
      console.warn(`Track element instance with ID ${instanceId} not found`);
      return false;
    }
    
    // Update the mesh transform
    mesh.position = toBabylonVector3(position);
    mesh.rotation = new BabylonVector3(
      rotation.x,
      rotation.y,
      rotation.z
    );
    
    // Update the instance data
    instance.position = position;
    instance.rotation = rotation;
    
    // Update connector world positions
    this.updateInstanceConnectors(instanceId);
    
    // Update highlight if this is the selected instance
    if (this.selectedInstanceId === instanceId) {
      this.updateHighlight();
    }
    
    return true;
  }
  
  /**
   * Sets a selection change callback
   * @param callback Function to call when selection changes
   */
  public setOnSelectionChangeCallback(
    callback: (instanceId: string | null, connectorId: string | null) => void
  ): void {
    this.onSelectionChange = callback;
  }
  
  /**
   * Gets the currently selected instance
   * @returns Selected instance ID or null
   */
  public getSelectedInstanceId(): string | null {
    return this.selectedInstanceId;
  }
  
  /**
   * Gets the currently selected connector
   * @returns Selected connector ID or null
   */
  public getSelectedConnectorId(): string | null {
    return this.selectedConnectorId;
  }
  
  /**
   * Updates the track element instances from a track definition
   * @param trackElementInstances Array of track element instances to add
   * @param clear Whether to clear existing instances first
   */
  public updateFromTrack(trackElementInstances: TrackElementInstance[], clear: boolean = true): void {
    if (clear) {
      // Clear all current instances
      this.meshes.forEach(mesh => mesh.dispose());
      this.meshes.clear();
      this.trackElementInstances.clear();
    }
    
    // Add all instances from the track
    trackElementInstances.forEach(instance => {
      this.createTrackElementInstance(
        instance.elementId,
        instance.position,
        instance.rotation
      );
    });
  }
  
  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.meshes.forEach(mesh => mesh.dispose());
    this.meshes.clear();
    this.trackElementInstances.clear();
    
    if (this.highlightMesh) {
      this.highlightMesh.dispose();
      this.highlightMesh = null;
    }
  }
}