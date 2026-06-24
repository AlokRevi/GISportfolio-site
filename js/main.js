document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation is shared by all static pages.
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-site-nav]");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const mapControlsToggle = document.querySelector("[data-map-controls-toggle]");
  const mapCard = document.querySelector(".food-access-map-card");

  // Let map readers focus on the map by hiding the floating layer and legend panels.
  if (mapControlsToggle && mapCard) {
    mapControlsToggle.addEventListener("click", () => {
      const isCollapsed = mapCard.classList.toggle("controls-collapsed");
      mapControlsToggle.setAttribute("aria-expanded", String(!isCollapsed));
      mapControlsToggle.textContent = isCollapsed ? "Show Layers and Legend" : "Hide Layers and Legend";
    });
  }

  // Static map comparisons use a range input for keyboard access and pointer dragging for mouse/touch.
  document.querySelectorAll("[data-comparison-slider]").forEach((slider) => {
    const range = slider.querySelector(".comparison-range");
    const frame = slider.querySelector(".comparison-slider-frame");

    if (!(range instanceof HTMLInputElement)) {
      return;
    }

    const updateComparison = () => {
      slider.style.setProperty("--position", `${range.value}%`);
    };

    range.addEventListener("input", updateComparison);

    if (frame instanceof HTMLElement) {
      const updateFromPointer = (event) => {
        const rect = frame.getBoundingClientRect();
        const nextValue = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        range.value = String(Math.round(nextValue));
        updateComparison();
      };

      frame.addEventListener("pointerdown", (event) => {
        frame.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      });

      frame.addEventListener("pointermove", (event) => {
        if (frame.hasPointerCapture(event.pointerId)) {
          updateFromPointer(event);
        }
      });
    }

    updateComparison();
  });

  // Older project pages still use this simple image carousel.
  document.querySelectorAll(".image-slider").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".slider-slide"));
    const dots = Array.from(slider.querySelectorAll("[data-slider-dot]"));
    const previousButton = slider.querySelector("[data-slider-prev]");
    const nextButton = slider.querySelector("[data-slider-next]");
    let activeIndex = slides.findIndex((slide) => slide.getAttribute("aria-hidden") === "false");
    let touchStartX = 0;

    if (!slides.length) {
      return;
    }

    if (activeIndex < 0) {
      activeIndex = 0;
    }

    const showSlide = (nextIndex) => {
      activeIndex = (nextIndex + slides.length) % slides.length;

      slides.forEach((slide, index) => {
        slide.setAttribute("aria-hidden", String(index !== activeIndex));
      });

      dots.forEach((dot, index) => {
        dot.setAttribute("aria-current", String(index === activeIndex));
      });
    };

    previousButton?.addEventListener("click", () => showSlide(activeIndex - 1));
    nextButton?.addEventListener("click", () => showSlide(activeIndex + 1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showSlide(index));
    });

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1);
      }
    });

    slider.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    slider.addEventListener("touchend", (event) => {
      const deltaX = event.changedTouches[0].screenX - touchStartX;

      if (Math.abs(deltaX) < 40) {
        return;
      }

      showSlide(deltaX > 0 ? activeIndex - 1 : activeIndex + 1);
    }, { passive: true });

    showSlide(activeIndex);
  });

  // The left-side GIS page guide works as normal anchor links without JavaScript.
  const sectionNavLinks = Array.from(document.querySelectorAll("[data-section-nav-link]"));

  if (sectionNavLinks.length && "IntersectionObserver" in window) {
    const sectionMap = new Map();

    sectionNavLinks.forEach((link) => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      const target = targetId ? document.getElementById(targetId) : null;

      if (target) {
        sectionMap.set(targetId, { link, target });
      }
    });

    const setActiveSection = (sectionId) => {
      sectionNavLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.sectionNavLink === sectionId);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveSection(visibleEntry.target.id);
      }
    }, {
      rootMargin: "-35% 0px -50% 0px",
      threshold: [0.1, 0.35, 0.6]
    });

    sectionMap.forEach(({ target }) => observer.observe(target));
  }
});
