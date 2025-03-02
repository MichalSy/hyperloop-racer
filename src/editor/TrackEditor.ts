import { BabylonEngine } from "../engine/BabylonEngine";
import { Track } from "../data/Track";
import { Vector3, Scene, Mesh, StandardMaterial, Color3, PointerInfo } from "@babylonjs/core";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { generateUUID } from "../utils/helpers";
import { TrackElementInstance } from "../data/types";

type SelectionCallback = (instanceId: string, connectorId?: string) => void;

export class TrackEditor {
    private engine: BabylonEngine;
    private scene: Scene;
    private currentTrack: Track;
    private propertiesPanel: HTMLElement;
    private trackElementLibrary: TrackElementLibrary;
    private physicsSystem: PhysicsSystem;
    private selectedElement: Mesh | null = null;
    private selectedInstance: TrackElementInstance | null = null;
    private instances: TrackElementInstance[] = [];
    private onSelectionChange: SelectionCallback | null = null;

    constructor(
        engine: BabylonEngine,
        trackElementLibrary: TrackElementLibrary,
        physicsSystem: PhysicsSystem,
        propertiesPanel: HTMLElement
    ) {
        this.engine = engine;
        this.scene = engine.getScene();
        this.trackElementLibrary = trackElementLibrary;
        this.physicsSystem = physicsSystem;
        this.propertiesPanel = propertiesPanel;
        this.currentTrack = new Track();
        this.setupPointerEvents();
        this.initializeTrackWithStartSegment();
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
            const defaultMaterial = new StandardMaterial("default", this.scene);
            defaultMaterial.diffuseColor = Color3.Gray();
            this.selectedElement.material = defaultMaterial;
        }

        this.selectedElement = mesh;
        const highlightMaterial = new StandardMaterial("highlight", this.scene);
        highlightMaterial.emissiveColor = Color3.Yellow();
        mesh.material = highlightMaterial;

        const instanceId = mesh.name.replace('track-element-', '');
        this.selectedInstance = this.instances.find(i => i.id === instanceId) || null;
        
        if (this.onSelectionChange) {
            this.onSelectionChange(instanceId);
        }
    }

    private initializeTrackWithStartSegment() {
        const startPosition = new Vector3(0, 0, 0);
        const instance = this.createTrackElementInstance(
            'start-segment',
            startPosition,
            new Vector3(0, 0, 0)
        );
        
        if (instance) {
            this.currentTrack.addElement(instance);
            this.selectElement(instance.id);
            this.markModified();
            
            const camera = this.engine.getCamera();
            camera.position = new Vector3(45, 60, -70);
            camera.setTarget(new Vector3(0, 0, 0));
        }
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

    public updatePropertiesPanel(instanceId: string | null) {
        if (!instanceId) {
            this.propertiesPanel.innerHTML = '<h3>Track Properties</h3>';
            return;
        }

        const trackData = this.currentTrack.getData();
        const element = trackData.elements.find(e => e.id === instanceId);
        if (!element) return;

        this.propertiesPanel.innerHTML = `
            <h3>Track Element Properties</h3>
            <div class="property-group">
                <label>Position:</label>
                <div class="property-controls">
                    <div class="property-row">
                        <label>X:</label>
                        <input type="number" id="pos-x" value="${element.position.x}" step="1" />
                    </div>
                    <div class="property-row">
                        <label>Y:</label>
                        <input type="number" id="pos-y" value="${element.position.y}" step="1" />
                    </div>
                    <div class="property-row">
                        <label>Z:</label>
                        <input type="number" id="pos-z" value="${element.position.z}" step="1" />
                    </div>
                </div>
            </div>
            <div class="property-group">
                <label>Rotation:</label>
                <div class="property-controls">
                    <div class="property-row">
                        <label>X:</label>
                        <input type="number" id="rot-x" value="${element.rotation.x}" step="0.1" />
                    </div>
                    <div class="property-row">
                        <label>Y:</label>
                        <input type="number" id="rot-y" value="${element.rotation.y}" step="0.1" />
                    </div>
                    <div class="property-row">
                        <label>Z:</label>
                        <input type="number" id="rot-z" value="${element.rotation.z}" step="0.1" />
                    </div>
                </div>
            </div>
        `;
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
            this.handleElementSelection(mesh as Mesh);
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

    public markModified() {
        this.currentTrack.getData().modifiedAt = new Date().toISOString();
    }

    public getTrack(): Track {
        return this.currentTrack;
    }

    public updateFromTrack(elements: TrackElementInstance[]): void {
        this.clearAllElements();
        
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
        this.clearSelection();
        
        this.instances.forEach(instance => {
            const mesh = this.scene.getMeshByName(`track-element-${instance.id}`);
            if (mesh) {
                mesh.dispose();
            }
        });
        this.instances = [];
    }

    public dispose() {
        this.clearAllElements();
    }
}