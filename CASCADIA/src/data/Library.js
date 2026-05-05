import { Landscape } from "enums/Landscape.js";
import { Animal } from "enums/Animal.js";
import { TileData, StarterTile } from "gameplay/Tile.js";


export default class Library {
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
     * @returns {Array<starterTile>}
     */
    getAllStarterTiles() {
        return [
            new StarterTile(
                new TileData(Landscape.MOUNTAIN, Landscape.UNDEFINED, [Animal.BEAR]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.WETLAND, [Animal.ELK, Animal.FOX, Animal.HAWK]),
                new TileData(Landscape.GRASSLAND, Landscape.RIVER, [Animal.BEAR, Animal.SALMON])
            ),
            new StarterTile(
                new TileData(Landscape.WETLAND, Landscape.UNDEFINED, [Animal.HAWK]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.RIVER, [Animal.ELK, Animal.HAWK, Animal.SALMON]),
                new TileData(Landscape.GRASSLAND, Landscape.MOUNTAIN, [Animal.BEAR, Animal.FOX])
            ),
            new StarterTile(
                new TileData(Landscape.GRASSLAND, Landscape.UNDEFINED, [Animal.FOX]),
                new TileData(Landscape.WETLAND, Landscape.RIVER, [Animal.FOX, Animal.HAWK, Animal.SALMON]),
                new TileData(Landscape.BAMBOOFOREST, Landscape.MOUNTAIN, [Animal.BEAR, Animal.ELK])
            ),
            new StarterTile(
                new TileData(Landscape.RIVER, Landscape.UNDEFINED, [Animal.SALMON]),
                new TileData(Landscape.GRASSLAND, Landscape.BAMBOOFOREST, [Animal.BEAR, Animal.ELK, Animal.SALMON]),
                new TileData(Landscape.MOUNTAIN, Landscape.WETLAND, [Animal.FOX, Animal.HAWK])
            ),
            new StarterTile(
                new TileData(Landscape.BAMBOOFOREST, Landscape.UNDEFINED, [Animal.ELK]),
                new TileData(Landscape.MOUNTAIN, Landscape.RIVER, [Animal.BEAR, Animal.ELK, Animal.HAWK]),
                new TileData(Landscape.WETLAND, Landscape.GRASSLAND, [Animal.FOX, Animal.SALMON])
            )
        ];
    }

    /**
     * Liefert den Pfad zum 3D-Modell eines Tieres.
     * Erlaubt zentrale Verwaltung/Override von Modellpfaden.
     * @param {string} animalKey Enum-/Schlüsselwert aus `Animal` (z.B. "panda")
     * @returns {string} Pfad zur GLB-Datei im `public`-Ordner
     */
    getModelPathForAnimal(animal) {
        if (!animal) return null;
        switch (animal) {
            case Animal.BEAR:
                return "/assets/models/animals/placeholder/ph_panda.glb";
            case Animal.ELK:
                return "/assets/models/animals/placeholder/ph_deer.glb";
            case Animal.FOX:
                return "/assets/models/animals/placeholder/ph_monkey.glb";
            case Animal.HAWK:
                return "/assets/models/animals/placeholder/ph_bird.glb";
            case Animal.SALMON:
                return "/assets/models/animals/placeholder/ph_koi.glb";
            default:
                return "/assets/models/animals/default.glb";
        }
    }

    /**
     * Returns an optional preferred scale multiplier for an animal model.
     * Use this to correct models that were authored in wildly different unit scales.
     * @param {string} animal Enum value from `Animal`
     * @returns {number} multiplier (1 = no change)
     */
    getPreferredAnimalScale(animal) {
        switch (animal) {
            case Animal.ELK:
                return 0.3; // adjust deer model scale multiplier (tuneable)
            default:
                return 1.0;
        }
    }
}
