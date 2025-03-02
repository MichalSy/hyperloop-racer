import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder } from '@babylonjs/core';
import { TrackElement } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';
import { TextureManager } from '../manager/TextureManager';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private debugMaterial: StandardMaterial;
    private meshes: Mesh[] = [];

    constructor(scene: Scene, trackElement: TrackElement) {
        super(scene, trackElement);
        
        // Create debug material for editor mode
        this.debugMaterial = new StandardMaterial("debug-material", scene);
        this.debugMaterial.wireframe = false;
        this.debugMaterial.diffuseTexture = TextureManager.getInstance(scene).getContainerTexture();
        this.debugMaterial.backFaceCulling = false;
    }

    public render(position: Vector3): Mesh {
        const rootMesh = new Mesh("editor-root", this.scene);
        rootMesh.position = position;

        const blockSize = 10;
        
        for (let x = 0; x < this.trackElement.containerSize.x; x++) {
            for (let y = 0; y < this.trackElement.containerSize.y; y++) {
                for (let z = 0; z < this.trackElement.containerSize.z; z++) {
                    const isOnEdge = x === 0 || x === this.trackElement.containerSize.x - 1 ||
                                   y === 0 || y === this.trackElement.containerSize.y - 1 ||
                                   z === 0 || z === this.trackElement.containerSize.z - 1;
                    
                    if (isOnEdge) {
                        const cube = MeshBuilder.CreateBox("debug-cube", {
                            size: blockSize
                        }, this.scene);

                        const material = new StandardMaterial("cube-material", this.scene);
                        material.diffuseTexture = TextureManager.getInstance(this.scene).getContainerTexture();

                        // Setze backFaceCulling auf false für alle Würfel an den Außenkanten
                        const isOuterEdge = (x === 0 || x === this.trackElement.containerSize.x - 1) &&
                                          (y === 0 || y === this.trackElement.containerSize.y - 1) ||
                                          (y === 0 || y === this.trackElement.containerSize.y - 1) &&
                                          (z === 0 || z === this.trackElement.containerSize.z - 1) ||
                                          (x === 0 || x === this.trackElement.containerSize.x - 1) &&
                                          (z === 0 || z === this.trackElement.containerSize.z - 1);

                        // Prüfe ob der Würfel an einer äußeren Ecke oder Kante ist
                        material.backFaceCulling = !isOuterEdge;
                        cube.material = material;
                        
                        cube.position = new Vector3(
                            (x - (this.trackElement.containerSize.x - 1) / 2) * blockSize,
                            (y - (this.trackElement.containerSize.y - 1) / 2) * blockSize,
                            (z - (this.trackElement.containerSize.z - 1) / 2) * blockSize
                        );
                        
                        cube.setParent(rootMesh);
                        this.meshes.push(cube);
                    }
                }
            }
        }

        return rootMesh;
    }

    public dispose(): void {
        super.dispose();
        this.meshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.dispose();
            }
            mesh.dispose();
        });
        this.meshes = [];
        this.debugMaterial.dispose();
    }
}