# Hostinger GIS Subfolder Deployment

This folder is the deployment-ready version of the static GIS portfolio for:

```text
https://alokrevi.com/gis/
```

Upload the contents of this `dist-gis/` folder into:

```text
public_html/gis/
```

Do not upload the folder itself as `public_html/gis/dist-gis/`. The `index.html`, project folders, `css/`, `js/`, `data/`, and `assets/` folders should sit directly inside `public_html/gis/`.

## Expected Hostinger Structure

```text
public_html/
├── WordPress files remain here
└── gis/
    ├── index.html
    ├── food-access-dc/
    ├── homelessness-us/
    ├── breast-cancer-mortality/
    ├── about/
    ├── contact/
    ├── css/
    ├── js/
    ├── data/
    ├── assets/
    └── README.md
```

The site is static. It does not require a backend, database, CMS, framework, or build tool.

## Notes

- `dist-gis/index.html` is the single scrollable GIS portfolio page.
- There is intentionally no `dist-gis/gis/index.html`.
- Project cards on `dist-gis/index.html` jump to page sections.
- The separate project folders are included as supporting public pages.
- Internal links use relative paths for deployment under `/gis/`.
- Food Access map data loads from `../data/food-access-dc/` relative to `/gis/food-access-dc/`.
- The site is ready to upload as a static subfolder deployment.

