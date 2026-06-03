(function initFoodAccessMap() {
  const mapElement = document.getElementById("food-access-map");
  const fallback = document.querySelector("[data-map-fallback]");

  if (!mapElement) {
    return;
  }

  if (typeof maplibregl === "undefined") {
    showFallback("MapLibre GL JS did not load. Check the CDN script connection.");
    return;
  }

  const dataPath = "/data/food-access-dc/";
  const popupFields = ["category", "snap_status", "address", "neighbourhood"];

  function showFallback(message) {
    console.warn(`[Food Access Map] ${message}`);
    if (fallback) {
      fallback.textContent = message;
      fallback.classList.add("is-visible");
    }
  }

  function popupHtml(properties) {
    const title = properties.name || "Food location";
    const rows = popupFields
      .filter((field) => properties[field])
      .map((field) => {
        const label = field.replace("_", " ");
        return `<p class="map-popup-row"><strong>${label}:</strong> ${properties[field]}</p>`;
      })
      .join("");

    return `<span class="map-popup-title">${title}</span>${rows}`;
  }

  function addPointPopup(map, layerId) {
    map.on("click", layerId, (event) => {
      const feature = event.features && event.features[0];

      if (!feature) {
        return;
      }

      new maplibregl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(popupHtml(feature.properties || {}))
        .addTo(map);
    });

    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  }

  async function fetchGeoJson(fileName, required) {
    const response = await fetch(`${dataPath}${fileName}`);

    if (!response.ok) {
      const message = `${fileName} returned ${response.status}`;
      if (required) {
        throw new Error(message);
      }
      console.info(`[Food Access Map] Optional layer skipped: ${message}`);
      return null;
    }

    return response.json();
  }

  const map = new maplibregl.Map({
    container: "food-access-map",
    style: "https://demotiles.maplibre.org/style.json",
    center: [-77.0369, 38.9072],
    zoom: 11
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

  map.on("load", async () => {
    try {
      const [snapData, nonSnapData, contextData] = await Promise.all([
        fetchGeoJson("snap_locations.geojson", true),
        fetchGeoJson("non_snap_locations.geojson", true),
        fetchGeoJson("demographic_context.geojson", false)
      ]);

      if (contextData) {
        map.addSource("demographic-context", { type: "geojson", data: contextData });
        map.addLayer({
          id: "demographic-context-fill",
          type: "fill",
          source: "demographic-context",
          paint: {
            "fill-color": "#3d6f91",
            "fill-opacity": 0.18
          }
        });
        map.addLayer({
          id: "demographic-context-outline",
          type: "line",
          source: "demographic-context",
          paint: {
            "line-color": "#3d6f91",
            "line-width": 1.5
          }
        });
      }

      map.addSource("snap-locations", { type: "geojson", data: snapData });
      map.addSource("non-snap-locations", { type: "geojson", data: nonSnapData });

      map.addLayer({
        id: "snap-locations-circle",
        type: "circle",
        source: "snap-locations",
        paint: {
          "circle-color": "#2f7f73",
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });

      map.addLayer({
        id: "non-snap-locations-circle",
        type: "circle",
        source: "non-snap-locations",
        paint: {
          "circle-color": "#d66f3f",
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2
        }
      });

      addPointPopup(map, "snap-locations-circle");
      addPointPopup(map, "non-snap-locations-circle");

      if (window.GISPortfolio && window.GISPortfolio.bindLayerControls) {
        window.GISPortfolio.bindLayerControls(map, [
          { inputId: "toggle-snap", layerIds: ["snap-locations-circle"] },
          { inputId: "toggle-non-snap", layerIds: ["non-snap-locations-circle"] },
          {
            inputId: "toggle-demographic",
            layerIds: ["demographic-context-fill", "demographic-context-outline"]
          }
        ]);
      }

      console.info("[Food Access Map] Placeholder GeoJSON layers loaded.");
    } catch (error) {
      showFallback(`Food Access map data could not be loaded: ${error.message}`);
    }
  });

  map.on("error", (event) => {
    console.warn("[Food Access Map] MapLibre warning", event.error || event);
  });
})();
