# Holly's Site & Shop

## Current Status

Repo cleaned up and pushed (2026-02-28). Holly (`hollydicecco`) added as GitHub collaborator with write access. Next: clone repo on Holly's Mac at sync meeting, then production shop build (8 tasks). See [references/20260228-checkpoint.md](references/20260228-checkpoint.md) for full context.

## Overview
- **Site**: hollucinations.com (Netlify, custom domain)
- **Repo**: github.com/codacolor/holly-cloud-art (branch: master)
- **Hosting**: Netlify (site ID: d6116a4a-425d-4fde-8ae2-9286c96127d1)
- **Email**: Kit (ConvertKit) v4 API, form ID 9064377
- **Owner**: Holly Di Cecco — cloud paintings artist

## Architecture
- Static site, no build step — `publish = "."`
- `netlify.toml` for config, redirects, publish dir
- Serverless function: `netlify/functions/subscribe.js` (Kit v4 integration)
- Square shop: `netlify/functions/get-catalog.js` and `create-checkout.js`
- Env vars on Netlify: `KIT_API_KEY`, `KIT_FORM_ID`

## File Structure
```
index.html                    # Main landing page (hero video, gallery, shop, waitlist)
styles/main.css               # Main site styles
styles/brand-tokens.css       # Shared CSS custom properties
scripts/main.js               # Main site JS (form handling, lightbox, etc.)
landing-pages/vip/            # VIP capture page (/vip)
landing-pages/cloud-prints-waitlist/  # Earlier landing page variant
netlify/functions/subscribe.js # Kit v4 integration
netlify/functions/get-catalog.js # Square catalog
netlify/functions/create-checkout.js # Square checkout
netlify.toml                  # Config + redirects
_redirects                    # Backup redirects file
Visual/Video/website-video.mp4 # Optimized 3MB background video
Visual/Video/poster.jpg       # Video poster frame
```

## Landing Pages
- Pages live in `landing-pages/{slug}/` with own `index.html` + `style.css`
- Netlify rewrites (status 200) in `netlify.toml` map clean URLs: `/vip` → `/landing-pages/vip/`
- VIP page uses `<base href>` for relative path resolution under rewrites
- VIP thank-you page uses absolute CSS path instead

## Pages
- `/` — Main site with hero video, gallery, shop, waitlist form
- `/vip` — Lead capture page (Hormozi-style single screen, video bg, form → Kit)
- `/vip-thank-you` — Confirmation page for Kit button redirects

## Key Gotchas
- **Netlify rewrites break relative paths**: Status 200 rewrites keep browser URL at "from" path, so relative paths resolve wrong. Fix: `<base href="/actual/path/">` or absolute paths.
- **`<base href>` breaks local `file://` preview**: Absolute CSS paths work better for pages that don't need relative asset references.
- **CSS `display` overrides HTML `hidden`**: If CSS sets `display: flex`, `element.hidden = true` won't work. Use `element.style.display = 'none'`.
- **Kit v4 vs v3 API**: `kit_`-prefixed keys are v4. Must use `api.kit.com` (not `api.convertkit.com`) with `X-Kit-Api-Key` header. Two-step: POST `/v4/subscribers`, then POST `/v4/forms/{id}/subscribers`.
- **Netlify deploy queue**: Deploys can get stuck. Use `netlify api cancelSiteDeploy` to clear.
- **iOS video autoplay**: Requires `autoplay muted loop playsinline` attributes.

## Deployment

- **Holly's site**: `holly-cloud-art.netlify.app` (site ID: `ecd5295f-827e-45bf-9ad2-8e1f9bae20f0`) — deploy anytime with:
  `netlify deploy --prod --site ecd5295f-827e-45bf-9ad2-8e1f9bae20f0 --dir .`
- **Cody's site**: `hollycloudart.netlify.app` — auto-deploys from GitHub push to `codacolor/holly-cloud-art` master (webhook may need Cody to fix)
- Both sites point to the same repo/code; Holly's is the reliable deploy path

## Learned Conventions

- **Square shipping**: Flat rates in Square Dashboard → Online → Shipping apply to Square Online only, NOT API payment links. Use `checkoutOptions: { askForShippingAddress: true }` in `create-checkout.js` to collect address; shipping rates must be line items if needed programmatically.
- **Square coupons**: Coupons from Square Online don't apply to API-generated payment links. For testing, use sandbox credentials + test cards.
- **Netlify dev working directory**: `netlify dev` must run from the site folder, not workspace root. launch.json uses `bash -c "cd '...' && netlify dev"` to ensure correct directory.
