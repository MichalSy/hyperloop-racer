import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder, Color3, Engine, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import { TrackElement } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';
import { TextureManager } from '../manager/TextureManager';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private debugMaterial: StandardMaterial;
    private connectorMaterial: StandardMaterial;
    private meshes: Mesh[] = [];
    private cubeConnectorMap: Map<Mesh, Mesh[]> = new Map();
    private connectorToCubesMap: Map<Mesh, Mesh[]> = new Map();

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

    private createConnectorPoint(position: Vector3, parent: Mesh, parentCube?: Mesh): Mesh {
        const connectorSphere = MeshBuilder.CreateSphere("connector-sphere", {
            diameter: 1
        }, this.scene);
        connectorSphere.material = this.connectorMaterial;
        connectorSphere.position = position;
        connectorSphere.setParent(parent);
        connectorSphere.visibility = 0; // Hide by default

        this.meshes.push(connectorSphere);

        // If this connector belongs to a cube, store it in both maps
        if (parentCube) {
            // Add to cube -> connectors map
            if (!this.cubeConnectorMap.has(parentCube)) {
                this.cubeConnectorMap.set(parentCube, []);
            }
            this.cubeConnectorMap.get(parentCube)!.push(connectorSphere);

            // Add to connector -> cubes map
            if (!this.connectorToCubesMap.has(connectorSphere)) {
                this.connectorToCubesMap.set(connectorSphere, []);
            }
            this.connectorToCubesMap.get(connectorSphere)!.push(parentCube);
        }

        return connectorSphere;
    }

    private addSharedConnector(existingConnector: Mesh, newCube: Mesh): void {
        // Add the new cube to the connector's cube list
        if (!this.connectorToCubesMap.has(existingConnector)) {
            this.connectorToCubesMap.set(existingConnector, []);
        }
        this.connectorToCubesMap.get(existingConnector)!.push(newCube);

        // Add the connector to the new cube's connector list
        if (!this.cubeConnectorMap.has(newCube)) {
            this.cubeConnectorMap.set(newCube, []);
        }
        this.cubeConnectorMap.get(newCube)!.push(existingConnector);
    }

    private setupCubeHoverEvents(cube: Mesh): void {
        if (!cube.actionManager) {
            cube.actionManager = new ActionManager(this.scene);
        }

        // Show connectors on hover
        cube.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPointerOverTrigger,
                () => {
                    const connectors = this.cubeConnectorMap.get(cube);
                    if (connectors) {
                        connectors.forEach(connector => {
                            connector.visibility = 1;
                        });
                    }
                }
            )
        );

        // Hide connectors when hover ends
        cube.actionManager.registerAction(
            new ExecuteCodeAction(
                ActionManager.OnPointerOutTrigger,
                () => {
                    const connectors = this.cubeConnectorMap.get(cube);
                    if (connectors) {
                        connectors.forEach(connector => {
                            // Only hide if no other hovered cube uses this connector
                            const relatedCubes = this.connectorToCubesMap.get(connector);
                            const otherCubesHovered = relatedCubes?.some(relatedCube => 
                                relatedCube !== cube && 
                                relatedCube.isEnabled() && 
                                !!relatedCube.actionManager && 
                                relatedCube.actionManager.hoverCursor !== ''
                            );
                            
                            if (!otherCubesHovered) {
                                connector.visibility = 0;
                            }
                        });
                    }
                }
            )
        );
    }

    public render(): Mesh {
        const rootMesh = new Mesh("editor-root", this.scene);
        const containerMesh = new Mesh("container", this.scene);
        containerMesh.setParent(rootMesh);

        const blockSize = 10;
        const cubeScale = 1;
        const connectorOffset = 5; // Half of blockSize

        // Add origin point (0,0,0)
        this.createConnectorPoint(new Vector3(0, 0, 0), containerMesh);
        
        // Calculate total dimensions for centering
        const totalWidth = this.trackElement.containerSize.x * blockSize;
        const totalHeight = this.trackElement.containerSize.y * blockSize;
        const totalDepth = this.trackElement.containerSize.z * blockSize;
        
        const connectorPositions = new Map<string, Mesh>();

        // Create and position cubes relative to container center
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
                        
                        const cubePosition = new Vector3(
                            x * blockSize,
                            y * blockSize,
                            z * blockSize + (blockSize / 2.0)
                        );
                        cube.position = cubePosition;
                        
                        cube.setParent(containerMesh);
                        this.meshes.push(cube);

                        // Setup hover events for this cube
                        this.setupCubeHoverEvents(cube);

                        // Helper function to create or share connector
                        const createOrShareConnector = (position: Vector3): void => {
                            const key = `${position.x},${position.y},${position.z}`;
                            const existingConnector = connectorPositions.get(key);
                            
                            if (existingConnector) {
                                // Share existing connector
                                this.addSharedConnector(existingConnector, cube);
                            } else {
                                // Create new connector
                                const connector = this.createConnectorPoint(position, containerMesh, cube);
                                connectorPositions.set(key, connector);
                            }
                        };

                        // Add all connector points
                        createOrShareConnector(cubePosition.clone()); // Center
                        createOrShareConnector(cubePosition.add(new Vector3(0, 0, connectorOffset))); // Forward
                        createOrShareConnector(cubePosition.add(new Vector3(0, 0, -connectorOffset))); // Back
                        createOrShareConnector(cubePosition.add(new Vector3(-connectorOffset, 0, 0))); // Left
                        createOrShareConnector(cubePosition.add(new Vector3(connectorOffset, 0, 0))); // Right
                        createOrShareConnector(cubePosition.add(new Vector3(0, connectorOffset, 0))); // Top
                        createOrShareConnector(cubePosition.add(new Vector3(0, -connectorOffset, 0))); // Bottom
                    }
                }
            }
        }

        rootMesh.position = new Vector3(
            -(totalWidth / 2.0) + (blockSize / 2.0),
            -(totalHeight / 2.0) + (blockSize / 2.0),
            -(totalDepth / 2.0)
        );

        return rootMesh;
    }

    public dispose(): void {
        this.cubeConnectorMap.clear();
        this.connectorToCubesMap.clear();
        super.dispose();
        this.meshes.forEach(mesh => {
            mesh.dispose();
        });
        this.meshes = [];
        this.debugMaterial.dispose();
        this.connectorMaterial.dispose();
    }
}