import HexCoord from "../utils/HexCoord.js";
import { TileData } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";

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
        this.cellSize = 1;

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
    setTile(hexCoord, tile, rotation = 0, setToGrid = true) {
        tile.rotation = rotation;
        this.spawnTile(hexCoord, tile);
        if (setToGrid){
            this.grid.set(hexCoord, tile);
        }
    }

    spawnTile(hexCoord, tile) {
        // Validierung: Sicherstellen, dass ein HexCoord-Objekt über die
        // benötigten Methoden (z.B. hexToWorld) verfügt. Andernfalls sollte
        // der Aufrufer die Daten vorbereiten.
        if (!hexCoord || typeof hexCoord.hexToWorld !== "function") {
            throw new Error("spawnTile expects a HexCoord instance");
        }

        // Wir speichern das Tile erneut in der Map, falls setTile nicht
        // vorher aufgerufen wurde. Rotation defaultet auf 0.
        var hexObj = hexCoord;
        tile.rotation = tile.rotation || 0;
        this.grid.set(hexObj, tile);

        // Konvertiere Logik-Koordinate in Welt-Position für das 3D-Modell.
        var worldPos = hexObj.hexToWorld(hexCoord);

        // Keystones werden als ein einzelnes Modell geladen (statt zwei Hälften).
        // Das ermöglicht besondere Modelle/Assets für zentrale Kacheln.
        if (tile.isKeystone) {
            return this.modelLoader.loadModel(tile)
                .then(({ scene }) => {
                    // Klonen, einfärben, positionieren und in Szene einfügen.
                    var model = scene.clone(true);
                    this.applyColorToModel(model, this.colorUtils.getColorForLandscape(tile.primaryLandscape));
                    model.position.set(worldPos.x, worldPos.y, worldPos.z);

                    // Rotation: tile.rotation ist ein Hexagon-Rotationsindex
                    // (0-5); multipliziere mit 60° (= PI/3) um in Radians zu kommen.
                    model.rotation.y = tile.rotation * (Math.PI / 3);

                    if (this.scene) {
                        this.scene.add(model);
                    }

                    return model;
                })
                .catch((error) => {
                    // Fehler beim Laden eines Modells sind nicht spielkritisch
                    // (es darf das Spiel nicht komplett zum Absturz bringen).
                    console.error("Fehler beim Laden von Tile-Modell:", error);
                });
        }

        // Standardfall: Ein Tile besteht aus zwei Modellhälften (primary/secondary).
        // Wir laden das gleiche Asset zweimal und konfigurieren Farben und
        // Rotationen so, dass die beiden Hälften ein vollständiges Tile ergeben.
        return Promise.all([
            this.modelLoader.loadModel({ isKeystone: false }),
            this.modelLoader.loadModel({ isKeystone: false })
        ])
            .then(([primaryRes, secondaryRes]) => {
                var primaryHalf = primaryRes.scene.clone(true);
                var secondaryHalf = secondaryRes.scene.clone(true);

                // Beide Hälften erhalten dieselbe Position; ihre Texturen/Farben
                // und Y-Rotation unterscheiden sie.
                primaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);
                secondaryHalf.position.set(worldPos.x, worldPos.y, worldPos.z);

                this.applyColorToModel(primaryHalf, this.colorUtils.getColorForLandscape(tile.primaryLandscape));
                this.applyColorToModel(secondaryHalf, this.colorUtils.getColorForLandscape(tile.secondaryLandscape));

                // Die zweite Hälfte ist um 180° (3 * 60°) gedreht relativ zur
                // ersten Hälfte, damit sie die gegenüberliegende Seite repräsentiert.
                primaryHalf.rotation.y = tile.rotation * (Math.PI / 3);
                secondaryHalf.rotation.y = (tile.rotation + 3) * (Math.PI / 3);

                if (this.scene) {
                    this.scene.add(primaryHalf);
                    this.scene.add(secondaryHalf);
                }

                return { primaryHalf, secondaryHalf };
            })
            .catch((error) => {
                console.error("Fehler beim Laden von Tile-Modell:", error);
            });
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
    getEmptyNeighbours(hexCoord){
        const list = [];
        for (const neighbour in hexCoord.getNeighbors()){
            if (this.isOccupied(neighbour) == false){
                list.push(neighbour);
            }
        }
        return list;
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
        return emptyNeighborCandidates;
    }

    /**
     * Gibt das nächste freie Feld in die 2D Vektor Richtung an
     * @returns {HexCoord | null}
     */
    getHexCoordInWorldDirection(hexCoord, direction){
        // Bekomme alle leeren Felder mit Nachbarn
        const emptyHexCoords = this.getAllEmptyHexCoordsWithNeighbour();

        // Checks für Richtung
        const xDirectionIsPositive = direction.x > 0 ? true : false;
        const yDirectionIsPositive = direction.y > 0 ? true : false;

        // Bekomme Liste an HexCoords, die in der angegebenen Richtung liegen
        const hexCoordsInDirection = []
        for(const coord in emptyHexCoords){
            let coordPos = hexToWorld(coord);
            // Füge valide hex der Liste hinzu
            if (xDirectionIsPositive == coordPos.x > 0 && yDirectionIsPositive == coordPos.y > 0){
                hexCoordsInDirection.push(coord);
            }
        }

        // Bekomme den nähesten HexCoord
        let leastDistance = 1000;
        let targetCoord = null;
        for (const validCoord in hexCoordsInDirection){
            const distance = HexCoord.distance(hexCoord, validCoord);
            // Wenn Distanz kleiner, mindestens jedoch 0.5 beträgt, setze neue nähsten HexCoord
            if (distance < leastDistance && distance >= 0.5){
                leastDistance = distance;
                targetCoord = validCoord;
            }
        }

        return targetCoord;
    }
}

