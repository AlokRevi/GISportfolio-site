window.GISPortfolio = window.GISPortfolio || {};

window.GISPortfolio.bindLayerControls = function bindLayerControls(map, controls) {
  controls.forEach(({ inputId, layerIds }) => {
    const input = document.getElementById(inputId);

    if (!input) {
      console.warn(`Layer control not found: ${inputId}`);
      return;
    }

    input.addEventListener("change", () => {
      layerIds.forEach((layerId) => {
        if (!map.getLayer(layerId)) {
          return;
        }

        map.setLayoutProperty(layerId, "visibility", input.checked ? "visible" : "none");
      });
    });
  });
};
