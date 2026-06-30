import * as THREE from "three";

export default class SmoothAnimator {
  constructor() {
    this.positionAnimations = new Map();
    this.rotationAnimations = new Map();
  }

  /**
   * Smoothly moves a model towards a target position.
   *
   * @param {THREE.Object3D} model - The model to move.
   * @param {THREE.Vector3} targetPosition - The target position.
   * @param {number} speed - Higher means faster movement.
   */
  moveTo(model, targetPosition, speed = 8) {
    this.positionAnimations.set(model, {
      targetPosition: targetPosition.clone(),
      speed,
    });
  }

  /**
   * Smoothly rotates a model towards a target rotation.
   *
   * @param {THREE.Object3D} model - The model to rotate.
   * @param {THREE.Euler} targetRotation - The target rotation.
   * @param {number} speed - Higher means faster rotation.
   */
  rotateTo(model, targetRotation, speed = 8) {
    const targetQuaternion = new THREE.Quaternion().setFromEuler(targetRotation);

    this.rotationAnimations.set(model, {
      targetQuaternion,
      speed,
    });
  }

  /**
   * Smoothly rotates a model towards a target quaternion.
   *
   * @param {THREE.Object3D} model - The model to rotate.
   * @param {THREE.Quaternion} targetQuaternion - The target rotation.
   * @param {number} speed - Higher means faster rotation.
   */
  rotateToQuaternion(model, targetQuaternion, speed = 8) {
    this.rotationAnimations.set(model, {
      targetQuaternion: targetQuaternion.clone(),
      speed,
    });
  }

  /**
   * Updates all active smooth animations.
   *
   * @param {number} deltaTime - Time since last frame in seconds.
   */
  update(deltaTime) {
    this.updatePositions(deltaTime);
    this.updateRotations(deltaTime);
  }

  updatePositions(deltaTime) {
    for (const [model, animation] of this.positionAnimations) {
      const factor = 1 - Math.exp(-animation.speed * deltaTime);

      model.position.lerp(animation.targetPosition, factor);

      if (model.position.distanceTo(animation.targetPosition) < 0.001) {
        model.position.copy(animation.targetPosition);
        this.positionAnimations.delete(model);
      }
    }
  }

  updateRotations(deltaTime) {
    for (const [model, animation] of this.rotationAnimations) {
      const factor = 1 - Math.exp(-animation.speed * deltaTime);

      model.quaternion.slerp(animation.targetQuaternion, factor);

      if (model.quaternion.angleTo(animation.targetQuaternion) < 0.001) {
        model.quaternion.copy(animation.targetQuaternion);
        this.rotationAnimations.delete(model);
      }
    }
  }

  /**
   * Stops all animations for a specific model.
   *
   * @param {THREE.Object3D} model - The model to stop animating.
   */
  stop(model) {
    this.positionAnimations.delete(model);
    this.rotationAnimations.delete(model);
  }

  /**
   * Stops all active animations.
   */
  clear() {
    this.positionAnimations.clear();
    this.rotationAnimations.clear();
  }
}