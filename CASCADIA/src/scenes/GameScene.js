// GameScene.js
import * as THREE from "three";
import BaseScene from "./BaseScene.js";
import GameplayManager from "managers/GameplayManager.js";
import { Animal } from "enums/Animal.js";
import { Landscape } from "../enums/Landscape.js";
import Library from "../data/Library.js";
import { TileData, StarterTile } from "../gameplay/Tile.js";
import HexCoord from "../utils/hexcoord.js";

export default class GameScene extends BaseScene {
    enter() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight
        );

        this.camera.position.set(0, 15, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = -Math.PI / 2; // 90 Grad nach unten geneigt
        this.camera.rotation.z = Math.PI; // 180 Grad um die Hochachse gedreht, damit "oben" im Spiel auch oben auf dem Bildschirm ist

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

        // Instanziiere Bibliothek und wähle zufälliges Starter-Set aus
        const library = new Library();
        const starterTile = library.getAllStarterTiles();
        const randomStarterTile = starterTile[Math.floor(Math.random() * starterTile.length)];

        this.gameplayManager.spawnTile({ column: 0, row: 0 }, randomStarterTile.keystone);
        this.gameplayManager.spawnTile({ column: 1, row: -1 }, randomStarterTile.rightTile);
        this.gameplayManager.spawnTile({ column: 0, row: -1 }, randomStarterTile.leftTile, 2);
    }

    update(delta) {
        
    }
}