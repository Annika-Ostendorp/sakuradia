// GameScene.js
import * as THREE from "three";
import BaseScene from "./BaseScene.js";
import GameplayManager from "../managers/GameplayManager.js";
import {
    createGameCamera,
    createGameOrbitControls
} from "../rendering/camera/camera.js";

export default class GameScene extends BaseScene {
    async enter() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = createGameCamera();
        this.controls = createGameOrbitControls(
            this.camera,
            this.game.renderer.getDOMElement()
        );

        // 🔊 Audio Listener an Kamera hängen
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

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

        this.gameplayManager = new GameplayManager(this.scene);

        // Spawn tiles with await
        await Promise.all([
            this.gameplayManager.spawnTile({ q: 0, r: 0 }, { primaryLandscape: "mountain" }),
            this.gameplayManager.spawnTile({ q: 1, r: 0 }, { primaryLandscape: "river" }),
            this.gameplayManager.spawnTile({ q: 1, r: 1 }, { primaryLandscape: "wetland" }),
            this.gameplayManager.spawnTile({ q: -1, r: 1 }, { primaryLandscape: "bambooforest" }),
            this.gameplayManager.spawnTile({ q: 0, r: -1 }, { primaryLandscape: "grassland" })
        ]);
    }

    exit() {
        this.controls?.dispose();
    }

    update(delta) {
        this.controls?.update();
    }
}