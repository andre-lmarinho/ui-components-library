/**
 * Pointer-based hover animation for interactive cards.
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */
window.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.js-hover-move');
  if (!elements.length) return;

  elements.forEach((element) => {
    element.style.transition = 'transform 0.2s ease-out';
    element.style.transformOrigin = 'center center';

    element.addEventListener('mousemove', (event) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const moveX = px * 20;
      const moveY = py * 20;
      element.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = 'translate(0, 0)';
    });
  });
});
