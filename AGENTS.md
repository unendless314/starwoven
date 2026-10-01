# AGENTS.md — 星靈織語 Starwoven

## Repo state

This is a **planning/spec repository for a static site rebuild**. The actual Astro
project has **not been created yet** — that is Phase 1 work. As of writing
(2026-09-21) only `demo_docs/` exists, containing the spec, roadmap, and image
prompts. There is no `package.json`, no source code, no CI, no git history.

Original site lives at `https://jessicalam-portfolio.my.canva.site/dahp-kg9jiq/`.
Reference screenshots directory is `demo_docs/reference-screenshots/` (ignored in git for privacy; use `content_inventory.md` as source of truth).

## Canonical sources of truth (read these first, in order)

1. `demo_docs/spec.md` — full spec: IA, colors, tech choices, deployment plan, risks
2. `demo_docs/development_roadmap.md` — phased plan with checkpoints and per-phase checklists
3. `demo_docs/phase0_answers.md` — confirmed decisions (LINE CTA, about-page team, VPS, image-gen path)
4. `demo_docs/image_prompts.md` — prompt templates and the generation log table

If docs conflict with each other, prefer `phase0_answers.md` (latest confirmation) over `spec.md`.

## Execution rules (from `development_roadmap.md`, non-negotiable)

- **Strict Phase order.** Finish a phase and pass its checkpoint before starting the next.
- **No fabrication.** Do not invent names, copy, or bios. If content is missing,
  use placeholders and keep moving.
  - About page: 2 founders + 8 members — owner must provide names/photos/copy.
    Build the layout with placeholders (`創辦人 A`, gray avatar) and wait.
  - All page copy comes from the original site screenshots until
    `content_inventory.md` exists (it's a Phase 0 leftover; create it when copying).
- **Update phase checkboxes in `development_roadmap.md`** at the end of each phase.
- **Off-spec decisions go in `decisions.md`** (file does not exist yet — create it
  at the repo root when first needed). Do not silently change scope.

## Site IA (Astro routes, all top-level)

`/` (index) · `/services` · `/courses` · `/about` · `/reiki` · `/akashic`

Shared components expected: `Layout.astro` (head/meta/footer),
`Navbar.astro` (desktop + mobile hamburger), `CTAButton.astro`.

## Reserved hooks (must be wired even if unused)

- `Layout.astro <head>`: Google Analytics GA4 component `<GoogleAnalytics id="G-27D79HXXF5" />` (supports `PUBLIC_GA_ID` env override and custom conversion event tracking)
- Bottom-right floating LINE button on every page (link = `@347fucvj`)
- Routes `/courses` and a future `/shop` — leave room in nav/layout, don't add links yet

## "預約諮詢" CTA — fixed value

- URL: `https://line.me/R/ti/p/@347fucvj?ts=07031038&oat_content=url`
- Always `target="_blank"` with `rel="noopener"`
- Rendered as a button in the nav (see `Navbar.astro`), reused as `CTAButton.astro`

## AI image generation & asset management (Human-led, WebP mandatory)

Agents **do not** generate images. Humans operate OpenAI (cloud) or local ComfyUI/SD
and select/edit/remove-background the outputs.

- **File naming standard**: `[分頁代碼]_[圖片代碼]_[素材名稱]_v[版本號].webp` (e.g. `home_a_tarot_world_v1.webp`).
- **Adopted assets**:
  - Archive copy → `demo_docs/sd-assets/`
  - Production web asset → `public/assets/`
- **Rejected assets** → `demo_docs/sd-assets/rejected/` (do **not** delete — keep for reference).
- **WebP conversion mandatory before commit**:
  - **Never commit uncompressed raw PNGs (>500KB - 1MB+) directly into Git.**
  - Always convert images to `.webp` (recommended Quality 80–85, `method=6`) prior to `git commit`. This achieves ~90% size reduction, avoids permanent Git blob bloat, and optimizes LCP / mobile page load speed.
  - Remove original uncompressed PNGs from git tracking once converted.
- **Log every generation**: Every adopted image gets a row in `image_prompts.md` "生成紀錄" table:
  date / model / prompt / seed / 採用|淘汰 / post-processing / file.
- `image_prompts.md` templates are written SD tag-style; for OpenAI calls they
  need to be rewritten as natural language before use.
- No image goes on the live site without a human having eyeballed it.
- **Automated SOP Script for Agents / Developers**:
  - A turnkey helper script is available at `scripts/process_asset.py`.
  - Usage: `python scripts/process_asset.py -i <raw_png> -o <name.webp> -c <代號> -n <名稱>`
  - Automatically performs background removal via `rembg`, compresses to WebP Q85, syncs to both `demo_docs/sd-assets/` and `public/assets/`, and prints the markdown log table row.

## Deployment (Hetzner NBG1, Ubuntu arm64, nginx)

- Server IP: `<YOUR_VPS_IP>` · nginx already running
- Deploy root: `/var/www/starwoven` · site type: pure static, dist served directly
  (no reverse proxy)
- **Add a new vhost only.** Do **not** edit existing server blocks. Watch port 80/443 conflicts.
- Domain: `starwoven.xyz` (add A record → `<YOUR_VPS_IP>` and fill in `server_name`).
- HTTPS via `certbot --nginx` with auto-renew.

## Visual / style notes that agents tend to get wrong

- Two distinct visual modes:
  - **Home (`/`)** — deep indigo night sky, star particles, moon logo, mystical mood
  - **Inner pages** — pale blue watercolor wash, hand-drawn doodles, light mood
- Fonts: hand-written Traditional Chinese webfont (粉圓體 or 源泉圓體) +
  rounded Latin sans (Nunito / Quicksand)
- `<html lang="zh-Hant">`, full-width punctuation in copy
- Every page needs its own `<title>`, meta description, and OG image
- Compress images — target homepage total image weight < 1 MB

## Timeline pressure

Demo deadline is **2026-09-23**. Strategy is multiple agents in parallel; the
bottleneck is review and inter-agent communication, not coding throughput.
When you change something another agent is likely working on (nav, layout,
shared components, `sd-assets/` contents), say so explicitly in your final reply.

## What is *not* in this repo

- `package.json`, `astro.config.*`, `tsconfig.json` — Phase 1 creates them
- `content_inventory.md` — Phase 0 leftover; create from the reference screenshots
- `decisions.md` — create at repo root when first off-spec decision is made
- `public/assets/` (final shipped images live here, not in `demo_docs/sd-assets/`)
