import HexCoord from "../utils/HexCoord.js";
import { TileData, Tile } from "./Tile.js";
import ModelLoader from "../utils/ModelLoader.js";
import ColorUtils from "../utils/ColorUtils.js";
import Animal from "../data/Animal.js"

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
    setTile(hexCoord, tile, rotation = 0) {
        tile.rotation = rotation;
        this.grid.set(hexCoord, tile);
        this.spawnTile(hexCoord, tile);
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
     *  Gibt eine zufällige, benachbarte Hex-Koordinate zurück, die noch kein Tile enthält.
     * @returns {HexCoord | null} Eine zufällige, leere Nachbar-Hex-Koordinate oder null, wenn keine vorhanden ist.
     */
    getRandomEmptyNeighbor() {
        const keys = Array.from(this.grid.keys());
        if (keys.length === 0) {
            return null;
        }
        // Sammle alle benachbarten Hex-Koordinaten um bereits platzierte Tiles
        // und filtere doppelte Einträge mittels eines Hash-Caches. Dadurch wird
        // verhindert, dass dieselbe Koordinate mehrfach als Kandidat auftaucht.
        const emptyNeighborCandidates = [];
        const seen = new Set();

        for (const placedHexCoord of keys) {
            for (const neighbor of placedHexCoord.getNeighbors()) {
                // Überspringen, wenn bereits belegt.
                if (this.isOccupied(neighbor)) {
                    continue;
                }

                // `hashCode()` sollte eine stabile, koordinatenbasierte Repräsentation
                // liefern; damit können wir Duplikate erkennen, auch wenn die
                // `HexCoord`-Objekte unterschiedliche Referenzen sind.
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

        // Wähle zufällig eine Kandidaten-Koordinate. Da die Liste aus allen
        // Nachbarn aller platzierten Tiles besteht, ist die Auswahl gleichverteilt
        // über die Kandidaten.
        const randomIndex = Math.floor(Math.random() * emptyNeighborCandidates.length);
        return emptyNeighborCandidates[randomIndex];
    }

    /**
     * Gibt eine zufällige leere Hex-Koordinate innerhalb des Spielfeldbereichs zurück.
     * @returns {HexCoord | null}
     */
    getRandomEmptyHexCoord() {
        return this.getRandomEmptyNeighbor();
    }

    // Hauptfunktion: alle Koi finden, Koi-Gruppen bilden, jede Gruppe prüfen, Punkte zusammenzählen
    get_points_for_koi(grid) {
        let sum = 0; // Endausgabe der insgesamt gesammelten Punkte für Koi-Reihen

        // Speichern von allen gefundenen zusammenhängenden Koi-Gruppen
        const sets = [];

        // Über jedes Tile im Grid gehen
        for (const [hexCoord, tile] of grid.entries()) {
            // Wenn auf diesem Tile kein Koi --> überspringen (continue)
            if (tile.occupiedBy !== Animal.KOI) {
                continue;
            }

            // Wenn best. Koi schon in gefundener Gruppe -> nicht nochmal von ihm aus suchen
            if (this.setsContainCoord(sets, hexCoord)) {
                continue;
            }

            // Neues Set für zusammenhängende Koi-Gruppe
            const set = new Set();

            // Rekursiv alle benachbarten Koi finden
            this.getNeighborKoi(hexCoord, grid, set);

            // Gefundene Gruppe speichern
            sets.push(set);
        }

        // jede gefundene Koi-Gruppe auswerten
        for (const set of sets) {
            // Koi-Gruppe zählt nur, wenn sie gültige Reihe ist
            if (this.isValidKoiLine(set)) {
                sum += this.getKoiPoints(set.size);
            }
        }

        return sum; // am Ende Gesamtpunktzahl zurückgeben
    }

    // Alle Koi finden, die zu derselben Gruppe gehören -> solange bis keine neuen Koi mehr gefunden werden
    getNeighborKoi(hexCoord, grid, set) {
        // Aktuelle Koordinate gehört wieder zur aktuellen Koi-Gruppe
        set.add(hexCoord);

        // Hex-Felder haben 6 Nachbarn -> diese holen
        const neighbors = hexCoord.getNeighbors();

        // Jeden Nachbarn prüfen
        for (const neighbor of neighbors) {
            // Wenn Nachbar schon im Set --> nicht mehr endlos im Kreis suchen
            if (this.setContainsCoord(set, neighbor)) {
                continue;
            }

            // Tile an Nachbarposition suchen
            const neighborTile = this.getTileFromGridAt(grid, neighbor);

            // Wenn dort Tile liegt und darauf Koi ist --> dieser Nachbar gehört zur selben Koi-Gruppe
            if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.KOI) {
                set.add(neighbor);

                // Von diesem Nachbar-Koi aus dann weiter suchen
                this.getNeighborKoi(neighbor, grid, set);
            }
        }
    }

    // Prüfen, ob Gruppe überhaupt gültige Koi-Reihe ist -> Form der Gruppe prüfen
    isValidKoiLine(set) {
        // Eine Koi-Reihe ist gültig, wenn jeder Koi höchstens zwei andere Koi direkt als Nachbarn hat

        // Dadurch sind einfache Reihen erlaubt:

        // K - K - K

        // Auch ein Dreieck aus 3 Koi ist erlaubt, weil jeder Koi dort genau 2 Koi-Nachbarn hat

        // Verzweigungen sind nicht erlaubt, weil dann ein Koi 3 oder mehr Koi-Nachbarn hätte

        for (const koi of set) {
            let koiNeighborCount = 0;

            const neighbors = koi.getNeighbors();

            for (const neighbor of neighbors) {
                // nur Nachbarn zählen, die auch in derselben Koi-Gruppe sind
                if (this.setContainsCoord(set, neighbor)) {
                    koiNeighborCount++;
                }
            }

            // mehr als 2 Koi-Nachbarn --> keine Reihe mehr, sondern verzweigte Gruppe
            if (koiNeighborCount > 2) {
                return false;
            }
        }

        return true;
    }

    // Länge einer Reihe in Punkte übersetzen
    getKoiPoints(length) {
        // Punktetabelle aus der User Story:

        // 1 Koi  = 2 Punkte

        // 2 Koi  = 4 Punkte

        // 3 Koi  = 7 Punkte

        // 4 Koi  = 11 Punkte

        // 5 Koi  = 15 Punkte

        // 6 Koi  = 20 Punkte

        // 7+ Koi = 26 Punkte
        
        if (length === 1) {
            return 2;
        }

        if (length === 2) {
            return 4;
        }

        if (length === 3) {
            return 7;
        }

        if (length === 4) {
            return 11;
        }

        if (length === 5) {
            return 15;
        }

        if (length === 6) {
            return 20;
        }

        return 26;
    }
}

