import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElementManager } from "./TrackElementManager";
import { Track } from "../data/Track";
import { Vector3 } from "@babylonjs/core";

/**
 * TrackEditor handles the track building functionality
 */
export class TrackEditor {
    private engine: BabylonEngine;
    private trackElementManager: TrackElementManager;
    private currentTrack: Track;
    private propertiesPanel: HTMLElement;

    constructor(
        engine: BabylonEngine,
        trackElementManager: TrackElementManager,
        propertiesPanel: HTMLElement
    ) {
        this.engine = engine;
        this.trackElementManager = trackElementManager;
        this.propertiesPanel = propertiesPanel;
        this.currentTrack = new Track();
        this.initializeTrackWithStartSegment();
    }

    private initializeTrackWithStartSegment() {
        const startPosition = new Vector3(0, 0, 0);
        const instance = this.trackElementManager.createTrackElementInstance(
            'start-segment',
            startPosition,
            new Vector3(0, 0, 0)
        );
        
        if (instance) {
            this.currentTrack.addElement(instance);
            this.trackElementManager.selectElement(instance.id);
            this.markModified();
            
            const camera = this.engine.getCamera();
            camera.position = new Vector3(0, 20, -30);
            camera.setTarget(new Vector3(0, 0, 0));
        }
    }

    public updatePropertiesPanel(instanceId: string | null) {
        if (!instanceId) {
            this.propertiesPanel.innerHTML = '<h3>Track Properties</h3>';
            return;
        }

        const trackData = this.currentTrack.getData();
        const element = trackData.elements.find(e => e.id === instanceId);
        if (!element) return;

        this.propertiesPanel.innerHTML = `
            <h3>Track Element Properties</h3>
            <div class="property-group">
                <label>Position:</label>
                <div class="property-controls">
                    <div class="property-row">
                        <label>X:</label>
                        <input type="number" id="pos-x" value="${element.position.x}" step="1" />
                    </div>
                    <div class="property-row">
                        <label>Y:</label>
                        <input type="number" id="pos-y" value="${element.position.y}" step="1" />
                    </div>
                    <div class="property-row">
                        <label>Z:</label>
                        <input type="number" id="pos-z" value="${element.position.z}" step="1" />
                    </div>
                </div>
            </div>
            <div class="property-group">
                <label>Rotation:</label>
                <div class="property-controls">
                    <div class="property-row">
                        <label>X:</label>
                        <input type="number" id="rot-x" value="${element.rotation.x}" step="0.1" />
                    </div>
                    <div class="property-row">
                        <label>Y:</label>
                        <input type="number" id="rot-y" value="${element.rotation.y}" step="0.1" />
                    </div>
                    <div class="property-row">
                        <label>Z:</label>
                        <input type="number" id="rot-z" value="${element.rotation.z}" step="0.1" />
                    </div>
                </div>
            </div>
        `;
    }

    public markModified() {
        this.currentTrack.getData().modifiedAt = new Date().toISOString();
    }

    public getTrack(): Track {
        return this.currentTrack;
    }

    public dispose() {
        // Cleanup code here
    }
}