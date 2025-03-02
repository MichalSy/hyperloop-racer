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
    dimensions: { width: 10, height: 2, depth: 30 },
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
    dimensions: { width: 30, height: 2, depth: 30 },
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
    dimensions: { width: 10, height: 40, depth: 60 },
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
    dimensions: { width: 10, height: 20, depth: 30 },
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
    dimensions: { width: 15, height: 2, depth: 30 },
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
    dimensions: { width: 15, height: 2, depth: 30 },
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