/**
 * Core types for the Hyperloop Racer application
 */

/**
 * Connector type defines the role of a connector in a track element
 */
export enum ConnectorType {
  ENTRY = 'entry',   // Entry point for a track element
  EXIT = 'exit',     // Exit point from a track element
  CHECKPOINT = 'checkpoint'  // Intermediate control point for track path
}

/**
 * Position and orientation of a connector
 */
export interface Connector {
  id: string;
  position: Vector3;   // Position relative to the track element origin
  normal: Vector3;     // Direction the connector faces (outward from the surface)
  upVector: Vector3;   // "Up" orientation for the connector
  type: ConnectorType; // Role of the connector
}

/**
 * 3D vector representation
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Dimensions of a track element
 */
export interface Dimensions {
  width: number;  // X dimension
  height: number; // Y dimension
  depth: number;  // Z dimension
}

/**
 * Definition of a track element
 */
export interface TrackElement {
  id: string;
  name: string;
  dimensions: Dimensions;
  connectors: Connector[];
}

/**
 * Placed instance of a track element in a track
 */
export interface TrackElementInstance {
  elementId: string;      // Reference to the original track element
  position: Vector3;      // Position in world space
  rotation: Vector3;      // Rotation in world space (Euler angles)
  connectors: {           // Mapped connectors with world positions/orientations
    [connectorId: string]: {
      worldPosition: Vector3;
      worldNormal: Vector3;
      worldUpVector: Vector3;
    }
  };
}

/**
 * Complete track definition
 */
export interface Track {
  id: string;
  name: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  elements: TrackElementInstance[];
  bestTimes: BestTime[];
}

/**
 * Best time record for a track
 */
export interface BestTime {
  playerName: string;
  time: number;
  date: string;
}