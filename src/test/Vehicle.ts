import {
    Scene,
    Mesh,
    Vector3,
    TransformNode,
    ParticleSystem,
    MeshBuilder,
    Color4,
    StandardMaterial,
    Color3,
    Texture
} from '@babylonjs/core';
import { AppConfig } from '../config/AppConfig';
import { PhysicsSystem } from '../engine/PhysicsSystem';

/**
 * Represents the player's vehicle in test mode
 */
export class Vehicle {
    private scene: Scene;
    private rootNode: TransformNode;
    private bodyMesh!: Mesh;
    private speed: number = 0;
    private isAccelerating: boolean = false;
    private isBraking: boolean = false;
    private isTurningLeft: boolean = false;
    private isTurningRight: boolean = false;
    private physicsSystem: PhysicsSystem;
    private thrusterParticles!: ParticleSystem;
    private trackMeshes: Mesh[] = [];

    /**
     * Creates a new Vehicle instance
     * @param scene Babylon.js scene
     * @param physicsSystem Physics system
     */
    constructor(scene: Scene, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.physicsSystem = physicsSystem;
        this.rootNode = new TransformNode("vehicle-root", scene);
        this.createVehicleMesh();
        this.setupPhysics();
        this.setupInputHandlers();
        this.createThrusterEffect();
    }

    /**
     * Creates the vehicle meshes
     */
    private createVehicleMesh(): void {
        // Create the vehicle body
        this.bodyMesh = MeshBuilder.CreateBox(
            "vehicle-body",
            { width: 4, height: 1.5, depth: 7 },
            this.scene
        );

        const bodyMaterial = new StandardMaterial("vehicle-body-material", this.scene);
        bodyMaterial.diffuseColor = new Color3(0.2, 0.6, 0.9);
        bodyMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
        bodyMaterial.emissiveColor = new Color3(0.05, 0.1, 0.2);
        this.bodyMesh.material = bodyMaterial;
        this.bodyMesh.parent = this.rootNode;

        // Create cockpit
        const cockpit = MeshBuilder.CreateSphere(
            "vehicle-cockpit",
            { diameter: 2, segments: 12 },
            this.scene
        );
        cockpit.position = new Vector3(0, 1, -1.5);
        cockpit.scaling = new Vector3(1, 0.7, 0.8);

        const cockpitMaterial = new StandardMaterial("vehicle-cockpit-material", this.scene);
        cockpitMaterial.diffuseColor = new Color3(0.1, 0.4, 0.8);
        cockpitMaterial.alpha = 0.5;
        cockpit.material = cockpitMaterial;
        cockpit.parent = this.rootNode;

        // Create stabilizers
        const createStabilizer = (side: number) => {
            const stabilizer = MeshBuilder.CreateBox(
                `vehicle-stabilizer-${side}`,
                { width: 0.5, height: 0.5, depth: 3 },
                this.scene
            );
            stabilizer.position = new Vector3(side * 2, 0, 1);
            stabilizer.parent = this.rootNode;

            const stabilizerMaterial = new StandardMaterial(`vehicle-stabilizer-material-${side}`, this.scene);
            stabilizerMaterial.diffuseColor = new Color3(0.7, 0.2, 0.2);
            stabilizer.material = stabilizerMaterial;
        };

        createStabilizer(1);  // right
        createStabilizer(-1); // left

        // Add thruster effects
        const thruster = MeshBuilder.CreateCylinder(
            "vehicle-thruster",
            { height: 1, diameter: 2, tessellation: 24 },
            this.scene
        );
        thruster.position = new Vector3(0, 0, 3.5);
        thruster.rotation = new Vector3(Math.PI / 2, 0, 0);

        const thrusterMaterial = new StandardMaterial("vehicle-thruster-material", this.scene);
        thrusterMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
        thrusterMaterial.emissiveColor = new Color3(0.5, 0.2, 0);
        thruster.material = thrusterMaterial;
        thruster.parent = this.rootNode;
    }

    /**
     * Sets up physics for the vehicle
     */
    private setupPhysics(): void {
        // Add physics impostor to the vehicle body
        this.physicsSystem.createDynamicBody(
            this.bodyMesh,
            10, // Mass of 10 units
            0.3, // Custom friction for better control
            0.2  // Slight bounce
        );

        // Enable collision detection
        this.bodyMesh.checkCollisions = true;
    }

