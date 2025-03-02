import { 
    Engine, 
    Scene, 
    Vector3, 
    HemisphericLight, 
    ArcRotateCamera,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Color4
  } from 'babylonjs';
  
  /**
   * BabylonEngine handles all core rendering and scene management functionality
   */
  export class BabylonEngine {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private camera: ArcRotateCamera;
  
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
        
        // Configure scene defaults
        this.scene.clearColor = new Color4(0.8, 0.8, 0.8, 1);
        
        // Set up default camera
        this.camera = new ArcRotateCamera(
          "camera",
          Math.PI / 3,
          Math.PI / 3,
          50,
          Vector3.Zero(),
          this.scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.lowerRadiusLimit = 10;
        this.camera.upperRadiusLimit = 200;
        
        // Add default lighting
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
        
        // Create a basic grid to help with orientation
        this.createGrid(100, 10);
        
        // Start the render loop
        this.engine.runRenderLoop(() => {
          this.scene.render();
        });
        
        // Handle window resizing
        window.addEventListener('resize', () => {
          this.engine.resize();
        });
        
        console.log('Babylon.js engine initialized successfully');
      } catch (error) {
        console.error('Error initializing Babylon.js engine:', error);
        throw error;
      }
    }
    
    /**
     * Creates a grid on the XZ plane to help with orientation
     * @param size Total size of the grid
     * @param divisions Number of grid cells in each direction
     */
    private createGrid(size: number, divisions: number) {
      const gridMaterial = new StandardMaterial("gridMaterial", this.scene);
      gridMaterial.wireframe = true;
      gridMaterial.alpha = 0.2;
      
      const ground = MeshBuilder.CreateGround("ground", {
        width: size,
        height: size,
        subdivisions: divisions
      }, this.scene);
      
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
    
    /**
     * Disposes of all resources
     */
    public dispose() {
      this.scene.dispose();
      this.engine.dispose();
    }
  }