import { BabylonEngine } from "../engine/BabylonEngine";
import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { TrackElementEditorRenderer } from "./TrackElementEditorRenderer";

/**
 * TrackElementEditor handles the editing of individual track elements
 */
export class TrackElementEditor {
    private engine: BabylonEngine;
    private trackElementLibrary: TrackElementLibrary;
    private elementPanel: HTMLElement;
    private propertiesPanel: HTMLElement;
    private currentRenderer: TrackElementEditorRenderer | null = null;
    private activeElementId: string | null = null;

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
        
        // Group elements by category if available, otherwise use "Default"
        const elementsByCategory: { [key: string]: any[] } = {};
        
        elements.forEach(element => {
            const category = element.category || 'Default';
            if (!elementsByCategory[category]) {
                elementsByCategory[category] = [];
            }
            elementsByCategory[category].push(element);
        });
        
        // Create panel content with category sections
        let panelContent = `
            <div class="editor-panel">
                <h3>Track Elements</h3>
        `;
        
        // Add elements grouped by category
        Object.keys(elementsByCategory).sort().forEach(category => {
            const categoryElements = elementsByCategory[category];
            
            panelContent += `
                <div class="element-category">
                    <h4 class="category-title">${category}</h4>
                    <div class="element-list">
                        ${categoryElements.map(element => `
                            <div class="element-item" data-element-id="${element.id}">
                                <div class="element-thumbnail">
                                    <div class="element-shape"></div>
                                </div>
                                <div class="element-name">${element.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        panelContent += `</div>`;
        
        this.elementPanel.innerHTML = panelContent;
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
        this.activeElementId = elementId;
        
        const camera = this.engine.getCamera();
        const position = camera.target.clone();
        
        const element = this.trackElementLibrary.getElementById(elementId);
        if (element) {
            this.currentRenderer = new TrackElementEditorRenderer(this.engine.getScene(), element);
            this.currentRenderer.render(position);
            
            // Update element panel to show active state
            const elements = this.elementPanel.querySelectorAll('.element-item');
            elements.forEach(el => {
                el.classList.remove('active');
                if (el.getAttribute('data-element-id') === elementId) {
                    el.classList.add('active');
                    
                    // Ensure the active element is visible in the viewport
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });

            this.updatePropertiesPanel(elementId);
        }
    }

    private clearCurrentElement() {
        if (this.currentRenderer) {
            this.currentRenderer.dispose();
            this.currentRenderer = null;
        }
        this.activeElementId = null;
    }

    public updatePropertiesPanel(elementId: string | null) {
        this.propertiesPanel.innerHTML = '<h3>Element Properties</h3>';
        
        if (!elementId) {
            this.propertiesPanel.innerHTML += '<div class="element-info"><p>No element selected</p></div>';
            return;
        }

        const element = this.trackElementLibrary.getElementById(elementId);
        if (!element) return;

        this.propertiesPanel.innerHTML += `
            <div class="element-info">
                <h4>${element.name}</h4>
                <p>${element.description || 'No description available.'}</p>
            </div>
            <div class="property-group">
                <label>Dimensions</label>
                <div class="property-controls">
                    <div class="property-row">Size: ${element.containerSize.x} x ${element.containerSize.y} x ${element.containerSize.z}</div>
                </div>
            </div>
            <div class="property-group">
                <label>Editor Controls</label>
                <div class="property-controls">
                    <!-- Editor specific controls will be added here -->
                </div>
            </div>
        `;
    }

    public dispose() {
        this.clearCurrentElement();
    }
}