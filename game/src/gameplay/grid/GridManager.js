import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";
import { TileData } from "../Tile.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugRayDrawer from "/src/debug/DebugRayDrawer.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";
import TextSpawner from "/src/rendering/TextSpawner.js";
import {
  getColorForLandscape,
  applyColorToModel,
} from "/src/utils/colorUtils.js";

import {
  getRandomEmptyHexCoord as getRandomEmptyHexCoordUtil,
  getOccupiedNeighbours as getOccupiedNeighboursUtil,
  getUnoccupiedNeighbours as getUnoccupiedNeighboursUtil,
  getRandomUnoccupiedNeighbour as getRandomUnoccupiedNeighbourUtil,
  hasOccupiedNeighbour as hasOccupiedNeighbourUtil,
  getAllEmptyHexCoordsWithNeighbour as getAllEmptyHexCoordsWithNeighbourUtil,
  getHexCoordInWorldDirection as getHexCoordInWorldDirectionUtil,
  getDirectNeighbourInWorldDirection as getDirectNeighbourInWorldDirectionUtil,
  tryGetHexagonalPosition as tryGetHexagonalPositionUtil,
  getFirstUnoccupiedHexInEachDirection as getFirstUnoccupiedHexInEachDirectionUtil,
  tryGetHexagonalPositionInHexDirection as tryGetHexagonalPositionInHexDirectionUtil,
  getHexagonalMovementForDirection as getHexagonalMovementForDirectionUtil,
} from "./gridQueryService.js";

import { createHexTile, spawnTile } from "/src/rendering/tileRenderer.js";

/**
 * Verantwortlich für das Speichern und Verwalten des hexagonalen Spielfelds.
 * Verwaltet eine Map von `HexCoord` -> `Tile` und managed
 * Anfragen zum Platzieren von Tiles und Tieren, sowie die Instanziierung der 3D-Modelle in der Szene.
 *
 * Wichtige Hinweise:
 * - Map-Schlüssel sind `HexCoord`-Objekte. Die Map vergleicht Schlüssel per
 *   Objekt-Referenz, nicht nach Koordinatenwerten. Daher existiert die
 *   Hilfsmethod `getTileAt` um koordinatenbasierte Suchen durchzuführen.
 * - Methoden, die World-Positionen benötigen, rufen `hexToWorld` auf dem
 *   `HexCoord`-Objekt auf, um Konsistenz zwischen Logik- und Render-Koordinaten zu gewährleisten.
 */
export default class GridManager {
  /**  Map von HexCoord auf Tile-Objekte.
   * Für koordinatenbasierte Abfragen muss `getTileAt` verwendet werden.
   * @type {Map<HexCoord, Tile>} */
  #grid = new Map();
  #hexSize = 1; // Größe einer Zelle im Weltkoordinatensystem (Skalierungsfaktor)

  /**
   * Konstruktor
   * @param {THREE.Scene} scene Die 3D-Szene, zu der u.a. Modelle hinzugefügt werden.
   */
  constructor(scene) {
    this.scene = scene;
    this.blueprints = []; // Liste von Debug-Hex-Modellen, die mögliche Platzierungen anzeigen
    this.animalDebugLabels = []; // Liste von Text-Meshes, die Debug-Informationen über Tiere auf den Tiles anzeigen

    this.debugTextInWorld = new DebugTextInWorld();

    this.paintCoordinates();
  }

  /**
   * @returns {Map<HexCoord, Tile>} Gibt das Grid des GridManagers zurück.
   */
  getGrid() {
    return this.#grid;
  }

  /**
   * @returns Gibt die Größe der Hex-Felder im Grid zurück.
   */
  getHexSize() {
    return this.#hexSize;
  }

  /**
   * Alle HexCoords im Grid sind "occupied", also werden einfach die Keys der Map zurückgegeben.
   * @returns {HexCoord[]}
   */
  getOccupiedHexCoords() {
    return Array.from(this.getGrid().keys());
  }

  /**
   * Gibt das Tile zur angegebenen Hex-Koordinate zurück.
   * Da die Map `HexCoord`-Objekte als Schlüssel verwendet, muss die Suche über die `equals`-Methode der HexCoord erfolgen, um das richtige Tile zu finden.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, für die das Tile abgefragt werden soll.
   * @returns {Tile | undefined} Das Tile-Objekt an der angegebenen Hex-Koordinate oder undefined, wenn kein Tile vorhanden ist.
   */
  getTileAt(hexCoord) {
    for (const [placedHexCoord, tile] of this.getGrid().entries()) {
      if (placedHexCoord.equals(hexCoord)) return tile;
    }
    return undefined;
  }

  /**
   * Prüft, ob an der angegebenen Hex-Koordinate bereits ein Tile liegt.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, für die geprüft werden soll.
   * @returns {boolean} true, wenn an der angegebenen Hex-Koordinate ein Tile liegt, sonst false.
   */
  isOccupied(hexCoord) {
    return this.getTileAt(hexCoord) !== undefined;
  }

