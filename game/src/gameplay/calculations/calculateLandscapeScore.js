import { Landscape } from "/src/data/Landscape.js";

export function calculateLandscapeScore(gridmanager, landscape) {
    const tilesWithLandscape = [];

    // Alle Tiles mit der gegebenen Landschaft sammeln
    for (const [hexCoord, tile] of gridmanager.grid.entries()) {
        if (tile.hasLandscape(landscape)) {
            tilesWithLandscape.push(hexCoord);
        }
    }
    return tilesWithLandscape.length;
}