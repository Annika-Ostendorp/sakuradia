import { Animal } from "../data/Animal.js";
import Library from "../data/Library.js";

export default class DeckLogic {
    constructor(library) {
        // Mische alle verfügbaren Tiles (85) ins Deck
        this.deck = library.getTileDataList();

        this.deck.sort(() => Math.random() - 0.5);


        // Füge alle Tiere 20 mal zum animalDeck hinzu
        this.animalDeck = [];
        for (let i = 0; i < 20; i++) {
            this.animalDeck.push(Animal.PANDA);
            this.animalDeck.push(Animal.JAPANMAKAK);
            this.animalDeck.push(Animal.CRANE);
            this.animalDeck.push(Animal.KOI);
            this.animalDeck.push(Animal.SIKA);
        }

        // Mische die Tiere
        this.animalDeck.sort(() => Math.random() - 0.5);
    }

    getNextTile(){
        if (this.deck.length === 0) {
            console.warn("Tile Deck ist leer!");
            return null; // Rückgabe von null, wenn das Deck leer ist
        }
        return this.deck.pop();
    }

    getNextAnimal(){
        if (this.animalDeck.length === 0) {
            console.warn("Animal Deck ist leer!");
            return null; // Rückgabe von null, wenn das Deck leer ist
        }
        return this.animalDeck.pop();
    }
}

