import { Vector3 } from '../data/types';
import * as BABYLON from 'babylonjs';

/**
 * Converts an application Vector3 to a Babylon.js Vector3
 */
export function toBabylonVector3(vector: Vector3): BABYLON.Vector3 {
  return new BABYLON.Vector3(vector.x, vector.y, vector.z);
}

/**
 * Converts a Babylon.js Vector3 to an application Vector3
 */
export function toAppVector3(vector: BABYLON.Vector3): Vector3 {
  return { x: vector.x, y: vector.y, z: vector.z };
}

/**
 * Generates a random UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Formats a time in seconds to a readable string
 * @param timeInSeconds Time in seconds
 * @returns Formatted time string (e.g., "1:23.456")
 */
export function formatTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

/**
 * Safely stores an object in localStorage with error handling
 */
export function safeLocalStorageSave(key: string, data: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${error}`);
    return false;
  }
}

/**
 * Safely retrieves and parses an object from localStorage with error handling
 */
export function safeLocalStorageLoad<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Failed to load from localStorage: ${error}`);
    return defaultValue;
  }
}