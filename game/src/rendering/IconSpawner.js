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
      const iconSize = isHighlighted ? size * 1.5 : size;
      const baseOpacity = isHighlighted ? 1.0 : 0.7;

      const material = new THREE.SpriteMaterial({
        transparent: true,
        depthWrite: false,
        opacity: baseOpacity,
      });

      const sprite = new THREE.Sprite(material);

      sprite.position.copy(positions[index]);

      sprite.userData.baseIconHeight = iconSize;
      sprite.userData.aspectRatio = 1;
      sprite.userData.baseOpacity = baseOpacity;

      // Fallback, bis die Texture geladen ist.
      sprite.scale.set(iconSize, iconSize, 1);

      const texture = this.textureLoader.load(path, (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;

        material.map = loadedTexture;
        material.needsUpdate = true;

        this.applyTextureAspectRatioToSprite(sprite, loadedTexture, iconSize);
      });

      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;

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
    this.clearFlatIcon(hexCoord);

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

    icon.userData.isFlatAnimalIcon = true;

    this.scene.add(icon);

    this.#spawnedFlatIcons.set(hexCoord, icon);

    return icon;
  }

  updateFlatIconOpacity(camera, options = {}) {
    if (!camera) {
      return;
    }

    const minOpacity = options.minOpacity ?? 0.08;
    const maxOpacity = options.maxOpacity ?? 0.42;

    const perspectiveFadeStart = options.perspectiveFadeStart ?? 8;
    const perspectiveFadeEnd = options.perspectiveFadeEnd ?? 24;

    const orthographicViewSize = options.orthographicViewSize ?? null;
    const orthographicFadeStart = options.orthographicFadeStart ?? 6;
    const orthographicFadeEnd = options.orthographicFadeEnd ?? 20;

    for (const icon of this.#spawnedFlatIcons.values()) {
      if (!icon?.material) {
        continue;
      }

      let fadeValue;

      if (camera.isOrthographicCamera) {
        if (orthographicViewSize == null) {
          continue;
        }

        fadeValue = this.inverseLerpClamped(
          orthographicFadeStart,
          orthographicFadeEnd,
          orthographicViewSize,
        );
      } else {
        const distance = camera.position.distanceTo(icon.position);

        fadeValue = this.inverseLerpClamped(
          perspectiveFadeStart,
          perspectiveFadeEnd,
          distance,
        );
      }

      icon.material.opacity = THREE.MathUtils.lerp(
        minOpacity,
        maxOpacity,
        fadeValue,
      );
    }
  }

  updateFloatingIconScale(camera, options = {}) {
    if (!camera) {
      return;
    }

    const minScaleMultiplier = options.minScaleMultiplier ?? 0.85;
    const maxScaleMultiplier = options.maxScaleMultiplier ?? 1.6;

    const minOpacityMultiplier = options.minOpacityMultiplier ?? 0.45;
    const maxOpacityMultiplier = options.maxOpacityMultiplier ?? 1.0;

    const perspectiveScaleStart = options.perspectiveScaleStart ?? 8;
    const perspectiveScaleEnd = options.perspectiveScaleEnd ?? 24;

    const orthographicViewSize = options.orthographicViewSize ?? null;
    const orthographicScaleStart = options.orthographicScaleStart ?? 6;
    const orthographicScaleEnd = options.orthographicScaleEnd ?? 20;

    for (const icons of this.#spawnedIcons.values()) {
      for (const icon of icons) {
        if (!icon?.material) {
          continue;
        }

        const baseIconHeight = icon.userData.baseIconHeight ?? 0.5;
        const aspectRatio = icon.userData.aspectRatio ?? 1;
        const baseOpacity = icon.userData.baseOpacity ?? 0.7;

        let distanceValue;

        if (camera.isOrthographicCamera) {
          if (orthographicViewSize == null) {
            continue;
          }

          distanceValue = this.inverseLerpClamped(
            orthographicScaleStart,
            orthographicScaleEnd,
            orthographicViewSize,
          );
        } else {
          const distance = camera.position.distanceTo(icon.position);

          distanceValue = this.inverseLerpClamped(
            perspectiveScaleStart,
            perspectiveScaleEnd,
            distance,
          );
        }

        const scaleMultiplier = THREE.MathUtils.lerp(
          minScaleMultiplier,
          maxScaleMultiplier,
          distanceValue,
        );

        const opacityMultiplier = THREE.MathUtils.lerp(
          minOpacityMultiplier,
          maxOpacityMultiplier,
          distanceValue,
        );

        const scaledHeight = baseIconHeight * scaleMultiplier;

        icon.scale.set(scaledHeight * aspectRatio, scaledHeight, 1);

        icon.material.opacity = baseOpacity * opacityMultiplier;
      }
    }
  }

  applyTextureAspectRatioToSprite(sprite, texture, height) {
    if (!sprite || !texture?.image) {
      return;
    }

    const imageWidth = texture.image.width;
    const imageHeight = texture.image.height;

    if (!imageWidth || !imageHeight) {
      return;
    }

    const aspectRatio = imageWidth / imageHeight;

    sprite.userData.aspectRatio = aspectRatio;
    sprite.userData.baseIconHeight = height;

    sprite.scale.set(height * aspectRatio, height, 1);
  }

  inverseLerpClamped(min, max, value) {
    if (min === max) {
      return 0;
    }

    return THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
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

  clearFlatIcon(hexCoord) {
    const storedHexCoord = this.getStoredFlatIconHexCoord(hexCoord);

    if (!storedHexCoord) {
      return;
    }

    const icon = this.#spawnedFlatIcons.get(storedHexCoord);

    if (!icon) {
      return;
    }

    this.scene.remove(icon);

    if (icon.geometry) {
      icon.geometry.dispose();
    }

    if (icon.material) {
      if (icon.material.map) {
        icon.material.map.dispose();
      }

      icon.material.dispose();
    }

    this.#spawnedFlatIcons.delete(storedHexCoord);
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

  getStoredFlatIconHexCoord(hexCoord) {
    for (const storedHexCoord of this.#spawnedFlatIcons.keys()) {
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

    for (const icon of this.#spawnedFlatIcons.values()) {
      this.scene.remove(icon);

      if (icon.geometry) {
        icon.geometry.dispose();
      }

      if (icon.material) {
        if (icon.material.map) {
          icon.material.map.dispose();
        }

        icon.material.dispose();
      }
    }

    this.#spawnedFlatIcons.clear();
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
