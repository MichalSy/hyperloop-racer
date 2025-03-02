import {
    Scene,
    Vector3,
    Mesh,
    StandardMaterial,
    Color3,
    PointerInfo
} from '@babylonjs/core';
import { TrackElementLibrary } from '../data/track-elements/TrackElementLibrary';
import { PhysicsSystem } from '../engine/PhysicsSystem';
import { generateUUID } from '../utils/helpers';
import { TrackElementInstance } from '../data/types';

type SelectionCallback = (instanceId: string, connectorId?: string) => void;

export class TrackElementManager {
    private scene: Scene;
    private trackElementLibrary: TrackElementLibrary;
    private physicsSystem: PhysicsSystem;
    private selectedElement: Mesh | null = null;
    private selectedInstance: TrackElementInstance | null = null;
    private instances: TrackElementInstance[] = [];
    private onSelectionChange: SelectionCallback | null = null;

    constructor(scene: Scene, trackElementLibrary: TrackElementLibrary, physicsSystem: PhysicsSystem) {
        this.scene = scene;
        this.trackElementLibrary = trackElementLibrary;
        this.physicsSystem = physicsSystem;
        this.setupPointerEvents();
    }

    private setupPointerEvents() {
        this.scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
            if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh) {
                const mesh = pointerInfo.pickInfo.pickedMesh;
                if (mesh.name.startsWith('track-element-')) {
                    this.handleElementSelection(mesh as Mesh);
                }
            }
        });
    }

    private handleElementSelection(mesh: Mesh) {
        if (this.selectedElement) {
            // Deselect previous element
            const defaultMaterial = new StandardMaterial("default", this.scene);
            defaultMaterial.diffuseColor = Color3.Gray();
            this.selectedElement.material = defaultMaterial;
        }

        this.selectedElement = mesh;
        const highlightMaterial = new StandardMaterial("highlight", this.scene);
        highlightMaterial.emissiveColor = Color3.Yellow();
        mesh.material = highlightMaterial;
    }

    public createTrackElementInstance(elementId: string, position: Vector3, rotation: Vector3): TrackElementInstance {
        const instance: TrackElementInstance = {
            id: generateUUID(),
            elementId,
            position: { x: position.x, y: position.y, z: position.z },
            rotation: { x: rotation.x, y: rotation.y, z: rotation.z }
        };

        this.instances.push(instance);

        const mesh = this.trackElementLibrary.createTrackElementMesh(elementId);
        if (mesh) {
            mesh.name = `track-element-${instance.id}`;
            mesh.position = position;
            mesh.rotation = rotation;
            this.physicsSystem.addPhysicsToMesh(mesh);
        }

        return instance;
    }

    public update(): void {
        // Update logic for selected elements
        if (this.selectedElement && this.selectedInstance) {
            // Update instance position/rotation based on mesh
            this.selectedInstance.position = {
                x: this.selectedElement.position.x,
                y: this.selectedElement.position.y,
                z: this.selectedElement.position.z
            };
            this.selectedInstance.rotation = {
                x: this.selectedElement.rotation.x,
                y: this.selectedElement.rotation.y,
                z: this.selectedElement.rotation.z
            };
        }
    }

    public clearSelection(): void {
        if (this.selectedElement) {
            const defaultMaterial = new StandardMaterial("default", this.scene);
            defaultMaterial.diffuseColor = Color3.Gray();
            this.selectedElement.material = defaultMaterial;
        }
        this.selectedElement = null;
        this.selectedInstance = null;
    }

    public setOnSelectionChangeCallback(callback: SelectionCallback) {
        this.onSelectionChange = callback;
    }

    public getSelectedElement(): TrackElementInstance | null {
        return this.selectedInstance;
    }

    public getTrackElementInstances(): TrackElementInstance[] {
        return [...this.instances];
    }

    public selectElement(instanceId: string): void {
        const mesh = this.scene.getMeshByName(`track-element-${instanceId}`);
        if (mesh) {
            this.selectedElement = mesh as Mesh;
            const instance = this.instances.find(i => i.id === instanceId);
            if (instance) {
                this.selectedInstance = instance;
            }
            if (this.onSelectionChange) {
                this.onSelectionChange(instanceId);
            }
        }
    }

    public moveElement(instanceId: string, position: Vector3): void {
        const mesh = this.scene.getMeshByName(`track-element-${instanceId}`);
        if (mesh) {
            mesh.position = position;
            const instance = this.instances.find(i => i.id === instanceId);
            if (instance) {
                instance.position = { x: position.x, y: position.y, z: position.z };
            }
        }
    }

    public rotateElement(x: number, y: number, z: number): void {
        if (this.selectedElement) {
            this.selectedElement.rotation.set(x, y, z);
            if (this.selectedInstance) {
                this.selectedInstance.rotation = { x, y, z };
            }
        }
    }

    public dispose(): void {
        this.clearSelection();
        // Clean up meshes and materials
        this.instances.forEach(instance => {
            const mesh = this.scene.getMeshByName(`track-element-${instance.id}`);
            if (mesh) {
                mesh.dispose();
            }
        });
        this.instances = [];
    }

    public updateFromTrack(elements: TrackElementInstance[]): void {
        // Remove existing elements
        this.dispose();
        
        // Create new elements
        elements.forEach(element => {
            const position = new Vector3(
                element.position.x,
                element.position.y,
                element.position.z
            );
            const rotation = new Vector3(
                element.rotation.x,
                element.rotation.y,
                element.rotation.z
            );
            this.createTrackElementInstance(element.elementId, position, rotation);
        });
    }

    public clearAllElements(): void {
        // Clear selection first
        this.clearSelection();
        
        // Remove all meshes
        this.instances.forEach(instance => {
            const mesh = this.scene.getMeshByName(`track-element-${instance.id}`);
            if (mesh) {
                mesh.dispose();
            }
        });
        this.instances = [];
    }
}