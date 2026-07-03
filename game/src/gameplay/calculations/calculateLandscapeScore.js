/**
 * Calculates the landscape score for one landscape type.
 *
 * Score = size of the biggest connected group of tiles
 * that contain the given landscape.
 *
 * Two tiles count as connected only if the landscape touches
 * the shared edge on both tiles.
 */
export function calculateLandscapeScore(gridManager, landscape) {
  if (!gridManager || !gridManager.grid) {
    console.warn("calculateLandscapeScore: gridManager or grid is missing.");
    return 0;
  }

  const visited = new Set();
  let maxGroupSize = 0;

  for (const [coord, tile] of gridManager.grid.entries()) {
    if (!tile || typeof tile.hasLandscape !== "function") {
      continue;
    }

    if (!tile.hasLandscape(landscape)) {
      continue;
    }

    const hexCoord = normalizeHexCoord(coord);

    if (!hexCoord) {
      console.warn("calculateLandscapeScore: invalid hexCoord in grid:", coord);
      continue;
    }

    const coordKey = getHexCoordKey(hexCoord);

    if (visited.has(coordKey)) {
      continue;
    }

    const groupSize = getConnectedLandscapeGroupSize(
      gridManager,
      hexCoord,
      landscape,
      visited,
    );

    maxGroupSize = Math.max(maxGroupSize, groupSize);
  }

  return maxGroupSize;
}

/**
 * Finds the size of one connected landscape group.
 * Uses an iterative DFS instead of recursion to avoid stack problems.
 */
function getConnectedLandscapeGroupSize(
  gridManager,
  startHexCoord,
  landscape,
  visited,
) {
  const stack = [startHexCoord];
  let groupSize = 0;

  while (stack.length > 0) {
    const currentHexCoord = stack.pop();
    const currentKey = getHexCoordKey(currentHexCoord);

    if (visited.has(currentKey)) {
      continue;
    }

    const currentTile = gridManager.getTileAt(currentHexCoord);

    if (!currentTile || !currentTile.hasLandscape(landscape)) {
      continue;
    }

    visited.add(currentKey);
    groupSize++;

    for (let direction = 0; direction < HEX_DIRECTIONS.length; direction++) {
      const neighbourHexCoord = getNeighbourHexCoord(
        currentHexCoord,
        direction,
      );
      const neighbourKey = getHexCoordKey(neighbourHexCoord);

      if (visited.has(neighbourKey)) {
        continue;
      }

      const neighbourTile = gridManager.getTileAt(neighbourHexCoord);

      if (!neighbourTile || !neighbourTile.hasLandscape(landscape)) {
        continue;
      }

      if (
        areTilesConnectedByLandscape(
          currentTile,
          neighbourTile,
          direction,
          landscape,
        )
      ) {
        stack.push(neighbourHexCoord);
      }
    }
  }

  return groupSize;
}

/**
 * Direction order must match your tile landscape direction system.
 *
 * Based on your known HexCoord direction system:
 * 0: ( 1,  0)
 * 1: ( 1, -1)
 * 2: ( 0, -1)
 * 3: (-1,  0)
 * 4: (-1,  1)
 * 5: ( 0,  1)
 */
const HEX_DIRECTIONS = [
  { column: 1, row: 0 },
  { column: 1, row: -1 },
  { column: 0, row: -1 },
  { column: -1, row: 0 },
  { column: -1, row: 1 },
  { column: 0, row: 1 },
];

function getNeighbourHexCoord(hexCoord, direction) {
  const offset = HEX_DIRECTIONS[direction];

  return createHexCoordLike(
    hexCoord,
    hexCoord.column + offset.column,
    hexCoord.row + offset.row,
  );
}

/**
 * Creates a new coordinate using the same class as the original HexCoord.
 * This avoids import path problems with HexCoord.
 */
function createHexCoordLike(originalHexCoord, column, row) {
  return new originalHexCoord.constructor(column, row);
}

/**
 * Checks whether two neighbouring tiles are connected by the given landscape.
 *
 * direction = direction from origin tile to target tile.
 * oppositeDirection = matching side on the neighbour tile.
 */
function areTilesConnectedByLandscape(
  originTile,
  targetTile,
  direction,
  landscape,
) {
  if (
    !originTile ||
    !targetTile ||
    typeof originTile.getLandscapeDirections !== "function" ||
    typeof targetTile.getLandscapeDirections !== "function"
  ) {
    return false;
  }

  console.log("CHECK CONNECTION", {
    landscape,
    direction,
    oppositeDirection: (direction + 3) % 6,
    originRotation: originTile.rotation,
    originDirections: originTile.getLandscapeDirections(landscape),
    targetRotation: targetTile.rotation,
    targetDirections: targetTile.getLandscapeDirections(landscape),
    connected:
      originTile.getLandscapeDirections(landscape).includes(direction) &&
      targetTile
        .getLandscapeDirections(landscape)
        .includes((direction + 3) % 6),
  });

  const originDirections = originTile.getLandscapeDirections(landscape);
  const targetDirections = targetTile.getLandscapeDirections(landscape);

  if (!Array.isArray(originDirections) || !Array.isArray(targetDirections)) {
    return false;
  }

  const oppositeDirection = (direction + 3) % 6;

  return (
    originDirections.includes(direction) &&
    targetDirections.includes(oppositeDirection)
  );
}

/**
 * Creates a stable key for a HexCoord.
 * Do not use Set<HexCoord> directly, because JS compares objects by reference.
 */
function getHexCoordKey(hexCoord) {
  return `${hexCoord.column},${hexCoord.row}`;
}

/**
 * Accepts anything that behaves like a HexCoord.
 * Your console showed: HexCoord { column: 0, row: -1 }
 * So checking for getNeighbours() was too strict.
 */
function normalizeHexCoord(coord) {
  if (!coord) {
    return null;
  }

  if (
    typeof coord === "object" &&
    typeof coord.column === "number" &&
    typeof coord.row === "number"
  ) {
    return coord;
  }

  console.warn(
    "normalizeHexCoord: Grid key does not contain numeric column and row.",
    coord,
  );

  return null;
}
