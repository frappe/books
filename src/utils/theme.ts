export function setDarkMode(darkMode: boolean): void {
  if (darkMode) {
    document.documentElement.classList.add(
      'dark',
      'custom-scroll',
      'custom-scroll-thumb1'
    );
    return;
  }
  document.documentElement.classList.remove('dark');
}
