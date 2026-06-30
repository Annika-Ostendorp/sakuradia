import { Animal } from "/src/data/Animal.js";

// Hauptfunktion: für jeden Japanmakak die angrenzenden Tierarten zählen und Punkte aufsummieren
export function calculateJapanmakakScore(gridmanager) {
    let sum = 0; // Endausgabe der insgesamt gesammelten Punkte für alle Japanmakaks

    // Über jedes Tile im Grid gehen
    for (const [hexCoord, tile] of gridmanager.grid.entries()) {

        // Wenn auf diesem Tile kein Japanmakak --> überspringen (continue)
        if (tile.occupiedBy !== Animal.JAPANMAKAK) {
            continue;
        }

        // Anzahl der verschiedenen Tierarten zählen, die an diesen Japanmakak angrenzen
        const speciesCount = countAdjacentSpecies(hexCoord, gridmanager);

        // Punkte für diesen einzelnen Japanmakak addieren
        sum += getJapanmakakPoints(speciesCount);
    }

    return sum; // am Ende Gesamtpunktzahl zurückgeben
}

// Zählt die Anzahl der verschiedenen Tierarten, die an die angegebene Hex-Koordinate angrenzen.
// Andere angrenzende Japanmakaks zählen dabei jeweils EINZELN als eigene Art (siehe Issue-Beschreibung),
// statt wie sonst gleiche Arten zusammenzufassen.
function countAdjacentSpecies(hexCoord, gridmanager) {
    const distinctSpecies = new Set(); // verschiedene Nicht-Japanmakak-Arten (Duplikate zählen nur einmal)
    let japanmakakNeighbours = 0; // jeder angrenzende Japanmakak zählt einzeln, auch wenn mehrere vorhanden sind

    for (const neighborCoord of hexCoord.getNeighbors()) {
        const neighborTile = gridmanager.getTileAt(neighborCoord);

        // Kein Tile an dieser Koordinate oder kein Tier darauf --> überspringen
        if (!neighborTile || neighborTile.occupiedBy === Animal.NONE || neighborTile.occupiedBy === undefined) {
            continue;
        }

        if (neighborTile.occupiedBy === Animal.JAPANMAKAK) {
            japanmakakNeighbours++;
        } else {
            distinctSpecies.add(neighborTile.occupiedBy);
        }
    }

    return distinctSpecies.size + japanmakakNeighbours;
}

// Wandelt die Anzahl unterschiedlicher angrenzender Arten in Punkte um (siehe Punktetabelle im Issue: 1-5 Anzahl -> 1-5 Punkte).
function getJapanmakakPoints(speciesCount) {
    const maxPoints = 5; // Tabelle deckt nur 1-5 ab, mehr als 5 bringt keine weiteren Punkte
    return Math.min(speciesCount, maxPoints);
}