import { RoundState } from "../data/RoundState.js";
import Game from "./Game.js";
import { createHandPanel } from "../ui/components/createHandPanel.js";
import { createScoreBoard } from "../ui/components/createScoreBoard.js";
import HexCoord from "../utils/HexCoord.js";
import DebugConfig from "../debug/DebugConfig.js";
import { Animal } from "../data/Animal.js";
import { calculateScoreForGrid } from "./scoringSystem.js";
import Tile from "/src/gameplay/Tile.js";
import { getFirstHexWithMaxDistance } from "/src/gameplay/grid/gridQueryService.js";
import SmoothAnimator from "/src/utils/SmoothAnimator.js";
import * as THREE from "three";

/**
 * Vermittelt zwischen Low-Level-Game-Logik (`Game`) und der UI/Interaktion.
 * Aufgaben:
 * - Initiales Ziehen von Hand-Paaren
 * - Reaktion auf Benutzerinteraktionen (z.B. Klicks)
 * - Verwaltung von Runden/Spielablauf
 */
export default class GameplayManager {
  constructor(scene, gameConfig, modelLoader, smoothAnimator) {
    this.scene = scene;
    this.gameConfig = gameConfig;
    this.modelLoader = modelLoader;
    this.smoothAnimator = smoothAnimator;
    this.useSmoothAnimator = true;
    this.moveTileSpeed = 20;
    this.rotateTileSpeed = 20;
    this.playerCount = Math.max(1, Number(this.gameConfig.playerCount || 1));
    this.currentTurn = 1; // Absoluter Zugzähler über alle Spieler
    this.currentRound = 1;
    this.currentPlayer = 1;
    this.playerScores = Array.from({ length: this.playerCount }, () => 0);
    this.lastBoardTotalScore = 0;
    this.gameLength = this.gameConfig.rounds; // Rounds to be played until game end
    this.maxTurns = this.gameLength * this.playerCount;
    this.game = new Game(this.scene, this.modelLoader);
    this.roundState = RoundState.CHOOSE_TILE; // Initial round state

    // Index des aktuell in der UI markierten Hand-Paares
    this.selectedHandIndex = 0; // Index des aktuell in der UI markierten Hand-Paares
    this.latestPlacedTileHexCoord = null; // HexCoord, an der das zuletzt platzierte Tile liegt (nach Bestätigung)

    // Preview Parameter
    this.currentTurnTileModel = null; // Referenz zum aktuell platzierten Tile-Model, um es löschen zu können bei einem undo turn
    this.previewTileModel = null; // Referenz zum model, welches nur im preview angezeigt wird
    this.previewTileModelPromise = null; // Promise, das auf die Fertigstellung des Ladens des preview-Modells wartet
    this.previewTileHexCoord = null; // HexCoord, an der das preview-Modell aktuell positioniert ist oder positioniert werden soll
    this.previewTileRotation = 0; // Rotation des preview-Modells in 60°-Schritten (Index 0-5)

    this.previewAnimalModel = null; // Referenz zum animal model, welches nur im preview angezeigt wird
    this.previewAnimalModelPromise = null; // Promise, das auf die Fertigstellung des Ladens des preview animal Modells wartet
    this.previewAnimalHexCoord = null; // HexCoord, an der das preview animal Modell aktuell positioniert ist oder positioniert werden soll

    // Hand-Panel UI: Callback aktualisiert die Auswahl und synchronisiert das UI
    this.handPanel = createHandPanel({
      onSelectPair: (index) => {
        this.selectedHandIndex = index;
        this.syncHandPanel();
        this.syncTurnStatus();
      },
    });
    this.scoreBoard = createScoreBoard({ useDummyData: false });

    const appShell = document.querySelector("#app-shell");
    if (!appShell) {
      throw new Error("Could not attach hand panel: #app-shell not found.");
    }
    appShell.append(this.handPanel.element);
    appShell.append(this.scoreBoard.element);

    if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo) {
      console.log(
        "Initializing GameplayManager with gameConfig:" +
          JSON.stringify(this.gameConfig),
      );
    }

    // Initiales Ziehen: 3 Paare in die Hand füllen
    for (let i = 0; i < 3; i++) {
      this.game.enqueueTileToHand(this.game.deckLogic.getNextTile());
      this.game.enqueueAnimalToHand(this.game.deckLogic.getNextAnimal());
    }
    // Direktes Nachziehen eines weiteren Paares, damit die Hand 4 Elemente hat
    this.onPairDrawn(
      this.game.deckLogic.getNextTile(),
      this.game.deckLogic.getNextAnimal(),
    );
    this.syncHandPanel();
    this.syncTurnStatus();

