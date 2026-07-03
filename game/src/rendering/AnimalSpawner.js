import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getModelForAnimal } from "/src/utils/modelGetter.js";
import HexCoord from "../utils/HexCoord.js";
import { Animal } from "/src/data/Animal.js";

export default class AnimalSpawner {
  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.loader = new GLTFLoader();
    this.animalYOffset = 0.2;
  }

  async spawnAnimalAtCoord(hexCoord, animal) {
    const modelPath = getModelForAnimal(animal);

    try {
      const animalModel = await this.loadModel(modelPath);
      const position = this.hexCoordToWorldVector(hexCoord, this.gridManager);
      position.y = 0.12;
      animalModel.position.copy(position);
      animalModel.scale.setScalar(getScaleForAnimal(animal));
      this.scene.add(animalModel);

      return animalModel;
    } catch (error) {
      console.error(`Error loading model for ${animal}:`, error);
      return null;
    }
  }

  async spawnPreviewAnimalsAtCoord(hexCoord, animals) {
    const center = this.hexCoordToWorldVector(hexCoord, this.gridManager);
    const positions = getAnimalPreviewPositions(center, animals.length);
    const previewModels = [];

    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      const modelPath = getModelForAnimal(animal);

      try {
        const previewModel = await this.loadModel(modelPath);

        previewModel.position.copy(positions[i]);
        applyGhostMaterial(previewModel);

        this.scene.add(previewModel);
        previewModel.scale.setScalar(getScaleForAnimal(animal));
        previewModels.push(previewModel);
      } catch (error) {
        console.error(`Error loading preview model for ${animal}:`, error);
      }
    }

    return previewModels;
  }

  loadModel(modelPath) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          resolve(gltf.scene);
        },
        undefined,
        (error) => {
          reject(error);
        },
      );
    });
  }

  async removePreviewAnimalsFromScene(scene, previewModels) {
    if (!previewModels || previewModels.length === 0) {
      console.warn(
        `No preview animals found for hexCoord ${hexCoord.toString()}.`,
      );
      return;
    }

    for (const model of previewModels) {
      scene.remove(model);
    }
  }

  hexCoordToWorldVector(hexCoord, gridManager) {
    const worldPos = hexCoord.hexToWorld(hexCoord, gridManager.hexSize);

    return new THREE.Vector3(
      worldPos.x,
      worldPos.y + this.animalYOffset,
      worldPos.z,
    );
  }
}

function getAnimalPreviewPositions(center, count, radius = 0.35) {
  if (count <= 0) {
    return [];
  }

  if (count === 1) {
    return [center.clone()];
  }

  if (count === 2) {
    return [
      new THREE.Vector3(center.x - radius, center.y, center.z),
      new THREE.Vector3(center.x + radius, center.y, center.z),
    ];
  }

  if (count === 3) {
    const positions = [];
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < 3; i++) {
      const angle = startAngle + (i / 3) * Math.PI * 2;

      positions.push(
        new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          center.y,
          center.z + Math.sin(angle) * radius,
        ),
      );
    }

    return positions;
  }

  console.warn("getAnimalPreviewPositions supports only up to 3 animals.");
  return [center.clone()];
}

function applyGhostMaterial(model) {
  const ghostMaterial = getGhostMaterial();

  model.traverse((child) => {
    if (child.isMesh) {
      child.material = ghostMaterial.clone();
    }
  });
}

function getGhostMaterial() {
  return new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
}

function getScaleForAnimal(animal) {
  const additionalScale = 0.3;
  switch (animal) {
    case Animal.CRANE:
      return 0.1 * additionalScale;
    case Animal.JAPANMAKAK:
      return 0.09 * additionalScale;
    case Animal.KOI:
      return 0.015 * additionalScale;
    case Animal.PANDA:
      return 0.15 * additionalScale;
    case Animal.SIKA:
      return 0.1 * additionalScale;
    default:
      return 0.1 * additionalScale;
  }
}
