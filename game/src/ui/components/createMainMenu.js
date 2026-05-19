import '../styles/mainMenu.css';

export function createMainMenu({ initialConfig, onStart }) {
  const menuElement = document.createElement('section');
  menuElement.className = 'main-menu';

  const rounds = String(initialConfig.rounds ?? '');

  menuElement.innerHTML = `
    <p class="main-menu__eyebrow">Sakuradia</p>
    <h1 class="main-menu__title">Hauptmenue</h1>
    <p class="main-menu__description">
      Stelle vor dem Spielstart deine Runde ein und starte dann in die aktuelle Szene.
    </p>
    <div class="main-menu__config-preview" aria-label="Aktuelle Spielkonfiguration">
      <span class="main-menu__config-label">Geplante Runden</span>
      <strong class="main-menu__config-value">${rounds}</strong>
      <span class="main-menu__config-note">Der Slider folgt im naechsten Schritt.</span>
    </div>
    <button class="main-menu__start-button" type="button">Spiel starten</button>
  `;

  const startButton = menuElement.querySelector('.main-menu__start-button');

  if (!startButton) {
    throw new Error('Main menu could not be created.');
  }

  startButton.addEventListener('click', () => {
    onStart?.(initialConfig);
  });

  return menuElement;
}