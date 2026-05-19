import '../styles/roundSlider.css';

export function createRoundSlider({
  value,
  min = 1,
  max = 10,
  onChange,
}) {
  const sliderElement = document.createElement('div');
  sliderElement.className = 'round-slider';

  sliderElement.innerHTML = `
    <div class="round-slider__header">
      <label class="round-slider__label" for="round-count-slider">Anzahl der Runden</label>
      <output class="round-slider__value" for="round-count-slider">${value}</output>
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
    <div class="round-slider__scale" aria-hidden="true">
      <span>${min}</span>
      <span>${max}</span>
    </div>
  `;

  const valueElement = sliderElement.querySelector('.round-slider__value');
  const inputElement = sliderElement.querySelector('.round-slider__input');

  if (!valueElement || !inputElement) {
    throw new Error('Round slider could not be created.');
  }

  inputElement.addEventListener('input', () => {
    const nextValue = Number(inputElement.value);

    valueElement.textContent = String(nextValue);
    onChange?.(nextValue);
  });

  return sliderElement;
}