import RoundState from "../data/RoundState.js";
import Game from "./Game.js";

export default class GameplayManager{
    constructor(scene, gameConfig){
        this.scene = scene;
        this.gameConfig = gameConfig;
        this.currentTurn = 1; // Current turn number
        this.gameLength = this.gameConfig.rounds; // Rounds to be played until game end
        this.game = new Game(this.scene);
        this.roundState = RoundState.CHOOSE_TILE; // Initial round state

        console.log("Initializing GameplayManager with gameConfig:", this.gameConfig);

        for (let i = 0; i < 3; i++){
            this.game.enqueueTileToHand(this.game.deckLogic.getNextTile());
            this.game.enqueueAnimalToHand(this.game.deckLogic.getNextAnimal());
        }
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        
        this.game.start();
    }

    // When canvas is clicked this is called from input manager
    onInteracted(){
        if (this.roundState === RoundState.GAME_OVER) {
            console.log("Game is already over. No more interactions allowed!");
            return;
        }

        this.placeTileRandomPosAndRot();
        this.game.dequeueAnimalFromHand();
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.onTurnEnd();
    }

    onPairDrawn(tileData, animal) {
        this.game.enqueueTileToHand(tileData);
        this.game.enqueueAnimalToHand(animal);

        if (!tileData || !animal) {
            console.warn("No more tiles or animals to draw. Ending game.");
            this.roundState = RoundState.GAME_OVER;
            return;
        }

        // Print array of landscape per tile data
        this.game.tilesOnHand.forEach((tile, index) => {
            console.log(`Pair ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " & " + tile.secondaryLandscape} | ${this.game.animalsOnHand[index]}`);
        });
        console.log(`Current round: ${this.currentTurn}/${this.gameLength}.
            \nTiles left in deck: ${this.game.deckLogic.deck.length}.
            \nAnimals left in deck: ${this.game.deckLogic.animalDeck.length}.`);
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
        var tileData = this.game.dequeueTileFromHand();
        var hexCoord = this.game.gridManager.getRandomEmptyHexCoord();
        if (!hexCoord) {
            console.warn("No empty neighboring hex available for tile placement!");
            return;
        }
        this.game.gridManager.setTile(hexCoord, tileData, Math.floor(Math.random() * 5));
    }
}
