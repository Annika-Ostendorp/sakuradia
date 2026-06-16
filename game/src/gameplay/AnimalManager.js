import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";
import { Animal } from "../data/Animal.js";

export default class AnimalManager {
  constructor(scene, gridManager, debugTextInWorld) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.debugTextInWorld = debugTextInWorld;
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
    this.debugTextInWorld.showAnimalDebugLabels(
      this.scene,
      this.gridManager,
      hexCoord,
      animal,
    );
  }
}
