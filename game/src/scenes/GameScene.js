import * as THREE from 'three';
import '../styles/global.css';
import {
	createGameCamera,
	createGameOrbitControls,
	updateOrbitControlsWithRightStick,
    moveOrbitCameraHorizontal
} from '../rendering/OrbitalCamera.js';
import GameplayManager from '../gameplay/GameplayManager.js';
import InputManager from '../input/InputManager.js';
import DebugConfig from "../debug/DebugConfig.js";

/**
 * Baut die 3D-Szene auf und startet die Render-Schleife. Initialisiert Kamera,
 * Renderer, Lichtquellen und delegiert die Spiel- sowie Input-Initialisierung an
 * `GameplayManager` bzw. `InputManager`.
 *
 * Wichtiger Ablaufpunkt: Die `animate()`-Schleife wird bereits vor der
 * Initialisierung der Spiel-Logik gestartet. Das ist unkritisch, da die Szene
 * zunächst leer ist und das Rendering weiterhin korrekt arbeitet.
 */
export default class GameScene {
    constructor(gameConfig) {
        this.gameConfig = gameConfig;
        this.initialization();
        this.timer = new THREE.Timer();

        this.gameplayManager = new GameplayManager(this.scene, this.gameConfig);
        this.inputManager = new InputManager(
            this.scene,
            this.canvas,
            this.gameplayManager,
            this.camera
        );

        this.animate = this.animate.bind(this);
        this.animate();
    }

    initialization() {
        this.canvas = document.querySelector('#game-canvas');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x20242a);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });

        this.setupCamera();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Lichter hinzufügen: Ambient + Directional für Schatten
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        this.scene.add(directionalLight);

        // Add axis helper
        if (DebugConfig.enabled && DebugConfig.showAxes) {
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupCamera(){
        this.camera = createGameCamera();
        this.controls = createGameOrbitControls(this.camera, this.renderer.domElement);

        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(0, 0, 0);
    }

    // Resets position and rotation of the camera to default values
    resetCamera(){
        this.scene.remove(this.camera);
        this.setupCamera();
    }

    // Render-Loop
    animate() {
        requestAnimationFrame(this.animate);

        this.timer.update();
        const deltaTime = this.timer.getDelta(); // Die Zeit seit dem letzten Frame
        const elapsed = this.timer.getElapsed(); // Die Zeit seit Start des Timers

	    updateOrbitControlsWithRightStick(
            this.controls,
            deltaTime,
            this.inputManager.getInvertPan(),
            this.inputManager.getInvertTilt()
        );

        moveOrbitCameraHorizontal(
            this.camera,
            this.controls,
            this.inputManager.getShoulderInput()
        );

        if (this.inputManager.doResetCamera()) {
            this.resetCamera();
        }

        this.controls.update();

        this.inputManager.update(deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
