import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";
import { Animal } from "/src/data/Animal.js";
import AnimalSpawner from "/src/rendering/AnimalSpawner.js";
import IconSpawner from "/src/rendering/IconSpawner.js";

export default class AnimalManager {
  /**  Map von HexCoord auf Animal[].
   * @type {Map<HexCoord, THREE.Sprite[]>} */
  #previewIcons = new Map();

  /**  Map von HexCoord auf THREE.Object3D.
   * @type {Map<HexCoord, THREE.Object3D>} */
  #placedAnimals = new Map();

  #animalDict = {};

  constructor(scene, gridManager, debugTextInWorld) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.animalSpawner = new AnimalSpawner(scene, this.gridManager);
    this.iconSpawner = new IconSpawner(scene, this.gridManager);
    this.debugTextInWorld = debugTextInWorld;
    this.updateAnimalsOnGrid();
  }

  isPlacedOnHexCoord(hexCoord) {
    for (const [placedHexCoord, animal] of this.#placedAnimals.entries()) {
      if (placedHexCoord.equals(hexCoord)) {
        return true;
      }
    }
    return false;
  }

  async updateAnimalsOnGrid() {
    for (const [hexCoord, tile] of this.gridManager.grid) {
      // Regardless of state, if it's occupied, we need to ensure the animal is present in the scene
      const shouldBeOccupied =
        tile.occupiedBy !== Animal.NONE && tile.occupiedBy !== undefined;

      if (shouldBeOccupied) {
        if (!this.isPlacedOnHexCoord(hexCoord)) {
          this.iconSpawner.clearIcons(hexCoord);
          await this.spawnPlacedAnimalAtCoord(hexCoord, tile.occupiedBy);
          this.spawnFlatAnimalIconAtCoord(tile.occupiedBy, hexCoord);
        }
        continue;
      }

      await this.spawnAnimalIconsAtCoord(hexCoord, tile.tileData.animals);
    }
  }

  async spawnPlacedAnimalAtCoord(hexCoord, animal) {
    if (this.isPlacedOnHexCoord(hexCoord)) {
      console.warn(
        `Animal already placed at ${hexCoord.toString()}. Skipping spawn.`,
      );
      return;
    }

    const spawnedModel = await this.animalSpawner.spawnAnimalAtCoord(
      hexCoord,
      animal,
    );
    this.#placedAnimals.set(hexCoord, spawnedModel);
  }

  async spawnFlatAnimalIconAtCoord(animal, hexCoord){
    await this.iconSpawner.spawnFlatIconForAnimal(animal, hexCoord);
  }

  async spawnAnimalIconsAtCoord(hexCoord, animals) {
    if (this.#previewIcons.has(hexCoord)) {
      console.warn(
        `Animal icons already spawned at ${hexCoord.toString()}. Skipping spawn.`,
      );
      return;
    }

    const icons = await this.iconSpawner.spawnIconForAnimals(animals, hexCoord, 0.5);
    this.#previewIcons.set(hexCoord, icons);
  }

  async removeAnimalIconsFromScene(hexCoord) {
    const previewModels = this.#previewIcons.get(hexCoord);
    icons = this.#previewIcons.get(hexCoord);
    for (const icon of icons) {
      this.scene.remove(icon);
    }
    this.#previewIcons.delete(hexCoord);
  }

  /**
   * Setzt ein Tier auf das Tile an der angegebenen Hex-Koordinate, wenn die Platzierungsanforderungen erfüllt sind.
   * @param {THREE.Vector3} hexCoord Die Koordinaten des Hex-Tiles
   * @param {Animal} animal Das Tier, das gesetzt werden soll
   * @param {boolean} overrideAnimalRequirements Gibt an, ob die Anforderungen für das Tier überschrieben werden sollen
   * @returns {boolean} true, wenn das Tier erfolgreich gesetzt wurde, sonst false
   */
  setAnimal(hexCoord, animal, overrideAnimalRequirements = false) {
    const tile = this.gridManager.getTileAt(hexCoord);
    if (!tile) return;

    // Override für Score Testing (Jedes Tier kann auf jedes Tile gesetzt werden)
    if (overrideAnimalRequirements) {
      tile.occupiedBy = animal;
      if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
        this.debugTextInWorld.showAnimalDebugLabels(
          this.scene,
          this.gridManager,
        );
      }
      return true;
    }

    if (tile.animalIsAllowed(animal)) {
      tile.occupiedBy = animal;
      if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
        this.debugTextInWorld.showAnimalDebugLabels(
          this.scene,
          this.gridManager,
        );
      }
      return true;
    }

    if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
      this.debugTextInWorld.showAnimalDebugLabels(this.scene, this.gridManager);
    }
    return false;
  }

  /**
   * Gibt eine Liste aller unbesetzten Tiles zurück, auf denen das angegebene Tier platziert werden darf.
   * @param {Animal} animal Das Tier, für das die erlaubten Tiles gefunden werden sollen
   * @returns {HexCoord[]} Eine Liste von Hex-Koordinaten der unbesetzten Tiles, die das Tier erlauben
   */
  getUnoccupiedTilesThatAllowAnimal(animal) {
    const allowedPositions = [];

    for (const [hexCoord, tile] of this.gridManager.grid.entries()) {
      if (
        tile.animalIsAllowed(animal) &&
        (tile.occupiedBy === Animal.NONE || tile.occupiedBy === undefined)
      ) {
        allowedPositions.push(hexCoord);
      }

      if (DebugConfig.enabled && DebugConfig.doShowTileChecks) {
        console.log(
          `Checking tile at ${hexCoord.toString()}: occupiedBy=${tile.occupiedBy}, allowsAnimal=${tile.animalIsAllowed(animal)}. Adding it to allowedPositions: ${tile.animalIsAllowed(animal) && (tile.occupiedBy === Animal.NONE || tile.occupiedBy === undefined)}`,
        );
      }
    }
    return allowedPositions;
  }

  hoverAnimal(hexCoord, animal) {
    if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
      this.debugTextInWorld.showAnimalDebugLabels(
        this.scene,
        this.gridManager,
        hexCoord,
        animal,
      );
    }
  }

  async showNoValidAnimalPlacementPossible(hexCoord) {
    await this.debugTextInWorld.showNoValidAnimalPlacementPossible(
      this.scene,
      this.gridManager,
      hexCoord,
    );
  }
  hideNoValidAnimalPlacementPossible() {
    this.debugTextInWorld.hideNoValidAnimalPlacementPossible(this.scene);
  }
}