  /**
   * Wichtige Methode:
   * Platziert ein Tile an der angegebenen Hex-Koordinate, rotiert es entsprechend und fügt es der Szene hinzu.
   * Diese Methode aktualisiert sowohl die interne Logik (Grid-Map) als auch die visuelle Darstellung (3D-Modell in der Szene).
   * Sie ist zentral für das Gameplay, da sie die Platzierung von Tiles steuert.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, an der das Tile platziert werden soll.
   * @param {Tile} tile Das Tile-Objekt, das platziert werden soll.
   * @param {number} rotation - Optionaler Rotationswert für das Tile (0-5), default ist 0.
   * @param {boolean} setToGrid - Ob das Tile auch in der internen Grid-Map gespeichert werden soll, default ist true. Ist false, wenn das preview-Modell platziert werden soll, ohne die Logik zu beeinflussen.
   * @returns {Promise<THREE.Object3D | null>} Das instanziierte 3D-Modell des Tiles oder null bei Fehlern.
   */
  async setTile(hexCoord, tile, rotation = 0, setToGrid = true) {
    tile.rotation = rotation;
    if (setToGrid) {
      this.#grid.set(hexCoord, tile);
      this.clearBlueprints();
      this.debugLogGrid();

      if (DebugConfig.enabled && DebugConfig.doShowCoordinateText && hexCoord) {
        this.trySetCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
      }
    }
    return await spawnTile(this.scene, hexCoord, tile, this.getHexSize());
  }

  /**
   * Wichtige Methode:
   * Setzt ein Tier auf das Tile an der angegebenen Hex-Koordinate, wenn die Platzierungsanforderungen erfüllt sind.
   * @param {THREE.Vector3} hexCoord Die Koordinaten des Hex-Tiles
   * @param {Animal} animal Das Tier, das gesetzt werden soll
   * @param {boolean} overrideAnimalRequirements Gibt an, ob die Anforderungen für das Tier überschrieben werden sollen
   * @returns {boolean} true, wenn das Tier erfolgreich gesetzt wurde, sonst false
   */
  setAnimal(hexCoord, animal, overrideAnimalRequirements = false) {
    const tile = this.getTileAt(hexCoord);
    if (!tile) return;

    // Override für Score Testing (Jedes Tier kann auf jedes Tile gesetzt werden)
    if (overrideAnimalRequirements) {
      tile.occupiedBy = animal;
      if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
        this.showAnimalDebugLabels();
      }
      return true;
    }

