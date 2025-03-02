/**
 * Counter module for tracking player progress, scores, and lap times
 */

/**
 * Lap counter to track player's race progress
 */
export class LapCounter {
  private checkpoints: string[] = [];
  private currentCheckpoint: number = -1;
  private lapTimes: number[] = [];
  private lapStartTime: number = 0;
  private isRacing: boolean = false;
  private bestLapTime: number | null = null;
  
  /**
   * Creates a new lap counter
   * @param checkpointIds Array of checkpoint IDs in order
   */
  constructor(checkpointIds: string[] = []) {
    this.checkpoints = checkpointIds;
  }
  
  /**
   * Sets the checkpoints for the counter
   * @param checkpointIds Array of checkpoint IDs in order
   */
  public setCheckpoints(checkpointIds: string[]): void {
    this.checkpoints = checkpointIds;
    this.reset();
  }
  
  /**
   * Starts the race timer
   */
  public startRace(): void {
    this.isRacing = true;
    this.lapStartTime = performance.now();
    this.currentCheckpoint = -1;
    console.log('Race started!');
  }
  
  /**
   * Records a checkpoint pass
   * @param checkpointId ID of the checkpoint passed
   * @returns true if checkpoint was valid, false otherwise
   */
  public passCheckpoint(checkpointId: string): boolean {
    if (!this.isRacing) {
      return false;
    }
    
    const nextCheckpointIndex = (this.currentCheckpoint + 1) % this.checkpoints.length;
    const expectedCheckpointId = this.checkpoints[nextCheckpointIndex];
    
    if (checkpointId === expectedCheckpointId) {
      this.currentCheckpoint = nextCheckpointIndex;
      
      // If we completed a lap
      if (nextCheckpointIndex === 0) {
        const lapTime = (performance.now() - this.lapStartTime) / 1000;
        this.lapTimes.push(lapTime);
        
        // Update best time
        if (this.bestLapTime === null || lapTime < this.bestLapTime) {
          this.bestLapTime = lapTime;
        }
        
        this.lapStartTime = performance.now();
        console.log(`Lap completed in ${lapTime.toFixed(3)} seconds`);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Gets the current lap number (1-based)
   */
  public getCurrentLap(): number {
    return this.lapTimes.length + 1;
  }
  
  /**
   * Gets the current lap time
   */
  public getCurrentLapTime(): number {
    if (!this.isRacing) {
      return 0;
    }
    
    return (performance.now() - this.lapStartTime) / 1000;
  }
  
  /**
   * Gets the best lap time
   */
  public getBestLapTime(): number | null {
    return this.bestLapTime;
  }
  
  /**
   * Gets all lap times
   */
  public getLapTimes(): number[] {
    return [...this.lapTimes];
  }
  
  /**
   * Ends the race
   */
  public endRace(): void {
    this.isRacing = false;
  }
  
  /**
   * Resets the counter
   */
  public reset(): void {
    this.isRacing = false;
    this.currentCheckpoint = -1;
    this.lapTimes = [];
    this.lapStartTime = 0;
    // We keep the best lap time across resets
  }
}

export function setupCounter(element: HTMLButtonElement) {
  let counter = 0
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `count is ${counter}`
  }
  element.addEventListener('click', () => setCounter(counter + 1))
  setCounter(0)
}
