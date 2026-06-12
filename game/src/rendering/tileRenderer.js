import * as THREE from "three";
import ModelLoader from "../utils/ModelLoader.js";

const modelLoader = new ModelLoader();

/**
 * Instanziiert das 3D-Modell für ein Tile an der angegebenen Hex-Koordinate.
 * Diese Methode kümmert sich ausschließlich um das Erstellen und Positionieren des 3D-Modells.
 * Sie wird von `setTile` aufgerufen, nachdem die Logik aktualisiert wurde.
 * @param {HexCoord} hexCoord Die Hex-Koordinate, an der das Tile platziert werden soll.
 * @param {Tile} tile Das Tile-Objekt, das die Informationen über das zu spawnende Modell enthält.
 * @returns {Promise<THREE.Object3D | null>} Das instanziierte 3D-Modell oder null bei Fehlern.
 */
export async function spawnTile(scene, hexCoord, tile, hexSize) {
  if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
    throw new Error("spawnTile expects a HexCoord instance");
  }

  tile.rotation = tile.rotation || 0;

  // Konvertiere HexCoord in Welt-Position für das 3D-Modell.
  const worldPos = hexCoord.hexToWorld(hexCoord, hexSize);

  try {
    const model = await modelLoader.getModelForTile(tile);

    model.position.set(worldPos.x, worldPos.y, worldPos.z);
    model.rotation.y = tile.rotation * (Math.PI / 3);

    if (scene) {
      scene.add(model);
    }

    return model;
  } catch (error) {
    console.error("Fehler beim Laden von Tile-Modell:", error);
    return null;
  }
}

/**
 * Erstellt ein neues primitives Hex-Tile.
 * Wird beispielsweise für die Blueprint-Modelle verwendet.
 * @param {number} radius Der Radius des Hexagons (Abstand von der Mitte zu einer Ecke). Standard ist hexSize = 1.
 * @param {number} height Die Höhe des Hex-Tiles.
 * @param {number} color Die Farbe des Hex-Tiles als Hexadezimalwert (z.B. 0x44aa44 für Grün).
 * @param {number} opacity Die Opazität des Hex-Tiles (0 = transparent, 1 = undurchsichtig).
 * @returns
 */
export function createHexTile(
  radius = this.hexSize,
  height = 0.15,
  color = 0x44aa44,
  opacity = 1,
) {
  const geometry = new THREE.CylinderGeometry(
    radius, // radiusTop
    radius, // radiusBottom
    height, // height
    6, // radialSegments = Hexagon
  );

  const material = new THREE.MeshStandardMaterial({
    color: color,
    transparent: opacity < 1,
    opacity: opacity,
  });

  const hexTile = new THREE.Mesh(geometry, material);

  // Optional: besser für flache Hex-Grids ausrichten
  hexTile.rotation.y = Math.PI / 6;

  return hexTile;
}
