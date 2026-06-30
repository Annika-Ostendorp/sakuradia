import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Landscape } from "/src/data/Landscape.js";
import { getColorForLandscape, applyColorToModel } from "./colorUtils.js";
import {
  getModelPathForKeystone,
  getModelPathForHalfTile,
} from "/src/utils/modelGetter.js";

/**
 * `ModelLoader`
 *
 * Verantwortlich für das Laden, Cachen und Einfärben von 3D-Modellen (GLTF).
 * - Kapselt `GLTFLoader` und stellt einen einfachen Cache bereit.
 * - Liefert fertige `THREE.Group`-Objekte für Kacheln (Voll- und Halbmodelle).
 * - Verwendet `ColorUtils` zur Bestimmung der Landschaftsfarben.
 */
export default class ModelLoader {

  #doApplyCorrections = true;

  /**
   * Konstruktor
   * @param {Object|null} library - Optionales Objekt mit Ressourcenpfaden (nicht zwingend benötigt).
   */
  constructor(library = null) {
    this.gltfLoader = new GLTFLoader();
    this.modelCache = new Map(); // Cache für geladene Modelle.
    this.library = library; // Wird durch den GameplayManager übergeben.
    this.getColorForLandscape = getColorForLandscape;
    this.applyColorToModel = applyColorToModel;
  }

  /**
   * Lädt ein 3D-Modell und speichert es im Cache. Gibt ein Promise zurück, das das geladene Modell enthält.
   * @param {Tile} tile - Die Kachel, für die das Modell geladen werden soll.
   * @returns {Promise<{scene: THREE.Group}>} - Ein Promise, das das geladene Modell enthält.
   */
  async getModelForTile(hexCoord, tile, hexSize) {
    if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
      throw new Error("getModelForTile expects a HexCoord instance");
    }

    const worldPos = hexCoord.hexToWorld(hexCoord, hexSize);

    let model = null;
    let positionOffset = new THREE.Vector3(0, 0, 0);

    if (tile.isKeystone) {
      model = await this.loadKeystoneModel(tile.tileData.primaryLandscape);
      positionOffset = this.getCorrectionPosition(
        tile.tileData.primaryLandscape,
        true,
      );
    } else {
      model = await this.loadDoubleModel(
        tile.tileData.primaryLandscape,
        tile.tileData.secondaryLandscape,
        hexSize,
      );
    }

    model.position.set(
      worldPos.x + positionOffset.x,
      worldPos.y + positionOffset.y,
      worldPos.z + positionOffset.z,
    );

    model.rotation.y += tile.rotation * (Math.PI / 3);

