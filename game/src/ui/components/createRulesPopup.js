import '../styles/rulesPopup.css';

export function createRulesPopup({ pages = [], onClose } = {}) {
  const popupElement = document.createElement('section');
  popupElement.className = 'rules-popup';
  popupElement.setAttribute('role', 'dialog');
  popupElement.setAttribute('aria-modal', 'true');
  popupElement.setAttribute('aria-labelledby', 'rules-popup-title');

  const totalPages = Math.max(pages.length, 1);

  popupElement.innerHTML = `
    <div class="rules-popup__dialog">
      <header class="rules-popup__header">
        <p class="rules-popup__eyebrow">Spielregeln</p>
        <h2 class="rules-popup__title" id="rules-popup-title">Regelübersicht</h2>
        <p class="rules-popup__counter">
          Seite <span class="rules-popup__counter-current">1</span>
          / <span class="rules-popup__counter-total">${totalPages}</span>
        </p>
      </header>

      <div class="rules-popup__content">
        <div class="rules-popup__page rules-popup__page--placeholder" aria-hidden="true">
          <span class="rules-popup__page-label">Platz für JPG</span>
          <span class="rules-popup__page-hint">Hier kannst du später deine Regelbilder einfügen.</span>
        </div>
        <img class="rules-popup__image" alt="" hidden />
      </div>

      <footer class="rules-popup__actions">
        <button class="rules-popup__button rules-popup__button--ghost" type="button" data-action="close">Schließen</button>
        <button class="rules-popup__button rules-popup__button--secondary" type="button" data-action="prev">Zurück</button>
        <button class="rules-popup__button rules-popup__button--primary" type="button" data-action="next">Weiter</button>
      </footer>
    </div>
  `;

  const counterCurrent = popupElement.querySelector('.rules-popup__counter-current');
  const imageElement = popupElement.querySelector('.rules-popup__image');
  const prevButton = popupElement.querySelector('[data-action="prev"]');
  const nextButton = popupElement.querySelector('[data-action="next"]');
  const closeButton = popupElement.querySelector('[data-action="close"]');

  if (!counterCurrent || !imageElement || !prevButton || !nextButton || !closeButton) {
    throw new Error('Rules popup could not be created.');
  }

  let currentPage = 0;

  const renderPage = () => {
    const page = pages[currentPage] ?? null;

    counterCurrent.textContent = String(currentPage + 1);
    prevButton.disabled = currentPage === 0;
    nextButton.textContent = currentPage === totalPages - 1 ? 'Fertig' : 'Weiter';

    if (page?.src) {
      imageElement.hidden = false;
      imageElement.src = page.src;
      imageElement.alt = page.alt ?? '';
    } else {
      imageElement.hidden = true;
      imageElement.removeAttribute('src');
      imageElement.alt = '';
    }
  };

  const closePopup = () => {
    popupElement.classList.add('rules-popup--hidden');
    popupElement.setAttribute('aria-hidden', 'true');
    onClose?.();
  };

  prevButton.addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage -= 1;
      renderPage();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages - 1) {
      currentPage += 1;
      renderPage();
      return;
    }

    closePopup();
  });

  closeButton.addEventListener('click', closePopup);

  renderPage();

  return {
    element: popupElement,
    close: closePopup,
    setPages(nextPages = []) {
      pages = nextPages;
      currentPage = 0;
      renderPage();
    },
  };
}