import { TrackElementLibrary } from "../data/track-elements/TrackElementLibrary";
import { BabylonEngine } from "../engine/BabylonEngine";
import { PhysicsSystem } from "../engine/PhysicsSystem";
import { TrackEditor } from "./TrackEditor";
import { TrackElementEditor } from "./TrackElementEditor";
import { AppConfig } from '../config/AppConfig';

enum EditorMode {
    TrackElementEditor = 'TrackElementEditor',
    TrackBuilder = 'TrackBuilder'
}

export class EditorManager {
    private engine!: BabylonEngine;
    private canvasContainer!: HTMLElement;
    private canvas!: HTMLCanvasElement;
    private elementPanel!: HTMLElement;
    private propertiesPanel!: HTMLElement;
    private modeToggleButton!: HTMLElement;
    private trackElementLibrary!: TrackElementLibrary;
    private physicsSystem!: PhysicsSystem;
    private autoSaveTimer: number | null = null;
    private currentMode: EditorMode = EditorMode.TrackElementEditor;
    
    private trackEditor!: TrackEditor;
    private trackElementEditor!: TrackElementEditor;

    constructor(container: HTMLElement) {
        this.initialize(container);
    }

    private async initialize(container: HTMLElement) {
        this.setupCanvas();
        this.setupUI(container);
        
        // Initialize physics and library
        this.physicsSystem = new PhysicsSystem(this.engine.getScene());
        this.trackElementLibrary = TrackElementLibrary.getInstance(this.engine.getScene());
        
        // Initialize specialized editors
        this.trackEditor = new TrackEditor(
            this.engine,
            this.trackElementLibrary,
            this.physicsSystem,
            this.propertiesPanel
        );
        
        this.trackElementEditor = new TrackElementEditor(
            this.engine,
            this.trackElementLibrary,
            this.elementPanel,
            this.propertiesPanel
        );

        this.setupEventListeners();
        this.setupAutoSave();
        this.updateUIForMode();
    }

    private setupCanvas() {
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'canvas-container';
        
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'editor-canvas';
        this.canvasContainer.appendChild(this.canvas);
        
        this.engine = new BabylonEngine(this.canvas);
    }

    private setupUI(container: HTMLElement) {
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-container';
        
        this.modeToggleButton = document.createElement('button');
        this.modeToggleButton.className = 'mode-toggle-button';
        
        const editorMain = document.createElement('div');
        editorMain.className = 'editor-main';
        
        this.elementPanel = document.createElement('div');
        this.elementPanel.className = 'element-panel';
        
        this.propertiesPanel = document.createElement('div');
        this.propertiesPanel.className = 'properties-panel';
        
        editorMain.appendChild(this.modeToggleButton);
        editorMain.appendChild(this.elementPanel);
        editorMain.appendChild(this.canvasContainer);
        editorMain.appendChild(this.propertiesPanel);
        editorContainer.appendChild(editorMain);
        container.appendChild(editorContainer);

        this.updateModeToggleButton();
    }

    private updateModeToggleButton() {
        const nextMode = this.currentMode === EditorMode.TrackElementEditor 
            ? EditorMode.TrackBuilder 
            : EditorMode.TrackElementEditor;
        
        this.modeToggleButton.textContent = `Switch to ${nextMode === EditorMode.TrackElementEditor ? 'Element Editor' : 'Track Builder'}`;
    }

    private updateUIForMode() {
        if (this.currentMode === EditorMode.TrackElementEditor) {
            this.elementPanel.style.display = 'block';
            this.trackEditor.clearAllElements();
            this.trackElementEditor.showTrackElement(this.trackElementLibrary.getAllElements()[0].id);
        } else {
            this.elementPanel.style.display = 'none';
            this.trackEditor.clearSelection();
        }
        this.updateModeToggleButton();
    }

    private setupEventListeners() {
        window.addEventListener('resize', () => {
            if (this.engine) {
                this.engine.resize();
            }
        });

        this.modeToggleButton.addEventListener('click', () => {
            this.currentMode = this.currentMode === EditorMode.TrackElementEditor 
                ? EditorMode.TrackBuilder 
                : EditorMode.TrackElementEditor;
            this.updateUIForMode();
        });

        this.trackEditor.setOnSelectionChangeCallback((instanceId: string) => {
            if (this.currentMode === EditorMode.TrackElementEditor) {
                this.trackElementEditor.updatePropertiesPanel(instanceId);
            } else {
                this.trackEditor.updatePropertiesPanel(instanceId);
            }
        });
    }

    private setupAutoSave() {
        this.autoSaveTimer = window.setInterval(() => {
            if (this.currentMode === EditorMode.TrackBuilder) {
                this.saveTrack();
            }
        }, AppConfig.autoSaveInterval);
    }

    private saveTrack(silent: boolean = false) {
        if (this.currentMode === EditorMode.TrackBuilder) {
            const trackData = this.trackEditor.getTrack().getData();
            // Implement save logic here
            if (!silent) {
                console.log('Track saved successfully');
            }
        }
    }

    public dispose() {
        if (this.autoSaveTimer !== null) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.trackElementEditor.dispose();
        this.trackEditor.dispose();
        
        if (this.engine) {
            this.engine.dispose();
        }
    }
}

export let activeEditorManager: EditorManager | null = null;

export async function initializeEditor(container: HTMLElement): Promise<void> {
    console.log('Initializing editor mode...');
    container.innerHTML = '';
    activeEditorManager = new EditorManager(container);
    return Promise.resolve();
}