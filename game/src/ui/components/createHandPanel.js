import '../styles/handPanel.css';

function toReadableLabel(value) {
  if (!value) {
    return '-';
  }

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
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

      if (!pair?.tileData || !pair?.animal) {
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

      button.classList.toggle('hand-panel__pair--selected', index === selectedIndex);
      button.innerHTML = `
        <span class="hand-panel__pair-index">${index + 1}</span>
        <span class="hand-panel__pair-title">${tileText}</span>
        <span class="hand-panel__pair-meta">Tier: ${toReadableLabel(pair.animal)}</span>
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
