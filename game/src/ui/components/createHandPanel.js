import '../styles/handPanel.css';

const LANDSCAPE_COLORS = Object.freeze({
  BambooForest: '#2f7a3f',
  Mountain: '#57606a',
  Pond: '#2f81c5',
  Sakura: '#e7a7ba',
  Wetland: '#4f8f4f',
  Undefined: '#8b949e',
});

function toReadableLabel(value) {
  if (!value) {
    return '-';
  }

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function getLandscapeColor(landscape) {
  return LANDSCAPE_COLORS[landscape] || LANDSCAPE_COLORS.Undefined;
}

function getAllowedAnimalsText(tileData) {
  if (!tileData || !Array.isArray(tileData.animals) || tileData.animals.length === 0) {
    return 'Keine';
  }

  return tileData.animals.map((animal) => toReadableLabel(animal)).join(', ');
}

function buildHexagonSvg({ index, primaryColor, secondaryColor, isKeystone }) {
  const gradientId = `tile-grad-${index}-${primaryColor.replace('#', '')}-${secondaryColor.replace('#', '')}`;
  const fillValue = isKeystone ? primaryColor : `url(#${gradientId})`;

  return `
    <svg class="hand-panel__tile-visual" viewBox="0 0 100 86.60254" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="50%" stop-color="${primaryColor}"></stop>
          <stop offset="50%" stop-color="${secondaryColor}"></stop>
        </linearGradient>
      </defs>
      <polygon
        points="0,43.30127 25,0 75,0 100,43.30127 75,86.60254 25,86.60254"
        fill="${fillValue}"
        stroke="rgba(255,255,255,0.35)"
        stroke-width="2"
      ></polygon>
    </svg>
  `;
}

export function createHandPanel({ onSelectPair } = {}) {
  const panel = document.createElement('aside');
  panel.className = 'hand-panel';
  panel.setAttribute('aria-label', 'Hand mit Tile-Tier-Paaren');

  panel.innerHTML = `
    <h2 class="hand-panel__title">Hand</h2>
    <p class="hand-panel__status" aria-live="polite">Runde 1 | Spieler 1</p>
    <div class="hand-panel__scores" aria-label="Spielerübersicht"></div>
    <div class="hand-panel__list" role="list"></div>
  `;

  const status = panel.querySelector('.hand-panel__status');
  const scores = panel.querySelector('.hand-panel__scores');
  const list = panel.querySelector('.hand-panel__list');
  if (!status || !scores || !list) {
    throw new Error('Hand panel list could not be created.');
  }

  const render = (pairs = [], selectedIndex = 0) => {
    list.textContent = '';

    for (let index = 0; index < 4; index += 1) {
      const pair = pairs[index] || null;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hand-panel__pair';
      button.setAttribute('role', 'listitem');

      if (!pair?.tileData) {
        button.classList.add('hand-panel__pair--empty');
        button.disabled = true;
        button.innerHTML = `
          <span class="hand-panel__pair-index">${index + 1}</span>
          <span class="hand-panel__pair-title">Leer</span>
          <span class="hand-panel__pair-meta">Kein Paar vorhanden</span>
        `;
        list.append(button);
        continue;
      }

      const primary = toReadableLabel(pair.tileData.primaryLandscape);
      const secondary = pair.tileData.isKeystone ? null : toReadableLabel(pair.tileData.secondaryLandscape);
      const tileText = secondary ? `${primary} / ${secondary}` : `${primary} (Keystone)`;
      const primaryColor = getLandscapeColor(pair.tileData.primaryLandscape);
      const secondaryColor = pair.tileData.isKeystone
        ? primaryColor
        : getLandscapeColor(pair.tileData.secondaryLandscape);
      const tileVisualSvg = buildHexagonSvg({
        index,
        primaryColor,
        secondaryColor,
        isKeystone: pair.tileData.isKeystone,
      });
      const drawnAnimalText = toReadableLabel(pair.animal);
      const allowedAnimalsText = getAllowedAnimalsText(pair.tileData);

      button.classList.toggle('hand-panel__pair--selected', index === selectedIndex);
      button.innerHTML = `
        <span class="hand-panel__pair-index">${index + 1}</span>
        <span class="hand-panel__pair-visual-row">
          ${tileVisualSvg}
          <span class="hand-panel__drawn-animal" aria-label="Gezogenes Tier">Tier: ${drawnAnimalText}</span>
        </span>
        <span class="hand-panel__pair-title">${tileText}</span>
        <span class="hand-panel__pair-meta">Erlaubte Tiere: ${allowedAnimalsText}</span>
      `;

      button.addEventListener('click', () => {
        onSelectPair?.(index);
      });

      list.append(button);
    }
  };

  const updateStatus = ({
    currentRound = 1,
    totalRounds = 1,
    currentPlayer = 1,
    playerCount = 1,
    scoresByPlayer = [],
  } = {}) => {
    status.textContent = `Runde ${currentRound}/${totalRounds} | Spieler ${currentPlayer}/${playerCount}`;

    scores.textContent = '';
    for (let index = 0; index < playerCount; index += 1) {
      const score = Number(scoresByPlayer[index] ?? 0);
      const scorePill = document.createElement('span');
      scorePill.className = 'hand-panel__score-pill';

      if (index + 1 === currentPlayer) {
        scorePill.classList.add('hand-panel__score-pill--active');
      }

      scorePill.textContent = `S${index + 1}: ${score}`;
      scores.append(scorePill);
    }
  };

  return {
    element: panel,
    update: render,
    updateStatus,
  };
}
