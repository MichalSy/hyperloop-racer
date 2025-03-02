import {
  Scene,
  PhysicsImpostor,
  Vector3,
  AbstractMesh,
  Mesh,
  PhysicsEngine,
  CannonJSPlugin,
  PhysicsHelper
} from 'babylonjs';
import { AppConfig } from '../config/AppConfig';

/**
 * Manages physics for the game world
 */
export class PhysicsSystem {
  private scene: Scene;
  private physicsEngine: PhysicsEngine;
  
  /**
   * Creates a new PhysicsSystem
   * @param scene The Babylon.js scene
   */
  constructor(scene: Scene) {
    this.scene = scene;
    this.initPhysics();
  }
  
  /**
   * Initializes the physics engine
   */
  private initPhysics(): void {
    // Enable physics in the scene
    const gravity = new Vector3(0, AppConfig.physics.gravity, 0);
    const plugin = new CannonJSPlugin();
    this.scene.enablePhysics(gravity, plugin);
    this.physicsEngine = this.scene.getPhysicsEngine();
    
    console.log('Physics engine initialized');
  }
  
  /**
   * Creates a static physics impostor for a mesh (typically for track elements)
   * @param mesh The mesh to add physics to
   * @param friction Friction coefficient
   * @param restitution Restitution (bounciness) coefficient
   */
  public createStaticBody(
    mesh: AbstractMesh,
    friction: number = AppConfig.physics.defaultFriction,
    restitution: number = AppConfig.physics.defaultRestitution
  ): void {
    // Make sure the mesh has appropriate collision mesh
    if (!mesh.checkCollisions) {
      mesh.checkCollisions = true;
    }
    
    // Create a physics impostor for the mesh
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.MeshImpostor,
      { 
        mass: 0, // Static body has mass 0
        friction,
        restitution
      },
      this.scene
    );
  }
  
  /**
   * Creates a dynamic physics body for a mesh (typically for the vehicle)
   * @param mesh The mesh to add physics to
   * @param mass Mass of the body
   * @param friction Friction coefficient
   * @param restitution Restitution coefficient
   */
  public createDynamicBody(
    mesh: AbstractMesh,
    mass: number,
    friction: number = AppConfig.physics.defaultFriction,
    restitution: number = AppConfig.physics.defaultRestitution
  ): void {
    // Make sure the mesh has appropriate collision mesh
    if (!mesh.checkCollisions) {
      mesh.checkCollisions = true;
    }
    
    // Create a physics impostor for the mesh
    mesh.physicsImpostor = new PhysicsImpostor(
      mesh,
      PhysicsImpostor.BoxImpostor,
      { 
        mass,
        friction,
        restitution
      },
      this.scene
    );
  }
  
  /**
   * Applies a force to a physics body at the given position
   * @param mesh Mesh with a physics impostor
   * @param force Force to apply
   * @param position Position to apply the force at
   */
  public applyForce(mesh: AbstractMesh, force: Vector3, position: Vector3): void {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.applyForce(force, position);
    }
  }
  
  /**
   * Applies an impulse to a physics body at the given position
   * @param mesh Mesh with a physics impostor
   * @param impulse Impulse to apply
   * @param position Position to apply the impulse at
   */
  public applyImpulse(mesh: AbstractMesh, impulse: Vector3, position: Vector3): void {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.applyImpulse(impulse, position);
    }
  }
  
  /**
   * Creates a trigger zone that detects when objects enter it
   * @param name Name of the trigger
   * @param position Position of the trigger
   * @param size Size of the trigger box
   * @param onEnterCallback Callback function when an object enters the trigger
   * @returns The created trigger mesh
   */
  public createTriggerZone(
    name: string,
    position: Vector3,
    size: Vector3,
    onEnterCallback: (mesh: AbstractMesh) => void
  ): Mesh {
    // Create an invisible box for the trigger
    const triggerBox = Mesh.CreateBox(name, 1, this.scene);
    triggerBox.scaling = size;
    triggerBox.position = position;
    triggerBox.isVisible = false;
    
    // Make it a trigger
    triggerBox.physicsImpostor = new PhysicsImpostor(
      triggerBox,
      PhysicsImpostor.BoxImpostor,
      { 
        mass: 0,
        trigger: true
      },
      this.scene
    );
    
    // Set up the callback for when something enters the trigger
    triggerBox.physicsImpostor.registerOnPhysicsCollide(
      PhysicsImpostor.MeshImpostor,
      (collider) => {
        if (collider.object instanceof AbstractMesh) {
          onEnterCallback(collider.object);
        }
      }
    );
    
    return triggerBox;
  }
  
  /**
   * Updates the physics world
   * @param deltaTime Time since the last update in seconds
   */
  public update(deltaTime: number): void {
    // Add any custom physics updates here
    // The scene's physics engine will handle the main update itself
  }
  
  /**
   * Disposes of all resources
   */
  public dispose(): void {
    // Clean up resources if needed
    // The physics engine is disposed with the scene
  }

  /**
   * Berechnet die Gravitationsrichtung für einen Punkt im Raum
   * @param position Position, für die die Gravitation berechnet werden soll
   * @param nearestTrackPoint Der nächste Punkt auf der Strecke
   * @param trackNormal Die Normale der Strecke an diesem Punkt
   * @returns Gravitationsvektor
   */
  public calculateGravityDirection(position: Vector3, nearestTrackPoint: Vector3, trackNormal: Vector3): Vector3 {
    // Berechne die Richtung zum nächsten Streckenpunkt
    const directionToTrack = nearestTrackPoint.subtract(position);
    
    // Normalisiere den Richtungsvektor
    const gravity = directionToTrack.normalize();
    
    // Skaliere mit der Gravitationsstärke
    gravity.scaleInPlace(AppConfig.physics.gravity);
    
    return gravity;
  }

  /**
   * Aktualisiert die Gravitation für ein physikalisches Objekt
   * @param mesh Das Mesh mit einem Physik-Impostor
   * @param nearestTrackPoint Der nächste Punkt auf der Strecke
   * @param trackNormal Die Normale der Strecke an diesem Punkt
   */
  public updateObjectGravity(mesh: AbstractMesh, nearestTrackPoint: Vector3, trackNormal: Vector3): void {
    if (mesh.physicsImpostor) {
      const gravity = this.calculateGravityDirection(mesh.position, nearestTrackPoint, trackNormal);
      mesh.physicsImpostor.setGravity(gravity);
    }
  }
}