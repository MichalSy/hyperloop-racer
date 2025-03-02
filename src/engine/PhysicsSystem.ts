import {
    Scene,
    Vector3,
    AbstractMesh,
    PhysicsImpostor,
    Mesh,
    Ray,
    RayHelper,
    Color3,
    StandardMaterial,
    CannonJSPlugin
} from '@babylonjs/core';
import '@babylonjs/core/Physics/physicsEngineComponent';

import * as CANNON from 'cannon-es';

import { AppConfig } from '../config/AppConfig';

/**
 * Manages physics for the game world
 */
export class PhysicsSystem {
    private scene: Scene;
    private debugMode: boolean = false;
    private activeRays: RayHelper[] = [];
    private gravityVector: Vector3 = new Vector3(0, -9.81, 0);

    /**
     * Creates a new PhysicsSystem
     * @param scene The Babylon.js scene
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this.initializePhysics();
    }

    /**
     * Initializes the physics engine
     */
    private initializePhysics(): void {
        try {
            const cannonPlugin = new CannonJSPlugin(true, 10, CANNON);
            this.scene.enablePhysics(this.gravityVector, cannonPlugin);
            console.log('Physics engine initialized successfully');
        } catch (error) {
            console.error('Failed to initialize physics engine:', error);
            throw error;
        }
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
     * @returns The created trigger mesh
     */
    public createTriggerZone(
        name: string,
        position: Vector3,
        size: Vector3
    ): Mesh {
        const triggerBox = Mesh.CreateBox(name, 1, this.scene);
        triggerBox.scaling = size;
        triggerBox.position = position;
        triggerBox.isVisible = false;

        this.createPhysicsImpostor(triggerBox, true);

        // Setze als Trigger
        if (triggerBox.physicsImpostor?.physicsBody) {
            triggerBox.physicsImpostor.physicsBody.collisionResponse = false;
        }

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
                        rayHelper.show(this.scene, hit.hit ? Color3.Green() : Color3.Red());
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
     */
    public update(): void {
        // Leere Implementierung ist OK, da die Physics-Engine selbst updated
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
    public calculateGravityDirection(_position: Vector3, _nearestTrackPoint: Vector3, trackNormal: Vector3): Vector3 {
        return trackNormal.scale(-9.81);
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
            // Verwende setLinearVelocity statt setGravity
            mesh.physicsImpostor.setLinearVelocity(gravity);
        }
    }

    /**
     * Adds physics to a mesh
     * @param mesh The mesh to add physics to
     * @param mass Mass of the body
     * @param restitution Restitution coefficient
     * @param friction Friction coefficient
     */
    public addPhysicsToMesh(mesh: AbstractMesh, mass: number = 0, restitution: number = 0.9, friction: number = 0.5) {
        mesh.physicsImpostor = new PhysicsImpostor(
            mesh,
            PhysicsImpostor.BoxImpostor,
            { mass, restitution, friction }
        );
    }

    /**
     * Adds a trigger to a mesh
     * @param mesh The mesh to add the trigger to
     */
    public addTriggerToMesh(mesh: AbstractMesh) {
        mesh.physicsImpostor = new PhysicsImpostor(
            mesh,
            PhysicsImpostor.BoxImpostor,
            { 
                mass: 0,
                restitution: 0.9,
                friction: 0.5,
                disableBidirectionalTransformation: true // This creates a trigger/sensor effect
            }
        );
    }

    /**
     * Performs a raycast
     * @param from Starting point of the ray
     * @param direction Direction of the ray
     * @param length Length of the ray
     * @param debug Whether to show the ray in debug mode
     * @returns Object with hit information
     */
    public raycast(from: Vector3, direction: Vector3, length: number = 100, debug: boolean = false): { hit: boolean; point: Vector3 | null; normal: Vector3 | null; distance: number } {
        const ray = new Ray(from, direction.normalize(), length);
        const hit = this.scene.pickWithRay(ray);
        
        if (debug && hit) {
            const rayHelper = new RayHelper(ray);
            rayHelper.show(this.scene, hit.hit ? Color3.Green() : Color3.Red());
        }

        return {
            hit: hit ? hit.hit : false,
            point: hit ? hit.pickedPoint : null,
            normal: hit ? hit.getNormal() : null,
            distance: hit ? hit.distance : 0
        };
    }

    /**
     * Sets gravity for a mesh
     * @param mesh The mesh to set gravity for
     * @param gravity Gravity vector
     */
    public setGravity(mesh: AbstractMesh, gravity: Vector3): void {
        if (mesh.physicsImpostor) {
            const body = mesh.physicsImpostor.physicsBody;
            if (body) {
                body.gravity.set(gravity.x, gravity.y, gravity.z);
            }
        }
    }

    public createTrigger(mesh: Mesh): void {
        if (mesh) {
            mesh.physicsImpostor = new PhysicsImpostor(
                mesh,
                PhysicsImpostor.BoxImpostor,
                {
                    mass: 0,
                    friction: 0,
                    restitution: 0
                }
            );
            // Setze den Trigger-Status über die Babylon.js API
            mesh.physicsImpostor.physicsBody.isTrigger = true;
        }
    }

    public showRaycast(from: Vector3, to: Vector3, hit: boolean): void {
        const ray = new Ray(from, to.subtract(from).normalize(), to.subtract(from).length());
        const rayHelper = new RayHelper(ray);
        rayHelper.show(this.scene);
        
        // Verwende Color3 für die Farbe
        const color = hit ? new Color3(0, 1, 0) : new Color3(1, 0, 0);
        const points = [ray.origin, ray.origin.add(ray.direction.scale(ray.length))];
        const rayMesh = Mesh.CreateLines("ray", points, this.scene, true);
        
        const material = new StandardMaterial("rayMaterial", this.scene);
        material.emissiveColor = color;
        rayMesh.material = material;
    }

    private createPhysicsImpostor(mesh: AbstractMesh, isStatic: boolean = true): void {
        const physicsParams = {
            mass: isStatic ? 0 : 1,
            friction: 0.5,
            restitution: 0.7,
        };
        mesh.physicsImpostor = new PhysicsImpostor(
            mesh,
            PhysicsImpostor.BoxImpostor,
            physicsParams,
            this.scene
        );
    }
}