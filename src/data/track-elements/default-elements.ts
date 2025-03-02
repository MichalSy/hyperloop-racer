import { TrackElement, ConnectorType } from '../types';

/**
 * Default track elements that are available in the editor
 */
export const DefaultTrackElements: TrackElement[] = [
  // Straight segment
  {
    id: 'straight-segment',
    name: 'Straight Segment',
    description: 'A straight track segment',
    containerSize: { x: 1, y: 1, z: 3 },  // 10x10x30
    connectors: [
      {
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        forwardVector: { x: 0, y: 0, z: 1 },  // Forward along Z axis
        type: ConnectorType.ENTRY
      },
      {
        position: { x: 0, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        forwardVector: { x: 0, y: 0, z: 1 },  // Forward along Z axis
        type: ConnectorType.CHECKPOINT
      },
      {
        position: { x: 0, y: 0, z: 30 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        forwardVector: { x: 0, y: 0, z: 1 },  // Forward along Z axis
        type: ConnectorType.EXIT
      }
    ]
  },

  // Curve segment (90 degrees)
  {
    id: 'curve-90',
    name: 'Curve 90°',
    description: 'A 90-degree curve segment',
    containerSize: { x: 2, y: 1, z: 2 },  // 30x10x30
    connectors: [
      {
        position: { x: 0, y: 0, z: 0 },
        normal: { x: -1, y: 0, z: 0 },
        upVector: { x: 0, y: 1, z: 0 },
        forwardVector: { x: 0, y: 0, z: 1 },  // Initial forward along Z axis
        type: ConnectorType.ENTRY
      },
      {
        position: { x: 15, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        forwardVector: { x: 1, y: 0, z: 0 },  // Final forward along X axis after curve
        type: ConnectorType.EXIT
      }
    ]
  }
];