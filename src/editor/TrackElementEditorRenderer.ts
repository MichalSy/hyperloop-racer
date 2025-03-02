import { Scene, Mesh, StandardMaterial, Vector3, MeshBuilder, Color3, Engine, ActionManager, ExecuteCodeAction } from '@babylonjs/core';
import { TrackElement, ConnectorType } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';
import { TextureManager } from '../manager/TextureManager';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private debugMaterial: StandardMaterial;
    private connectorMaterial: StandardMaterial;
    private checkpointMaterial: StandardMaterial;
    private entryConnectorMaterial: StandardMaterial;
    private exitConnectorMaterial: StandardMaterial;
    private arrowMaterial: StandardMaterial;
    private upArrowMaterial: StandardMaterial;
    private forwardArrowMaterial: StandardMaterial;
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

        // Create white material for default connectors
        this.connectorMaterial = new StandardMaterial("connector-material", scene);
        this.connectorMaterial.diffuseColor = Color3.White();
        this.connectorMaterial.emissiveColor = Color3.White();

        // Create checkpoint material (blue)
        this.checkpointMaterial = new StandardMaterial("checkpoint-material", scene);
        this.checkpointMaterial.diffuseColor = Color3.Blue();
        this.checkpointMaterial.emissiveColor = Color3.Blue();

        // Create entry connector material (green)
        this.entryConnectorMaterial = new StandardMaterial("entry-connector-material", scene);
        this.entryConnectorMaterial.diffuseColor = Color3.Green();
        this.entryConnectorMaterial.emissiveColor = Color3.Green();

        // Create exit connector material (red)
        this.exitConnectorMaterial = new StandardMaterial("exit-connector-material", scene);
        this.exitConnectorMaterial.diffuseColor = Color3.Red();
        this.exitConnectorMaterial.emissiveColor = Color3.Red();

        // Create arrow material (yellow)
        this.arrowMaterial = new StandardMaterial("arrow-material", scene);
        this.arrowMaterial.diffuseColor = Color3.Yellow();
        this.arrowMaterial.emissiveColor = Color3.Yellow();

        // Create up arrow material (orange)
        this.upArrowMaterial = new StandardMaterial("up-arrow-material", scene);
        this.upArrowMaterial.diffuseColor = new Color3(1, 0.5, 0); // Orange
        this.upArrowMaterial.emissiveColor = new Color3(1, 0.5, 0);

        // Create forward arrow material (blue)
        this.forwardArrowMaterial = new StandardMaterial("forward-arrow-material", scene);
        this.forwardArrowMaterial.diffuseColor = new Color3(0, 0, 1); // Blue
        this.forwardArrowMaterial.emissiveColor = new Color3(0, 0, 1);
    }

    private createDirectionArrow(startPos: Vector3, direction: Vector3, material: StandardMaterial, parent: Mesh): Mesh {
        // Create arrow cylinder
        const arrowHeight = 2;
        const arrow = MeshBuilder.CreateCylinder("direction-arrow", {
            height: arrowHeight,
            diameter: 0.2,
        }, this.scene);

        // Create arrow head (cone)
        const arrowHead = MeshBuilder.CreateCylinder("direction-arrow-head", {
            height: 0.5,
            diameterTop: 0,
            diameterBottom: 0.4,
        }, this.scene);

        // Position arrow head on top of arrow cylinder
        arrowHead.position.y = arrowHeight / 2;
        arrowHead.setParent(arrow);

        // Apply material
        arrow.material = material;
        arrowHead.material = material;

        // Position arrow
        arrow.position = startPos.add(new Vector3(0, 1, 0)); // Move 1 unit above the sphere
        
        // Calculate rotation to align with direction vector
        const defaultUp = new Vector3(0, 1, 0);
        const rotationAxis = Vector3.Cross(defaultUp, direction.normalize());
        const angle = Math.acos(Vector3.Dot(defaultUp, direction.normalize()));
        
        if (!rotationAxis.equals(Vector3.Zero())) {
            arrow.rotate(rotationAxis, angle);
        }

        arrow.setParent(parent);
        this.meshes.push(arrow);
        
        return arrow;
    }

    private createConnectorPoint(position: Vector3, parent: Mesh, parentCube?: Mesh, connectorType?: ConnectorType): Mesh {
        const connectorSphere = MeshBuilder.CreateSphere("connector-sphere", {
            diameter: 1
        }, this.scene);

        let isFixedConnector = false;

        if (connectorType) {
            // Set material and visibility based on connector type
            switch (connectorType) {
                case ConnectorType.ENTRY:
                    connectorSphere.material = this.entryConnectorMaterial;
                    connectorSphere.visibility = 1;
                    isFixedConnector = true;
                    break;
                case ConnectorType.EXIT:
                    connectorSphere.material = this.exitConnectorMaterial;
                    connectorSphere.visibility = 1;
                    isFixedConnector = true;
                    break;
                case ConnectorType.CHECKPOINT:
                    connectorSphere.material = this.checkpointMaterial;
                    connectorSphere.visibility = 1;
                    isFixedConnector = true;
                    break;
                default:
                    connectorSphere.material = this.connectorMaterial;
                    connectorSphere.visibility = 0;
            }
        } else {
            // Default white connectors are hidden by default
            connectorSphere.material = this.connectorMaterial;
            connectorSphere.visibility = 0;
        }

        connectorSphere.position = position;
        connectorSphere.setParent(parent);

        this.meshes.push(connectorSphere);

        // If this is a fixed connector, create arrows to show direction vectors
        if (isFixedConnector) {
            // Find the matching connector definition to get the vectors
            const connector = this.trackElement.connectors.find(c => 
                new Vector3(c.position.x, c.position.y, c.position.z).equals(position)
            );

            if (connector) {
                // Create up vector arrow (orange)
                const upVector = new Vector3(connector.upVector.x, connector.upVector.y, connector.upVector.z);
                this.createDirectionArrow(position, upVector, this.upArrowMaterial, parent);

                // Create forward vector arrow (blue)
                const forwardVector = new Vector3(connector.forwardVector.x, connector.forwardVector.y, connector.forwardVector.z);
                this.createDirectionArrow(position, forwardVector, this.forwardArrowMaterial, parent);
            }
        }

        if (parentCube) {
            if (!this.cubeConnectorMap.has(parentCube)) {
                this.cubeConnectorMap.set(parentCube, []);
            }
            this.cubeConnectorMap.get(parentCube)!.push(connectorSphere);

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
                    // Markiere den Würfel als "gehovert"
                    cube.metadata = { ...cube.metadata, isHovered: true };
                    
                    const connectors = this.cubeConnectorMap.get(cube);
                    if (connectors) {
                        connectors.forEach(connector => {
                            // Nur weiße (Standard) Connectoren ein/ausblenden
                            if (connector.material === this.connectorMaterial) {
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
                    // Entferne den "gehovert" Status
                    if (cube.metadata) {
                        cube.metadata.isHovered = false;
                    }

                    const connectors = this.cubeConnectorMap.get(cube);
                    if (connectors) {
                        connectors.forEach(connector => {
                            // Nur weiße (Standard) Connectoren ein/ausblenden
                            if (connector.material === this.connectorMaterial) {
                                // Prüfe, ob irgendein verbundener Würfel noch gehovert ist
                                const relatedCubes = this.connectorToCubesMap.get(connector);
                                const anyRelatedCubeHovered = relatedCubes?.some(relatedCube => 
                                    relatedCube !== cube && 
                                    relatedCube.isEnabled() &&
                                    relatedCube.metadata?.isHovered
                                );
                                
                                if (!anyRelatedCubeHovered) {
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
        // Call parent's render method first to create the basic mesh
        super.render(Vector3.Zero());
        
        const containerMesh = this.getContainerMesh();
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

        containerMesh.position = new Vector3(
            -(totalWidth / 2.0) + (blockSize / 2.0),
            -(totalHeight / 2.0) + (blockSize / 2.0),
            -(totalDepth / 2.0)
        );

        return containerMesh;
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
        this.checkpointMaterial.dispose();
        this.entryConnectorMaterial.dispose();
        this.exitConnectorMaterial.dispose();
        this.arrowMaterial.dispose();
        this.upArrowMaterial.dispose();
        this.forwardArrowMaterial.dispose();
    }
}