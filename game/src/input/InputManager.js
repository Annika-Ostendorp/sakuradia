

export default class InputManager{
    constructor(scene, canvas, gameplayManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.gameplayManager = gameplayManager;

        this.canvas.addEventListener("click", (event) => {
            console.log("Clicked canvas:", event.clientX, event.clientY);

            this.handleBoardClick(event);
        });
    }

    handleBoardClick(event) {
        this.gameplayManager.onInteracted();
    }
}
