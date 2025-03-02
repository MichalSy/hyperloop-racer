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
        // Find entry and exit connectors
        const entryConnector = processedConnectors.find(c => c.type === ConnectorType.ENTRY)!;
        const exitConnector = processedConnectors.find(c => c.type === ConnectorType.EXIT) || 
            processedConnectors.filter(c => c.type !== ConnectorType.ENTRY).pop();

        if (!exitConnector) {
            throw new Error("Track must have at least two connectors");
        }

        // Calculate distance between connectors to determine appropriate control point distances
        const distance = Vector3.Distance(entryConnector.worldPos, exitConnector.worldPos);
        
        // Scale control point distances based on connector distance
        // For closer connectors, we want smaller control point distances to avoid excessive curves
        const controlPointDistanceFactor = Math.min(0.33, Math.max(0.15, distance / 50));
        
        // Calculate control point positions
        const entryControlPoint = entryConnector.worldPos.add(
            entryConnector.forwardVector.normalize().scale(distance * controlPointDistanceFactor)
        );
        
        const exitControlPoint = exitConnector.worldPos.subtract(
            exitConnector.forwardVector.normalize().scale(distance * controlPointDistanceFactor)
        );
        
        // Create control points using Bezier curve approach
        const controlPoints = [
            entryConnector.worldPos.clone(),
            entryControlPoint,
            exitControlPoint,
            exitConnector.worldPos.clone()
        ];

        // Add any intermediate connectors if they exist
        const intermediateConnectors = processedConnectors.filter(c => 
            c.type !== ConnectorType.ENTRY && c !== exitConnector
        );
        
        if (intermediateConnectors.length > 0) {
            // If we have intermediate points, create a more complex spline that passes through them
            const allPoints = [entryConnector.worldPos.clone()];
            
            // Add entry control point
            allPoints.push(entryControlPoint);
            
            // Add intermediate connectors with their own control points
            intermediateConnectors.forEach(connector => {
                // Add the intermediate connector position
                allPoints.push(connector.worldPos.clone());
                
                // Calculate and add a control point based on this connector's forward vector
                // This helps maintain the curve direction through the intermediate points
                allPoints.push(connector.worldPos.add(
                    connector.forwardVector.normalize().scale(distance * controlPointDistanceFactor * 0.5)
                ));
            });
            
            // Add exit control point
            allPoints.push(exitControlPoint);
            
            // Add the exit connector position
            allPoints.push(exitConnector.worldPos.clone());
            
            // Use the enhanced points for our spline
            controlPoints.length = 0;
            controlPoints.push(...allPoints);
        }

        // Generate up vectors for each control point
        const controlUpVectors: Vector3[] = [];
        
        // Add up vector for entry connector
        controlUpVectors.push(entryConnector.upVector.clone());
        
        // If using intermediate points, add appropriate up vectors
        if (intermediateConnectors.length > 0) {
            // Add up vector for entry control point
            controlUpVectors.push(entryConnector.upVector.clone());
            
            // Add up vectors for intermediate connectors and their control points
            intermediateConnectors.forEach(connector => {
                controlUpVectors.push(connector.upVector.clone());
                controlUpVectors.push(connector.upVector.clone());
            });
            
            // Add up vectors for exit control and connector
            controlUpVectors.push(exitConnector.upVector.clone());
            controlUpVectors.push(exitConnector.upVector.clone());
        } else {
            // For simple path, just add remaining up vectors
            controlUpVectors.push(entryConnector.upVector.clone());
            controlUpVectors.push(exitConnector.upVector.clone());
            controlUpVectors.push(exitConnector.upVector.clone());
        }
        
        // Generate a smooth curve with appropriately spaced points
        const numPoints = Math.max(50, Math.ceil(distance * 2));
        
        // Create the curve based on what type of control points we have
        let curvePoints: Vector3[];
        
        if (controlPoints.length <= 4) {
            // For simple paths, use a cubic Bezier curve which produces smooth, balanced results
            curvePoints = Curve3.CreateCubicBezier(
                controlPoints[0],
                controlPoints[1],
                controlPoints[2],
                controlPoints[3],
                numPoints
            ).getPoints();
        } else {
            // For complex paths with intermediate points, use Catmull-Rom which passes through all points
            curvePoints = Curve3.CreateCatmullRomSpline(controlPoints, numPoints).getPoints();
        }
        
        // Generate consistent up vectors along the path
        const finalUpVectors: Vector3[] = [];
        
        for (let i = 0; i < curvePoints.length; i++) {
            const t = i / (curvePoints.length - 1);
            
            // Smooth interpolation between up vectors
            let upVector: Vector3;
            
            if (t === 0) {
                upVector = entryConnector.upVector.clone();
            } else if (t === 1) {
                upVector = exitConnector.upVector.clone();
            } else {
                // For intermediate points, find where we are in the control point sequence
                if (controlUpVectors.length > 2) {
                    const segmentCount = controlUpVectors.length - 1;
                    const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
                    const segmentT = (t * segmentCount) - segment;
                    
                    // Smoothly interpolate the up vectors
                    upVector = Vector3.Lerp(
                        controlUpVectors[segment],
                        controlUpVectors[segment + 1],
                        segmentT
                    ).normalize();
                } else {
                    // Simple interpolation between entry and exit
                    upVector = Vector3.Lerp(
                        entryConnector.upVector,
                        exitConnector.upVector,
                        t
                    ).normalize();
                }
            }
            
            finalUpVectors.push(upVector);
        }
        
        // Ensure the spline exactly matches the entry and exit positions
        if (curvePoints.length > 0) {
            curvePoints[0] = entryConnector.worldPos.clone();
            curvePoints[curvePoints.length - 1] = exitConnector.worldPos.clone();
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