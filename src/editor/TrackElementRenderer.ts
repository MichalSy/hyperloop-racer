import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { TrackElement } from '../data/types';

export class TrackElementRenderer {
    protected scene: Scene;
    protected trackElement: TrackElement;
    protected mesh: Mesh | null = null;
    protected material: StandardMaterial;
    protected containerMesh: Mesh | null = null;

    constructor(scene: Scene, trackElement: TrackElement) {
        this.scene = scene;
        this.trackElement = trackElement;
        
        // Create default material
        this.material = new StandardMaterial(`${trackElement.id}-material`, scene);
        this.material.diffuseColor = Color3.Gray();
    }

    protected getContainerMesh(): Mesh {
        if (!this.containerMesh) {
            this.containerMesh = new Mesh("container", this.scene);
        }
        return this.containerMesh;
    }

    public render(position: Vector3): Mesh {
        if (this.mesh) {
            this.mesh.dispose();
        }

        // Create mesh based on element size
        this.mesh = MeshBuilder.CreateBox(
            `track-element-${this.trackElement.id}`,
            {
                width: this.trackElement.containerSize.x * 10,
                height: this.trackElement.containerSize.y * 10,
                depth: this.trackElement.containerSize.z * 10
            },
            this.scene
        );

        // Apply position and material
        this.mesh.position = position;
        this.mesh.material = this.material;

        return this.mesh;
    }

    public dispose(): void {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        if (this.containerMesh) {
            this.containerMesh.dispose();
            this.containerMesh = null;
        }
        if (this.material) {
            this.material.dispose();
        }
    }
}