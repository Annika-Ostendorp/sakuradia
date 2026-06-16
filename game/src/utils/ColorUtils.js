import { Landscape } from "../data/Landscape.js";

/**
 * Gibt eine Farbe je nach Landschaftstyp zurück.
 * Diese Farben werden für die placeholder 3D-Modelle der Tiles verwendet.
 */
export function getColorForLandscape(landscape) {
  switch (landscape) {
    case Landscape.MOUNTAIN:
      return 0x000008; // Grau
    case Landscape.POND:
      return 0x3083bc; // Blau
    case Landscape.WETLAND:
      return 0x00ff00; // Gruen
    case Landscape.BAMBOOFOREST:
      return 0x228b22; // Dunkelgrün
    case Landscape.SAKURA:
      return 0xffb7c5; // Rosa
    default:
      return 0xffffff; // Weiss für undefined oder unbekannte Landschaften
  }
}

/**
 * Hilfs-Methode, um die Farbe der primitive Hex-Tiles zu ändern.
 * @param {THREE.Object3D} model Das 3D-Modell des Tiles, dessen Farbe geändert werden soll
 * @param {number} color Die neue Farbe als Hex-Wert (z.B. 0xff0000 für Rot)
 * Hinweis: Diese Methode klont die Materialien der Meshes, um sicherzustellen,
 * dass die Farbänderung nur das angegebene Modell betrifft und nicht alle Instanzen teilt,
 * die dasselbe Material verwenden.
 */
export function applyColorToModel(model, color) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone();
      child.material.color.set(color);
    }
  });
}
