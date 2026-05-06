export default class BaseScene {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.camera = null;
    }

    enter() {}      // Wird beim Wechsel aufgerufen
    exit() {}       // Cleanup
    update(delta) {}// Game Logic
    render(renderer) {
        if (this.scene && this.camera) {
            renderer.render(this.scene, this.camera);
        }
    }
}