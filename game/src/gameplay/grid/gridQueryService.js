// Diese Datei enthält Funktionen, die das aktuelle Spielfeld (Grid) abfragen,
// z.B. um gültige Platzierungen zu überprüfen.
import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import { Animal } from "/src/data/Animal.js";

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
 * Diese Methode wird verwendet, um sicherzustellen, dass neue Tiles nur neben bestehenden Tiles platziert werden können, was eine zusammenhängende Spielfläche gewährleistet.
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
 * Diese Methode wird verwendet, um mögliche Platzierungsoptionen für neue Tiles zu ermitteln.
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
 * Aktuell wird davon ausgegangen, dass es keine Situation mit weniger als einem freien Nachbarn gibt.
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
  isOccupied = false,
  animalIsAllowed = Animal.NONE,
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

  if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo) {
    console.log(
      "Hexagonal search did not find a valid position. Falling back to direct neighbours.",
    );
  }
  const directNeighbours = getDirectNeighbourInWorldDirection(
    gridManager,
    hexCoord,
    direction,
    (isOccupied = false),
  );
  return directNeighbours;
}

/**
 * Gibt die direkt benachbarte Hex-Koordinate zurück, die am besten in der angegebenen Welt-Richtung von der Ausgangs-Hex-Koordinate aus liegt.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} hexCoord Ausgangs-Hex-Koordinate, von der aus die Suche gestartet wird
 * @param {THREE.Vector2} direction Richtung im Weltkoordinatensystem, in die die Suche gehen soll. Wird relativ zum Kamerawinkel interpretiert
 * @returns {HexCoord | null} Die direkt benachbarte Hex-Koordinate, die am besten in der angegebenen Richtung liegt und frei ist. Null, wenn keine gültige Koordinate gefunden wird.
 */
