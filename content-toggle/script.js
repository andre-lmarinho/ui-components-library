/**
 * Multi-content toggle — shows one panel at a time based on button clicks.
 *
 * Uses data attributes:
 *   [data-toggle-group]  — container
 *   [data-toggle="N"]    — button that activates panel N
 *   [data-panel="N"]     — content panel N
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */
document.addEventListener('DOMContentLoaded', () => {
  const groups = document.querySelectorAll('[data-toggle-group]');

  groups.forEach((group) => {
    const buttons = Array.from(group.querySelectorAll('[data-toggle]'));
    const panels = Array.from(group.querySelectorAll('[data-panel]'));

    if (!buttons.length || !panels.length) return;

    const activate = (id) => {
      buttons.forEach((btn) => {
        const isMatch = btn.dataset.toggle === id;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isMatch = panel.dataset.panel === id;
        panel.classList.toggle('is-active', isMatch);
        panel.setAttribute('aria-hidden', isMatch ? 'false' : 'true');
      });
    };

    // Set initial state — first button active
    const initialId = buttons[0]?.dataset.toggle;
    if (initialId) activate(initialId);

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (btn.classList.contains('is-active')) return;
        activate(btn.dataset.toggle);
      });
    });

    // Keyboard navigation
    buttons.forEach((btn, index) => {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('tabindex', index === 0 ? '0' : '-1');

      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const direction = e.key === 'ArrowRight' ? 1 : -1;
          const next = (index + direction + buttons.length) % buttons.length;
          buttons[next].focus();
          buttons[next].setAttribute('tabindex', '0');
          btn.setAttribute('tabindex', '-1');
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(btn.dataset.toggle);
        }
      });
    });
  });
});
