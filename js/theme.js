const THEMES = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "skeuo", label: "Skeuomorphic" },
];

const STORAGE_KEY = "acc-theme";

export function getTheme() {
  return document.documentElement.dataset.theme || "instagram";
}

export function setTheme(themeId) {
  const theme = THEMES.some((t) => t.id === themeId) ? themeId : "instagram";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);

  const url = new URL(window.location.href);
  url.searchParams.set("theme", theme);
  history.replaceState(null, "", url);

  document.querySelectorAll("[data-theme-option]").forEach((btn) => {
    const active = btn.dataset.themeOption === theme;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

export function initThemeSwitcher(mountEl) {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("theme");
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  const initial = fromUrl || fromStorage || "instagram";

  mountEl.innerHTML = `
    <div class="theme-switcher" role="group" aria-label="Demo look and feel">
      <p class="theme-switcher-label">Look</p>
      ${THEMES.map(
        (theme) => `
        <button
          type="button"
          class="theme-option"
          data-theme-option="${theme.id}"
          aria-pressed="false"
        >${theme.label}</button>`
      ).join("")}
    </div>
  `;

  mountEl.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-theme-option]");
    if (!btn) return;
    setTheme(btn.dataset.themeOption);
  });

  setTheme(initial);
}

export { THEMES };
