import * as THREE from "three";
import { getIconPathForAnimal } from "/src/utils/modelGetter.js";

export default class IconSpawner {
  #spawnedIcons = new Map();
  #spawnedFlatIcons = new Map();

  constructor(scene, gridManager) {
    this.scene = scene;
    this.gridManager = gridManager;
    this.textureLoader = new THREE.TextureLoader();
  }

  spawnIconForAnimals(animals, hexCoord, size = 0.5, highlightedAnimal = null) {
    this.clearIcons(hexCoord);

    if (!Array.isArray(animals) || animals.length === 0) {
      return [];
    }

    const validIconData = animals
      .map((animal) => {
        return {
          animal,
          path: getIconPathForAnimal(animal),
        };
      })
      .filter(({ animal, path }) => {
        if (!path) {
          console.warn("No icon path found for animal:", animal);
          return false;
        }

        return true;
      });

    const center = this.hexCoordToWorldVector(hexCoord);
    const positions = this.getIconPositions(center, validIconData.length);

    const sprites = [];

    validIconData.forEach(({ animal, path }, index) => {
      const isHighlighted = highlightedAnimal === animal;

      const texture = this.textureLoader.load(path);
      texture.colorSpace = THREE.SRGBColorSpace;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        opacity: isHighlighted ? 1.0 : 0.35,
      });

      const sprite = new THREE.Sprite(material);

      sprite.position.copy(positions[index]);

      const iconSize = isHighlighted ? size * 1.5 : size;
      sprite.scale.set(iconSize, iconSize, 1);

      // optional, damit Highlight-Icon leicht höher liegt
      if (isHighlighted) {
        sprite.position.y += 0.15;
      }

      this.scene.add(sprite);
      sprites.push(sprite);
    });

    this.#spawnedIcons.set(hexCoord, sprites);

    return sprites;
  }

  spawnFlatIconForAnimal(animal, hexCoord, size = 1, offsetY = 1.15) {
    const worldPos = hexCoord.hexToWorld(hexCoord, this.gridManager.hexSize);
    const iconPath = getIconPathForAnimal(animal);

    if (!iconPath) {
      console.warn("No icon path found for animal:", animal);
      return null;
    }

    const texture = this.textureLoader.load(iconPath);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0.33,
    });

    const hexWidth = Math.sqrt(3) * size;
    const hexHeight = 2 * size;

    const geometry = new THREE.PlaneGeometry(hexWidth, hexHeight);
    const icon = new THREE.Mesh(geometry, material);

    icon.position.set(worldPos.x, worldPos.y + offsetY, worldPos.z);

    icon.rotation.x = -Math.PI / 2;

    this.scene.add(icon);

    this.#spawnedFlatIcons.set(hexCoord, icon);

    return icon;
  }

  hexCoordToWorldVector(hexCoord, offsetY = 0) {
    const worldPos = hexCoord.hexToWorld(hexCoord, this.gridManager.hexSize);

    return new THREE.Vector3(worldPos.x, worldPos.y + offsetY, worldPos.z);
  }

  getIconPositions(center, count, radius = 0.35, height = 0.8) {
    if (count <= 0) {
      return [];
    }

    const elevatedCenter = center.clone();
    elevatedCenter.y += height;

    if (count === 1) {
      return [elevatedCenter];
    }

    if (count === 2) {
      return [
        new THREE.Vector3(
          elevatedCenter.x - radius,
          elevatedCenter.y,
          elevatedCenter.z,
        ),
        new THREE.Vector3(
          elevatedCenter.x + radius,
          elevatedCenter.y,
          elevatedCenter.z,
        ),
      ];
    }

    const positions = [];
    const startAngle = -Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + (i / count) * Math.PI * 2;

      positions.push(
        new THREE.Vector3(
          elevatedCenter.x + Math.cos(angle) * radius,
          elevatedCenter.y,
          elevatedCenter.z + Math.sin(angle) * radius,
        ),
      );
    }

    return positions;
  }

  clearIcons(hexCoord) {
    const storedHexCoord = this.getStoredHexCoord(hexCoord);

    if (!storedHexCoord) {
      return;
    }

    const icons = this.#spawnedIcons.get(storedHexCoord);

    if (!icons) {
      return;
    }

    for (const icon of icons) {
      this.scene.remove(icon);

      if (icon.material) {
        if (icon.material.map) {
          icon.material.map.dispose();
        }

        icon.material.dispose();
      }
    }

    this.#spawnedIcons.delete(storedHexCoord);
  }

  getIconsAtHexCoord(hexCoord) {
    const storedHexCoord = this.getStoredHexCoord(hexCoord);

    if (!storedHexCoord) {
      return undefined;
    }

    return this.#spawnedIcons.get(storedHexCoord);
  }

  getStoredHexCoord(hexCoord) {
    for (const storedHexCoord of this.#spawnedIcons.keys()) {
      if (storedHexCoord.equals(hexCoord)) {
        return storedHexCoord;
      }
    }

    return null;
  }

  clearAllIcons() {
    for (const icons of this.#spawnedIcons.values()) {
      for (const icon of icons) {
        this.scene.remove(icon);

        if (icon.material) {
          if (icon.material.map) {
            icon.material.map.dispose();
          }

          icon.material.dispose();
        }
      }
    }

    this.#spawnedIcons.clear();
  }

  respawnIconsForAnimals(
    hexCoord,
    animals,
    size = 0.5,
    highlightedAnimal = null,
  ) {
    return this.spawnIconForAnimals(animals, hexCoord, size, highlightedAnimal);
  }
}
