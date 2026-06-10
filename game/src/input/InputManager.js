import * as THREE from 'three';
import RoundState from "../data/RoundState.js";
import GridManager from "../gameplay/GameplayManager.js";

// Schickt input Benachrichtigung an GameplayManager je nach round state
export default class InputManager{
    constructor(scene, canvas, gameplayManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.gameplayManager = gameplayManager;

        // Definieren von Tasten-Status
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            submit: false
        };

        // Hand-Logik
        this.selectedTileOnHandIndex = 0;
        this.selectedAnimalOnHandIndex = 0;

        this.holdDelay = 0.5; // Beim Halten wird nach "holdDelay" Sekunden die Intervall-Logik gestartet
        this.holdInterval = 0.2; // Beim Halten wird jede "holdInterval" Sekunden die Bewegung ausgeführt

        this.isHolding = false;
        this.timer_HoldDelay = 0;
        this.timer_HoldInterval = 0;

        // Richtungs-Logik
        this.moveDirection = new THREE.Vector2();

        // Event subscriptions
        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));
    }

    // Wird vom GameplayManager aufgerufen
    update(deltaTime) {
        // Lese Rundenstatus im GameplayManager
        const roundState = this.gameplayManager.getCurrentRoundState();

        // Je nach State
        switch(roundState){
            case RoundState.GAME_OVER:
            case RoundState.DRAW:
                return;

            case RoundState.CHOOSE_TILE:
                this.handleChooseTile(deltaTime); // Vertikale Bewegung durch Tile-Tier-Paare
                break;

            case RoundState.PLACE_TILE:
                this.handlePlaceTile(deltaTime); // Dynamische Bewegung durch Hex-Grid
                break;

            default:
                console.warn("default case");
                break;
        }
    }

    // Vertikale Bewegung durch Tile-Tier-Paare
    handleChooseTile(deltaTime){
        // Bekomme normalisierten input vector
        const inputDir = this.updateDirection(deltaTime);
        if (inputDir == null){
            return;
        }

        // Ändere Index direkt bzw. nach intervall
        var indexDirection = 1; // Default index++
        if (inputDir.y != 0){
            indexDirection = inputDir.y > 0 ? -1 : 1 // Wenn y positiv ist, navigiere nach oben (index--) vice versa
        }
        // Wenn y == 0 (Tastatur rechts/links)
        else{
            indexDirection = inputDir.x > 0 ? 1 : -1 // Wenn x positiv ist, navigiere nach unten (index++) vice versa
        }
        const newIndex = (4 + this.selectedTileOnHandIndex + indexDirection) % 4; // +4, damit wir nicht in den negativen Bereich geraten
        this.updateIndex(newIndex);
    }

    // Dynamische Bewegung durch Hex-Grid
    handlePlaceTile(deltaTime){
        // Bekomme normalisierten input vector
        var inputDir = this.updateDirection(deltaTime);
        if (inputDir == null){
            return;
        }
        // Flip x direction
        inputDir.x = -inputDir.x;

        const previewHexCoord = this.gameplayManager.previewTileHexCoord;
        if (previewHexCoord == null){
            console.error("PreviewHexCoord is null!")
            return;
        }
        const game = this.gameplayManager.getGame();
        const gridManager = game.getGridManager();
        const targetPosition = gridManager.getHexCoordInWorldDirection(previewHexCoord, inputDir)
        if (!targetPosition) {
            console.info("No targetPosition found in handlePlaceTile");
            return;
        }
        if(targetPosition == undefined){
            console.warn("targetPosition is undefined in handlePlaceTile");
            return;
        }

        this.gameplayManager.updatePreviewTilePosition(targetPosition);
    }

    // For later implementation
    //handleCancelPlaceTile(event){
        // Let GameplayManager reset state to RoundState.CHOOSE_TILE
    //}

    // Aktualisiert den Status der Tasten basierend auf Keydown/Keyup-Events.
    // event.code z.B. "KeyW" für W oder "ArrowUp" für Pfeil nach oben. isPressed ist true bei Keydown, false bei Keyup.
    handleKey(event, isPressed) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.up = isPressed;
                break;

            case 'KeyS':
            case 'ArrowDown':
                this.keys.down = isPressed;
                break;

            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = isPressed;
                break;

            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = isPressed;
                break;

            case 'Enter':
                if (!this.keys.submit){ // Nur Bestätigen, wenn zuvor noch nicht bestätigt war
                    this.onSubmit();
                }
                this.keys.submit = isPressed;
                break;
        }
    }

    getInputDirection() {
        const keyboardDirection = this.getKeyboardDirection();
        const gamepadDirection = this.getGamepadDirection();

        // Prefer gamepad input if the stick is being moved
        if (gamepadDirection.lengthSq() > 0) {
            this.moveDirection.copy(gamepadDirection);
        } else {
            this.moveDirection.copy(keyboardDirection);
        }

        return this.moveDirection;
    }

    // Berechnet die Bewegungsrichtung basierend auf den aktuell gedrückten Tasten. Gibt einen normalisierten Vektor zurück.
    // Gibt einen normalisierten 2D Vektor zurück.
    getKeyboardDirection() {
        const direction = new THREE.Vector2();

        if (this.keys.up) direction.y += 1;
        if (this.keys.down) direction.y -= 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        if (direction.lengthSq() > 0) {
            direction.normalize();
        }

        return direction;
    }

    // Berechnet die Bewegungsrichtung basierend auf dem ersten angeschlossenen Gamepad.
    // Verwendet die linken Stick-Achsen (0 und 1) und wendet eine Deadzone an.
    // Gibt einen normalisierten 2D Vektor zurück.
    getGamepadDirection() {
        const direction = new THREE.Vector2();

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0];

        if (!gamepad) {
            return direction;
        }

        const deadzone = 0.2;

        const x = gamepad.axes[0]; 
        const y = gamepad.axes[1];

        if (Math.abs(x) > deadzone) {
            direction.x = x;
        }

        if (Math.abs(y) > deadzone) {
            direction.y = -y;
        }

        if (direction.lengthSq() > 1) {
            direction.normalize();
        }

        return direction;
    }

    resetHoldingState(){
        this.isHolding = false;
        this.timer_HoldDelay = 0;
        this.timer_HoldInterval = 0;
    }

    updateIndex(index){
        this.selectedTileOnHandIndex = index;
        this.gameplayManager.onHoverTileOnHand(index);
        console.log(this.selectedTileOnHandIndex);
    }

    // Returns inptu direction
    updateDirection(deltaTime){
        const inputDir = this.getInputDirection();

        // Wenn keine Eingabe getätig wird und die holding flag noch true ist
        if (inputDir.lengthSq() <= 0.1){ // Input weniger als 0,1 um float-Vergleichfehler auszuschließen
            if (this.isHolding){
                this.resetHoldingState()
            }
            return null;
        }

        // Bei Eingabe
        if(this.isHolding){
            // Falls wir auf den Hold timer warten
            if(this.timer_HoldDelay > 0){
                this.timer_HoldDelay -= deltaTime;
                return null; // Return early
            }

            // Falls wir auf den Interval timer warten
            if(this.timer_HoldInterval > 0){
                this.timer_HoldInterval -= deltaTime;
                return null; // Return early
            }

            // Setze hold interval zurück, wenn er abgelaufen ist
            this.timer_HoldInterval = this.holdInterval;
        }
        // Falls Eingabe getätigt wird, wir aber noch nicht im Hold Zustand sind
        else{
            this.isHolding = true;
            this.timer_HoldDelay = this.holdDelay;
        }

        return inputDir;
    }

    onSubmit(){
        this.gameplayManager.onSubmitted();
    }
}
