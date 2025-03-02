import { TrackElement, ConnectorType } from '../types';
import { generateUUID } from '../../utils/helpers';

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
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: -15 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.EXIT
      }
    ]
  },
  
  // Curve segment (90 degrees)
  {
    id: 'curve-90',
    name: 'Curve 90°',
    description: 'A 90-degree curve segment',
    containerSize: { x: 3, y: 1, z: 3 },  // 30x10x30
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: -15, y: 0, z: 0 },
        normal: { x: -1, y: 0, z: 0 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.EXIT
      }
    ]
  },
  
  // Loop segment
  {
    id: 'loop',
    name: 'Loop',
    description: 'A vertical loop segment',
    containerSize: { x: 1, y: 4, z: 6 },  // 10x40x60
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: -30 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 30 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.EXIT
      }
    ]
  },
  
  // Ramp segment
  {
    id: 'ramp',
    name: 'Ramp',
    containerSize: { x: 1, y: 2, z: 3 },  // 10x20x30
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: -15 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 15, z: 15 },
        normal: { x: 0, y: 0.5, z: 0.866 },
        upVector: { x: 0, y: 0.866, z: -0.5 },
        type: ConnectorType.EXIT
      }
    ]
  },
  
  // Start segment with checkpoint
  {
    id: 'start-segment',
    name: 'Start Segment',
    containerSize: { x: 1.5, y: 1, z: 3 },  // 15x10x30
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: -15 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
        upVector: { x: 0, y: 0, z: 1 },
        type: ConnectorType.CHECKPOINT
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.EXIT
      }
    ]
  },
  
  // Finish segment with checkpoint
  {
    id: 'finish-segment',
    name: 'Finish Segment',
    containerSize: { x: 1.5, y: 1, z: 3 },  // 15x10x30
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    connectors: [
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: -15 },
        normal: { x: 0, y: 0, z: -1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.ENTRY
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 1, z: 0 },
        upVector: { x: 0, y: 0, z: 1 },
        type: ConnectorType.CHECKPOINT
      },
      {
        id: generateUUID(),
        position: { x: 0, y: 0, z: 15 },
        normal: { x: 0, y: 0, z: 1 },
        upVector: { x: 0, y: 1, z: 0 },
        type: ConnectorType.EXIT
      }
    ]
  }
];