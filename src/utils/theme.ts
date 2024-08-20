export function setDarkMode(darkMode: boolean): void {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    return;
  }
  document.documentElement.classList.remove('dark');
}
