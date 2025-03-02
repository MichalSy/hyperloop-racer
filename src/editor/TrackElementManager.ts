import { Scene, MeshBuilder, StandardMaterial, Color3, Vector3 as BabylonVector3, TransformNode, Mesh, LinesMesh } from 'babylonjs';
import { TrackElement, TrackElementInstance, Vector3, ConnectorType } from '../data/types';
import { DefaultTrackElements } from '../data/track-elements/default-elements';
import { AppConfig } from '../config/AppConfig';
import { generateUUID, toBabylonVector3, toAppVector3 } from '../utils/helpers';

/**
 * Manages track elements and their instances in the editor
 */
export class TrackElementManager {
  private scene: Scene;
  private trackElements: Map<string, TrackElement> = new Map();
  private trackElementInstances: Map<string, TrackElementInstance> = new Map();
  private meshes: Map<string, TransformNode> = new Map();
  
  /**
   * Creates a new TrackElementManager instance
   * @param scene Babylon.js scene to use
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.init();
  }
  
  /**
   * Initializes the manager by loading default track elements
   */
  private init() {
    // Register default track elements
    DefaultTrackElements.forEach(element => {
      this.registerTrackElement(element);
    });
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
    
    this.trackElements.set(element.id, element);
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
    
    // Create a container for the entire element
    const rootNode = new TransformNode(`track-element-${instanceId}`, this.scene);
    rootNode.position = toBabylonVector3(position);
    rootNode.rotation = new BabylonVector3(
      rotation.x * Math.PI / 180,
      rotation.y * Math.PI / 180,
      rotation.z * Math.PI / 180
    );
    
    // Create the main mesh for the track element
    const cubikSize = AppConfig.track.cubikSize;
    const mainMesh = MeshBuilder.CreateBox(
      `track-element-mesh-${instanceId}`,
      {
        width: element.dimensions.width,
        height: element.dimensions.height,
        depth: element.dimensions.depth
      },
      this.scene
    );
    
    const material = new StandardMaterial(`track-element-mat-${instanceId}`, this.scene);
    material.diffuseColor = new Color3(0.5, 0.6, 0.8);
    material.alpha = 0.7;
    mainMesh.material = material;
    mainMesh.parent = rootNode;
    
    // Calculate world position of each connector
    const connectors: {[connectorId: string]: {
      worldPosition: Vector3,
      worldNormal: Vector3,
      worldUpVector: Vector3
    }} = {};
    
    // Create visual indicators for connectors
    element.connectors.forEach(connector => {
      // Create connector sphere
      const connectorMesh = MeshBuilder.CreateSphere(
        `connector-${connector.id}`,
        { diameter: AppConfig.track.connectorRadius * 2 },
        this.scene
      );
      
      // Set connector position relative to the element
      connectorMesh.position = toBabylonVector3(connector.position);
      connectorMesh.parent = rootNode;
      
      // Set color based on connector type
      const connectorMaterial = new StandardMaterial(
        `connector-mat-${connector.id}`,
        this.scene
      );
      
      switch (connector.type) {
        case ConnectorType.ENTRY:
          connectorMaterial.diffuseColor = new Color3(0.2, 0.8, 0.2); // Green
          break;
        case ConnectorType.EXIT:
          connectorMaterial.diffuseColor = new Color3(0.8, 0.2, 0.2); // Red
          break;
        case ConnectorType.CHECKPOINT:
          connectorMaterial.diffuseColor = new Color3(0.9, 0.9, 0.1); // Yellow
          break;
      }
      
      connectorMesh.material = connectorMaterial;
      
      // Create direction arrow
      const normalVector = toBabylonVector3(connector.normal);
      const arrowLength = AppConfig.track.connectorArrowLength;
      const arrowStart = toBabylonVector3(connector.position);
      const arrowEnd = arrowStart.add(normalVector.scale(arrowLength));
      
      const arrowMesh = MeshBuilder.CreateLines(
        `connector-arrow-${connector.id}`,
        { points: [arrowStart, arrowEnd] },
        this.scene
      );
      arrowMesh.color = connectorMaterial.diffuseColor;
      arrowMesh.parent = rootNode;
      
      // Convert the connector's world position and orientation
      const worldMatrix = rootNode.getWorldMatrix();
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
      
      // Store world space connector info
      connectors[connector.id] = {
        worldPosition: toAppVector3(worldPosition),
        worldNormal: toAppVector3(worldNormal),
        worldUpVector: toAppVector3(worldUpVector)
      };
    });
    
    // Create instance data
    const instance: TrackElementInstance = {
      elementId: element.id,
      position,
      rotation,
      connectors
    };
    
    // Register the instance
    this.trackElementInstances.set(instanceId, instance);
    this.meshes.set(instanceId, rootNode);
    
    return instanceId;
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
      rotation.x * Math.PI / 180,
      rotation.y * Math.PI / 180,
      rotation.z * Math.PI / 180
    );
    
    // Update the instance data
    instance.position = position;
    instance.rotation = rotation;
    
    // Re-calculate connector world positions
    const element = this.trackElements.get(instance.elementId);
    if (!element) {
      return false;
    }
    
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
    
    return true;
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
  }
}