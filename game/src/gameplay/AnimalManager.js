import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";

export default class AnimalManager {
    constructor(debugTextInWorld) {
        this.debugTextInWorld = debugTextInWorld;
    }

    /**
       * Setzt ein Tier auf das Tile an der angegebenen Hex-Koordinate, wenn die Platzierungsanforderungen erfüllt sind.
       * @param {THREE.Vector3} hexCoord Die Koordinaten des Hex-Tiles
       * @param {Animal} animal Das Tier, das gesetzt werden soll
       * @param {boolean} overrideAnimalRequirements Gibt an, ob die Anforderungen für das Tier überschrieben werden sollen
       * @returns {boolean} true, wenn das Tier erfolgreich gesetzt wurde, sonst false
       */
      setAnimal(gridManager, hexCoord, animal, overrideAnimalRequirements = false) {
        const tile = gridManager.getTileAt(hexCoord);
        if (!tile) return;
    
        // Override für Score Testing (Jedes Tier kann auf jedes Tile gesetzt werden)
        if (overrideAnimalRequirements) {
          tile.occupiedBy = animal;
          if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
            this.debugTextInWorld.showAnimalDebugLabels();
          }
          return true;
        }
    
        if (tile.animalIsAllowed(animal)) {
          tile.occupiedBy = animal;
          if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
            this.debugTextInWorld.showAnimalDebugLabels();
          }
          return true;
        }
    
        if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
          this.debugTextInWorld.showAnimalDebugLabels();
        }
        return false;
      }
}