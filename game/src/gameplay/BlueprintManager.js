import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";
import { createHexTile } from "/src/rendering/tileRenderer.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import {
  getUnoccupiedNeighbours as getUnoccupiedNeighboursUtil,
  getFirstUnoccupiedHexInEachDirection as getFirstUnoccupiedHexInEachDirectionUtil,
} from "./grid/gridQueryService.js";

export default class BlueprintManager {
  #blueprints = []; // Liste der aktuell platzierten Blueprint-Modelle (für Debugging)

  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.hexSize = this.gridManager.hexSize;
  }

  /**
   * Platziert Debug-Hex-Modelle (sog. "Blueprints") auf den angegebenen Hex-Koordinaten, um mögliche Platzierungsoptionen visuell anzuzeigen.
   * Diese Methode wird hauptsächlich für Debugging-Zwecke verwendet, um die Logik der Platzierung zu veranschaulichen.
   * Sie erstellt halbtransparente Hexagon-Modelle an den angegebenen Koordinaten und fügt sie der Szene hinzu.
   * @param {HexCoord[]} hexCoords - Liste von Hex-Koordinaten, auf denen die Blueprints platziert werden sollen
   * @param {number} color - Optionaler Farbwert für die Blueprints (Standard: 0xffffff - weiß)
   * @param {boolean} clearExisting - Ob vorhandene Blueprints vor dem Platzieren neuer entfernt werden sollen (Standard: true)
   */
  tryPaintBlueprints(hexCoords, color = 0xffffff, clearExisting = true) {
    if (!DebugConfig.enabled || !DebugConfig.doShowBlueprints) {
      return;
    }
    if (clearExisting) {
      this.clearBlueprints();
    }
    const hexSize = this.hexSize;
    for (const hexCoord of hexCoords) {
      const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);
      const hexTile = createHexTile(
        this.hexSize * 0.8, // etwas kleiner als die regulären Tiles
        0.05,
        color,
        1,
      );
      hexTile.position.set(worldPos.x, worldPos.y - 0.15, worldPos.z);
      hexTile.rotation.y = Math.PI / 3; // Gleiche Ausrichtung wie reguläre Tiles
      this.#blueprints.push(hexTile);
      if (this.scene) {
        this.scene.add(hexTile);
      }
    }
  }

  /**
   * Entfernt alle aktuell platzierten Blueprint-Modelle aus der Szene und leert die interne Liste.
   * Diese Methode wird aufgerufen, bevor neue Blueprints platziert werden, um sicherzustellen, dass keine veralteten Modelle in der Szene verbleiben.
   * Sie ist auch nützlich, um die Szene zu bereinigen, wenn die Anzeige von Blueprints deaktiviert wird.
   */
  clearBlueprints() {
    for (const cube of this.#blueprints) {
      if (this.scene) {
        this.scene.remove(cube);
      }
    }
    this.#blueprints = [];
  }

  /**
   * Respawnt Blueprint-Modelle basierend auf der aktuellen Belegung des Grids und der angegebenen Hex-Koordinate.
   * Diese Methode wird aufgerufen, wenn sich die Position des preview-Tiles ändert, um die angezeigten Blueprints entsprechend zu aktualisieren.
   * @param {HexCoord} hexCoord Ausgangsposition
   * @param {boolean} onlyDirectNeighbours True, wenn nur direkt benachbarte Hexes als mögliche Platzierungen angezeigt werden sollen, sonst false
   * (Standard: false, was eine hexagonale Suche entlang der Hauptachsen durchführt).
   */
  refreshBlueprints(hexCoord, onlyDirectNeighbours = false) {
    const candidates = onlyDirectNeighbours
      ? getUnoccupiedNeighboursUtil(this.gridManager, hexCoord)
      : getFirstUnoccupiedHexInEachDirectionUtil(this.gridManager, hexCoord);

    this.clearBlueprints();

    if (candidates && candidates.length > 0) {
      this.tryPaintBlueprints(candidates);
    }
  }
}
