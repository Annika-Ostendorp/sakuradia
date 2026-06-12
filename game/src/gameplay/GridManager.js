import HexCoord from "../utils/HexCoord.js";
import { TileData } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";
import * as THREE from "three";
import TextSpawner from "../rendering//TextSpawner.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugRayDrawer from "/src/debug/DebugRayDrawer.js";

/**
 * Verantwortlich für das Speichern und Verwalten des hexagonalen Spielfelds
 * während des Gameplays. Verwaltet eine Map von `HexCoord` -> `Tile` sowie das
 * Erzeugen und Platzieren von 3D-Modellen in der Szene.
 *
 * Wichtige Hinweise:
 * - Map-Schlüssel sind `HexCoord`-Objekte. Die Map vergleicht Schlüssel per
 *   Objekt-Referenz, nicht nach Koordinatenwerten. Daher existieren Hilfs-
 *   methoden wie `getTileAt` um koordinatenbasierte Suchen durchzuführen.
 * - Methoden, die World-Positionen benötigen, rufen `hexToWorld` auf dem
 *   `HexCoord`-Objekt auf, um Konsistenz zwischen Logik- und Render-Koordinaten
 *   zu gewährleisten.
 */
export default class GridManager {
  /**
   * Konstruktor
   * @param {THREE.Scene} scene Die 3D-Szene, zu der u.a. Modelle hinzugefügt werden.
   */
  constructor(scene) {
    this.scene = scene;

    this.gridSize = 20; // Größe des logischen Spielfelds in Zellen pro Achse
    this.hexSize = 1; // Größe einer Zelle im Weltkoordinatensystem (Skalierungsfaktor)
    this.blueprints = []; // Liste von Debug-Hex-Modellen, die mögliche Platzierungen anzeigen
    this.animalDebugLabels = []; // Liste von Text-Meshes, die Debug-Informationen über Tiere auf den Tiles anzeigen

    /**
     * Map von HexCoord auf Tile-Objekte.
     * Hinweis: Verwende `getTileAt` für koordinatenbasierte Abfragen, da ein
     * neu konstruiertes HexCoord mit denselben Zahlenwerten nicht der selben Referenz entspricht
     * @type {Map<HexCoord, Tile>}
     */
    this.grid = new Map();
    this.modelLoader = new ModelLoader(); // Verantwortlich für das Laden von 3D-Modellen
    this.colorUtils = new ColorUtils();

    /**
     * Map von HexCoord (Objekt-Referenz) auf Text-Mesh-Objekte.
     * @type {Map<HexCoord, THREE.MeshStandardMaterial>}
     */
    this.coordGrid = new Map(); // Für Debugging: HexCoord -> Text-Mesh
    this.paintCoordinates();
  }

  /**
   * Gibt das Grid dieses GridManagers zurück.
   * @returns {Map<HexCoord, Tile>}
   */
  getGrid() {
    return this.grid;
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
   * Hinweis: Da die Map `HexCoord`-Objekte als Schlüssel verwendet, muss die Suche über die `equals`-Methode der HexCoord erfolgen, um das richtige Tile zu finden.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, für die das Tile abgefragt werden soll.
   * @returns {Tile | undefined} Das Tile-Objekt an der angegebenen Hex-Koordinate oder undefined, wenn kein Tile vorhanden ist.
   */
  getTileAt(hexCoord) {
    for (const [placedHexCoord, tile] of this.grid.entries()) {
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
      this.grid.set(hexCoord, tile);
      this.clearBlueprints();

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

      if (DebugConfig.enabled && DebugConfig.doShowCoordinateText && hexCoord) {
        this.setCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
      }
    }
    return await this.spawnTile(hexCoord, tile);
  }

  /**
   * Instanziiert das 3D-Modell für ein Tile an der angegebenen Hex-Koordinate.
   * Hinweis: Diese Methode kümmert sich ausschließlich um das Erstellen und Positionieren des 3D-Modells.
   * Sie wird von `setTile` aufgerufen, nachdem die Logik aktualisiert wurde.
   * @param {HexCoord} hexCoord Die Hex-Koordinate, an der das Tile platziert werden soll.
   * @param {Tile} tile Das Tile-Objekt, das die Informationen über das zu spawnende Modell enthält.
   * @returns {Promise<THREE.Object3D | null>} Das instanziierte 3D-Modell oder null bei Fehlern.
   */
  async spawnTile(hexCoord, tile) {
    if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
      throw new Error("spawnTile expects a HexCoord instance");
    }

    tile.rotation = tile.rotation || 0;

    // Konvertiere HexCoord in Welt-Position für das 3D-Modell.
    const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

    try {
      const model = await this.modelLoader.getModelForTile(tile);

      model.position.set(worldPos.x, worldPos.y, worldPos.z);
      model.rotation.y = tile.rotation * (Math.PI / 3);

      if (this.scene) {
        this.scene.add(model);
      }

      return model;
    } catch (error) {
      console.error("Fehler beim Laden von Tile-Modell:", error);
      return null;
    }
  }

