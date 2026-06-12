import * as THREE from 'three';
import RoundState from "../data/RoundState.js";
import GridManager from "../gameplay/GameplayManager.js";

/**
 * Verantwortlich für die Erfassung und Verarbeitung von Benutzereingaben (Tastatur und Gamepad).
 * Verbindet sich mit dem GameplayManager, um Aktionen basierend auf dem aktuellen Rundenstatus auszuführen.
 * Unterstützt Halte-Logik für kontinuierliche Bewegungen und Rotation durch Gamepad-Trigger.
 */

// Schickt input Benachrichtigung an GameplayManager je nach round state
export default class InputManager{
    constructor(scene, canvas, gameplayManager, camera) {
        this.scene = scene;
        this.canvas = canvas;
        this.gameplayManager = gameplayManager;
        this.camera = camera;

        // Definieren von Tasten-Status
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            submit: false
        };

        this.gamepadSubmitWasPressed = false;
        this.gamepadShoulderLeftWasPressed = false;
        this.gamepadShoulderRightWasPressed = false;
        this.gamepadTriggerLeftWasPressed = false;
        this.gamepadTriggerRightWasPressed = false;

        // Hand-Logik
        this.selectedTileOnHandIndex = 0;
        this.selectedAnimalOnHandIndex = 0;

        this.directionalHoldDelay = 0.3; // Beim Halten wird nach "holdDelay" Sekunden die Intervall-Logik gestartet
        this.directionalHoldInterval = 0.3; // Beim Halten wird jede "holdInterval" Sekunden die Bewegung ausgeführt

        this.isHoldingDirectional = false;
        this.timer_DirectionalHoldDelay = 0;
        this.timer_DirectionalInterval = 0;

        this.triggerHoldDelay = 0.3; // Beim Halten wird nach "holdDelay" Sekunden die Intervall-Logik gestartet
        this.triggerHoldInterval = 0.3; // Beim Halten wird jede "holdInterval" Sekunden die Bewegung ausgeführt

        this.isHoldingTrigger = false;
        this.timer_TriggerHoldDelay = 0;
        this.timer_TriggerInterval = 0;

        // Richtungs-Logik
        this.moveDirection = new THREE.Vector2();

