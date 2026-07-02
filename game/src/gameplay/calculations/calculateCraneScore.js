import { Animal } from "/src/data/Animal.js";

export function calculateCraneScore(gridmanager) {
  let craneCount = 0;

  // Gehe durch jedes Tile im Grid
  for (const [hexCoord, tile] of gridmanager.grid.entries()) {
    // Prüfe, ob auf dem aktuellen Tile ein Kranich ist
    if (tile.occupiedBy !== Animal.CRANE) {
      continue;
    }

    let hasCraneNeighbor = false;

    // Bekomme Liste mit allen Nachbarfeldern des aktuellen Kranichs
    for (const neighborCoord of hexCoord.getNeighbors()) {
      const neighborTile = gridmanager.getTileAt(neighborCoord);

      // Prüfe, ob auf einem Nachbarfeld auch ein Kranich liegt
      if (neighborTile && neighborTile.occupiedBy === Animal.CRANE) {
        hasCraneNeighbor = true;
        break;
      }
    }

    // Wenn kein Kranich-Nachbar gefunden wurde, zählt dieser Kranich
    if (!hasCraneNeighbor) {
      craneCount++;
    }
  }

  return getPointsForCraneCount(craneCount);
}

// Je nach Anzahl der Kraniche ohne Nachbarn gibt es unterschiedliche Punkte.
// Diese Werte sind vom Basis-Spiel übernommen.
function getPointsForCraneCount(count) {
  if (count >= 8) return 26; // Maximalpunktzahl für 8 oder mehr Kraniche ohne Nachbarn

  switch (count) {
    case 1:
      return 2;
    case 2:
      return 5;
    case 3:
      return 8;
    case 4:
      return 11;
    case 5:
      return 14;
    case 6:
      return 18;
    case 7:
      return 22;
    default:
      return 0;
  }
}
