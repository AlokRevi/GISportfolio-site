document.addEventListener("DOMContentLoaded", () => {
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
});
