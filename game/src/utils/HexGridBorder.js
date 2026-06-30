import * as THREE from "three";
import HexCoord from "/src/utils/HexCoord.js";

/**
 * Draws visual hex borders on the XZ plane.
 * Useful for debugging the hex grid layout.
 */
export default class HexGridBorder {
  constructor(scene, hexSize) {
    this.scene = scene;
    this.hexSize = hexSize;
    this.borders = [];
  }

  /**
   * Shows a square-ish area of hex borders around (0, 0).
   *
   * @param {number} radius - How far the debug grid extends in each axial direction.
   * @param {number | string} color - Border color.
   * @param {number} yOffset - Small vertical offset to avoid z-fighting.
   * @param {number} alpha - Transparency of the border.
   */
  show(radius = 8, color = 0xffffff, yOffset = 0.05, alpha = 1) {
    this.clear();

    for (let column = -radius; column <= radius; column++) {
      for (let row = -radius; row <= radius; row++) {
        const hexCoord = new HexCoord(column, row);
        const border = this.createBorder(hexCoord, color, yOffset, alpha);
        border.fog = true;
        this.scene.add(border);
        this.borders.push(border);
      }
    }
  }

  /**
   * Shows borders only for a given list of HexCoords.
   *
   * @param {HexCoord[]} hexCoords
   * @param {number | string} color
   * @param {number} yOffset
   * @param {number} alpha
   */
  showForHexCoords(hexCoords, color = 0xffffff, yOffset = 0.05, alpha = 1) {
    this.clear();

    for (const hexCoord of hexCoords) {
      if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
        console.warn("Skipping invalid HexCoord:", hexCoord);
        continue;
      }

      const border = this.createBorder(hexCoord, color, yOffset, alpha);

      this.scene.add(border);
      this.borders.push(border);
    }
  }

  /**
   * Shows borders around all currently occupied grid positions.
   *
   * @param {GridManager} gridManager
   * @param {number | string} color
   * @param {number} yOffset
   * @param {number} alpha
   */
  showForGrid(gridManager, color = 0xffffff, yOffset = 0.05, alpha = 1) {
    const hexCoords = Array.from(gridManager.grid.keys());
    this.showForHexCoords(hexCoords, color, yOffset, alpha);
  }

  /**
   * Creates one hex border as a THREE.LineLoop.
   *
   * @param {HexCoord} hexCoord
   * @param {number | string} color
   * @param {number} yOffset
   * @param {number} alpha
   * @returns {THREE.LineLoop}
   */
  createBorder(hexCoord, color = 0xffffff, yOffset = 0.05, alpha = 1) {
    const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);
    const points = [];

    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 6 + i * (Math.PI / 3);

      points.push(
        new THREE.Vector3(
          worldPos.x + Math.cos(angle) * this.hexSize,
          worldPos.y + yOffset,
          worldPos.z + Math.sin(angle) * this.hexSize,
        ),
      );
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: alpha,
    });

    return new THREE.LineLoop(geometry, material);
  }

  /**
   * Removes and disposes all currently drawn borders.
   */
  clear() {
    for (const border of this.borders) {
      this.scene.remove(border);

      if (border.geometry) {
        border.geometry.dispose();
      }

      if (border.material) {
        border.material.dispose();
      }
    }

    this.borders = [];
  }
}
