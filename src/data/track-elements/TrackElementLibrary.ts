import { 
  Scene, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  Vector3, 
  Path3D,
  Mesh,
  Matrix,
  TransformNode,
  VertexData
} from '@babylonjs/core';
import { TrackElement, ConnectorType } from '../types';
import { DefaultTrackElements } from './default-elements';
import { AppConfig } from '../../config/AppConfig';
import { safeLocalStorageLoad, safeLocalStorageSave } from '../../utils/helpers';
import { PhysicsSystem } from '../../engine/PhysicsSystem';

/**
 * Manages the library of available track elements for the editor
 */
export class TrackElementLibrary {
  private static instance: TrackElementLibrary;
  private elements: TrackElement[] = [];
  private scene: Scene;
  private physicsSystem: PhysicsSystem;

  constructor(scene: Scene, physicsSystem: PhysicsSystem) {
    this.scene = scene;
    this.physicsSystem = physicsSystem;
    this.loadElements();
  }

  /**
   * Gets the singleton instance
   */
  public static getInstance(scene: Scene, physicsSystem: PhysicsSystem): TrackElementLibrary {
    if (!TrackElementLibrary.instance) {
      TrackElementLibrary.instance = new TrackElementLibrary(scene, physicsSystem);
    }
    return TrackElementLibrary.instance;
  }

  /**
   * Loads the elements from storage or defaults
   */
  private loadElements(): void {
    // Try to load custom elements from local storage
    const customElements = safeLocalStorageLoad<TrackElement[]>(
      AppConfig.storage.trackElements, 
      []
    );
    
    // Start with default elements
    this.elements = [...DefaultTrackElements];
    
    // Add custom elements, avoiding duplicates by ID
    customElements.forEach(element => {
      if (!this.elements.some(e => e.id === element.id)) {
        this.elements.push(element);
      }
    });
    
    console.log(`Loaded ${this.elements.length} track elements (${DefaultTrackElements.length} default, ${customElements.length} custom)`);
  }

