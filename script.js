const AUDIENCE_STORAGE_KEY = "bluehopAudience";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let revealObserver = null;

function showReveals(scope = document) {
  scope.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
}

function observeReveals(scope = document) {
  const nodes = scope.querySelectorAll(".reveal:not(.is-visible)");

  if (!nodes.length) {
    return;
  }

  if (!revealObserver) {
    showReveals(scope);
    return;
  }

  nodes.forEach((node) => revealObserver.observe(node));
}

if ("IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  observeReveals();
} else {
  showReveals();
}

const audienceControls = Array.from(document.querySelectorAll("[data-audience-control]"));
const audiencePages = Array.from(document.querySelectorAll("[data-audience-page]"));
const audienceLinks = Array.from(document.querySelectorAll("[data-link-business][data-link-startup]"));

function getStoredAudience() {
  try {
    return localStorage.getItem(AUDIENCE_STORAGE_KEY) === "startup" ? "startup" : "business";
  } catch (error) {
    return "business";
  }
}

function saveAudience(audience) {
  try {
    localStorage.setItem(AUDIENCE_STORAGE_KEY, audience);
  } catch (error) {
    // Ignore storage failures and keep the current session usable.
  }
}

function getLinkTarget(node, audience) {
  return audience === "startup" ? node.dataset.linkStartup : node.dataset.linkBusiness;
}

function applyAudience(audience, options = {}) {
  const nextAudience = audience === "startup" ? "startup" : "business";
  const activePage = audiencePages.find((page) => page.dataset.audiencePage === nextAudience);

  document.documentElement.dataset.audience = nextAudience;

  audienceControls.forEach((control) => {
    const isActive = control.dataset.audienceControl === nextAudience;
    control.classList.toggle("is-active", isActive);
    control.setAttribute("aria-pressed", String(isActive));
  });

  audiencePages.forEach((page) => {
    const isActive = page.dataset.audiencePage === nextAudience;
    page.hidden = !isActive;
    page.setAttribute("aria-hidden", String(!isActive));

    if ("inert" in page) {
      page.inert = !isActive;
    }
  });

  audienceLinks.forEach((link) => {
    const target = getLinkTarget(link, nextAudience);

    if (target) {
      link.setAttribute("href", target);
    }
  });

  observeReveals(activePage || document);

  if (options.persist) {
    saveAudience(nextAudience);
  }

  if (options.scroll && activePage) {
    const startTarget = activePage.querySelector("[data-page-start]");

    window.requestAnimationFrame(() => {
      startTarget?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }
}

applyAudience(getStoredAudience());

audienceControls.forEach((control) => {
  control.addEventListener("click", () => {
    applyAudience(control.dataset.audienceControl, {
      persist: true,
      scroll: true,
    });
  });
});
