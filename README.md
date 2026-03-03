# Holly Cloud Art

Holly Di Cecco's cloud paintings website with print shop.

**Live site:** [hollucinations.com](https://hollucinations.com)

## Local Development

### First-time setup

```bash
# Install dependencies (Square SDK for shop functions)
npm install

# Install Netlify CLI (if you don't have it)
npm install -g netlify-cli

# Link to the Netlify site
netlify link
# When prompted, choose "Enter site ID" and paste: d6116a4a-425d-4fde-8ae2-9286c96127d1

# Create a .env file with your credentials (see .env.example)
cp .env.example .env
# Then fill in the values
```

### Running locally

```bash
npm run dev
```

This starts a local server at `http://localhost:8888` with working Netlify Functions (shop, email signup, etc.).

**Do NOT open `index.html` directly in your browser** — the shop section needs Netlify Functions to load products from Square, which only work through `netlify dev` or on the deployed site.

### Deploy

Push to `master` and Netlify auto-deploys:

```bash
git add .
git commit -m "your changes"
git push origin master
```

## Environment Variables

These are set on Netlify (Site settings > Environment variables) and in your local `.env` file:

| Variable | Description |
|---|---|
| `SQUARE_ACCESS_TOKEN` | Square API access token (production) |
| `SQUARE_APP_ID` | Square application ID |
| `SQUARE_ENVIRONMENT` | `production` for live, `sandbox` for testing |
| `SQUARE_LOCATION_ID` | Square location ID |
| `KIT_API_KEY` | Kit (ConvertKit) API key |
| `KIT_FORM_ID` | Kit form ID for waitlist |

## Architecture

- Static site, no build step — files serve as-is
- Netlify Functions handle server-side work (Square API, Kit API)
- Square powers the print shop (catalog + checkout)
- Kit (ConvertKit) powers the email waitlist
