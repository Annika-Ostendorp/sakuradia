import HexCoord from "../utils/HexCoord.js";
import { TileData } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";

/**
 * Speichert und verwaltet Grid-Daten für das Gameplay.
 *
 * Hinweis: Map-Keys werden per Referenz verglichen. Ein neu erzeugtes HexCoord
 * mit denselben Koordinaten ist nicht derselbe Key, sofern es nicht exakt
 * dasselbe Objekt ist.
 */
export default class GridManager {
    /**
     * Initialisiert Grid-Einstellungen und Datencontainer.
     */
    constructor(scene) {
        this.scene = scene;
        /** Grösse des logischen Spielfelds in Zellen pro Achse. */
        this.gridSize = 20;
        /** Grösse einer Zelle im Weltkoordinatensystem. */
        this.cellSize = 1;

        /** Ordnet einem HexCoord-Key die zugehörige Tile-Instanz zu. */
        /** @type {Map<HexCoord, Tile>} */
        this.grid = new Map();
        this.modelLoader = new ModelLoader();
        this.colorUtils = new ColorUtils();
    }

    /**
        * Gibt das Tile zur angegebenen Hex-Koordinate zurück.
     * @param {HexCoord} hexCoord
     * @returns {Tile | undefined}
     */
    getTile(hexCoord) {
        return this.grid.get(hexCoord);
    }

    /**
     * Gibt das Tile zur angegebenen Hex-Koordinate zurück, unabhängig von der Objekt-Referenz.
     * @param {HexCoord} hexCoord
     * @returns {Tile | undefined}
     */
    getTileAt(hexCoord) {
        for (const [placedHexCoord, tile] of this.grid.entries()) {
            if (placedHexCoord.equals(hexCoord)) {
                return tile;
            }
        }

        return undefined;
    }

    /**
     * Prüft, ob an der angegebenen Hex-Koordinate bereits ein Tile liegt.
     * @param {HexCoord} hexCoord
     * @returns {boolean}
     */
    isOccupied(hexCoord) {
        return this.getTileAt(hexCoord) !== undefined;
    }

    /**
     * Verknüpft ein Tile mit einer Hex-Koordinate.
     * @param {HexCoord} hexCoord
     * @param {Tile} tile
     * @param {number} rotation - Optionaler Rotationswert für das Tile (0-5).
     */
    setTile(hexCoord, tile, rotation = 0) {
        tile.rotation = rotation;
        this.grid.set(hexCoord, tile);
        this.spawnTile(hexCoord, tile);
    }

    spawnTile(hexCoord, tile) {
        if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
            throw new Error("spawnTile expects a HexCoord instance");
        }

        var hexObj = hexCoord;
        tile.rotation = tile.rotation || 0;
        this.grid.set(hexObj, tile);

        var worldPos = hexObj.hexToWorld(hexCoord);

        if (tile.isKeystone) {
            return this.modelLoader.loadModel(tile)
                .then(({ scene }) => {
                    var model = scene.clone(true);
                    this.applyColorToModel(model, this.colorUtils.getColorForLandscape(tile.primaryLandscape));
                    model.position.set(worldPos.x, worldPos.y, worldPos.z);
                    model.rotation.y = tile.rotation * (Math.PI / 3);

                    if (this.scene) {
                        this.scene.add(model);
                    }

                    return model;
                })
                .catch((error) => {
                    console.error("Fehler beim Laden von Tile-Modell:", error);
                });
        }

        return Promise.all([
            this.modelLoader.loadModel({ isKeystone: false }),
            this.modelLoader.loadModel({ isKeystone: false })
        ])
            .then(([primaryRes, secondaryRes]) => {
                var primaryHalf = primaryRes.scene.clone(true);
                var secondaryHalf = secondaryRes.scene.clone(true);

                primaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);
                secondaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);

                this.applyColorToModel(primaryHalf, this.colorUtils.getColorForLandscape(tile.primaryLandscape));
                this.applyColorToModel(secondaryHalf, this.colorUtils.getColorForLandscape(tile.secondaryLandscape));

                primaryHalf.rotation.y = tile.rotation * (Math.PI / 3);
                secondaryHalf.rotation.y = (tile.rotation + 3) * (Math.PI / 3);

                if (this.scene) {
                    this.scene.add(primaryHalf);
                    this.scene.add(secondaryHalf);
                }

                return { primaryHalf, secondaryHalf };
            })
            .catch((error) => {
                console.error("Fehler beim Laden von Tile-Modell:", error);
            });
    }

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
     *  Gibt eine zufällige, benachbarte Hex-Koordinate zurück, die noch kein Tile enthält.
     * @returns {HexCoord | null} Eine zufällige, leere Nachbar-Hex-Koordinate oder null, wenn keine vorhanden ist.
     */
    getRandomEmptyNeighbor() {
        const keys = Array.from(this.grid.keys());
        if (keys.length === 0) {
            return null;
        }

        const emptyNeighborCandidates = [];
        const seen = new Set();

        for (const placedHexCoord of keys) {
            for (const neighbor of placedHexCoord.getNeighbors()) {
                if (this.isOccupied(neighbor)) {
                    continue;
                }

                const key = neighbor.hashCode();
                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                emptyNeighborCandidates.push(neighbor);
            }
        }

        if (emptyNeighborCandidates.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * emptyNeighborCandidates.length);
        return emptyNeighborCandidates[randomIndex];
    }

    /**
     * Gibt eine zufällige leere Hex-Koordinate innerhalb des Spielfeldbereichs zurück.
     * @returns {HexCoord | null}
     */
    getRandomEmptyHexCoord() {
        return this.getRandomEmptyNeighbor();
    }
}

