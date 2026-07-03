import * as THREE from "three";

export default class SmoothAnimator {
  constructor() {
    this.positionAnimations = new Map();
    this.rotationAnimations = new Map();

    // Replaces the old random shake logic.
    // This is an idle attention animation for selected / movable objects.
    this.attentionAnimations = new Map();
  }

  /**
   * Smoothly moves a model towards a target position.
   *
   * @param {THREE.Object3D} model - The model to move.
   * @param {THREE.Vector3} targetPosition - The target position.
   * @param {number} speed - Higher means faster movement.
   */
  moveTo(model, targetPosition, speed = 8) {
    if (!model || !targetPosition) return;

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
    if (!model || !targetRotation) return;

    const targetQuaternion = new THREE.Quaternion().setFromEuler(
      targetRotation,
    );

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
    if (!model || !targetQuaternion) return;

    this.rotationAnimations.set(model, {
      targetQuaternion: targetQuaternion.clone(),
      speed,
    });
  }

  /**
   * Starts a subtle video-game-like idle animation.
   *
   * This should be used for the preview tile to show:
   * "This is the tile you are currently moving."
   *
   * It does NOT randomly shake the model.
   * It moves around its base position in a small readable swirl.
   *
   * @param {THREE.Object3D} model
   * @param {object|number} optionsOrIntensity
   */
  startAttention(model, optionsOrIntensity = {}) {
    if (!model) return;

    const options =
      typeof optionsOrIntensity === "number"
        ? { radius: optionsOrIntensity }
        : optionsOrIntensity;

    const existingAnimation = this.attentionAnimations.get(model);

    if (existingAnimation) {
      existingAnimation.radius = options.radius ?? existingAnimation.radius;
      existingAnimation.height = options.height ?? existingAnimation.height;
      existingAnimation.speed = options.speed ?? existingAnimation.speed;
      existingAnimation.phaseOffset =
        options.phaseOffset ?? existingAnimation.phaseOffset;
      return;
    }

    this.attentionAnimations.set(model, {
      // Small enough that the tile still clearly sits on its hex.
      radius: options.radius ?? 0.055,

      // Small vertical movement, readable but not floaty in a cheap way.
      height: options.height ?? 0.025,

      // Animation speed in cycles-ish per second.
      speed: options.speed ?? 2.2,

      // Avoid all preview parts moving in exact sync if multiple objects use it.
      phaseOffset: options.phaseOffset ?? Math.random() * Math.PI * 2,

      time: 0,

      // Important: we always remove the old offset before applying a new one.
      // This prevents drifting.
      currentOffset: new THREE.Vector3(),
    });
  }

  stopAttention(model) {
    if (!model) return;

    const animation = this.attentionAnimations.get(model);

    if (!animation) return;

    // Remove the last visual offset so the model returns exactly to its base position.
    model.position.sub(animation.currentOffset);

    this.attentionAnimations.delete(model);
  }

  /**
   * Old API kept as alias so existing code does not break.
   *
   * @deprecated Prefer stopAttention(model).
   */
  stopShake(model) {
    this.stopAttention(model);
  }

  /**
   * Updates all active smooth animations.
   *
   * @param {number} deltaTime - Time since last frame in seconds.
   */
  update(deltaTime) {
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) return;

    this.updatePositions(deltaTime);
    this.updateRotations(deltaTime);
    this.updateAttentionAnimations(deltaTime);
  }

  updatePositions(deltaTime) {
    for (const [model, animation] of this.positionAnimations) {
      if (!model) {
        this.positionAnimations.delete(model);
        continue;
      }

      const factor = 1 - Math.exp(-animation.speed * deltaTime);

      // Important:
      // Move the logical/base position, not the visually offset attention position.
      const basePosition = this.getBasePosition(model);
      basePosition.lerp(animation.targetPosition, factor);

      this.setBasePosition(model, basePosition);

      if (basePosition.distanceTo(animation.targetPosition) < 0.001) {
        this.setBasePosition(model, animation.targetPosition);
        this.positionAnimations.delete(model);
      }
    }
  }

  updateRotations(deltaTime) {
    for (const [model, animation] of this.rotationAnimations) {
      if (!model) {
        this.rotationAnimations.delete(model);
        continue;
      }

      const factor = 1 - Math.exp(-animation.speed * deltaTime);

      model.quaternion.slerp(animation.targetQuaternion, factor);

      if (model.quaternion.angleTo(animation.targetQuaternion) < 0.001) {
        model.quaternion.copy(animation.targetQuaternion);
        this.rotationAnimations.delete(model);
      }
    }
  }

  updateAttentionAnimations(deltaTime) {
    for (const [model, animation] of this.attentionAnimations) {
      if (!model) {
        this.attentionAnimations.delete(model);
        continue;
      }

      const basePosition = this.getBasePosition(model);

      animation.time += deltaTime * animation.speed;

      const isCurrentlyMoving = this.positionAnimations.has(model);
      const isCurrentlyRotating = this.rotationAnimations.has(model);
      const shouldPauseSwirl = isCurrentlyMoving || isCurrentlyRotating;

      const t = animation.time + animation.phaseOffset;

      let x = 0;
      let z = 0;

      // Während Bewegung/Rotation kein seitliches Swirlen,
      // damit die Bewegung und Rotation sauber lesbar bleiben.
      if (true) {
        x = Math.cos(t) * animation.radius;
        z = Math.sin(t) * animation.radius;
      }

      // Die Höhe bleibt IMMER aktiv.
      // Dadurch bleibt das Preview-Tile während Bewegung/Rotation sichtbar hervorgehoben.
      const y = Math.sin(t * 2) * animation.height;

      const nextOffset = new THREE.Vector3(x, y, z);

      model.position.copy(basePosition).add(nextOffset);
      animation.currentOffset.copy(nextOffset);
    }
  }

  /**
   * Returns the logical/base position of a model.
   * If an attention animation is active, this removes its current visual offset.
   *
   * @param {THREE.Object3D} model
   * @returns {THREE.Vector3}
   */
  getBasePosition(model) {
    const animation = this.attentionAnimations.get(model);

    if (!animation) {
      return model.position.clone();
    }

    return model.position.clone().sub(animation.currentOffset);
  }

  /**
   * Sets the logical/base position of a model while preserving its current
   * attention offset.
   *
   * @param {THREE.Object3D} model
   * @param {THREE.Vector3} basePosition
   */
  setBasePosition(model, basePosition) {
    const animation = this.attentionAnimations.get(model);

    if (!animation) {
      model.position.copy(basePosition);
      return;
    }

    model.position.copy(basePosition).add(animation.currentOffset);
  }

  /**
   * Stops all animations for a specific model.
   *
   * @param {THREE.Object3D} model - The model to stop animating.
   */
  stop(model) {
    if (!model) return;

    this.positionAnimations.delete(model);
    this.rotationAnimations.delete(model);
    this.stopAttention(model);
  }

  /**
   * Stops all active animations.
   */
  clear() {
    for (const model of this.attentionAnimations.keys()) {
      this.stopAttention(model);
    }

    this.positionAnimations.clear();
    this.rotationAnimations.clear();
    this.attentionAnimations.clear();
  }
}
