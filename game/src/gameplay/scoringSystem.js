import HexCoord from "/src/utils/HexCoord.js";
import { Animal } from "/src/data/Animal.js";
import { Landscape } from "/src/data/Landscape.js";
import { calculateKoiScore } from "./calculations/calculateKoiScore.js";
import { calculatePandaScore } from "./calculations/calculatePandaScore.js";
import { calculateJapanmakakScore } from "./calculations/calculateJapanmakakScore.js";

/**
 * Berechnet die Punkte für das gegebene Grid basierend auf den platzierten Tieren und den Landschaften der Tiles.
 * Die genaue Berechnung hängt von den Spielregeln ab, z.B. welche Tiere welche Landschaften bevorzugen und wie die Punktevergabe funktioniert.
 * Ist NICHT effizient, da immer das ganze Grid und jedes Tile mehrfach für die verschiedenen Landschafts- und Tierarten überprüft wird.
 * @param {Map<HexCoord, Tile>} grid Das Grid, für das die Punkte berechnet werden sollen
 * @returns {Object} Ein Objekt, das die Punktzahl für jede Landschaftsart und Tierart enthält. Die Struktur ist im Issue Punktesystem (Zaehlsystem)#25 beschrieben.
 */

export function calculateScoreForGrid(
  gridmanager,
  playerId,
  remainingNatureTokens,
) {
  const scoreResult = {
    playerId: playerId,
    totalScore: remainingNatureTokens,
    scores: {
      landscapeScores: {
        bambooforest: 0,
        mountain: 0,
        pond: 0,
        sakura: 0,
        wetland: 0,
      },
      animalScores: {
        crane: 0,
        japanmakak: 0,
        koi: 0,
        panda: 0,
        sika: 0,
      },
    },
  };

  // Landschaften

  // Array der scores für jede Landschaft
  const landscapeResult = calculateScoreForLandscapes(gridmanager);

  // Bambooforest
  scoreResult.scores.landscapeScores.bambooforest =
    landscapeResult[Landscape.BAMBOOFOREST];
  scoreResult.totalScore += scoreResult.scores.landscapeScores.bambooforest;

  // Mountain
  scoreResult.scores.landscapeScores.mountain =
    landscapeResult[Landscape.MOUNTAIN];
  scoreResult.totalScore += scoreResult.scores.landscapeScores.mountain;

  // Pond
  scoreResult.scores.landscapeScores.pond = landscapeResult[Landscape.POND];
  scoreResult.totalScore += scoreResult.scores.landscapeScores.pond;

  // Sakura
  scoreResult.scores.landscapeScores.sakura = landscapeResult[Landscape.SAKURA];
  scoreResult.totalScore += scoreResult.scores.landscapeScores.sakura;

  // Wetland
  scoreResult.scores.landscapeScores.wetland =
    landscapeResult[Landscape.WETLAND];
  scoreResult.totalScore += scoreResult.scores.landscapeScores.wetland;

  // Tiere

  // Crane
  scoreResult.scores.animalScores.crane = calculateScoreFor_Crane(gridmanager);
  scoreResult.totalScore += scoreResult.scores.animalScores.crane;

  // Japanmakak
  scoreResult.scores.animalScores.japanmakak =
    calculateScoreFor_Japanmakak(gridmanager);
  scoreResult.totalScore += scoreResult.scores.animalScores.japanmakak;

  // Koi
  scoreResult.scores.animalScores.koi = calculateScoreFor_Koi(gridmanager);
  scoreResult.totalScore += scoreResult.scores.animalScores.koi;

  // Panda
  scoreResult.scores.animalScores.panda = calculateScoreFor_Panda(gridmanager);
  scoreResult.totalScore += scoreResult.scores.animalScores.panda;

  // Sika
  scoreResult.scores.animalScores.sika = calculateScoreFor_Sika(gridmanager);
  scoreResult.totalScore += scoreResult.scores.animalScores.sika;

  return scoreResult;
}

// Für jedes Element im Landscape Enum, berechne die Punkte für diese Landschaft und addiere sie zum Gesamtscore hinzu
function calculateScoreForLandscapes(gridmanager) {
  const landscapeScores = {};

  for (const landscape of Object.values(Landscape)) {
    if (landscape === Landscape.UNDEFINED) continue;

    landscapeScores[landscape] = calculateScoreFor_Landscape(
      gridmanager,
      landscape,
    );
  }

  return landscapeScores;
}

// PLACEHOLDER: Gibt 1 Punkt pro Tile mit der Landschaft
function calculateScoreFor_Landscape(gridmanager, landscape) {
  let score = 0;

  // Erstmal simple Logik, erhalte 1 Punkt pro Tile mit der Landschaft
  for (const [hexCoord, tile] of gridmanager.grid.entries()) {
    if (tile.hasLandscape(landscape)) {
      score += 1;
    }
  }

  return score;
}

function calculateScoreFor_Crane(gridmanager) {
  let craneCount = 0;

  // Gehe durch jedes Tile im Grid
  for (const [hexCoord, tile] of gridmanager.grid.entries()) {
    // Prüfe, ob auf dem aktuellen Tile ein Kranich ist
    if (tile.occupiedBy !== Animal.CRANE) {
      continue;
    }

    let hasCraneNeighbor = false;

    // Bekomme Liste mit allen Nachbarfeldern des aktuellen Kranichs
    for (const neighborCoord of hexCoord.getNeighbors()) {
      const neighborTile = gridmanager.getTileAt(neighborCoord);

      // Prüfe, ob auf einem Nachbarfeld auch ein Kranich liegt
      if (neighborTile && neighborTile.occupiedBy === Animal.CRANE) {
        hasCraneNeighbor = true;
        break;
      }
    }

    // Wenn kein Kranich-Nachbar gefunden wurde, zählt dieser Kranich
    if (!hasCraneNeighbor) {
      craneCount++;
    }
  }

  return getPointsForCraneCount(craneCount);
}

// Je nach Anzahl der Kraniche ohne Nachbarn gibt es unterschiedliche Punkte.
// Diese Werte sind vom Basis-Spiel übernommen.
function getPointsForCraneCount(count) {
  if (count >= 8) return 26; // Maximalpunktzahl für 8 oder mehr Kraniche ohne Nachbarn

  switch (count) {
    case 1:
      return 2;
    case 2:
      return 5;
    case 3:
      return 8;
    case 4:
      return 11;
    case 5:
      return 14;
    case 6:
      return 18;
    case 7:
      return 22;
    default:
      return 0;
  }
}

function calculateScoreFor_Japanmakak(gridmanager) {
  return calculateJapanmakakScore(gridmanager);
  
}


function calculateScoreFor_Koi(gridmanager) {
  return calculateKoiScore(gridmanager);
}

function calculateScoreFor_Panda(gridmanager) {
  return calculatePandaScore(gridmanager);
}

function calculateScoreFor_Sika(gridmanager) {
  let score = 0;

  // Logic

  return score;
}
