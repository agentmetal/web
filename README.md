# apps/web — landing page + docs

Static site, no build step. Three.js loads from CDN via an import map;
fonts from Google Fonts. Deployable behind the Caddy container from
`docs/02-architecture.md` §Deployment, or any static host.

## Develop

```bash
python3 -m http.server 4173 --directory apps/web
# open http://localhost:4173
```

## Files

- `index.html` — landing page (three.js hero in `assets/hero.js`)
- `docs/index.html` — documentation
- `llms.txt`, `agents.md` — agent-facing discovery surfaces (04-distribution §B)
- `assets/style.css` — shared design system (editorial-terminal: Instrument
  Serif × IBM Plex Mono, phosphor green on near-black)
