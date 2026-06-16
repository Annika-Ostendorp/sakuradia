import { Animal } from "../data/Animal.js";
import Library from "../data/Library.js";

/**
 * Verwaltet die beiden Spiele-Decks:
 * - `deck` (TileData): Liste aller verfügbaren Tiles, gemischt beim Start
 * - `animalDeck` (Animal enums): Sammlung von Tieren, mehrfach enthalten
 *
 * Das Interface bietet einfache Pop-/Draw-Methoden (`getNextTile`, `getNextAnimal`).
 * Beide Methoden geben `null` zurück, wenn das jeweilige Deck leer ist —
 * Aufrufer müssen mit diesem Fall umgehen (siehe GameplayManager).
 */
export default class DeckLogic {
  constructor(library) {
    // Tile-Deck: Kopiere alle TileData aus der Library und mische die Liste.
    // Die Library stellt typischerweise 85 Tile-Einträge bereit.
    this.deck = library.getTileDataList();

    // Einfache zufällige Sortierung zum Mischen. Für deterministische Tests
    // könnte man hier ein seedbares RNG einsetzen.
    this.deck.sort(() => Math.random() - 0.5);

    // Animal-Deck: Für dieses Projekt sind die Tiere mehrfach vorhanden.
    // Aktuell wird jede Art 20x hinzugefügt (insgesamt 100 Einträge).
    this.animalDeck = [];
    for (let i = 0; i < 20; i++) {
      this.animalDeck.push(Animal.PANDA);
      this.animalDeck.push(Animal.JAPANMAKAK);
      this.animalDeck.push(Animal.CRANE);
      this.animalDeck.push(Animal.KOI);
      this.animalDeck.push(Animal.SIKA);
    }

    // Tiere mischen
    this.animalDeck.sort(() => Math.random() - 0.5);
  }

  /**
   * Gibt das nächste Tile aus dem Deck zurück (LIFO: .pop()).
   * Gibt `null` zurück, wenn das Deck leer ist.
   */
  getNextTile() {
    if (this.deck.length === 0) {
      console.warn("Tile Deck ist leer!");
      return null;
    }
    return this.deck.pop();
  }

  /**
   * Gibt das nächste Animal aus dem Animal-Deck zurück (LIFO: .pop()).
   * Gibt `null` zurück, wenn das Deck leer ist.
   */
  getNextAnimal() {
    if (this.animalDeck.length === 0) {
      console.warn("Animal Deck ist leer!");
      return null;
    }
    return this.animalDeck.pop();
  }
}
