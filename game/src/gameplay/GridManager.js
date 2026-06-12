import HexCoord from "../utils/HexCoord.js";
import { TileData } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";
import * as THREE from "three";
import TextSpawner from "../rendering//TextSpawner.js";

/**
 * Verantwortlich für das Speichern und Verwalten des hexagonalen Spielfelds
 * während des Gameplays. Verwaltet eine Map von `HexCoord` -> `Tile` sowie das
 * Erzeugen und Platzieren von 3D-Modellen in der Szene.
 *
 * Wichtige Hinweise:
 * - Map-Schlüssel sind `HexCoord`-Objekte. Die Map vergleicht Schlüssel per
 *   Objekt-Referenz, nicht nach Koordinatenwerten. Daher existieren Hilfs-
 *   methoden wie `getTileAt` um koordinatenbasierte Suchen durchzuführen.
 * - Methoden, die World-Positionen benötigen, rufen `hexToWorld` auf dem
 *   `HexCoord`-Objekt auf, um Konsistenz zwischen Logik- und Render-Koordinaten
 *   zu gewährleisten.
 */
export default class GridManager {
    /**
     * Konstruktor
     * @param {THREE.Scene} scene - Optional: die 3D-Szene, zu der Modelle hinzugefügt werden.
     */
    constructor(scene) {
        this.scene = scene;
        /** Grösse des logischen Spielfelds in Zellen pro Achse (für spätere Grenzen). */
        this.gridSize = 20;
        /** Grösse einer Zelle im Weltkoordinatensystem (Skalierungsfaktor). */
        this.hexSize = 1;
        this.blueprints = [];

        /**
         * Map von HexCoord (Objekt-Referenz) auf Tile-Objekte.
         * Hinweis: Verwende `getTileAt` für koordinatenbasierte Abfragen, da ein
         * neu konstruiertes HexCoord mit denselben Zahlenwerten nicht der selben
         * Referenz entspricht.
         * @type {Map<HexCoord, Tile>}
         */
        this.grid = new Map();
        this.modelLoader = new ModelLoader();
        this.colorUtils = new ColorUtils();

        /**
         * Map von HexCoord (Objekt-Referenz) auf Text-Mesh-Objekte.
         * @type {Map<HexCoord, THREE.MeshStandardMaterial>}
         */
        this.coordGrid = new Map(); // Für Debugging: HexCoord -> Text-Mesh
        this.paintCoordinates();
    }

    /**
     * Gibt das Tile zur angegebenen Hex-Koordinate zurück.
     * @param {HexCoord} hexCoord
     * @returns {Tile | undefined}
     */
    getTile(hexCoord) {
        return this.grid.get(hexCoord);
    }

    /**
     * Gibt das Tile zur angegebenen Hex-Koordinate zurück, unabhängig von der Objekt-Referenz.
     * @param {HexCoord} hexCoord
     * @returns {Tile | undefined}
     */
    getTileAt(hexCoord) {
        for (const [placedHexCoord, tile] of this.grid.entries()) {
            if (placedHexCoord.equals(hexCoord)) {
                return tile;
            }
        }
        return undefined;
    }

    /**
     * Prüft, ob an der angegebenen Hex-Koordinate bereits ein Tile liegt.
     * @param {HexCoord} hexCoord
     * @returns {boolean}
     */
    isOccupied(hexCoord) {
        return this.getTileAt(hexCoord) !== undefined;
    }

    /**
     * Verknüpft ein Tile mit einer Hex-Koordinate.
     * @param {HexCoord} hexCoord
     * @param {Tile} tile
     * @param {number} rotation - Optionaler Rotationswert für das Tile (0-5).
     */
    async setTile(hexCoord, tile, rotation = 0, setToGrid = true) {
        tile.rotation = rotation;
        if (setToGrid){
            this.grid.set(hexCoord, tile);
            this.clearBlueprints();
            this.setCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
        }
        return await this.spawnTile(hexCoord, tile);
    }

