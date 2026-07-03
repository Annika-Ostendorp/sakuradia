import '../styles/handPanel.css';

const LANDSCAPE_COLORS = Object.freeze({
  BambooForest: '#2f7a3f',
  Mountain: '#57606a',
  Pond: '#2f81c5',
  Sakura: '#e7a7ba',
  Wetland: '#4f8f4f',
  Undefined: '#8b949e',
});

const LANDSCAPE_IMAGES = Object.freeze({
  BambooForest: '/assets/images/landscape/bamboo_topview.png',
  Mountain: '/assets/images/landscape/mountain_topview.png',
  Pond: '/assets/images/landscape/river_topview.png',
  Sakura: '/assets/images/landscape/sakura_tree_topview.png',
  Wetland: '/assets/images/landscape/grass_topview.png',
});

const LANDSCAPE_IMAGE_SCALES = Object.freeze({
  default: 1.38,
  Pond: 1.52,
  Sakura: 1.7,
});

const ANIMAL_IMAGES = Object.freeze({
  Crane: '/assets/images/animals/KranichAvatar.png',
  Japanmakak: '/assets/images/animals/JapanmakakAvatar.png',
  Koi: '/assets/images/animals/KoiAvatar.png',
  Panda: '/assets/images/animals/PandaAvatar.png',
  Sika: '/assets/images/animals/SikaAvatar.png',
});

const SCORECARD_IMAGES = Object.freeze({
  Japanmakak: '/assets/images/scorecards/JapanmakakScorecard.png',
  Koi: '/assets/images/scorecards/KoiScorecard.png',
  Crane: '/assets/images/scorecards/KranichScorecard.png',
  Panda: '/assets/images/scorecards/PandaScorecard.png',
  Sika: '/assets/images/scorecards/SikaScorecard.png',
});

function toReadableLabel(value) {
  if (!value) {
    return '-';
  }

  const overrides = {
    Crane: 'Kranich',
  };

  if (overrides[value]) {
    return overrides[value];
  }

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function getLandscapeColor(landscape) {
  return LANDSCAPE_COLORS[landscape] || LANDSCAPE_COLORS.Undefined;
}

function getLandscapeImagePath(landscape) {
  return LANDSCAPE_IMAGES[landscape] || null;
}

function getLandscapeImageScale(landscape) {
  return LANDSCAPE_IMAGE_SCALES[landscape] || LANDSCAPE_IMAGE_SCALES.default;
}

function getAnimalImagePath(animal) {
  return ANIMAL_IMAGES[animal] || null;
}

function getScorecardImagePath(animal) {
  return SCORECARD_IMAGES[animal] || null;
}

function getAllowedAnimalsText(tileData) {
  if (!tileData || !Array.isArray(tileData.animals) || tileData.animals.length === 0) {
    return 'Keine';
  }

  return tileData.animals.map((animal) => toReadableLabel(animal)).join(', ');
}

function sanitizeForSvgId(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, '-');
}

