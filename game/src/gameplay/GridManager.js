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

    // Hauptfunktion: alle Pandas finden, zusammenhängende Panda-Gruppen finden, jede Gruppe zählen, für jede Gruppe mit genau 3 Pandas 10 Punkte vergeben
    get_points_for_panda(grid) {
        let sum = 0; // für End-Ausgabe der insgesamt gesammelten Punkte für Panda-Gruppen

        // alle Koordinaten sammeln, auf denen Panda liegt
        const pandas = [];
        
        // über jedes Tile in grid gehen -> grid ist Map<HexCoord, Tile> mit key = HexCoord und value = Tile
        for (const [hexCoord, tile] of grid.entries()) {
            if (tile.occupiedBy === Animal.PANDA) { // falls Tile Animal Panda besitzt (occupiedBy), Hex-Koordinaten zu pandas Liste hinzufügen
                pandas.push(hexCoord);
            } 
        }

        // wenn es < 3 Pandas gibt -> können keine Dreiergruppe ergeben
        if (pandas.length < 3) {
            return 0;
        }

        // Sets-Liste erstellen für später gefundene Panda-Gruppen; jede Gruppe ist Set
        const sets = [];

        // jetzt jeden einzelnen Panda anschauen aus voriger pandas-Liste
        for (const panda of pandas) {
            // Wenn bestimmter Panda schon im Set steckt -> überspringen (continue), nicht ausversehen nochmal nehmen
            if (this.setsContainCoord(sets, panda)) {
                continue;
            }

            // Wenn bestimmter Panda keine Panda-Nachbarn hat -> keine Dreiergruppe bilden
            if (!this.hasPandaNeighbor(panda, grid)) {
                continue;
            }

            // Neues Set für zusammenhängende Panda-Gruppe erstellen
            const set = new Set();

            // Rekursiv alle benachbarten Pandas finden
            this.getNeighborPandas(panda, grid, set);

            // Gruppe speichern
            sets.push(set);
        }

        // jetzt noch alle gefundenen Gruppen prüfen
        for (const set of sets) {
            // Panda-Regel --> genau 3 zusammenhängende Pandas = 10 Punkte
            if (set.size === 3) {
                sum += 10;
            }
        }

    return sum;
    }

    // Rekursive Funktion: bei einem Panda starten und dann alle Pandas finden, die zu derselben Gruppe gehören (bis keine neuen Panda-Nachbarn mehr gefunden werden)
    getNeighborPandas(hexCoord, grid, set) { 
        // Aktuelle Koordinate gehört zur aktuellen Panda-Gruppe
        set.add(hexCoord);

        // Hex-Felder haben immer 6 Nachbarn
        const neighbors = hexCoord.getNeighbors();

        // jetzt jeden Nachbarn einzeln prüfen
        for (const neighbor of neighbors) {
            // wenn Nachbar schon im Set --> würden endlos im Kreis suchen --> deshalb continue
            if (this.setContainsCoord(set, neighbor)) {
                continue;
            }

            // Tile suchen, dass an dieser Nachbar-Koordinate liegt
            const neighborTile = this.getTileFromGridAt(grid, neighbor);

            // wenn dort Tile liegt und darauf Panda ist, dann gehört Nachbar zur selben Panda-Gruppe
            if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.PANDA) {
                set.add(neighbor);

                // dann von diesem Nachbar-Panda aus weiter suchen
                this.getNeighborPandas(neighbor, grid, set);
            }
        }
    }

    // Hat Panda überhaupt einen Panda-Nachbarn?
    // falls z.B. alleine -> keine Gruppe möglich -> direkt überspringen -> dadurch Rekursion erst gar nicht starten
    hasPandaNeighbor(hexCoord, grid) {
        // 6 Nachbarfelder holen
        const neighbors = hexCoord.getNeighbors();

        for (const neighbor in neighbors) {
            // Tile an dieser Nachbarposition suchen wie vorhin
            const neighborTile = this.getTileFromGridAt(grid, neighbor);

            // falls dort Panda liegt --> gefundener Panda hat Panda-Nachbarn
            if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.PANDA) {
                return true;
            }
        }

        return false; // falls kein Panda-Nachbar gefunden
    }

    // Wurde Panda schon Gruppe zugeordnet? --> falls z.B. best. Panda nochmal in Schleife auftauchen -> soll nicht nochmal diesselbe Gruppe erzeugen
    setsContainCoord(sets, hexCoord) {
        // sets ist Liste von Panda-Gruppen -> siehe oben
        // prüfen, ob übergebene Koordinate in irgendeiner Gruppe schon vorkommt
        for (const set of sets) {
            if (this.setContainsCoord(set, hexCoord)) {
                return true;
            }
        }

        return false;
    }

    // Ist Koordinate in best. Set schon enthalten? (da HexCoords Objekte sind und JavaScript ja normalerweise nur über Referenz von Objekten vergleicht)
    setContainsCoord(set, hexCoord) {
        // nach Objekt-Referenz prüfen mit coord.equals(hexCoord)
        for (const coord of set) {
            if (coord.equals(hexCoord)) {
                return true;
            }
        }

        return false;
    }

    // Tile an best. Koordinate geben
    getTileFromGridAt(grid, hexCoord) {
        // Map verwendet HexCoord-Objekte auch als Key --> nach Koordinate suchen mit gleichen Werten
        for (const [placedHexCoord, tile] of grid.entries()) {
            if (placedHexCoord.equals(hexCoord)) {
                return tile;
            }
        }

        return undefined; // wenn kein Tile an dieser Koordinate gefunden wurde
    }
}

