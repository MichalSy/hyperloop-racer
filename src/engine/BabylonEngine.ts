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
            // Set up the engine with basic configuration
            this.engine = new Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true
            }, true);

            if (!this.engine) {
                throw new Error('Failed to create Babylon.js engine');
            }

            this.scene = new Scene(this.engine);

            this.setupScene();

            // Start the render loop
            this.startRenderLoop();

            // Handle window resizing
            window.addEventListener('resize', () => {
                this.resize();
            });

            console.log('Babylon.js engine initialized successfully');
        } catch (error) {
            console.error('Error initializing Babylon.js engine:', error);
            throw error;
        }
    }

    private setupScene() {
        // Set scene clear color
        this.scene.clearColor = new Color4(0.8, 0.8, 0.8, 1);

        // Create camera
        this.camera = new ArcRotateCamera(
            "camera",
            Math.PI / 2,
            Math.PI / 3,
            10,
            Vector3.Zero(),
            this.scene
        );

        // Setup camera controls
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 5;
        this.camera.upperRadiusLimit = 50;

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
        this.scene.dispose();
        this.engine.dispose();
    }
}