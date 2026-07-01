import '../styles/scoreBoard.css';

const DUMMY_SCORES = Object.freeze([32, 24, 19, 14]);

function toScoreRows({
  scoresByPlayer = [],
  currentPlayer = 1,
  playerCount = 1,
  useDummyData = false,
} = {}) {
  const normalizedPlayerCount = Math.max(
    1,
    Number(playerCount || scoresByPlayer.length || 1),
  );

  if (useDummyData) {
    return Array.from({ length: normalizedPlayerCount }, (_, index) => ({
      playerLabel: `Spieler ${index + 1}`,
      score: Number(DUMMY_SCORES[index] ?? 0),
      isActive: index + 1 === Number(currentPlayer || 1),
    }));
  }

  return Array.from({ length: normalizedPlayerCount }, (_, index) => ({
    playerLabel: `Spieler ${index + 1}`,
    score: Number(scoresByPlayer[index] ?? 0),
    isActive: index + 1 === Number(currentPlayer || 1),
  }));
}

export function createScoreBoard({ useDummyData = false } = {}) {
  const panel = document.createElement('aside');
  panel.className = 'score-board';
  panel.setAttribute('aria-label', 'Punktestand');

  panel.innerHTML = `
    <h2 class="score-board__title">Punktestand</h2>
    <div class="score-board__list" role="list"></div>
  `;

  const list = panel.querySelector('.score-board__list');
  if (!list) {
    throw new Error('Score board list could not be created.');
  }

  const renderRows = (rows) => {
    list.textContent = '';

    rows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'score-board__item';
      item.setAttribute('role', 'listitem');
      if (row.isActive) {
        item.classList.add('score-board__item--active');
      }

      item.innerHTML = `
        <span class="score-board__player">${row.playerLabel}</span>
        <span class="score-board__points">${row.score} P</span>
      `;
      list.append(item);
    });
  };

  const update = ({
    scoresByPlayer = [],
    currentPlayer = 1,
    playerCount = 1,
  } = {}) => {
    renderRows(
      toScoreRows({
        scoresByPlayer,
        currentPlayer,
        playerCount,
        useDummyData,
      }),
    );
  };

  update();

  return {
    element: panel,
    update,
  };
}
