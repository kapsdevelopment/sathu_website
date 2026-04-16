const STORAGE_KEY = "sathu_website_lang";

function getPreferredLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "th") return urlLang;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "th") return stored;

  return navigator.language.toLowerCase().startsWith("th") ? "th" : "en";
}

async function loadStrings(lang) {
  const response = await fetch(`./strings/${lang}.json`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load strings for ${lang}`);
  }

  return response.json();
}

function getByPath(object, path) {
  return path.split(".").reduce((value, key) => (value ? value[key] : undefined), object);
}

function applyTextStrings(strings) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = getByPath(strings, key);

    if (typeof value === "string") {
      element.textContent = value;
    }
  });
}

function applyAttributeStrings(strings) {
  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    const raw = element.getAttribute("data-i18n-attr");
    if (!raw) return;

    raw.split(";").forEach((mapping) => {
      const trimmed = mapping.trim();
      if (!trimmed) return;

      const [attribute, key] = trimmed.split(":");
      const value = getByPath(strings, key);

      if (attribute && typeof value === "string") {
        element.setAttribute(attribute.trim(), value);
      }
    });
  });
}

function applySeo(strings) {
  if (strings?.seo?.title) {
    document.title = strings.seo.title;
  }

  const description = document.querySelector('meta[name="description"]');
  if (description && strings?.seo?.description) {
    description.setAttribute("content", strings.seo.description);
  }
}

function setActiveLanguageButton(lang) {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
    button.setAttribute("aria-pressed", button.dataset.lang === lang ? "true" : "false");
  });
}

function updateUrl(lang) {
  if (window.location.protocol === "file:") return;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  window.history.replaceState({}, "", url);
}

async function setLanguage(lang) {
  const strings = await loadStrings(lang);

  document.documentElement.lang = lang;
  document.documentElement.setAttribute("data-lang", lang);

  applyTextStrings(strings);
  applyAttributeStrings(strings);
  applySeo(strings);
  setActiveLanguageButton(lang);

  localStorage.setItem(STORAGE_KEY, lang);
  updateUrl(lang);
}

function setupLanguageSwitcher() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".lang-btn");
    if (!button) return;

    const lang = button.dataset.lang;
    if (!lang) return;

    setLanguage(lang).catch((error) => {
      console.error(error);
    });
  });
}

function setupRevealAnimations() {
  const revealTargets = document.querySelectorAll(".reveal");
  if (!revealTargets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  revealTargets.forEach((element) => observer.observe(element));
}

document.addEventListener("DOMContentLoaded", async () => {
  setupLanguageSwitcher();
  setupRevealAnimations();

  const preferredLanguage = getPreferredLanguage();

  try {
    await setLanguage(preferredLanguage);
  } catch (error) {
    console.error(error);
    await setLanguage("en");
  }
});
