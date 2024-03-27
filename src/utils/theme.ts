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

export function setDarkMode(): void {
  var darkMode = fyo.config.get('darkMode');

  /* Fetching system theme */
  if (darkMode === undefined){
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    fyo.config.set('darkMode', darkMode);
  }
  if (darkMode) {
    document.documentElement.classList.add('dark');
    return;
  }
  document.documentElement.classList.remove('dark');
}
