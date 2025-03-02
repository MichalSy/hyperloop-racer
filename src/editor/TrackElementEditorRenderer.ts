import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder, Color3 } from '@babylonjs/core';
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
        this.debugMaterial.diffuseTexture = TextureManager.getInstance(scene).getContainerTexture();
        this.debugMaterial.useAlphaFromDiffuseTexture = true;
        this.debugMaterial.backFaceCulling = false;
        
        this.debugMaterial.alpha = 0.4;
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
                        
                        cube.material = this.debugMaterial;
                        
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
            mesh.dispose();
        });
        this.meshes = [];
        this.debugMaterial.dispose();
    }
}