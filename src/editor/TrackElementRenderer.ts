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
        this.material.wireframe = true;
        // Disable backface culling to make both sides of the track visible
        this.material.backFaceCulling = false;
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
        const normals: number[] = [];
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

            // Normals for each vertex
            // Top face normals (pointing up)
            normals.push(correctedUp.x, correctedUp.y, correctedUp.z);
            normals.push(correctedUp.x, correctedUp.y, correctedUp.z);
            // Bottom face normals (pointing down)
            normals.push(-correctedUp.x, -correctedUp.y, -correctedUp.z);
            normals.push(-correctedUp.x, -correctedUp.y, -correctedUp.z);

            // Create triangles between current and next cross section
            if (i < points.length - 1) {
                const baseIdx = i * 4;
                // Top face
                indices.push(
                    baseIdx, baseIdx + 4, baseIdx + 1,
                    baseIdx + 1, baseIdx + 4, baseIdx + 5
                );
                // Bottom face
                indices.push(
                    baseIdx + 2, baseIdx + 3, baseIdx + 6,
                    baseIdx + 3, baseIdx + 7, baseIdx + 6
                );
                // Side faces
                indices.push(
                    // Left side
                    baseIdx, baseIdx + 2, baseIdx + 4,
                    baseIdx + 2, baseIdx + 6, baseIdx + 4,
                    // Right side
                    baseIdx + 1, baseIdx + 5, baseIdx + 3,
                    baseIdx + 3, baseIdx + 5, baseIdx + 7
                );
            }
        }

        // Create the road mesh
        const roadMesh = new Mesh("road", this.scene);
        roadMesh.parent = this.getContainerMesh();
        const vertexData = new VertexData();
        
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
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

        // Calculate distance between connectors
        const distance = Vector3.Distance(entryConnector.worldPos, exitConnector.worldPos);
        
        // Create arrays for final curve points and up vectors
        const finalPoints: Vector3[] = [];
        const finalUpVectors: Vector3[] = [];
        
        // Get intermediate control points (checkpoints)
        const intermediatePoints = processedConnectors.filter(c => 
            c.type !== ConnectorType.ENTRY && c.type !== ConnectorType.EXIT
        );
        
        // Calculate control points using perpendicular vector approach
        // This mimics graphic software's way of creating smooth curves
        const controlPoints: Vector3[] = [];
        
        // Add entry point
        controlPoints.push(entryConnector.worldPos.clone());
        
        // Calculate first control point after entry using entry's forward direction
        // The distance should be proportional to the length of the total curve
        // This is similar to setting "handle length" in graphic software
        const entryControlLength = Math.min(distance * 0.5, 9.5); // Maximum 20 units or 1/3 of total distance
        const entryControlPoint = entryConnector.worldPos.add(
            entryConnector.forwardVector.normalize().scale(entryControlLength)
        );
        controlPoints.push(entryControlPoint);
        
        // Add intermediate points if any
        if (intermediatePoints.length > 0) {
            intermediatePoints.forEach(point => {
                controlPoints.push(point.worldPos.clone());
            });
        }
        
        // Calculate last control point before exit using exit's reverse forward direction
        const exitControlLength = Math.min(distance * 0.5, 9.5); // Maximum 20 units or 1/3 of total distance
        const exitControlPoint = exitConnector.worldPos.subtract(
            exitConnector.forwardVector.normalize().scale(exitControlLength)
        );
        controlPoints.push(exitControlPoint);
        
        // Add exit point
        controlPoints.push(exitConnector.worldPos.clone());
        
        // Generate curve points with high density for smooth curves
        const curveSegmentMultiplier = 2.5; // More points for smoother curves
        const numCurvePoints = Math.max(50, Math.ceil(distance * curveSegmentMultiplier));
        
        // Create curve based on number of control points
        let curvePoints: Vector3[];
        
        if (controlPoints.length === 3) {
            // For simple case with just start and end points plus one control point
            // Use quadratic bezier
            curvePoints = Curve3.CreateQuadraticBezier(
                controlPoints[0],
                controlPoints[1],
                controlPoints[2],
                numCurvePoints
            ).getPoints();
        } else if (controlPoints.length === 4) {
            // For simple case with start, end and two control points
            // Use cubic bezier (most common case for a single curve segment)
            curvePoints = Curve3.CreateCubicBezier(
                controlPoints[0],
                controlPoints[1],
                controlPoints[2],
                controlPoints[3],
                numCurvePoints
            ).getPoints();
        } else if (controlPoints.length > 4) {
            // For complex curves with intermediate points
            // Use Catmull-Rom spline which passes through all points
            curvePoints = Curve3.CreateCatmullRomSpline(
                controlPoints,
                numCurvePoints,
                false // Do not close the curve
            ).getPoints();
        } else {
            // Default fallback to simple linear interpolation
            curvePoints = [controlPoints[0].clone(), controlPoints[controlPoints.length - 1].clone()];
        }
        
        // Use all generated points
        finalPoints.push(...curvePoints);
        
        // Generate up vectors by interpolating between entry and exit
        for (let i = 0; i < finalPoints.length; i++) {
            const t = i / (finalPoints.length - 1);
            const upVector = Vector3.Lerp(
                entryConnector.upVector,
                exitConnector.upVector,
                t
            ).normalize();
            
            finalUpVectors.push(upVector);
        }
        
        // Final verification - make sure the first and last points exactly match the connectors
        finalPoints[0] = entryConnector.worldPos.clone();
        finalPoints[finalPoints.length - 1] = exitConnector.worldPos.clone();
        
        return {
            points: finalPoints,
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