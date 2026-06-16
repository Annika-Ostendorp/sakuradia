import { Animal } from "../data/Animal.js";

// Hauptfunktion: alle Pandas finden, zusammenhängende Panda-Gruppen finden, jede Gruppe zählen, für jede Gruppe mit genau 3 Pandas 10 Punkte vergeben
export function calculatePandaScore(grid) {
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
        if (setsContainCoord(sets, panda)) {
            continue;
        }

        // Wenn bestimmter Panda keine Panda-Nachbarn hat -> keine Dreiergruppe bilden
        if (!hasPandaNeighbor(panda, grid)) {
            continue;
        }

        // Neues Set für zusammenhängende Panda-Gruppe erstellen
        const set = new Set();

        // Rekursiv alle benachbarten Pandas finden
        getNeighborPandas(panda, grid, set);

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
function getNeighborPandas(hexCoord, grid, set) { 

    // Aktuelle Koordinate gehört zur aktuellen Panda-Gruppe
    set.add(hexCoord);
    
    // Hex-Felder haben immer 6 Nachbarn
    const neighbors = hexCoord.getNeighbors();

    // jetzt jeden Nachbarn einzeln prüfen
    for (const neighbor of neighbors) {

        // wenn Nachbar schon im Set --> würden endlos im Kreis suchen --> deshalb continue
        if (setContainsCoord(set, neighbor)) {
            continue;
        }

        // Tile suchen, dass an dieser Nachbar-Koordinate liegt
        const neighborTile = getTileFromGridAt(grid, neighbor);

        // wenn dort Tile liegt und darauf Panda ist, dann gehört Nachbar zur selben Panda-Gruppe
        if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.PANDA) {
            set.add(neighbor);

            // dann von diesem Nachbar-Panda aus weiter suchen
            getNeighborPandas(neighbor, grid, set);
        }
    }
}


// Hat Panda überhaupt einen Panda-Nachbarn?
// falls z.B. alleine -> keine Gruppe möglich -> direkt überspringen -> dadurch Rekursion erst gar nicht starten
function hasPandaNeighbor(hexCoord, grid) {
    // 6 Nachbarfelder holen
    const neighbors = hexCoord.getNeighbors();
    for (const neighbor of neighbors) {
        // Tile an dieser Nachbarposition suchen wie vorhin
        const neighborTile = getTileFromGridAt(grid, neighbor);
        // falls dort Panda liegt --> gefundener Panda hat Panda-Nachbarn
        if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.PANDA) {
            return true;
        }
    }
    return false; // falls kein Panda-Nachbar gefunden
}


// Wurde Panda schon Gruppe zugeordnet? --> falls z.B. best. Panda nochmal in Schleife auftauchen -> soll nicht nochmal diesselbe Gruppe erzeugen
function setsContainCoord(sets, hexCoord) {
    // sets ist Liste von Panda-Gruppen -> siehe oben
    // prüfen, ob übergebene Koordinate in irgendeiner Gruppe schon vorkommt
    for (const set of sets) {
        if (setContainsCoord(set, hexCoord)) {
            return true;
        }
    }
    return false;
}


// Ist Koordinate in best. Set schon enthalten? (da HexCoords Objekte sind und JavaScript ja normalerweise nur über Referenz von Objekten vergleicht)
function setContainsCoord(set, hexCoord) {
    // prüfen mit coord.equals(hexCoord) gegen Objekt-Referenz-Problematik -> nach gleichen Koordinatenwerten prüfen
    for (const coord of set) {
        if (coord.equals(hexCoord)) {
            return true;
        }
    }
    return false;
}


// Tile an best. Koordinate geben
function getTileFromGridAt(grid, hexCoord) {
    // Map verwendet HexCoord-Objekte auch als Key --> nach Koordinate suchen mit gleichen Werten
    for (const [placedHexCoord, tile] of grid.entries()) {
        if (placedHexCoord.equals(hexCoord)) {
            return tile;
        }
    }
    return undefined; // wenn kein Tile an dieser Koordinate gefunden wurde
}


