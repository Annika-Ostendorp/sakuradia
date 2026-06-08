import { Landscape } from "../data/Landscape.js";

/**
 * Repräsentiert eine platzierbare Kachel im Spiel. Enthält:
 * - `tileData`: die statische Definition (`TileData`) der Landschaften/Tiere
 * - `rotation`: Index 0-5 für 60°-Schritte (darauf basieren Render-Rotationen)
 * - `hexCoord`: optional die Logik-Koordinate, auf der das Tile sitzt
 * - `occupied`: Hilfsflag, derzeit nicht breit genutzt aber vorhanden
 */
export default class Tile {
    constructor(tileData, rotation = 0, hexCoord = null) {
        this.hexCoord = hexCoord;
        this.tileData = tileData;
        this.occupiedBy = Animal.NONE;
        this.rotation = rotation;
    }

    // Setzt die Rotation (schützt mit Modulo 6)
    setRotation(rotation) {
        this.rotation = rotation % 6;
    }

    // bool: ist dieses Tile ein Keystone (nur eine Landschaftsseite)?
    get isKeystone(){
        if (!this.tileData) {
            console.error("Tile Data is undefined. Cannot determine if it's a keystone.");
            return false;
        }
        return this.tileData.isKeystone;
    }

    // Interne Rotation-Property: sorgt dafür, dass Rotation immer 0..5 ist.
    set rotation(value) {
        this._rotation = value % 6;
    }

    get rotation() {
        return this._rotation || 0;
    }

    rotateClockwise() {
        this.rotation = (this.rotation + 1) % 6; // +60°
    }

    rotateCounterClockwise() {
        this.rotation = (this.rotation + 5) % 6; // -60° (oder +300°)
    }
}

/**
 * TileData
 *
 * Statische Definition einer Kachel-Hälfte bzw. einer Keystone-Teilung.
 * - `primaryLandscape`: zwingend gesetzt
 * - `secondaryLandscape`: optional; bei `Landscape.UNDEFINED` ist es ein Keystone
 * - `animals`: Liste möglicher Tiere auf dieser Kachelhälfte
 * - `count`: wie oft dieses Tile in der Library vorhanden ist
 */
export class TileData {
    constructor(primaryLandscape, secondaryLandscape = Landscape.UNDEFINED, animals = [], count = 1) {
        this.primaryLandscape = primaryLandscape;
        this.secondaryLandscape = secondaryLandscape;
        this.animals = animals;
        this.count = count;
    }

    get isKeystone(){
        return this.secondaryLandscape === Landscape.UNDEFINED;
    }
}

/**
 * StarterTileData
 *
 * Hilfsklasse, die ein Starter-Set aus genau 3 `TileData`-Objekten validiert.
 * Reihenfolge: [keystone, leftTile, rightTile].
 */
export class StarterTileData {
    constructor(tileDataArray) {
        if (!Array.isArray(tileDataArray)) {
            throw new TypeError("StarterTile expects an array.");
        }

        if (tileDataArray.length !== 3) {
            throw new Error("StarterTile must contain exactly 3 TileData objects.");
        }

        for (const tileData of tileDataArray) {
            if (!(tileData instanceof TileData)) {
                throw new TypeError("Every starter tile part must be a TileData.");
            }
        }

        this.tiles = tileDataArray;
    }

    get keystone() {
        return this.tiles[0];
    }

    get leftTile() {
        return this.tiles[1];
    }

    get rightTile() {
        return this.tiles[2];
    }
}