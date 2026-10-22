/* =========================================================
   bliss — interactions
   ========================================================= */
(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toastEl = document.getElementById("toast");
  let toastTimer;

  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2400);
  };

  /* ---------- nav ---------- */
  const navWrap = document.getElementById("navWrap");
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");

  const onScroll = () => navWrap.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  burger?.addEventListener("click", () => {
    const open = navWrap.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navWrap.classList.remove("menu-open");
      burger?.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- scroll reveal ---------- */
  const revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const siblings = [...(el.parentElement?.children || [])];
            const idx = Math.max(0, siblings.indexOf(el));
            el.style.transitionDelay = `${Math.min(idx * 60, 300)}ms`;
            el.classList.add("in");
            revealObs.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => revealObs.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* ---------- counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const val = target * easeOut(t);
      el.textContent =
        prefix +
        val.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window && !prefersReduced) {
    const countObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            countObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => countObs.observe(el));
  } else {
    counters.forEach((el) => {
      const d = parseInt(el.dataset.decimals || "0", 10);
      el.textContent =
        (el.dataset.prefix || "") +
        parseFloat(el.dataset.count).toLocaleString("en-US", {
          minimumFractionDigits: d,
          maximumFractionDigits: d,
        }) +
        (el.dataset.suffix || "");
    });
  }

  /* ---------- command tabs ---------- */
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".tab-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      const panel = document.querySelector(`.tab-panel[data-panel="${tab.dataset.tab}"]`);
      panel?.classList.add("active");
    });
  });

  /* ---------- copy to clipboard ---------- */
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(`Copied ${text} — go try it ✨`);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast(`Copied ${text} ✨`);
      } catch {
        toast("Couldn't copy — your browser said no 😔");
      }
      document.body.removeChild(ta);
    }
  };

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => copy(chip.dataset.copy || chip.textContent.trim()));
  });
  document.querySelectorAll(".cmd").forEach((row) => {
    const code = row.querySelector("code")?.textContent?.trim();
    if (!code) return;
    row.addEventListener("click", () => copy(code));
  });

  /* ---------- FAQ: only one open at a time ---------- */
  const faqs = document.querySelectorAll(".faq");
  faqs.forEach((d) =>
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      faqs.forEach((other) => {
        if (other !== d) other.open = false;
      });
    })
  );

  /* ---------- billing toggle ---------- */
  const billButtons = document.querySelectorAll(".bill");
  billButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      billButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const yearly = btn.dataset.bill === "yearly";
      document.querySelectorAll(".amount[data-monthly]").forEach((amount) => {
        amount.textContent = yearly ? amount.dataset.yearly : amount.dataset.monthly;
      });
      document.querySelectorAll(".price .per").forEach((per) => {
        per.textContent = per.textContent.trim() === "forever" ? "forever" : yearly ? "/ mo, yearly" : "/ month";
      });
    });
  });

