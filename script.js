/* =========================================================
   bliss — a small amount of JavaScript, on purpose
   nav · tabs · copy-a-command · footer year
   ========================================================= */
(() => {
  "use strict";

  /* ---------- header state ---------- */
  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 4);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setMenu = (open) => {
    header.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  navToggle?.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-open"));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && header.classList.contains("is-open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /* ---------- command tabs ---------- */
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const panels = [...document.querySelectorAll(".tab-panel")];

  const selectTab = (tab, { focus = false } = {}) => {
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });

    panels.forEach((panel) => {
      const active = panel.id === `panel-${tab.dataset.tab}`;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });

    if (focus) tab.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab));

    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      let next = null;

      if (event.key === "ArrowRight") next = tabs[index === last ? 0 : index + 1];
      if (event.key === "ArrowLeft") next = tabs[index === 0 ? last : index - 1];
      if (event.key === "Home") next = tabs[0];
      if (event.key === "End") next = tabs[last];

      if (next) {
        event.preventDefault();
        selectTab(next, { focus: true });
      }
    });
  });

  /* ---------- copy a command ---------- */
  const toastEl = document.getElementById("toast");
  let toastTimer;

  const toast = (message) => {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 1800);
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text}`);
    } catch {
      toast("Could not copy — select the command manually");
    }
  };

  document.querySelectorAll(".cmd code").forEach((code) => {
    code.setAttribute("role", "button");
    code.setAttribute("tabindex", "0");
    code.setAttribute("title", "Copy command");
    code.style.cursor = "pointer";

    code.addEventListener("click", () => copy(code.textContent.trim()));
    code.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        copy(code.textContent.trim());
      }
    });
  });

  /* ---------- footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
