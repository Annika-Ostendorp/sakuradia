import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import TextSpawner from "/src/rendering/TextSpawner.js";

export default class DebugTextInWorld {
  /** Map von HexCoord (Objekt-Referenz) auf Text-Mesh-Objekte.
   * @type {Map<HexCoord, THREE.MeshStandardMaterial>} */
  #coordGrid = new Map(); // Für Debugging: HexCoord -> Text-Mesh

  #coordGridSize = 10;

  /**
   * Debug-Methode: Spawnt an jeder Hex-Koordinate ein Text-Mesh, das die Koordinatenwerte anzeigt.
   * Diese Methode wird nur aktiviert, wenn die entsprechenden Debug-Optionen gesetzt sind, da sie die Szene mit vielen Textobjekten füllt.
   * Sie ist nützlich, um die Logik der Hex-Koordinaten und ihre Umrechnung in Weltpositionen zu veranschaulichen.
   */
  async paintCoordinates(gridManager, scene) {
    if (!DebugConfig.enabled || !DebugConfig.doShowCoordinateText) {
      return;
    }

    this.#coordGrid = new Map();
    const size = this.#coordGridSize;

    for (let column = -size; column <= size; column++) {
      for (let row = -size; row <= size; row++) {
        const hexCoord = new HexCoord(column, row);

        const pos = hexCoord.hexToWorld(hexCoord, gridManager.getHexSize());
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
        console.warn(`Kein Textobjekt für HexCoord ${hexCoord.toString()} gefunden.`);
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
}
