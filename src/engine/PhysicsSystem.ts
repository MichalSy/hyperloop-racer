import {
    Scene,
    PhysicsImpostor,
    Vector3,
    AbstractMesh,
    Mesh,
    PhysicsEngine,
    CannonJSPlugin,
    PhysicsHelper,
    Ray,
    RayHelper
  } from 'babylonjs';
  import { AppConfig } from '../config/AppConfig';
  
  /**
   * Manages physics for the game world
   */
  export class PhysicsSystem {
    private scene: Scene;
    private physicsEngine: PhysicsEngine;
    private debugMode: boolean = false;
    private activeRays: RayHelper[] = [];
    
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
     * Finds the nearest track point and normal for a position
     * @param position Position to check
     * @param trackMeshes Array of track meshes to check against
     * @returns Object with nearest point and normal, or null if none found
     */
    public findNearestTrackPoint(
      position: Vector3, 
      trackMeshes: AbstractMesh[]
    ): { point: Vector3, normal: Vector3 } | null {
      let closestPoint = null;
      let closestNormal = null;
      let closestDistance = Number.MAX_VALUE;
      
      // Cast rays in multiple directions to find closest track
      const directions = [
        new Vector3(0, -1, 0),  // Down
        new Vector3(0, 1, 0),   // Up
        new Vector3(1, 0, 0),   // Right
        new Vector3(-1, 0, 0),  // Left
        new Vector3(0, 0, 1),   // Forward
        new Vector3(0, 0, -1)   // Back
      ];
      
      // Clear previous debug rays
      if (this.debugMode) {
        this.clearDebugRays();
      }
      
      // Try each direction
      for (const direction of directions) {
        const ray = new Ray(position, direction, 100);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
          return trackMeshes.includes(mesh);
        });
        
        if (hit && hit.hit && hit.pickedPoint && hit.getNormal()) {
          const distance = Vector3.Distance(position, hit.pickedPoint);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPoint = hit.pickedPoint;
            closestNormal = hit.getNormal();
            
            // Show debug ray if debug mode is on
            if (this.debugMode) {
              const rayHelper = new RayHelper(ray);
              rayHelper.show(this.scene, hit.hit ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0));
              this.activeRays.push(rayHelper);
            }
          }
        }
      }
      
      if (closestPoint && closestNormal) {
        return {
          point: closestPoint,
          normal: closestNormal
        };
      }
      
      return null;
    }
    
    /**
     * Clears debug visualization rays
     */
    private clearDebugRays(): void {
      this.activeRays.forEach(ray => ray.dispose());
      this.activeRays = [];
    }
    
    /**
     * Enables or disables debug mode
     * @param enabled Whether debug mode should be enabled
     */
    public setDebugMode(enabled: boolean): void {
      this.debugMode = enabled;
      if (!enabled) {
        this.clearDebugRays();
      }
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
      this.clearDebugRays();
      // The physics engine is disposed with the scene
    }
  
    /**
     * Calculates gravity direction for a point in space
     * @param position Position to calculate gravity for
     * @param nearestTrackPoint The nearest point on the track
     * @param trackNormal The normal of the track at this point
     * @returns Gravity vector
     */
    public calculateGravityDirection(position: Vector3, nearestTrackPoint: Vector3, trackNormal: Vector3): Vector3 {
      // Calculate direction to nearest track point
      const directionToTrack = nearestTrackPoint.subtract(position);
      
      // Use track normal as gravity direction (pointing away from track)
      const gravity = trackNormal.scale(-1).normalize();
      
      // Scale with gravity strength
      gravity.scaleInPlace(AppConfig.physics.gravity);
      
      return gravity;
    }
  
    /**
     * Updates gravity for a physical object
     * @param mesh The mesh with a physics impostor
     * @param nearestTrackPoint The nearest point on the track
     * @param trackNormal The normal of the track at this point
     */
    public updateObjectGravity(mesh: AbstractMesh, nearestTrackPoint: Vector3, trackNormal: Vector3): void {
      if (mesh.physicsImpostor) {
        const gravity = this.calculateGravityDirection(mesh.position, nearestTrackPoint, trackNormal);
        mesh.physicsImpostor.setGravity(gravity);
      }
    }
  }