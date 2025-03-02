import { Scene, Mesh } from '@babylonjs/core';
import { TrackElement } from '../types';
import { DefaultTrackElements } from './default-elements';

export class TrackElementLibrary {
    private static instance: TrackElementLibrary;
    private scene: Scene;
    private elements: TrackElement[] = [];

    private constructor(scene: Scene) {
        this.scene = scene;
        this.loadElements();
    }

    public static getInstance(scene: Scene): TrackElementLibrary {
        if (!TrackElementLibrary.instance) {
            TrackElementLibrary.instance = new TrackElementLibrary(scene);
        }
        return TrackElementLibrary.instance;
    }

    private loadElements() {
        // Load default elements
        this.elements = [...DefaultTrackElements];
        
        // Load custom elements from storage if any
        const customElements = this.loadCustomElements();
        
        customElements.forEach(element => {
            if (!this.elements.some(e => e.id === element.id)) {
                this.elements.push(element);
            }
        });
        
        console.log(`Loaded ${this.elements.length} track elements (${DefaultTrackElements.length} default, ${customElements.length} custom)`);
    }

    private loadCustomElements(): TrackElement[] {
        // Implementation for loading custom elements
        return [];
    }

    public createTrackElementMesh(elementId: string): Mesh {
        const element = this.getElementById(elementId);
        if (!element) {
            throw new Error(`Track element with id ${elementId} not found`);
        }

        const mesh = new Mesh(elementId, this.scene);
        // Setup mesh based on element properties
        return mesh;
    }

    public getAllElements(): TrackElement[] {
        return [...this.elements];
    }

    public getElementById(id: string): TrackElement | null {
        return this.elements.find(element => element.id === id) || null;
    }

    public addElement(element: TrackElement): void {
        if (this.getElementById(element.id)) {
            throw new Error(`Element with id ${element.id} already exists`);
        }
        this.elements.push({ ...element });
    }

    public updateElement(element: TrackElement): void {
        const index = this.elements.findIndex(e => e.id === element.id);
        if (index === -1) {
            throw new Error(`Element with id ${element.id} not found`);
        }
        this.elements[index] = { ...element };
    }

    public deleteElement(id: string): boolean {
        const initialLength = this.elements.length;
        this.elements = this.elements.filter(element => element.id !== id);
        
        if (this.elements.length < initialLength) {
            return true;
        }
        return false;
    }

    public saveCustomElements(): void {
        const customElementsToSave = this.elements.filter(
            element => !DefaultTrackElements.some(e => e.id === element.id)
        );
        // Implementation for saving custom elements
    }
}