import * as THREE from 'three';

// Schickt input benachrichtigung an GameplayManager je nach round state
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
        };

        this.moveDirection = new THREE.Vector2();

        window.addEventListener('keydown', (event) => this.handleKey(event, true));
        window.addEventListener('keyup', (event) => this.handleKey(event, false));

        this.canvas.addEventListener("click", (event) => {
            this.handleBoardClick(event);
        });
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
}
