import Library from "../data/Library.js";
import DeckLogic from "./DeckLogic.js";
import GridManager from "./GridManager.js";
import { TileData, StarterTileData } from "../gameplay/Tile.js";
import HexCoord from "../utils/HexCoord.js";

/**
 * Zentrale Klasse, die die Spielzustände und -ressourcen zusammenhält:
 * - `library`: Statische Daten/Assets (Tile-Definitionen, Starter-Setups)
 * - `deckLogic`: Logik für Ziehen/Verwalten von Tile- und Animal-Decks
 * - `gridManager`: Verwaltung des aktuellen Spielfelds und der 3D-Modelle
 * - `tilesOnHand`/`animalsOnHand`: parallele Queues, die Paarungen repräsentieren
 *
 * Verantwortlichkeiten:
 * - Initialisieren des Starter-Layouts auf dem Grid
 * - Bereitstellen einfacher API-Methoden für Hand-Operationen (enqueue/dequeue/peek)
 * - Bietet `getHandPairs()` um UI/Manager mit synchronisierten Paaren zu versorgen
 */
export default class Game {
    constructor(scene) {
        this.scene = scene;
        this.library = new Library();
        this.deckLogic = new DeckLogic(this.library);
        this.gridManager = new GridManager(this.scene);
        // Parallele Arrays: tilesOnHand[i] gehört zu animalsOnHand[i]
        this.tilesOnHand = [];
        this.animalsOnHand = [];
    }

    // Startet das Spiel.
    start() {
        this.initializeStarterTile();
    }

    // Platziert das Starter-Set auf dem Grid.
    // Hinweis zu Platzierung: Die Koordinaten (0,0), (0,-1), (1,-1) entsprechen
    // einem kleinen, vordefinierten Dreieck von Hex-Zellen; die angegebenen
    // Rotationen sind Indexwerte (0-5) die mit 60° multipliziert werden.
    async initializeStarterTile(){
        const starterTiles = this.library.getAllStarterTiles();
        const randomIndex = Math.floor(Math.random() * starterTiles.length);
        const starterTileData = starterTiles[randomIndex];

        // Keystone in der Mitte, zwei weitere Hälften an angrenzenden Hexes.
        await new Promise(resolve => setTimeout(resolve, 100)); // Kurze Verzögerung für Debugging
        await this.gridManager.setTile(new HexCoord(0, 0), starterTileData.keystone);
        await this.gridManager.setTile(new HexCoord(0, -1), starterTileData.leftTile, 2);
        await this.gridManager.setTile(new HexCoord(1, -1), starterTileData.rightTile, 0);
    }

    // --- Hand-Queue API ---
    enqueueTileToHand(tileData) {
        this.tilesOnHand.push(tileData);
    }

    enqueueAnimalToHand(animal) {
        this.animalsOnHand.push(animal);
    }

    // Liefert ein Array synchronisierter Paare für die UI.
    getHandPairs() {
        return this.tilesOnHand.map((tileData, index) => ({
            tileData,
            animal: this.animalsOnHand[index],
        }));
    }

    // Entfernt ein Paar an Index `index` aus beiden Queues und gibt es zurück.
    // Gibt `{tileData: null, animal: null}` zurück, wenn der Index ungültig ist.
    removePairFromHand(index = 0) {
        if (index < 0 || index >= this.tilesOnHand.length || index >= this.animalsOnHand.length) {
            return {
                tileData: null,
                animal: null,
            };
        }

        const [tileData] = this.tilesOnHand.splice(index, 1);
        const [animal] = this.animalsOnHand.splice(index, 1);

        return {
            tileData,
            animal,
        };
    }

    // Backward-compatible helpers used by older callers.
    pushTileToHand(tileData) {
        this.enqueueTileToHand(tileData);
    }

    pushAnimalToHand(animal) {
        this.enqueueAnimalToHand(animal);
    }

    getGridManager(){
        return this.gridManager;
    }
}