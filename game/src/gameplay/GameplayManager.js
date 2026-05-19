import RoundState from "../data/RoundState.js";
import Game from "./Game.js";
import { createHandPanel } from "../ui/components/createHandPanel.js";

export default class GameplayManager{
    constructor(scene, gameConfig){
        this.scene = scene;
        this.gameConfig = gameConfig;
        this.currentTurn = 1; // Current turn number
        this.gameLength = this.gameConfig.rounds; // Rounds to be played until game end
        this.game = new Game(this.scene);
        this.roundState = RoundState.CHOOSE_TILE; // Initial round state
        this.selectedHandIndex = 0;

        this.handPanel = createHandPanel({
            onSelectPair: (index) => {
                this.selectedHandIndex = index;
                this.syncHandPanel();
            },
        });

        const appShell = document.querySelector('#app-shell');
        if (!appShell) {
            throw new Error('Could not attach hand panel: #app-shell not found.');
        }
        appShell.append(this.handPanel.element);

        console.log("Initializing GameplayManager with gameConfig:", this.gameConfig);

        for (let i = 0; i < 3; i++){
            this.game.enqueueTileToHand(this.game.deckLogic.getNextTile());
            this.game.enqueueAnimalToHand(this.game.deckLogic.getNextAnimal());
        }
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.syncHandPanel();
        
        this.game.start();
    }

    // When canvas is clicked this is called from input manager
    onInteracted(){
        if (this.roundState === RoundState.GAME_OVER) {
            console.log("Game is already over. No more interactions allowed!");
            return;
        }

        const selectedPair = this.game.removePairFromHand(this.selectedHandIndex);
        if (!selectedPair.tileData || !selectedPair.animal) {
            console.warn("No valid hand pair selected.");
            this.syncHandPanel();
            return;
        }

        this.placeTileRandomPosAndRot(selectedPair.tileData);
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.onTurnEnd();
    }

    onPairDrawn(tileData, animal) {
        if (!tileData || !animal) {
            console.warn("No more tiles or animals to draw. Ending game.");
            this.roundState = RoundState.GAME_OVER;
            this.syncHandPanel();
            return;
        }

        this.game.enqueueTileToHand(tileData);
        this.game.enqueueAnimalToHand(animal);

        // Print array of landscape per tile data
        this.game.tilesOnHand.forEach((tile, index) => {
            console.log(`Pair ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " & " + tile.secondaryLandscape} | ${this.game.animalsOnHand[index]}`);
        });
        console.log(`Current round: ${this.currentTurn}/${this.gameLength}.
            \nTiles left in deck: ${this.game.deckLogic.deck.length}.
            \nAnimals left in deck: ${this.game.deckLogic.animalDeck.length}.`);

        this.syncHandPanel();
    }

    onTurnEnd() {
        this.currentTurn++;
        if (this.currentTurn > this.gameLength) {
            console.log("Game Over");
            this.roundState = RoundState.GAME_OVER;
            return;
        }
    }

    placeTileRandomPosAndRot(tileData){
        var hexCoord = this.game.gridManager.getRandomEmptyHexCoord();
        if (!hexCoord) {
            console.warn("No empty neighboring hex available for tile placement!");
            return;
        }
        this.game.gridManager.setTile(hexCoord, tileData, Math.floor(Math.random() * 5));
    }

    syncHandPanel() {
        const handPairs = this.game.getHandPairs();
        const maxIndex = Math.max(0, handPairs.length - 1);
        this.selectedHandIndex = Math.min(this.selectedHandIndex, maxIndex);
        this.handPanel.update(handPairs, this.selectedHandIndex);
    }
}
