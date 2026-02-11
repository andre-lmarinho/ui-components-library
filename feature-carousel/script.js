/**
 * Interactive feature carousel with pointer-based drag.
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */

const SNAP_DURATION_MS = 500;
const SPEED_TRIGGER = 0.12;
const DISPLACEMENT_TRIGGER = 0.2;
const PROJECTION_MS = 320;
const MIN_DRAG_PX = 2;
const MOBILE_BREAKPOINT = 980;

document.addEventListener('DOMContentLoaded', () => {
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

  const buildTrack = ({ viewport, slideSelector, trackClass, wrapSlides = true }) => {
    let slides = Array.from(viewport.querySelectorAll(slideSelector));
    let track = viewport;

    if (wrapSlides) {
      track = viewport.querySelector(`.${trackClass}`);
      if (!track) {
        track = document.createElement('div');
        track.className = trackClass;
        slides.forEach((slide) => track.appendChild(slide));
        viewport.appendChild(track);
      } else {
        slides = Array.from(track.children);
      }
    } else if (slides.length === 0) {
      slides = Array.from(viewport.children);
    }

    return { track, slides };
  };

  const createPointerCarousel = ({
    viewport,
    slideSelector,
    trackClass,
    initialIndex = 0,
    isEnabled = () => true,
    wrapSlides = true,
  }) => {
    if (!viewport) return null;

    const { track, slides } = buildTrack({
      viewport,
      slideSelector,
      trackClass,
      wrapSlides,
    });

    if (slides.length === 0) return null;

    const state = {
      index: clamp(initialIndex, 0, slides.length - 1),
      width: 0,
      gap: 0,
      span: 0,
      total: 0,
      x: 0,
      dragging: false,
      animId: 0,
      lastX: 0,
      lastT: 0,
      startPointerX: 0,
      startX: 0,
    };

    let indexRequester = null;

    const readMetrics = () => {
      state.width = viewport.clientWidth;
      const cs = getComputedStyle(track);
      state.gap = parseFloat(cs.gap || cs.columnGap || '0') || 0;
      state.span = state.width + state.gap;
      state.total = slides.length * state.width + (slides.length - 1) * state.gap;
    };

    const clampX = (x) => clamp(x, 0, Math.max(0, state.total - state.width));

    const applyTransform = () => {
      track.style.transform = `translate3d(${-state.x}px,0,0)`;
    };

    const animateTo = (targetX, duration = SNAP_DURATION_MS) => {
      if (!isEnabled()) {
        state.x = targetX;
        applyTransform();
        return;
      }
      if (state.animId) cancelAnimationFrame(state.animId);
      const from = state.x;
      const delta = targetX - from;
      if (Math.abs(delta) < 1 || duration <= 0) {
        state.x = targetX;
        applyTransform();
        return;
      }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        state.x = from + delta * easeInOutCubic(p);
        applyTransform();
        if (p < 1) state.animId = requestAnimationFrame(step);
      };
      state.animId = requestAnimationFrame(step);
    };

    const gotoIndex = (idx, animate = true) => {
      idx = clamp(idx, 0, slides.length - 1);
      state.index = idx;
      const targetX = idx * state.span;
      if (animate && isEnabled()) animateTo(targetX, SNAP_DURATION_MS);
      else {
        state.x = targetX;
        applyTransform();
      }
    };

    const nearestIndex = () => clamp(Math.round(state.x / state.span), 0, slides.length - 1);

    const pointerDown = (e) => {
      if (!isEnabled() || slides.length <= 1) return;
      state.dragging = true;
      if (state.animId) cancelAnimationFrame(state.animId);
      state.startPointerX = e.clientX;
      state.startX = state.x;
      state.lastX = state.x;
      state.lastT = performance.now();
      viewport.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    const pointerMove = (e) => {
      if (!state.dragging || !isEnabled() || slides.length <= 1) return;
      const dx = e.clientX - state.startPointerX;
      state.x = clampX(state.startX - dx);
      applyTransform();

      const now = performance.now();
      const dt = now - state.lastT || 1;
      const v = (state.x - state.lastX) / dt;
      state.lastX = state.x;
      state.lastT = now;
      viewport._v = v;
    };

    const settleTo = (target, animate) => {
      if (typeof indexRequester === 'function') indexRequester(target, animate);
      else gotoIndex(target, animate);
    };

    const pointerUp = () => {
      if (!state.dragging) return;
      const enabled = isEnabled() && slides.length > 1;
      state.dragging = false;

      const dragDist = Math.abs(state.x - state.startX);
      const v = viewport._v || 0;
      delete viewport._v;

      const projectedX = clampX(state.x + v * PROJECTION_MS);
      let target = Math.round(projectedX / state.span);

      if (Math.abs(v) <= SPEED_TRIGGER && dragDist < MIN_DRAG_PX) {
        target = nearestIndex();
      } else if (Math.abs(v) <= SPEED_TRIGGER) {
        const frac = state.x / state.span - Math.floor(state.x / state.span);
        const base = Math.floor(state.x / state.span);
        target = frac > DISPLACEMENT_TRIGGER ? base + 1 : base;
      }

      target = clamp(target, 0, slides.length - 1);

      if (enabled) settleTo(target, true);
      else gotoIndex(target, true);
    };

    const pointerCancel = () => {
      if (!state.dragging) return;
      state.dragging = false;
      gotoIndex(nearestIndex(), true);
    };

    viewport.addEventListener('pointerdown', pointerDown, { passive: false });
    viewport.addEventListener('pointermove', pointerMove, { passive: false });
    viewport.addEventListener('pointerup', pointerUp);
    viewport.addEventListener('pointercancel', pointerCancel);
    viewport.addEventListener('pointerleave', pointerCancel);
    viewport.addEventListener('dragstart', (e) => e.preventDefault());

    readMetrics();
    gotoIndex(state.index, false);

    return {
      viewport,
      track,
      slides,
      state,
      gotoIndex,
      readMetrics,
      setIndexRequester(fn) {
        indexRequester = typeof fn === 'function' ? fn : null;
      },
      resetTransform() {
        track.style.transform = '';
        state.x = 0;
      },
    };
  };

  const grids = document.querySelectorAll('.feature-preview__grid');
  grids.forEach((grid) => {
    const media = grid.querySelector('.feature-preview__media');
    if (!media) return;

    const mediaSlides = Array.from(media.querySelectorAll('.feature-preview__image-list'));
    if (mediaSlides.length === 0) return;

    const componentRoot =
      grid.closest('.feature-preview') ||
      grid.parentElement ||
      document;

    const cards = Array.from(componentRoot.querySelectorAll('.feature-preview__card-list'));
    const dots = Array.from(componentRoot.querySelectorAll('.feature-preview__dot'));

    const initialIndex = Math.max(
      mediaSlides.findIndex((slide) => slide.classList.contains('is-active')),
      0
    );

    const mediaCarousel = createPointerCarousel({
      viewport: media,
      slideSelector: '.feature-preview__image-list',
      trackClass: 'fp-track',
      initialIndex,
      wrapSlides: true,
    });

    if (!mediaCarousel) return;

    let cardCarousel = null;
    const cardContainer =
      cards[0]?.closest('.feature-preview__cards') || cards[0]?.parentElement || null;

    const setActiveClasses = (idx) => {
      cards.forEach((el) => el.classList.remove('is-active', 'card-list-is-active'));
      dots.forEach((el) => el.classList.remove('is-active', 'dot-is-active'));
      mediaCarousel.slides.forEach((el) => el.classList.remove('is-active'));
      cards[idx]?.classList.add('is-active', 'card-list-is-active');
      dots[idx]?.classList.add('is-active', 'dot-is-active');
      mediaCarousel.slides[idx]?.classList.add('is-active');
    };

    const gotoIndex = (idx, animate = true) => {
      idx = clamp(idx, 0, mediaCarousel.slides.length - 1);
      mediaCarousel.gotoIndex(idx, animate);
      if (cardCarousel && mobileQuery.matches) {
        cardCarousel.gotoIndex(idx, animate);
      }
      setActiveClasses(idx);
    };

    mediaCarousel.setIndexRequester((idx, animate) => gotoIndex(idx, animate));

    const ensureCardCarousel = () => {
      if (!cardContainer) return;

      const containerCards = Array.from(
        cardContainer.querySelectorAll('.feature-preview__card-list')
      );

      if (containerCards.length <= 1) {
        cardContainer.classList.remove('has-card-carousel');
        if (cardCarousel) cardCarousel.resetTransform();
        return;
      }

      if (!mobileQuery.matches) {
        cardContainer.classList.remove('has-card-carousel');
        if (cardCarousel) cardCarousel.resetTransform();
        return;
      }

      cardContainer.classList.add('has-card-carousel');

      if (!cardCarousel) {
        cardCarousel = createPointerCarousel({
          viewport: cardContainer,
          slideSelector: '.feature-preview__card-list',
          trackClass: 'fp-card-track',
          initialIndex,
          wrapSlides: true,
          isEnabled: () => mobileQuery.matches,
        });

        if (cardCarousel) {
          cardCarousel.setIndexRequester((idx, animate) => gotoIndex(idx, animate));
        }
      }

      if (cardCarousel) {
        cardCarousel.readMetrics();
        cardCarousel.gotoIndex(mediaCarousel.state.index, false);
      }
    };

    ensureCardCarousel();
    gotoIndex(initialIndex, false);

    cards.forEach((el, i) => el.addEventListener('click', () => gotoIndex(i, true)));
    dots.forEach((el, i) => el.addEventListener('click', () => gotoIndex(i, true)));

    const handleResize = () => {
      mediaCarousel.readMetrics();
      mediaCarousel.gotoIndex(mediaCarousel.state.index, false);
      if (cardCarousel && mobileQuery.matches) {
        cardCarousel.readMetrics();
        cardCarousel.gotoIndex(mediaCarousel.state.index, false);
      }
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 60);
    });

    const mqListener = () => {
      ensureCardCarousel();
      if (cardCarousel && mobileQuery.matches) {
        cardCarousel.readMetrics();
        cardCarousel.gotoIndex(mediaCarousel.state.index, false);
      }
    };

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', mqListener);
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener(mqListener);
    }
  });
});
