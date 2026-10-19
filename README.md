# agit website

The GitHub Pages site for [agit](https://github.com/shadow-kernel/agit): why agit
instead of git, how it handles very large repositories, the full guide
(installation, server, client, agents) and the complete feature list.

Static HTML, CSS and vanilla JavaScript. No build step.

| File | Content |
| --- | --- |
| `index.html` | landing page: why agit and not git, measured advantages, comparison, the agent loop, large repositories, platform, Claude Code, roadmap |
| `scale.html` | very large repositories: storage and transfer design, what is built, the honest limits of 0.1.0, roadmap and sizing |
| `guide.html` | installation (installer, cargo, Docker, Homebrew, Windows), the client, the server (auth, Docker, systemd, proxies, policies, keys, webhooks, web UI), client meets server, agents (loop, MCP, Claude Code hooks, SDKs), troubleshooting, reference |
| `features.html` + `assets/features.js` | every feature with what / why / how, status (built, in progress, planned), search and filters |
| `assets/style.css`, `assets/site.js` | design system, theme toggle, reveal animations, tabs, copy buttons, terminal demo, table of contents, feature rendering |
| `assets/img/` | web UI screenshots copied from `agit/docs/screenshots` |
| `.github/workflows/pages.yml` | deploys the site with GitHub Actions on every push to `main` |

## Publish

1. Create a repository (for example `shadow-kernel/agit-site`, or
   `shadow-kernel.github.io` to serve it at the root domain) and push this
   folder to its `main` branch.
2. In the repository settings open **Pages** and set **Source** to
   **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys
   on every push.
3. The site is reachable at `https://<owner>.github.io/<repo>/` (or at
   `https://<owner>.github.io/` for a user site). Add a `CNAME` file for a
   custom domain.

All links inside the site are relative, so it works at any path.

## Preview locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Keeping it honest

Status badges follow the agit repository: ✅ built means it ships in the
current release, in progress means it is on `main`, planned means it is
designed in `docs/ROADMAP.md` or an RFC. Measured numbers come only from
`docs/BENCHMARKS.md`. When the project changes, update `assets/features.js`
and the status callouts in the pages.
