import RoundState from "../data/RoundState.js";
import Game from "./Game.js";
import { createHandPanel } from "../ui/components/createHandPanel.js";

/**
 * Vermittelt zwischen Low-Level-Game-Logik (`Game`) und der UI/Interaktion.
 * Aufgaben:
 * - Initiales Ziehen von Hand-Paaren
 * - Reaktion auf Benutzerinteraktionen (z.B. Klicks)
 * - Verwaltung von Runden/Spielablauf
 */
export default class GameplayManager{
    constructor(scene, gameConfig){
        this.scene = scene;
        this.gameConfig = gameConfig;
        this.playerCount = Math.max(1, Number(this.gameConfig.playerCount || 1));
        this.currentTurn = 1; // Absoluter Zugzähler über alle Spieler
        this.currentRound = 1;
        this.currentPlayer = 1;
        this.playerScores = Array.from({ length: this.playerCount }, () => 0);
        this.gameLength = this.gameConfig.rounds; // Rounds to be played until game end
        this.maxTurns = this.gameLength * this.playerCount;
        this.game = new Game(this.scene);
        this.roundState = RoundState.CHOOSE_TILE; // Initial round state
        // Index des aktuell in der UI markierten Hand-Paares
        this.selectedHandIndex = 0;

        // Hand-Panel UI: Callback aktualisiert die Auswahl und synchronisiert das UI
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

        // Initiales Ziehen: 3 Paare in die Hand füllen
        for (let i = 0; i < 3; i++){
            this.game.enqueueTileToHand(this.game.deckLogic.getNextTile());
            this.game.enqueueAnimalToHand(this.game.deckLogic.getNextAnimal());
        }
        // Direktes Nachziehen eines weiteren Paares, damit die Hand 4 Elemente hat
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.syncHandPanel();
        this.syncTurnStatus();
        
        this.game.start();
    }

    // Wird vom Input-Manager aufgerufen, wenn der Spieler mit dem Canvas interagiert.
    onInteracted(){
        if (this.roundState === RoundState.GAME_OVER) {
            console.log("Game is already over. No more interactions allowed!");
            return;
        }

        // Entferne das aktuell ausgewählte Paar aus der Hand und platziere es.
        const selectedPair = this.game.removePairFromHand(this.selectedHandIndex);
        if (!selectedPair.tileData || !selectedPair.animal) {
            console.warn("No valid hand pair selected.");
            this.syncHandPanel();
            return;
        }

        this.placeTileRandomPosAndRot(selectedPair.tileData);

        // Platzhalter-Scoring: jeder gesetzte Zug gibt dem aktiven Spieler 1 Punkt.
        this.playerScores[this.currentPlayer - 1] += 1;

        // Nach dem Platzieren wird ein neues Paar gezogen und die Runde beendet.
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.onTurnEnd();
    }

    // Behandelt das Nachziehen eines Paares: Enqueue und UI-Logging.
    onPairDrawn(tileData, animal) {
        if (!tileData || !animal) {
            console.warn("No more tiles or animals to draw. Ending game.");
            this.roundState = RoundState.GAME_OVER;
            this.syncHandPanel();
            return;
        }

        this.game.enqueueTileToHand(tileData);
        this.game.enqueueAnimalToHand(animal);

        // Debug-Ausgabe: Zeige die aktuelle Hand mit Landschaften und Tieren.
        this.game.tilesOnHand.forEach((tile, index) => {
            console.log(`Pair ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " & " + tile.secondaryLandscape} | ${this.game.animalsOnHand[index]}`);
        });
        console.log(`Current turn: ${this.currentTurn}/${this.maxTurns}.
            \nTiles left in deck: ${this.game.deckLogic.deck.length}.
            \nAnimals left in deck: ${this.game.deckLogic.animalDeck.length}.`);

        this.syncHandPanel();
    }

    // Erhöht die Rundenzahl und setzt GAME_OVER, wenn das Spielende erreicht ist.
    onTurnEnd() {
        this.currentTurn++;
        this.currentPlayer = ((this.currentTurn - 1) % this.playerCount) + 1;
        this.currentRound = Math.ceil(this.currentTurn / this.playerCount);

        if (this.currentTurn > this.maxTurns) {
            console.log("Game Over");
            this.roundState = RoundState.GAME_OVER;
            this.syncTurnStatus();
            return;
        }

        this.syncTurnStatus();
    }

    // Platziert ein Tile an einer zufälligen, leeren Nachbar-Position mit zufälliger Rotation.
    // Hinweis: Rotation ist ein Index (0-5) für 60° Schritte. Der aktuelle Code verwendet
    // Math.floor(Math.random() * 5) und erzeugt Werte 0..4; Rotation 5 wird somit derzeit
    // nicht erzeugt. Das Verhalten wurde nicht verändert — nur dokumentiert.
    placeTileRandomPosAndRot(tileData){
        var hexCoord = this.game.gridManager.getRandomEmptyHexCoord();
        if (!hexCoord) {
            console.warn("No empty neighboring hex available for tile placement!");
            return;
        }
        this.game.gridManager.setTile(hexCoord, tileData, Math.floor(Math.random() * 5));
    }

    // Aktualisiert das Hand-Panel UI und clamp't die ausgewählte Index-Position.
    syncHandPanel() {
        const handPairs = this.game.getHandPairs();
        const maxIndex = Math.max(0, handPairs.length - 1);
        this.selectedHandIndex = Math.min(this.selectedHandIndex, maxIndex);
        this.handPanel.update(handPairs, this.selectedHandIndex);
    }

    syncTurnStatus() {
        this.handPanel.updateStatus({
            currentRound: Math.min(this.currentRound, this.gameLength),
            totalRounds: this.gameLength,
            currentPlayer: this.currentPlayer,
            playerCount: this.playerCount,
            scoresByPlayer: this.playerScores,
        });
    }
}
