const THEMES = ["theme-kelp-light", "theme-kelp-dark", "theme-tidepool", "theme-sunlit", "theme-nightwatch"];
const THEME_LABELS = {
  "theme-kelp-light": "Kelp light",
  "theme-kelp-dark": "Kelp dark",
  "theme-tidepool": "Tidepool",
  "theme-sunlit": "Sunlit reef",
  "theme-nightwatch": "Nightwatch",
};
const STORAGE_KEY = "wobpager-sea-palette";

function savedTheme() {
  try {
    const theme = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(theme) ? theme : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, control) {
  const root = document.documentElement;
  root.classList.remove(...THEMES);
  root.classList.add(theme);
  control.querySelectorAll("[data-theme]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  });
  control.querySelector("[data-theme-label]")?.replaceChildren(THEME_LABELS[theme]);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Storage may be unavailable. */ }
  document.dispatchEvent(new Event("kelp-theme-change"));
}

document.querySelectorAll("[data-palette-switcher]").forEach((control) => {
  const initial = savedTheme() ?? THEMES.find((theme) => document.documentElement.classList.contains(theme)) ?? "theme-kelp-light";
  applyTheme(initial, control);
  control.querySelectorAll("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme, control);
      control.removeAttribute("open");
    });
  });
});
