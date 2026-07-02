import { Animal } from "/src/data/Animal.js";

// Sika-Wertung:
// 1. Alle möglichen 4er-Reihen suchen und maximal viele davon nehmen
// 2. Danach mit den übrigen Sika maximal viele 3er-Reihen nehmen
// 3. Danach 2er-Reihen
// 4. Übrige einzelne Sika zählen
//
// Wichtig: Ein Sika darf nur in genau einer gewerteten Reihe vorkommen.
// Ja, ich hab das hier von KI generieren lassen nach Sprint 3, weil Zeit ist Geld :D

export function calculateSikaScore(gridmanager) {
    const sikaOnGrid = [];

    // Alle Sika auf dem Grid sammeln
    for (const [hexCoord, tile] of gridmanager.grid.entries()) {
        if (tile.occupiedBy === Animal.SIKA) {
            sikaOnGrid.push(hexCoord);
        }
    }

    // Noch kein Sika wurde für eine Reihe verwendet
    const usedSikaKeys = new Set();

    // Erst 4er-Reihen, dann 3er, dann 2er, dann einzelne Sika
    return calculateBestScoreFromLength(sikaOnGrid, gridmanager, usedSikaKeys, 4);
}


// Rekursiv von 4er-Reihen runter bis zu einzelnen Sika auswerten
function calculateBestScoreFromLength(sikaOnGrid, gridmanager, usedSikaKeys, length) {
    // Bei Länge 1 werden einfach alle übrigen Sika einzeln gezählt
    if (length === 1) {
        let singleSikaCount = 0;

        for (const sika of sikaOnGrid) {
            if (!usedSikaKeys.has(getCoordKey(sika))) {
                singleSikaCount++;
            }
        }

        return singleSikaCount * getScoreForLength(1);
    }

    // Alle möglichen Reihen der aktuellen Länge finden
    const lineCandidates = getLineCandidates(
        sikaOnGrid,
        gridmanager,
        usedSikaKeys,
        length
    );

    let bestLineCountForThisLength = -1;
    let bestScore = 0;

    // Alle Kombinationen dieser Reihen ausprobieren
    // Dadurch wird wirklich die maximale Anzahl an z.B. 4er-Reihen gefunden,
    // ohne dass ein Sika doppelt verwendet wird.
    function search(index, currentUsedSikaKeys, selectedLineCount) {
        // Alle Kandidaten wurden geprüft
        if (index >= lineCandidates.length) {
            const currentLengthScore =
                selectedLineCount * getScoreForLength(length);

            const lowerLengthScore = calculateBestScoreFromLength(
                sikaOnGrid,
                gridmanager,
                currentUsedSikaKeys,
                length - 1
            );

            const totalScore = currentLengthScore + lowerLengthScore;

            // Hauptkriterium:
            // Erst maximale Anzahl der aktuellen Reihenlänge.
            //
            // Nebenkriterium:
            // Wenn gleich viele Reihen möglich sind, nimm die Variante,
            // die danach mit kürzeren Reihen mehr Punkte bringt.
            if (
                selectedLineCount > bestLineCountForThisLength ||
                (
                    selectedLineCount === bestLineCountForThisLength &&
                    totalScore > bestScore
                )
            ) {
                bestLineCountForThisLength = selectedLineCount;
                bestScore = totalScore;
            }

            return;
        }

        const currentLine = lineCandidates[index];

        // Fall 1: Diese Reihe NICHT nehmen
        search(index + 1, currentUsedSikaKeys, selectedLineCount);

        // Fall 2: Diese Reihe nehmen, falls keines der Sika schon benutzt wurde
        if (!lineUsesUsedSika(currentLine, currentUsedSikaKeys)) {
            const nextUsedSikaKeys = new Set(currentUsedSikaKeys);

            for (const sika of currentLine) {
                nextUsedSikaKeys.add(getCoordKey(sika));
            }

            search(index + 1, nextUsedSikaKeys, selectedLineCount + 1);
        }
    }

    search(0, new Set(usedSikaKeys), 0);

    return bestScore;
}


// Findet alle möglichen geraden Sika-Reihen einer bestimmten Länge
function getLineCandidates(sikaOnGrid, gridmanager, usedSikaKeys, length) {
    const candidates = [];
    const candidateKeys = new Set();

    // Nur 3 Richtungen, weil die Gegenrichtungen dieselben Reihen doppelt finden würden.
    // Axial-Hex-Richtungen:
    // (1, 0), (1, -1), (0, -1)
    const directions = [
        { column: 1, row: 0 },
        { column: 1, row: -1 },
        { column: 0, row: -1 },
    ];

    for (const startCoord of sikaOnGrid) {
        for (const direction of directions) {
            const line = [];
            let isValidLine = true;

            for (let i = 0; i < length; i++) {
                const currentCoord = createMovedCoord(startCoord, direction, i);
                const currentCoordKey = getCoordKey(currentCoord);

                // Sika wurde bereits in einer größeren Reihe benutzt
                if (usedSikaKeys.has(currentCoordKey)) {
                    isValidLine = false;
                    break;
                }

                const tile = gridmanager.getTileAt(currentCoord);

                // An dieser Stelle liegt kein Sika -> keine gültige Reihe
                if (tile === undefined || tile.occupiedBy !== Animal.SIKA) {
                    isValidLine = false;
                    break;
                }

                line.push(currentCoord);
            }

            if (!isValidLine) {
                continue;
            }

            // Doppelte Kandidaten vermeiden
            const lineKey = line.map(getCoordKey).join("|");

            if (!candidateKeys.has(lineKey)) {
                candidateKeys.add(lineKey);
                candidates.push(line);
            }
        }
    }

    return candidates;
}


// Erstellt eine neue HexCoord, die von einer Startposition aus
// mehrere Schritte in eine Richtung verschoben ist
function createMovedCoord(startCoord, direction, steps) {
    return new startCoord.constructor(
        startCoord.column + direction.column * steps,
        startCoord.row + direction.row * steps
    );
}


// Prüft, ob eine Reihe ein Sika enthält, das schon benutzt wurde
function lineUsesUsedSika(line, usedSikaKeys) {
    for (const sika of line) {
        if (usedSikaKeys.has(getCoordKey(sika))) {
            return true;
        }
    }

    return false;
}


// Key gegen JavaScript-Referenzprobleme bei HexCoord-Objekten
function getCoordKey(hexCoord) {
    return `${hexCoord.column},${hexCoord.row}`;
}


// Länge einer Sika-Reihe in Punkte übersetzen
function getScoreForLength(length) {
    if (length <= 0) return 0;

    switch (length) {
        case 1:
            return 2;
        case 2:
            return 5;
        case 3:
            return 9;
        default:
            return 13;
    }
}