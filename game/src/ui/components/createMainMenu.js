import '../styles/mainMenu.css';
import { createRoundSlider } from './createRoundSlider.js';

export function createMainMenu({ initialConfig, onConfigChange, onStart }) {
  const menuElement = document.createElement('section');
  menuElement.className = 'main-menu';

  let currentConfig = { ...initialConfig };

  menuElement.innerHTML = `
    <p class="main-menu__eyebrow">Sakuradia</p>
    <h1 class="main-menu__title">Hauptmenue</h1>
    <p class="main-menu__description">
      Stelle vor dem Spielstart deine Runde ein und starte dann in die aktuelle Szene.
    </p>
    <div class="main-menu__config-preview" aria-label="Aktuelle Spielkonfiguration">
      <span class="main-menu__config-label">Geplante Runden</span>
      <strong class="main-menu__config-value">${currentConfig.rounds}</strong>
      <span class="main-menu__config-note">Passe die Runden vor dem Start flexibel an.</span>
    </div>
    <div class="main-menu__slider-slot"></div>
    <button class="main-menu__start-button" type="button">Spiel starten</button>
  `;

  const configValue = menuElement.querySelector('.main-menu__config-value');
  const sliderSlot = menuElement.querySelector('.main-menu__slider-slot');
  const startButton = menuElement.querySelector('.main-menu__start-button');

  if (!configValue || !sliderSlot || !startButton) {
    throw new Error('Main menu could not be created.');
  }

  const roundSlider = createRoundSlider({
    value: currentConfig.rounds,
    onChange: (rounds) => {
      currentConfig = {
        ...currentConfig,
        rounds,
      };

      configValue.textContent = String(rounds);
      onConfigChange?.(currentConfig);
    },
  });

  sliderSlot.append(roundSlider);

  startButton.addEventListener('click', () => {
    onStart?.(currentConfig);
  });

  return menuElement;
}