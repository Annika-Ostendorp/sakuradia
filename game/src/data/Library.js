import Landscape from "./Landscape.js";
import Animal from "./Animal.js";
import { TileData, StarterTileData } from "../gameplay/Tile.js";

export default class Library {
    /**
     * Backward-compatible static accessor used by legacy callers.
     * @returns {Array<TileData>}
     */
    getTileDataList() {
        return this.getAllTiles();
    }

    /**
     * Backward-compatible static accessor used by legacy callers.
     * @returns {Array<StarterTileData>}
     */
    getStarterTileDataList() {
        return this.getAllStarterTiles();
    }

    /**
     * Returns a hard-coded collection of TileData-like objects used for
     * quick testing and prototyping.
     * Each entry is an instance of the local `TileData` class below.
     * @returns {Array<TileData>}
     */
    getAllTiles() {
        return [

            // Keystones
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.PANDA], 2),
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.JAPANMAKAK], 2),
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.SIKA], 1),

            new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.SIKA], 2),
            new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.JAPANMAKAK], 2),
            new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.KOI], 1),

            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.PANDA], 2),
            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.SIKA], 2),
            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.CRANE], 1),

            new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.CRANE], 2),
            new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.PANDA], 1),
            new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.KOI], 2),
            
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.CRANE], 2),    
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.JAPANMAKAK], 2),
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.KOI], 1),

            // Combinations
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.PANDA, Animal.SIKA]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.PANDA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.SIKA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.JAPANMAKAK, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.SAKURA, [Animal.SIKA, Animal.JAPANMAKAK, Animal.KOI]),

            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.PANDA, Animal.CRANE]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.PANDA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.SIKA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.PANDA, Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.PANDA, Animal.SIKA, Animal.JAPANMAKAK]),

            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.JAPANMAKAK, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.PANDA, Animal.SIKA]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.PANDA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.SIKA, Animal.JAPANMAKAK, Animal.CRANE]),
            
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.PANDA, Animal.JAPANMAKAK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.SIKA, Animal.CRANE, Animal.KOI]),

            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.PANDA, Animal.SIKA, Animal.JAPANMAKAK]),
            new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.PANDA, Animal.JAPANMAKAK, Animal.KOI]),

            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.PANDA, Animal.JAPANMAKAK]),
            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.PANDA, Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.POND, [Animal.PANDA, Animal.JAPANMAKAK, Animal.KOI]),

            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.SIKA, Animal.JAPANMAKAK]),
            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.SIKA, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.CRANE, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.SIKA, Animal.JAPANMAKAK, Animal.KOI]),
            new TileData(Landscape.SAKURA, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.CRANE, Animal.KOI]),

            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.PANDA, Animal.SIKA]),
            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.PANDA, Animal.CRANE]),
            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.CRANE, Animal.KOI]),
            new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.PANDA, Animal.CRANE, Animal.KOI]),

            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.SIKA, Animal.JAPANMAKAK]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.SIKA, Animal.CRANE]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.CRANE, Animal.KOI]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.PANDA, Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.PANDA, Animal.SIKA, Animal.KOI]),

            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.PANDA, Animal.CRANE]),
            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.PANDA, Animal.KOI]),
            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.CRANE]),
            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.KOI]),
            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.CRANE, Animal.KOI]),
            new TileData(Landscape.POND, Landscape.WETLAND, [Animal.PANDA, Animal.CRANE, Animal.KOI]),
        ];
    }

    /**
     * Returns a hard-coded collection of TileData-like objects used for
     * quick testing and prototyping.
     * Each entry is an instance of the local `tileData` class below.
     * @returns {Array<StarterTileData>}
     */
    getAllStarterTiles() {
        return [
            new StarterTileData([
                new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.PANDA]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.SIKA, Animal.JAPANMAKAK, Animal.CRANE]),
                new TileData(Landscape.SAKURA, Landscape.POND, [Animal.PANDA, Animal.KOI])
            ]),

            new StarterTileData([
                new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.CRANE]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.POND, [Animal.SIKA, Animal.CRANE, Animal.KOI]),
                new TileData(Landscape.SAKURA, Landscape.MOUNTAIN, [Animal.PANDA, Animal.JAPANMAKAK])
            ]),

            new StarterTileData([
                new TileData(Landscape.SAKURA, Landscape.UNDEFINED, [Animal.JAPANMAKAK]),
                new TileData(Landscape.WETLAND, Landscape.POND, [Animal.JAPANMAKAK, Animal.CRANE, Animal.KOI]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.PANDA, Animal.SIKA])
            ]),

            new StarterTileData([
                new TileData(Landscape.POND, Landscape.UNDEFINED, [Animal.KOI]),
                new TileData(Landscape.SAKURA, Landscape.BAMBOOFOREST, [Animal.PANDA, Animal.SIKA, Animal.KOI]),
                new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.JAPANMAKAK, Animal.CRANE])
            ]),

            new StarterTileData([
                new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.SIKA]),
                new TileData(Landscape.MOUNTAIN, Landscape.POND, [Animal.PANDA, Animal.SIKA, Animal.CRANE]),
                new TileData(Landscape.WETLAND, Landscape.SAKURA, [Animal.JAPANMAKAK, Animal.KOI])
            ])
        ];
    }
}

