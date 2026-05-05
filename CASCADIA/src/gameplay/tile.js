import { Landscape } from "enums/Landscape.js";

export default class Tile {
    constructor(landscape1, landscape2 = Landscape.UNDEFINED, rotation = 0) {
        this.hexCoord = null;
        this.primaryLandscape = landscape1;
        this.secondaryLandscape = landscape2;
        this.occupied = false;
        this.rotation = rotation;
    }

    setRotation(rotation) {
        this.rotation = rotation % 6; // Ensure rotation stays within 0-5
    }
}

export class TileData {
    constructor(primaryLandscape, secondaryLandscape = Landscape.UNDEFINED, animals = [], count = 1) {
        this.primaryLandscape = primaryLandscape;
        this.secondaryLandscape = secondaryLandscape;
        this.animals = animals;
        this.count = count;
    }
}

export class StarterTile {
    constructor(tile1, tile2, tile3) {
        this.keystone = tile1;
        this.leftTile = tile2;
        this.rightTile = tile3;
    }
}