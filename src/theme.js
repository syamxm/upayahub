const storageKey = "upayahub-theme"
export const themeOptions = ["system", "light", "dark"]

export function readPreference() {
  const saved = localStorage.getItem(storageKey)
  return themeOptions.includes(saved) ? saved : "system"
}

export function resolveTheme(preference) {
  if (preference !== "system") return preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyTheme(preference) {
  document.documentElement.dataset.theme = resolveTheme(preference)
}

export function savePreference(preference) {
  localStorage.setItem(storageKey, preference)
  applyTheme(preference)
}

export function watchSystemTheme(onChange) {
  const query = window.matchMedia("(prefers-color-scheme: dark)")
  const handle = () => {
    if (readPreference() === "system") onChange()
  }
  query.addEventListener("change", handle)
  return () => query.removeEventListener("change", handle)
}
