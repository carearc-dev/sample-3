(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ready = () => document.documentElement.classList.add("is-loaded");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }

  const revealItems = document.querySelectorAll(".reveal");
  const counters = document.querySelectorAll("[data-count]");
  const header = document.querySelector("[data-header]");
  const themedSections = document.querySelectorAll("[data-header-theme]");
  const messageSection = document.querySelector(".message");
  const parallaxSections = document.querySelectorAll("[data-parallax-section]");
  const cultureSignaturePath = document.querySelector(".culture__signature-path");
  const sheenTitles = document.querySelectorAll("main h2, .gradient-title");
  let ticking = false;

  const setHeaderTheme = (theme) => {
    if (!header) return;
    header.classList.toggle("is-dark", theme === "dark");
    header.classList.toggle("is-accent", theme === "accent");
  };

  const updateHeaderTheme = () => {
    if (!header || !themedSections.length) return;
    const probeY = Math.min(window.innerHeight - 1, header.offsetHeight + 8);
    const active = [...themedSections].find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= probeY && rect.bottom > probeY;
    });
    setHeaderTheme(active?.dataset.headerTheme || "light");
  };

  const updateMessageLift = () => {
    if (!messageSection) return;
    const rect = messageSection.getBoundingClientRect();
    const start = window.innerHeight * 0.92;
    const end = window.innerHeight * 0.18;
    const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
    const maxOverlap = Math.min(132, window.innerHeight * 0.16);
    const overlap = -progress * maxOverlap;
    messageSection.style.setProperty("--message-overlap", `${overlap.toFixed(2)}px`);
  };

  const updateSectionParallax = () => {
    if (!parallaxSections.length) return;
    if (reduceMotion) {
      parallaxSections.forEach((section) => {
        section.style.setProperty("--parallax-y", "0px");
      });
      return;
    }
    parallaxSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const start = window.innerHeight * 1.05;
      const end = window.innerHeight * -0.15;
      const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
      const amount = section.classList.contains("entry") ? 92 : 76;
      const shift = section.classList.contains("entry") && rect.bottom <= window.innerHeight
        ? 0
        : Math.sin(progress * Math.PI) * -amount;
      section.style.setProperty("--parallax-y", `${shift.toFixed(2)}px`);
    });
  };

  const updateScrollEffects = () => {
    updateHeaderTheme();
    updateMessageLift();
    updateSectionParallax();
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateScrollEffects);
  };

  updateScrollEffects();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", updateScrollEffects);

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.count;
    });
    if (cultureSignaturePath) {
      cultureSignaturePath.style.strokeDasharray = "none";
      cultureSignaturePath.style.strokeDashoffset = "0";
    }
    sheenTitles.forEach((title) => title.classList.remove("title-sheen-active"));
    parallaxSections.forEach((section) => {
      section.style.setProperty("--parallax-y", "0px");
    });
    return;
  }

  const registerScrollTrigger = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    window.gsap.registerPlugin(window.ScrollTrigger);
    return true;
  };

  const setupCultureSignature = () => {
    if (!cultureSignaturePath || !registerScrollTrigger()) return;
    const length = cultureSignaturePath.getTotalLength();
    window.gsap.set(cultureSignaturePath, {
      strokeDasharray: length,
      strokeDashoffset: length
    });
    window.gsap.to(cultureSignaturePath, {
      strokeDashoffset: 0,
      ease: "power2.in",
      scrollTrigger: {
        trigger: ".culture",
        start: "top 90%",
        end: "top 4%",
        scrub: 1.35
      }
    });
  };

  const setupTitleSheen = () => {
    if (!sheenTitles.length || !registerScrollTrigger()) {
      const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("title-sheen-active", entry.isIntersecting);
        });
      }, { threshold: 0.35 });
      sheenTitles.forEach((title) => titleObserver.observe(title));
      return;
    }
    const playSheen = (title) => {
      window.gsap.killTweensOf(title);
      window.gsap.fromTo(title,
        { backgroundPosition: "100% 50%" },
        {
          backgroundPosition: "0% 50%",
          duration: 1.35,
          ease: "power3.out",
          overwrite: true
        }
      );
    };
    sheenTitles.forEach((title) => {
      window.gsap.set(title, { backgroundPosition: "100% 50%" });
      window.ScrollTrigger.create({
        trigger: title,
        start: "top 84%",
        onEnter: () => playSheen(title),
        onEnterBack: () => playSheen(title)
      });
    });
  };

  window.addEventListener("load", () => {
    setupCultureSignature();
    setupTitleSheen();
  }, { once: true });

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const countUp = (node) => {
    if (node.dataset.done) return;
    node.dataset.done = "true";
    const target = Number(node.dataset.count || 0);
    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      node.textContent = Math.round(target * easeOut(progress)).toLocaleString("ja-JP");
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        entry.target.querySelectorAll("[data-count]").forEach(countUp);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item) => observer.observe(item));

  const peopleRail = document.querySelector("[data-people-rail]");
  if (peopleRail && window.matchMedia("(min-width: 1201px)").matches) {
    peopleRail.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      peopleRail.scrollLeft += event.deltaY * 0.8;
    }, { passive: true });
  }
})();
