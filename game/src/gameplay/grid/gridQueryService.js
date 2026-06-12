// Diese Datei enthält Funktionen, die das aktuelle Spielfeld (Grid) abfragen,
// z.B. um gültige Platzierungen zu überprüfen.
import * as THREE from "three";
import HexCoord from "../../utils/HexCoord.js";

/**
 * Gibt eine zufällige leere Hex-Koordinate innerhalb des gültigen Spielfeldbereichs zurück.
 * Der gültige Bereich sind alle Felder, die nicht besetzt sind und mindestens einen besetzten Nachbarn haben (also angrenzend an bestehende Tiles liegen).
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @returns {HexCoord | null}
 */
export function getRandomEmptyHexCoord(gridManager) {
  // Bekomme alle leeren Felder mit Nachbarn
  const emptyHexCoords = getAllEmptyHexCoordsWithNeighbour(gridManager);

  // Wenn es keine gibt, gib null zurück.
  if (emptyHexCoords.length === 0) {
    return null;
  }

  // Wähle zufällig eine Hex-Koordinate.
  const randomIndex = Math.floor(Math.random() * emptyHexCoords.length);
  return emptyHexCoords[randomIndex];
}

/**
 * Gibt alle besetzten Hex-Nachbarn für ein HexCoord zurück.
 * Hinweis: Diese Methode wird verwendet, um sicherzustellen, dass neue Tiles nur neben bestehenden Tiles platziert werden können, was eine zusammenhängende Spielfläche gewährleistet.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Hex-Koordinate, für die besetzte Nachbarn gesucht werden sollen
 * @returns {HexCoord[]} Liste aller benachbarten Hex-Koordinaten, die im Grid besetzt sind.
 */
export function getOccupiedNeighbours(gridManager, hexCoord) {
  // Neue Liste
  const occupiedNeighbours = [];

  // Bekomme alle Hex-Nachbarn
  const neighbours = hexCoord.getNeighbors();

  // Für jeden Nachbarn
  for (const neighbour of neighbours) {
    // Füge besetzte Nachbarn zur Liste hinzu
    if (gridManager.isOccupied(neighbour)) {
      occupiedNeighbours.push(neighbour);
    }
  }

  // Gebe Liste mit besetzten Nachbarn zurück
  return occupiedNeighbours;
}

/**
 * Gibt alle leeren Hex-Nachbarn für ein HexCoord zurück.
 * Hinweis: Diese Methode wird verwendet, um mögliche Platzierungsoptionen für neue Tiles zu ermitteln.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Hex-Koordinate, für die leere Nachbarn gesucht werden sollen
 * @returns {HexCoord[]} Liste aller benachbarten Hex-Koordinaten, die im Grid nicht besetzt sind, aber mindestens einen besetzten Nachbarn haben (also gültige Platzierungsoptionen).
 */
export function getUnoccupiedNeighbours(gridManager, hexCoord) {
  // Neue Liste
  const emptyNeighbours = [];

  // Bekomme alle Hex-Nachbarn
  const neighbours = hexCoord.getNeighbors();

  // Für jeden Nachbarn
  for (const neighbour of neighbours) {
    if (
      !gridManager.isOccupied(neighbour) && // Wenn Nachbar frei ist und
      hasOccupiedNeighbour(gridManager, neighbour) // wenn Nachbar mindestens einen platzierten Nachbarn hat
    ) {
      // Füge ihn zur Liste der leeren Nachbarn hinzu
      emptyNeighbours.push(neighbour);
    }
  }

  // Gebe Liste mit leeren Nachbarn zurück
  return emptyNeighbours;
}

/**
 * Gibt eine Hex-Koordinate eines zufälligen freien Nachbarn zurück, der an das angegebene HexCoord angrenzt.
 * Hinweis: Aktuell wird davon ausgegangen, dass das angegebene HexCoord mindestens einen freien Nachbarn hat, der an ein besetztes Feld angrenzt.
 * Es gibt keine Garantie, dass dies immer der Fall ist, daher gibt die Methode `null` zurück, wenn keine gültigen Nachbarn gefunden werden.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Hex-Koordinate, für die ein freier Nachbar gesucht werden soll
 * @returns {HexCoord | null}
 */
