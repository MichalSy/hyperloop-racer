import { Scene, Engine, Vector3 } from '@babylonjs/core';
import { Vehicle } from './Vehicle';
import { PhysicsSystem } from '../engine/PhysicsSystem';
import { LapCounter } from './LapCounter';

export class TestManager {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private vehicle: Vehicle;
    private physicsSystem: PhysicsSystem;
    private lapCounter: LapCounter;

    constructor(container: HTMLElement) {
        // Stelle sicher, dass container ein Canvas-Element ist
        this.canvas = document.createElement('canvas');
        container.appendChild(this.canvas);
        
        this.engine = new Engine(this.canvas);
        this.scene = new Scene(this.engine);
        this.physicsSystem = new PhysicsSystem(this.scene);
        this.vehicle = new Vehicle(this.scene, this.physicsSystem);
        this.lapCounter = new LapCounter();
    }

    public update(): void {
        // Sicher machen, dass update() public in Vehicle ist
        if (this.vehicle) {
            (this.vehicle as any).update();
        }
    }

    public checkCheckpoint(index: number): void {
        if (this.lapCounter) {
            this.lapCounter.checkPoint(index.toString());
        }
    }

    public placeVehicle(position: Vector3): void {
        if (this.vehicle) {
            this.vehicle.placeAt(position, new Vector3(1, 0, 0));
        }
    }
}

// Export the initialization function
export function initializeTestMode(container: HTMLElement): TestManager {
    return new TestManager(container);
}