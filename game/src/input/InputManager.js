// Sehr einfacher Input-Wrapper. Bindet native Canvas-Events an die Gameplay-Logik.
// Derzeit wird bei einem Klick direkt `gameplayManager.onInteracted()` aufgerufen.
export default class InputManager{
    constructor(scene, canvas, gameplayManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.gameplayManager = gameplayManager;

        this.canvas.addEventListener("click", (event) => {
            this.handleBoardClick(event);
        });
    }

    // Delegiert die Klick-Interaktion an den Gameplay-Manager. Die genaue
    // Position/Target-Auflösung verbleibt bewusst beim Gameplay/Renderer.
    handleBoardClick(event) {
        this.gameplayManager.onInteracted();
    }
}
