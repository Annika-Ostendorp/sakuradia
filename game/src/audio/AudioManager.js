import * as THREE from "three";
import { AudioType } from "/src/data/AudioType.js";

export default class AudioManager {
  static instance = null;

  /**
   * Returns the global AudioManager instance.
   * @returns {AudioManager}
   */
  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }

    return AudioManager.instance;
  }

  constructor() {
    if (AudioManager.instance) {
      return AudioManager.instance;
    }

    this.scene = null;
    this.camera = null;
    this.listener = new THREE.AudioListener();
    this.loader = new THREE.AudioLoader();

    this.bufferCache = new Map();
    this.activeSounds = new Set();
    this.currentInteractionSound = null;

    this.masterVolume = 1;
    this.volumes = {
      [AudioType.AMBIENT]: 1,
      [AudioType.MUSIC]: 1,
      [AudioType.SFX]: 1,
    };

    AudioManager.instance = this;
  }

  /**
   * Initializes the AudioManager.
   * The listener has to be attached to the camera.
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  initialize(scene, camera) {
    if (!scene) {
      console.warn("AudioManager.initialize: scene is missing.");
      return;
    }

    if (!camera) {
      console.warn("AudioManager.initialize: camera is missing.");
      return;
    }

    this.scene = scene;
    this.camera = camera;

    if (!camera.children.includes(this.listener)) {
      camera.add(this.listener);
    }
  }

  /**
   * Plays a sound.
   * @param {string} soundPath Example: "/assets/audio/sfx/click1.mp3"
   * @param {THREE.Vector3} position Position for 3D audio.
   * @param {number} spatialBlend 0 = 2D, 1 = 3D.
   * @param {string} audioType AudioType.AMBIENT, AudioType.MUSIC or AudioType.SFX.
   * @param {number} fadeInTime Fade-in duration in seconds.
   * @param {number} fadeOutTime Fade-out duration in seconds.
   * @returns {Promise<THREE.Audio | THREE.PositionalAudio | null>}
   */
  async play(
    soundPath,
    position = new THREE.Vector3(0, 0, 0),
    spatialBlend = 0,
    audioType = AudioType.SFX,
    fadeInTime = 1,
    fadeOutTime = 1,
  ) {
    if (!this.scene || !this.camera) {
      console.warn("AudioManager.play: AudioManager is not initialized.");
      return null;
    }

    if (!soundPath) {
      console.warn("AudioManager.play: soundPath is missing.");
      return null;
    }

    const buffer = await this.loadBuffer(soundPath);

    if (!buffer) {
      return null;
    }

    const clampedSpatialBlend = THREE.MathUtils.clamp(spatialBlend, 0, 1);
    const volume = this.getVolume(audioType);

    const sound =
      clampedSpatialBlend > 0
        ? new THREE.PositionalAudio(this.listener)
        : new THREE.Audio(this.listener);

    sound.setBuffer(buffer);
    sound.setVolume(fadeInTime > 0 ? 0 : volume);

    if (sound instanceof THREE.PositionalAudio) {
      sound.position.copy(position);
      sound.setRefDistance(5);
      sound.setRolloffFactor(1);
      sound.setDistanceModel("linear");

      this.scene.add(sound);
    }

    sound.userData.audioType = audioType;
    sound.userData.targetVolume = volume;
    sound.userData.fadeOutTime = fadeOutTime;

    this.activeSounds.add(sound);

    sound.play();

    if (fadeInTime > 0) {
      this.fadeVolume(sound, 0, volume, fadeInTime);
    }

    this.cleanupAfterEnd(sound);

    return sound;
  }

  /**
   * Plays an interaction sound and stops the previous one.
   *
   * @param {string} soundPath
   * @param {THREE.Vector3} position
   * @param {number} spatialBlend
   * @param {number} fadeInTime
   * @param {number} fadeOutTime
   * @returns {Promise<THREE.Audio | THREE.PositionalAudio | null>}
   */
  async playInteraction(
    soundPath,
    position = new THREE.Vector3(0, 0, 0),
    spatialBlend = 0,
    fadeInTime = 0,
    fadeOutTime = 0.1,
  ) {
    if (this.currentInteractionSound) {
      this.stop(this.currentInteractionSound, fadeOutTime);
      this.currentInteractionSound = null;
    }

    this.currentInteractionSound = await this.play(
      soundPath,
      position,
      spatialBlend,
      AudioType.SFX,
      fadeInTime,
      fadeOutTime,
    );

    return this.currentInteractionSound;
  }

  /**
   * Stops a sound with optional fade-out.
   * @param {THREE.Audio | THREE.PositionalAudio} sound
   * @param {number | null} fadeOutTime
   */
  stop(sound, fadeOutTime = null) {
    if (!sound) {
      return;
    }

    const actualFadeOutTime = fadeOutTime ?? sound.userData.fadeOutTime ?? 0;

    if (actualFadeOutTime <= 0) {
      this.stopImmediately(sound);
      return;
    }

    const startVolume = sound.getVolume();

    this.fadeVolume(sound, startVolume, 0, actualFadeOutTime, () => {
      this.stopImmediately(sound);
    });
  }

  /**
   * Loads and caches an audio buffer.
   * @param {string} soundPath
   * @returns {Promise<AudioBuffer | null>}
   */
  loadBuffer(soundPath) {
    if (this.bufferCache.has(soundPath)) {
      return Promise.resolve(this.bufferCache.get(soundPath));
    }

    return new Promise((resolve) => {
      this.loader.load(
        soundPath,
        (buffer) => {
          this.bufferCache.set(soundPath, buffer);
          resolve(buffer);
        },
        undefined,
        (error) => {
          console.warn(
            `AudioManager: Failed to load sound '${soundPath}'.`,
            error,
          );
          resolve(null);
        },
      );
    });
  }

  /**
   * Sets volume for an audio type.
   * @param {string} audioType
   * @param {number} volume
   */
  setVolume(audioType, volume) {
    this.volumes[audioType] = THREE.MathUtils.clamp(volume, 0, 1);

    for (const sound of this.activeSounds) {
      if (sound.userData.audioType === audioType) {
        sound.userData.targetVolume = this.getVolume(audioType);
        sound.setVolume(sound.userData.targetVolume);
      }
    }
  }

  /**
   * Returns final volume for an audio type.
   * @param {string} audioType
   * @returns {number}
   */
  getVolume(audioType) {
    const typeVolume = this.volumes[audioType] ?? 1;
    return this.masterVolume * typeVolume;
  }

  /**
   * Fades the volume of a sound.
   * @param {THREE.Audio | THREE.PositionalAudio} sound
   * @param {number} from
   * @param {number} to
   * @param {number} duration
   * @param {Function | null} onComplete
   */
  fadeVolume(sound, from, to, duration, onComplete = null) {
    const startTime = performance.now();

    const update = () => {
      if (!this.activeSounds.has(sound)) {
        return;
      }

      const elapsed = (performance.now() - startTime) / 1000;
      const t = THREE.MathUtils.clamp(elapsed / duration, 0, 1);
      const volume = THREE.MathUtils.lerp(from, to, t);

      sound.setVolume(volume);

      if (t < 1) {
        requestAnimationFrame(update);
      } else if (onComplete) {
        onComplete();
      }
    };

    update();
  }

  /**
   * Removes and stops a sound.
   * @param {THREE.Audio | THREE.PositionalAudio} sound
   */
  stopImmediately(sound) {
    if (sound.isPlaying) {
      sound.stop();
    }

    this.activeSounds.delete(sound);

    if (sound.parent) {
      sound.parent.remove(sound);
    }
  }

  /**
   * Cleans up a sound after it ended.
   *
   * @param {THREE.Audio | THREE.PositionalAudio} sound
   */
  cleanupAfterEnd(sound) {
    const duration = sound.buffer.duration;

    setTimeout(
      () => {
        if (!sound.isPlaying) {
          this.activeSounds.delete(sound);

          if (sound.parent) {
            sound.parent.remove(sound);
          }
        }
      },
      duration * 1000 + 100,
    );
  }
}
