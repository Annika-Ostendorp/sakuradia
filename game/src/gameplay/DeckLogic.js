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
            this.animalDeck.push(Animal.BEAR);
            this.animalDeck.push(Animal.FOX);
            this.animalDeck.push(Animal.HAWK);
            this.animalDeck.push(Animal.SALMON);
            this.animalDeck.push(Animal.ELK);
        }

        // Mische die Tiere
        this.animalDeck.sort(() => Math.random() - 0.5);
    }

    getNextTile(){
        if (this.deck.length === 0) {
            throw new Error("Deck ist leer!");
        }
        return this.deck.pop();
    }

    getNextAnimal(){
        if (this.animalDeck.length === 0) {
            throw new Error("Animal Deck ist leer!");
        }
        return this.animalDeck.pop();
    }
}

