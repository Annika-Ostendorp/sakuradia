const DEFAULT_GAME_CONFIG = Object.freeze({
  rounds: 5,
  gameStarted: false,
});

let gameConfig = { ...DEFAULT_GAME_CONFIG };

export function getGameConfig() {
  return { ...gameConfig };
}

export function updateGameConfig(nextConfig) {
  gameConfig = {
    ...gameConfig,
    ...nextConfig,
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