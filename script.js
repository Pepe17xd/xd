(() => {
  'use strict';

  const scenes = [...document.querySelectorAll('.scene')];
  const audio = document.getElementById('birthday-audio');
  const audioGate = document.getElementById('audio-gate');
  const audioMessage = document.getElementById('audio-message');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TRANSITION_GUARD_MS = reducedMotion.matches ? 20 : 720;

  let current = 0;
  let started = false;
  let paused = false;
  let candlesBlown = false;
  let lastChangeAt = 0;
  let clockHandle = 0;
  let clockStartedAt = 0;
  let advanceIn = 0;
  let candlesOffIn = null;
  let fadeHandle = 0;
  let audioWasPlaying = false;

  const music = window.BIRTHDAY_MUSIC || { src: '' };
  audio.loop = true;
  audio.volume = 0;
  audio.preload = 'auto';
  if (music.src) audio.src = music.src;

  function showAudioGate(message = 'El navegador bloqueó el inicio automático del audio.') {
    audioMessage.textContent = message;
    audioGate.hidden = false;
  }

  function hideAudioGate() {
    audioGate.hidden = true;
  }

  function reportAudioFailure(error, fromGesture) {
    if (fromGesture) {
      showAudioGate('No se pudo iniciar el audio. Puedes seguir viendo la historia.');
    } else if (error && error.name === 'NotAllowedError') {
      showAudioGate('El navegador bloqueó el inicio automático del audio.');
    } else {
      showAudioGate('El audio no pudo empezar. Puedes reintentarlo sin detener la historia.');
    }
  }

  function fadeAudioIn() {
    window.clearInterval(fadeHandle);
    const targetVolume = 0.35;
    const steps = 24;
    let step = 0;
    fadeHandle = window.setInterval(() => {
      step += 1;
      audio.volume = Math.min(targetVolume, targetVolume * step / steps);
      if (step >= steps) window.clearInterval(fadeHandle);
    }, 70);
  }

  function fadeAudioOut() {
    window.clearInterval(fadeHandle);
    const startVolume = audio.volume;
    if (audio.paused || startVolume <= 0) {
      audio.pause();
      return;
    }
    const steps = 32;
    let step = 0;
    fadeHandle = window.setInterval(() => {
      step += 1;
      audio.volume = Math.max(0, startVolume * (1 - step / steps));
      if (step >= steps) {
        window.clearInterval(fadeHandle);
        audio.pause();
      }
    }, 80);
  }

  function tryAudioPlayback({ fromGesture = false } = {}) {
    if (!music.src) {
      showAudioGate('No se encontró la pista local. Puedes seguir viendo la presentación.');
      return;
    }
    audio.muted = false;
    let playback;
    try {
      // On load this may be blocked by the browser; the show keeps running either way.
      playback = audio.play();
    } catch (error) {
      reportAudioFailure(error, fromGesture);
      return;
    }
    if (playback && typeof playback.then === 'function') {
      playback.then(() => {
        hideAudioGate();
        if (current === scenes.length - 1) fadeAudioOut();
        else fadeAudioIn();
      }).catch(error => reportAudioFailure(error, fromGesture));
    } else {
      hideAudioGate();
      if (current === scenes.length - 1) fadeAudioOut();
      else fadeAudioIn();
    }
  }

  function primeImages(index) {
    // Start current and nearby photos early, without fetching the whole film at once.
    [index, index + 1, index + 2, index + 3].forEach(sceneIndex => {
      const scene = scenes[sceneIndex];
      if (!scene) return;
      scene.querySelectorAll('img[data-src]').forEach(image => {
        if (image.dataset.requested === 'true') return;
        image.dataset.requested = 'true';
        image.src = image.dataset.src;
      });
    });
  }

  function stopClock() {
    if (clockHandle) window.clearTimeout(clockHandle);
    clockHandle = 0;
    clockStartedAt = 0;
  }

  function consumeClockTime() {
    if (!clockHandle) return;
    const elapsed = performance.now() - clockStartedAt;
    advanceIn = Math.max(0, advanceIn - elapsed);
    if (candlesOffIn !== null) candlesOffIn = Math.max(0, candlesOffIn - elapsed);
    stopClock();
  }

  // One timeout owns both scene transitions and the automatic candle extinguish.
  function armClock() {
    stopClock();
    if (!started || paused || document.hidden || current === scenes.length - 1) return;
    const nextEventIn = candlesOffIn === null ? advanceIn : Math.min(advanceIn, candlesOffIn);
    clockStartedAt = performance.now();
    clockHandle = window.setTimeout(tickClock, Math.max(0, nextEventIn));
  }

  function tickClock() {
    consumeClockTime();
    if (candlesOffIn !== null && candlesOffIn <= 0 && !candlesBlown) {
      candlesOffIn = null;
      blowCandles();
    }
    if (advanceIn <= 0) {
      if (current < scenes.length - 1) enterScene(current + 1, { automatic: true });
      return;
    }
    armClock();
  }

  function setClockForScene() {
    stopClock();
    if (current >= scenes.length - 1 || paused || document.hidden) return;
    advanceIn = Math.max(0, Number(scenes[current].dataset.duration) || 6500);
    candlesOffIn = current === 2 ? 5400 : null;
    armClock();
  }

  function enterScene(index, { automatic = false, force = false } = {}) {
    if (!started && !force) return;
    if (index < 0 || index >= scenes.length || index === current) return;
    const now = performance.now();
    if (!automatic && !force && now - lastChangeAt < TRANSITION_GUARD_MS) return;
    lastChangeAt = now;
    stopClock();

    const previous = scenes[current];
    previous.classList.remove('active');
    previous.classList.add('leaving');
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    const finishLeave = event => {
      if (event.target !== previous || event.propertyName !== 'opacity') return;
      previous.classList.remove('leaving');
      previous.removeEventListener('transitionend', finishLeave);
    };
    previous.addEventListener('transitionend', finishLeave);

    current = index;
    const scene = scenes[current];
    scene.classList.remove('leaving');
    scene.classList.add('active');
    scene.inert = false;
    scene.removeAttribute('aria-hidden');
    document.body.dataset.scene = String(current);
    candlesBlown = false;
    primeImages(current);

    if (current === 2) scenes[current].classList.remove('candles-blown');
    setClockForScene();
    if (current === scenes.length - 1) fadeAudioOut();
  }

  function blowCandles() {
    if (current !== 2 || candlesBlown || paused) return;
    if (clockHandle) consumeClockTime();
    candlesBlown = true;
    candlesOffIn = null;
    scenes[current].classList.add('candles-blown');
    armClock();
  }

  function togglePause() {
    if (!started || current === scenes.length - 1) return;
    paused = !paused;
    if (paused) {
      consumeClockTime();
      audioWasPlaying = !audio.paused;
      if (audioWasPlaying) audio.pause();
    } else {
      if (!document.hidden && audioWasPlaying) audio.play().catch(() => showAudioGate('Pulsa «Activar audio» para reanudarlo.'));
      audioWasPlaying = false;
      armClock();
    }
  }

  function startPresentation() {
    if (started) return;
    started = true;
    document.body.dataset.scene = '0';
    primeImages(0);
    tryAudioPlayback();
    setClockForScene();
  }

  document.getElementById('audio-enable').addEventListener('click', () => tryAudioPlayback({ fromGesture: true }));
  document.addEventListener('keydown', event => {
    if (!started || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return;
    if (event.code === 'Space' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      togglePause();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!started) return;
    if (document.hidden) {
      if (!paused && clockHandle) consumeClockTime();
      audioWasPlaying = !audio.paused;
      if (audioWasPlaying) audio.pause();
    } else {
      if (!paused) armClock();
      if (audioWasPlaying && !audio.muted) audio.play().catch(() => showAudioGate('Pulsa «Activar audio» para reanudarlo.'));
      audioWasPlaying = false;
    }
  });

  document.querySelectorAll('.photo-frame img').forEach(image => {
    const frame = image.closest('.photo-frame');
    image.addEventListener('load', () => frame.classList.add('image-loaded'));
    image.addEventListener('error', () => {
      if (image.dataset.fallback && image.dataset.fallbackAttempted !== 'true') {
        image.dataset.fallbackAttempted = 'true';
        image.src = image.dataset.fallback;
        return;
      }
      frame.classList.add('image-error');
      frame.closest('.photo-scene')?.classList.add('photo-unavailable');
    });
  });

  audio.addEventListener('error', () => showAudioGate('No se pudo cargar la pista local. Puedes seguir viendo la presentación.'));
  startPresentation();
})();
