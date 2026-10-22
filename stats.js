/* =========================================================
   bliss — live numbers
   Pulls the only figures on this page that change: the support
   server's member count, who's online, and its boost level.

   Source: Discord's public API (no token, CORS enabled):
     GET /api/v10/invites/:code?with_counts=true
     GET /api/v10/applications/:id/rpc

   Every value is optional and rendered into [data-live="…"]
   elements. Nothing here falls back to invented numbers: if a
   request fails, the field stays an em dash and the page says so.
   ========================================================= */
(() => {
  "use strict";

  const CONFIG = {
    /* Point this at your own JSON endpoint to override the Discord
       lookups, e.g. "/stats.json". Accepted shape:
       { members, online, boosts, tier, servers, users, verified }  */
    endpoint: "",

    applicationId: "1551866139200585759",
    inviteCode: "ENtJ8sr5bu",
    ttl: 5 * 60 * 1000,
    timeout: 8000,
    cacheKey: "bliss:live-stats:v1",
  };

  const nodes = Array.from(document.querySelectorAll("[data-live]"));
  if (!nodes.length) return;

  const number = new Intl.NumberFormat("en-US");
  const stamp = (ts) => {
    const minutes = Math.floor((Date.now() - ts) / 60000);
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? "yesterday" : `${days} days ago`;
  };

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(CONFIG.cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== "number" || !parsed.data) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      sessionStorage.setItem(CONFIG.cacheKey, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      /* private mode, quota, whatever — caching is a nicety */
    }
  };

  const fetchJson = async (url) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CONFIG.timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        credentials: "omit",
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
    }
  };

  const pick = (...values) => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) return value;
    }
    return null;
  };

  /* Accepts either Discord's payloads or a flat object from CONFIG.endpoint. */
  const normalise = (...payloads) => {
    const out = {
      members: null,
      online: null,
      boosts: null,
      tier: null,
      servers: null,
      users: null,
      verified: null,
    };

    for (const payload of payloads) {
      if (!payload || typeof payload !== "object") continue;
      const guild = payload.guild || {};
      const profile = payload.profile || {};

      out.members = pick(out.members, payload.members, payload.member_count, payload.approximate_member_count, profile.member_count);
      out.online = pick(out.online, payload.online, payload.online_count, payload.approximate_presence_count, profile.online_count);
      out.boosts = pick(out.boosts, payload.boosts, payload.premium_subscription_count, guild.premium_subscription_count);
      out.tier = pick(out.tier, payload.tier, payload.premium_tier, guild.premium_tier);
      out.servers = pick(out.servers, payload.servers, payload.server_count, payload.guild_count);
      out.users = pick(out.users, payload.users, payload.user_count);

      if (out.verified === null && typeof payload.verified === "boolean") out.verified = payload.verified;
      if (out.verified === null && typeof payload.is_verified === "boolean") out.verified = payload.is_verified;
    }

    return out;
  };

  const load = async () => {
    if (CONFIG.endpoint) return normalise(await fetchJson(CONFIG.endpoint));

    const invite = `https://discord.com/api/v10/invites/${CONFIG.inviteCode}?with_counts=true&with_expiration=false`;
    const application = `https://discord.com/api/v10/applications/${CONFIG.applicationId}/rpc`;

    /* The application call only adds the verified flag, so a failure
       there shouldn't sink the counts. */
    const [inviteResult, appResult] = await Promise.allSettled([fetchJson(invite), fetchJson(application)]);
    if (inviteResult.status === "rejected" && appResult.status === "rejected") {
      throw inviteResult.reason;
    }

    return normalise(
      inviteResult.status === "fulfilled" ? inviteResult.value : null,
      appResult.status === "fulfilled" ? appResult.value : null
    );
  };

  const format = (key, value) => {
    if (key === "tier") return `Level ${value}`;
    return number.format(value);
  };

  const render = (data, ts, { stale = false } = {}) => {
    let rendered = 0;

    for (const node of nodes) {
      const key = node.dataset.live;
      if (key === "updated") {
        node.textContent = stamp(ts);
        continue;
      }
      if (key === "state") {
        node.textContent = stale ? "Last known" : "Live";
        continue;
      }
      const value = data[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        node.textContent = format(key, value);
        rendered += 1;
      }
    }

    document.documentElement.dataset.live = stale ? "stale" : rendered ? "ready" : "partial";

    const verified = document.querySelectorAll('[data-live="verified"]');
    verified.forEach((node) => {
      if (data.verified === true) {
        node.hidden = false;
      } else {
        node.hidden = true;
      }
    });
  };

  const fail = () => {
    document.documentElement.dataset.live = "error";
    nodes.forEach((node) => {
      if (node.dataset.live === "state") node.textContent = "Unavailable";
      if (node.dataset.live === "updated") node.textContent = "—";
    });
  };

  let current = null;

  const start = async () => {
    const cached = readCache();
    if (cached && Date.now() - cached.ts < CONFIG.ttl) {
      current = cached;
      render(cached.data, cached.ts);
      return;
    }

    try {
      const data = await load();
      const ts = Date.now();
      current = { data, ts };
      writeCache(data);
      render(data, ts);
    } catch {
      if (cached) {
        current = cached;
        render(cached.data, cached.ts, { stale: true });
      } else {
        fail();
      }
    }
  };

  start();

  /* Keep "updated 3 min ago" honest without refetching. */
  window.setInterval(() => {
    if (!current) return;
    const node = document.querySelector('[data-live="updated"]');
    if (node) node.textContent = stamp(current.ts);
  }, 30000);

  /* Refresh once the tab comes back, if the data has aged out. */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (current && Date.now() - current.ts < CONFIG.ttl) return;
    load()
      .then((data) => {
        const ts = Date.now();
        current = { data, ts };
        writeCache(data);
        render(data, ts);
      })
      .catch(() => {});
  });
})();
