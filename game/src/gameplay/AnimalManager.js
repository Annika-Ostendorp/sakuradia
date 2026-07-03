import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";
import { Animal } from "/src/data/Animal.js";
import AnimalSpawner from "/src/rendering/AnimalSpawner.js";
import IconSpawner from "/src/rendering/IconSpawner.js";

export default class AnimalManager {
  /**  Map von HexCoord auf THREE.Object3D.
   * @type {Map<HexCoord, THREE.Object3D>} */
  #placedAnimals = new Map();

  #animalDict = {};

  #hoveredHexCoord = null;
  #hoveredAnimal = null;

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
      const shouldBeOccupied =
        tile.occupiedBy !== Animal.NONE && tile.occupiedBy !== undefined;

      if (shouldBeOccupied) {
        this.removeAnimalIconsFromScene(hexCoord);

        if (!this.isPlacedOnHexCoord(hexCoord)) {
          await this.spawnPlacedAnimalAtCoord(hexCoord, tile.occupiedBy);
          await this.spawnFlatAnimalIconAtCoord(tile.occupiedBy, hexCoord);
        }

        continue;
      }

      const highlightedAnimal =
        this.#hoveredHexCoord && this.#hoveredHexCoord.equals(hexCoord)
          ? this.#hoveredAnimal
          : null;

      await this.spawnAnimalIconsAtCoord(
        hexCoord,
        tile.tileData.animals,
        highlightedAnimal,
      );
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

  async spawnFlatAnimalIconAtCoord(animal, hexCoord) {
    await this.iconSpawner.spawnFlatIconForAnimal(animal, hexCoord);
  }

  spawnAnimalIconsAtCoord(hexCoord, animals, highlightedAnimal = null) {
    if (!Array.isArray(animals) || animals.length === 0) {
      return [];
    }

    return this.iconSpawner.spawnIconForAnimals(
      animals,
      hexCoord,
      0.5,
      highlightedAnimal,
    );
  }

  removeAnimalIconsFromScene(hexCoord) {
    this.iconSpawner.clearIcons(hexCoord);
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
    const isSameHover =
      this.#hoveredHexCoord &&
      this.#hoveredHexCoord.equals(hexCoord) &&
      this.#hoveredAnimal === animal;

    if (isSameHover) {
      return;
    }

    if (this.#hoveredHexCoord && !this.#hoveredHexCoord.equals(hexCoord)) {
      const previousTile = this.gridManager.getTileAt(this.#hoveredHexCoord);

      if (
        previousTile &&
        (previousTile.occupiedBy === Animal.NONE ||
          previousTile.occupiedBy === undefined)
      ) {
        this.spawnAnimalIconsAtCoord(
          this.#hoveredHexCoord,
          previousTile.tileData.animals,
          null,
        );
      }
    }

    this.#hoveredHexCoord = hexCoord;
    this.#hoveredAnimal = animal;

    const tile = this.gridManager.getTileAt(hexCoord);

    if (!tile) {
      console.warn("hoverAnimal: no tile found at", hexCoord);
      return;
    }

    const isOccupied =
      tile.occupiedBy !== Animal.NONE && tile.occupiedBy !== undefined;

    if (isOccupied) {
      return;
    }

    this.spawnAnimalIconsAtCoord(hexCoord, tile.tileData.animals, animal);

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

  clearPossibleAnimalMarksAtCoord(hexCoord) {
    if (!hexCoord) {
      return;
    }

    this.removeAnimalIconsFromScene(hexCoord);
  }

  updateFlatIconOpacity(camera, orthographicViewSize = null) {
    if (!this.iconSpawner) {
      return;
    }

    this.iconSpawner.updateFlatIconOpacity(camera, {
      orthographicViewSize,

      minOpacity: 0,
      maxOpacity: 1,

      perspectiveFadeStart: 6,
      perspectiveFadeEnd: 16,

      orthographicFadeStart: 10,
      orthographicFadeEnd: 18,
    });
  }

  updateFloatingIconScale(camera, orthographicViewSize = null) {
    if (!this.iconSpawner) {
      return;
    }

    this.iconSpawner.updateFloatingIconScale(camera, {
      orthographicViewSize,

      minScaleMultiplier: 0.75,
      maxScaleMultiplier: 1.5,

      minOpacityMultiplier: 0.6,
      maxOpacityMultiplier: 1.0,

      perspectiveScaleStart: 6,
      perspectiveScaleEnd: 16,

      orthographicScaleStart: 6,
      orthographicScaleEnd: 12,
    });
  }
}