    this.game
      .start()
      .then(() => {
        this.initializeStartingScore();
      })
      .catch((error) => {
        console.error("Failed to initialize starter tiles:", error);
      });
  }

  getCurrentRoundState() {
    return this.roundState;
  }

  getAnimalManager() {
    const gridManager = this.game.gridManager;
    return gridManager.animalManager;
  }

  getPreviewAnimal() {
    return this.game.getAnimalAtIndex(this.selectedHandIndex);
  }

  onHoverTileOnHand(index) {
    // Hover tile visually
    this.selectedHandIndex = index;

    // Update hand panel
    this.syncHandPanel();
  }

  async onSubmitted() {
    const previousState = this.getCurrentRoundState();

    // Je nach State
    switch (previousState) {
      case RoundState.GAME_OVER: // Kein Bestätigen mehr möglich, Spiel ist vorbei
      case RoundState.DRAW: // Kein Bestätigen im Draw-State, da hier nur nachgezogen wird, was automatisch geschieht
      case RoundState.CANNOT_PLACE_ANIMAL: // Kein Bestätigen möglich, da Spieler hier nur die Wahl hat, die Tierplatzierung rückgängig zu machen (undoTileChoice) oder die Tierplatzierung zu überspringen
        break;

      case RoundState.CHOOSE_TILE:
        if (DebugConfig.enabled && DebugConfig.doLogSmallInfo) {
          console.log(
            "Submitting chosen tile at index",
            this.selectedHandIndex,
          );
        }

        // Spawn preview tile (without updating the grid)
        const previousHexCoord =
          this.latestPlacedTileHexCoord === null
            ? new HexCoord(0, 0)
            : this.latestPlacedTileHexCoord;

        this.previewTileHexCoord =
          this.getRandomUnoccupiedNeighbour(previousHexCoord);

        this.previewTileRotation = this.getRandomRotation();
        this.previewTileModel = null;
        this.previewTileModelPromise = this.placePreviewTile(
          this.previewTileHexCoord,
          this.game.tilesOnHand[this.selectedHandIndex],
          this.previewTileRotation,
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
                console.warn("Failed to position preview model after load", e);
              }
              this.roundState = RoundState.PLACE_TILE;
            }
          })
          .catch((err) => {
            console.error("Error spawning preview tile model:", err);
            this.previewTileModelPromise = null;
          });

        break;

      case RoundState.PLACE_TILE:
        // Setze Tile
        this.currentTurnTileModel = await this.placeTile(
          this.previewTileHexCoord,
          this.game.tilesOnHand[this.selectedHandIndex],
          this.previewTileRotation,
        );

        // Check animal placement
        this.checkAnimalPlacement();

        break;

      case RoundState.PLACE_ANIMAL:
        // Platziere Tier
        this.latestPlacedTileHexCoord = this.previewTileHexCoord; // Aktualisiere die Position des zuletzt platzierten Tiles für spätere Referenz

        // Cleare das Preview Tile, da es jetzt endgültig platziert wurde
        this.clearPreviewTile();

        await this.placeAnimal(
          this.previewAnimalHexCoord,
          this.game.animalsOnHand[this.selectedHandIndex],
        );

        this.onTurnEnd();
        break;

      default:
        console.warn("default case");
        break;
    }
    if (DebugConfig.enabled && DebugConfig.doLogSmallInfo) {
      console.log(
        `Submitted action for round state ${previousState}. New round state: ${this.roundState}`,
      );
    }
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
    if (DebugConfig.enabled && DebugConfig.doLogInfoThatIsShownInUI) {
      console.groupCollapsed(
        `Hand after drawing new pair (Turn ${this.currentTurn}):`,
      );
      this.game.tilesOnHand.forEach((tile, index) => {
        console.log(
          `Pair ${index + 1}: ${tile.primaryLandscape}${tile.isKeystone ? "" : " & " + tile.secondaryLandscape} | ${this.game.getAnimalAtIndex(index)}`,
        );

        console.info(`Current round: ${this.currentTurn}/${this.gameLength}.
        \nTiles left in deck: ${this.game.deckLogic.deck.length}.
        \nAnimals left in deck: ${this.game.deckLogic.animalDeck.length}.`);
      });
      console.groupEnd();
    }

    this.syncHandPanel();
  }

  // Erhöht die Rundenzahl und setzt GAME_OVER, wenn das Spielende erreicht ist.
  onTurnEnd() {
    this.applyCurrentPlayerTurnGain();

    // Entferne das gespielte Paar aus der Hand
    this.game.removePairFromHand(this.selectedHandIndex);

    // Aktualisiere UI und ziehe ein neues Paar nach
    this.onPairDrawn(
      this.game.deckLogic.getNextTile(),
      this.game.deckLogic.getNextAnimal(),
    );
    this.syncHandPanel();

    if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo) {
      console.groupCollapsed("Animals in deck:");

      const animalsInDeck = this.game.deckLogic.animalDeck;
      let animalCounts = {};
      animalsInDeck.forEach((animal) => {
        animalCounts[animal] = (animalCounts[animal] || 0) + 1;
      });
      for (const [animal, count] of Object.entries(animalCounts)) {
        console.log(`${animal}: ${count}`);
      }

      console.groupEnd();

      this.logGameplayInfo();
    }
    this.currentTurn++;
    this.currentPlayer = ((this.currentTurn - 1) % this.playerCount) + 1;
    this.currentRound = Math.ceil(this.currentTurn / this.playerCount);

    if (this.currentRound > this.gameLength) {
      console.log("Game Over");
      this.roundState = RoundState.GAME_OVER;
      this.syncTurnStatus();
      return;
    }

    this.syncTurnStatus();

    this.roundState = RoundState.CHOOSE_TILE;
  }

  syncTurnStatus() {
    const statusPayload = {
      currentRound: Math.min(this.currentRound, this.gameLength),
      totalRounds: this.gameLength,
      currentPlayer: this.currentPlayer,
      playerCount: this.playerCount,
      scoresByPlayer: this.playerScores,
    };

    this.handPanel.updateStatus(statusPayload);
    this.scoreBoard.update(statusPayload);
  }

  calculateBoardTotalScore() {
    const scoreResult = calculateScoreForGrid(
      this.game.gridManager,
      "board",
      0,
    );

    return Number(scoreResult.totalScore || 0);
  }

  applyCurrentPlayerTurnGain() {
    const scoreAfterTurn = this.calculateBoardTotalScore();
    const scoreGain = scoreAfterTurn - Number(this.lastBoardTotalScore || 0);
    const normalizedScoreGain = Number.isFinite(scoreGain)
      ? Math.max(0, scoreGain)
      : 0;

    this.playerScores[this.currentPlayer - 1] += normalizedScoreGain;
    this.lastBoardTotalScore = scoreAfterTurn;
  }

  initializeStartingScore() {
    const startingScore = this.calculateBoardTotalScore();
    this.lastBoardTotalScore = startingScore;
    this.playerScores[this.currentPlayer - 1] = startingScore;
    this.syncTurnStatus();
  }

  // Platziert ein Tile an einer zufälligen, leeren Nachbar-Position mit zufälliger Rotation.
  // Hinweis: Rotation ist ein Index (0-5) für 60° Schritte.
  // Returnt das model
  async placePreviewTile(hexCoord, tileData, rotation = 0, setToGrid = false) {
    const tile = new Tile(tileData, rotation);
    return await this.game.gridManager.setTile(
      hexCoord,
      tile,
      rotation,
      setToGrid,
    );
  }

  async removePreviewTile() {
    const response = await this.game.gridManager.removeTileAt(
      this.previewTileHexCoord,
    );
    if (!response) {
      console.warn(
        `Failed to remove tile at ${this.previewTileHexCoord}. No tile found.`,
      );
    }

    this.clearPreviewTile();

    return response;
  }

  // Platziert ein Tile und fügt es dem Grid hinzu.
  // Returnt das model
  async placeTile(hexCoord, tileData, rotation) {
    const tile = new Tile(tileData, rotation);
    return await this.game.gridManager.setTile(hexCoord, tile, rotation);
  }

  async placeAnimal(hexCoord, animal) {
    return await this.game.gridManager.setAnimal(hexCoord, animal);
  }

  getRandomUnoccupiedNeighbour(hexCoord) {
    return this.game.gridManager.getRandomUnoccupiedNeighbour(hexCoord);
  }

  getRandomRotation() {
    return Math.floor(Math.random() * 6);
  }

  getGame() {
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
    const worldPos = newHexCoord.hexToWorld(
      newHexCoord,
      this.game.gridManager.hexSize,
    );
    const vector = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z);

    // Falls geladener Rückgabewert ein einzelnes Objekt mit `position`
    if (this.previewTileModel.position) {
      if (this.useSmoothAnimator) {
        this.smoothAnimator.moveTo(
          this.previewTileModel,
          vector,
          this.moveTileSpeed,
        );
      } else {
        this.previewTileModel.position.set(vector.x, vector.y, vector.z);
      }
    }

    // Falls Rückgabe ein Objekt mit zwei Hälften
    else if (
      this.previewTileModel.primaryHalf ||
      this.previewTileModel.secondaryHalf
    ) {
      if (
        this.previewTileModel.primaryHalf &&
        this.previewTileModel.primaryHalf.position
      ) {
        if (this.useSmoothAnimator) {
          if (
            this.previewTileModel.primaryHalf &&
            this.previewTileModel.primaryHalf.position
          ) {
            this.smoothAnimator.moveTo(
              this.previewTileModel.primaryHalf,
              vector,
              this.moveTileSpeed,
            );
          }
          if (
            this.previewTileModel.secondaryHalf &&
            this.previewTileModel.secondaryHalf.position
          ) {
            this.smoothAnimator.moveTo(
              this.previewTileModel.secondaryHalf,
              vector,
              this.moveTileSpeed,
            );
          }
        } else {
          this.previewTileModel.primaryHalf.position.set(
            vector.x,
            vector.y,
            vector.z,
          );
          this.previewTileModel.secondaryHalf.position.set(
            vector.x,
            vector.y,
            vector.z,
          );
        }
      }
    } else {
      console.error(
        "updatePreviewTilePosition: previewTileModel shape unknown, cannot set position",
      );
    }

    this.game.gridManager.refreshBlueprints(newHexCoord, isMicroMovement);
  }

  updatePreviewAnimalPosition(newHexCoord) {
    if (!newHexCoord) {
      console.error("updatePreviewAnimalPosition called with null newHexCoord");
      return;
    }

    this.previewAnimalHexCoord = newHexCoord;

    this.getAnimalManager().hoverAnimal(newHexCoord, this.getPreviewAnimal());
  }

  /**
   *
   * @param {boolean} clockwise = true wenn im Uhrzeigersinn rotiert werden soll, sonst gegen den Uhrzeigersinn
   */
  rotatePreviewTile(clockwise = true) {
    if (!this.previewTileModel || this.roundState !== RoundState.PLACE_TILE) {
      return;
    }

    // Aktualisiere die Rotation im 60°-Schritt (Index 0-5)
    this.previewTileRotation =
      (this.previewTileRotation + (clockwise ? 5 : 1)) % 6;

    // Setze die neue Rotation am Modell (Rotation um Y-Achse)
    const angle = this.previewTileRotation * (Math.PI / 3); // 60° Schritte
    if (this.previewTileModel.rotation) {
      if (this.useSmoothAnimator) {
        this.smoothAnimator.rotateTo(
          this.previewTileModel,
          new THREE.Euler(0, angle, 0),
          this.rotateTileSpeed,
        );
      } else {
        this.previewTileModel.rotation.y = angle;
      }
    } else {
      if (
        this.previewTileModel.primaryHalf &&
        this.previewTileModel.primaryHalf.rotation
      ) {
        if (this.useSmoothAnimator) {
          this.smoothAnimator.rotateTo(
            this.previewTileModel.primaryHalf,
            new THREE.Euler(0, angle, 0),
            this.rotateTileSpeed,
          );
        } else {
          this.previewTileModel.primaryHalf.rotation.y = angle;
        }
      }
      if (
        this.previewTileModel.secondaryHalf &&
        this.previewTileModel.secondaryHalf.rotation
      ) {
        if (this.useSmoothAnimator) {
          this.smoothAnimator.rotateTo(
            this.previewTileModel.secondaryHalf,
            new THREE.Euler(0, angle, 0),
            this.rotateTileSpeed,
          );
        } else {
          this.previewTileModel.secondaryHalf.rotation.y = angle;
        }
      }
    }
  }

  clearPreviewTile() {
    this.previewTileHexCoord = null;
    this.previewTileRotation = 0;
    const removeModelFromScene = (model) => {
      if (!model) return;

      // Keystone
      if (model.position) {
        this.scene.remove(model);
        return;
      }

      // Doppel-Landschaft
      if (model.primaryHalf) this.scene.remove(model.primaryHalf);
      if (model.secondaryHalf) this.scene.remove(model.secondaryHalf);
    };

    if (this.previewTileModel) {
      removeModelFromScene(this.previewTileModel);
    } else if (this.previewTileModelPromise) {
      this.previewTileModelPromise
        .then((model) => {
          removeModelFromScene(model);
        })
        .catch(() => {});
    }
  }

  clearCurrentTurnTile() {
    if (this.currentTurnTileModel) {
      this.scene.remove(this.currentTurnTileModel);
      this.currentTurnTileModel = null;
    }
  }

  clearPreviewAnimal() {
    this.previewAnimalHexCoord = null;
    this.previewAnimalRotation = 0;
    const removeModelFromScene = (model) => {
      if (!model) return;

      // Keystone
      if (model.position) {
        this.scene.remove(model);
        return;
      }

      // Doppel-Landschaft
      if (model.primaryHalf) this.scene.remove(model.primaryHalf);
      if (model.secondaryHalf) this.scene.remove(model.secondaryHalf);
    };

    if (this.previewAnimalModel) {
      removeModelFromScene(this.previewAnimalModel);
    } else if (this.previewAnimalModelPromise) {
      this.previewAnimalModelPromise
        .then((model) => {
          removeModelFromScene(model);
        })
        .catch(() => {});
    }
  }

  checkAnimalPlacement() {
    const animal = this.game.getAnimalAtIndex(this.selectedHandIndex);
    const allowedPositions = this.getAllowedAnimalPlacements(animal);

    if (allowedPositions.length === 0) {
      this.roundState = RoundState.CANNOT_PLACE_ANIMAL;
      this.getAnimalManager().showNoValidAnimalPlacementPossible(
        this.previewTileHexCoord,
      );

      console.log(
        `Es gibt keine erlaubten Positionen für die Platzierung des Tieres.
        Du kannst entweder die Tierplatzierung rückgängig machen (undo) oder die Platzierung überspringen (skip).
        undo: Controller: Ost-Button | Tastautur: B
        skip: Controller: Nord-Button | Tastatur: Y`,
      );
      return;
    }

    this.previewAnimalHexCoord =
      this.game.gridManager.getClosestHexCoordFromList(
        allowedPositions,
        this.previewTileHexCoord,
      );
    this.roundState = RoundState.PLACE_ANIMAL;

    this.updatePreviewAnimalPosition(this.previewAnimalHexCoord);
  }

  getAllowedAnimalPlacements(animal) {
    const animalManager = this.getAnimalManager();
    const allowedPositions =
      animalManager.getUnoccupiedTilesThatAllowAnimal(animal);

    return allowedPositions;
  }

  async undoTileChoice() {
    // Will only undo/be active when animal cannot be placed
    if (this.roundState === RoundState.CANNOT_PLACE_ANIMAL) {
      this.getAnimalManager().hideNoValidAnimalPlacementPossible();
      await this.removePreviewTile();
      this.clearCurrentTurnTile();
      this.clearPreviewTile();
      this.clearPreviewAnimal();
      this.roundState = RoundState.CHOOSE_TILE;
    }
  }

  skipAnimalPlacement() {
    console.log("State before skipping animal placement:", this.roundState);
    if (this.roundState !== RoundState.CANNOT_PLACE_ANIMAL) return;

    this.getAnimalManager().hideNoValidAnimalPlacementPossible();
    this.clearPreviewTile();
    this.clearPreviewAnimal();

    // Füge aktuelles Tier wieder dem Deck hinzu, da es nicht platziert wurde
    const animal = this.game.getAnimalAtIndex(this.selectedHandIndex);
    this.game.deckLogic.returnAnimalToDeck(animal);
    this.onTurnEnd();
  }

  logGameplayInfo() {
    console.info(`Current round: ${this.currentTurn}/${this.gameLength}`);

    // Grid Content
    const occupiedHexCoords = this.game.gridManager.getOccupiedHexCoords();
    let gridContent = "";
    occupiedHexCoords.forEach((hexCoord) => {
      const tile = this.game.gridManager.getTileAt(hexCoord);
      gridContent += `
                    Hex (${hexCoord.column}, ${hexCoord.row}): 
                    ${tile && tile.occupiedBy !== Animal.NONE ? "Occupied by: " + tile.occupiedBy : "Unoccupied"}`;
    });
    console.groupCollapsed(`Grid contents ${occupiedHexCoords.length}`);
    console.log(gridContent);
    console.groupEnd();

    // Score Berechnung
    const scoreResult = calculateScoreForGrid(
      this.game.gridManager,
      "player1",
      0,
    );
    console.group(`Current score result`);
    console.log("playerId:", scoreResult.playerId);
    console.log("totalScore:", scoreResult.totalScore);

    console.group("scores");
    console.log("landscapeScores:", scoreResult.scores.landscapeScores);
    console.log("animalScores:", scoreResult.scores.animalScores);
    console.groupEnd();
  }
}
