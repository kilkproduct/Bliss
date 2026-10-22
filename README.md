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
3. **At a glance** — 99 commands, 10 integrations, 16 VoiceMaster commands, 0 dashboards.
4. **Features** — four alternating rows: VoiceMaster, AI tools, logging and security, music and
   quotes. Each has a small interface sample rather than a screenshot.
5. **Everything in the box** — the nine capability groups, then the integration list.
6. **Commands** — tabbed samples from eight categories, each row copyable with a click.
7. **Setup** — authorize, `/voicemaster setup`, then your own rules.
8. **FAQ** — native `<details>` accordion.
9. **CTA and footer** — invite, support server, real links only.

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

Copy is deliberately plain, and the numbers on the page (2,000 users, 31 servers, 99 commands)
come from the bot's own site. The invite URL, support server and command index point at real
destinations; there are no placeholder `#` links.

## Deploying

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every push to `main`:

1. copies `index.html`, `styles.css`, `script.js`, `404.html` and the web assets into `_site/`
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