function buildHexagonSvg({ index, primaryLandscape, secondaryLandscape, primaryColor, secondaryColor, isKeystone }) {
  const primaryImagePath = getLandscapeImagePath(primaryLandscape);
  const secondaryImagePath = getLandscapeImagePath(secondaryLandscape);
  const primaryScale = getLandscapeImageScale(primaryLandscape);
  const secondaryScale = getLandscapeImageScale(secondaryLandscape);

  const viewWidth = 100;
  const viewHeight = 86.60254;
  const primaryScaledWidth = viewWidth * primaryScale;
  const primaryScaledHeight = viewHeight * primaryScale;
  const primaryOffsetX = (viewWidth - primaryScaledWidth) / 2;
  const primaryOffsetY = (viewHeight - primaryScaledHeight) / 2;

  const secondaryScaledWidth = viewWidth * secondaryScale;
  const secondaryScaledHeight = viewHeight * secondaryScale;
  const secondaryOffsetX = (viewWidth - secondaryScaledWidth) / 2;
  const secondaryOffsetY = (viewHeight - secondaryScaledHeight) / 2;

  const primaryPatternId = `tile-pattern-primary-${index}-${sanitizeForSvgId(primaryLandscape)}`;
  const secondaryPatternId = `tile-pattern-secondary-${index}-${sanitizeForSvgId(secondaryLandscape || 'none')}`;
  const leftClipId = `tile-left-clip-${index}`;
  const rightClipId = `tile-right-clip-${index}`;

  const primaryFill = primaryImagePath ? `url(#${primaryPatternId})` : primaryColor;
  const secondaryFill = secondaryImagePath ? `url(#${secondaryPatternId})` : secondaryColor;

  const splitPolygons = isKeystone
    ? `<polygon
        points="0,43.30127 25,0 75,0 100,43.30127 75,86.60254 25,86.60254"
        fill="${primaryFill}"
      ></polygon>`
    : `<polygon
        points="0,43.30127 25,0 75,0 100,43.30127 75,86.60254 25,86.60254"
        fill="${primaryFill}"
        clip-path="url(#${leftClipId})"
      ></polygon>
      <polygon
        points="0,43.30127 25,0 75,0 100,43.30127 75,86.60254 25,86.60254"
        fill="${secondaryFill}"
        clip-path="url(#${rightClipId})"
      ></polygon>`;

  return `
    <svg class="hand-panel__tile-visual" viewBox="0 0 100 86.60254" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="${primaryPatternId}" patternUnits="userSpaceOnUse" width="100" height="86.60254">
          <image href="${primaryImagePath || ''}" x="${primaryOffsetX}" y="${primaryOffsetY}" width="${primaryScaledWidth}" height="${primaryScaledHeight}" preserveAspectRatio="xMidYMid slice"></image>
        </pattern>
        <pattern id="${secondaryPatternId}" patternUnits="userSpaceOnUse" width="100" height="86.60254">
          <image href="${secondaryImagePath || ''}" x="${secondaryOffsetX}" y="${secondaryOffsetY}" width="${secondaryScaledWidth}" height="${secondaryScaledHeight}" preserveAspectRatio="xMidYMid slice"></image>
        </pattern>
        <clipPath id="${leftClipId}">
          <rect x="0" y="0" width="50" height="86.60254"></rect>
        </clipPath>
        <clipPath id="${rightClipId}">
          <rect x="50" y="0" width="50" height="86.60254"></rect>
        </clipPath>
      </defs>
      ${splitPolygons}
      <polygon
        points="0,43.30127 25,0 75,0 100,43.30127 75,86.60254 25,86.60254"
        fill="none"
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
    <p class="hand-panel__status" aria-live="polite">Runde 1</p>
    <div class="hand-panel__scores" aria-label="Spielerübersicht"></div>
    <div class="hand-panel__state-block" aria-live="polite">
      <div class="hand-panel__state">Tile auswählen</div>
      <div class="hand-panel__state-description">Wähle ein Tile aus deiner Hand aus.</div>
    </div>
    <div class="hand-panel__list" role="list"></div>
  `;

  const scorecardImage = document.createElement('img');
  scorecardImage.className = 'hand-panel__scorecard-image';
  scorecardImage.alt = '';
  scorecardImage.hidden = true;
  scorecardImage.setAttribute('aria-live', 'polite');
  scorecardImage.setAttribute('aria-label', 'Tier-Scorecard');

  const status = panel.querySelector('.hand-panel__status');
  const state = panel.querySelector('.hand-panel__state');
  const stateDescription = panel.querySelector('.hand-panel__state-description');
  const stateBlock = panel.querySelector('.hand-panel__state-block');
  const scores = panel.querySelector('.hand-panel__scores');
  const list = panel.querySelector('.hand-panel__list');
  if (!status || !state || !stateDescription || !stateBlock || !scores || !list || !scorecardImage) {
    throw new Error('Hand panel list could not be created.');
  }

  const hideScorecard = () => {
    scorecardImage.hidden = true;
    scorecardImage.removeAttribute('src');
    scorecardImage.alt = '';
  };

  const showScorecard = (animal) => {
    const scorecardImagePath = getScorecardImagePath(animal);
    if (!scorecardImagePath) {
      hideScorecard();
      return;
    }

    scorecardImage.src = scorecardImagePath;
    scorecardImage.alt = `Scorecard für ${toReadableLabel(animal)}`;
    scorecardImage.hidden = false;
  };

  let hoveredAnimal = null;
  let selectedAnimal = null;

  const refreshScorecard = () => {
    const activeAnimal = hoveredAnimal || selectedAnimal;
    if (activeAnimal) {
      showScorecard(activeAnimal);
    } else {
      hideScorecard();
    }
  };

  list.addEventListener('mouseover', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const pairButton = target.closest('.hand-panel__pair');
    if (!pairButton || !list.contains(pairButton) || pairButton.disabled) {
      return;
    }

    hoveredAnimal = pairButton.dataset.animal || null;
    refreshScorecard();
  });

  list.addEventListener('mouseout', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const fromButton = target.closest('.hand-panel__pair');
    if (!fromButton || !list.contains(fromButton)) {
      return;
    }

    const related = event.relatedTarget;
    if (related instanceof Element) {
      const toButton = related.closest('.hand-panel__pair');
      if (toButton && list.contains(toButton) && !toButton.disabled) {
        hoveredAnimal = toButton.dataset.animal || null;
        refreshScorecard();
        return;
      }
    }

    hoveredAnimal = null;
    refreshScorecard();
  });

  list.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const pairButton = target.closest('.hand-panel__pair');
    if (!pairButton || !list.contains(pairButton) || pairButton.disabled) {
      return;
    }

    hoveredAnimal = pairButton.dataset.animal || null;
    refreshScorecard();
  });

  list.addEventListener('focusout', (event) => {
    const related = event.relatedTarget;
    if (related instanceof Element && list.contains(related)) {
      return;
    }

    hoveredAnimal = null;
    refreshScorecard();
  });

  panel.addEventListener('mouseleave', () => {
    hoveredAnimal = null;
    refreshScorecard();
  });

  const render = (pairs = [], selectedIndex = 0) => {
    list.textContent = '';
    selectedAnimal = pairs[selectedIndex]?.animal || null;

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
          <span class="hand-panel__pair-title">Leer</span>
          <span class="hand-panel__pair-meta">Kein Paar vorhanden</span>
        `;
        list.append(button);
        continue;
      }

      const primaryColor = getLandscapeColor(pair.tileData.primaryLandscape);
      const secondaryColor = pair.tileData.isKeystone
        ? primaryColor
        : getLandscapeColor(pair.tileData.secondaryLandscape);
      const tileVisualSvg = buildHexagonSvg({
        index,
        primaryLandscape: pair.tileData.primaryLandscape,
        secondaryLandscape: pair.tileData.secondaryLandscape,
        primaryColor,
        secondaryColor,
        isKeystone: pair.tileData.isKeystone,
      });
      const drawnAnimalText = toReadableLabel(pair.animal);
      const drawnAnimalImagePath = getAnimalImagePath(pair.animal);
      const allowedAnimalsText = getAllowedAnimalsText(pair.tileData);

      button.classList.toggle('hand-panel__pair--selected', index === selectedIndex);
      button.dataset.animal = String(pair.animal || '');
      button.innerHTML = `
        <span class="hand-panel__pair-visual-row">
          ${tileVisualSvg}
          <span class="hand-panel__pair-divider" aria-hidden="true"></span>
          <span class="hand-panel__drawn-animal" aria-label="Gezogenes Tier">
            ${drawnAnimalImagePath
    ? `<img src="${drawnAnimalImagePath}" alt="${drawnAnimalText}" class="hand-panel__animal-avatar" />`
    : drawnAnimalText}
          </span>
        </span>
        <span class="hand-panel__pair-meta">Erlaubte Tiere: ${allowedAnimalsText}</span>
      `;

      button.addEventListener('click', () => {
        selectedAnimal = pair.animal || null;
        hoveredAnimal = null;
        refreshScorecard();
        onSelectPair?.(index);
      });

      list.append(button);
    }

    refreshScorecard();
  };

  const updateStatus = ({
    currentRound = 1,
    totalRounds = 1,
    currentPlayer = 1,
    playerCount = 1,
    scoresByPlayer = [],
    roundStateLabel = 'Tile auswählen',
    roundStateDescription = 'Wähle ein Tile aus deiner Hand aus.',
    isSpecialState = false,
  } = {}) => {
    status.textContent = `Runde ${currentRound}/${totalRounds}`;
    state.textContent = roundStateLabel;
    stateDescription.textContent = roundStateDescription;
    panel.classList.toggle('hand-panel--state-special', Boolean(isSpecialState));
    stateBlock.classList.toggle('hand-panel__state-block--special', Boolean(isSpecialState));

    scores.textContent = '';
    for (let index = 0; index < playerCount; index += 1) {
      const score = Number(scoresByPlayer[index] ?? 0);
      const scoreRow = document.createElement('div');
      scoreRow.className = 'hand-panel__score-row';

      if (index + 1 === currentPlayer) {
        scoreRow.classList.add('hand-panel__score-row--active');
      }

      scoreRow.innerHTML = `
        <span class="hand-panel__score-points">${score} Punkte</span>
      `;
      scores.append(scoreRow);
    }
  };

  return {
    element: panel,
    scorecardElement: scorecardImage,
    update: render,
    updateStatus,
  };
}
