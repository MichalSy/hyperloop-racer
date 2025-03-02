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
        
        // Create an array for final curve points
        const finalPoints: Vector3[] = [];
        const finalUpVectors: Vector3[] = [];
        
        // Step 1: Add straight section at the beginning
        // -----------------------------------------------
        // Add several points in a straight line from the entry in its forward direction
        const straightSectionLength = 2.5; // At least 10 units or 10% of total distance
        const straightPointCount = 2; // Number of points for the straight section
        
        for (let i = 0; i < straightPointCount; i++) {
            const t = i / (straightPointCount - 1);
            const straightPoint = entryConnector.worldPos.add(
                entryConnector.forwardVector.normalize().scale(straightSectionLength * t)
            );
            finalPoints.push(straightPoint);
            finalUpVectors.push(entryConnector.upVector.clone());
        }
        
        // The last point of the straight section will be the first control point for the curve
        const entryControlPoint = finalPoints[finalPoints.length - 1].clone();
        
        // Step 2: Add straight section at the end (we'll append these after creating the curve)
        // -----------------------------------------------
        const endStraightPoints: Vector3[] = [];
        const endStraightUpVectors: Vector3[] = [];
        
        for (let i = 0; i < straightPointCount; i++) {
            const t = i / (straightPointCount - 1);
            const straightPoint = exitConnector.worldPos.subtract(
                exitConnector.forwardVector.normalize().scale(straightSectionLength * (1 - t))
            );
            endStraightPoints.push(straightPoint);
            endStraightUpVectors.push(exitConnector.upVector.clone());
        }
        
        // The first point of the end straight section will be the last control point for the curve
        const exitControlPoint = endStraightPoints[0].clone();
        
        // Step 3: Generate the curved section between the straight sections
        // -----------------------------------------------
        
        // We'll need control points that smoothly transition from the straight sections
        // to the curved section - these will be farther in the direction of travel
        const curveTransitionFactor = Math.min(0.5, Math.max(0.25, distance / 30));
        
        const entryTransitionPoint = entryControlPoint.add(
            entryConnector.forwardVector.normalize().scale(distance * curveTransitionFactor)
        );
        
        const exitTransitionPoint = exitControlPoint.subtract(
            exitConnector.forwardVector.normalize().scale(distance * curveTransitionFactor)
        );
        
        // Create control points for the main curved section
        const curveControlPoints = [
            entryControlPoint.clone(),
            entryTransitionPoint,
            // Add intermediate points if any
            ...processedConnectors.filter(c => 
                c.type !== ConnectorType.ENTRY && c !== exitConnector
            ).map(c => c.worldPos.clone()),
            exitTransitionPoint,
            exitControlPoint.clone()
        ];
        
        // Generate up vectors for the curve section
        const curveUpVectors = [entryConnector.upVector.clone()];
        
        // Add intermediate up vectors if any
        processedConnectors.filter(c => 
            c.type !== ConnectorType.ENTRY && c !== exitConnector
        ).forEach(c => {
            curveUpVectors.push(c.upVector.clone());
        });
        
        curveUpVectors.push(exitConnector.upVector.clone());
        
        // Generate the curve points
        const numCurvePoints = Math.max(30, Math.ceil(distance * 1.5));
        let curvePoints: Vector3[];
        
        if (curveControlPoints.length <= 4) {
            // For simple curves without intermediate points, use a Bezier curve
            curvePoints = Curve3.CreateCubicBezier(
                curveControlPoints[0],
                curveControlPoints[1],
                curveControlPoints[curveControlPoints.length - 2],
                curveControlPoints[curveControlPoints.length - 1],
                numCurvePoints
            ).getPoints();
        } else {
            // For complex curves with intermediate points
            curvePoints = Curve3.CreateCatmullRomSpline(
                curveControlPoints,
                numCurvePoints
            ).getPoints();
        }
        
        // Remove the first and last points from the curve as they'll overlap with our straight sections
        curvePoints = curvePoints.slice(1, -1);
        
        // Generate up vectors for the curve points
        for (let i = 0; i < curvePoints.length; i++) {
            const t = i / (curvePoints.length - 1);
            const upVector = Vector3.Lerp(
                entryConnector.upVector,
                exitConnector.upVector,
                t
            ).normalize();
            
            finalUpVectors.push(upVector);
        }
        
        // Step 4: Combine all sections
        // -----------------------------------------------
        // Skip the first point of the curved section as it would duplicate the last point of our entry straight section
        finalPoints.push(...curvePoints);
        
        // Skip the first point of the end straight section as it would duplicate the last point of our curved section
        finalPoints.push(...endStraightPoints);
        finalUpVectors.push(...endStraightUpVectors);
        
        // Final verification - make sure the first and last points exactly match the connectors
        finalPoints[0] = entryConnector.worldPos.clone();
        finalPoints[finalPoints.length - 1] = exitConnector.worldPos.clone();
        
        // For debugging - verify that the direction at the start and end matches the connector directions
        if (finalPoints.length >= 2) {
            const startDirection = finalPoints[1].subtract(finalPoints[0]).normalize();
            const endDirection = finalPoints[finalPoints.length - 1].subtract(finalPoints[finalPoints.length - 2]).normalize();
            
            console.log('Start direction match:', Vector3.Dot(startDirection, entryConnector.forwardVector.normalize()));
            console.log('End direction match:', Vector3.Dot(endDirection, exitConnector.forwardVector.normalize()));
        }
        
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