import * as THREE from "three";
import BaseScene from "./BaseScene.js";
import GameScene from "./GameScene.js";
import { AudioType } from "../managers/AudioManager.js";

export default class MenuScene extends BaseScene {
    enter() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight
        );

        this.camera.position.z = 5;

        // Lichter hinzufügen
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Ambient Noise hinzufügen
        this.camera.add(this.game.listener);

        this.sound = new THREE.Audio(this.game.listener);

        const loader = new THREE.AudioLoader();
        loader.load("assets/audio/ambient/menu-ambient.wav", (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setLoop(true);

            this.game.audioManager.add("menu", this.sound, AudioType.AMBIENCE);
        });

        // Start Button erstellen
        this.button = createButton("Start Game");

        this.button.addEventListener("click", () => {
            this.game.sceneManager.change(new GameScene(this.game));
        });
    }

    // Cleanup!
    exit() {
        this.button.remove();
        if (this.sound?.isPlaying) {
            this.sound.stop();
        }
    }
}

function createButton(text) {
    const button = document.createElement("button");
    button.innerText = text;
    button.style.position = "absolute";
    button.style.top = "50%";
    button.style.left = "50%";
    button.style.transform = "translate(-50%, -50%)";
    document.body.appendChild(button);
    return button;
}