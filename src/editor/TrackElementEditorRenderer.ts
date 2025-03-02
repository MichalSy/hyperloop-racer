import { Scene, Mesh, StandardMaterial, Color3, Vector3 } from '@babylonjs/core';
import { TrackElement } from '../data/types';
import { TrackElementRenderer } from '../editor/TrackElementRenderer';

export class TrackElementEditorRenderer extends TrackElementRenderer {
    private highlightMaterial: StandardMaterial;

    constructor(scene: Scene, trackElement: TrackElement) {
        super(scene, trackElement);
        
        // Create highlight material for editor mode
        this.highlightMaterial = new StandardMaterial("highlight-material", scene);
        this.highlightMaterial.emissiveColor = Color3.Yellow();
    }

    public render(position: Vector3): Mesh {
        const mesh = super.render(position);
        
        // Apply editor-specific visual changes
        mesh.material = this.highlightMaterial;
        
        // Make mesh semi-transparent in editor mode
        if (mesh.material instanceof StandardMaterial) {
            mesh.material.alpha = 0.7;
        }
        
        return mesh;
    }

    public dispose(): void {
        this.highlightMaterial.dispose();
        super.dispose();
    }
}