import '../styles/gameOverScreen.css';

const ANIMAL_LABELS = [
  ['panda', 'Panda'],
  ['japanmakak', 'Japanmakak'],
  ['koi', 'Koi'],
  ['sika', 'Sika'],
  ['crane', 'Kranich'],
];

const LANDSCAPE_LABELS = [
  ['bambooforest', 'Bamboo Forest'],
  ['mountain', 'Mountain'],
  ['pond', 'Pond'],
  ['sakura', 'Sakura'],
  ['wetland', 'Wetland'],
];

function toRows(entries = [], scores = {}) {
  return entries.map(([key, label]) => ({
    label,
    score: Number(scores[key] ?? 0),
  }));
}

function renderScoreRows(container, rows) {
  container.textContent = '';

  rows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'game-over-screen__row';
    item.innerHTML = `
      <span class="game-over-screen__row-label">${row.label}</span>
      <span class="game-over-screen__row-score">${row.score} P</span>
    `;
    container.append(item);
  });
}

export function createGameOverScreen({ onReplay } = {}) {
  const screen = document.createElement('section');
  screen.className = 'game-over-screen game-over-screen--hidden';
  screen.setAttribute('role', 'dialog');
  screen.setAttribute('aria-modal', 'true');
  screen.setAttribute('aria-label', 'Game Over');

  screen.innerHTML = `
    <div class="game-over-screen__dialog">
      <header class="game-over-screen__header">
        <p class="game-over-screen__eyebrow">Spiel beendet</p>
        <h2 class="game-over-screen__title">Game Over</h2>
        <p class="game-over-screen__summary">Finale Gesamtpunktzahl</p>
        <div class="game-over-screen__total">0 P</div>
      </header>

      <div class="game-over-screen__grid">
        <section class="game-over-screen__section">
          <h3 class="game-over-screen__section-title">Punkte pro Tierart</h3>
          <div class="game-over-screen__list game-over-screen__list--animals" role="list"></div>
        </section>

        <section class="game-over-screen__section">
          <h3 class="game-over-screen__section-title">Punkte pro Landschaft</h3>
          <div class="game-over-screen__list game-over-screen__list--landscapes" role="list"></div>
        </section>
      </div>

      <button class="game-over-screen__replay-button" type="button">Nochmal spielen</button>
    </div>
  `;

  const totalElement = screen.querySelector('.game-over-screen__total');
  const animalList = screen.querySelector('.game-over-screen__list--animals');
  const landscapeList = screen.querySelector('.game-over-screen__list--landscapes');
  const replayButton = screen.querySelector('.game-over-screen__replay-button');

  if (!totalElement || !animalList || !landscapeList || !replayButton) {
    throw new Error('Game over screen could not be created.');
  }

  const update = (scoreResult = null) => {
    const totalScore = Number(scoreResult?.totalScore ?? 0);
    const animalRows = toRows(ANIMAL_LABELS, scoreResult?.scores?.animalScores ?? {});
    const landscapeRows = toRows(LANDSCAPE_LABELS, scoreResult?.scores?.landscapeScores ?? {});

    totalElement.textContent = `${totalScore} P`;
    renderScoreRows(animalList, animalRows);
    renderScoreRows(landscapeList, landscapeRows);
  };

  const show = (scoreResult = null) => {
    update(scoreResult);
    screen.classList.remove('game-over-screen--hidden');
    screen.setAttribute('aria-hidden', 'false');
  };

  const hide = () => {
    screen.classList.add('game-over-screen--hidden');
    screen.setAttribute('aria-hidden', 'true');
  };

  replayButton.addEventListener('click', () => {
    onReplay?.();
  });

  hide();

  return {
    element: screen,
    update,
    show,
    hide,
  };
}