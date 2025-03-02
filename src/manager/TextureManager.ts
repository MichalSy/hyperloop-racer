import { Scene, Texture, Color3 } from '@babylonjs/core';

export class TextureManager {
    private static instance: TextureManager;
    private scene: Scene;

    private containerTexture!: Texture;  // Using ! to assert it will be initialized
    private selectionTexture!: Texture;  // Using ! to assert it will be initialized

    private constructor(scene: Scene) {
        this.scene = scene;
        this.initializeDebugTextures();
    }

    public static getInstance(scene?: Scene): TextureManager {
        if (!TextureManager.instance) {
            if (!scene) {
                throw new Error("Scene is required for first initialization of TextureManager");
            }
            TextureManager.instance = new TextureManager(scene);
        }
        return TextureManager.instance;
    }

    private initializeDebugTextures(): void {
        // Create container debug texture (primary color)
        const primaryColor = Color3.FromHexString('#007acc');
        this.containerTexture = this.createDebugTexture("containerDebug", primaryColor);
        
        // Create selection debug texture (red lines)
        this.selectionTexture = this.createDebugTexture("selectionDebug", Color3.Red());
    }

    private createDebugTexture(name: string, color: Color3): Texture {
        const size = 64; // texture size
        const borderWidth = 2; // border width in pixels
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get canvas context");
        
        // Enable anti-aliasing
        ctx.imageSmoothingEnabled = true;
        
        // Make canvas fully transparent
        ctx.clearRect(0, 0, size, size);
        
        // Set transparent background
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, size, size);
        
        // Zeichne die Linien mit leicht reduzierter Deckkraft
        const alpha = 0.6; // Reduzierte Deckkraft für besseres Blending
        ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${alpha})`;
        ctx.lineWidth = borderWidth;
        
        // Verwende weichere Linienverbindungen
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Zeichne das Rechteck mit etwas Abstand zum Rand
        const padding = borderWidth * 1.5;
        ctx.strokeRect(
            padding,
            padding,
            size - padding * 2,
            size - padding * 2
        );
        
        // Create dynamic texture from canvas
        const texture = new Texture("data:" + canvas.toDataURL(), this.scene);
        texture.hasAlpha = true;
        texture.wrapU = Texture.CLAMP_ADDRESSMODE;
        texture.wrapV = Texture.CLAMP_ADDRESSMODE;
        
        return texture;
    }

    public getContainerTexture(): Texture {
        return this.containerTexture;
    }

    public getSelectionTexture(): Texture {
        return this.selectionTexture;
    }

    public dispose(): void {
        this.containerTexture.dispose();
        this.selectionTexture.dispose();
    }
}