export function getRandomUnoccupiedNeighbour(gridManager, hexCoord) {
  // Bekomme alle freien Nachbarn
  const emptyNeighbours = getUnoccupiedNeighbours(gridManager, hexCoord);

  // Wenn es keine gibt, gib null zurück.
  if (emptyNeighbours.length === 0) {
    return null;
  }
  // Wähle zufällig eine der Hex-Koordinaten.
  const randomIndex = Math.floor(Math.random() * emptyNeighbours.length);

  // Gebe die zufällig ausgewählte Hex-Koordinate zurück.
  return emptyNeighbours[randomIndex];
}

/**
 * Prüft, ob die angegebene Hex-Koordinate mindestens einen besetzten Nachbarn hat.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @returns {boolean} true, wenn mindestens ein benachbartes HexCoord besetzt ist, sonst false.
 */
export function hasOccupiedNeighbour(gridManager, hexCoord) {
  // Für jeden Nachbarn der Hex-Koordinate
  for (const neighbour of hexCoord.getNeighbors()) {
    // Wenn der Nachbar besetzt ist
    if (gridManager.isOccupied(neighbour)) {
      return true; // Gib true zurück
    }
  }

  // Wenn es keinen besetzten Nachbarn gibt, gib false zurück
  return false;
}

/**
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @returns {HexCoord[]} Gibt alle Hex-Koordinaten zurück, die derzeit nicht besetzt sind, aber mindestens einen besetzten Nachbarn haben.
 * Gibt null zurück, wenn keine solchen Koordinaten gefunden werden.
 */