  /**
   * Hilfs-Methode, um die Farbe der primitive Hex-Tiles zu ändern.
   * @param {*} model
   * @param {*} color
   */
  applyColorToModel(model, color) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();
        child.material.color.set(color);
      }
    });
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

  /**
   * Gibt eine zufällige leere Hex-Koordinate innerhalb des gültigen Spielfeldbereichs zurück.
   * Der gültige Bereich sind alle Felder, die nicht besetzt sind und mindestens einen besetzten Nachbarn haben (also angrenzend an bestehende Tiles liegen).
   * @returns {HexCoord | null}
   */
  getRandomEmptyHexCoord() {
    // Bekomme alle leeren Felder mit Nachbarn
    const emptyHexCoords = this.getAllEmptyHexCoordsWithNeighbour();

    if (emptyHexCoords.length === 0) {
      return null;
    }

    // Wähle zufällig eine Kandidaten-Koordinate.
    const randomIndex = Math.floor(Math.random() * emptyHexCoords.length);
    return emptyHexCoords[randomIndex];
  }

  /**
   * Gibt alle besetzten Hex-Nachbarn für ein HexCoord zurück.
   * Hinweis: Diese Methode wird verwendet, um sicherzustellen, dass neue Tiles nur neben bestehenden Tiles platziert werden können, was eine zusammenhängende Spielfläche gewährleistet.
   * @param {HexCoord} hexCoord Hex-Koordinate, für die besetzte Nachbarn gesucht werden sollen.
   * @returns {HexCoord[]} Liste aller benachbarten Hex-Koordinaten, die im Grid besetzt sind.
   */
  getOccupiedNeighbours(hexCoord) {
    const occupiedNeighbours = [];
    const neighbours = hexCoord.getNeighbors();
    for (const neighbour of neighbours) {
      if (this.isOccupied(neighbour)) {
        occupiedNeighbours.push(neighbour);
      }
    }
    return occupiedNeighbours;
  }

  /**
   * Gibt alle leeren Hex-Nachbarn für ein HexCoord zurück.
   * Hinweis: Diese Methode wird verwendet, um mögliche Platzierungsoptionen für neue Tiles zu ermitteln.
   * @param {HexCoord} hexCoord Hex-Koordinate, für die leere Nachbarn gesucht werden sollen.
   * @returns {HexCoord[]} Liste aller benachbarten Hex-Koordinaten, die im Grid nicht besetzt sind, aber mindestens einen besetzten Nachbarn haben (also gültige Platzierungsoptionen).
   */
  getUnoccupiedNeighbours(hexCoord) {
    const emptyNeighbours = [];
    const neighbours = hexCoord.getNeighbors();
    for (const neighbour of neighbours) {
      if (
        !this.isOccupied(neighbour) && // Wenn Nachbar frei ist
        this.hasOccupiedNeighbour(neighbour)
      ) {
        // Und mindestens einen platzierten Nachbarn hat
        emptyNeighbours.push(neighbour);
      }
    }
    return emptyNeighbours;
  }

  /**
   * Gibt eine Hex-Koordinate eines zufälligen freien Nachbarn zurück, der an das angegebene HexCoord angrenzt.
   * Hinweis: Aktuell wird davon ausgegangen, dass das angegebene HexCoord mindestens einen freien Nachbarn hat, der an ein besetztes Feld angrenzt.
   * Es gibt keine Garantie, dass dies immer der Fall ist, daher gibt die Methode `null` zurück, wenn keine gültigen Nachbarn gefunden werden.
   * @param {HexCoord} hexCoord Hex-Koordinate, für die ein freier Nachbar gesucht werden soll.
   * @returns {HexCoord | null}
   */
  getRandomUnoccupiedNeighbour(hexCoord) {
    const emptyNeighbours = this.getUnoccupiedNeighbours(hexCoord);
    if (emptyNeighbours.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * emptyNeighbours.length);
    return emptyNeighbours[randomIndex];
  }

  /**
   * Prüft, ob die angegebene Hex-Koordinate mindestens einen besetzten Nachbarn hat.
   * @returns {boolean} true, wenn mindestens ein benachbartes HexCoord besetzt ist, sonst false.
   */
  hasOccupiedNeighbour(hexCoord) {
    for (const neighbour of hexCoord.getNeighbors()) {
      if (this.isOccupied(neighbour)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @returns {HexCoord[]} Gibt alle Hex-Koordinaten zurück, die derzeit nicht besetzt sind, aber mindestens einen besetzten Nachbarn haben.
   * Gibt null zurück, wenn keine solchen Koordinaten gefunden werden.
   */
  getAllEmptyHexCoordsWithNeighbour() {
    const keys = Array.from(this.grid.keys());
    if (keys.length === 0) {
      return [];
    }

    const seen = new Set();
    const emptyNeighborCandidates = [];

    for (const placedHexCoord of keys) {
      for (const neighbor of placedHexCoord.getNeighbors()) {
        // Überspringen, wenn bereits belegt.
        if (this.isOccupied(neighbor)) {
          continue;
        }

        const key = neighbor.hashCode();
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        emptyNeighborCandidates.push(neighbor);
      }
    }

    if (emptyNeighborCandidates.length === 0) {
      return null;
    }

    //this.paintBlueprints(emptyNeighborCandidates);
    return emptyNeighborCandidates;
  }

  /**
   * Chronologische Abfolge bei der Suche nach dem bestmöglichen HexCoord in Richtung eines Welt-Vektors
   * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
   * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert.
   * @param {boolean} onlyDirectNeighbours Wenn true, werden nur die direkt benachbarten Hexes geprüft.
   * Ansonsten wird zuerst eine hexagonale Suche entlang der 6 Hauptachsen durchgeführt und erst als Fallback werden die direkten Nachbarn geprüft.
   * @returns {HexCoord | null} Die Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
   */
  getHexCoordInWorldDirection(
    hexCoord,
    direction,
    onlyDirectNeighbours = false,
  ) {
    if (onlyDirectNeighbours) {
      const directNeighbours = this.getDirectNeighbourInWorldDirection(
        hexCoord,
        direction,
      );
      return directNeighbours;
    }

    const hexagonalSearchResult = this.tryGetHexagonalPosition(
      hexCoord,
      direction,
      10,
    );
    if (hexagonalSearchResult) {
      return hexagonalSearchResult;
    }

    console.log(
      "No hexagonal movement found, trying direct neighbour search as fallback.",
    );
    const directNeighbours = this.getDirectNeighbourInWorldDirection(
      hexCoord,
      direction,
    );
    return directNeighbours;
  }

  /**
   * Prüft nur die direkt benachbarten Hexes und berechnet, welcher von ihnen am besten in die angegebene Richtung zeigt.
   * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
   * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert.
   * @returns {HexCoord | null} Die direkt benachbarte Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
   */
  getDirectNeighbourInWorldDirection(hexCoord, direction) {
    const neighbours = this.getUnoccupiedNeighbours(hexCoord);

    if (neighbours.length === 0) return null;

    // Referenz-Weltposition des Start-Hex
    const originPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

    const dirNormalized = new THREE.Vector2(
      direction.x,
      direction.y,
    ).normalize();

    if (dirNormalized.lengthSq() === 0) {
      return null;
    }

    let bestNeighbour = null;
    let bestSimilarity = -1;
    let bestVector = new THREE.Vector2();
    for (const neighbour of neighbours) {
      const neighbourPos = neighbour.hexToWorld(neighbour, this.hexSize);

      const neighbourDir = new THREE.Vector2(
        neighbourPos.x - originPos.x,
        neighbourPos.z - originPos.z,
      ).normalize();

      const similarity = this.getDirectionSimilarity(
        dirNormalized,
        neighbourDir,
      );
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestNeighbour = neighbour;
        bestVector = neighbourDir;
      }
    }

    return bestNeighbour;
  }

  /**
   * Versucht, eine freie Hex-Koordinate in der angegebenen Richtung zu finden, indem entlang der 6 Hauptachsen des Hex-Grids gesucht wird.
   * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
   * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert.
   * @returns {HexCoord | null} Die Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
   */
  tryGetHexagonalPosition(hexCoord, direction, maxDistance = 10) {
    const hexDirection = this.getHexagonalMovementForDirection(direction);

    if (!hexDirection) {
      return null;
    }

    return this.tryGetHexagonalPositionInHexDirection(
      hexCoord,
      hexDirection,
      maxDistance,
    );
  }

  /**
   * Nimmt Welt-Vektor-Input entgegen und wandelt ihn in die nächstliegende Hex-Richtung um, die eine der 6 Hauptachsen des Hex-Grids repräsentiert.
   * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem. Wird relativ zum Kamerawinkel interpretiert.
   * @returns {HexCoord | null} Ein HexCoord, das die Richtung repräsentiert (z.B. (1,0), (0,1), (-1,1) etc.), oder null bei ungültigem Input.
   */
  getHexagonalMovementForDirection(direction) {
    if (
      !direction ||
      typeof direction.x !== "number" ||
      typeof direction.y !== "number"
    ) {
      console.warn(
        "getHexagonalMovementForDirection expects Vector2-like direction:",
        direction,
      );
      return null;
    }

    const angle = Math.atan2(direction.y, direction.x);

    const sector = Math.round(angle / (Math.PI / 3));
    const directions = HexCoord.Directions;

    return directions[(sector + 6) % 6];
  }

  /**
   * Versucht, eine freie Hex-Koordinate in der angegebenen Hex-Richtung zu finden.
   * @param {HexCoord} hexCoord - Ausgangsposition
   * @param {HexCoord} hexDirection - Richtung im Hex-Grid
   * @param {number} maxDistance - Maximale Distanz (in Hex-Feldern), die durchsucht werden soll
   * @returns {HexCoord | null} Die erste gefundene freie Hex-Koordinate oder null, wenn keine gefunden wurde
   */
  tryGetHexagonalPositionInHexDirection(
    hexCoord,
    hexDirection,
    maxDistance = 10,
  ) {
    if (!hexCoord || !hexDirection) {
      return null;
    }

    let current = hexCoord;

    for (let i = 0; i < maxDistance; i++) {
      current = new HexCoord(
        current.column + hexDirection.column,
        current.row + hexDirection.row,
      );

      if (!this.isOccupied(current) && this.hasOccupiedNeighbour(current)) {
        return current;
      }
    }

    return null;
  }

  /**
   * Gibt für jede der 6 Hauptachsen des Hex-Grids die erste freie Hex-Koordinate zurück, die in dieser Richtung liegt.
   * Diese Methode führt eine hexagonale Suche entlang jeder der 6 Hauptachsen durch und sammelt die ersten gültigen freien Hex-Koordinaten, die sie findet.
   * Sie ist nützlich, um dem Spieler mögliche Platzierungsoptionen in alle Richtungen anzuzeigen, z.B. durch das Platzieren von "Blueprint"-Modellen auf diesen Koordinaten.
   * @param {HexCoord} hexCoord - Ausgangsposition
   * @returns {HexCoord[]} Liste von validen Hex-Koordinaten. Kann leer sein, wenn keine gültigen Koordinaten gefunden wurden, was nur in einem leeren Grid vorkommen würde.
   */
  getFirstUnoccupiedHexInEachDirection(hexCoord) {
    const results = [];

    for (const hexDirection of HexCoord.Directions) {
      const result = this.tryGetHexagonalPositionInHexDirection(
        hexCoord,
        hexDirection,
        10,
      );

      if (result) {
        results.push(result);
      }
    }

    return results;
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
      const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);
      const hexTile = this.createHexTile(
        this.hexSize * 0.8, // etwas kleiner als die regulären Tiles
        0.05,
        color,
        1,
      );
      hexTile.position.set(worldPos.x, worldPos.y-0.15, worldPos.z);
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

        const pos = hexCoord.hexToWorld(hexCoord, this.hexSize);
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
   * Erstellt ein neues primitives Hex-Tile.
   * Wird beispielsweise für die Blueprint-Modelle verwendet.
   * @param {number} radius Der Radius des Hexagons (Abstand von der Mitte zu einer Ecke). Standard ist hexSize=1 harmoniert.
   * @param {number} height Die Höhe des Hex-Tiles.
   * @param {number} color Die Farbe des Hex-Tiles als Hexadezimalwert (z.B. 0x44aa44 für Grün).
   * @param {number} opacity Die Opazität des Hex-Tiles (0 = transparent, 1 = undurchsichtig).
   * @returns
   */
  createHexTile(radius = this.hexSize, height = 0.15, color = 0x44aa44, opacity = 1) {
    const geometry = new THREE.CylinderGeometry(
      radius, // radiusTop
      radius, // radiusBottom
      height, // height
      6, // radialSegments = Hexagon
    );

    const material = new THREE.MeshStandardMaterial({
      color: color,
      transparent: opacity < 1,
      opacity: opacity,
    });

    const hexTile = new THREE.Mesh(geometry, material);

    // Optional: besser für flache Hex-Grids ausrichten
    hexTile.rotation.y = Math.PI / 6;

    return hexTile;
  }

  /**
   * Berechnet die Ähnlichkeit zwischen zwei Richtungen.
   * Hinweis: Diese Methode wird verwendet, um zu bestimmen, welcher Nachbar am besten in die gewünschte Richtung zeigt, indem das Skalarprodukt der normalisierten Vektoren berechnet wird.
   * @param {THREE.Vector3} a Der erste Richtungsvektor
   * @param {THREE.Vector3} b Der zweite Richtungsvektor
   * @returns {number} Ähnlichkeitsmaß zwischen -1 und 1. 1 bedeutet gleiche Richtung, 0 bedeutet 90° zueinander, -1 bedeutet entgegengesetzt.
   */
  getDirectionSimilarity(a, b) {
    if (a.lengthSq() === 0 || b.lengthSq() === 0) {
      return 0;
    }

    return a.clone().normalize().dot(b.clone().normalize());
  }

  /**
   * Debug-Methode: Spawnt über jedem besetzten Tile ein Text-Mesh, das Informationen über das darauf befindliche Tier anzeigt.
   * Diese Methode wird aufgerufen, wenn Tiere auf Tiles gesetzt werden, um die Logik der Tierplatzierung zu veranschaulichen.
   * Sie entfernt zuerst alle vorhandenen Debug-Labels, um sicherzustellen, dass keine veralteten Informationen in der Szene verbleiben, und erstellt dann neue Labels basierend auf dem aktuellen Zustand des Grids.
   */
  async showAnimalDebugLabels() {
    this.clearAnimalDebugLabels();

    for (const [hexCoord, tile] of this.grid.entries()) {
      if (!tile || !tile.occupiedBy) {
        continue;
      }

      const animalText = String(tile.occupiedBy);

      const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

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
