export class LapCounter {
    private startTime: number | null = null;
    private lapTimes: number[] = [];
    private bestLapTime: number | null = null;

    public startLap(): void {
        this.startTime = performance.now();
    }

    public endLap(): number {
        if (!this.startTime) {
            return 0;
        }

        const lapTime = (performance.now() - this.startTime) / 1000;
        this.lapTimes.push(lapTime);

        if (this.bestLapTime === null || lapTime < this.bestLapTime) {
            this.bestLapTime = lapTime;
        }

        this.startTime = null;
        return lapTime;
    }

    public getBestLapTime(): number | null {
        return this.bestLapTime;
    }

    public getCurrentLapTime(): number {
        if (!this.startTime) {
            return 0;
        }
        return (performance.now() - this.startTime) / 1000;
    }

    public getLapTimes(): number[] {
        return [...this.lapTimes];
    }

    public reset(): void {
        this.startTime = null;
        this.lapTimes = [];
        this.bestLapTime = null;
    }

    public checkPoint(checkpointId: string): void {
        // Implementierung der Checkpoint-Logik
        console.log(`Checkpoint ${checkpointId} reached at ${this.getCurrentLapTime()} seconds`);
    }
}