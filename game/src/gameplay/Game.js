import Library from "../data/Library.js";
import DeckLogic from "./DeckLogic.js";
import GridManager from "./GridManager.js";
import { TileData, StarterTileData } from "../gameplay/Tile.js";
import HexCoord from "../utils/HexCoord.js";

/**
 * Hält die Hauptlogik des Spiels, einschließlich der Verwaltung von Deck, Spielfeld und Spielregeln.
 * Initialisiert das Startertile und koordiniert die Interaktionen zwischen den verschiedenen Komponenten des Spiels.
 */
export default class Game {
    constructor(scene) {
        this.scene = scene;
        this.library = new Library();
        this.deckLogic = new DeckLogic(this.library);
        this.gridManager = new GridManager(this.scene);
        this.tilesOnHand = []; // Queue der aktuell gezogenen Tiles, die der Spieler platzieren kann.
        this.animalsOnHand = []; // Queue der aktuell gezogenen Tiere, die der Spieler platzieren kann.
    }

    // Startet das Spiel, indem das Startertile initialisiert wird.
    start() {
        this.initializeStarterTile();
    }

    // Spawnt ein Startertile auf dem Spielfeld
    initializeStarterTile(){
        const starterTiles = this.library.getAllStarterTiles();
        const randomIndex = Math.floor(Math.random() * starterTiles.length);
        const starterTileData = starterTiles[randomIndex];
        
        this.gridManager.setTile(new HexCoord(0, 0), starterTileData.keystone);
        this.gridManager.setTile(new HexCoord(0, -1), starterTileData.leftTile, 2);
        this.gridManager.setTile(new HexCoord(1, -1), starterTileData.rightTile, 0);
    }

    enqueueTileToHand(tileData) {
        this.tilesOnHand.push(tileData);
    }

    dequeueTileFromHand() {
        return this.tilesOnHand.shift();
    }

    peekTileOnHand() {
        return this.tilesOnHand[0];
    }

    enqueueAnimalToHand(animal) {
        this.animalsOnHand.push(animal);
    }

    dequeueAnimalFromHand() {
        return this.animalsOnHand.shift();
    }

    peekAnimalOnHand() {
        return this.animalsOnHand[0];
    }

    getHandPairs() {
        return this.tilesOnHand.map((tileData, index) => ({
            tileData,
            animal: this.animalsOnHand[index],
        }));
    }

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
}