    if (tile.animalIsAllowed(animal)) {
      tile.occupiedBy = animal;
      if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
        this.showAnimalDebugLabels();
      }
      return true;
    }

    if (DebugConfig.enabled && DebugConfig.doInWorldDebugInfo) {
      this.showAnimalDebugLabels();
    }
    return false;
  }

  /// --- Grid-Query-Methoden (Wrapper um gridQueryService) ---

  /**
   * Gibt eine zufällige freie Hex-Koordinate zurück, die an mindestens ein besetztes Feld angrenzt.
   * @see getRandomEmptyHexCoordUtil
   */
  getRandomEmptyHexCoord() {
    return getRandomEmptyHexCoordUtil(this); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt für hexCoord alle benachbarten besetzten Hex-Koordinaten zurück.
   * @see getOccupiedNeighboursUtil
   */
  getOccupiedNeighbours(hexCoord) {
    return getOccupiedNeighboursUtil(this, hexCoord); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt alle freien Nachbarn zurück.
   * @see getUnoccupiedNeighboursUtil
   */
  getUnoccupiedNeighbours(hexCoord) {
    return getUnoccupiedNeighboursUtil(this, hexCoord); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt einen zufälligen freien Nachbarn zurück.
   * @see getRandomUnoccupiedNeighbourUtil
   */
  getRandomUnoccupiedNeighbour(hexCoord) {
    return getRandomUnoccupiedNeighbourUtil(this, hexCoord); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Prüft, ob das angegebene HexCoord mindestens einen besetzten Nachbarn hat.
   * @see hasOccupiedNeighbourUtil
   */
  hasOccupiedNeighbour(hexCoord) {
    return hasOccupiedNeighbourUtil(this, hexCoord); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt alle leeren Hex-Koordinaten zurück, die mindestens einen besetzten Nachbarn haben.
   * @see getAllEmptyHexCoordsWithNeighbourUtil
   */
  getAllEmptyHexCoordsWithNeighbour() {
    return getAllEmptyHexCoordsWithNeighbourUtil(this); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt die Hex-Koordinate zurück, die in der angegebenen Welt-Richtung von der Ausgangs-Hex-Koordinate aus liegt.
   * @see getHexCoordInWorldDirectionUtil
   */
  getHexCoordInWorldDirection(
    hexCoord,
    direction,
    onlyDirectNeighbours = false,
  ) {
    return getHexCoordInWorldDirectionUtil(
      // <-- Hovern zeigt ganze Signatur
      this,
      hexCoord,
      direction,
      (onlyDirectNeighbours = false),
    );
  }

  /**
   * Gibt die direkt benachbarte Hex-Koordinate zurück, die am besten in der angegebenen Welt-Richtung von der Ausgangs-Hex-Koordinate aus liegt.
   * @see getDirectNeighbourInWorldDirectionUtil
   */
  getDirectNeighbourInWorldDirection(hexCoord, direction) {
    return getDirectNeighbourInWorldDirectionUtil(this, hexCoord, direction); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Versucht, eine freie Hex-Koordinate in der angegebenen Richtung zu finden, indem entlang der 6 Hauptachsen des Hex-Grids gesucht wird.
   * @see tryGetHexagonalPositionUtil
   */
  tryGetHexagonalPosition(hexCoord, direction, maxDistance = 10) {
    return tryGetHexagonalPositionUtil(this, hexCoord, direction, maxDistance); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt jede erste freie Hex-Koordinate zurück, die in den sechs hexagonalen Richtungen von der Ausgangs-Hex-Koordinate aus liegt.
   * @see getFirstUnoccupiedHexInEachDirectionUtil
   */
  getFirstUnoccupiedHexInEachDirection(hexCoord) {
    return getFirstUnoccupiedHexInEachDirectionUtil(this, hexCoord); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Gibt die erste freie Hex-Koordinate zurück, die in der angegebenen hexagonalen Richtung von der Ausgangs-Hex-Koordinate aus liegt.
   * @see tryGetHexagonalPositionInHexDirectionUtil
   */
  tryGetHexagonalPositionInHexDirection(
    hexCoord,
    hexDirection,
    maxDistance = 10,
  ) {
    return tryGetHexagonalPositionInHexDirectionUtil(
      // <-- Hovern zeigt ganze Signatur
      this,
      hexCoord,
      hexDirection,
      maxDistance,
    );
  }

  /**
   * Gibt die Hexagonal-Bewegungsrichtung zurück, die der angegebenen Welt-Richtung am nächsten kommt.
   * @see getHexagonalMovementForDirectionUtil
   */
  getHexagonalMovementForDirection(direction) {
    return getHexagonalMovementForDirectionUtil(direction); // <-- Hovern zeigt ganze Signatur
  }

  /**
   * Plaziert Debug-Hex-Modelle (sog. "Blueprints") auf den angegebenen Hex-Koordinaten, um mögliche Platzierungsoptionen visuell anzuzeigen.
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

    for (const hexCoord of hexCoords) {
      const worldPos = hexCoord.hexToWorld(hexCoord, this.getHexSize());
      const hexTile = createHexTile(
        this.getHexSize() * 0.8, // etwas kleiner als die regulären Tiles
        0.05,
        color,
        1,
      );
      hexTile.position.set(worldPos.x, worldPos.y - 0.15, worldPos.z);
      hexTile.rotation.y = Math.PI / 3; // Gleiche Ausrichtung wie reguläre Tiles
      this.blueprints.push(hexTile);
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
    for (const cube of this.blueprints) {
      if (this.scene) {
        this.scene.remove(cube);
      }
    }
    this.blueprints = [];
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
      ? this.getUnoccupiedNeighbours(hexCoord)
      : this.getFirstUnoccupiedHexInEachDirection(hexCoord);

    this.clearBlueprints();

    if (candidates && candidates.length > 0) {
      this.tryPaintBlueprints(candidates);
    }
  }

  /**
   * Debug-Methode: Spawnt an jeder Hex-Koordinate ein Text-Mesh, das die Koordinatenwerte anzeigt.
   * Diese Methode wird nur aktiviert, wenn die entsprechenden Debug-Optionen gesetzt sind, da sie die Szene mit vielen Textobjekten füllt.
   * Sie ist nützlich, um die Logik der Hex-Koordinaten und ihre Umrechnung in Weltpositionen zu veranschaulichen.
   */
  async paintCoordinates() {
    return this.debugTextInWorld.paintCoordinates(this.scene, this.getHexSize());
  }

  trySetCoordinateTextColor(hexCoord, color) {
    this.debugTextInWorld.trySetCoordinateTextColorUtil(hexCoord, color);
  }

  /**
   * Debug-Methode: Spawnt über jedem besetzten Tile ein Text-Mesh, das Informationen über das darauf befindliche Tier anzeigt.
   * Diese Methode wird aufgerufen, wenn Tiere auf Tiles gesetzt werden, um die Logik der Tierplatzierung zu veranschaulichen.
   */
  async showAnimalDebugLabels() {
    this.debugTextInWorld.showAnimalDebugLabels(this.scene, this); // Übergibt die Szene und den GridManager an die DebugTextInWorld-Instanz
  }

  debugLogGrid() {
    if (DebugConfig.enabled && DebugConfig.doLogGrid) {
      const [hexCoordStr, tileInfo] = [];
      for (const [key, value] of this.getGrid().entries()) {
        hexCoordStr.push(key.toString());
        tileInfo.push(
          `Tile(Landscape: ${value.primaryLandscape}, Rotation: ${value.rotation})`,
        );
      }
      console.log(
        `Grid contents: ${hexCoordStr.join(", ")} => ${tileInfo.join(", ")}`,
      );
    }
  }
}
