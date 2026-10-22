# bliss

A single-page site for **bliss**, a Discord bot covering VoiceMaster, AI tools, logging,
moderation, music and utility commands.

Static HTML, CSS and a small amount of JavaScript. No build step, no framework, no tracking.

![bliss](assets/banner.jpg)

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | The landing page |
| `styles.css` | Design tokens, layout, components, responsive rules |
| `script.js` | Nav state, command tabs, copy-to-clipboard, footer year |
| `stats.js` | Live member / online / boost counts from Discord's public API |
| `404.html` | Not-found page (links assume the `/Bliss/` project path) |

## Run locally

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Any static server works. The page also renders without JavaScript — only the command tabs and
copy interaction are lost.

## Page structure

1. **Header** — sticky, hairline border on scroll, collapses to a menu under 900px.
2. **Hero** — what bliss is, the invite button, and a product surface showing a conversation
   next to the VoiceMaster control panel.
3. **Live strip** — support-server members, online count, boosts and boost level, fetched at
   page load with a "updated 2 min ago" stamp.
4. **Features** — four alternating rows: VoiceMaster, AI tools, logging and security, music and
   quotes. Each has a small interface sample rather than a screenshot.
5. **Everything in the box** — the nine capability groups, then the integration list.
6. **Commands** — tabbed samples from eight categories, each row copyable with a click.
7. **Setup** — authorize, `/voicemaster setup`, then your own rules.
8. **FAQ** — native `<details>` accordion.
9. **CTA and footer** — invite, support server, real links only.

## Live stats

Nothing on the page invents a number. The only figures that change come from Discord's public
API, requested by the browser at load (both endpoints send CORS headers and need no token):

| Field | Source | Element |
| --- | --- | --- |
| Members | `GET /api/v10/invites/ENtJ8sr5bu?with_counts=true` → `approximate_member_count` | `[data-live="members"]` |
| Online | same request → `approximate_presence_count` | `[data-live="online"]` |
| Boosts | same request → `guild.premium_subscription_count` | `[data-live="boosts"]` |
| Boost level | same request → `guild.premium_tier` | `[data-live="tier"]` |
| Verified app | `GET /api/v10/applications/1551866139200585759/rpc` → `is_verified` | `[data-live="verified"]` |
| Timestamp | local clock | `[data-live="updated"]`, `[data-live="state"]` |

Behaviour:

- Successful results are cached in `sessionStorage` for 5 minutes, so a visitor doesn't hit
  Discord's rate limit by reloading.
- If the request fails and cached data exists, the page shows it marked **Last known** with its
  age. If there is no cache, the fields stay as em dashes and the label reads **Unavailable** —
  the layout keeps its shape either way.
- `window` is untouched; configuration lives in the `CONFIG` block at the top of `stats.js`.

To use your own numbers instead (for example a `/stats.json` exposing the bot's real guild and
user counts), set `endpoint` in `CONFIG`. Any of these keys may be present:

```json
{ "members": 180, "online": 37, "boosts": 15, "tier": 3, "servers": 31, "users": 2000, "verified": true }
```

Note that the bot's own guild/user totals are **not** publicly readable — Discord only exposes
them to the application owner (via a bot token) or through bot-list APIs that require a key.
Hence the page shows the support server's live numbers rather than a made-up install count.

## Design notes

- **Palette:** near-black (`#080a0e`), two greys for text, hairlines at 7–13% white, and a single
  desaturated cyan (`#8fd8f2`) used for accents and focus rings. No gradients over text, no
  glass panels, no glow, no floating orbs.
- **Type:** Instrument Sans for everything, JetBrains Mono for commands, log lines, indices and
  small labels. Both from Google Fonts with system fallbacks.
- **Layout:** 1140px max width, hairline separators, numbered sections, and interface samples
  built from divs so they stay crisp at any size and never lie about a screenshot's contents.
- **Motion:** only the header border and hover states; everything is disabled under
  `prefers-reduced-motion`.
- **Tokens** live in `:root` at the top of `styles.css`.

Copy is deliberately plain. Counts of things that don't change (99 commands, 10 integrations,
nine capability groups) are written in the markup; anything that does change is fetched live and
never hardcoded. The invite URL, support server and command index point at real destinations;
there are no placeholder `#` links.

## Deploying

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`:

1. copies `index.html`, `styles.css`, `script.js`, `stats.js`, `404.html` and the web assets
   into `_site/`
2. adds `.nojekyll`
3. uploads the artifact and deploys it with `actions/deploy-pages`

Use **Settings → Pages → Source: GitHub Actions** once per repository. Any other static host can
serve the same files.

## Assets

| File | Use |
| --- | --- |
| `assets/pfp-small.png` | Brand mark and bot avatar |
| `assets/favicon.png` | Favicon |
| `assets/banner.jpg` | Open Graph image |
| `assets/banner.png`, `assets/pfp.png` | Original supplied artwork |

## Note

bliss is not affiliated with Discord Inc. Discord is a trademark of Discord Inc.
