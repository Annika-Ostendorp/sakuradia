import * as THREE from 'three';
import '../styles/global.css';
import { createGameCamera, createGameOrbitControls } from '../rendering/OrbitalCamera.js';
import GameplayManager from '../gameplay/GameplayManager.js';
import InputManager from '../input/InputManager.js';

export default class GameScene {
    constructor() {
        this.initialization();

        this.animate = this.animate.bind(this);
        this.animate();

        this.gameplayManager = new GameplayManager(this.scene);
        this.inputManager = new InputManager(this.scene, this.canvas, this.gameplayManager);
    }

    initialization() {
        this.canvas = document.querySelector('#game-canvas');

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x20242a);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });

        this.camera = createGameCamera();
        this.controls = createGameOrbitControls(this.camera, this.renderer.domElement);

        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(0, 0, 0);

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // const axesHelper = new THREE.AxesHelper(5);
        // this.scene.add(axesHelper);

        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Lichter hinzufügen
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

    animate() {
        requestAnimationFrame(this.animate);

        this.renderer.render(this.scene, this.camera);
    }
}
