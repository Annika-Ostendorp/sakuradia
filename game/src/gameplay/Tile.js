import { Landscape } from "../data/Landscape.js";

export default class Tile {
    constructor(tileData, rotation = 0, hexCoord = null) {
        this.hexCoord = hexCoord;
        this.tileData = tileData;
        this.occupied = false;
        this.rotation = rotation;
    }

    setRotation(rotation) {
        this.rotation = rotation % 6; // Ensure rotation stays within 0-5
    }

    get isKeystone(){
        if (!this.tileData) {
            console.error("Tile Data is undefined. Cannot determine if it's a keystone.");
            return false; // No tile data means it's not a keystone
        }
        return this.tileData.isKeystone;
    }

    set rotation(value) {
        this._rotation = value % 6; // Ensure rotation stays within 0-5
    }

    get rotation() {
        return this._rotation || 0; // Default to 0 if not set
    }

    rotateClockwise() {
        this.rotation = (this.rotation + 1) % 6; // Rotate clockwise by adding 1 mod 6
    }

    rotateCounterClockwise() {
        this.rotation = (this.rotation + 5) % 6; // Equivalent to -1 mod 6
    }
}

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