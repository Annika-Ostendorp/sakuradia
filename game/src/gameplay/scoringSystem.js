import HexCoord from "/src/utils/HexCoord.js";
import { Animal } from "/src/data/Animal.js";
import { Landscape } from "/src/data/Landscape.js";
import { calculateKoiScore } from "./calculations/calculateKoiScore";

/**
 * Berechnet die Punkte für das gegebene Grid basierend auf den platzierten Tieren und den Landschaften der Tiles.
 * Die genaue Berechnung hängt von den Spielregeln ab, z.B. welche Tiere welche Landschaften bevorzugen und wie die Punktevergabe funktioniert.
 * Ist NICHT effizient, da immer das ganze Grid und jedes Tile mehrfach für die verschiedenen Landschafts- und Tierarten überprüft wird.
 * @param {Map<HexCoord, Tile>} grid Das Grid, für das die Punkte berechnet werden sollen
 * @returns {Object} Ein Objekt, das die Punktzahl für jede Landschaftsart und Tierart enthält. Die Struktur ist im Issue Punktesystem (Zaehlsystem)#25 beschrieben.
 */

export function calculateScoreForGrid(grid, playerId, remainingNatureTokens) {
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
  const landscapeResult = calculateScoreForLandscapes(grid);

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
  scoreResult.scores.animalScores.crane = calculateScoreFor_Crane(grid);
  scoreResult.totalScore += scoreResult.scores.animalScores.crane;

  // Japanmakak
  scoreResult.scores.animalScores.japanmakak = calculateScoreFor_Japanmakak(grid);
  scoreResult.totalScore += scoreResult.scores.animalScores.japanmakak;

  // Koi
  scoreResult.scores.animalScores.koi = calculateScoreFor_Koi(grid);
  scoreResult.totalScore += scoreResult.scores.animalScores.koi;

  // Panda
  scoreResult.scores.animalScores.panda = calculateScoreFor_Panda(grid);
  scoreResult.totalScore += scoreResult.scores.animalScores.panda;

  // Sika
  scoreResult.scores.animalScores.sika = calculateScoreFor_Sika(grid);
  scoreResult.totalScore += scoreResult.scores.animalScores.sika;

  return scoreResult;
}

// Für jedes Element im Landscape Enum, berechne die Punkte für diese Landschaft und addiere sie zum Gesamtscore hinzu
function calculateScoreForLandscapes(grid) {
  const landscapeScores = {};

  for (const landscape of Object.values(Landscape)) {
    if (landscape === Landscape.UNDEFINED) continue;

    landscapeScores[landscape] = calculateScoreFor_Landscape(grid, landscape);
  }

  return landscapeScores;
}

// PLACEHOLDER: Gibt 1 Punkt pro Tile mit der Landschaft
function calculateScoreFor_Landscape(grid, landscape) {
  let score = 0;

  // Erstmal simple Logik, erhalte 1 Punkt pro Tile mit der Landschaft
  for (const [hexCoord, tile] of grid) {
    if (tile.hasLandscape(landscape)) {
      score += 1;
    }
  }

  return score;
}

function calculateScoreFor_Crane(grid) {
  let score = 0;

  // Logic

  return score;
}

function calculateScoreFor_Japanmakak(grid) {
  let score = 0;

  // Logic

  return score;
}

function calculateScoreFor_Koi(grid) {
  return calculateKoiScore(grid);
}

function calculateScoreFor_Panda(grid) {
  let score = 0;

  // Logic

  return score;
}

function calculateScoreFor_Sika(grid) {
  let score = 0;

  // Logic

  return score;
}
