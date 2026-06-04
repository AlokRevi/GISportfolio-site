
(function initFoodAccessMap() {
  const mapContainer = document.getElementById("food-access-map");

  if (!mapContainer) {
    return;
  }

  if (typeof maplibregl === "undefined") {
    console.warn("[Food Access Map] MapLibre GL JS is not loaded.");
    return;
  }

  const positronStyle = "https://tiles.openfreemap.org/styles/positron";
  const libertyStyle = "https://tiles.openfreemap.org/styles/liberty";
  let fallbackStyleApplied = false;
  let foodAccessLayersAdded = false;

  const map = new maplibregl.Map({
    container: "food-access-map",
    style: positronStyle,
    center: [-77.0369, 38.9072],
    zoom: 11,
    attributionControl: true
  });

  const popupFields = [
    ["category", "Type"],
    ["snap_status", "SNAP status"],
    ["address", "Address"],
    ["market_type", "Market type"],
    ["source", "Source"]
  ];
  const demographicPopupFields = [
    ["poverty_percent", "Poverty"],
    ["below_poverty_count", "Below poverty count"],
    ["pct_nh_black", "Non-Hispanic Black"],
    ["pct_hispanic_total", "Hispanic / Latino"]
  ];
  const gapPopupFields = [
    ["poverty_percent", "Poverty"],
    ["below_poverty_count", "Below poverty count"],
    ["snap_800m_count", "SNAP retailers within 800m"],
    ["nearest_snap_m", "Nearest SNAP retailer"],
    ["access_gap_category", "Access gap category"]
  ];
  const dataPath = mapContainer.dataset.foodAccessDataPath || "/data/food-access-dc/";
  const layerGroups = {
    gaps: "candidate-access-gaps-fill,candidate-access-gaps-outline",
    poverty: "poverty-context-fill,poverty-context-outline",
    snap: "snap-retailers-circle",
    markets: "farmers-markets-circle",
    boundary: "dc-boundary-line"
  };
  const storyViews = {
    "access-points": {
      gaps: false,
      poverty: false,
      snap: true,
      markets: true,
      boundary: true
    },
    "poverty-context": {
      gaps: false,
      poverty: true,
      snap: false,
      markets: false,
      boundary: true
    },
    "access-need-overlap": {
      gaps: false,
      poverty: true,
      snap: true,
      markets: true,
      boundary: true
    },
    "candidate-access-gaps": {
      gaps: true,
      poverty: false,
      snap: true,
      markets: false,
      boundary: true
    }
  };

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const popupHtml = (properties) => {
    const title = escapeHtml(properties.name || "Food access location");
    const rows = popupFields
      .filter(([field]) => properties[field])
      .map(([field, label]) => `<p class="map-popup-row"><strong>${label}:</strong> ${escapeHtml(properties[field])}</p>`)
      .join("");

    return `<span class="map-popup-title">${title}</span>${rows}`;
  };

  const formatValue = (field, value) => {
    if (value === null || value === undefined || value === "") {
      return "Not available";
    }

    if (["poverty_percent", "pct_nh_black", "pct_hispanic_total"].includes(field)) {
      return `${Number(value).toFixed(1)}%`;
    }

    if (field === "below_poverty_count") {
      return Number(value).toLocaleString();
    }

    if (field === "snap_800m_count") {
      return Number(value).toLocaleString();
    }

    if (field === "nearest_snap_m") {
      return `${Number(value).toLocaleString()} m`;
    }

    return escapeHtml(value);
  };

  const demographicPopupHtml = (properties) => {
    const title = escapeHtml(properties.NAMELSAD || properties.tract_full_name || "Census tract");
    const rows = demographicPopupFields
      .map(([field, label]) => `<p class="map-popup-row"><strong>${label}:</strong> ${formatValue(field, properties[field])}</p>`)
      .join("");

    return `<span class="map-popup-title">${title}</span>${rows}`;
  };

  const gapPopupHtml = (properties) => {
    const title = escapeHtml(properties.NAMELSAD || properties.tract_full_name || "Census tract");
    const rows = gapPopupFields
      .map(([field, label]) => `<p class="map-popup-row"><strong>${label}:</strong> ${formatValue(field, properties[field])}</p>`)
      .join("");

    return `<span class="map-popup-title">${title}</span>${rows}`;
  };

  const bindPopup = (layerId) => {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", layerId, (event) => {
      const feature = event.features && event.features[0];

      if (!feature) {
        return;
      }

      new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(popupHtml(feature.properties || {}))
        .addTo(map);
    });
  };

  const bindDemographicPopup = (layerId) => {
    map.on("click", layerId, (event) => {
      const feature = event.features && event.features[0];

      if (!feature) {
        return;
      }

      new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(demographicPopupHtml(feature.properties || {}))
        .addTo(map);
    });
  };

  const bindGapPopup = (layerId) => {
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", layerId, (event) => {
      const feature = event.features && event.features[0];

      if (!feature) {
        return;
      }

      new maplibregl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(gapPopupHtml(feature.properties || {}))
        .addTo(map);
    });
  };

  const toggleFoodAccessLayer = (layerId, checked) => {
    layerId.split(",").forEach((id) => {
      const trimmedId = id.trim();

      if (!map.getLayer(trimmedId)) {
        return;
      }

      map.setLayoutProperty(trimmedId, "visibility", checked ? "visible" : "none");
    });
  };

  window.toggleFoodAccessLayer = toggleFoodAccessLayer;

  const setMatchingControls = (layerId, checked) => {
    document.querySelectorAll("[data-food-layer]").forEach((control) => {
      if (control.dataset.foodLayer === layerId) {
        control.checked = checked;
      }
    });
  };

  const setStoryButtonState = (activeView) => {
    document.querySelectorAll("[data-food-story-view]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.foodStoryView === activeView ? "true" : "false");
    });
  };

  const applyStoryView = (viewName) => {
    const view = storyViews[viewName];

    if (!view) {
      return;
    }

    Object.entries(view).forEach(([group, checked]) => {
      const layerId = layerGroups[group];
      toggleFoodAccessLayer(layerId, checked);
      setMatchingControls(layerId, checked);
    });

    setStoryButtonState(viewName);
  };

  const addFoodAccessLayers = () => {
    if (foodAccessLayersAdded || map.getSource("dc-boundary")) {
      return;
    }

    foodAccessLayersAdded = true;

    map.addSource("dc-boundary", {
      type: "geojson",
      data: `${dataPath}dc_boundary.geojson`
    });

    map.addSource("poverty-context", {
      type: "geojson",
      data: `${dataPath}demographic_context_tracts_dc.geojson`
    });

    map.addSource("candidate-access-gaps", {
      type: "geojson",
      data: `${dataPath}food_access_gap_tracts_dc.geojson`
    });

    map.addSource("snap-retailers", {
      type: "geojson",
      data: `${dataPath}snap_retailers_dc.geojson`
    });

    map.addSource("farmers-markets", {
      type: "geojson",
      data: `${dataPath}farmers_markets_dc.geojson`
    });

    map.addLayer({
      id: "poverty-context-fill",
      type: "fill",
      source: "poverty-context",
      layout: {
        visibility: "none"
      },
      paint: {
        "fill-color": [
          "interpolate",
          ["linear"],
          ["coalesce", ["to-number", ["get", "poverty_percent"]], 0],
          0,
          "#f7fbff",
          10,
          "#c6dbef",
          20,
          "#6baed6",
          30,
          "#2171b5",
          40,
          "#08306b"
        ],
        "fill-opacity": 0.25
      }
    });

    map.addLayer({
      id: "poverty-context-outline",
      type: "line",
      source: "poverty-context",
      layout: {
        visibility: "none"
      },
      paint: {
        "line-color": "#ffffff",
        "line-opacity": 0.35,
        "line-width": 0.6
      }
    });

    map.addLayer({
      id: "candidate-access-gaps-fill",
      type: "fill",
      source: "candidate-access-gaps",
      filter: [
        "in",
        ["get", "access_gap_category"],
        ["literal", [
          "High poverty + no SNAP within 800m",
          "High poverty + limited SNAP within 800m"
        ]]
      ],
      paint: {
        "fill-color": [
          "match",
          ["get", "access_gap_category"],
          "High poverty + no SNAP within 800m",
          "#b91c1c",
          "High poverty + limited SNAP within 800m",
          "#f97316",
          "rgba(148, 163, 184, 0)"
        ],
        "fill-opacity": 0.5
      }
    });

    map.addLayer({
      id: "candidate-access-gaps-outline",
      type: "line",
      source: "candidate-access-gaps",
      filter: [
        "in",
        ["get", "access_gap_category"],
        ["literal", [
          "High poverty + no SNAP within 800m",
          "High poverty + limited SNAP within 800m"
        ]]
      ],
      paint: {
        "line-color": [
          "match",
          ["get", "access_gap_category"],
          "High poverty + no SNAP within 800m",
          "#7f1d1d",
          "High poverty + limited SNAP within 800m",
          "#c2410c",
          "#64748b"
        ],
        "line-opacity": 0.9,
        "line-width": 1.2
      }
    });

    map.addLayer({
      id: "dc-boundary-line",
      type: "line",
      source: "dc-boundary",
      paint: {
        "line-width": 1.5,
        "line-color": "#4b5563",
        "line-opacity": 0.75
      }
    });

    map.addLayer({
      id: "snap-retailers-circle",
      type: "circle",
      source: "snap-retailers",
      paint: {
        "circle-radius": 4,
        "circle-color": "#2563eb",
        "circle-opacity": 0.75,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    });

    map.addLayer({
      id: "farmers-markets-circle",
      type: "circle",
      source: "farmers-markets",
      layout: {
        visibility: "none"
      },
      paint: {
        "circle-radius": 7,
        "circle-color": "#16a34a",
        "circle-opacity": 0.9,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    });

    bindPopup("snap-retailers-circle");
    bindPopup("farmers-markets-circle");
    bindDemographicPopup("poverty-context-fill");
    bindGapPopup("candidate-access-gaps-fill");

    document.querySelectorAll("[data-food-layer]").forEach((control) => {
      control.addEventListener("change", () => {
        toggleFoodAccessLayer(control.dataset.foodLayer, control.checked);
        setStoryButtonState("");
      });
    });

    document.querySelectorAll("[data-food-story-view]").forEach((button) => {
      button.addEventListener("click", () => {
        applyStoryView(button.dataset.foodStoryView);
      });
    });

    applyStoryView("candidate-access-gaps");

    console.info("[Food Access Map] Layers loaded.");
  };

  map.addControl(new maplibregl.NavigationControl(), "top-left");

  map.on("load", addFoodAccessLayers);

  map.on("error", (event) => {
    if (!foodAccessLayersAdded && !fallbackStyleApplied) {
      fallbackStyleApplied = true;
      console.warn("[Food Access Map] Positron basemap failed; switching to OpenFreeMap Liberty.", event.error || event);
      map.setStyle(libertyStyle);
      map.once("style.load", addFoodAccessLayers);
      return;
    }

    console.warn("[Food Access Map] MapLibre warning", event.error || event);
  });
})();
