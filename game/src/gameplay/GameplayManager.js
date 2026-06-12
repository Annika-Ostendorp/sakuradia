import RoundState from "../data/RoundState.js";
import Game from "./Game.js";
import { createHandPanel } from "../ui/components/createHandPanel.js";
import HexCoord from "../utils/HexCoord.js";
import DebugConfig from "../debug/DebugConfig.js";
import { Animal } from "../data/Animal.js";

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
        this.currentTurn = 1; // Current turn number
        this.gameLength = this.gameConfig.rounds; // Rounds to be played until game end
        this.game = new Game(this.scene);
        this.roundState = RoundState.CHOOSE_TILE; // Initial round state
        
        this.selectedHandIndex = 0; // Index des aktuell in der UI markierten Hand-Paares
        this.previewTileModel = null; // Referenz zum model, welches nur im preview angezeigt wird
        this.previewTileModelPromise = null; // Promise, das auf die Fertigstellung des Ladens des preview-Modells wartet
        this.previewTileHexCoord = null; // HexCoord, an der das preview-Modell aktuell positioniert ist oder positioniert werden soll
        this.previewTileRotation = 0; // Rotation des preview-Modells in 60°-Schritten (Index 0-5)
        this.latestPlacedTileHexCoord = null; // HexCoord, an der das zuletzt platzierte Tile liegt (nach Bestätigung)

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

        DebugConfig.logGameplayInfo("Initializing GameplayManager with gameConfig:" + JSON.stringify(this.gameConfig));

        // Initiales Ziehen: 3 Paare in die Hand füllen
        for (let i = 0; i < 3; i++){
            this.game.enqueueTileToHand(this.game.deckLogic.getNextTile());
            this.game.enqueueAnimalToHand(this.game.deckLogic.getNextAnimal());
        }
        // Direktes Nachziehen eines weiteren Paares, damit die Hand 4 Elemente hat
        this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
        this.syncHandPanel();
        
        this.game.start();
    }

    getCurrentRoundState(){
        return this.roundState;
    }

    onHoverTileOnHand(index){
        // Hover tile visually
        this.selectedHandIndex = index;
    }

    async onSubmitted(){
        const previousState = this.getCurrentRoundState();

        // Je nach State
        switch(previousState){
            case RoundState.GAME_OVER:
            case RoundState.DRAW:
                break;
                
            case RoundState.CHOOSE_TILE:
                console.log("Submitting chosen tile at index", this.selectedHandIndex);
                // Spawn preview tile (without updating the grid)
                const previousHexCoord = this.latestPlacedTileHexCoord === null ? new HexCoord(0, 0) : this.latestPlacedTileHexCoord;
                this.previewTileHexCoord = this.getRandomUnoccupiedNeighbour(previousHexCoord);
                this.previewTileRotation = this.getRandomRotation();
                this.previewTileModel = null;
                this.previewTileModelPromise = this.placePreviewTile(
                    this.previewTileHexCoord,
                    this.game.tilesOnHand[this.selectedHandIndex],
                    this.previewTileRotation
                );
                this.previewTileModelPromise
                    .then((model) => {
                        this.previewTileModel = model;
                        this.previewTileModelPromise = null;
                        // Wenn bereits eine gewünschte HexCoord gesetzt wurde, positioniere das geladene Modell sofort.
                        if (this.previewTileHexCoord) {
                            try {
                                this.updatePreviewTilePosition(this.previewTileHexCoord);
                            } catch (e) {
                                console.warn('Failed to position preview model after load', e);
                            }
                            this.roundState = RoundState.PLACE_TILE;
                        }
                    })
                    .catch((err) => {
                        console.error('Error spawning preview tile model:', err);
                        this.previewTileModelPromise = null;
                    });

                break;

            case RoundState.PLACE_TILE:
                // Delete preview model (handle resolved or pending promise)
                const removeModelFromScene = (m) => {
                    if (!m) return;
                    // Einzelnes Objekt mit position
                    if (m.position) {
                        this.scene.remove(m);
                        return;
                    }
                    // Objekt mit halves
                    if (m.primaryHalf) this.scene.remove(m.primaryHalf);
                    if (m.secondaryHalf) this.scene.remove(m.secondaryHalf);
                };

                if (this.previewTileModel) {
                    removeModelFromScene(this.previewTileModel);
                } else if (this.previewTileModelPromise) {
                    this.previewTileModelPromise.then((model) => {
                        removeModelFromScene(model);
                    }).catch(() => {});
                }
                await this.placeTile(
                    this.previewTileHexCoord,
                    this.game.tilesOnHand[this.selectedHandIndex],
                    this.previewTileRotation
                );

                this.latestPlacedTileHexCoord = this.previewTileHexCoord;

                // FÜR TESTING: Platziere Tier auf dem soeben platzierten Tile
                const animal = this.game.animalsOnHand[this.selectedHandIndex];
                this.game.gridManager.setAnimal(this.latestPlacedTileHexCoord, animal, true);

                // Entferne das gespielte Paar aus der Hand
                this.game.removePairFromHand(this.selectedHandIndex);

                // Aktulisiere state, UI und ziehe ein neues Paar nach
                this.roundState = RoundState.DRAW;
                this.onPairDrawn(this.game.deckLogic.getNextTile(), this.game.deckLogic.getNextAnimal());
                this.onTurnEnd();
                this.syncHandPanel();
                break;

            default:
                console.warn("default case");
                break;
        }
        console.log("Changed from " +previousState+ " to " +this.roundState)
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
        if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo){
            this.game.tilesOnHand.forEach((tile, index) => {
                DebugConfig.logGameplayInfo(`Pair ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " & " + tile.secondaryLandscape} | ${this.game.animalsOnHand[index]}`);
            });
            DebugConfig.logGameplayInfo(`Current round: ${this.currentTurn}/${this.gameLength}.
                \nTiles left in deck: ${this.game.deckLogic.deck.length}.
                \nAnimals left in deck: ${this.game.deckLogic.animalDeck.length}.`);
        }

        this.syncHandPanel();
    }

    // Erhöht die Rundenzahl und setzt GAME_OVER, wenn das Spielende erreicht ist.
    onTurnEnd() {
        if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo){
            const occupiedHexCoords = this.game.gridManager.getOccupiedHexCoords();
            let gridContent = "Current grid state:\n";
            occupiedHexCoords.forEach(hexCoord => {
                const tile = this.game.gridManager.getTileAt(hexCoord);
                gridContent += `
                    Hex (${hexCoord.column}, ${hexCoord.row}): 
                    ${tile && tile.occupiedBy !== Animal.NONE ? "Occupied by: " + tile.occupiedBy : "Unoccupied"}`;
            });
            console.log(gridContent);
        }

        this.currentTurn++;
        if (this.currentTurn > this.gameLength) {
            console.log("Game Over");
            this.roundState = RoundState.GAME_OVER;
            return;
        }
        this.roundState = RoundState.CHOOSE_TILE;
    }

    // Platziert ein Tile an einer zufälligen, leeren Nachbar-Position mit zufälliger Rotation.
    // Hinweis: Rotation ist ein Index (0-5) für 60° Schritte.
    // Returnt das model
    async placePreviewTile(hexCoord, tileData, rotation = 0, setToGrid = false){        
        return await this.game.gridManager.setTile(hexCoord, tileData, rotation, setToGrid);
    }

    // Platziert ein Tile an einer zufälligen, leeren Nachbar-Position mit zufälliger Rotation
    // und fügt es dem Grid hinzu
    // Returnt das model
    async placeTile(hexCoord, tileData, rotation){
        return await this.game.gridManager.setTile(hexCoord, tileData, rotation);
    }

    getRandomUnoccupiedNeighbour(hexCoord){
        return this.game.gridManager.getRandomUnoccupiedNeighbour(hexCoord);
    }

    getRandomRotation(){
        return Math.floor(Math.random() * 6);
    }

    getGame(){
        return this.game;
    }

    // Aktualisiert das Hand-Panel UI und clamp't die ausgewählte Index-Position.
    syncHandPanel() {
        const handPairs = this.game.getHandPairs();
        const maxIndex = Math.max(0, handPairs.length - 1);
        this.selectedHandIndex = Math.min(this.selectedHandIndex, maxIndex);
        this.handPanel.update(handPairs, this.selectedHandIndex);
    }

    updatePreviewTilePosition(newHexCoord, isMicroMovement = false) {
        // Sicherheitsprüfungen: nichts machen, wenn kein HexCoord oder kein Model vorhanden.
        if (!newHexCoord) {
            console.error("updatePreviewTilePosition called with null newHexCoord");
            return;
        }
        
        // Aktualisiere preview Werte
        this.previewTileHexCoord = newHexCoord;

        // Wenn Modell noch nicht geladen, warten bis Promise aufgelöst wird
        if (!this.previewTileModel) {
            return;
        }

        // Konvertiere HexCoord in Welt-Position für das 3D-Modell.
        var worldPos = newHexCoord.hexToWorld(newHexCoord, this.game.gridManager.hexSize);

        // Falls geladener Rückgabewert ein einzelnes Objekt mit `position`
        if (this.previewTileModel.position) {
            this.previewTileModel.position.set(worldPos.x, worldPos.y, worldPos.z);
            this.game.gridManager.refreshBlueprints(newHexCoord, isMicroMovement);
            return;
        }

        // Falls Rückgabe ein Objekt mit zwei Hälften
        if (this.previewTileModel.primaryHalf || this.previewTileModel.secondaryHalf) {
            if (this.previewTileModel.primaryHalf && this.previewTileModel.primaryHalf.position) {
                this.previewTileModel.primaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);
            }
            if (this.previewTileModel.secondaryHalf && this.previewTileModel.secondaryHalf.position) {
                this.previewTileModel.secondaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);
            }
            this.game.gridManager.refreshBlueprints(newHexCoord, isMicroMovement);
            return;
        }

        console.error("updatePreviewTilePosition: previewTileModel shape unknown, cannot set position");
    }

    /**
     * 
     * @param {boolean} clockwise = true wenn im Uhrzeigersinn rotiert werden soll, sonst gegen den Uhrzeigersinn
     */
    rotatePreviewTile(clockwise = true){
        if (!this.previewTileModel || this.roundState !== RoundState.PLACE_TILE) {
            return;
        }

        // Aktualisiere die Rotation im 60°-Schritt (Index 0-5)
        this.previewTileRotation = (this.previewTileRotation + (clockwise ? 5 : 1)) % 6;

        // Setze die neue Rotation am Modell (Rotation um Y-Achse)
        const angle = this.previewTileRotation * (Math.PI / 3); // 60° Schritte
        if (this.previewTileModel.rotation) {
            this.previewTileModel.rotation.y = angle;
        } else {
            if (this.previewTileModel.primaryHalf && this.previewTileModel.primaryHalf.rotation) {
                this.previewTileModel.primaryHalf.rotation.y = angle;
            }
            if (this.previewTileModel.secondaryHalf && this.previewTileModel.secondaryHalf.rotation) {
                this.previewTileModel.secondaryHalf.rotation.y = angle;
            }
        }
    }
}
