import { Scene, Mesh, StandardMaterial, Color3, Vector3, Path3D, VertexData, Curve3, MeshBuilder } from '@babylonjs/core';
import { TrackElement, ConnectorType } from '../data/types';

export class TrackElementRenderer {
    protected scene: Scene;
    protected trackElement: TrackElement;
    protected mesh: Mesh | null = null;
    protected material: StandardMaterial;
    protected containerMesh: Mesh | null = null;
    protected debugTube: Mesh | null = null;

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

    protected createRoadFromSpline(points: Vector3[], upVectors: Vector3[]): Mesh {
        // Create a path from the points
        const path = new Path3D(points);
        const tangents = path.getTangents();
        
        const roadWidth = 10;
        const roadHeight = 0.5;

        const positions: number[] = [];
        const indices: number[] = [];
        const normals_: number[] = [];
        const uvs: number[] = [];

        // Create vertices for the road - now with top and bottom faces
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const tangent = tangents[i];
            const up = upVectors[Math.floor(i / (points.length / upVectors.length))];
            
            // Calculate right vector (perpendicular to up and tangent)
            const right = Vector3.Cross(tangent, up).normalize();
            // Recalculate up to ensure it's perpendicular to tangent and right
            const correctedUp = Vector3.Cross(right, tangent).normalize();
            
            // Calculate corner points for the road segment
            const halfWidth = roadWidth / 2;
            const halfHeight = roadHeight / 2;

            const topLeft = point.add(right.scale(halfWidth)).add(correctedUp.scale(halfHeight));
            const topRight = point.add(right.scale(-halfWidth)).add(correctedUp.scale(halfHeight));
            const bottomLeft = point.add(right.scale(halfWidth)).add(correctedUp.scale(-halfHeight));
            const bottomRight = point.add(right.scale(-halfWidth)).add(correctedUp.scale(-halfHeight));
            
            // Add vertices (4 vertices per cross section)
            positions.push(
                // Top vertices
                topLeft.x, topLeft.y, topLeft.z,
                topRight.x, topRight.y, topRight.z,
                // Bottom vertices
                bottomLeft.x, bottomLeft.y, bottomLeft.z,
                bottomRight.x, bottomRight.y, bottomRight.z
            );

            // UVs for each vertex
            const uv = i / (points.length - 1);
            uvs.push(
                0, uv,  // top left
                1, uv,  // top right
                0, uv,  // bottom left
                1, uv   // bottom right
            );

            // Normals for each vertex (pointing upward for top face, downward for bottom face)
            for (let j = 0; j < 2; j++) { // Top vertices
                normals_.push(correctedUp.x, correctedUp.y, correctedUp.z);
            }
            for (let j = 0; j < 2; j++) { // Bottom vertices
                normals_.push(-correctedUp.x, -correctedUp.y, -correctedUp.z);
            }

            // Create triangles between current and next cross section
            if (i < points.length - 1) {
                const baseIdx = i * 4;
                // Top face
                indices.push(
                    baseIdx, baseIdx + 1, baseIdx + 4,
                    baseIdx + 1, baseIdx + 5, baseIdx + 4
                );
                // Bottom face
                indices.push(
                    baseIdx + 2, baseIdx + 6, baseIdx + 3,
                    baseIdx + 3, baseIdx + 6, baseIdx + 7
                );
                // Side faces
                indices.push(
                    // Left side
                    baseIdx, baseIdx + 4, baseIdx + 2,
                    baseIdx + 2, baseIdx + 4, baseIdx + 6,
                    // Right side
                    baseIdx + 1, baseIdx + 3, baseIdx + 5,
                    baseIdx + 3, baseIdx + 7, baseIdx + 5
                );
            }
        }

        // Create the road mesh
        const roadMesh = new Mesh("road", this.scene);
        roadMesh.parent = this.getContainerMesh();
        const vertexData = new VertexData();
        
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals_;
        vertexData.uvs = uvs;
        
        vertexData.applyToMesh(roadMesh);
        
