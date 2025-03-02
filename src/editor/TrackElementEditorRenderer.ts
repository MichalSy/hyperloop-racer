import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder, Color3, Engine } from '@babylonjs/core';
import { TrackElement } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';
import { TextureManager } from '../manager/TextureManager';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private debugMaterial: StandardMaterial;
    private connectorMaterial: StandardMaterial;
    private meshes: Mesh[] = [];

    constructor(scene: Scene, trackElement: TrackElement) {
        super(scene, trackElement);
        
        // Create debug material for editor mode
        this.debugMaterial = new StandardMaterial("debug-material", scene);
        this.debugMaterial.diffuseTexture = TextureManager.getInstance(scene).getContainerTexture();
        this.debugMaterial.useAlphaFromDiffuseTexture = true;
        this.debugMaterial.backFaceCulling = false;
        
        // Deaktiviere Lichteinflüsse
        this.debugMaterial.disableLighting = true;
        this.debugMaterial.emissiveColor = Color3.White();
        
        // Optimiere Alpha Blending
        this.debugMaterial.alphaMode = Engine.ALPHA_COMBINE;
        this.debugMaterial.separateCullingPass = true;

        // Create connector material
        this.connectorMaterial = new StandardMaterial("connector-material", scene);
        this.connectorMaterial.diffuseColor = Color3.White();
        this.connectorMaterial.emissiveColor = Color3.White();
    }

    public render(position: Vector3): Mesh {
        const rootMesh = new Mesh("editor-root", this.scene);
        rootMesh.position = position;

        const blockSize = 10;
        const cubeScale = 1; // Mache die Würfel leicht kleiner um Überschneidungen zu vermeiden
        
        for (let x = 0; x < this.trackElement.containerSize.x; x++) {
            for (let y = 0; y < this.trackElement.containerSize.y; y++) {
                for (let z = 0; z < this.trackElement.containerSize.z; z++) {
                    const isOnEdge = x === 0 || x === this.trackElement.containerSize.x - 1 ||
                                   y === 0 || y === this.trackElement.containerSize.y - 1 ||
                                   z === 0 || z === this.trackElement.containerSize.z - 1;
                    
                    if (isOnEdge) {
                        const cube = MeshBuilder.CreateBox("debug-cube", {
                            size: blockSize * cubeScale
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

        // Add connector point at 0,0,0
        const connectorSphere = MeshBuilder.CreateSphere("connector-sphere", {
            diameter: 2
        }, this.scene);
        connectorSphere.material = this.connectorMaterial;
        connectorSphere.position = new Vector3(0, 0, 0);
        connectorSphere.setParent(rootMesh);
        this.meshes.push(connectorSphere);

        return rootMesh;
    }

    public dispose(): void {
        super.dispose();
        this.meshes.forEach(mesh => {
            mesh.dispose();
        });
        this.meshes = [];
        this.debugMaterial.dispose();
        this.connectorMaterial.dispose();
    }
}