/* ---------- cookie banner ---------- */
  const cookieBanner = document.getElementById("cookieBanner");
  const proofPop = document.getElementById("proofPop");
  const COOKIE_KEY = "bliss-cookie-choice";
  let cookieDismissed = false;

  const startProofPop = () => {
    if (!proofPop || window.innerWidth <= 960) return;
    if (sessionStorage.getItem("bliss-proof-closed")) return;

    const facts = [
      ["nova_png", "just added Bliss to", "Anime Lounge", "2 minutes ago"],
      ["kai.builds", "upgraded to", "Bliss Pro", "4 minutes ago"],
      ["mothgirl_irl", "just invited Bliss to", "Cozy Corner", "7 minutes ago"],
      ["0xleo", "left a 5★ review of", "Bliss", "11 minutes ago"],
      ["studywithzoe", "just hit", "4,000 members", "13 minutes ago"],
      ["dev_zero", "just added Bliss to", "The Coding Cave", "16 minutes ago"],
    ];

    const nameEl = document.getElementById("proofPopName");
    const textEl = document.getElementById("proofPopText");
    const timeEl = document.getElementById("proofPopTime");
    let i = 0;

    const cycle = () => {
      const [name, verb, thing, time] = facts[i % facts.length];
      i += 1;
      if (nameEl) nameEl.textContent = name;
      if (textEl) textEl.innerHTML = `${verb} <b>${thing}</b>`;
      if (timeEl) timeEl.textContent = time;

      proofPop.classList.remove("show");
      void proofPop.offsetWidth; // restart the progress bar
      proofPop.classList.add("show");

      setTimeout(() => proofPop.classList.remove("show"), 6200);
      setTimeout(cycle, 9500);
    };

    setTimeout(cycle, 700);
    document.getElementById("proofPopClose")?.addEventListener("click", () => {
      proofPop.classList.remove("show");
      proofPop.classList.add("dismissed");
      sessionStorage.setItem("bliss-proof-closed", "1");
    });
  };

  if (cookieBanner) {
    const choice = sessionStorage.getItem(COOKIE_KEY);
    if (choice) {
      cookieBanner.remove();
      startProofPop();
    } else {
      setTimeout(() => {
        cookieBanner.hidden = false;
        requestAnimationFrame(() => cookieBanner.classList.add("show"));
      }, 1400);
    }

    cookieBanner.querySelectorAll("[data-cookie]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.cookie;
        if (kind === "manage") {
          toast("47 cookie partners would like to know your location 🍪");
          return;
        }
        cookieDismissed = true;
        sessionStorage.setItem(COOKIE_KEY, kind);
        cookieBanner.classList.remove("show");
        setTimeout(() => {
          cookieBanner.hidden = true;
          startProofPop();
        }, 400);
        toast(kind === "accept" ? "Cookies accepted. You are now legally delicious 🍪" : "Only the essential cookies. Respect ✊");
      });
    });
  }

  /* ---------- placeholder links ---------- */
  document.querySelectorAll('a[href="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const label = (a.textContent || "").toLowerCase();
      if (label.includes("sales")) {
        toast("Sales inbox is fictional, but flattered ☎️");
      } else if (label.includes("discord") || label.includes("trial")) {
        toast("Demo link — drop your real invite URL into index.html 🐾");
      } else {
        toast("Demo link — swap in a real URL in index.html ✨");
      }
    });
  });

  /* ---------- cursor glow + card spotlight ---------- */
  const glow = document.getElementById("cursorGlow");
  if (glow && window.matchMedia("(pointer: fine)").matches && !prefersReduced) {
    let gx = window.innerWidth / 2;
    let gy = window.innerHeight / 2;
    let cx = gx;
    let cy = gy;
    window.addEventListener("pointermove", (e) => {
      gx = e.clientX;
      gy = e.clientY;
      glow.style.opacity = "1";
    });
    const loop = () => {
      cx += (gx - cx) * 0.09;
      cy += (gy - cy) * 0.09;
      glow.style.left = `${cx}px`;
      glow.style.top = `${cy}px`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- hero window tilt ---------- */
  const visual = document.querySelector(".hero-visual");
  const win = visual?.querySelector(".discord-window");
  if (visual && win && window.matchMedia("(pointer: fine)").matches && !prefersReduced) {
    visual.addEventListener("pointermove", (e) => {
      const r = visual.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      win.style.transform = `rotateY(${-7 + px * 8}deg) rotateX(${3 - py * 6}deg) translateY(-4px)`;
    });
    visual.addEventListener("pointerleave", () => {
      win.style.transform = "";
    });
  }

  /* ---------- live-ish jitter on "servers" number ---------- */
  const statEls = document.querySelectorAll(".stat-num span[data-count='84000']");
  if (statEls.length && !prefersReduced) {
    setInterval(() => {
      const n = 84000 + Math.floor(Math.random() * 40);
      statEls.forEach((el) => (el.textContent = `${n.toLocaleString("en-US")}+`));
    }, 4200);
  }

  /* ---------- konami-lite: 3 clicks on logo = confetti of emoji ---------- */
  const brand = document.querySelector(".nav .brand");
  let clicks = 0;
  brand?.addEventListener("click", () => {
    clicks += 1;
    if (clicks < 3 || prefersReduced) return;
    clicks = 0;
    const emojis = ["✨", "🐾", "💙", "🫧", "⭐", "💫"];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.textContent = emojis[i % emojis.length];
      s.style.cssText = `position:fixed;left:${Math.random() * 100}vw;top:-40px;font-size:${14 + Math.random() * 16}px;z-index:999;pointer-events:none;transition:transform 2.4s cubic-bezier(.2,.7,.3,1),opacity 2.4s ease;`;
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.transform = `translateY(${window.innerHeight + 80}px) rotate(${Math.random() * 360}deg)`;
        s.style.opacity = "0";
      });
      setTimeout(() => s.remove(), 2600);
    }
    toast("you found the cat. congrats 🐾");
  });
})();
