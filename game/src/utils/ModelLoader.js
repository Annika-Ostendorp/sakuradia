import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Landscape } from "/src/data/Landscape.js";
import { getColorForLandscape, applyColorToModel } from "./colorUtils.js";
import getModelPathForKeystone from "/src/utils/modelGetter.js";

/**
 * `ModelLoader`
 *
 * Verantwortlich für das Laden, Cachen und Einfärben von 3D-Modellen (GLTF).
 * - Kapselt `GLTFLoader` und stellt einen einfachen Cache bereit.
 * - Liefert fertige `THREE.Group`-Objekte für Kacheln (Voll- und Halbmodelle).
 * - Verwendet `ColorUtils` zur Bestimmung der Landschaftsfarben.
 */
export default class ModelLoader {
    /**
     * Konstruktor
     * @param {Object|null} library - Optionales Objekt mit Ressourcenpfaden (nicht zwingend benötigt).
     */
    constructor(library = null) {
        this.gltfLoader = new GLTFLoader();
        this.modelCache = new Map(); // Cache für geladene Modelle.
        this.library = library; // Wird durch den GameplayManager übergeben.
        this.getColorForLandscape = getColorForLandscape;
        this.applyColorToModel = applyColorToModel;
    }

    loadKeystoneModel(landscape) {
        const modelPath = getModelPathForKeystone(landscape);
        return this.loadFullModel(modelPath);
    }

    loadFullModel(modelPath) {
        if (this.modelCache.has(modelPath)) {
            return Promise.resolve(this.modelCache.get(modelPath));
        }
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelPath, 
                (gltf) => {
                    const result = { scene: gltf.scene };
                    this.modelCache.set(modelPath, result);
                    resolve(result);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }
    
    /**
     * Lädt ein 3D-Modell und speichert es im Cache. Gibt ein Promise zurück, das das geladene Modell enthält.
     * @param {Tile} tile - Die Kachel, für die das Modell geladen werden soll.
     * @returns {Promise<{scene: THREE.Group}>} - Ein Promise, das das geladene Modell enthält.
     */
    loadModel(tileOrModelName) {
        const modelName = typeof tileOrModelName === "string"
            ? tileOrModelName
            : this.getModelNameForTile(tileOrModelName);
        if (this.modelCache.has(modelName)) {
            return Promise.resolve(this.modelCache.get(modelName));
        }
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                `assets/models/tiles/simple/${modelName}`, 
                (gltf) => {
                    const result = { scene: gltf.scene };
                    this.modelCache.set(modelName, result);
                    resolve(result);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }

    async getModelForTile(tile) {
        // Vollmodell für Einzellandschaft laden.
        if (tile.tileData.isKeystone) {
            return await this.getModelForKeystone(tile.tileData.primaryLandscape);
        }

        // Kombination aus Primär- und Sekundärlandschaft behandeln.
        return await this.getModelForLandscapeCombination(tile.tileData.primaryLandscape, tile.tileData.secondaryLandscape);
    }

    async getModelForKeystone(landscape) {
        const { scene } = await this.loadModel("Hexagon_Full.glb");
        const model = scene.clone(true);
        this.applyColorToModel(model, this.getColorForLandscape(landscape));
        return model;
    }

    async getModelForLandscapeCombination(primaryLandscape, secondaryLandscape) {
        const { scene } = await this.loadModel("Hexagon_Half.glb");
        const primaryHalf = scene.clone(true);
        const secondaryHalf = scene.clone(true);

        // Container für beide Hälften erstellen.
        const container = new THREE.Group();

        // Für Doppellandschafts-Kacheln werden einfache Hälften geladen und eingefärbt.
        this.applyColorToModel(primaryHalf, this.getColorForLandscape(primaryLandscape));
        this.applyColorToModel(secondaryHalf, this.getColorForLandscape(secondaryLandscape));

        // Sekundäre Hälfte um 180 Grad um die Y-Achse drehen.
        secondaryHalf.rotation.y = Math.PI;

        // Beide Hälften dem Container hinzufügen.
        container.add(primaryHalf);
        container.add(secondaryHalf);

        container.castShadow = true;
        container.receiveShadow = true;

        return container;
    };

    /**
     * Liefert den Dateinamen des Modells für eine gegebene Kachel zurück.
     * Vollmodell für Keystones, Halbmodell für normale Kacheln.
     */
    getModelNameForTile(tile) {
        return tile.tileData.isKeystone ? "Hexagon_Full.glb" : "Hexagon_Half.glb";
    }
}