    /**
     * Creates thruster particle effect
     */
    private createThrusterEffect(): void {
        // Create a particle system for the thruster
        this.thrusterParticles = new ParticleSystem("thrusterParticles", 2000, this.scene);

        // Texture of each particle
        this.thrusterParticles.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);

        // Verwende eine Position statt des TransformNode als Emitter
        const emitterPosition = this.rootNode.position.clone();
        this.thrusterParticles.emitter = emitterPosition;
        
        // Where the particles come from
        this.thrusterParticles.minEmitBox = new Vector3(0, 0, 4); // Starting at the back of the ship
        this.thrusterParticles.maxEmitBox = new Vector3(0, 0, 4.5);

        // Colors
        this.thrusterParticles.color1 = new Color4(1, 0.5, 0, 1.0);
        this.thrusterParticles.color2 = new Color4(1, 0.2, 0, 1.0);
        this.thrusterParticles.colorDead = new Color4(0, 0, 0, 0.0);

        // Size of each particle
        this.thrusterParticles.minSize = 0.3;
        this.thrusterParticles.maxSize = 0.8;

        // Lifetime
        this.thrusterParticles.minLifeTime = 0.2;
        this.thrusterParticles.maxLifeTime = 0.4;

        // Emission rate
        this.thrusterParticles.emitRate = 0; // Start off

        // Blend mode
        this.thrusterParticles.blendMode = ParticleSystem.BLENDMODE_ADD;

        // Direction
        this.thrusterParticles.direction1 = new Vector3(0, 0, 1); // Backward
        this.thrusterParticles.direction2 = new Vector3(0, 0, 1);

        // Angular speed
        this.thrusterParticles.minAngularSpeed = 0;
        this.thrusterParticles.maxAngularSpeed = Math.PI;

        // Speed
        this.thrusterParticles.minEmitPower = 10;
        this.thrusterParticles.maxEmitPower = 15;
        this.thrusterParticles.updateSpeed = 0.05;

