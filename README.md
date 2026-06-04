# Alok Revi GIS Portfolio

## Purpose

This is Version 1 of a static GIS portfolio website for AlokRevi.com. The site presents spatial analysis work for GIS hiring managers with clear research questions, methods, visuals, limitations, and next steps.

## V1 Scope

- Homepage with featured GIS projects.
- GIS portfolio hub.
- Three GIS case study pages.
- One MapLibre GL JS interactive map for Food Access in Washington, D.C.
- Structured visual sections for Homelessness and Breast Cancer Mortality exports.
- GeoJSON files for Food Access map layers.
- Static-first implementation with no build process.

## Tech Stack

- Plain HTML
- Plain CSS
- Plain JavaScript
- MapLibre GL JS via CDN on the Food Access page
- GeoJSON map data
- Static map/chart placeholders

No framework, build tool, backend, database, CMS, or login is included.

## Folder Structure

```text
gis-portfolio/
├── index.html
├── about/
│   └── index.html
├── contact/
│   └── index.html
├── gis/
│   ├── index.html
│   ├── food-access-dc/
│   │   └── index.html
│   ├── homelessness-us/
│   │   └── index.html
│   └── breast-cancer-mortality/
│       └── index.html
├── data/
│   ├── food-access-dc/
│   │   ├── snap_locations.geojson
│   │   ├── non_snap_locations.geojson
│   │   └── demographic_context.geojson
│   ├── homelessness-us/
│   │   └── README.md
│   └── breast-cancer-mortality/
│       └── README.md
├── assets/
│   ├── images/
│   ├── charts/
│   ├── maps/
│   │   ├── homelessness-us/
│   │   └── breast-cancer-mortality/
│   └── thumbnails/
├── css/
│   ├── style.css
│   └── maps.css
├── js/
│   ├── main.js
│   ├── food-access-map.js
│   └── layer-controls.js
└── README.md
```

## How To Run Locally

From the project root, run:

```bash
python -m http.server 5500
```

Then open:

```text
http://localhost:5500
```

A local server is recommended because loading GeoJSON with `fetch()` from `file://` may fail in the browser.

## Replacing Placeholder Images

The Homelessness case study expects final exports at:

- `assets/maps/homelessness-us/homelessness-rate-2024.png`
- `assets/maps/homelessness-us/homelessness-count-vs-rate.png`
- `assets/maps/homelessness-us/homelessness-change-2020-2024.png`
- `assets/maps/homelessness-us/homelessness-unsheltered-2024.png`

The Breast Cancer Mortality case study expects final exports at:

- `assets/maps/breast-cancer-mortality/breast-cancer-data-coverage.png`
- `assets/maps/breast-cancer-mortality/breast-cancer-mortality-ratio.png`
- `assets/maps/breast-cancer-mortality/breast-cancer-disparity-map.png`
- `assets/maps/breast-cancer-mortality/breast-cancer-hotspot-analysis.png`

V1 uses styled placeholder blocks so the site does not show broken images before final exports are ready. When final images are available, replace each placeholder block in the relevant HTML page with a semantic `<figure>` containing an `<img>` and `<figcaption>`.

## Replacing Placeholder GeoJSON

The Food Access map uses web-ready GeoJSON files:

- `data/food-access-dc/snap_locations.geojson`
- `data/food-access-dc/non_snap_locations.geojson`
- `data/food-access-dc/demographic_context.geojson`

Replace these with real ArcGIS Pro exports before publishing final analysis. Keep the files as valid GeoJSON FeatureCollections and preserve readable properties such as:

- `name`
- `category`
- `snap_status`
- `address`
- `neighbourhood`

If field names change, update popup formatting in `js/food-access-map.js`.

## Adding A Future Project

1. Create a new folder under `gis/new-project-slug/`.
2. Add an `index.html` using the same project page structure.
3. Add a project card to `gis/index.html`.
4. Add a featured card to the homepage if it should be highlighted.
5. Add data notes under `data/new-project-slug/`.
6. Add static image exports under `assets/maps/new-project-slug/` or `assets/charts/`.

## Deployment Notes

This site can be deployed on any static host that supports clean folder URLs, including GitHub Pages, Netlify, Cloudflare Pages, or a static web server behind AlokRevi.com.

Use the project root as the published directory. Confirm that direct links such as `/gis/food-access-dc/` resolve to the nested `index.html` files.

## Roadmap

- Maintain Food Access GeoJSON from validated GIS exports.
- Replace static visual placeholders with final map and chart images.
- Add final source citations to the data README files.
- Add real Resume, LinkedIn, GitHub, and email links.
- Add project thumbnails after final cartography is available.
- Review copy against final results so no placeholder language remains on the public version.

