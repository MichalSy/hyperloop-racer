import {
    Engine,
    Scene,
    Vector3,
    Color4,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    ArcRotateCamera
} from '@babylonjs/core';

/**
 * BabylonEngine handles all core rendering and scene management functionality
 */
export class BabylonEngine {
    private engine: Engine;
    private scene: Scene;
    private camera!: ArcRotateCamera;
    private readonly canvas: HTMLCanvasElement;
    private resizeObserver: ResizeObserver;

    /**
     * Creates a new BabylonEngine instance
     * @param canvasElement Canvas element to render on
     */
    constructor(canvasElement: HTMLCanvasElement) {
        if (!canvasElement) {
            throw new Error('Canvas element is required for BabylonEngine initialization');
        }

        this.canvas = canvasElement;

        try {
            console.log('Initializing Babylon.js engine...');
            
            // Initialize ResizeObserver for more accurate size updates
            this.resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
            
            // Observe the canvas parent element for size changes
            const parent = this.canvas.parentElement;
            if (parent) {
                this.resizeObserver.observe(parent);
            }
            
            // Initial canvas size setup
            this.updateCanvasSize();
            
            // Create engine
            this.engine = new Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                adaptToDeviceRatio: true
            }, true);

            if (!this.engine) {
                throw new Error('Failed to create Babylon.js engine');
            }

            this.scene = new Scene(this.engine);
            this.setupScene();

            // Start the render loop
            this.startRenderLoop();

            // Handle window resizing
            window.addEventListener('resize', () => this.onWindowResize());

            console.log('Babylon.js engine initialized successfully');
        } catch (error) {
            console.error('Error initializing Babylon.js engine:', error);
            throw error;
        }
    }

    private updateCanvasSize(): void {
        const parent = this.canvas.parentElement;
        if (!parent) return;

        // Get the actual size of the parent container
        const rect = parent.getBoundingClientRect();
        const width = Math.floor(rect.width);
        const height = Math.floor(rect.height);
        
        // Calculate the physical pixels using device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        const physicalWidth = Math.floor(width * dpr);
        const physicalHeight = Math.floor(height * dpr);

        // Only update if dimensions actually changed
        if (this.canvas.width !== physicalWidth || this.canvas.height !== physicalHeight) {
            // Set the canvas buffer size (actual resolution)
            this.canvas.width = physicalWidth;
            this.canvas.height = physicalHeight;

            // Set the canvas display size
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;

            console.log(`Canvas resized to ${physicalWidth}x${physicalHeight} (Display: ${width}x${height}, DPR: ${dpr})`);

            // Trigger engine resize if it exists
            if (this.engine) {
                this.engine.resize();
            }
        }
    }

    private onWindowResize(): void {
        // Update canvas size and trigger engine resize
        this.updateCanvasSize();
    }

    private setupScene() {
        // Set scene clear color
        this.scene.clearColor = new Color4(0.8, 0.8, 0.8, 1);

        // Create camera with better default position
        this.camera = new ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 3,
            30,  // Increased initial distance
            Vector3.Zero(),
            this.scene
        );

        // Setup camera controls with extended limits
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 200;  // Increased max zoom out
        this.camera.wheelPrecision = 50;  // Better mouse wheel sensitivity

        // Add lights
        const light = new HemisphericLight(
            "light",
            new Vector3(0, 1, 0),
            this.scene
        );
        light.intensity = 0.7;

        this.createGround();
    }

    private createGround() {
        const ground = MeshBuilder.CreateGround(
            "ground",
            { width: 100, height: 100 },
            this.scene
        );

        const gridMaterial = new StandardMaterial("gridMaterial", this.scene);
        gridMaterial.wireframe = true;
        ground.material = gridMaterial;
    }

    /**
     * Gets the current Babylon Scene
     * @returns The current Babylon.js Scene object
     */
    public getScene(): Scene {
        return this.scene;
    }

    /**
     * Gets the current Babylon Engine
     * @returns The current Babylon.js Engine object
     */
    public getEngine(): Engine {
        return this.engine;
    }

    /**
     * Gets the main camera
     * @returns The main ArcRotateCamera
     */
    public getCamera(): ArcRotateCamera {
        return this.camera;
    }

    public startRenderLoop() {
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    public resize() {
        this.engine.resize();
    }

    /**
     * Disposes of all resources
     */
    public dispose() {
        // Clean up the ResizeObserver
        this.resizeObserver.disconnect();
        
        this.scene.dispose();
        this.engine.dispose();
    }
}