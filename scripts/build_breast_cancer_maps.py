"""Build static county-level Breast Cancer Mortality portfolio maps.

Inputs are read from the prepared GeoPackage only. The script does not alter
the source data.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


DEFAULT_INPUT = Path(
    "data/breast-cancer-mortality/"
    "breast_cancer_joined_cb2023_outputs/"
    "breast_cancer_county_mortality_2019_2023_joined_cb2023.gpkg"
)
LAYER_NAME = "breast_cancer_county_mortality_2019_2023"
OUTPUT_DIR = Path("assets/maps/breast-cancer-mortality")
SUMMARY_PATH = OUTPUT_DIR / "breast_cancer_map_build_summary.txt"

TERRITORY_STUSPS = {"PR", "VI", "GU", "MP", "AS"}
CONUS_CRS = "ESRI:102003"
ALASKA_CRS = "EPSG:3338"
HAWAII_CRS = "EPSG:3759"

SOURCE_NOTE = (
    "Source: U.S. Cancer Statistics county-level mortality data, 2019–2023; "
    "U.S. Census county boundaries. Rates are age-adjusted where provided. "
    "Puerto Rico and other territories are excluded. Alaska and Hawaii are shown as insets."
)
NO_DATA_COLOR = "#dedfda"
QUIET_BOUNDARY_COLOR = "#f1ece2"


def require_dependencies():
    try:
        import geopandas as gpd  # noqa: F401
        import matplotlib.pyplot as plt  # noqa: F401
        from matplotlib.patches import Patch  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            "Missing required Python GIS plotting dependency. Install dependencies with:\n"
            "  python -m pip install geopandas matplotlib\n\n"
            f"Original error: {exc}"
        ) from exc


def split_regions(gdf):
    non_territory = gdf[~gdf["STUSPS"].isin(TERRITORY_STUSPS)].copy()
    conus = non_territory[non_territory["map_region"].eq("Contiguous U.S.")].copy()
    alaska = non_territory[non_territory["map_region"].eq("Alaska inset")].copy()
    hawaii = non_territory[non_territory["map_region"].eq("Hawaii inset")].copy()
    territories = gdf[gdf["STUSPS"].isin(TERRITORY_STUSPS)].copy()
    return non_territory, conus, alaska, hawaii, territories


def project(gdf, crs):
    if gdf.empty:
        return gdf
    return gdf.to_crs(crs)


def safe_project_hawaii(gdf):
    try:
        return project(gdf, HAWAII_CRS)
    except Exception:
        # EPSG:3759 is preferred. This fallback keeps the map build usable if
        # the local CRS database does not include it.
        return project(gdf, "EPSG:4135")


def setup_figure(title, subtitle):
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(12.8, 7.6), facecolor="#f7f9f8")
    ax = fig.add_axes([0.04, 0.22, 0.63, 0.62])
    ak_ax = fig.add_axes([0.06, 0.12, 0.18, 0.14])
    hi_ax = fig.add_axes([0.27, 0.12, 0.14, 0.10])
    legend_ax = fig.add_axes([0.72, 0.48, 0.22, 0.30])
    legend_ax.set_facecolor("#ffffff")
    legend_ax.axis("off")

    fig.text(0.035, 0.935, title, fontsize=15.5, fontweight="bold", color="#202827")
    fig.text(0.035, 0.895, subtitle, fontsize=9.6, color="#5f6f6c")
    fig.text(0.035, 0.055, SOURCE_NOTE, fontsize=8.5, color="#5f6f6c")
    fig.text(0.035, 0.032, "Changed-boundary counties without USCS rows are shown as a quiet neutral class where applicable.", fontsize=8.2, color="#5f6f6c")
    return fig, ax, ak_ax, hi_ax, legend_ax


def clean_axis(ax, label=None, inset=False):
    if inset:
        ax.set_facecolor("#fbfcfb")
        ax.set_xticks([])
        ax.set_yticks([])
        ax.tick_params(left=False, bottom=False, labelleft=False, labelbottom=False)
        for spine in ax.spines.values():
            spine.set_visible(True)
            spine.set_color("#d9e2df")
            spine.set_linewidth(0.8)
    else:
        ax.set_axis_off()

    if label:
        ax.text(
            0.035,
            0.06,
            label,
            transform=ax.transAxes,
            fontsize=6.8,
            fontweight="medium",
            color="#36413f",
            bbox={"boxstyle": "round,pad=0.18", "facecolor": "white", "edgecolor": "#d9e2df"},
        )


def draw_base(ax, gdf):
    if not gdf.empty:
        gdf.plot(ax=ax, color=NO_DATA_COLOR, edgecolor="#f8f8f5", linewidth=0.08)


def draw_inset_outline(ax, gdf, linewidth):
    if not gdf.empty:
        gdf.boundary.plot(ax=ax, color="#87928f", linewidth=linewidth)


def draw_categorical(ax, gdf, field, color_map, default_color=NO_DATA_COLOR):
    draw_base(ax, gdf)
    for value, color in color_map.items():
        subset = gdf[gdf[field].eq(value)]
        if not subset.empty:
            subset.plot(ax=ax, color=color, edgecolor="#ffffff", linewidth=0.08)
    missing = gdf[~gdf[field].isin(color_map.keys()) | gdf[field].isna()]
    if not missing.empty:
        missing.plot(ax=ax, color=default_color, edgecolor="#ffffff", linewidth=0.08)


def draw_categorical_overlay(ax, base_gdf, overlay_gdf, field, color_map):
    draw_base(ax, base_gdf)
    for value, color in color_map.items():
        subset = overlay_gdf[overlay_gdf[field].eq(value)]
        if not subset.empty:
            subset.plot(ax=ax, color=color, edgecolor="#ffffff", linewidth=0.1)


def draw_numeric(ax, gdf, field, bins, colors, missing_color=NO_DATA_COLOR):
    draw_base(ax, gdf)
    missing = gdf[gdf[field].isna()]
    if not missing.empty:
        missing.plot(ax=ax, color=missing_color, edgecolor="#ffffff", linewidth=0.08)

    for low, high, color, _label in bins:
        if high is None:
            subset = gdf[gdf[field].ge(low)]
        else:
            subset = gdf[gdf[field].ge(low) & gdf[field].lt(high)]
        if not subset.empty:
            subset.plot(ax=ax, color=color, edgecolor="#ffffff", linewidth=0.08)


def draw_legend(legend_ax, title, items):
    from matplotlib.patches import Patch

    handles = [Patch(facecolor=color, edgecolor="#d9e2df", label=label) for label, color in items]
    legend_ax.legend(
        handles=handles,
        title=title,
        loc="upper left",
        frameon=True,
        facecolor="#ffffff",
        edgecolor="#d9e2df",
        framealpha=0.96,
        borderpad=0.8,
        fontsize=9,
        title_fontsize=10,
        labelspacing=0.75,
        handlelength=1.2,
        handleheight=1.2,
    )


def save_figure(fig, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())


def make_coverage_map(regions, output_path):
    import matplotlib.pyplot as plt

    _non_territory, conus, alaska, hawaii, _territories = regions
    conus_p = project(conus, CONUS_CRS)
    alaska_p = project(alaska, ALASKA_CRS)
    hawaii_p = safe_project_hawaii(hawaii)

    colors = {
        "Both Black and White rates available": "#2f7f73",
        "Black rate not presented": "#9ebfca",
        "White rate not presented": "#d9b45b",
        "Neither Black nor White rate presented": NO_DATA_COLOR,
    }
    fig, ax, ak_ax, hi_ax, legend_ax = setup_figure(
        "Breast Cancer Mortality Data Coverage and Suppression, 2019-2023",
        "County comparison is limited by suppression of low-count race-specific mortality rates.",
    )
    for plot_ax, region_gdf, label, inset, outline_width in [
        (ax, conus_p, None, False, None),
        (ak_ax, alaska_p, "Alaska", True, 0.28),
        (hi_ax, hawaii_p, "Hawaii", True, 0.55),
    ]:
        draw_categorical(plot_ax, region_gdf, "coverage_class", colors, default_color=QUIET_BOUNDARY_COLOR)
        if inset:
            draw_inset_outline(plot_ax, region_gdf, outline_width)
        clean_axis(plot_ax, label, inset=inset)

    legend_items = [(label, colors[label]) for label in colors]
    draw_legend(legend_ax, "Coverage class", legend_items)
    save_figure(fig, output_path)
    plt.close(fig)


def make_ratio_map(regions, output_path):
    import matplotlib.pyplot as plt

    non_territory, conus, alaska, hawaii, _territories = regions
    valid = non_territory[non_territory["dual_data"].eq(True) & non_territory["rate_ratio"].notna()].copy()
    valid_ids = set(valid["GEOID"].astype(str))

    conus_base = project(conus, CONUS_CRS)
    alaska_base = project(alaska, ALASKA_CRS)
    hawaii_base = safe_project_hawaii(hawaii)
    conus_valid = project(conus[conus["GEOID"].astype(str).isin(valid_ids)], CONUS_CRS)
    alaska_valid = project(alaska[alaska["GEOID"].astype(str).isin(valid_ids)], ALASKA_CRS)
    hawaii_valid = safe_project_hawaii(hawaii[hawaii["GEOID"].astype(str).isin(valid_ids)])

    colors = {
        "White mortality higher": "#5f8db8",
        "Black mortality higher: 1.00–1.24": "#fee6ce",
        "Black mortality higher: 1.25–1.49": "#fdae6b",
        "Black mortality higher: 1.50–1.99": "#e6550d",
        "Black mortality higher: 2.00+": "#7f2704",
    }
    fig, ax, ak_ax, hi_ax, legend_ax = setup_figure(
        "Black-to-White Breast Cancer Mortality Ratio by County, 2019-2023",
        "Only 320 counties have both Black and White non-Hispanic mortality rates available for direct comparison.",
    )
    for plot_ax, base_gdf, valid_gdf, label, inset, outline_width in [
        (ax, conus_base, conus_valid, None, False, None),
        (ak_ax, alaska_base, alaska_valid, "Alaska", True, 0.28),
        (hi_ax, hawaii_base, hawaii_valid, "Hawaii", True, 0.55),
    ]:
        draw_categorical_overlay(plot_ax, base_gdf, valid_gdf, "ratio_class", colors)
        if inset:
            draw_inset_outline(plot_ax, base_gdf, outline_width)
        clean_axis(plot_ax, label, inset=inset)

    legend_items = [(label, colors[label]) for label in colors]
    legend_items.append(("No comparable Black/White rate", NO_DATA_COLOR))
    draw_legend(legend_ax, "Mortality ratio class", legend_items)
    fig.text(
        0.82,
        0.15,
        "Ratio > 1 means Black female mortality is higher than White female mortality.",
        fontsize=8.5,
        color="#5f6f6c",
        wrap=True,
    )
    save_figure(fig, output_path)
    plt.close(fig)


def make_all_rate_map(regions, output_path):
    import matplotlib.pyplot as plt

    _non_territory, conus, alaska, hawaii, _territories = regions
    conus_p = project(conus, CONUS_CRS)
    alaska_p = project(alaska, ALASKA_CRS)
    hawaii_p = safe_project_hawaii(hawaii)

    bins = [
        (0, 15, "#d8ecf6", "Under 15"),
        (15, 20, "#c6dbef", "15 to 19.9"),
        (20, 25, "#6baed6", "20 to 24.9"),
        (25, 30, "#2171b5", "25 to 29.9"),
        (30, None, "#08306b", "30 or higher"),
    ]
    fig, ax, ak_ax, hi_ax, legend_ax = setup_figure(
        "All-Races Female Breast Cancer Mortality Rate by County, 2019-2023",
        "All-races rates provide mortality context before comparing race-specific disparities.",
    )
    for plot_ax, region_gdf, label, inset, outline_width in [
        (ax, conus_p, None, False, None),
        (ak_ax, alaska_p, "Alaska", True, 0.28),
        (hi_ax, hawaii_p, "Hawaii", True, 0.55),
    ]:
        draw_numeric(plot_ax, region_gdf, "all_rate", bins, [item[2] for item in bins])
        if inset:
            draw_inset_outline(plot_ax, region_gdf, outline_width)
        clean_axis(plot_ax, label, inset=inset)

    legend_items = [(label, color) for _low, _high, color, label in bins]
    legend_items.append(("Rate not presented / suppressed", NO_DATA_COLOR))
    draw_legend(legend_ax, "Deaths per 100,000", legend_items)
    save_figure(fig, output_path)
    plt.close(fig)


def build_maps(input_path):
    require_dependencies()
    import geopandas as gpd

    gdf = gpd.read_file(input_path, layer=LAYER_NAME)
    regions = split_regions(gdf)
    non_territory, _conus, _alaska, _hawaii, territories = regions

    outputs = {
        "Data Coverage and Suppression": OUTPUT_DIR / "breast-cancer-data-coverage-2019-2023.png",
        "Black-to-White Mortality Ratio": OUTPUT_DIR / "breast-cancer-mortality-ratio-2019-2023.png",
        "All-Races Breast Cancer Mortality": OUTPUT_DIR / "breast-cancer-all-races-mortality-2019-2023.png",
    }

    make_coverage_map(regions, outputs["Data Coverage and Suppression"])
    make_ratio_map(regions, outputs["Black-to-White Mortality Ratio"])
    make_all_rate_map(regions, outputs["All-Races Breast Cancer Mortality"])

    ratio_count = int(non_territory["dual_data"].eq(True).where(non_territory["rate_ratio"].notna(), False).sum())
    all_rate_count = int(non_territory["all_rate"].notna().sum())
    summary_lines = [
        "Breast Cancer Mortality Map Build Summary",
        "",
        f"Input: {input_path}",
        f"Layer: {LAYER_NAME}",
        "",
        "Files created:",
        *(f"- {path}" for path in outputs.values()),
        "",
        "Fields used:",
        "- coverage_class for Data Coverage and Suppression",
        "- rate_ratio, ratio_class, and dual_data for Black-to-White Mortality Ratio",
        "- all_rate for All-Races Breast Cancer Mortality",
        "",
        "County counts:",
        f"- Non-territory counties included in map frame: {len(non_territory):,}",
        f"- Counties excluded as Puerto Rico / territories: {len(territories):,}",
        f"- Data coverage map counties drawn: {len(non_territory):,}",
        f"- Mortality ratio counties mapped: {ratio_count:,}",
        f"- Counties excluded from ratio map due to missing comparable race-specific data: {len(non_territory) - ratio_count:,}",
        f"- All-races mortality counties mapped: {all_rate_count:,}",
        f"- Counties without all-races mortality rate: {len(non_territory) - all_rate_count:,}",
        "",
        "Notes:",
        "- A mortality ratio greater than 1 means Black female breast cancer mortality is higher than White female breast cancer mortality in that county.",
        "- Suppressed low-count data means some counties cannot be compared directly.",
    ]
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
    print("\n".join(summary_lines))


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Build Breast Cancer Mortality portfolio PNG maps.")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to prepared GeoPackage.")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    if not args.input.exists():
        raise SystemExit(f"Input GeoPackage not found: {args.input}")
    build_maps(args.input)


if __name__ == "__main__":
    main()
