/**
 * Mobile menu toggle with hamburger animation.
 *
 * Features:
 * - Hamburger-to-X animation on click
 * - Slide-in menu panel from the right
 * - Close with ESC key
 * - Full accessibility support (ARIA attributes)
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('#slide-in-open');
  const menu = document.querySelector('.slide-in-menu-container');

  if (!btn || !menu) return;

  const toggleMenu = () => {
    const isOpen = btn.classList.toggle('open');
    menu.classList.toggle('slide-in-menu');

    // Update ARIA attributes
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  };

  // Toggle on button click
  btn.addEventListener('click', toggleMenu);

  // Close with ESC key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && btn.classList.contains('open')) {
      toggleMenu();
    }
  });

  // Close when clicking outside the menu
  document.addEventListener('click', (event) => {
    if (!btn.classList.contains('open')) return;
    if (btn.contains(event.target) || menu.contains(event.target)) return;
    toggleMenu();
  });
});