    async spawnTile(hexCoord, tile) {
        // Validierung: Sicherstellen, dass ein HexCoord-Objekt über die
        // benötigten Methoden (z.B. hexToWorld) verfügt. Andernfalls sollte
        // der Aufrufer die Daten vorbereiten.
        if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
            throw new Error("spawnTile expects a HexCoord instance");
        }

        tile.rotation = tile.rotation || 0;

        // Konvertiere HexCoord in Welt-Position für das 3D-Modell.
        const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

        try {
            const model = await this.modelLoader.getModelForTile(tile);

            model.position.set(worldPos.x, worldPos.y, worldPos.z);
            model.rotation.y = tile.rotation * (Math.PI / 3);

            if (this.scene) {
                this.scene.add(model);
            }

            return model;
        } catch (error) {
            console.error("Fehler beim Laden von Tile-Modell:", error);
            return null;
        }
    }

    applyColorToModel(model, color) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = Array.isArray(child.material)
                    ? child.material.map((material) => material.clone())
                    : child.material.clone();
                child.material.color.set(color);
            }
        });
    }

    /**
     * Gibt eine zufällige leere Hex-Koordinate innerhalb des Spielfeldbereichs zurück.
     * @returns {HexCoord | null}
     */
    getRandomEmptyHexCoord() {
        // Bekomme alle leeren Felder mit Nachbarn
        const emptyHexCoords = this.getAllEmptyHexCoordsWithNeighbour();

        if(emptyHexCoords.length === 0){
            return null;
        }

        // Wähle zufällig eine Kandidaten-Koordinate.
        const randomIndex = Math.floor(Math.random() * emptyHexCoords.length);
        return emptyHexCoords[randomIndex];
    }

    /**
     * Gibt alle leeren Hex-Nachbarn für ein HexCoord zurück.
     * @returns {HexCoord[]}
     */
    getUnoccupiedNeighbours(hexCoord){
        const emptyNeighbours = [];
        const neighbours = hexCoord.getNeighbors();
        let surroundingUnoccupiedTiles = neighbours;
        this.paintBlueprints(surroundingOccupiedTiles, 0xff0000, true);
        for (const neighbour of neighbours){
            if (!this.isOccupied(neighbour) && // Wenn Nachbar frei ist
                this.hasOccupiedNeighbour(neighbour)){ // Und mindestens einen platzierten Nachbarn hat
                emptyNeighbours.push(neighbour);
            }
        }
        return emptyNeighbours;
    }

    /**
     * Gibt alle besetzten Hex-Nachbarn für ein HexCoord zurück.
     * @returns {HexCoord[]}
     */
    getOccupiedNeighbours(hexCoord){
        const occupiedNeighbours = [];
        const neighbours = hexCoord.getNeighbors();
        for (const neighbour of neighbours){
            if (this.isOccupied(neighbour)){
                occupiedNeighbours.push(neighbour);
            }
        }
        return occupiedNeighbours;
    }

    /**
     * Gibt zurück, ob hexCoord mindestens einen platzierten Nachbarn hat
     * @returns {boolean}
     */
    hasOccupiedNeighbour(hexCoord){
        for (const neighbour of hexCoord.getNeighbors()){
            if (this.isOccupied(neighbour)){
                return true;
            }
        }
        return false;
    }

    /**
     * Gibt eine Liste an unique HexCoords zurück, die nicht im Grid platziert wurden, jedoch platzierte Nachbarn haben.
     * @returns {HexCoord[]}
     */
    getAllEmptyHexCoordsWithNeighbour(){
        const keys = Array.from(this.grid.keys());
        if (keys.length === 0) {
            return [];
        }

        // Sammle alle benachbarten Hex-Koordinaten um bereits platzierte Tiles
        // und filtere doppelte Einträge mittels eines Hash-Caches. Dadurch wird
        // verhindert, dass dieselbe Koordinate mehrfach als Kandidat auftaucht.
        const seen = new Set();
        const emptyNeighborCandidates = [];

        for (const placedHexCoord of keys) {
            for (const neighbor of placedHexCoord.getNeighbors()) {
                // Überspringen, wenn bereits belegt.
                if (this.isOccupied(neighbor)) {
                    continue;
                }

                // hashCode() liefert eine stabile, koordinatenbasierte Repräsentation
                // damit können wir Duplikate erkennen, auch wenn die
                // HexCoord-Objekte unterschiedliche Referenzen sind.
                const key = neighbor.hashCode();
                if (seen.has(key)) {
                    continue;
                }

                seen.add(key);
                emptyNeighborCandidates.push(neighbor);
            }
        }

        if (emptyNeighborCandidates.length === 0) {
            return null;
        }
        
        //this.paintBlueprints(emptyNeighborCandidates);
        return emptyNeighborCandidates;
    }

    /**
     * Gibt das nächste freie Feld in die 2D Vektor Richtung an
     * @returns {HexCoord | null}
     */
    getHexCoordInWorldDirection(hexCoord, direction){
        // Alle freien Randfelder des aktuellen Spielfelds als Kandidaten nutzen,
        // damit die Bewegung auch weiter entfernte, intuitive Ziele erreichen kann.
        const candidates = this.getAllEmptyHexCoordsWithNeighbour();
        if (candidates.length === 0) return null;
        this.paintBlueprints(candidates, 0x00ff00);

        // Referenz-Weltposition des Start-Hex
        const originPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

        // Mappe Eingabe-Richtung (x, y) auf Welt-Richtung (x, z)
        const dirWorld = { x: direction.x, z: direction.y };
        const dirLength = Math.hypot(dirWorld.x, dirWorld.z);
        if (dirLength === 0) return null;
        dirWorld.x /= dirLength;
        dirWorld.z /= dirLength;

        // Wähle den Kandidaten mit der besten Richtungsübereinstimmung.
        // Tie-breaker: bei gleicher Richtung gewinnt das nähere Feld.
        let bestAlignment = -Number.POSITIVE_INFINITY;
        let bestDistance = Number.POSITIVE_INFINITY;
        let targetCoord = null;

        for (const candidate of candidates) {
            const candPos = candidate.hexToWorld(candidate, this.hexSize);
            const dx = candPos.x - originPos.x;
            const dz = candPos.z - originPos.z;
            const distance = Math.hypot(dx, dz);
            if (distance === 0) {
                continue;
            }

            const alignment = (dx * dirWorld.x + dz * dirWorld.z) / distance;
            if (alignment <= 0) continue; // nur vorwärts

            if (alignment > bestAlignment || (alignment === bestAlignment && distance < bestDistance)) {
                bestAlignment = alignment;
                bestDistance = distance;
                targetCoord = candidate;
            }
        }

        return targetCoord;
    }

    clearBlueprints(){
        for (const cube of this.blueprints){
            if (this.scene) {
                this.scene.remove(cube);
            }
        }
        this.blueprints = [];
    }

    /**
    // Spawne Three js cubes an den positionen
     * @param {HexCoord} hexCoord
     */
    // Parameter hexCoords: HexCoord Array
    paintBlueprints(hexCoords, color = 0x00ffff, clearExisting = true){
        if (clearExisting) {
            this.clearBlueprints();
        }

        for (const hexCoord of hexCoords){
            const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: color, opacity: 0.5, transparent: true });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(worldPos.x, worldPos.y + 0.25, worldPos.z);
            this.blueprints.push(cube);
            if (this.scene) {
                this.scene.add(cube);
            }
        }
    }

    async paintCoordinates() {
        this.coordGrid = new Map();
        const size = 10;
        for (let column = -size; column <= size; column++) {
            for (let row = -size; row <= size; row++) {
                const hexCoord = new HexCoord(column, row);

                const pos = hexCoord.hexToWorld(hexCoord, this.hexSize);
                pos.y = 0.2;

                const textMesh = await TextSpawner.spawn(
                    this.scene,
                    pos,
                    hexCoord.hashCode(),
                    0.3,
                    0xff0000
                );

                const key = hexCoord.hashCode();

                this.coordGrid.set(key, textMesh);
            }
        }
    }

    setCoordinateTextColor(hexCoord, color) {
        const key = hexCoord.hashCode();
        const textMesh = this.coordGrid.get(key);

        if (!textMesh) return;

        textMesh.material.color.set(color);
    }
}