        // Event subscriptions
        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));
    }

    // Wird vom GameplayManager aufgerufen
    update(deltaTime) {
        const inputDir = this.updateDirectionalHoldingState(deltaTime);

        this.updateGamepadInput();

        // Lese Rundenstatus im GameplayManager
        const roundState = this.gameplayManager.getCurrentRoundState();

        // Je nach State
        switch(roundState){
            case RoundState.GAME_OVER:
            case RoundState.DRAW:
                return;

            case RoundState.CHOOSE_TILE:
                this.handleChooseTile(inputDir); // Vertikale Bewegung durch Tile-Tier-Paare
                break;

            case RoundState.PLACE_TILE:
                this.handlePlaceTile(inputDir); // Dynamische Bewegung durch Hex-Grid
                this.updateGamepadTriggerHoldingState(deltaTime); // Rotation durch Gamepad Trigger halten
                break;

            default:
                console.warn("default case");
                break;
        }
    }

    // Vertikale Bewegung durch Tile-Tier-Paare
    handleChooseTile(inputDir){
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
    handlePlaceTile(inputDir){
        if (inputDir == null){
            return;
        }

        // Flip y direction ohne den gemeinsamen Richtungsvektor zu verändern.
        const movementDir = inputDir.clone();

        const previewHexCoord = this.gameplayManager.previewTileHexCoord;
        if (previewHexCoord == null){
            console.error("PreviewHexCoord is null!")
            return;
        }
        const game = this.gameplayManager.getGame();
        const gridManager = game.getGridManager();

        const isUsingStick = this.getGamepadLeftStickDirection().lengthSq() > 0;
        const isUsingDPad = this.getGamepadDPadDirection().lengthSq() > 0;
        const isMicroMovement = !isUsingStick && isUsingDPad;
        
        if (isUsingDPad) console.info("Using DPad for movement");
        const cameraRelativeDir = this.getCameraRelativeDirection(movementDir);

        const targetPosition = gridManager.getHexCoordInWorldDirection(
            previewHexCoord,
            cameraRelativeDir,
            isMicroMovement
        );

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

    getGamepad(){
        const gamepads = navigator.getGamepads();
        return gamepads[0];
    }
    
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
                if (isPressed && !this.keys.submit) {
                    this.onSubmit();
                }
                this.keys.submit = isPressed;
                break;
        }
    }

    getInputDirection() {
        const keyboardDirection = this.getKeyboardDirection();
        const dpadDirection = this.getGamepadDPadDirection();
        const stickDirection = this.getGamepadLeftStickDirection();

        if (stickDirection.lengthSq() > 0) {
            this.moveDirection.copy(stickDirection);
        } else if (dpadDirection.lengthSq() > 0) {
            this.moveDirection.copy(dpadDirection);
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
    getGamepadLeftStickDirection() {
        const direction = new THREE.Vector2();

        const gamepad = this.getGamepad();

        if (!gamepad) {
            return direction;
        }

        const deadzone = 0.55;

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

    getGamepadDPadDirection() {
        const direction = new THREE.Vector2();

        const gamepad = this.getGamepad();

        if (!gamepad) {
            return direction;
        }

        if (gamepad.buttons[12]?.pressed) this.keys.up = true; // Up
        else this.keys.up = false;
        if (gamepad.buttons[13]?.pressed) this.keys.down = true; // Down
        else this.keys.down = false;
        if (gamepad.buttons[14]?.pressed) this.keys.left = true; // Left
        else this.keys.left = false;
        if (gamepad.buttons[15]?.pressed) this.keys.right = true; // Right
        else this.keys.right = false;

        if (this.keys.up) direction.y += 1;
        if (this.keys.down) direction.y -= 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        if (direction.lengthSq() > 0) {
            direction.normalize();
        }

        return direction;
    }

    resetDirectionalHoldingState(){
        this.isHoldingDirectional = false;
        this.timer_DirectionalHoldDelay = 0;
        this.timer_DirectionalInterval = 0;
    }

    updateIndex(index){
        this.selectedTileOnHandIndex = index;
        this.gameplayManager.onHoverTileOnHand(index);
        console.log(this.selectedTileOnHandIndex);
    }

    /**
     * Handhabt die Logik für das Halten von Richtungseingaben.
     * @param {THREE.Vector2}
     * @returns 
     */
    updateDirectionalHoldingState(deltaTime){
        const inputDir = this.getInputDirection();

        // Wenn keine Eingabe getätig wird und die holding flag noch true ist
        if (inputDir.lengthSq() <= 0.1){ // Input weniger als 0,1 um float-Vergleichfehler auszuschließen
            if (this.isHoldingDirectional){
                this.resetDirectionalHoldingState()
            }
            return null;
        }

        // Bei Eingabe
        if(this.isHoldingDirectional){
            // Falls wir auf den Hold timer warten
            if(this.timer_DirectionalHoldDelay > 0){
                this.timer_DirectionalHoldDelay -= deltaTime;
                return null; // Return early
            }

            // Falls wir auf den Interval timer warten
            if(this.timer_DirectionalInterval > 0){
                this.timer_DirectionalInterval -= deltaTime;
                return null; // Return early
            }

            // Setze hold interval zurück, wenn er abgelaufen ist
            this.timer_DirectionalInterval = this.directionalHoldInterval;
        }
        // Falls Eingabe getätigt wird, wir aber noch nicht im Hold Zustand sind
        else{
            this.isHoldingDirectional = true;
            this.timer_DirectionalHoldDelay = this.directionalHoldDelay;
        }

        return inputDir;
    }

    updateGamepadInput() {
        // Validiere gamepad
        const gamepad = this.getGamepad();

        if (!gamepad) {
            this.gamepadSubmitWasPressed = false;
            return;
        }
        
        // Submitting
        const submitButton = gamepad.buttons[0]; // Xbox A / PlayStation Cross
        const isPressed = submitButton?.pressed === true;

        if (isPressed && !this.gamepadSubmitWasPressed) {
            this.onSubmit();
        }

        this.gamepadSubmitWasPressed = isPressed;

        // LB/RB
        const shoulderLeftButton = gamepad.buttons[4]; // Xbox LB / PlayStation L1
        const shoulderRightButton = gamepad.buttons[5]; // Xbox RB / PlayStation R1
        const triggerLeftButton = gamepad.buttons[6]; // Xbox LT / PlayStation L2
        const triggerRightButton = gamepad.buttons[7]; // Xbox RT / PlayStation R2
        const isShoulderLeftPressed = shoulderLeftButton?.pressed === true;
        const isShoulderRightPressed = shoulderRightButton?.pressed === true;
        const isTriggerLeftPressed = triggerLeftButton?.pressed === true;
        const isTriggerRightPressed = triggerRightButton?.pressed === true;

        if (isShoulderLeftPressed && !this.gamepadShoulderLeftWasPressed
          || isTriggerLeftPressed && !this.gamepadTriggerLeftWasPressed
        ){
            this.gameplayManager.rotatePreviewTile(false); // counter-clockwise
        }

        if (isShoulderRightPressed && !this.gamepadShoulderRightWasPressed
          || isTriggerRightPressed && !this.gamepadTriggerRightWasPressed){
            this.gameplayManager.rotatePreviewTile(true); // clockwise
        }

        this.gamepadShoulderLeftWasPressed = isShoulderLeftPressed;
        this.gamepadShoulderRightWasPressed = isShoulderRightPressed;
        this.gamepadTriggerLeftWasPressed = isTriggerLeftPressed;
        this.gamepadTriggerRightWasPressed = isTriggerRightPressed;
    }

    updateGamepadTriggerHoldingState(deltaTime){
        const gamepad = this.getGamepad();
        if (!gamepad) {
            this.isHoldingTrigger = false;
            return;
        }

        const isHoldingAnyTrigger = this.gamepadShoulderLeftWasPressed
            || this.gamepadShoulderRightWasPressed
            || this.gamepadTriggerLeftWasPressed
            || this.gamepadTriggerRightWasPressed;

        if (isHoldingAnyTrigger !== this.isHoldingTrigger){
            this.isHoldingTrigger = isHoldingAnyTrigger;
            this.timer_TriggerHoldDelay = this.triggerHoldDelay;
            this.timer_TriggerInterval = 0;
        }

        if (this.isHoldingTrigger){
            if (this.timer_TriggerHoldDelay > 0){
                this.timer_TriggerHoldDelay -= deltaTime;
                return;
            }
            if (this.timer_TriggerInterval > 0){
                this.timer_TriggerInterval -= deltaTime;
                return;
            }
            this.timer_TriggerInterval = this.triggerHoldInterval;

            if (this.gamepadShoulderLeftWasPressed || this.gamepadTriggerLeftWasPressed){
                this.gameplayManager.rotatePreviewTile(false); // counter-clockwise
            }

            if (this.gamepadShoulderRightWasPressed|| this.gamepadTriggerRightWasPressed){
                this.gameplayManager.rotatePreviewTile(true); // clockwise
            }
        }
    }


    onSubmit(){
        this.gameplayManager.onSubmitted();
    }

    
    /**
     * 
     * @returns {THREE.Vector2} Der Vorwärtsvektor der Kamera in der XZ-Ebene, normalisiert.
     */
    getCameraRelativeDirection(inputDirection) {

        // Fallback, wenn camera nicht verfügbar
        if (!this.camera) {
            console.error("Camera missing in InputManager");
            return inputDirection.clone();
        }

        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);

        // Ignore camera height/tilt.
        forward.y = 0;

        if (forward.lengthSq() === 0) {
            return new THREE.Vector2(inputDirection.x, inputDirection.y);
        }

        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const worldDirection = new THREE.Vector3();

        // inputDirection.y = forward/backward
        // inputDirection.x = right/left
        worldDirection
            .addScaledVector(forward, inputDirection.y)
            .addScaledVector(right, inputDirection.x);

        if (worldDirection.lengthSq() === 0) {
            return new THREE.Vector2(0, 0);
        }

        worldDirection.normalize();

        // Return as 2D world direction: x/z
        return new THREE.Vector2(worldDirection.x, worldDirection.z);
    }

}
