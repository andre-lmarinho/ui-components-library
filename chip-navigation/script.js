/**
 * Chip navigation — accessible horizontal scrolling tabs linked to page sections.
 *
 * Uses:
 *   .chipbar           — scrollable tab container
 *   .chip              — individual tab (may contain <a> with hash)
 *   .menu-category     — target section (matched by data-category or id)
 *   [data-fixed-header]— optional fixed/sticky header for offset calculation
 *
 * Author: Andre Marinho
 * Website: andremarinho.me
 */
document.addEventListener('DOMContentLoaded', () => {
  const containers = Array.from(document.querySelectorAll('.chipbar'));
  if (!containers.length) return;

  const slugify = (str) =>
    String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, '-and-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const cssEscape = (s) =>
    window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"');

  const lastClicked = (() => {
    let chip = null;
    let timer = null;

    return {
      set(next) {
        chip = next;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          chip = null;
          timer = null;
        }, 2000);
      },
      get() {
        return chip;
      },
    };
  })();

  containers.forEach((container) => {
    const chips = Array.from(container.querySelectorAll('.chip'));
    if (!chips.length) return;

    container.setAttribute('role', 'tablist');
    chips.forEach((chip, index) => {
      chip.setAttribute('role', 'tab');
      chip.setAttribute('tabindex', index === 0 ? '0' : '-1');
      chip.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    });

    if (!chips.some((chip) => chip.classList.contains('is-active'))) {
      chips[0].classList.add('is-active');
    }

    const getTargetForChip = (chip) => {
      const anchors = chip.getElementsByTagName('a');
      for (let i = 0; i < anchors.length; i++) {
        const anchor = anchors[i];
        if (anchor.hash && anchor.hash.length > 1) {
          const id = decodeURIComponent(anchor.hash.slice(1));
          let el = document.querySelector(`.menu-category[data-category="${cssEscape(id)}"]`);
          if (el) return el;
          el = document.getElementById(id);
          if (el) return el;
        }
      }
      const text = chip.innerText || chip.textContent;
      if (!text) return null;
      const id = slugify(text);
      if (!id) return null;
      let el = document.querySelector(`.menu-category[data-category="${cssEscape(id)}"]`);
      if (el) return el;
      el = document.getElementById(id);
      if (el) return el;
      return null;
    };

    let currentActive = chips.find((chip) => chip.classList.contains('is-active')) || chips[0];

    const getTopOffset = () => {
      let offset = 0;
      document.querySelectorAll('[data-fixed-header]').forEach((el) => {
        const styles = getComputedStyle(el);
        const fixed = styles.position === 'fixed' || styles.position === 'sticky';
        const rect = el.getBoundingClientRect();
        const top = parseFloat(styles.top || '0');
        if (fixed && rect.height > 0 && top <= 0 && rect.bottom > 0) {
          offset += Math.round(rect.height);
        }
      });
      return offset;
    };

    const smoothScrollToTarget = (target) => {
      const top = target.getBoundingClientRect().top + window.scrollY - getTopOffset() + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    };

    const activateChip = (chip, options = {}) => {
      const { scrollToTarget = true } = options;
      if (currentActive === chip) {
        if (scrollToTarget) {
          const target = getTargetForChip(chip);
          if (target) smoothScrollToTarget(target);
        }
        return;
      }

      chips.forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('tabindex', '-1');
      });

      chip.classList.add('is-active');
      chip.setAttribute('aria-selected', 'true');
      chip.setAttribute('tabindex', '0');
      chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      const target = getTargetForChip(chip);
      if (scrollToTarget && target) {
        smoothScrollToTarget(target);
      }
      currentActive = chip;

      document.dispatchEvent(
        new CustomEvent('chipchange', {
          detail: {
            label: chip.innerText.trim(),
            target: target && target.id ? `#${target.id}` : null,
          },
        })
      );
    };

    let scrollLockUntil = 0;
    const lockScrollSync = (ms = 1000) => {
      scrollLockUntil = Date.now() + ms;
    };
    const isScrollLocked = () => Date.now() < scrollLockUntil;

    chips.forEach((chip) => {
      chip.addEventListener('click', (event) => {
        event.preventDefault();
        lockScrollSync(1000);
        lastClicked.set(chip);
        activateChip(chip, { scrollToTarget: true });
      });
    });

    chips.forEach((chip, index) => {
      chip.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault();
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const next = (index + direction + chips.length) % chips.length;
          chips[next].focus();
        }
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          activateChip(chip, { scrollToTarget: true });
        }
      });
    });

    const mappings = chips
      .map((chip) => ({ chip, target: getTargetForChip(chip) }))
      .filter((item) => item.target);

    const computeActive = () => {
      if (!mappings.length || isScrollLocked()) return;
      const offset = getTopOffset() + 8;
      const marker = window.scrollY + offset;

      const sorted = mappings
        .map((item) => ({
          chip: item.chip,
          target: item.target,
          top: item.target.getBoundingClientRect().top + window.scrollY,
        }))
        .sort((a, b) => a.top - b.top);

      if (!sorted.length) return;

      if (window.scrollY <= 5) {
        activateChip(sorted[0].chip, { scrollToTarget: false });
        return;
      }

      let chosen = sorted[0];
      for (let i = 0; i < sorted.length; i++) {
        if (marker >= sorted[i].top - 80) {
          chosen = sorted[i];
        } else {
          break;
        }
      }

      const last = lastClicked.get();
      if (last) {
        const match = sorted.find((item) => item.chip === last);
        if (match) {
          const rect = match.target.getBoundingClientRect();
          const withinViewport = rect.bottom > 0 && rect.top < window.innerHeight * 0.6;
          if (withinViewport) {
            chosen = match;
          }
        }
      }

      if (chosen) {
        activateChip(chosen.chip, { scrollToTarget: false });
      }
    };

    if (mappings.length) {
      window.addEventListener('scroll', () => {
        if (isScrollLocked()) return;
        requestAnimationFrame(computeActive);
      }, { passive: true });

      window.addEventListener('resize', () => {
        if (!isScrollLocked()) computeActive();
      });

      window.addEventListener('hashchange', () => {
        const hash = location.hash ? location.hash.slice(1) : '';
        if (!hash) return;
        const id = decodeURIComponent(hash);
        const direct = document.getElementById(id);
        const match = mappings.find((item) => {
          if (item.target.id === id) return true;
          const dataId = item.target.getAttribute?.('data-category');
          if (dataId === id) return true;
          return direct ? item.target === direct || item.target.contains(direct) : false;
        });
        if (match) {
          lockScrollSync(900);
          lastClicked.set(match.chip);
          activateChip(match.chip, { scrollToTarget: false });
        }
      });

      window.addEventListener('load', computeActive);
      computeActive();
    }

    /* ---------- Mask gradient ---------- */
    const updateMask = () => {
      const fade = 24;
      const max = container.scrollWidth - container.clientWidth;
      if (max <= 1) {
        container.style.webkitMaskImage = 'none';
        container.style.maskImage = 'none';
        return;
      }
      const atStart = container.scrollLeft <= 1;
      const atEnd = container.scrollLeft >= max - 1;
      const left = atStart ? `#000 0, #000 ${fade}px` : `transparent 0, #000 ${fade}px`;
      const right = atEnd
        ? `#000 calc(100% - ${fade}px), #000 100%`
        : `#000 calc(100% - ${fade}px), transparent 100%`;
      const mask = `linear-gradient(to right, ${left}, ${right})`;
      container.style.webkitMaskImage = mask;
      container.style.maskImage = mask;
    };

    updateMask();
    window.addEventListener('resize', updateMask, { passive: true });
    container.addEventListener('scroll', updateMask, { passive: true });

    /* ---------- Drag-to-scroll ---------- */
    let isDragging = false;
    let isPointerDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let snapType = getComputedStyle(container).scrollSnapType || 'x mandatory';
    let snapTimer = null;
    const DRAG_THRESHOLD = 5;

    const disableSnapTemporarily = () => {
      snapType = getComputedStyle(container).scrollSnapType;
      container.style.scrollSnapType = 'none';
    };

    const restoreSnap = () => {
      container.style.scrollSnapType = snapType;
    };

    const startDrag = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      isPointerDown = true;
      isDragging = false;
      startX = event.touches ? event.touches[0].clientX : event.clientX;
      startScrollLeft = container.scrollLeft;
    };

    const dragMove = (event) => {
      if (!isPointerDown) return;
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const delta = clientX - startX;
      if (!isDragging && Math.abs(delta) >= DRAG_THRESHOLD) {
        isDragging = true;
        container.classList.add('is-dragging');
        disableSnapTemporarily();
      }
      if (!isDragging) return;
      container.scrollLeft = startScrollLeft - delta;
      event.preventDefault();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(restoreSnap, 120);
    };

    const endDrag = () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      if (!isDragging) return;
      isDragging = false;
      container.classList.remove('is-dragging');
      clearTimeout(snapTimer);
      snapTimer = setTimeout(restoreSnap, 80);
    };

    container.addEventListener('mousedown', startDrag);
    container.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);
    container.addEventListener('touchstart', startDrag, { passive: true });
    container.addEventListener('touchmove', dragMove, { passive: false });
    container.addEventListener('touchend', endDrag);

    container.addEventListener(
      'wheel',
      (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        disableSnapTemporarily();
        container.scrollLeft += event.deltaY;
        clearTimeout(snapTimer);
        snapTimer = setTimeout(restoreSnap, 120);
        event.preventDefault();
      },
      { passive: false }
    );
  });
});
