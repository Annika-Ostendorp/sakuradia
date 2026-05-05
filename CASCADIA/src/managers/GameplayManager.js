import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GridManager from "src/gameplay/gridmanager";
import HexCoord from "src/utils/hexcoord";
import Library from "src/data/Library.js";
import { Box3, Vector3 } from "three";

const Landscape = Object.freeze({
    UNDEFINED: "undefined",
    MOUNTAIN: "mountain",
    RIVER: "river",
    WETLAND: "wetland",
    BAMBOOFOREST: "bambooforest",
    GRASSLAND: "grassland"
});

export default class GameplayManager {
    constructor(scene) {
        this.scene = scene;
        this.gridManager = new GridManager();
        this.gltfLoader = new GLTFLoader();
        this.modelCache = new Map(); // Cache loaded models
        this.library = new Library();
    }

    spawnTile(hexCoord, tile, rotation = 0) {
        // Accept either a HexCoord instance or a plain {column,row} object
        let hexObj;
        if (hexCoord && typeof hexCoord.hexToWorld === "function") {
            hexObj = hexCoord;
        } else {
            hexObj = new HexCoord(hexCoord.column ?? 0, hexCoord.row ?? 0);
        }
        tile.rotation = rotation; // Setze die Rotation des Tiles basierend auf dem übergebenen Wert
        this.gridManager.setTile(hexObj, tile);

        const worldPos = hexObj.hexToWorld();

        return this.getModelForTile(tile).then((model) => {
            model.position.set(worldPos.x, worldPos.y, worldPos.z);
            model.rotation.y = (rotation ?? 0) * (Math.PI / 3); // 60° steps
            if (this.scene) {
                this.scene.add(model);
            }

            // Spawn animal models for this tile (do not block tile spawn)
            //this.spawnAnimalsForTile(tile, model, hexObj).catch(err => console.error('Fehler beim Platzieren von Tieren:', err));

            return model;
        }).catch((error) => {
            console.error("Fehler beim Laden von Tile-Modell:", error);
        });
    }

    /**
     * Load (and cache) an animal model by key.
     * animalKey should be the enum value from `Animal`, e.g. "panda".
     * Returns a Promise resolving to a cloned THREE.Object3D.
     */
    loadAnimalModel(animalKey) {
        const cacheKey = `animal:${animalKey}`;
        if (this.modelCache.has(cacheKey)) {
            return Promise.resolve(this.modelCache.get(cacheKey).clone());
        }
        const tryLoad = (path) => new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    const scene = gltf.scene;
                    scene.traverse((node) => {
                        if (node.isMesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });
                    resolve(scene);
                },
                undefined,
                (err) => reject(err)
            );
        });

        // Build candidate paths: library mapping, direct animal key, and a generic fallback placeholder
        const libPath = this.library?.getModelPathForAnimal?.(animalKey);
        const directPath = `/assets/models/animals/${animalKey}.glb`;
        const fallbackPath = this.library?.getModelPathForAnimal?.(null) || `/assets/models/animals/placeholder/ph_panda.glb`;

        const candidates = [];
        if (libPath) candidates.push(libPath);
        candidates.push(directPath);
        if (!candidates.includes(fallbackPath)) candidates.push(fallbackPath);

        // Try candidates sequentially until one loads
        let lastErr = null;
        const attempt = async () => {
            for (const p of candidates) {
                try {
                    const scene = await tryLoad(p);
                    // cache the successful scene under the animal key
                    this.modelCache.set(cacheKey, scene);
                    return scene.clone();
                } catch (e) {
                    lastErr = e;
                    // continue to next candidate
                }
            }
            throw lastErr || new Error('No candidate paths for animal model');
        };

        return attempt();
    }

    /**
     * Place animal models on top of the given tile model.
     * Ensures normalized size and simple non-intersecting layout.
     * @param {object} tile Tile or TileData containing `animals` array
     * @param {THREE.Object3D} parentModel The spawned tile model (container)
     * @param {HexCoord} hexObj The hex coordinate object (for hexSize)
     */
    async spawnAnimalsForTile(tile, parentModel, hexObj) {
        if (!tile || !tile.animals || tile.animals.length === 0) return;

        const animals = tile.animals.slice(0, 6); // cap to avoid overcrowding
        const n = animals.length;

        // Determine desired max size relative to hex size
        const hexSize = hexObj?.hexSize ?? 1;
        // target maximum dimension per animal (smaller to avoid oversized animals)
        const desiredMax = hexSize * 0.3;

        // simple radius for placement in local parent coordinates
        const radius = hexSize * 0.28;

        // Estimate parent top in local coordinates
        const parentBox = new Box3().setFromObject(parentModel);
        const parentTopWorld = parentBox.max.y;
        const parentTopLocalY = parentTopWorld - parentModel.position.y;

        for (let i = 0; i < n; i++) {
            const animalKey = animals[i];
            try {
                const animalModel = await this.loadAnimalModel(animalKey);

                // compute bounding box and scale to desired size
                const aBox = new Box3().setFromObject(animalModel);
                const size = new Vector3();
                aBox.getSize(size);
                    const maxDim = Math.max(size.x, size.y, size.z) || 1;
                    let scale = desiredMax / maxDim;
                    // apply per-animal preferred multiplier from library (if present)
                    const pref = this.library?.getPreferredAnimalScale?.(animalKey) ?? 1.0;
                    const scaleBeforePref = scale;
                    scale *= pref;
                    const scaleBeforeClamp = scale;
                    // Clamp to reasonable bounds to avoid huge upscales or tiny models
                    scale = Math.min(Math.max(scale, 0.005), 1.0); // clamp between 0.005 and 1.0
                    // Debug info to diagnose scaling issues
                    console.log(`animal scale debug: key=${animalKey} maxDim=${maxDim.toFixed(3)} pref=${pref} raw=${scaleBeforePref.toFixed(3)} afterPref=${scaleBeforePref*pref ? (scaleBeforePref*pref).toFixed(3) : scaleBeforePref.toFixed(3)} clamped=${scale.toFixed(3)}`);
                    animalModel.scale.setScalar(scale);

                // recompute bbox after scaling
                const aBox2 = new Box3().setFromObject(animalModel);
                const aSize = new Vector3();
                aBox2.getSize(aSize);

                // position animals around a circle; single animal at center
                let x = 0, z = 0;
                if (n === 1) {
                    x = 0; z = 0;
                } else {
                    const angle = (i / n) * Math.PI * 2;
                    x = Math.cos(angle) * radius;
                    z = Math.sin(angle) * radius;
                }

                // place slightly above parent top
                const yLocal = parentTopLocalY + aSize.y / 2 + 0.02;
                animalModel.position.set(x, yLocal, z);

                parentModel.add(animalModel);
            } catch (err) {
                console.warn('Failed to load/place animal', animals[i], err);
            }
        }
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

    getModelForPrimaryLandscape(primaryLandscape) {
        return this.loadModel("Hexagon_Full.glb").then((model) => {
            this.applyColorToModel(model, this.getColorForLandscape(primaryLandscape));
            return model;
        });
    }

    getModelForLandscapeCombination(primaryLandscape, secondaryLandscape) {
        return Promise.all([
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

    loadModel(modelName) {
        // Check cache first
        if (this.modelCache.has(modelName)) {
            return this.modelCache.get(modelName).clone();
        }

        return new Promise((resolve, reject) => {
            const path = `/assets/models/tiles/simple/${modelName}`;
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

