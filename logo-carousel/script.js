/**
 * Continuously looping logo carousel that slows on hover.
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */

const DEFAULT_SPEED = 48;
const DEFAULT_EASING = 0.08;
const DUPLICATION_BUFFER = 2.4;
const RESIZE_THROTTLE_MS = 150;

const supportsReducedMotion = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  if (supportsReducedMotion()) return;

  document.querySelectorAll('.logo-carousel').forEach((root) => {
    if (root.dataset.carouselInitialised === 'true') return;
    root.dataset.carouselInitialised = 'true';
    initialiseClientCarousel(root);
  });
});

const initialiseClientCarousel = (root) => {
  const viewport = root.querySelector('.logo-carousel__viewport') || root;
  const track = root.querySelector('.logo-carousel__track') || viewport;
  const templateSlides = Array.from(track.children);

  if (!templateSlides.length) return;

  const baseSpeed = parseFloat(root.dataset.speed) || DEFAULT_SPEED;
  const easing = parseFloat(root.dataset.easing) || DEFAULT_EASING;

  let offset = 0;
  let cycleWidth = 0;
  let speed = baseSpeed;
  let targetSpeed = baseSpeed;
  let lastTime = performance.now();
  let frame = 0;
  let resizeTimer = 0;

  const ensureFill = () => {
    const minWidth = viewport.clientWidth * DUPLICATION_BUFFER;
    if (minWidth === 0) return false;

    const maxRounds = Math.ceil(minWidth / Math.max(track.scrollWidth, 1)) + 1;
    for (let i = 0; i < maxRounds && track.scrollWidth < minWidth; i++) {
      templateSlides.forEach((slide) => track.appendChild(slide.cloneNode(true)));
    }

    const firstCycle = Array.from(track.children).slice(0, templateSlides.length);
    const measuredWidth = firstCycle.reduce(
      (sum, slide) => sum + slide.getBoundingClientRect().width,
      0
    );

    if (!measuredWidth) {
      const pendingImages = firstCycle
        .flatMap((slide) => Array.from(slide.querySelectorAll('img')))
        .filter((img) => !img.complete);

      if (pendingImages.length) {
        pendingImages.forEach((img) =>
          img.addEventListener('load', scheduleEnsure, { once: true })
        );
      } else {
        requestAnimationFrame(scheduleEnsure);
      }

      return false;
    }

    cycleWidth = measuredWidth;
    track.style.transform = 'translate3d(0, 0, 0)';
    return true;
  };

  const step = (now) => {
    const deltaSeconds = (now - lastTime) / 1000;
    lastTime = now;

    speed += (targetSpeed - speed) * easing;
    if (targetSpeed === 0 && speed < 0.05) speed = 0;

    offset += Math.max(speed, 0) * deltaSeconds;

    if (cycleWidth > 0) {
      if (offset >= cycleWidth) offset %= cycleWidth;
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }

    frame = requestAnimationFrame(step);
  };

  const start = () => {
    if (frame) cancelAnimationFrame(frame);
    lastTime = performance.now();
    frame = requestAnimationFrame(step);
  };

  const scheduleEnsure = () => {
    if (ensureFill()) start();
  };

  const pause = () => {
    targetSpeed = 0;
  };

  const resume = () => {
    targetSpeed = baseSpeed;
  };

  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      cycleWidth = 0;
      offset = 0;
      scheduleEnsure();
    }, RESIZE_THROTTLE_MS);
  };

  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', resume);
  root.addEventListener('pointerdown', pause);
  root.addEventListener('pointerup', resume);
  root.addEventListener('pointercancel', resume);
  root.addEventListener('focusin', pause);
  root.addEventListener('focusout', resume);
  window.addEventListener('resize', handleResize);

  scheduleEnsure();
};