    return model;
  }

  async loadKeystoneModel(landscape) {
    const modelPath = getModelPathForKeystone(landscape);
    const { scene } = await this.loadModel(modelPath);

    const model = scene.clone(true);

    this.enableShadows(model);

    // this.normalizeModelToBounds(model, 2.5);
    if (this.#doApplyCorrections) {
      this.applyKeystoneCorrection(model, landscape);
    }
    
    return model;
  }

  async loadSingleHalfTileModel(landscape) {
    return await this.loadCorrectedHalfTileModel(landscape);
  }

  async loadDoubleModel(primaryLandscape, secondaryLandscape) {
    const firstModel = await this.loadCorrectedHalfTileModel(primaryLandscape);
    const secondModel =
      await this.loadCorrectedHalfTileModel(secondaryLandscape);

    const firstOffset = this.getCorrectionPosition(primaryLandscape, false);
    const secondOffset = this.getCorrectionPosition(secondaryLandscape, false);

    // Since a split landscape tile is ONE hex tile, both halves share the same center.
    // This value only separates the visual half models inside the same hex.
    const halfTileLocalOffset = 0;

    // Default half tile has its long side facing left.
    // That means the unrotated model works as the RIGHT half.
    // The left half must be rotated by 180 degrees.
    firstModel.rotation.y += Math.PI;

    // firstModel = left half
    firstModel.position.set(
      -halfTileLocalOffset + firstOffset.x,
      firstOffset.y,
      firstOffset.z,
    );

    // secondModel = right half
    secondModel.position.set(
      halfTileLocalOffset + secondOffset.x,
      secondOffset.y,
      secondOffset.z,
    );

    const group = new THREE.Group();
    group.add(firstModel);
    group.add(secondModel);

    return group;
  }

  loadModel(modelPath) {
    if (this.modelCache.has(modelPath)) {
      return Promise.resolve(this.modelCache.get(modelPath));
    }
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        modelPath,
        (gltf) => {
          const result = { scene: gltf.scene };
          this.modelCache.set(modelPath, result);
          resolve(result);
        },
        undefined,
        (error) => reject(error),
      );
    });
  }

  normalizeModelToBounds(model, targetSize = 1) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();

    box.getSize(size);

    const maxAxis = Math.max(size.x, size.z);

    if (maxAxis === 0) {
      console.warn("Model has zero bounds:", model);
      return;
    }

    const scale = targetSize / maxAxis;
    model.scale.multiplyScalar(scale);
  }

  async spawnLandscapeModelOverviewOnHexGrid(
    gridManager,
    startHexCoord = new HexCoord(-4, -4),
  ) {
    const scene = gridManager.scene;
    const hexSize = gridManager.hexSize;

    const landscapes = [
      Landscape.BAMBOOFOREST,
      Landscape.MOUNTAIN,
      Landscape.POND,
      Landscape.SAKURA,
      Landscape.WETLAND,
    ];

    const columnStep = 1;
    const halfTileRowOffset = 2;

    for (let i = 0; i < landscapes.length; i++) {
      const landscape = landscapes[i];

      const keystoneHexCoord = new HexCoord(
        startHexCoord.column + i * columnStep,
        startHexCoord.row,
      );

      const halfTileHexCoord = new HexCoord(
        startHexCoord.column + i * columnStep,
        startHexCoord.row + halfTileRowOffset,
      );

      const keystoneWorldPos = keystoneHexCoord.hexToWorld(
        keystoneHexCoord,
        hexSize,
      );

      const halfTileWorldPos = halfTileHexCoord.hexToWorld(
        halfTileHexCoord,
        hexSize,
      );

      const keystoneModel = await this.loadKeystoneModel(landscape);
      const keystoneOffset = this.getCorrectionPosition(landscape, true);

      keystoneModel.position.set(
        keystoneWorldPos.x + keystoneOffset.x,
        keystoneWorldPos.y + keystoneOffset.y,
        keystoneWorldPos.z + keystoneOffset.z,
      );

      scene.add(keystoneModel);

      const halfTileModel = await this.loadSingleHalfTileModel(landscape);
      const halfTileOffset = this.getCorrectionPosition(landscape, false);

      halfTileModel.position.set(
        halfTileWorldPos.x + halfTileOffset.x,
        halfTileWorldPos.y + halfTileOffset.y,
        halfTileWorldPos.z + halfTileOffset.z,
      );

      scene.add(halfTileModel);

      console.groupCollapsed(
        `Spawned hex-grid model overview for ${landscape}`,
      );
      console.log("landscape", landscape);
      console.log("keystoneHexCoord", keystoneHexCoord);
      console.log("halfTileHexCoord", halfTileHexCoord);
      console.log("keystoneWorldPos", keystoneWorldPos);
      console.log("halfTileWorldPos", halfTileWorldPos);
      console.log("keystoneOffset", keystoneOffset);
      console.log("halfTileOffset", halfTileOffset);
      console.log("keystoneModel", keystoneModel);
      console.log("halfTileModel", halfTileModel);
      console.groupEnd();
    }
  }

  applyKeystoneCorrection(model, landscape) {
    const correction =
      KEYSTONE_MODEL_CORRECTIONS[landscape] ??
      KEYSTONE_MODEL_CORRECTIONS[String(landscape).toLowerCase()];

    if (!correction) {
      console.warn("No keystone correction found for landscape:", landscape);
      return;
    }

    model.scale.multiplyScalar(correction.scale);
    model.rotation.y += THREE.MathUtils.degToRad(correction.rotationY);

    // Position is applied later to the final world position.
  }

  applyHalfTileCorrection(model, landscape) {
    const correction =
      HALF_TILE_MODEL_CORRECTIONS[landscape] ??
      HALF_TILE_MODEL_CORRECTIONS[String(landscape).toLowerCase()];

    if (!correction) {
      console.warn("No half tile correction found for landscape:", landscape);
      return;
    }

    model.scale.multiplyScalar(correction.scale);
    model.rotation.y += THREE.MathUtils.degToRad(correction.rotationY);
  }

  getCorrectionPosition(landscape, isKeystone = false) {
    const corrections = isKeystone
      ? KEYSTONE_MODEL_CORRECTIONS
      : HALF_TILE_MODEL_CORRECTIONS;

    const correction =
      corrections[landscape] ?? corrections[String(landscape).toLowerCase()];

    if (!correction) {
      return new THREE.Vector3(0, 0, 0);
    }

    return correction.position;
  }

  async loadCorrectedHalfTileModel(landscape) {
    const modelPath = getModelPathForHalfTile(landscape);
    const { scene } = await this.loadModel(modelPath);

    const model = scene.clone(true);

    this.enableShadows(model);

    if (this.#doApplyCorrections) {
      this.applyHalfTileCorrection(model, landscape);
    }

    return model;
  }

  centerModelOnLocalOrigin(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();

    box.getCenter(center);

    model.position.sub(center);
  }

  enableShadows(model) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }
}

// 0.4 is default scale for all models, but we can adjust it per landscape if needed.gr
const HALF_TILE_MODEL_CORRECTIONS = {
  bambooforest: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  mountain: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  pond: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  sakura: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  wetland: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
};


// 0.4 is default scale for all models, but we can adjust it per landscape if needed.
const KEYSTONE_MODEL_CORRECTIONS = {
  bambooforest: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  mountain: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  pond: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  sakura: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
  wetland: {
    scale: 0.4,
    rotationY: 0,
    position: new THREE.Vector3(0, 0, 0),
  },
};
