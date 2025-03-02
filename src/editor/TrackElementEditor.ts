import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { Vector3, Mesh, StandardMaterial, Color3 } from "@babylonjs/core";

/**
 * TrackElementEditor handles the editing of individual track elements
 */
export class TrackElementEditor {
    private engine: BabylonEngine;
    private trackElementLibrary: TrackElementLibrary;
    private elementPanel: HTMLElement;
    private propertiesPanel: HTMLElement;
    private activeElementId: string | null = null;
    private currentMesh: Mesh | null = null;

    constructor(
        engine: BabylonEngine,
        trackElementLibrary: TrackElementLibrary,
        elementPanel: HTMLElement,
        propertiesPanel: HTMLElement
    ) {
        this.engine = engine;
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
            name.textContent = element.name;

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
        this.clearCurrentElement();
        
        const camera = this.engine.getCamera();
        const position = camera.target.clone();
        
        const mesh = this.trackElementLibrary.createTrackElementMesh(elementId);
        if (mesh) {
            mesh.position = position;
            mesh.rotation = new Vector3(0, 0, 0);
            this.currentMesh = mesh;
            this.activeElementId = elementId;
            
            const highlightMaterial = new StandardMaterial("highlight", this.engine.getScene());
            highlightMaterial.emissiveColor = Color3.Yellow();
            mesh.material = highlightMaterial;
            
            // Update element panel to show active state
            const elements = this.elementPanel.querySelectorAll('.element-item');
            elements.forEach(el => {
                el.classList.remove('active');
                if (el.getAttribute('data-element-id') === elementId) {
                    el.classList.add('active');
                }
            });

            this.updatePropertiesPanel(elementId);
        }
    }

    private clearCurrentElement() {
        if (this.currentMesh) {
            this.currentMesh.dispose();
            this.currentMesh = null;
        }
    }

    public updatePropertiesPanel(elementId: string | null) {
        if (!elementId) {
            this.propertiesPanel.innerHTML = '<h3>Element Properties</h3>';
            return;
        }

        const element = this.trackElementLibrary.getElementById(elementId);
        if (!element) return;

        this.propertiesPanel.innerHTML = `
            <h3>Element Properties</h3>
            <div class="element-info">
                <h4>${element.name}</h4>
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
        this.clearCurrentElement();
    }
}