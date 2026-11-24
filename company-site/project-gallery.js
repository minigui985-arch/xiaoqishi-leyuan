(() => {
  const root = document.querySelector("[data-product-gallery]");
  if (!root) return;

  const tabs = [...root.querySelectorAll("[data-showcase-tab]")];
  const panels = [...root.querySelectorAll("[data-showcase-panel]")];

  function nearestIndex(track, cards) {
    const left = track.scrollLeft;
    let best = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const nextDistance = Math.abs(card.offsetLeft - track.offsetLeft - left);
      if (nextDistance < distance) {
        best = index;
        distance = nextDistance;
      }
    });
    return best;
  }

  function updateTrack(panel) {
    const track = panel.querySelector("[data-showcase-track]");
    const cards = [...track.children];
    const current = panel.querySelector("[data-showcase-current]");
    const total = panel.querySelector("[data-showcase-total]");
    const previous = panel.querySelector("[data-showcase-prev]");
    const next = panel.querySelector("[data-showcase-next]");
    const index = nearestIndex(track, cards);

    if (current) current.textContent = String(index + 1);
    if (total) total.textContent = String(cards.length);
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === cards.length - 1;
  }

  function activate(nextTab, focus = false) {
    const key = nextTab.dataset.showcaseTab;
    tabs.forEach((tab) => {
      const selected = tab === nextTab;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.showcasePanel !== key;
    });
    const panel = root.querySelector(`[data-showcase-panel="${key}"]`);
    const track = panel.querySelector("[data-showcase-track]");
    track.scrollLeft = 0;
    updateTrack(panel);
    if (focus) nextTab.focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab));
    tab.addEventListener("keydown", (event) => {
      let target = null;
      if (event.key === "ArrowRight") target = tabs[(index + 1) % tabs.length];
      if (event.key === "ArrowLeft") target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === "Home") target = tabs[0];
      if (event.key === "End") target = tabs[tabs.length - 1];
      if (!target) return;
      event.preventDefault();
      activate(target, true);
    });
  });

  panels.forEach((panel) => {
    const track = panel.querySelector("[data-showcase-track]");
    const cards = [...track.children];
    let frame = 0;
    track.addEventListener("scroll", () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => updateTrack(panel));
    }, { passive: true });
    panel.addEventListener("click", (event) => {
      const control = event.target.closest("[data-showcase-prev], [data-showcase-next]");
      if (!control) return;
      const current = nearestIndex(track, cards);
      const delta = control.hasAttribute("data-showcase-next") ? 1 : -1;
      const target = Math.max(0, Math.min(cards.length - 1, current + delta));
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollTo({
        left: target * (cards[0].getBoundingClientRect().width + gap),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
    updateTrack(panel);
  });
})();
