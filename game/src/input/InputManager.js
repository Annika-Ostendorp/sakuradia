import * as THREE from 'three';
import RoundState from "../data/RoundState.js";
import GridManager from "../gameplay/GameplayManager.js";
import DebugConfig from "../debug/DebugConfig.js";
import DebugRayDrawer from "/src/debug/DebugRayDrawer.js";

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
            submit: false,
            clockwise: false,
            counterClockwise: false,
            undoTurn: false
        };

        // Kamera-Einstellungen für Controller
        this.invertPan = false; // Ob die Pan-Bewegung (Links/Rechts) des Controllers invertiert werden soll
        this.invertTilt = false; // Ob die Tilt-Bewegung (Oben/Unten) des Controllers invertiert werden soll

        // Süd-Button des Gamepads (Xbox A / PlayStation Cross) wird als Submit-Button verwendet
        this.gamepadSubmitWasPressed = false;

        // West-Button des Gamepads (Xbox X / PlayStation Square) wird als reset-position button
        this.requestCameraReset = false; // Flag, um zu GameScene zu signalisieren, dass die Kamera zurückgesetzt werden soll

        // Ost-Button des Gamepads (Xbox B / PlayStation Circle) wird als Undo-Button verwendet
        this.undoTurnWasPressed = false;

        // Shoulder sind für seitliche Kamera-Bewegung zuständig
        this.gamepadShoulderValue = 0;
        this.cameraMoveSpeed = 0.05;

        // Trigger sind für Rotation der Tiles oder durchschalten des Hand-Indexes zuständig, je nach round state
        this.gamepadTriggerLeftWasPressed = false;
        this.gamepadTriggerRightWasPressed = false;
        this.gamePadTriggerLeftIsHeld = false;
        this.gamePadTriggerRightIsHeld = false;

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

    getInvertPan(){
        return this.invertPan;
    }

    getInvertTilt() {
        return this.invertTilt;
    }

    getShoulderInput(){
        return this.gamepadShoulderValue;
    }

    doResetCamera(){
        if (this.requestCameraReset){
            this.requestCameraReset = false; // Reset Flag
            return true;
        }
        return false;
    }

    // Wird vom GameplayManager aufgerufen
    update(deltaTime) {
        const inputDir = this.updateDirectionalHoldingState(deltaTime);

        this.updateGamepadInput();
        this.updateGamepadTriggerHoldingState(deltaTime); // Rotation durch Gamepad Trigger halten

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
                if (this.undoTurnWasPressed){
                    this.undoTurnWasPressed = false;
                    this.gameplayManager.undoTileChoice();
                    return;
                }
                this.handlePlaceTile(inputDir); // Dynamische Bewegung durch Hex-Grid
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
        
        const cameraRelativeDir = this.getCameraRelativeDirection(movementDir);

        const targetPosition = gridManager.getHexCoordInWorldDirection(
            previewHexCoord,
            cameraRelativeDir,
            isMicroMovement
        );

        // Debugging
        if (DebugConfig.enabled && DebugConfig.doDrawRays){
            let id = (Math.random()).toString();
            const maxAttempts = 10; // Vermeide potentiell unendliche Schleife
            let attempts = 0;
            do{
                id = (Math.random()).toString();
                attempts++;
            } while (DebugRayDrawer.hasRay(id) && attempts < maxAttempts);

            const originCoord = this.gameplayManager.previewTileHexCoord;
            const origin = originCoord.hexToWorld(originCoord, 1);
            origin.y = 1;
            const debugTarget = new THREE.Vector3(targetPosition.x, 1, targetPosition.z);
            debugTarget.y = 1;
            DebugRayDrawer.clear(this.scene);
            DebugRayDrawer.drawRayTo(
                this.scene,
                id, // Unique ID
                origin,
                debugTarget,
            );
        }

        if (!targetPosition) {
            console.info("No targetPosition found in handlePlaceTile");
            return;
        }
        if(targetPosition == undefined){
            console.warn("targetPosition is undefined in handlePlaceTile");
            return;
        }

        this.gameplayManager.updatePreviewTilePosition(targetPosition, isMicroMovement);
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
    // event.code z.B. "KeyW" für W oder "ArrowUp" für Pfeil nach oben.
    // isPressed ist true bei Keydown, false bei Keyup.
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
            case 'Space':
                if (isPressed && !this.keys.submit) {
                    this.onSubmit();
                }
                this.keys.submit = isPressed;
                break;

            case 'KeyQ':
                this.tryRotate(false); // counter-clockwise
                this.keys.counterClockwise = isPressed;
                break;

            case 'KeyE':
                this.tryRotate(true); // clockwise
                this.keys.clockwise = isPressed;
                break;

            case 'KeyR':
                if (isPressed){
                    this.requestCameraReset = true;
                }
                break;
            
            case 'KeyB':
                if (isPressed){
                    this.undoTurnWasPressed = true;
                }
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

        if (gamepad.buttons[12]?.pressed) // DPad Up
            this.keys.up = true; // Up
        else this.keys.up = false;

        if (gamepad.buttons[13]?.pressed) // DPad Down
            this.keys.down = true; // Down
        else this.keys.down = false;

        if (gamepad.buttons[14]?.pressed) // DPad Left
            this.keys.left = true; // Left
        else this.keys.left = false;

        if (gamepad.buttons[15]?.pressed) // DPad Right
            this.keys.right = true; // Right
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
        if (DebugConfig.enabled && DebugConfig.doLogGameplayInfo) {
            console.log(`Selected tile index: ${index}`);
        }
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
        const isSubmitButtonPressed = submitButton?.pressed === true;
        if (isSubmitButtonPressed && !this.gamepadSubmitWasPressed) {
            this.onSubmit();
        }
        this.gamepadSubmitWasPressed = isSubmitButtonPressed;

        // Resetting Camera Position
        const resetCameraButton = gamepad.buttons[2]; // Xbox X / PlayStation Square
        const isResetCameraButtonPressed = resetCameraButton?.pressed === true;
        if (isResetCameraButtonPressed){
            this.requestCameraReset = true;
        }

        // Undo turn
        const undoButton = gamepad.buttons[1]; // East  = B
        const isUndoButtonPressed = undoButton?.pressed === true;
        if (!this.undoTurnWasPressed && isUndoButtonPressed){
            this.undoTurnWasPressed = true;
        }
        // Logic executed in update() because we only want to trigger undo in the correct round state (RoundState.PLACE_TILE)

        // Trigger-Buttons für Rotation oder Index-Wechsel je nach round state
        const triggerLeftButton = gamepad.buttons[6]; // Xbox LT / PlayStation L2
        const triggerRightButton = gamepad.buttons[7]; // Xbox RT / PlayStation R2
        const isTriggerLeftPressed = triggerLeftButton?.pressed === true;
        const isTriggerRightPressed = triggerRightButton?.pressed === true;

        // Key Down = In diesem Frame gedrückt
        const triggerLeftIsKeyDown = isTriggerLeftPressed && !this.gamepadTriggerLeftWasPressed;
        const triggerRightIsKeyDown = isTriggerRightPressed && !this.gamepadTriggerRightWasPressed;

        this.gamepadTriggerLeftWasPressed = isTriggerLeftPressed;
        this.gamepadTriggerRightWasPressed = isTriggerRightPressed;
        
        const roundState = this.gameplayManager.getCurrentRoundState();

        // Beim Tile auswählen:
        // Durchschalten des Hand-Indexes
        if (roundState === RoundState.CHOOSE_TILE){
            if (triggerLeftIsKeyDown && !this.gamepadTriggerRightWasPressed // Links wird gedrückt und rechts nicht
                || triggerRightIsKeyDown && !this.gamepadTriggerLeftWasPressed // Rechts wird gedrückt und links nicht
            ){
                const indexDirection = triggerLeftIsKeyDown ? 1 : -1; // Entscheide Richtung je nachdem, ob es der linke Trigger war
                const newIndex = (4 + this.selectedTileOnHandIndex + indexDirection) % 4; // +4, damit wir nicht in den negativen Bereich geraten
                this.updateIndex(newIndex);
            }
        }

        // Beim Tile platzieren:
        // Rotation des Vorschau-Tiles
        if (roundState === RoundState.PLACE_TILE){
            if (triggerLeftIsKeyDown && !this.gamepadTriggerRightWasPressed){
                this.gameplayManager.rotatePreviewTile(false); // counter-clockwise
            }
            if (triggerRightIsKeyDown && !this.gamepadTriggerLeftWasPressed){
                this.gameplayManager.rotatePreviewTile(true); // clockwise
            }
        }

        // Sideways camera control with shoulder buttons
        const shoulderLeftButton = gamepad.buttons[4]; // Xbox LB / PlayStation L1
        const shoulderRightButton = gamepad.buttons[5]; // Xbox RB / PlayStation R1
        const isShoulderLeftPressed = shoulderLeftButton?.pressed === true;
        const isShoulderRightPressed = shoulderRightButton?.pressed === true;
        
        this.gamepadShoulderValue = 0;
        if (isShoulderLeftPressed) this.gamepadShoulderValue -= this.cameraMoveSpeed;
        if (isShoulderRightPressed) this.gamepadShoulderValue += this.cameraMoveSpeed;

    }

    updateGamepadTriggerHoldingState(deltaTime){
        // Bekomme Gamepad Input
        const gamepad = this.getGamepad();

        // Keyboard Rotationstasten (Q/E)
        const isHoldingQ = this.keys.counterClockwise;
        const isHoldingE = this.keys.clockwise;
        const isHoldingOneRotateKey = isHoldingQ !== isHoldingE; // XOR mit "!==" weil BEIDE Tasten => KEINE Rotation

        // Gamepad Trigger Buttons
        const isHoldingLeft = this.gamepadTriggerLeftWasPressed;
        const isHoldingRight = this.gamepadTriggerRightWasPressed;
        const isHoldingOneTrigger = gamepad && isHoldingLeft !== isHoldingRight; // XOR mit "!==" weil BEIDE Tasten => KEINE Rotation

        // Wenn weder Trigger noch Keyboard Rotationstasten gehalten werden,
        // aber wir noch im holding Zustand sind, resetten
        if (this.isHoldingTrigger && !isHoldingOneTrigger && !isHoldingOneRotateKey){
            this.isHoldingTrigger = false;
            return;
        }

        const wantsClockwise = isHoldingRight || this.keys.clockwise;
        const wantsCounterClockwise = isHoldingLeft || this.keys.counterClockwise;
        const hasValidDirectionInput = wantsClockwise !== wantsCounterClockwise; // XOR mit "!==" weil BEIDE Tasten => KEINE Rotation

        // Wenn ein Trigger oder eine Rotationstaste gehalten wird,
        // wir aber noch nicht im Hold Zustand sind, starte Hold Timer
        if (!this.isHoldingTrigger && hasValidDirectionInput){
            this.isHoldingTrigger = true;
            this.timer_TriggerHoldDelay = this.triggerHoldDelay;
            this.timer_TriggerInterval = 0;
            return;
        }

        if (this.timer_TriggerHoldDelay > 0){
            this.timer_TriggerHoldDelay -= deltaTime;
            return;
        }
        if (this.timer_TriggerInterval > 0){
            this.timer_TriggerInterval -= deltaTime;
            return;
        }

        // Wiederholungslogik für gehaltene Tasten (Hold-Interval)
        if (hasValidDirectionInput){
            this.timer_TriggerInterval = this.triggerHoldInterval;
            if (wantsCounterClockwise){
                this.gameplayManager.rotatePreviewTile(false); // counter-clockwise
            }
            if (wantsClockwise){
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

    tryRotate(clockwise){
        if (this.keys.clockwise
            || this.keys.counterClockwise
            || this.gamepadTriggerLeftWasPressed
            || this.gamepadTriggerRightWasPressed
        ){
            return; // Wenn bereits eine Rotationstaste gedrückt ist, ignoriere weitere Rotationseingaben bei KeyDown
        }
        this.gameplayManager.rotatePreviewTile(clockwise);
    }

    updateCamera(camera){
        this.camera = camera;
    }
}
