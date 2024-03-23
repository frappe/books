import { fyo } from 'src/initFyo';

export async function toggleDarkMode(): Promise<void> {
  const darkMode = fyo.config.get('darkMode');
  if (darkMode) {
    document.documentElement.classList.remove('dark');
    fyo.config.set('darkMode', false);
    return;
  }
  document.documentElement.classList.add('dark');
  fyo.config.set('darkMode', true);
}

export function setDarkMode(darkMode: boolean): void {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    return;
  }
  document.documentElement.classList.remove('dark');
}