export function getDirectNeighbourInWorldDirection(
  gridManager,
  hexCoord,
  direction,
  isOccupied = false,
) {
  const neighbours = isOccupied
    ? getOccupiedNeighbours(gridManager, hexCoord)
    : getUnoccupiedNeighbours(gridManager, hexCoord);

  if (neighbours.length === 0) return null;

  // Referenz-Weltposition des Start-Hex
  const originPos = hexCoord.hexToWorld(hexCoord, gridManager.hexSize);

  const dirNormalized = new THREE.Vector2(direction.x, direction.y).normalize();

  if (dirNormalized.lengthSq() === 0) {
    return null;
  }

  let bestNeighbour = null;
  let bestSimilarity = -1;
  let bestVector = new THREE.Vector2();
  for (const neighbour of neighbours) {
    const neighbourPos = neighbour.hexToWorld(neighbour, gridManager.hexSize);

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
 * Diese Methode wird verwendet, um zu bestimmen, welcher Nachbar am besten in die gewünschte Richtung zeigt, indem das Skalarprodukt der normalisierten Vektoren berechnet wird.
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

// Gibt die nächste erste Hex-Koordinate zurück, die von der Ausgangs-Hex-Koordinate
// basierend auf dem maximalen Abstand zu finden ist.
export function getFirstHexWithMaxDistance(
  gridManager,
  origin,
  isPlaced = false,
  occupiedBy = Animal.NONE,
  maxDistance = 23,
) {
  for (let distance = 1; distance <= maxDistance; distance++) {
    const hexAtDistance = getFirstHexAtDistance(
      gridManager,
      origin,
      isPlaced,
      occupiedBy,
      distance,
    );
    if (hexAtDistance) {
      return hexAtDistance;
    }
  }
  return null;
}

/**
 * Gibt das erste HexCoord zurück, das exakt `distance` Schritte vom Ursprung entfernt ist
 * und dem occupied-Filter entspricht.
 *
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {HexCoord} origin - Ausgangs-Hex-Koordinate
 * @param {number} distance - Abstand in Hex-Schritten
 * @param {boolean} isPlaced - true = suche besetztes Feld, false = suche freies Feld
 * @returns {HexCoord | null}
 */
function getFirstHexAtDistance(
  gridManager,
  origin,
  isPlaced = false,
  occupiedBy = Animal.NONE,
  distance,
) {
  if (!gridManager || !origin || distance < 0) {
    return null;
  }

  if (distance === 0) {
    return gridManager.isOccupied(origin) === isPlaced ? origin : null;
  }

  // Start at one corner of the hex ring.
  // Direction[4] is (-1, 1), so this moves `distance` steps to the upper-left corner.
  let current = HexCoord.add(
    origin,
    scaleHexCoord(HexCoord.Directions[4], distance),
  );

  // Für jede Seite des Hex-Rings (6 Hauptachsen)
  for (const direction of HexCoord.Directions) {
    // Gehe genau `distance` Felder entlang dieser Seite:
    for (let step = 0; step < distance; step++) {
      // Checke ob das aktuelle HexCoord dem occupied-Filter entspricht. Wenn ja, gib es zurück.
      const doesNotWantOccupancy =
        isPlaced === false && gridManager.isOccupied(current) === false;
      const wantsSpecificOccupancy =
        isPlaced === true &&
        gridManager.getTileAt(current)?.occupiedBy === occupiedBy;
      if (doesNotWantOccupancy || wantsSpecificOccupancy) {
        return current;
      }

      // Move one hex forward along the current side.
      current = HexCoord.add(current, direction);
    }
  }

  return null;
}

/**
 * Multiplies a HexCoord direction by a factor.
 *
 * @param {HexCoord} hexCoord - Direction or coordinate to scale
 * @param {number} factor - Multiplier
 * @returns {HexCoord}
 */
function scaleHexCoord(hexCoord, factor) {
  return new HexCoord(hexCoord.column * factor, hexCoord.row * factor);
}

/**
 * Finds the most intuitive movement target for the preview tile.
 *
 * This looks at all valid tile placement positions and chooses the one that
 * best matches the player's input direction.
 *
 * @param {GridManager} gridManager - The grid manager instance
 * @param {HexCoord} currentHexCoord - Current preview tile position
 * @param {THREE.Vector2} worldDirection - Camera-relative movement direction
 * @returns {HexCoord | null}
 */
export function getPreviewAnimalMovementTarget(
  gridManager,
  currentHexCoord,
  worldDirection,
  animal,
) {
  const candidates = getUnoccupiedHexCoordsWithAllowedAnimal(
    gridManager,
    animal,
  );
  if (DebugConfig.enabled && DebugConfig.doLogSmallInfo) {
    console.log(
      `Found ${candidates.length} candidate hexes for animal ${animal}:`,
      candidates,
    );
  }
  const maxHexDistance = 25;
  const minSimilarity = 0.2;

  return getBestHexCoordInWorldDirectionFromCandidates(
    gridManager,
    currentHexCoord,
    worldDirection,
    candidates,
    minSimilarity,
    maxHexDistance,
  );
}

/**
 * Gibt eine Liste aller Hex-Koordinaten zurück, die derzeit nicht besetzt sind,
 * aber das angegebene Tier erlauben.
 * @param {GridManager} gridManager - Die Instanz des Grid-Managers
 * @param {*} animal Das Tier, für das die erlaubten Hex-Koordinaten gefunden werden sollen
 * @returns {HexCoord[]}
 */
function getUnoccupiedHexCoordsWithAllowedAnimal(gridManager, animal) {
  const keys = Array.from(gridManager.grid.keys());

  const allowedCoords = [];

  for (const hexCoord of keys) {
    const tile = gridManager.getTileAt(hexCoord);
    if (
      tile &&
      tile.occupiedBy === Animal.NONE &&
      tile.animalIsAllowed(animal)
    ) {
      allowedCoords.push(hexCoord);
    }
  }
  return allowedCoords;
}

/**
 * Finds the most intuitive target HexCoord from a list of candidates,
 * based on a world-space input direction.
 *
 * This does not walk along one hex axis. Instead, it ranks all valid candidates
 * by how well they match the desired movement direction.
 *
 * @param {GridManager} gridManager - The grid manager instance
 * @param {HexCoord} originHexCoord - Current preview position
 * @param {THREE.Vector2} worldDirection - Camera-relative movement direction in world X/Z
 * @param {HexCoord[]} candidates - Possible target hexes
 * @param {number} minSimilarity - Minimum directional similarity. Higher = stricter.
 * @param {number} maxHexDistance - Maximum allowed jump distance in hex steps
 * @returns {HexCoord | null}
 */
function getBestHexCoordInWorldDirectionFromCandidates(
  gridManager,
  originHexCoord,
  worldDirection,
  candidates,
  minSimilarity = 0.2,
  maxHexDistance = 99,
) {
  if (!gridManager || !originHexCoord || !worldDirection || !candidates) {
    console.error(
      "getBestHexCoordInWorldDirectionFromCandidates received invalid arguments:",
      { gridManager, originHexCoord, worldDirection, candidates },
    );
    return null;
  }

  if (candidates.length === 0) {
    return null;
  }

  if (worldDirection.lengthSq() === 0) {
    console.error(
      "getBestHexCoordInWorldDirectionFromCandidates received a zero-length world direction:",
      { worldDirection },
    );
    return null;
  }

  const originWorld = originHexCoord.hexToWorld(
    originHexCoord,
    gridManager.hexSize,
  );

  let bestHexCoord = null;
  let bestScore = -Infinity;

  for (const candidate of candidates) {
    if (!candidate || candidate.equals(originHexCoord)) {
      continue;
    }

    const hexDistance = HexCoord.distance(originHexCoord, candidate);

    if (hexDistance > maxHexDistance) {
      continue;
    }

    const candidateWorld = candidate.hexToWorld(candidate, gridManager.hexSize);

    const toCandidate = new THREE.Vector2(
      candidateWorld.x - originWorld.x,
      candidateWorld.z - originWorld.z,
    );

    if (toCandidate.lengthSq() === 0) {
      continue;
    }

    const worldDistance = toCandidate.length();

    toCandidate.normalize();

    const similarity = worldDirection.dot(toCandidate);

    // Ignore candidates that are too far away from the intended direction.
    if (similarity < minSimilarity) {
      continue;
    }

    // Main priority: direction match.
    // Secondary priority: prefer closer fields.
    const score = similarity * 1000 - hexDistance * 10 - worldDistance;

    if (score > bestScore) {
      bestScore = score;
      bestHexCoord = candidate;
    }
  }

  return bestHexCoord;
}

export function getClosestHexCoordFromList(hexCoords, originHexCoord) {
  if (!hexCoords || hexCoords.length === 0 || !originHexCoord) {
    return null;
  }

  let closestHexCoord = null;
  let closestDistance = Infinity;

  for (const hexCoord of hexCoords) {
    const distance = HexCoord.distance(originHexCoord, hexCoord);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestHexCoord = hexCoord;
    }
  }

  return closestHexCoord;
}