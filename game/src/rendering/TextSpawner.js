import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export default class TextSpawner {
    static font = null;
    static fontPromise = null;

    static fontPath = "/assets/fonts/inter/Inter 18pt_Bold.json";

    static async loadFont() {
        if (this.font) {
            return this.font;
        }

        if (!this.fontPromise) {
            const fontLoader = new FontLoader();
            this.fontPromise = fontLoader.loadAsync(this.fontPath);
        }

        this.font = await this.fontPromise;
        return this.font;
    }

    static async spawn(
        scene,
        position,
        content,
        size = 0.4,
        color = 0xffffff
    ) {
        const font = await this.loadFont();

        const geometry = new TextGeometry(content, {
            font: font,
            size: size,
            depth: 0.05,
            curveSegments: 8,
            bevelEnabled: false,
        });

        geometry.computeBoundingBox();

        const textWidth =
            geometry.boundingBox.max.x - geometry.boundingBox.min.x;

        const centerOffset = -textWidth / 2;

        const material = new THREE.MeshStandardMaterial({
            color: color,
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            position.x + centerOffset,
            position.y,
            position.z
        );

        // Lays the text flat on the ground.
        mesh.rotation.x = -Math.PI / 2;

        scene.add(mesh);

        return mesh;
    }

    static destroy(scene, mesh) {
        if (!mesh) return;

        scene.remove(mesh);

        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        if (mesh.material) {
            mesh.material.dispose();
        }
    }
}