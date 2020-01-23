import electron from 'electron';

export function getMainWindowSize() {
  let screen = electron.screen || electron.remote.screen;
  let { height } = screen.getPrimaryDisplay().workAreaSize;
  let width;

  if (height > 907) {
    height = 907;
  }
  width = Math.ceil(1.323 * height);

  return { width, height };
}
