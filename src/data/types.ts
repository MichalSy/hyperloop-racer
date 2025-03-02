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
 * Definition of a track element
 */
export interface TrackElement {
  id: string;
  name: string;
  description?: string;
  containerSize: Vector3;  // Size in grid blocks (1,1,1 = 10x10x10 units)
  position: Vector3;
  rotation: Vector3;
  connectors: Connector[];
}

/**
 * Placed instance of a track element in a track
 */
export interface TrackElementInstance {
  id: string;
  elementId: string;      // Reference to the original track element
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  connectors?: {  // Mache connectors optional
    id: string;
    position: {
      x: number;
      y: number;
      z: number;
    };
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  }[];
}

/**
 * Complete track definition
 */
export interface Track {
  data: TrackData;
  elements: TrackElementInstance[];
}

/**
 * Best time record for a track
 */
export interface BestTime {
  playerName: string;
  time: number;
  date: string;
}

export interface TrackData {
  id: string;
  name: string;
  description?: string;
  author?: string;
  elements: TrackElementInstance[];
  createdAt: string;
  modifiedAt: string;
  updatedAt?: string;
  bestTimes: BestTime[];
  checkpoints: Vector3[];
  startPosition: Vector3;
  startRotation: Vector3;
}