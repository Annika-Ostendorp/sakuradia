import * as THREE from 'three';
import '../styles/global.css';
import { createGameCamera, createGameOrbitControls } from '../rendering/OrbitalCamera.js';
import GameplayManager from '../gameplay/GameplayManager.js';
import InputManager from '../input/InputManager.js';
import { createRulesPopup } from '../ui/components/createRulesPopup.js';

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

        this.rulesPopup = createRulesPopup();
        this.appShell.append(this.rulesPopup.element);

        this.animate = this.animate.bind(this);
        this.animate();

        // Gameplay- und Input-Manager erst nach Start der Render-Schleife.
        this.gameplayManager = new GameplayManager(this.scene, this.gameConfig);
        this.inputManager = new InputManager(this.scene, this.canvas, this.gameplayManager);
    }

    initialization() {
        this.appShell = document.querySelector('#app-shell');
        this.canvas = document.querySelector('#game-canvas');

        if (!this.appShell || !this.canvas) {
            throw new Error('App shell is missing required DOM nodes.');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x20242a);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });

        this.camera = createGameCamera();
        this.controls = createGameOrbitControls(this.camera, this.renderer.domElement);

        // Kamera-Startposition: Blick von oben auf das Zentrum
        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(0, 0, 0);

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
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Render-Loop: kept minimal — weitere Animationen/Updates können hier ergänzt werden.
    animate() {
        requestAnimationFrame(this.animate);

        this.renderer.render(this.scene, this.camera);
    }
}
