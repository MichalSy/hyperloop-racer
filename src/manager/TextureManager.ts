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
        // Create container debug texture (blue lines)
        this.containerTexture = this.createDebugTexture("containerDebug", Color3.Green());
        
        // Create selection debug texture (red lines)
        this.selectionTexture = this.createDebugTexture("selectionDebug", Color3.Red());
    }

    private createDebugTexture(name: string, color: Color3): Texture {
        const size = 64; // texture size
        const borderWidth = 2; // border width in pixels
        
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");
        
        // Make canvas fully transparent
        ctx.clearRect(0, 0, size, size);
        
        // Draw borders with specified color
        ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1.0)`;
        ctx.lineWidth = borderWidth;
        
        // Draw rectangle border
        ctx.strokeRect(
            borderWidth / 2, 
            borderWidth / 2, 
            size - borderWidth, 
            size - borderWidth
        );
        
        // Create dynamic texture from canvas
        const texture = Texture.CreateFromBase64String(canvas.toDataURL(), name, this.scene);
        texture.hasAlpha = true;
        
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