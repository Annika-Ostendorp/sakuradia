import { Animal } from "/src/data/Animal.js";
import { Landscape } from "/src/data/Landscape.js";
import DebugConfig from "/src/debug/DebugConfig.js";

/**
 * Repräsentiert eine platzierbare Kachel im Spiel.
 */
export default class Tile {
  constructor(tileData, rotation = 0) {
    this.tileData = tileData;
    this.occupiedBy = Animal.NONE;
    this.rotation = rotation;
  }

  set rotation(value) {
    this._rotation = normalizeRotation(value);
  }

  get rotation() {
    return this._rotation ?? 0;
  }

  setRotation(rotation) {
    this.rotation = rotation;
  }

  updateRotation(newRotation) {
    this.rotation = newRotation;

    if (DebugConfig.enabled && DebugConfig.doLogTileRotations) {
      console.log(`Tile rotation updated: ${this.rotation}`, {
        primaryDirections: this.getLandscapeDirections(
          this.tileData.primaryLandscape,
        ),
        secondaryDirections: this.tileData.isKeystone
          ? []
          : this.getLandscapeDirections(this.tileData.secondaryLandscape),
      });
    }
  }

  rotateClockwise() {
    this.rotation = this.rotation + 1;
  }

  rotateCounterClockwise() {
    this.rotation = this.rotation - 1;
  }

  get isKeystone() {
    if (!this.tileData) {
      console.error("Tile Data is undefined. Cannot determine keystone state.");
      return false;
    }

    return this.tileData.isKeystone;
  }

  animalIsAllowed(animal) {
    if (!this.tileData) {
      console.error("Tile Data is undefined. Cannot check animal.");
      return false;
    }

    return this.tileData.animalIsAllowed(animal);
  }

  hasLandscape(landscape) {
    if (!this.tileData) {
      console.error("Tile Data is undefined. Cannot check landscapes.");
      return false;
    }

    return this.tileData.hasLandscape(landscape);
  }

  /**
   * Gibt zurück, an welchen Seiten diese Landschaft nach aktueller Rotation liegt.
   *
   * Side order assumption:
   * 0 = right
   * 1 = top-right
   * 2 = top-left
   * 3 = left
   * 4 = bottom-left
   * 5 = bottom-right
   */
  getLandscapeDirections(landscape) {
    if (!this.tileData) {
      console.error("Tile Data is undefined. Cannot get landscape directions.");
      return [];
    }

    if (!this.tileData.hasLandscape(landscape)) {
      return [];
    }

    if (this.tileData.isKeystone) {
      if (this.tileData.primaryLandscape === landscape) {
        return [0, 1, 2, 3, 4, 5];
      }

      return [];
    }

    const primaryDirections = [2, 3, 4];
    const secondaryDirections = [5, 0, 1];

    if (this.tileData.primaryLandscape === landscape) {
      return rotateDirections(primaryDirections, this.rotation);
    }

    if (this.tileData.secondaryLandscape === landscape) {
      return rotateDirections(secondaryDirections, this.rotation);
    }

    return [];
  }
}

export class TileData {
  constructor(
    primaryLandscape,
    secondaryLandscape = Landscape.UNDEFINED,
    animals = [],
    count = 1,
  ) {
    this.primaryLandscape = primaryLandscape;
    this.secondaryLandscape = secondaryLandscape;
    this.animals = animals;
    this.count = count;
  }

  get isKeystone() {
    return this.secondaryLandscape === Landscape.UNDEFINED;
  }

  animalIsAllowed(animal) {
    return this.animals.includes(animal);
  }

  hasLandscape(landscape) {
    return (
      this.primaryLandscape === landscape ||
      this.secondaryLandscape === landscape
    );
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
    return new Tile(this.tiles[0]);
  }

  get leftTile() {
    return new Tile(this.tiles[1]);
  }

  get rightTile() {
    return new Tile(this.tiles[2]);
  }
}

function rotateDirections(directions, rotation) {
  return directions.map((direction) => normalizeRotation(direction - rotation));
}

function normalizeRotation(value) {
  return ((value % 6) + 6) % 6;
}
