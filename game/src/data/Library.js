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
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.BEAR], 2),
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.FOX], 2),
            new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.ELK], 1),

            new TileData(Landscape.GRASSLAND, Landscape.UNDEFINED, [Animal.ELK], 2),
            new TileData(Landscape.GRASSLAND, Landscape.UNDEFINED, [Animal.FOX], 2),
            new TileData(Landscape.GRASSLAND, Landscape.UNDEFINED, [Animal.SALMON], 1),

            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.BEAR], 2),
            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.ELK], 2),
            new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.HAWK], 1),

            new TileData(Landscape.RIVER, Landscape.UNDEFINED, [Animal.HAWK], 2),
            new TileData(Landscape.RIVER, Landscape.UNDEFINED, [Animal.BEAR], 1),
            new TileData(Landscape.RIVER, Landscape.UNDEFINED, [Animal.SALMON], 2),
            
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.HAWK], 2),    
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.FOX], 2),
            new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.SALMON], 1),

            // Combinations
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.BEAR, Animal.ELK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.BEAR, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.ELK, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.FOX, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.GRASSLAND, [Animal.ELK, Animal.FOX, Animal.SALMON]),

            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.HAWK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.ELK, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.ELK, Animal.FOX]),

            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.FOX, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.BEAR, Animal.ELK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.BEAR, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.ELK, Animal.FOX, Animal.HAWK]),
            
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.BEAR, Animal.FOX]),
            new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.ELK, Animal.HAWK, Animal.SALMON]),

            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.BEAR, Animal.ELK, Animal.FOX]),
            new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.BEAR, Animal.FOX, Animal.SALMON]),

            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.BEAR, Animal.FOX]),
            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.BEAR, Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.BEAR, Animal.FOX, Animal.SALMON]),

            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.ELK, Animal.FOX]),
            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.ELK, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.HAWK, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.ELK, Animal.FOX, Animal.SALMON]),
            new TileData(Landscape.GRASSLAND, Landscape.WETLAND, [Animal.FOX, Animal.HAWK, Animal.SALMON]),

            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.ELK]),
            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.HAWK]),
            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.HAWK, Animal.SALMON]),
            new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.HAWK, Animal.SALMON]),

            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.ELK, Animal.FOX]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.ELK, Animal.HAWK]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.HAWK, Animal.SALMON]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.BEAR, Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.BEAR, Animal.ELK, Animal.SALMON]),

            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.BEAR, Animal.HAWK]),
            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.BEAR, Animal.SALMON]),
            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.FOX, Animal.HAWK]),
            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.FOX, Animal.SALMON]),
            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.HAWK, Animal.SALMON]),
            new TileData(Landscape.RIVER, Landscape.WETLAND, [Animal.BEAR, Animal.HAWK, Animal.SALMON]),
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
                new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.BEAR]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.ELK, Animal.FOX, Animal.HAWK]),
                new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.BEAR, Animal.SALMON])
            ]),

            new StarterTileData([
                new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.HAWK]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.ELK, Animal.HAWK, Animal.SALMON]),
                new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.BEAR, Animal.FOX])
            ]),

            new StarterTileData([
                new TileData(Landscape.GRASSLAND, Landscape.UNDEFINED, [Animal.FOX]),
                new TileData(Landscape.WETLAND, Landscape.RIVER, [Animal.FOX, Animal.HAWK, Animal.SALMON]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.ELK])
            ]),

            new StarterTileData([
                new TileData(Landscape.RIVER, Landscape.UNDEFINED, [Animal.SALMON]),
                new TileData(Landscape.GRASSLAND, Landscape.BAMBOOFOREST, [Animal.BEAR, Animal.ELK, Animal.SALMON]),
                new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.FOX, Animal.HAWK])
            ]),

            new StarterTileData([
                new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.ELK]),
                new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.ELK, Animal.HAWK]),
                new TileData(Landscape.WETLAND, Landscape.GRASSLAND, [Animal.FOX, Animal.SALMON])
            ])
        ];
    }
}

