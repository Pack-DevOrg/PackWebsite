const nowPlaying = document.querySelector('#nowPlaying');
const cards = Array.from(document.querySelectorAll('.sound-card'));
let activeAudio = null;

function titleForSource(src) {
  const button = document.querySelector(`[data-src="${src}"]`);
  const card = button?.closest('.sound-card');
  const title = card?.querySelector('h2')?.textContent;

  if (title) {
    return title;
  }

  return button?.querySelector('strong')?.textContent ?? 'Soundmark';
}

function markActive(src) {
  cards.forEach(card => {
    const button = card.querySelector('[data-src]');
    card.classList.toggle('is-active', button?.dataset.src === src);
  });
}

function playSound(src) {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  activeAudio = new Audio(src);
  activeAudio.addEventListener('ended', () => {
    nowPlaying.textContent = 'Nothing yet';
    markActive('');
  });

  nowPlaying.textContent = titleForSource(src);
  markActive(src);
  activeAudio.play().catch(() => {
    nowPlaying.textContent = 'Tap again to allow audio';
    markActive('');
  });
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-src]');

  if (!trigger) {
    return;
  }

  playSound(trigger.dataset.src);
});
