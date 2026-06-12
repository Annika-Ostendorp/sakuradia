import * as THREE from "three";
import DebugConfig from "./DebugConfig.js";

export default class DebugRayDrawer {
    static rays = new Map();

    /**
     * Draws or replaces a debug ray.
     * @param {THREE.Scene} scene
     * @param {string} id - Unique name for this ray.
     * @param {THREE.Vector3 | {x:number,y:number,z:number}} origin
     * @param {THREE.Vector3 | THREE.Vector2 | {x:number,y?:number,z?:number}} direction
     * @param {number} length
     * @param {number} color
     */
    static drawRay(scene, id, origin, direction, length = 2, color = 0xffff00) {
        if (!DebugConfig.enabled) {
            return null;
        }

        this.removeRay(scene, id);

        const originVector = new THREE.Vector3(
            origin.x,
            origin.y ?? 0,
            origin.z ?? 0
        );

        const directionVector = this.toVector3Direction(direction);

        if (directionVector.lengthSq() === 0) {
            console.warn(`DebugRayDrawer: Direction for ray "${id}" is zero.`);
            return null;
        }

        directionVector.normalize();

        const arrow = new THREE.ArrowHelper(
            directionVector,
            originVector,
            length,
            color,
            length * 0.25,
            length * 0.12
        );

        scene.add(arrow);
        this.rays.set(id, arrow);

        return arrow;
    }

    /**
     * Draws a ray from one world position to another.
     * @param {THREE.Scene} scene
     * @param {string} id
     * @param {THREE.Vector3 | {x:number,y:number,z:number}} from
     * @param {THREE.Vector3 | {x:number,y:number,z:number}} to
     * @param {number} color
     */
    static drawRayTo(scene, id, from, to, color = 0x00ff00) {
        const fromVector = new THREE.Vector3(
            from.x,
            from.y ?? 0,
            from.z ?? 0
        );

        const toVector = new THREE.Vector3(
            to.x,
            to.y ?? 0,
            to.z ?? 0
        );

        const direction = toVector.clone().sub(fromVector);
        const length = direction.length();

        return this.drawRay(scene, id, fromVector, direction, length, color);
    }

    /**
     * Removes one ray by id.
     * @param {THREE.Scene} scene
     * @param {string} id
     */
    static removeRay(scene, id) {
        const ray = this.rays.get(id);

        if (!ray) {
            return;
        }

        scene.remove(ray);

        if (ray.line?.geometry) ray.line.geometry.dispose();
        if (ray.line?.material) ray.line.material.dispose();

        if (ray.cone?.geometry) ray.cone.geometry.dispose();
        if (ray.cone?.material) ray.cone.material.dispose();

        this.rays.delete(id);
    }

    /**
     * Removes all debug rays.
     * @param {THREE.Scene} scene
     */
    static clear(scene) {
        for (const id of this.rays.keys()) {
            this.removeRay(scene, id);
        }
    }

    /**
     * Converts Vector2 or Vector3-like directions into a THREE.Vector3.
     * Vector2 is interpreted as XZ direction: x = world x, y = world z.
     */
    static toVector3Direction(direction) {
        if (direction instanceof THREE.Vector3) {
            return direction.clone();
        }

        if (direction instanceof THREE.Vector2) {
            return new THREE.Vector3(direction.x, 0, direction.y);
        }

        return new THREE.Vector3(
            direction.x ?? 0,
            direction.y ?? 0,
            direction.z ?? 0
        );
    }

    /**
     * Checks for the existence of a ray with the given id.
     * @param {string} id
     * @returns {boolean}
     */
    static hasRay(id) {
        return this.rays.has(id);
    }
}
