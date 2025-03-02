import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElementManager } from "./TrackElementManager";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { Vector3 } from "@babylonjs/core";

/**
 * TrackElementEditor handles the editing of individual track elements
 */
export class TrackElementEditor {
    private engine: BabylonEngine;
    private trackElementManager: TrackElementManager;
    private trackElementLibrary: TrackElementLibrary;
    private elementPanel: HTMLElement;
    private propertiesPanel: HTMLElement;
    private activeElementId: string | null = null;

    constructor(
        engine: BabylonEngine,
        trackElementManager: TrackElementManager,
        trackElementLibrary: TrackElementLibrary,
        elementPanel: HTMLElement,
        propertiesPanel: HTMLElement
    ) {
        this.engine = engine;
        this.trackElementManager = trackElementManager;
        this.trackElementLibrary = trackElementLibrary;
        this.elementPanel = elementPanel;
        this.propertiesPanel = propertiesPanel;
        
        this.setupElementPanel();
        this.setupEventListeners();
    }

    private setupElementPanel() {
        const elements = this.trackElementLibrary.getAllElements();
        const elementList = document.createElement('div');
        elementList.className = 'element-list';

        elements.forEach(element => {
            const elementItem = document.createElement('div');
            elementItem.className = 'element-item';
            elementItem.setAttribute('data-element-id', element.id);

            const thumbnail = document.createElement('div');
            thumbnail.className = 'element-thumbnail';

            const name = document.createElement('div');
            name.className = 'element-name';
            name.textContent = element.name; // Changed from elementId to name

            elementItem.appendChild(thumbnail);
            elementItem.appendChild(name);
            elementList.appendChild(elementItem);
        });

        this.elementPanel.innerHTML = '<h3>Track Elements</h3>';
        this.elementPanel.appendChild(elementList);
    }

    private setupEventListeners() {
        this.elementPanel.addEventListener('click', (e) => {
            const elementItem = (e.target as HTMLElement).closest('.element-item');
            if (elementItem) {
                const elementId = elementItem.getAttribute('data-element-id');
                if (elementId) {
                    this.showTrackElement(elementId);
                }
            }
        });
    }

    public showTrackElement(elementId: string) {
        // Clear existing elements
        this.trackElementManager.clearAllElements();
        
        // Create new element at camera target position
        const camera = this.engine.getCamera();
        const position = camera.target.clone();
        
        const instance = this.trackElementManager.createTrackElementInstance(
            elementId,
            position,
            new Vector3(0, 0, 0)
        );
        
        if (instance) {
            this.trackElementManager.selectElement(instance.id);
            this.activeElementId = elementId;
            
            // Update element panel to show active state
            const elements = this.elementPanel.querySelectorAll('.element-item');
            elements.forEach(el => {
                el.classList.remove('active');
                if (el.getAttribute('data-element-id') === elementId) {
                    el.classList.add('active');
                }
            });
        }
    }

    public updatePropertiesPanel(instanceId: string | null) {
        if (!instanceId || !this.activeElementId) {
            this.propertiesPanel.innerHTML = '<h3>Element Properties</h3>';
            return;
        }

        const element = this.trackElementLibrary.getElementById(this.activeElementId);
        if (!element) return;

        this.propertiesPanel.innerHTML = `
            <h3>Element Properties</h3>
            <div class="element-info">
                <h4>${element.name}</h4> <!-- Changed from elementId to name -->
                <p>${element.description || ''}</p>
            </div>
            <div class="property-group">
                <label>Test Properties:</label>
                <div class="property-controls">
                    <!-- Add specific element properties here -->
                </div>
            </div>
        `;
    }

    public dispose() {
        // Cleanup code here
        this.trackElementManager.clearAllElements();
    }
}