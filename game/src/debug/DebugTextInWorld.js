import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import TextSpawner from "/src/rendering/TextSpawner.js";
import { Animal } from "/src/data/Animal.js";

export default class DebugTextInWorld {
  /** Map von HexCoord (Objekt-Referenz) auf Text-Mesh-Objekte.
   * @type {Map<HexCoord, THREE.MeshStandardMaterial>} */
  #coordGrid = new Map(); // Für Debugging: HexCoord -> Text-Mesh

  #coordGridSize = 10;

  #animalDebugLabels = []; // Liste aller Text-Meshes, die Debug-Labels für Tiere darstellen

  /**
   * Debug-Methode: Spawnt an jeder Hex-Koordinate ein Text-Mesh, das die Koordinatenwerte anzeigt.
   * Diese Methode wird nur aktiviert, wenn die entsprechenden Debug-Optionen gesetzt sind, da sie die Szene mit vielen Textobjekten füllt.
   * Sie ist nützlich, um die Logik der Hex-Koordinaten und ihre Umrechnung in Weltpositionen zu veranschaulichen.
   */
  async paintCoordinates(scene, hexSize) {
    if (!DebugConfig.enabled || !DebugConfig.doShowCoordinateText) {
      return;
    }

    this.#coordGrid = new Map();
    const size = this.#coordGridSize;

    for (let column = -size; column <= size; column++) {
      for (let row = -size; row <= size; row++) {
        const hexCoord = new HexCoord(column, row);

        const pos = hexCoord.hexToWorld(hexCoord, hexSize);
        pos.y = 0.2;

        const textMesh = await TextSpawner.spawn(
          scene,
          pos,
          hexCoord.hashCode(),
          0.3,
          0xff0000,
        );

        const key = hexCoord.hashCode();

        this.#coordGrid.set(key, textMesh);
      }
    }
  }

  /**
   * Ändert die Farbe des Text-Meshes, das die Koordinaten einer Hex-Koordinate anzeigt.
   * @param {HexCoord} hexCoord Key der Hex-Koordinate in this.#coordGrid, deren Textfarbe geändert werden soll
   * @param {number} color Die neue Farbe
   * @returns {boolean} True, wenn die Farbe erfolgreich geändert wurde, sonst false
   */
  trySetCoordinateTextColorUtil(hexCoord, color) {
    const key = hexCoord.hashCode();
    const textObject = this.#coordGrid.get(key);

    if (!textObject) {
      console.warn(
        `Kein Textobjekt für HexCoord ${hexCoord.toString()} gefunden.`,
      );
      return false;
    }

    if (textObject.textMesh) {
      textObject.textMesh.material.color.set(color);
      return true;
    }

    // Fallback für ältere TextMesh-Objekte, die direkt als Mesh gespeichert wurden
    if (textObject.material) {
      textObject.material.color.set(color);
      return true;
    }

    return false;
  }

  /**
   * Debug-Methode: Spawnt über jedem besetzten Tile ein Text-Mesh, das Informationen über das darauf befindliche Tier anzeigt.
   * Diese Methode wird aufgerufen, wenn Tiere auf Tiles gesetzt werden, um die Logik der Tierplatzierung zu veranschaulichen.
   * Sie entfernt zuerst alle vorhandenen Debug-Labels, um sicherzustellen, dass keine veralteten Informationen in der Szene verbleiben, und erstellt dann neue Labels basierend auf dem aktuellen Zustand des Grids.
   */
  async showAnimalDebugLabels(
    scene,
    gridManager,
    overrideHexCoord = null,
    overrideAnimal = null,
  ) {
    this.clearAnimalDebugLabels(scene);

    for (const [hexCoord, tile] of gridManager.grid.entries()) {
      if (!tile) {
        continue;
      }

      const isOccupiedByAnimal = tile.occupiedBy !== Animal.NONE;
      const isAnimalPlacementPreview = overrideAnimal !== null;
      const isHoveredTile =
        overrideHexCoord !== null && overrideHexCoord.equals(hexCoord);

      let animalText = "";
      let textSize = isHoveredTile || tile.animalIsAllowed(overrideAnimal) ? 0.15 : 0.08;
      if (isOccupiedByAnimal){
        textSize = 0.3;
      }
      const zOffset = (isOccupiedByAnimal || isAnimalPlacementPreview && isHoveredTile) ? 0 : 0.4;

      // Occupied tiles always show the animal that occupies the tile.
      if (isOccupiedByAnimal) {
        animalText = `(${tile.occupiedBy})`;
      }

      // During animal placement, show possible animals only on free tiles
      // that allow the currently selected animal.
      else if (isAnimalPlacementPreview) {
        animalText = isHoveredTile
          ? `(Preview) ${overrideAnimal}`
          : String(tile.tileData.animals);
      }
      // Outside animal placement, show the possible animals for every free tile.
      else {
        animalText = String(tile.tileData.animals);
      }

      const worldPos = hexCoord.hexToWorld(hexCoord, gridManager.hexSize);
      const labelPos = new THREE.Vector3(worldPos.x, 0.3, worldPos.z + zOffset);

      const label = await TextSpawner.spawnWithShadow(
        scene,
        labelPos,
        animalText,
        textSize,
        0xffffff,
      );

      this.#animalDebugLabels.push(label);
    }
  }

  /**
   * Entfernt alle Debug-Text-Meshes, die Informationen über Tiere auf den Tiles anzeigen, aus der Szene und leert die interne Liste.
   * Diese Methode wird aufgerufen, bevor neue Debug-Labels erstellt werden, um sicherzustellen, dass keine veralteten Informationen in der Szene verbleiben.
   */
  clearAnimalDebugLabels(scene) {
    for (const label of this.#animalDebugLabels) {
      TextSpawner.destroyTextObject(scene, label);
    }

    this.#animalDebugLabels = [];
  }
}
