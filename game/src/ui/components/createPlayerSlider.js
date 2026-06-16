import '../styles/roundSlider.css';

export function createPlayerSlider({
  value,
  min = 1,
  max = 4,
  onChange,
}) {
  const sliderElement = document.createElement('div');
  sliderElement.className = 'round-slider';

  sliderElement.innerHTML = `
    <div class="round-slider__header">
      <label class="round-slider__label" for="player-count-slider"></label>
    </div>
    <input
      id="player-count-slider"
      class="round-slider__input"
      type="range"
      min="${min}"
      max="${max}"
      step="1"
      value="${value}"
    />
  `;

  const labelElement = sliderElement.querySelector('.round-slider__label');
  const inputElement = sliderElement.querySelector('.round-slider__input');

  if (!labelElement || !inputElement) {
    throw new Error('Player slider could not be created.');
  }

  const updateLabel = (nextValue) => {
    labelElement.textContent = `Anzahl der Spieler: ${nextValue}`;
  };

  updateLabel(Number(inputElement.value));

  inputElement.addEventListener('input', () => {
    const nextValue = Number(inputElement.value);
    updateLabel(nextValue);

    onChange?.(nextValue);
  });

  return sliderElement;
}