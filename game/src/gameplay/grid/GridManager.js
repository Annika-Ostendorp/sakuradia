import HexCoord from "../../utils/HexCoord.js";
import { TileData } from "../Tile.js";
import ModelLoader from "../../utils/ModelLoader.js";
import {
  getColorForLandscape,
  applyColorToModel,
} from "../../utils/colorUtils.js";
import * as THREE from "three";
import TextSpawner from "../../rendering/TextSpawner.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugRayDrawer from "/src/debug/DebugRayDrawer.js";

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
  /**
   * Map von HexCoord auf Tile-Objekte.
   * Für koordinatenbasierte Abfragen muss `getTileAt` verwendet werden.
   * @type {Map<HexCoord, Tile>}
   */
  #grid = new Map();
  #hexSize = 1; // Größe einer Zelle im Weltkoordinatensystem (Skalierungsfaktor)

  /**
   * Map von HexCoord (Objekt-Referenz) auf Text-Mesh-Objekte.
   * @type {Map<HexCoord, THREE.MeshStandardMaterial>}
   */
  #coordGrid = new Map(); // Für Debugging: HexCoord -> Text-Mesh

  /**
   * Konstruktor
   * @param {THREE.Scene} scene Die 3D-Szene, zu der u.a. Modelle hinzugefügt werden.
   */
  constructor(scene) {
    this.scene = scene;
    this.gridSize = 20; // Größe des logischen Spielfelds in Zellen pro Achse
    this.blueprints = []; // Liste von Debug-Hex-Modellen, die mögliche Platzierungen anzeigen
    this.animalDebugLabels = []; // Liste von Text-Meshes, die Debug-Informationen über Tiere auf den Tiles anzeigen

    this.modelLoader = new ModelLoader(); // Verantwortlich für das Laden von 3D-Modellen
    this.getColorForLandscape = getColorForLandscape;
    this.applyColorToModel = applyColorToModel;

    this.paintCoordinates();
  }

  /**
   * @returns {Map<HexCoord, Tile>} Gibt das Grid dieses GridManagers zurück.
   */
  getGrid() {
    return this.#grid;
  }

  /**
   * @returns Gibt die Größe der Hex-Felder zurück.
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
   * Hinweis: Da die Map `HexCoord`-Objekte als Schlüssel verwendet, muss die Suche über die `equals`-Methode der HexCoord erfolgen, um das richtige Tile zu finden.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, für die das Tile abgefragt werden soll.
   * @returns {Tile | undefined} Das Tile-Objekt an der angegebenen Hex-Koordinate oder undefined, wenn kein Tile vorhanden ist.
   */
  getTileAt(hexCoord) {
    for (const [placedHexCoord, tile] of this.getGrid().entries()) {
      if (placedHexCoord.equals(hexCoord)) {
        return tile;
      }
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
   * Eine der wichtigsten Methoden:
   * Platziert ein Tile an der angegebenen Hex-Koordinate, rotiert es entsprechend und fügt es der Szene hinzu.
   * Hinweis: Diese Methode aktualisiert sowohl die interne Logik (Grid-Map) als auch die visuelle Darstellung (3D-Modell in der Szene).
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

      if (DebugConfig.enabled && DebugConfig.doShowCoordinateText && hexCoord) {
        this.setCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
      }
    }
    return await spawnTile(this.scene, hexCoord, tile, this.getHexSize());
  }

  /**
   * Sehr wichtige Methode:
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
  getRandomEmptyHexCoord() {
    return getRandomEmptyHexCoordUtil(this);
  }

  getOccupiedNeighbours(hexCoord) {
    return getOccupiedNeighboursUtil(this, hexCoord);
  }

  getUnoccupiedNeighbours(hexCoord) {
    return getUnoccupiedNeighboursUtil(this, hexCoord);
  }

  getRandomUnoccupiedNeighbour(hexCoord) {
    return getRandomUnoccupiedNeighbourUtil(this, hexCoord);
  }

  hasOccupiedNeighbour(hexCoord) {
    return hasOccupiedNeighbourUtil(this, hexCoord);
  }

  getAllEmptyHexCoordsWithNeighbour() {
    return getAllEmptyHexCoordsWithNeighbourUtil(this);
  }

  getHexCoordInWorldDirection(
    hexCoord,
    direction,
    onlyDirectNeighbours = false,
  ) {
    return getHexCoordInWorldDirectionUtil(
      this,
      hexCoord,
      direction,
      (onlyDirectNeighbours = false),
    );
  }

  getDirectNeighbourInWorldDirection(hexCoord, direction) {
    return getDirectNeighbourInWorldDirectionUtil(this, hexCoord, direction);
  }

  tryGetHexagonalPosition(hexCoord, direction, maxDistance = 10) {
    return tryGetHexagonalPositionUtil(this, hexCoord, direction, maxDistance);
  }

  getFirstUnoccupiedHexInEachDirection(hexCoord) {
    return getFirstUnoccupiedHexInEachDirectionUtil(this, hexCoord);
  }

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

  getHexagonalMovementForDirection(direction) {
    return getHexagonalMovementForDirectionUtil(direction);
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
    if (!DebugConfig.enabled || !DebugConfig.doShowCoordinateText) {
      return;
    }

    this.coordGrid = new Map();
    const size = 10;
    for (let column = -size; column <= size; column++) {
      for (let row = -size; row <= size; row++) {
        const hexCoord = new HexCoord(column, row);

        const pos = hexCoord.hexToWorld(hexCoord, this.getHexSize());
        pos.y = 0.2;

        const textMesh = await TextSpawner.spawn(
          this.scene,
          pos,
          hexCoord.hashCode(),
          0.3,
          0xff0000,
        );

        const key = hexCoord.hashCode();

        this.coordGrid.set(key, textMesh);
      }
    }
  }

  /**
   * Ändert die Farbe des Text-Meshes, das die Koordinaten einer Hex-Koordinate anzeigt.
   * @param {HexCoord} hexCoord Key der Hex-Koordinate in this.coordGrid, deren Textfarbe geändert werden soll
   * @param {number} color Die neue Farbe
   * @returns {boolean} True, wenn die Farbe erfolgreich geändert wurde, sonst false
   */
  setCoordinateTextColor(hexCoord, color) {
    const key = hexCoord.hashCode();
    const textObject = this.coordGrid.get(key);

    if (!textObject) return;

    if (textObject.textMesh) {
      textObject.textMesh.material.color.set(color);
      return;
    }

    // Fallback für ältere TextMesh-Objekte, die direkt als Mesh gespeichert wurden
    if (textObject.material) {
      textObject.material.color.set(color);
    }
  }

  /**
   * Debug-Methode: Spawnt über jedem besetzten Tile ein Text-Mesh, das Informationen über das darauf befindliche Tier anzeigt.
   * Diese Methode wird aufgerufen, wenn Tiere auf Tiles gesetzt werden, um die Logik der Tierplatzierung zu veranschaulichen.
   * Sie entfernt zuerst alle vorhandenen Debug-Labels, um sicherzustellen, dass keine veralteten Informationen in der Szene verbleiben, und erstellt dann neue Labels basierend auf dem aktuellen Zustand des Grids.
   */
  async showAnimalDebugLabels() {
    this.clearAnimalDebugLabels();

    for (const [hexCoord, tile] of this.getGrid().entries()) {
      if (!tile || !tile.occupiedBy) {
        continue;
      }

      const animalText = String(tile.occupiedBy);

      const worldPos = hexCoord.hexToWorld(hexCoord, this.getHexSize());

      const labelPos = new THREE.Vector3(worldPos.x, 0.15, worldPos.z + 0.5);

      const label = await TextSpawner.spawnWithShadow(
        this.scene,
        labelPos,
        animalText,
        0.15,
        0xffffff,
      );

      this.animalDebugLabels.push(label);
    }
  }

  /**
   * Entfernt alle Debug-Text-Meshes, die Informationen über Tiere auf den Tiles anzeigen, aus der Szene und leert die interne Liste.
   * Diese Methode wird aufgerufen, bevor neue Debug-Labels erstellt werden, um sicherzustellen, dass keine veralteten Informationen in der Szene verbleiben.
   */
  clearAnimalDebugLabels() {
    for (const label of this.animalDebugLabels) {
      if (this.scene) {
        this.scene.remove(label);
      }

      if (label.geometry) {
        label.geometry.dispose();
      }

      if (label.material) {
        label.material.dispose();
      }
    }

    this.animalDebugLabels = [];
  }
}
