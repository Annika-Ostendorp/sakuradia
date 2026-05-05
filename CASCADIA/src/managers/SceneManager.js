// SceneManager.js
export default class SceneManager {
    constructor() {
        this.current = null;
    }

    async change(scene) {
        if (this.current) {
            this.current.exit();
        }

        this.current = scene;
        await this.current.enter();
    }

    update(delta) {
        if (this.current) {
            this.current.update(delta);
        }
    }

    render(renderer) {
        if (this.current) {
            this.current.render(renderer);
        }
    }
}