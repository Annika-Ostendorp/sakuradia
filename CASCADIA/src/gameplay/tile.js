export default class Tile {
    constructor(landscape1, landscape2 = Landscape.UNDEFINED, rotation = 0) {
        this.hexCoord = null; // HexKoordinaten des Tiles
        this.primaryLandscape = landscape1; // Landschaftstyp
        this.secondaryLandscape = landscape2; // Sekundärer Landschaftstyp
        this.occupied = false; // Ob ein Tier auf diesem Tile steht
        this.rotation = rotation; // Rotation des Tiles (0-5)
    }
}

export const Landscape = Object.freeze({
    UNDEFINED: "undefined",
    MOUNTAIN: "mountain",
    RIVER: "river",
    WETLAND: "wetland",
    BAMBOOFOREST: "bambooforest",
    GRASSLAND: "grassland"
});