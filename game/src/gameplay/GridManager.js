import HexCoord from "../utils/HexCoord.js";
import { TileData } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";
import * as THREE from "three";
import TextSpawner from "../rendering//TextSpawner.js";
import DebugConfig from "/src/debug/DebugConfig.js";
import DebugRayDrawer from "/src/debug/DebugRayDrawer.js";

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

    getGrid(){
        return this.grid;
    }

    getOccupiedHexCoords(){
        return Array.from(this.grid.keys()); // Alle HexCoords im Grid sind occupied
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
            if (!DebugConfig.enabled) return;
            if (DebugConfig.doLogGrid) {
                const [hexCoordStr, tileInfo] = [];
                for (const [key, value] of this.grid.entries()) {
                    hexCoordStr.push(key.toString());
                    tileInfo.push(`Tile(Landscape: ${value.primaryLandscape}, Rotation: ${value.rotation})`);
                }
                console.log(`Grid contents: ${hexCoordStr.join(', ')} => ${tileInfo.join(', ')}`);
            }
            if (DebugConfig.doShowBlueprints) this.clearBlueprints();
            if (DebugConfig.doShowCoordinateText) this.setCoordinateTextColor(hexCoord, 0xffffff); // White für besetzte Felder
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
        for (const neighbour of neighbours){
            if (!this.isOccupied(neighbour) && // Wenn Nachbar frei ist
                this.hasOccupiedNeighbour(neighbour)){ // Und mindestens einen platzierten Nachbarn hat
                emptyNeighbours.push(neighbour);
            }
        }
        return emptyNeighbours;
    }

    /**
     * Gibt die HexCoord eines zufälligen leeren benachbarten Hex-Feldes zurück.
     * Akuell herrscht die Annahme, dass dieses Hex-Feld mindestens einen freien Nachbarn hat.
     * @param {HexCoord} hexCoord - Bekomme zufälligen freien Nachbarn von diesem HexCoord
     * @returns {HexCoord}
     */
    getRandomUnoccupiedNeighbour(hexCoord){
        const emptyNeighbours = this.getUnoccupiedNeighbours(hexCoord);
        if (emptyNeighbours.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * emptyNeighbours.length);
        return emptyNeighbours[randomIndex];
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
    

    // Chronologische Abfolge bei der Suche nach dem
    // bestmöglichen HexCoord in Richtung eines Welt-Vektors
    /**
     * 
     * @param {HexCoord} hexCoord Aktuelle Position
     * @param {THREE.Vector2} direction Relative Richtung des Input-Vektors zur Kamera
     * @returns {HexCoord | null}
     */
    getHexCoordInWorldDirection(hexCoord, direction, onlyDirectNeighbours = false) {
        if (onlyDirectNeighbours) {
            return this.getDirectNeighbourInWorldDirection(hexCoord, direction);
        }

        const hexagonalSearchResult = this.tryGetHexagonalPosition(hexCoord, direction, 10);
        if (hexagonalSearchResult) {
            return hexagonalSearchResult;
        }
        console.log("No hexagonal movement found, trying direct neighbour search as fallback.");
        return this.getDirectNeighbourInWorldDirection(hexCoord, direction);
    }

    /**
     * Gibt das freie benachbarte Feld an, welche Richtung am ehesten dem Input entspricht (Skalarprodukt)
     * @returns {HexCoord | null}
     */
    getDirectNeighbourInWorldDirection(hexCoord, direction){
        const neighbours = this.getUnoccupiedNeighbours(hexCoord);

        if (neighbours.length === 0) return null;

        this.tryPaintBlueprints(neighbours);

        // Referenz-Weltposition des Start-Hex
        const originPos = hexCoord.hexToWorld(hexCoord, this.hexSize);

        const dirNormalized = new THREE.Vector2(direction.x, direction.y).normalize();

        if (dirNormalized.lengthSq() === 0) {
            return null;
        }

        let bestNeighbour = null;
        let bestSimilarity = -1;
        let bestVector = new THREE.Vector2();
        for (const neighbour of neighbours){
            const neighbourPos = neighbour.hexToWorld(neighbour, this.hexSize);

            const neighbourDir = new THREE.Vector2(
                neighbourPos.x - originPos.x,
                neighbourPos.z - originPos.z
            ).normalize();

            const similarity = this.getDirectionSimilarity(dirNormalized, neighbourDir);
            if (similarity > bestSimilarity){
                bestSimilarity = similarity;
                bestNeighbour = neighbour;
                bestVector = neighbourDir;
            }
        }

        return bestNeighbour;
    }

    /**
     * 
     * @param {HexCoord} hexCoord 
     * @param {THREE.Vector2} direction 
     * @returns {HexCoord | null}
     */
    tryGetHexagonalPosition(hexCoord, direction, maxDistance = 10) {
        let current = hexCoord;
        const hexDirection = this.getHexagonalMovementForDirection(direction);
        for (let i = 0; i < maxDistance; i++) {
            current = new HexCoord(
                current.column + hexDirection.column,
                current.row + hexDirection.row
            );

            if (!this.isOccupied(current) && this.hasOccupiedNeighbour(current)) {
                return current;
            }
        }

        return null;
    }


    /**
    // Spawne Three js cubes an den positionen
     * @param {HexCoord} hexCoord
     */
    // Parameter hexCoords: HexCoord Array
    tryPaintBlueprints(hexCoords, color = 0x84BDFF, clearExisting = true){
        if (!DebugConfig.enabled || !DebugConfig.doShowBlueprints) {
            return;
        }
        if (clearExisting) {
            this.clearBlueprints();
        }

        for (const hexCoord of hexCoords){
            const worldPos = hexCoord.hexToWorld(hexCoord, this.hexSize);
            const hexTile = this.createHexTile(
                this.hexSize * 0.95, // etwas kleiner als die regulären Tiles
                0.1,
                color,
                1
            );
            hexTile.position.set(worldPos.x, worldPos.y - 0.25, worldPos.z);
            hexTile.rotation.y = Math.PI / 3; // Gleiche Ausrichtung wie reguläre Tiles
            this.blueprints.push(hexTile);
            if (this.scene) {
                this.scene.add(hexTile);
            }
        }
    }

    clearBlueprints(){
        for (const cube of this.blueprints){
            if (this.scene) {
                this.scene.remove(cube);
            }
        }
        this.blueprints = [];
    }

    refreshBlueprints(hexCoord, onlyDirectNeighbours = false) {
        const candidates = onlyDirectNeighbours
            ? this.getUnoccupiedNeighbours(hexCoord)
            : this.getAllEmptyHexCoordsWithNeighbour();

        this.clearBlueprints();

        if (candidates && candidates.length > 0) {
            this.tryPaintBlueprints(candidates);
        }
    }

    async paintCoordinates() {
        if (!DebugConfig.enabled || !DebugConfig.doShowCoordinateText) {
            return;
        }

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

    createHexTile(radius = 1, height = 0.15, color = 0x44aa44, opacity = 1) {
        const geometry = new THREE.CylinderGeometry(
            radius,     // radiusTop
            radius,     // radiusBottom
            height,     // height
            6           // radialSegments = Hexagon
        );

        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: opacity < 1,
            opacity: opacity
        });

        const hexTile = new THREE.Mesh(geometry, material);

        // Optional: besser für flache Hex-Grids ausrichten
        hexTile.rotation.y = Math.PI / 6;

        return hexTile;
    }

    getDirectionSimilarity(a, b) {
        if (a.lengthSq() === 0 || b.lengthSq() === 0) {
            return 0;
        }

        // Return Skalarprodukt der normalisierten Vektoren als Ähnlichkeitsmaß (1 = gleiche Richtung, 0 = 90°, -1 = entgegengesetzt)
        return a.clone().normalize().dot(b.clone().normalize());
    }

    getHexagonalMovementForDirection(direction){
        const angle = Math.atan2(direction.y, direction.x);

        // Unterteilung des Kreises in 6 Sektoren für die Hex-Richtung
        const sector = Math.round(angle / (Math.PI / 3));
        const directions = HexCoord.Directions;
        return directions[(sector + 6) % 6]; // +6 um negative Indizes zu vermeiden
    }

    setAnimal(hexCoord, animal, overrideAnimalRequirements = false){
        const tile = this.getTileAt(hexCoord);
        if (!tile) return;

        // Override für Score Testing (Jedes Tier kann auf jedes Tile gesetzt werden)
        if (overrideAnimalRequirements){
            tile.occupiedBy = animal;
            return true;
        }

        if (tile.animalIsAllowed(animal)){
            tile.occupiedBy = animal;
            return true;
        }

        return false;
    }
}