export function getAllEmptyHexCoordsWithNeighbour(gridManager) {
  const keys = Array.from(gridManager.grid.keys());
  if (keys.length === 0) {
    return [];
  }

  const seen = new Set();
  const emptyNeighborCandidates = [];

  for (const placedHexCoord of keys) {
    for (const neighbor of placedHexCoord.getNeighbors()) {
      // Überspringen, wenn bereits belegt.
      if (gridManager.isOccupied(neighbor)) {
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

  //paintBlueprints(emptyNeighborCandidates);
  return emptyNeighborCandidates;
}

/**
 * Chronologische Abfolge bei der Suche nach dem bestmöglichen HexCoord in Richtung eines Welt-Vektors
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
 * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert
 * @param {boolean} onlyDirectNeighbours Wenn true, werden nur die direkt benachbarten Hexes geprüft.
 * Ansonsten wird zuerst eine hexagonale Suche entlang der 6 Hauptachsen durchgeführt und erst als Fallback werden die direkten Nachbarn geprüft
 * @returns {HexCoord | null} Die Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
 */
export function getHexCoordInWorldDirection(
  gridManager,
  hexCoord,
  direction,
  onlyDirectNeighbours = false,
) {
  if (onlyDirectNeighbours) {
    const directNeighbours = getDirectNeighbourInWorldDirection(
      gridManager,
      hexCoord,
      direction,
    );
    return directNeighbours;
  }

  const hexagonalSearchResult = tryGetHexagonalPosition(
    gridManager,
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
  const directNeighbours = getDirectNeighbourInWorldDirection(
    gridManager,
    hexCoord,
    direction,
  );
  return directNeighbours;
}

/**
 * Prüft nur die direkt benachbarten Hexes und berechnet, welcher von ihnen am besten in die angegebene Richtung zeigt.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
 * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert
 * @returns {HexCoord | null} Die direkt benachbarte Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
 */
export function getDirectNeighbourInWorldDirection(
  gridManager,
  hexCoord,
  direction,
) {
  const neighbours = getUnoccupiedNeighbours(gridManager, hexCoord);

  if (neighbours.length === 0) return null;

  // Referenz-Weltposition des Start-Hex
  const originPos = hexCoord.hexToWorld(hexCoord, gridManager.getHexSize());

  const dirNormalized = new THREE.Vector2(direction.x, direction.y).normalize();

  if (dirNormalized.lengthSq() === 0) {
    return null;
  }

  let bestNeighbour = null;
  let bestSimilarity = -1;
  let bestVector = new THREE.Vector2();
  for (const neighbour of neighbours) {
    const neighbourPos = neighbour.hexToWorld(
      neighbour,
      gridManager.getHexSize(),
    );

    const neighbourDir = new THREE.Vector2(
      neighbourPos.x - originPos.x,
      neighbourPos.z - originPos.z,
    ).normalize();

    const similarity = getDirectionSimilarity(dirNormalized, neighbourDir);
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
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
 * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert
 * @returns {HexCoord | null} Die Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
 */
export function tryGetHexagonalPosition(
  gridManager,
  hexCoord,
  direction,
  maxDistance = 10,
) {
  const hexDirection = getHexagonalMovementForDirection(direction);

  if (!hexDirection) {
    return null;
  }

  return tryGetHexagonalPositionInHexDirection(
    gridManager,
    hexCoord,
    hexDirection,
    maxDistance,
  );
}

/**
 * Gibt für jede der 6 Hauptachsen des Hex-Grids die erste freie Hex-Koordinate zurück, die in dieser Richtung liegt.
 * Diese Methode führt eine hexagonale Suche entlang jeder der 6 Hauptachsen durch und sammelt die ersten gültigen freien Hex-Koordinaten, die sie findet.
 * Sie ist nützlich, um dem Spieler mögliche Platzierungsoptionen in alle Richtungen anzuzeigen, z.B. durch das Platzieren von "Blueprint"-Modellen auf diesen Koordinaten.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord - Ausgangsposition
 * @returns {HexCoord[]} Liste von validen Hex-Koordinaten. Kann leer sein, wenn keine gültigen Koordinaten gefunden wurden, was nur in einem leeren Grid vorkommen würde.
 */
export function getFirstUnoccupiedHexInEachDirection(gridManager, hexCoord) {
  const results = [];

  for (const hexDirection of HexCoord.Directions) {
    const result = tryGetHexagonalPositionInHexDirection(
      gridManager,
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
 * Versucht, eine freie Hex-Koordinate in der angegebenen Hex-Richtung zu finden.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord - Ausgangsposition
 * @param {HexCoord} hexDirection - Richtung im Hex-Grid
 * @param {number} maxDistance - Maximale Distanz (in Hex-Feldern), die durchsucht werden soll
 * @returns {HexCoord | null} Die erste gefundene freie Hex-Koordinate oder null, wenn keine gefunden wurde
 */
export function tryGetHexagonalPositionInHexDirection(
  gridManager,
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

    if (
      !gridManager.getTileAt(current) &&
      gridManager.hasOccupiedNeighbour(current)
    ) {
      return current;
    }
  }

  return null;
}

/**
 * Nimmt Welt-Vektor-Input entgegen und wandelt ihn in die nächstliegende Hex-Richtung um, die eine der 6 Hauptachsen des Hex-Grids repräsentiert.
 * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem. Wird relativ zum Kamerawinkel interpretiert
 * @returns {HexCoord | null} Ein HexCoord, das die Richtung repräsentiert (z.B. (1,0), (0,1), (-1,1) etc.), oder null bei ungültigem Input.
 */
export function getHexagonalMovementForDirection(direction) {
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
 * Berechnet die Ähnlichkeit zwischen zwei Richtungen.
 * Hinweis: Diese Methode wird verwendet, um zu bestimmen, welcher Nachbar am besten in die gewünschte Richtung zeigt, indem das Skalarprodukt der normalisierten Vektoren berechnet wird.
 * @param {THREE.Vector3} a Der erste Richtungsvektor
 * @param {THREE.Vector3} b Der zweite Richtungsvektor
 * @returns {number} Ähnlichkeitsmaß zwischen -1 und 1. 1 bedeutet gleiche Richtung, 0 bedeutet 90° zueinander, -1 bedeutet entgegengesetzt.
 */
function getDirectionSimilarity(a, b) {
  if (a.lengthSq() === 0 || b.lengthSq() === 0) {
    return 0;
  }

  return a.clone().normalize().dot(b.clone().normalize());
}
