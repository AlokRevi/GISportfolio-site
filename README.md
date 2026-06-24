# Alok GIS Portfolio

Static GIS portfolio site for Alok Revi. The main public experience is the single-scroll `/gis/` page, with a compact root redirect and a concise About page for employers.

## Purpose

The site presents junior GIS analyst work for hiring managers and recruiters. Projects emphasize spatial analysis, data QA, cartography, limitations, and decision value without requiring a backend or build process.

## Tech Stack

- Plain HTML, CSS, and JavaScript
- MapLibre GL JS via CDN for the Food Access interactive map
- Static GeoJSON data
- Static map, chart, thumbnail, and icon assets

No framework, package manager, build tool, backend, database, CMS, or login is required.

## Source Structure

```text
.
├── index.html                  # Root redirect/fallback landing page
├── about/                      # Employer-focused About page
├── contact/                    # Tracked legacy/direct contact page, not in nav
├── gis/                        # Source GIS pages; gis/index.html is the main portfolio
├── css/                        # Shared site styles and map-specific styles
├── js/                         # Shared UI JS and Food Access MapLibre setup
├── assets/                     # Icons, profile image, thumbnails, static maps, charts
├── data/                       # Food Access GeoJSON and project data notes
├── scripts/                    # Local GIS processing/export scripts
└── dist-gis/                   # Tracked deploy-ready copy for /gis/ hosting
```

## Deploy Folder

`dist-gis/` is the tracked deploy-ready folder. It preserves relative paths for deployment as a `/gis/` subfolder, such as `https://alokrevi.com/gis/`.

Do not upload `deploy-gisportfolio-site/`; it is an ignored duplicate/local export folder.

## Run Locally

From the project root:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

A local server is required for browser `fetch()` calls to GeoJSON files.

## Pre-Deployment Checks

Run:

```bash
node --check js/main.js
node --check js/food-access-map.js
git diff --check
```

Then smoke test these paths through the local server:

- `/`
- `/gis/`
- `/about/`
- `/css/style.css`
- `/css/maps.css`
- `/js/main.js`
- `/js/food-access-map.js`
- `/assets/icons/north-arrow-favicon.svg`
- key thumbnails under `/assets/thumbnails/`
- Food Access GeoJSON files under `/data/food-access-dc/`

## Updating Deploy Output

When source files change, sync the equivalent files into `dist-gis/` and keep deploy-relative paths intact. Examples:

- Source `/css/style.css` -> deploy `dist-gis/css/style.css`
- Source `/js/main.js` -> deploy `dist-gis/js/main.js`
- Source `/assets/...` -> deploy `dist-gis/assets/...`
- Source `/about/index.html` -> deploy `dist-gis/about/index.html`

## Adding Future Projects

For V1, keep `/gis/` as the main single-scroll portfolio page. Add new projects by:

1. Adding the card and section to `gis/index.html`.
2. Adding static maps/charts under `assets/maps/` or `assets/charts/`.
3. Adding notes under `data/new-project-slug/` when source or processing context matters.
4. Syncing the same public assets and HTML into `dist-gis/`.

Create separate project pages only if the site direction changes.

## Ignored Local/Generated Files

`.gitignore` keeps local/editor/cache clutter, screenshots, raw GIS processing outputs, duplicate thumbnail working folders, ZIP exports, and the ignored duplicate `deploy-gisportfolio-site/` folder out of Git.

Review any large new data or image export before committing it.
