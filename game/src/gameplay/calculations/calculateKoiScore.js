import { Animal } from "/src/data/Animal.js";

// Hauptfunktion: alle Koi finden, Koi-Gruppen bilden, jede Gruppe prüfen, Punkte zusammenzählen
export function calculateKoiScore(grid) {
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
        if (setsContainCoord(sets, hexCoord)) {
            continue;
        }

        // Neues Set für zusammenhängende Koi-Gruppe
        const set = new Set();

        // Rekursiv alle benachbarten Koi finden
        getNeighborKoi(hexCoord, grid, set);

        // Gefundene Gruppe speichern
        sets.push(set);
    }

    // jede gefundene Koi-Gruppe auswerten
    for (const set of sets) {
        // Koi-Gruppe zählt nur, wenn sie gültige Reihe ist
        if (isValidKoiLine(set)) {
            sum += getKoiPoints(set.size);
        }
    }
    return sum; // am Ende Gesamtpunktzahl zurückgeben
}


// Alle Koi finden, die zu derselben Gruppe gehören -> solange bis keine neuen Koi mehr gefunden werden
function getNeighborKoi(hexCoord, grid, set) {
    // Aktuelle Koordinate gehört wieder zur aktuellen Koi-Gruppe
    set.add(hexCoord);

    // Hex-Felder haben 6 Nachbarn -> diese holen
    const neighbors = hexCoord.getNeighbors();

    // Jeden Nachbarn prüfen
    for (const neighbor of neighbors) {

        // Wenn Nachbar schon im Set --> nicht mehr endlos im Kreis suchen
        if (setContainsCoord(set, neighbor)) {
            continue;
        }

        // Tile an Nachbarposition suchen
        const neighborTile = getTileFromGridAt(grid, neighbor);

        // Wenn dort Tile liegt und darauf Koi ist --> dieser Nachbar gehört zur selben Koi-Gruppe
        if (neighborTile !== undefined && neighborTile.occupiedBy === Animal.KOI) {
            set.add(neighbor);

            // Von diesem Nachbar-Koi aus dann weiter suchen
            getNeighborKoi(neighbor, grid, set);
        }
    }
}


// Prüfen, ob Gruppe überhaupt gültige Koi-Reihe ist -> Form der Gruppe prüfen
function isValidKoiLine(set) {
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
            if (setContainsCoord(set, neighbor)) {
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
function getKoiPoints(length) {
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

// Wurde Koi schon einer gefundenen Koi-Gruppe zugeordnet? --> falls z.B. best. Koi nochmal in Schleife auftauchen -> soll nicht nochmal diesselbe Gruppe erzeugen
function setsContainCoord(sets, hexCoord) {
    // sets ist Liste von Koi-Gruppen -> siehe oben
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