        // Start the particle system
        this.thrusterParticles.start();
    }

    /**
     * Sets up input event handlers
     */
    private setupInputHandlers(): void {
        // Keyboard handlers for WASD controls
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case 1: // KeyDown
                    switch (kbInfo.event.key) {
                        case 'w':
                        case 'W':
                            this.isAccelerating = true;
                            if (this.thrusterParticles) {
                                this.thrusterParticles.emitRate = 1000;
                            }
                            break;
                        case 's':
                        case 'S':
                            this.isBraking = true;
                            break;
                        case 'a':
                        case 'A':
                            this.isTurningLeft = true;
                            break;
                        case 'd':
                        case 'D':
                            this.isTurningRight = true;
                            break;
                    }
                    break;
                case 2: // KeyUp
                    switch (kbInfo.event.key) {
                        case 'w':
                        case 'W':
                            this.isAccelerating = false;
                            if (this.thrusterParticles) {
                                this.thrusterParticles.emitRate = 0;
                            }
                            break;
                        case 's':
                        case 'S':
                            this.isBraking = false;
                            break;
                        case 'a':
                        case 'A':
                            this.isTurningLeft = false;
                            break;
                        case 'd':
                        case 'D':
                            this.isTurningRight = false;
                            break;
                    }
                    break;
            }
        });

        // Register update function
        this.scene.registerBeforeRender(() => {
            this.update();
        });
    }

    /**
     * Updates the vehicle state each frame
     */
    public update(): void {
        if (this.bodyMesh.physicsImpostor) {
            // Get current velocity from physics
            const velocity = this.bodyMesh.physicsImpostor.getLinearVelocity();
            this.speed = velocity ? velocity.length() : 0;

            // Calculate forces based on input
            if (this.isAccelerating) {
                const force = this.rootNode.forward.scale(AppConfig.vehicle.speed.acceleration * 50);
                this.physicsSystem.applyForce(this.bodyMesh, force, this.bodyMesh.position);
            } else if (this.isBraking) {
                const force = this.rootNode.forward.scale(-AppConfig.vehicle.speed.deceleration * 50);
                this.physicsSystem.applyForce(this.bodyMesh, force, this.bodyMesh.position);
            }

            // Apply turning forces
            if (this.speed > 0.1) {
                let turnForce = Vector3.Zero();
                if (this.isTurningLeft) {
                    turnForce = this.rootNode.right.scale(-AppConfig.vehicle.turning.speed * 20);
                } else if (this.isTurningRight) {
                    turnForce = this.rootNode.right.scale(AppConfig.vehicle.turning.speed * 20);
                }
                if (!turnForce.equals(Vector3.Zero())) {
                    this.physicsSystem.applyForce(this.bodyMesh, turnForce, this.bodyMesh.position);
                }
            }

            // Clamp velocity to max speed
            const currentVel = this.bodyMesh.physicsImpostor.getLinearVelocity();
            if (currentVel && currentVel.length() > AppConfig.vehicle.speed.maxSpeed) {
                const normalizedVel = currentVel.normalize();
                const clampedVel = normalizedVel.scale(AppConfig.vehicle.speed.maxSpeed);
                this.bodyMesh.physicsImpostor.setLinearVelocity(clampedVel);
            }

            // Apply custom gravity to stick to track
            this.updateTrackGravity();
        }
    }

    /**
     * Updates gravity to stick to the track
     */
    private updateTrackGravity(): void {
        // Get track meshes
        if (this.trackMeshes.length === 0) {
            this.trackMeshes = this.scene.meshes.filter(
                mesh => mesh.name.startsWith('track-') && mesh.physicsImpostor
            ) as Mesh[];
        }

        if (this.trackMeshes.length > 0) {
            // Find nearest track point
            const trackInfo = this.physicsSystem.findNearestTrackPoint(
                this.rootNode.position,
                this.trackMeshes
            );

            if (trackInfo) {
                // Update gravity to point toward track
                this.physicsSystem.updateObjectGravity(
                    this.bodyMesh,
                    trackInfo.point,
                    trackInfo.normal
                );

                // Align vehicle orientation to track surface
                this.alignToTrackSurface(trackInfo.normal);
            }
        }
    }

    /**
     * Aligns the vehicle to the track surface
     * @param normal Track surface normal
     */
    private alignToTrackSurface(normal: Vector3): void {
        // Calculate right vector (cross product of forward and normal)
        const forward = this.rootNode.forward;
        const right = Vector3.Cross(forward, normal).normalize();

        // Recalculate forward to be perpendicular to normal and right
        const newForward = Vector3.Cross(normal, right).normalize();

        // Apply rotation to align with surface
        const targetRotation = Vector3.RotationFromAxis(right, normal.scale(-1), newForward);

        // Smoothly interpolate rotation
        const rotationSpeed = 0.1;
        this.rootNode.rotation = Vector3.Lerp(
            this.rootNode.rotation,
            targetRotation,
            rotationSpeed
        );
    }

    /**
     * Sets the track meshes for gravity calculation
     * @param meshes Array of track meshes
     */
    public setTrackMeshes(meshes: Mesh[]): void {
        this.trackMeshes = meshes;
    }

    /**
     * Gets the current speed of the vehicle
     * @returns Current speed in units per second
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * Places the vehicle at a specific position with the given orientation
     * @param position Position to place the vehicle at
     * @param direction Direction the vehicle should face
     */
    public placeAt(position: Vector3, direction: Vector3): void {
        this.rootNode.position = position.add(new Vector3(0, 2, 0)); // Lift slightly above track
        this.speed = 0;

        if (direction) {
            const normalizedDirection = direction.normalize();
            this.rootNode.lookAt(position.add(normalizedDirection));
        }

        // Reset physics state
        if (this.bodyMesh.physicsImpostor) {
            this.bodyMesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
            this.bodyMesh.physicsImpostor.setAngularVelocity(Vector3.Zero());
        }
    }

    /**
     * Gets the current position of the vehicle
     * @returns Current position
     */
    public getPosition(): Vector3 {
        return this.rootNode.position;
    }

    /**
     * Resets the vehicle to its initial state
     */
    public reset(): void {
        this.speed = 0;
        this.isAccelerating = false;
        this.isBraking = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        if (this.bodyMesh.physicsImpostor) {
            this.bodyMesh.physicsImpostor.setLinearVelocity(Vector3.Zero());
            this.bodyMesh.physicsImpostor.setAngularVelocity(Vector3.Zero());
        }
        if (this.thrusterParticles) {
            this.thrusterParticles.emitRate = 0;
        }
    }

    /**
     * Disposes vehicle resources
     */
    public dispose(): void {
        if (this.thrusterParticles) {
            this.thrusterParticles.dispose();
        }
        this.rootNode.dispose();
    }
}