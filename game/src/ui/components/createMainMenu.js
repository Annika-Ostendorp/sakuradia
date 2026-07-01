import '../styles/mainMenu.css';
import { createRoundSlider } from './createRoundSlider.js';
import { createPlayerSlider } from './createPlayerSlider.js';

export function createMainMenu({ initialConfig, onConfigChange, onStart }) {
  const menuElement = document.createElement('section');
  menuElement.className = 'main-menu';

  let currentConfig = { ...initialConfig };

  menuElement.innerHTML = `
    <h1 class="main-menu__title">Sakuradia</h1>
    <p class="main-menu__description">
      Stelle vor dem Spielstart die Rundenzahl ein.
    </p>
    <div class="main-menu__slider-slot"></div>
    <div class="main-menu__player-slider-slot"></div>
    <button class="main-menu__start-button" type="button">Spiel starten</button>
  `;

  const sliderSlot = menuElement.querySelector('.main-menu__slider-slot');
  const playerSliderSlot = menuElement.querySelector('.main-menu__player-slider-slot');
  const startButton = menuElement.querySelector('.main-menu__start-button');

  if (!sliderSlot || !playerSliderSlot || !startButton) {
    throw new Error('Main menu could not be created.');
  }

  const roundSlider = createRoundSlider({
    value: currentConfig.rounds,
    onChange: (rounds) => {
      currentConfig = {
        ...currentConfig,
        rounds,
      };

      onConfigChange?.(currentConfig);
    },
  });

  // const playerSlider = createPlayerSlider({
  //   value: currentConfig.playerCount,
  //   min: 1,
  //   max: 4,
  //   onChange: (playerCount) => {
  //     currentConfig = {
  //       ...currentConfig,
  //       playerCount,
  //     };

  //     onConfigChange?.(currentConfig);
  //   },
  // });

  sliderSlot.append(roundSlider);
  // playerSliderSlot.append(playerSlider);

  startButton.addEventListener('click', () => {
    onStart?.(currentConfig);
  });

  return menuElement;
}
