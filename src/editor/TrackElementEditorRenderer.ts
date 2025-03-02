import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder, Color3, Engine, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import { TrackElement, ConnectorType } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';
import { TextureManager } from '../manager/TextureManager';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private debugMaterial: StandardMaterial;
    private connectorMaterial: StandardMaterial;
    private entryConnectorMaterial: StandardMaterial;
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

        // Create standard connector material
        this.connectorMaterial = new StandardMaterial("connector-material", scene);
        this.connectorMaterial.diffuseColor = Color3.White();
        this.connectorMaterial.emissiveColor = Color3.White();

        // Create entry connector material (green)
        this.entryConnectorMaterial = new StandardMaterial("entry-connector-material", scene);
        this.entryConnectorMaterial.diffuseColor = Color3.Green();
        this.entryConnectorMaterial.emissiveColor = Color3.Green();
    }

    private createConnectorPoint(position: Vector3, parent: Mesh, parentCube?: Mesh, connectorType?: ConnectorType): Mesh {
        const connectorSphere = MeshBuilder.CreateSphere("connector-sphere", {
            diameter: 1
        }, this.scene);

        // Set material based on connector type
        if (connectorType === ConnectorType.ENTRY) {
            connectorSphere.material = this.entryConnectorMaterial;
            connectorSphere.visibility = 1; // Always visible for entry connectors
        } else {
            connectorSphere.material = this.connectorMaterial;
            connectorSphere.visibility = 0; // Hidden by default for other connectors
        }

        connectorSphere.position = position;
        connectorSphere.setParent(parent);

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
                            // Nur anzeigen wenn es kein ENTRY-Konnektor ist (diese sind immer sichtbar)
                            if (connector.material !== this.entryConnectorMaterial) {
                                connector.visibility = 1;
                            }
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
                            // Nur ausblenden wenn es kein ENTRY-Konnektor ist
                            if (connector.material !== this.entryConnectorMaterial) {
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

        // Create element-defined connectors first
        this.trackElement.connectors.forEach(connector => {
            const connectorPos = new Vector3(
                connector.position.x,
                connector.position.y,
                connector.position.z
            );
            this.createConnectorPoint(connectorPos, containerMesh, undefined, connector.type);
        });
        
        // Calculate total dimensions for centering
        const totalWidth = this.trackElement.containerSize.x * blockSize;
        const totalHeight = this.trackElement.containerSize.y * blockSize;
        const totalDepth = this.trackElement.containerSize.z * blockSize;
        
        const connectorPositions = new Map<string, Mesh>();

        // Create debug visualization cubes
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

                        this.setupCubeHoverEvents(cube);

                        // Helper function to check if a position matches any track element connector
                        const isTrackElementConnector = (position: Vector3): { isConnector: boolean, type?: ConnectorType } => {
                            for (const connector of this.trackElement.connectors) {
                                const connectorPos = new Vector3(
                                    connector.position.x,
                                    connector.position.y,
                                    connector.position.z
                                );
                                if (connectorPos.equals(position)) {
                                    return { isConnector: true, type: connector.type };
                                }
                            }
                            return { isConnector: false };
                        };

                        // Helper function to create or share connector
                        const createOrShareConnector = (position: Vector3): void => {
                            const key = `${position.x},${position.y},${position.z}`;
                            const existingConnector = connectorPositions.get(key);
                            
                            if (existingConnector) {
                                this.addSharedConnector(existingConnector, cube);
                            } else {
                                const connectorCheck = isTrackElementConnector(position);
                                const connector = this.createConnectorPoint(
                                    position,
                                    containerMesh,
                                    cube,
                                    connectorCheck.type
                                );
                                connectorPositions.set(key, connector);
                            }
                        };

                        // Add connector points at cube corners
                        createOrShareConnector(cubePosition.clone());
                        createOrShareConnector(cubePosition.add(new Vector3(0, 0, blockSize/2))); // Forward
                        createOrShareConnector(cubePosition.add(new Vector3(0, 0, -blockSize/2))); // Back
                        createOrShareConnector(cubePosition.add(new Vector3(-blockSize/2, 0, 0))); // Left
                        createOrShareConnector(cubePosition.add(new Vector3(blockSize/2, 0, 0))); // Right
                        createOrShareConnector(cubePosition.add(new Vector3(0, blockSize/2, 0))); // Top
                        createOrShareConnector(cubePosition.add(new Vector3(0, -blockSize/2, 0))); // Bottom
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
        this.entryConnectorMaterial.dispose();
    }
}