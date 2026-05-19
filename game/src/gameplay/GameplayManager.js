import RoundState from "../data/RoundState.js";
import Game from "./Game.js";

export default class GameplayManager{
    constructor(scene){
        this.scene = scene;
        this.currentTurn = 1; // Current turn number
        this.gameLength = 20; // Rounds to be played until game end
        this.game = new Game(this.scene);
        this.roundState = RoundState.CHOOSE_TILE; // Initial round state

        for (let i = 0; i < 4; i++){
            this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        }
        
        this.game.start();
    }

    // When canvas is clicked this is called from input manager
    onInteracted(){
        if (this.roundState === RoundState.GAME_OVER) {
            console.log("Game is already over. No more interactions allowed!");
            return;
        }

        this.placeTileRandomPosAndRot();
        var tileData = this.game.animalsOnHand.pop();
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.onTurnEnd();
    }

    onPairDrawn(tileData, animal) {
        this.game.pushTileToHand(tileData);
        this.game.pushAnimalToHand(animal);

        // Print array of landscape per tile data
        console.log("New pair drawn:");
        this.game.tilesOnHand.forEach((tile, index) => {
            console.log(`Tile ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " " + tile.secondaryLandscape}`);
        });
        console.log("Animals on hand:", this.game.animalsOnHand);
        console.log(`Current round: ${this.currentTurn}. Tiles left in deck: ${this.game.deckLogic.deck.length}. Animals left in deck: ${this.game.deckLogic.animalDeck.length}`);
    }

    onTurnEnd() {
        this.currentTurn++;
        if (this.currentTurn > this.gameLength) {
            console.log("Game Over");
            this.roundState = RoundState.GAME_OVER;
            return;
        }
    }

    placeTileRandomPosAndRot(){
        var tileData = this.game.tilesOnHand.pop();
        var hexCoord = this.game.gridManager.getRandomEmptyHexCoord();
        if (!hexCoord) {
            console.warn("No empty neighboring hex available for tile placement.");
            return;
        }
        this.game.gridManager.setTile(hexCoord, tileData, Math.floor(Math.random() * 5));
    }
}
