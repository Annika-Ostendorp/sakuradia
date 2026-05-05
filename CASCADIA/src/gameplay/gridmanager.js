import HexCoord from "src/utils/hexcoord";
import Tile from "src/gameplay/tile";

/**
 * Speichert und verwaltet Grid-Daten für das Gameplay.
 *
 * Hinweis: Map-Keys werden per Referenz verglichen. Ein neu erzeugtes HexCoord
 * mit denselben Koordinaten ist nicht derselbe Key, sofern es nicht exakt
 * dasselbe Objekt ist.
 */
export default class GridManager {
    /**
     * Initialisiert Grid-Einstellungen und Datencontainer.
     */
    constructor() {
        /** Grösse des logischen Spielfelds in Zellen pro Achse. */
        this.gridSize = 10;
        /** Grösse einer Zelle im Weltkoordinatensystem. */
        this.cellSize = 1;

        /** Ordnet einem HexCoord-Key die zugehörige Tile-Instanz zu. */
        /** @type {Map<HexCoord, Tile>} */
        this.grid = new Map();
    }

    /**
     * Verknüpft ein Tile mit einer Hex-Koordinate.
     * @param {HexCoord} hexCoord
     * @param {Tile} tile
     */
    setTile(hexCoord, tile) {
        this.grid.set(hexCoord, tile);
    }

    /**
        * Gibt das Tile zur angegebenen Hex-Koordinate zurück.
     * @param {HexCoord} hexCoord
     * @returns {Tile | undefined}
     */
    getTile(hexCoord) {
        return this.grid.get(hexCoord);
    }
}