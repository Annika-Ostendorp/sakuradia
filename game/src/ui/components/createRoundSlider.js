import '../styles/roundSlider.css';

export function createRoundSlider({
  value,
  min = 1,
  max = 20,
  onChange,
}) {
  const sliderElement = document.createElement('div');
  sliderElement.className = 'round-slider';

  sliderElement.innerHTML = `
    <div class="round-slider__header">
      <label class="round-slider__label" for="round-count-slider">Anzahl der Runden</label>
    </div>
    <input
      id="round-count-slider"
      class="round-slider__input"
      type="range"
      min="${min}"
      max="${max}"
      step="1"
      value="${value}"
    />
  `;

  const inputElement = sliderElement.querySelector('.round-slider__input');

  if (!inputElement) {
    throw new Error('Round slider could not be created.');
  }

  inputElement.addEventListener('input', () => {
    const nextValue = Number(inputElement.value);

    onChange?.(nextValue);
  });

  return sliderElement;
}