        return roadMesh;
    }

    public render(position: Vector3): Mesh {
        if (this.mesh) {
            this.mesh.dispose();
        }
        
        if (this.debugTube) {
            this.debugTube.dispose();
        }

        // Process all connectors and store their world positions and orientations
        const connectors = this.trackElement.connectors;
        const processedConnectors = connectors.map(connector => {
            const worldPos = new Vector3(
                position.x + connector.position.x,
                position.y + connector.position.y,
                position.z + connector.position.z
            );
            return {
                worldPos,
                type: connector.type,
                upVector: new Vector3(
                    connector.upVector.x,
                    connector.upVector.y,
                    connector.upVector.z
                ),
                forwardVector: new Vector3(
                    connector.forwardVector.x,
                    connector.forwardVector.y,
                    connector.forwardVector.z
                )
            };
        });

        // Find entry and exit connectors
        const entryConnector = processedConnectors.find(c => c.type === ConnectorType.ENTRY);
        const exitConnector = processedConnectors.find(c => c.type === ConnectorType.EXIT);

        if (!entryConnector) {
            throw new Error("Track element must have an entry connector");
        }

        if (!exitConnector && processedConnectors.length < 2) {
            throw new Error("Track element must have at least two connectors");
        }

        // Generate properly balanced spline points
        const { points, upVectors } = this.generateBalancedSpline(processedConnectors);

        // Create the road mesh using both points and up vectors
        this.mesh = this.createRoadFromSpline(points, upVectors);
        this.mesh.material = this.material;

        // Create debug tube to visualize the spline
        this.debugTube = MeshBuilder.CreateTube("debugTube", {
            path: points,
            radius: 0.5,
            updatable: false
        }, this.scene);
        
        const tubeMaterial = new StandardMaterial("tubeMaterial", this.scene);
        tubeMaterial.emissiveColor = new Color3(0, 1, 0);
        tubeMaterial.alpha = 0.5;
        this.debugTube.material = tubeMaterial;
        this.debugTube.parent = this.getContainerMesh();

        return this.mesh;
    }

    private generateBalancedSpline(processedConnectors: {
        worldPos: Vector3;
        type: ConnectorType;
        upVector: Vector3;
        forwardVector: Vector3;
    }[]): { points: Vector3[], upVectors: Vector3[] } {
        // Create arrays for final spline points and up vectors
        const splineControlPoints: Vector3[] = [];
        const controlUpVectors: Vector3[] = [];

        // Find entry and exit connectors
        const entryConnector = processedConnectors.find(c => c.type === ConnectorType.ENTRY)!;
        const exitConnector = processedConnectors.find(c => c.type === ConnectorType.EXIT);

        // Add entry connector position
        splineControlPoints.push(entryConnector.worldPos);
        controlUpVectors.push(entryConnector.upVector);

        // Add straight segment at the beginning (1 unit in the forward direction)
        const entryExtensionPoint = entryConnector.worldPos.add(entryConnector.forwardVector.normalize().scale(1.0));
        splineControlPoints.push(entryExtensionPoint);
        controlUpVectors.push(entryConnector.upVector);

        // Add intermediate control points (checkpoints and other connectors)
        const intermediateConnectors = processedConnectors.filter(c => 
            c.type !== ConnectorType.ENTRY && c.type !== ConnectorType.EXIT
        );
        
        intermediateConnectors.forEach(connector => {
            splineControlPoints.push(connector.worldPos);
            controlUpVectors.push(connector.upVector);
        });

        // Add exit connector or last connector if no exit is defined
        if (exitConnector) {
            splineControlPoints.push(exitConnector.worldPos);
            controlUpVectors.push(exitConnector.upVector);
            
            // Add straight segment at the end (1 unit in the forward direction)
            const exitExtensionPoint = exitConnector.worldPos.add(exitConnector.forwardVector.normalize().scale(1.0));
            splineControlPoints.push(exitExtensionPoint);
            controlUpVectors.push(exitConnector.upVector);
        } else {
            // If no exit connector, use the last connector that's not entry
            const lastConnector = processedConnectors.filter(c => c.type !== ConnectorType.ENTRY).pop();
            if (lastConnector) {
                splineControlPoints.push(lastConnector.worldPos);
                controlUpVectors.push(lastConnector.upVector);
                
                const lastExtensionPoint = lastConnector.worldPos.add(lastConnector.forwardVector.normalize().scale(1.0));
                splineControlPoints.push(lastExtensionPoint);
                controlUpVectors.push(lastConnector.upVector);
            }
        }

        // Generate the final curve with many points for smooth rendering
        const numPoints = Math.max(50, splineControlPoints.length * 10); // More points for smoother curve
        
        // Ensure we have at least 3 points to create a catmull-rom spline
        if (splineControlPoints.length < 3) {
            // Add an extra point if we only have 2
            const firstPoint = splineControlPoints[0];
            const secondPoint = splineControlPoints[1];
            
            // Calculate a third point to make the spline viable
            const direction = secondPoint.subtract(firstPoint).normalize();
            const thirdPoint = secondPoint.add(direction);
            splineControlPoints.push(thirdPoint);
            
            // Use the same up vector for this additional point
            controlUpVectors.push(controlUpVectors[controlUpVectors.length - 1]);
        }

        // Create the catmull-rom spline for smooth curves
        const catmullRomSpline = Curve3.CreateCatmullRomSpline(splineControlPoints, numPoints);
        const curvePoints = catmullRomSpline.getPoints();
        
        // Interpolate up vectors for each point on the curve
        const finalUpVectors: Vector3[] = [];
        
        for (let i = 0; i < curvePoints.length; i++) {
            const t = i / (curvePoints.length - 1);
            
            // Interpolate between up vectors
            let upVector: Vector3;
            if (t === 0) {
                upVector = controlUpVectors[0];
            } else if (t === 1) {
                upVector = controlUpVectors[controlUpVectors.length - 1];
            } else {
                const segmentCount = controlUpVectors.length - 1;
                const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
                const segmentT = (t * segmentCount) - segment;
                
                upVector = Vector3.Lerp(
                    controlUpVectors[segment],
                    controlUpVectors[segment + 1],
                    segmentT
                ).normalize();
            }
            finalUpVectors.push(upVector);
        }

        return {
            points: curvePoints,
            upVectors: finalUpVectors
        };
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
        if (this.debugTube) {
            this.debugTube.dispose();
            this.debugTube = null;
        }
    }
}