  /**
   * Generates a 3D mesh for a track element with physics
   */
  public createTrackElementMesh(element: TrackElement): Mesh {
    const root = new TransformNode(`track-element-${element.id}`, this.scene);
    
    // Find entry and exit connectors
    const entry = element.connectors.find(c => c.type === ConnectorType.ENTRY);
    const exit = element.connectors.find(c => c.type === ConnectorType.EXIT);
    const checkpoints = element.connectors.filter(c => c.type === ConnectorType.CHECKPOINT);
    
    if (!entry || !exit) {
      throw new Error('Track element must have entry and exit connectors');
    }

    // Create track path
    const points = [
      Vector3.FromObject(entry.position),
      ...checkpoints.map(cp => Vector3.FromObject(cp.position)),
      Vector3.FromObject(exit.position)
    ];
    
    const path3d = new Path3D(points);
    const pathPoints = path3d.getPoints();
    const tangents = path3d.getTangents();
    const normals = path3d.getNormals();
    
    // Create the track surface with width
    const trackWidth = AppConfig.track.cubikSize;
    const trackShape = [];
    for (let i = 0; i < pathPoints.length; i++) {
      const normal = normals[i].scale(trackWidth / 2);
      trackShape.push(pathPoints[i].add(normal));
      trackShape.push(pathPoints[i].subtract(normal));
    }

    // Create the track mesh with proper UV mapping
    const track = MeshBuilder.CreateRibbon("track", {
      pathArray: [trackShape],
      closePath: false,
      closeArray: false,
      updatable: true,
      sideOrientation: Mesh.DOUBLESIDE
    }, this.scene);
    
    // Create materials with rainbow texture on top
    const trackMaterial = new StandardMaterial("trackMat", this.scene);
    trackMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
    trackMaterial.specularColor = new Color3(0.2, 0.2, 0.2);
    
    // Generate UVs for rainbow texture
    const vertexData = VertexData.ExtractFromMesh(track);
    const uvs = vertexData.uvs;
    if (uvs) {
      for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] = i / uvs.length; // Map U coordinate along track length
        uvs[i + 1] = Math.round(i / 2) % 2; // Alternate V coordinate for sides
      }
      vertexData.applyToMesh(track);
    }
    
    track.material = trackMaterial;
    track.parent = root;

    // Create collision mesh
    const collisionTrack = track.clone("collision-" + track.name);
    collisionTrack.isVisible = false;
    collisionTrack.parent = root;

    // Add physics
    this.physicsSystem.createStaticBody(
      collisionTrack,
      AppConfig.physics.defaultFriction,
      AppConfig.physics.defaultRestitution
    );

    // Store track normals for gravity calculation
    const trackSegments = [];
    for (let i = 0; i < pathPoints.length - 1; i++) {
      trackSegments.push({
        start: pathPoints[i],
        end: pathPoints[i + 1],
        normal: normals[i],
        tangent: tangents[i]
      });
    }
    
    // Attach segment data to root node for gravity calculations
    (root as any).trackSegments = trackSegments;
    
    return root;
  }
  
  /**
   * Updates the position and rotation of a track element
   */
  public updateTrackElementTransform(
    mesh: Mesh, 
    position: Vector3, 
    rotation: Vector3
  ): void {
    mesh.position = position;
    mesh.rotation = rotation;
    
    // Update physics impostor transformation if it exists
    const collisionMesh = this.scene.getMeshByName("collision-" + mesh.name);
    if (collisionMesh && collisionMesh.physicsImpostor) {
      collisionMesh.position = position;
      collisionMesh.rotation = rotation;
      collisionMesh.physicsImpostor.forceUpdate();
    }
  }

  /**
   * Gets the closest track segment and normal for gravity calculation
   */
  public getClosestTrackNormal(position: Vector3, mesh: Mesh): { normal: Vector3, point: Vector3 } | null {
    const segments = (mesh as any).trackSegments;
    if (!segments) return null;

    let closestDist = Infinity;
    let closestNormal = null;
    let closestPoint = null;

    for (const segment of segments) {
      const point = this.getClosestPointOnSegment(
        position,
        segment.start,
        segment.end
      );
      
      const dist = Vector3.Distance(position, point);
      if (dist < closestDist) {
        closestDist = dist;
        closestNormal = segment.normal;
        closestPoint = point;
      }
    }

    return closestNormal && closestPoint ? { normal: closestNormal, point: closestPoint } : null;
  }

  private getClosestPointOnSegment(point: Vector3, start: Vector3, end: Vector3): Vector3 {
    const segment = end.subtract(start);
    const length = segment.length();
    const dir = segment.normalize();
    
    const pointDir = point.subtract(start);
    let dot = Vector3.Dot(pointDir, dir);
    
    dot = Math.max(0, Math.min(length, dot));
    
    return start.add(dir.scale(dot));
  }

  /**
   * Gets all available track elements
   */
  public getAllElements(): TrackElement[] {
    return [...this.elements];
  }
  
  /**
   * Gets a track element by its ID
   * @param id ID of the element to retrieve
   * @returns The track element if found, otherwise null
   */
  public getElementById(id: string): TrackElement | null {
    return this.elements.find(element => element.id === id) || null;
  }
  
  /**
   * Adds a new custom track element
   * @param element Track element to add
   * @returns true if added successfully, false if element with same ID already exists
   */
  public addElement(element: TrackElement): boolean {
    if (this.getElementById(element.id)) {
      return false;
    }
    
    this.elements.push({ ...element });
    this.saveCustomElements();
    return true;
  }
  
  /**
   * Updates an existing custom track element
   * @param element Updated track element
   * @returns true if updated successfully, false if element not found or is a default element
   */
  public updateElement(element: TrackElement): boolean {
    // Find the element index
    const index = this.elements.findIndex(e => e.id === element.id);
    if (index === -1) {
      return false;
    }
    
    // Don't allow editing default elements
    if (DefaultTrackElements.some(e => e.id === element.id)) {
      return false;
    }
    
    this.elements[index] = { ...element };
    this.saveCustomElements();
    return true;
  }
  
  /**
   * Removes a custom track element
   * @param id ID of the element to remove
   * @returns true if removed successfully, false if element not found or is a default element
   */
  public removeElement(id: string): boolean {
    // Don't allow removing default elements
    if (DefaultTrackElements.some(e => e.id === id)) {
      return false;
    }
    
    const initialLength = this.elements.length;
    this.elements = this.elements.filter(element => element.id !== id);
    
    if (this.elements.length < initialLength) {
      this.saveCustomElements();
      return true;
    }
    
    return false;
  }
  
  /**
   * Saves custom elements to local storage
   */
  private saveCustomElements(): void {
    // Filter out default elements to only save custom ones
    const customElements = this.elements.filter(
      element => !DefaultTrackElements.some(e => e.id === element.id)
    );
    
    safeLocalStorageSave(AppConfig.storage.trackElements, customElements);
  }
}