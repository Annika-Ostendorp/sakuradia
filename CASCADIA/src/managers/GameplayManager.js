import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GridManager from "src/gameplay/gridmanager";
import HexCoord from "src/utils/hexcoord";

const Landscape = Object.freeze({
    UNDEFINED: "undefined",
    MOUNTAIN: "mountain",
    RIVER: "river",
    WETLAND: "wetland",
    BAMBOOFOREST: "bambooforest",
    GRASSLAND: "grassland"
});

export default class GameplayManager {
    constructor(scene = null) {
        this.scene = scene;
        this.gridManager = new GridManager();
        this.gltfLoader = new GLTFLoader();
        this.modelCache = new Map(); // Cache loaded models
    }

    setScene(scene) {
        this.scene = scene;
    }

    async spawnTile(hexCoord, tile) {
        // Accept either a HexCoord instance or a plain {q,r} object
        let hexObj;
        if (hexCoord && typeof hexCoord.hexToWorld === "function") {
            hexObj = hexCoord;
        } else {
            hexObj = new HexCoord(hexCoord.q ?? 0, hexCoord.r ?? 0);
        }

        this.gridManager.setTile(hexObj, tile);

        const worldPos = hexObj.hexToWorld();

        return this.getModelForTile(tile).then((model) => {
            model.position.set(worldPos.x, worldPos.y, worldPos.z);
            if (this.scene) {
                this.scene.add(model);
            }
            return model;
        }).catch((error) => {
            console.error("Fehler beim Laden von Tile-Modell:", error);
        });
    }

    getModelForTile(tile) {
        const hasSecondary = tile.secondaryLandscape && tile.secondaryLandscape !== Landscape.UNDEFINED;

        // Spawn full model and set color of its material based on primary landscape
        if (!hasSecondary) {
            return this.getModelForPrimaryLandscape(tile.primaryLandscape);
        }

        // Handle combination of primary and secondary landscape
        return this.getModelForLandscapeCombination(tile.primaryLandscape, tile.secondaryLandscape);
    }

    async getModelForPrimaryLandscape(primaryLandscape) {
        return this.loadModel("Hexagon_Full.glb").then((model) => {
            this.applyColorToModel(model, this.getColorForLandscape(primaryLandscape));
            return model;
        });
    }

    async getModelForLandscapeCombination(primaryLandscape, secondaryLandscape) {
        const [primaryHalf, secondaryHalf] = await Promise.all([
            this.loadModel("Hexagon_Half.glb"),
            this.loadModel("Hexagon_Half.glb")
        ]).then(([primaryHalf, secondaryHalf]) => {
            // Create a container for both halves
            const container = new THREE.Group();

            // Apply colors to each half
            const primaryColor = this.getColorForLandscape(primaryLandscape);
            const secondaryColor = this.getColorForLandscape(secondaryLandscape);

            this.applyColorToModel(primaryHalf, primaryColor);
            this.applyColorToModel(secondaryHalf, secondaryColor);

            // Rotate secondary half 180 degrees around Y axis
            secondaryHalf.rotation.y = Math.PI;

            // Add both halves to container
            container.add(primaryHalf);
            container.add(secondaryHalf);

            container.castShadow = true;
            container.receiveShadow = true;

            return container;
        });
    }

    async loadModel(modelName) {
        // Check cache first
        if (this.modelCache.has(modelName)) {
            return this.modelCache.get(modelName).clone();
        }

        return new Promise((resolve, reject) => {
            const path = `/public/assets/models/tiles/simple/${modelName}`;
            this.gltfLoader.load(
                path,
                (gltf) => {
                    const scene = gltf.scene;
                    scene.castShadow = true;
                    scene.receiveShadow = true;
                    scene.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });
                    // Cache the original
                    this.modelCache.set(modelName, scene);
                    // Return a clone
                    resolve(scene.clone());
                },
                undefined,
                (error) => {
                    console.error(`Fehler beim Laden von ${modelName}:`, error);
                    reject(error);
                }
            );
        });
    }

    applyColorToModel(model, color) {
        if (color instanceof THREE.Color) {
            model.traverse((node) => {
                if (node.isMesh && node.material) {
                    node.material.color.copy(color);
                }
            });
        } else {
            // If it's a hex value, convert to THREE.Color first
            const colorObj = new THREE.Color(color);
            model.traverse((node) => {
                if (node.isMesh && node.material) {
                    node.material.color.copy(colorObj);
                }
            });
        }
    }

    getColorForLandscape(landscape) {
        switch (landscape) {
            case Landscape.MOUNTAIN:
                return 0x888888; // Grau
            case Landscape.RIVER:
                return 0x0000ff; // Blau
            case Landscape.WETLAND:
                return 0x00ff00; // Gruen
            case Landscape.BAMBOOFOREST:
                return 0x228b22; // Dunkelgruen
            case Landscape.GRASSLAND:
                return 0x7cfc00; // Hellgruen
            default:
                return 0xffffff; // Weiss fuer undefined oder unbekannte Landschaften
        }
    }
}
