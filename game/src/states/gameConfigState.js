/**
 * Verwaltet die globale Spielkonfiguration (Anzahl Runden, Spielerzahl,
 * Spielstatus usw.).
 * Diese Datei stellt Funktionen bereit, um die Konfiguration sicher zu lesen,
 * zu aktualisieren und zurückzusetzen sowie Grenzen für die Rundenzahl zu liefern.
 */
const DEFAULT_GAME_CONFIG = Object.freeze({
  // Standardwert: Anzahl Runden im Spiel
  rounds: 85,
  playerCount: 1,
  // Flag ob das Spiel bereits gestartet wurde
  gameStarted: false,
});

// Minimale und maximale erlaubte Rundenzahl (Inclusive)
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 85;
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 4;

// Laufende (mutable) Spielkonfiguration, initialisiert mit den Standardwerten. Alle Funktionen in diesem Modul
let gameConfig = { ...DEFAULT_GAME_CONFIG };

/**
 * Stellt sicher, dass eine übergebene Rundenzahl in den erlaubten Bereich fällt
 * und in eine Zahl konvertiert wird. Gibt immer einen Integer-Wert zwischen
 * `MIN_ROUNDS` und `MAX_ROUNDS` zurück.
 */
function normalizeRounds(rounds) {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Number(rounds)));
}

/**
 * Stellt sicher, dass eine übergebene Spielerzahl in den erlaubten Bereich fällt
 * und als Zahl konvertiert wird.
 */
function normalizePlayerCount(playerCount) {
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Number(playerCount)));
}

/**
 * Liefert eine flache Kopie der aktuellen Spielkonfiguration. Konsumenten
 * sollten die Rückgabe nicht direkt mutieren.
 */
export function getGameConfig() {
  return { ...gameConfig };
}

/**
 * Aktualisiert die bestehende Spielkonfiguration mit den Feldern aus
 * `nextConfig`. Felder, die speziell validiert werden müssen (z.B. `rounds`),
 * werden normalisiert. Gibt die aktualisierte Konfiguration zurück.
 */
export function updateGameConfig(nextConfig) {
  const normalizedConfig = {
    ...nextConfig,
  };

  // Rundenzahl wird immer durch normalizeRounds geprüft/geklemmt
  if (nextConfig.rounds !== undefined) {
    normalizedConfig.rounds = normalizeRounds(nextConfig.rounds);
  }

  // Spieleranzahl wird immer durch normalizePlayerCount geprüft/geklemmt
  if (nextConfig.playerCount !== undefined) {
    normalizedConfig.playerCount = normalizePlayerCount(nextConfig.playerCount);
  }

  // Merge: bestehende Werte behalten, neue Werte überschreiben
  gameConfig = {
    ...gameConfig,
    ...normalizedConfig,
  };

  return getGameConfig();
}

/**
 * Setzt die Spielkonfiguration auf die vordefinierten Standardwerte zurück
 * und gibt diese zurück.
 */
export function resetGameConfig() {
  gameConfig = { ...DEFAULT_GAME_CONFIG };
  return getGameConfig();
}

/**
 * Liefert eine Kopie der Standard-Konfiguration ohne Seiteneffekte.
 */
export function getDefaultGameConfig() {
  return { ...DEFAULT_GAME_CONFIG };
}

/**
 * Gibt die minimalen und maximalen erlaubten Rundenzahlen zurück. Nützlich
 * für UI-Validierung oder Slider-Limits.
 */
export function getRoundLimits() {
  return {
    min: MIN_ROUNDS,
    max: MAX_ROUNDS,
  };
}

export function getPlayerLimits() {
  return {
    min: MIN_PLAYERS,
    max: MAX_PLAYERS,
  };
}
