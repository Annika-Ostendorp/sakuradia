const DEFAULT_GAME_CONFIG = Object.freeze({
  rounds: 85,
  gameStarted: false,
});

const MIN_ROUNDS = 1;
const MAX_ROUNDS = 85;

let gameConfig = { ...DEFAULT_GAME_CONFIG };

function normalizeRounds(rounds) {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Number(rounds)));
}

export function getGameConfig() {
  return { ...gameConfig };
}

export function updateGameConfig(nextConfig) {
  const normalizedConfig = {
    ...nextConfig,
  };

  if (nextConfig.rounds !== undefined) {
    normalizedConfig.rounds = normalizeRounds(nextConfig.rounds);
  }

  gameConfig = {
    ...gameConfig,
    ...normalizedConfig,
  };

  return getGameConfig();
}

export function resetGameConfig() {
  gameConfig = { ...DEFAULT_GAME_CONFIG };
  return getGameConfig();
}

export function getDefaultGameConfig() {
  return { ...DEFAULT_GAME_CONFIG };
}

export function getRoundLimits() {
  return {
    min: MIN_ROUNDS,
    max: MAX_ROUNDS,
  };
}