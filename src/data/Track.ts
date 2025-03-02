import { Track as TrackType, TrackElement, TrackElementInstance, BestTime } from './types';
import { generateUUID, safeLocalStorageLoad, safeLocalStorageSave } from '../utils/helpers';
import { AppConfig } from '../config/AppConfig';
import JSZip from 'jszip';

/**
 * Manages track data and operations
 */
export class Track {
  private trackData: TrackType;
  private onChange: (() => void) | null = null;
  
  /**
   * Creates a new Track instance
   * @param trackData Initial track data or null to create a new track
   */
  constructor(trackData?: TrackType) {
    if (trackData) {
      this.trackData = { ...trackData };
    } else {
      this.trackData = {
        id: generateUUID(),
        name: 'New Track',
        author: 'Unknown Author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        elements: [],
        bestTimes: []
      };
    }
  }
  
  /**
   * Gets the track data
   */
  public getData(): TrackType {
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
   * Updates track metadata
   * @param name New track name
   * @param author New author name
   */
  public updateMetadata(name: string, author: string): void {
    this.trackData.name = name;
    this.trackData.author = author;
    this.trackData.updatedAt = new Date().toISOString();
    this.notifyChange();
  }
  
  /**
   * Adds a track element instance to the track
   * @param instance Track element instance to add
   */
  public addElement(instance: TrackElementInstance): void {
    this.trackData.elements.push({ ...instance });
    this.trackData.updatedAt = new Date().toISOString();
    this.notifyChange();
  }
  
  /**
   * Updates a track element instance
   * @param index Index of the element to update
   * @param instance Updated track element instance
   */
  public updateElement(index: number, instance: TrackElementInstance): void {
    if (index >= 0 && index < this.trackData.elements.length) {
      this.trackData.elements[index] = { ...instance };
      this.trackData.updatedAt = new Date().toISOString();
      this.notifyChange();
    }
  }
  
  /**
   * Removes a track element instance
   * @param index Index of the element to remove
   */
  public removeElement(index: number): void {
    if (index >= 0 && index < this.trackData.elements.length) {
      this.trackData.elements.splice(index, 1);
      this.trackData.updatedAt = new Date().toISOString();
      this.notifyChange();
    }
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
    
    this.trackData.updatedAt = new Date().toISOString();
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
   * Saves the track to local storage
   */
  public saveToStorage(): boolean {
    // Load existing tracks
    const tracks = safeLocalStorageLoad<TrackType[]>(AppConfig.storage.tracks, []);
    
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
    const tracks = safeLocalStorageLoad<TrackType[]>(AppConfig.storage.tracks, []);
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
  public static getAllTracks(): TrackType[] {
    return safeLocalStorageLoad<TrackType[]>(AppConfig.storage.tracks, []);
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
      
      const trackData = JSON.parse(trackJson) as TrackType;
      
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