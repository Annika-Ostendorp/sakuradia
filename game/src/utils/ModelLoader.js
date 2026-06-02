import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Landscape } from "../data/Landscape.js";
import ColorUtils from "./ColorUtils.js";

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
        this.colorUtils = new ColorUtils();
    }
    
    /**
     * Lädt ein 3D-Modell und speichert es im Cache. Gibt ein Promise zurück, das das geladene Modell enthält.
     * @param {Tile} tile - Die Kachel, für die das Modell geladen werden soll.
     * @returns {Promise<{scene: THREE.Group}>} - Ein Promise, das das geladene Modell enthält.
     */
    loadModel(tile) {
        const modelName = this.getModelNameForTile(tile);
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

    getModelForTile(tile) {
        // Vollmodell für Einzellandschaft laden.
        if (tile.isKeystone) {
            return this.getModelForKeystone(tile.primaryLandscape);
        }

        // Kombination aus Primär- und Sekundärlandschaft behandeln.
        return this.getModelForLandscapeCombination(tile.primaryLandscape, tile.secondaryLandscape);
    }

    getModelForKeystone(landscape) {
        return this.loadModel("Hexagon_Full.glb").then(({scene}) => {
            this.applyColorToModel(scene, this.getColorForLandscape(landscape));
            return scene;
        });
    }

    getModelForLandscapeCombination(primaryLandscape, secondaryLandscape) {
        return Promise.all([
            this.loadModel("Hexagon_Half.glb"),
            this.loadModel("Hexagon_Half.glb")
        ]).then(([primaryRes, secondaryRes]) => {
            const primaryHalf = primaryRes.scene;
            const secondaryHalf = secondaryRes.scene;

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
        });
    }

    /**
     * Geht durch die Model-Hierarchie und setzt die Materialfarbe aller Meshes.
     * Klont Materialien zuerst, um Seiteneffekte auf gecachte Instanzen zu vermeiden.
     */

    applyColorToModel(model, color) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = Array.isArray(child.material)
                    ? child.material.map((material) => material.clone())
                    : child.material.clone();
                child.material.color.set(color);
            }
        });
    }

    /**
     * Delegiert die Farbsuche an `ColorUtils` und gibt ein Hex-Farbstring oder
     * ein `THREE.Color` zurück. Erwartet einen Wert aus `Landscape`.
     */
    getColorForLandscape(landscape) {
        return this.colorUtils.getColorForLandscape(landscape);
    }

    /**
     * Liefert den Dateinamen des Modells für eine gegebene Kachel zurück.
     * Vollmodell für Keystones, Halbmodell für normale Kacheln.
     */
    getModelNameForTile(tile) {
        return tile.isKeystone ? "Hexagon_Full.glb" : "Hexagon_Half.glb";
    }
}
