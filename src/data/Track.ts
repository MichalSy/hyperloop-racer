import { TrackData, TrackElementInstance, BestTime } from './types';
import { generateUUID, safeLocalStorageLoad, safeLocalStorageSave } from '../utils/helpers';
import { AppConfig } from '../config/AppConfig';
import JSZip from 'jszip';

/**
 * Manages track data and operations
 */
export class Track {
  private trackData: TrackData;
  private onChange: (() => void) | null = null;

  /**
   * Creates a new Track instance
   * @param data Initial track data or null to create a new track
   */
  constructor(data?: Partial<TrackData>) {
    this.trackData = {
      id: generateUUID(),
      name: data?.name || 'New Track',
      description: data?.description || '',
      elements: data?.elements || [],
      bestTimes: data?.bestTimes || [],
      checkpoints: data?.checkpoints || [],
      startPosition: data?.startPosition || { x: 0, y: 0, z: 0 },
      startRotation: data?.startRotation || { x: 0, y: 0, z: 0 },
      createdAt: data?.createdAt || new Date().toISOString(),
      modifiedAt: data?.modifiedAt || new Date().toISOString()
    };
  }

  /**
   * Gets the track data
   */
  public getData(): TrackData {
    return { ...this.trackData };
  }

  /**
   * Sets a change listener to be called when the track is modified
   * @param callback Function to call when track changes
   */
  public setOnChangeListener(callback: () => void): void {
    this.onChange = callback;
  }

  /**
   * Sets the track name
   * @param name New track name
   */
  public setName(name: string): void {
    this.trackData.name = name;
    this.notifyChange();
  }

  /**
   * Sets the track description
   * @param description New track description
   */
  public setDescription(description: string): void {
    this.trackData.description = description;
    this.notifyChange();
  }

  /**
   * Adds a track element instance to the track
   * @param element Track element instance to add
   */
  public addElement(element: TrackElementInstance): void {
    this.trackData.elements.push(element);
    this.notifyChange();
  }

  /**
   * Updates a track element instance
   * @param elementId ID of the element to update
   * @param element Updated track element instance
   */
  public updateElement(elementId: string, element: TrackElementInstance): void {
    const index = this.trackData.elements.findIndex(e => e.id === elementId);
    if (index !== -1) {
      this.trackData.elements[index] = element;
      this.notifyChange();
    }
  }

  /**
   * Removes a track element instance
   * @param elementId ID of the element to remove
   * @returns True if the element was removed, false otherwise
   */
  public removeElement(elementId: string): boolean {
    const initialLength = this.trackData.elements.length;
    this.trackData.elements = this.trackData.elements.filter(e => e.id !== elementId);
    const removed = this.trackData.elements.length < initialLength;
    if (removed) {
      this.notifyChange();
    }
    return removed;
  }

  /**
   * Sets the track checkpoints
   * @param checkpoints Array of checkpoint positions
   */
  public setCheckpoints(checkpoints: Array<{ x: number; y: number; z: number }>): void {
    this.trackData.checkpoints = checkpoints;
    this.notifyChange();
  }

  /**
   * Sets the track start position
   * @param position Start position
   */
  public setStartPosition(position: { x: number; y: number; z: number }): void {
    this.trackData.startPosition = position;
    this.notifyChange();
  }

  /**
   * Sets the track start rotation
   * @param rotation Start rotation
   */
  public setStartRotation(rotation: { x: number; y: number; z: number }): void {
    this.trackData.startRotation = rotation;
    this.notifyChange();
  }

  /**
   * Adds a best time record to the track
   * @param playerName Player's name
   * @param time Time in seconds
   */
  public addBestTime(playerName: string, time: number): void {
    const newTime: BestTime = {
      playerName,
      time,
      date: new Date().toISOString()
    };

    // Insert the time in order (fastest first)
    let i = 0;
    while (i < this.trackData.bestTimes.length && this.trackData.bestTimes[i].time < time) {
      i++;
    }

    this.trackData.bestTimes.splice(i, 0, newTime);

    // Keep only top 10 times
    if (this.trackData.bestTimes.length > 10) {
      this.trackData.bestTimes.pop();
    }

    this.notifyChange();
  }

  /**
   * Gets the best times for the track
   * @returns Array of best times
   */
  public getBestTimes(): BestTime[] {
    return [...this.trackData.bestTimes];
  }

  /**
   * Notifies that the track has changed
   */
  private notifyChange(): void {
    if (this.onChange) {
      this.onChange();
    }
  }

  /**
   * Saves the track to local storage
   */
  public saveToStorage(): boolean {
    // Load existing tracks
    const tracks = safeLocalStorageLoad<TrackData[]>(AppConfig.storage.tracks, []);

    // Find if this track already exists
    const existingIndex = tracks.findIndex(t => t.id === this.trackData.id);

    if (existingIndex >= 0) {
      // Update existing track
      tracks[existingIndex] = { ...this.trackData };
    } else {
      // Add new track
      tracks.push({ ...this.trackData });
    }

    // Save back to storage
    return safeLocalStorageSave(AppConfig.storage.tracks, tracks);
  }

  /**
   * Loads a track from local storage
   * @param id ID of the track to load
   * @returns A new Track object if found, null otherwise
   */
  public static loadFromStorage(id: string): Track | null {
    const tracks = safeLocalStorageLoad<TrackData[]>(AppConfig.storage.tracks, []);
    const trackData = tracks.find(t => t.id === id);

    if (trackData) {
      return new Track(trackData);
    }

    return null;
  }

  /**
   * Gets all tracks from local storage
   * @returns Array of track data
   */
  public static getAllTracks(): TrackData[] {
    return safeLocalStorageLoad<TrackData[]>(AppConfig.storage.tracks, []);
  }

  /**
   * Exports the track to a zip file
   * @returns Promise resolving to a Blob containing the zip file
   */
  public async exportToZip(): Promise<Blob> {
    const zip = new JSZip();

    // Add track JSON
    zip.file("track.json", JSON.stringify(this.trackData, null, 2));

    // Add metadata
    const metadata = {
      formatVersion: "1.0",
      gameVersion: "1.0.0",
      exportDate: new Date().toISOString()
    };
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Add preview image (placeholder for now)
    // In a full implementation, we would generate a thumbnail of the track

    // Generate the zip file
    return await zip.generateAsync({ type: "blob" });
  }

  /**
   * Imports a track from a zip file
   * @param zipFile Zip file to import
   * @returns Promise resolving to a new Track object
   */
  public static async importFromZip(zipFile: Blob): Promise<Track | null> {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(zipFile);

      // Extract track data
      const trackJson = await contents.file("track.json")?.async("string");
      if (!trackJson) {
        throw new Error("Track data not found in zip file");
      }

      const trackData = JSON.parse(trackJson) as TrackData;

      // Validate track data
      if (!trackData.id || !trackData.name || !trackData.elements) {
        throw new Error("Invalid track data format");
      }

      // Create a new track with the imported data
      return new Track(trackData);
    } catch (error) {
      console.error("Failed to import track:", error);
      return null;
    }
  }
}