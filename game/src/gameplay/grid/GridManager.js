import AnimalManager from "/src/gameplay/AnimalManager.js";
import BlueprintManager from "/src/gameplay/BlueprintManager.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugTextInWorld from "/src/debug/DebugTextInWorld.js";
import HexCoord from "/src/utils/HexCoord.js";
import { spawnTile } from "/src/rendering/tileRenderer.js";
import * as THREE from "three";
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
} from "/src/gameplay/grid/gridQueryService.js";


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

    this.debugTextInWorld = new DebugTextInWorld();
    this.animalManager = new AnimalManager(
      this.scene,
      this,
      this.debugTextInWorld,
    );
    this.blueprintManager = new BlueprintManager(this.scene, this);

    this.paintCoordinates();
  }

  /**
   * @returns {Map<HexCoord, Tile>} Gibt das Grid des GridManagers zurück.
   */
  get grid() {
    return this.#grid;
  }

  /**
   * @returns Gibt die Größe der Hex-Felder im Grid zurück.
   */
  get hexSize() {
    return this.#hexSize;
  }

  /**
   * Alle HexCoords im Grid sind "occupied", also werden einfach die Keys der Map zurückgegeben.
   * @returns {HexCoord[]}
   */
  getOccupiedHexCoords() {
    return Array.from(this.grid.keys());
  }

  /**
   * Gibt das Tile zur angegebenen Hex-Koordinate zurück.
   * Da die Map `HexCoord`-Objekte als Schlüssel verwendet, muss die Suche über die `equals`-Methode der HexCoord erfolgen, um das richtige Tile zu finden.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, für die das Tile abgefragt werden soll.
   * @returns {Tile | undefined} Das Tile-Objekt an der angegebenen Hex-Koordinate oder undefined, wenn kein Tile vorhanden ist.
   */
  getTileAt(hexCoord) {
    for (const [placedHexCoord, tile] of this.grid.entries()) {
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
      this.blueprintManager.clearBlueprints();
      this.debugLogGrid();

      if (DebugConfig.enabled && DebugConfig.doShowCoordinateText && hexCoord) {
        this.trySetCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
      }
    }
    return await spawnTile(this.scene, hexCoord, tile, this.hexSize);
  }

  /**
   * Setzt ein Tier auf das Tile an der angegebenen Hex-Koordinate, wenn die Platzierungsanforderungen erfüllt sind.
   * @param {HexCoord} hexCoord Die Koordinaten des Hex-Tiles
   * @param {Animal} animal Das Tier, das gesetzt werden soll
   * @param {boolean} overrideAnimalRequirements Gibt an, ob die Anforderungen für das Tier überschrieben werden sollen
   * @returns {boolean} true, wenn das Tier erfolgreich gesetzt wurde, sonst false
   */
  setAnimal(hexCoord, animal, overrideAnimalRequirements = false) {
    return this.animalManager.setAnimal(
      hexCoord,
      animal,
      overrideAnimalRequirements,
    );
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
    return getOccupiedNeighboursUtil(this, hexCoord);
  }

  /**
   * Gibt alle freien Nachbarn zurück.
   * @see getUnoccupiedNeighboursUtil
   */
  getUnoccupiedNeighbours(hexCoord) {
    return getUnoccupiedNeighboursUtil(this, hexCoord);
  }

  /**
   * Gibt einen zufälligen freien Nachbarn zurück.
   * @see getRandomUnoccupiedNeighbourUtil
   */
  getRandomUnoccupiedNeighbour(hexCoord) {
    return getRandomUnoccupiedNeighbourUtil(this, hexCoord);
  }

  /**
   * Prüft, ob das angegebene HexCoord mindestens einen besetzten Nachbarn hat.
   * @see hasOccupiedNeighbourUtil
   */
  hasOccupiedNeighbour(hexCoord) {
    return hasOccupiedNeighbourUtil(this, hexCoord);
  }

  /**
   * Gibt alle leeren Hex-Koordinaten zurück, die mindestens einen besetzten Nachbarn haben.
   * @see getAllEmptyHexCoordsWithNeighbourUtil
   */
  getAllEmptyHexCoordsWithNeighbour() {
    return getAllEmptyHexCoordsWithNeighbourUtil(this);
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
    return getHexCoordInWorldDirectionUtil(// <-- Hovern zeigt ganze Signatur
      this,
      hexCoord,
      direction,
      onlyDirectNeighbours
    );
  }

  /**
   * Gibt die direkt benachbarte Hex-Koordinate zurück, die am besten in der angegebenen Welt-Richtung von der Ausgangs-Hex-Koordinate aus liegt.
   * @see getDirectNeighbourInWorldDirectionUtil
   */
  getDirectNeighbourInWorldDirection(hexCoord, direction) {
    return getDirectNeighbourInWorldDirectionUtil(this, hexCoord, direction);
  }

  /**
   * Versucht, eine freie Hex-Koordinate in der angegebenen Richtung zu finden, indem entlang der 6 Hauptachsen des Hex-Grids gesucht wird.
   * @see tryGetHexagonalPositionUtil
   */
  tryGetHexagonalPosition(hexCoord, direction, maxDistance = 10) {
    return tryGetHexagonalPositionUtil(this, hexCoord, direction, maxDistance);
  }

  /**
   * Gibt jede erste freie Hex-Koordinate zurück, die in den sechs hexagonalen Richtungen von der Ausgangs-Hex-Koordinate aus liegt.
   * @see getFirstUnoccupiedHexInEachDirectionUtil
   */
  getFirstUnoccupiedHexInEachDirection(hexCoord) {
    return getFirstUnoccupiedHexInEachDirectionUtil(this, hexCoord);
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
    return getHexagonalMovementForDirectionUtil(direction);
  }

  /**
   * Platziert Debug-Hex-Modelle (sog. "Blueprints") auf den angegebenen Hex-Koordinaten, um mögliche Platzierungsoptionen visuell anzuzeigen.
   */
  tryPaintBlueprints(hexCoords, color = 0xffffff, clearExisting = true) {
    this.blueprintManager.tryPaintBlueprints(hexCoords, color, clearExisting);
  }

  /**
   * Respawnt Blueprint-Modelle basierend auf der aktuellen Belegung des Grids und der angegebenen Hex-Koordinate.
   */
  refreshBlueprints(hexCoord, onlyDirectNeighbours = false) {
    this.blueprintManager.refreshBlueprints(hexCoord, onlyDirectNeighbours);
  }

  /**
   * Spawnt an jeder Hex-Koordinate ein Text-Mesh, das die Koordinatenwerte anzeigt.
   */
  async paintCoordinates() {
    return this.debugTextInWorld.paintCoordinates(
      this.scene,
      this.hexSize,
    );
  }

  /**
   * Versucht, die Farbe des Debug-Koordinatentextes an der angegebenen Hex-Koordinate zu ändern.
   */
  trySetCoordinateTextColor(hexCoord, color) {
    return this.debugTextInWorld.trySetCoordinateTextColorUtil(hexCoord, color);
  }

  /**
   * Spawnt über jedem besetzten Tile ein Text-Mesh, das Informationen über das darauf befindliche Tier anzeigt.
   * Diese Methode wird aufgerufen, wenn Tiere auf Tiles gesetzt werden, um die Logik der Tierplatzierung zu veranschaulichen.
   */
  async showAnimalDebugLabels() {
    return await this.debugTextInWorld.showAnimalDebugLabels(this.scene, this); // Übergibt die Szene und den GridManager an die DebugTextInWorld-Instanz
  }

  debugLogGrid() {
    if (DebugConfig.enabled && DebugConfig.doLogGrid) {
      const [hexCoordStr, tileInfo] = [];
      for (const [key, value] of this.grid.entries()) {
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
