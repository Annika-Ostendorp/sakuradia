import * as THREE from "three";
import AudioManager from "src/managers/AudioManager.js";
import SceneManager from "src/managers/SceneManager.js";
import MenuScene from "src/scenes/MenuScene.js";
import GameScene from "src/scenes/GameScene.js";
import Renderer from "src/rendering/Renderer.js";

export default class App {
    
    constructor() {
        // Rendering
        this.renderer = new Renderer();

        // Audio
        this.listener = new THREE.AudioListener();
        this.audioManager = new AudioManager(this.listener);

        // Scene Management
        this.sceneManager = new SceneManager();
        this.lastTime = 0;

        this.setupRenderer();
        this.setupResize();

        this.setupAudioUnlock();
    }

    start() {
        this.sceneManager.change(new MenuScene(this));
        this.loop(0);
    }

    loop(time) {
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.sceneManager.update(delta);

        const current = this.sceneManager.current;
        this.renderer.render(current?.scene, current?.camera);

        requestAnimationFrame(this.loop.bind(this));
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupResize() {
        window.addEventListener("resize", () => {
            const camera = this.sceneManager.current?.camera;
            this.renderer.onResize(camera);
        });
    }

    setupAudioUnlock() {
        window.addEventListener("pointerdown", async () => {
            await this.audioManager.resume();
            this.audioManager.play("menu");
        }, { once: true });
    }
}