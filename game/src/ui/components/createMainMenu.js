import '../styles/mainMenu.css';
import { createRoundSlider } from './createRoundSlider.js';
import { createPlayerSlider } from './createPlayerSlider.js';

export function createMainMenu({ initialConfig, onConfigChange, onStart }) {
  const menuElement = document.createElement('section');
  menuElement.className = 'main-menu';

  let currentConfig = { ...initialConfig };

  menuElement.innerHTML = `
    <p class="main-menu__eyebrow">Sakuradia</p>
    <h1 class="main-menu__title">Hauptmenü</h1>
    <p class="main-menu__description">
      Stelle vor dem Spielstart Rundenzahl und Spielerzahl ein und starte dann das Spiel.
    </p>
    <div class="main-menu__config-preview" aria-label="Aktuelle Spielkonfiguration">
      <div>Runden: <strong class="main-menu__rounds-value">${currentConfig.rounds}</strong></div>
      <div>Spieler: <strong class="main-menu__players-value">${currentConfig.playerCount}</strong></div>
    </div>
    <div class="main-menu__slider-slot"></div>
    <div class="main-menu__player-slider-slot"></div>
    <button class="main-menu__start-button" type="button">Spiel starten</button>
  `;

  const roundsValue = menuElement.querySelector('.main-menu__rounds-value');
  const playersValue = menuElement.querySelector('.main-menu__players-value');
  const sliderSlot = menuElement.querySelector('.main-menu__slider-slot');
  const playerSliderSlot = menuElement.querySelector('.main-menu__player-slider-slot');
  const startButton = menuElement.querySelector('.main-menu__start-button');

  if (!roundsValue || !playersValue || !sliderSlot || !playerSliderSlot || !startButton) {
    throw new Error('Main menu could not be created.');
  }

  const roundSlider = createRoundSlider({
    value: currentConfig.rounds,
    onChange: (rounds) => {
      currentConfig = {
        ...currentConfig,
        rounds,
      };

      roundsValue.textContent = String(rounds);
      onConfigChange?.(currentConfig);
    },
  });

  const playerSlider = createPlayerSlider({
    value: currentConfig.playerCount,
    min: 1,
    max: 4,
    onChange: (playerCount) => {
      currentConfig = {
        ...currentConfig,
        playerCount,
      };

      playersValue.textContent = String(playerCount);
      onConfigChange?.(currentConfig);
    },
  });

  sliderSlot.append(roundSlider);
  playerSliderSlot.append(playerSlider);

  startButton.addEventListener('click', () => {
    onStart?.(currentConfig);
  });

  return menuElement;
}
