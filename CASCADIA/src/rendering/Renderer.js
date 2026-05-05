import * as THREE from "three";

export default class Renderer {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Canvas ins DOM
        document.body.appendChild(this.renderer.domElement);

        this.setSize(window.innerWidth, window.innerHeight);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderer.setSize(width, height);
    }

    render(scene, camera) {
        if (!scene || !camera) return;
        this.renderer.render(scene, camera);
    }

    onResize(camera) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.setSize(width, height);

        if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }

    getDOMElement() {
        return this.renderer.domElement;
    }
}