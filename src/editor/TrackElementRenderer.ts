import { Scene, Mesh, StandardMaterial, Color3, Vector3, Path3D, VertexData, Quaternion } from '@babylonjs/core';
import { TrackElement, ConnectorType } from '../data/types';

export class TrackElementRenderer {
    protected scene: Scene;
    protected trackElement: TrackElement;
    protected mesh: Mesh | null = null;
    protected material: StandardMaterial;
    protected containerMesh: Mesh | null = null;

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

        // Find entry connector
        const entryConnector = this.trackElement.connectors.find(c => c.type === ConnectorType.ENTRY);
        if (!entryConnector) {
            throw new Error("Track element must have an entry connector");
        }

        // Create arrays for points and up vectors
        const splinePoints: Vector3[] = [];
        const upVectors: Vector3[] = [];

        // Start with entry connector
        const startPos = new Vector3(
            position.x + entryConnector.position.x,
            position.y + entryConnector.position.y,
            position.z + entryConnector.position.z
        );
        splinePoints.push(startPos);
        
        const startUp = new Vector3(
            entryConnector.upVector.x,
            entryConnector.upVector.y,
            entryConnector.upVector.z
        );
        upVectors.push(startUp);

        // Add other connectors in their defined order
        this.trackElement.connectors
            .filter(c => c.type !== ConnectorType.ENTRY)
            .forEach(connector => {
                splinePoints.push(new Vector3(
                    position.x + connector.position.x,
                    position.y + connector.position.y,
                    position.z + connector.position.z
                ));
                upVectors.push(new Vector3(
                    connector.upVector.x,
                    connector.upVector.y,
                    connector.upVector.z
                ));
            });

        // Create interpolated points along the spline
        const numPoints = Math.max(20, splinePoints.length * 5); // At least 5 points between each connector
        const points: Vector3[] = [];
        const path = new Path3D(splinePoints);
        
        for (let i = 0; i < numPoints; i++) {
            const t = i / (numPoints - 1);
            points.push(path.getPointAt(t));
        }

        // Create the road mesh using both points and up vectors
        this.mesh = this.createRoadFromSpline(points, upVectors);
        this.mesh.material = this.material;

        return this.mesh;
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
    }
}