import electron, { app } from 'electron';

export function getMainWindowSize() {
  let height;
  if (app.isReady()) {
    const screen = electron.screen;
    height = screen.getPrimaryDisplay().workAreaSize.height;
    height = height > 907 ? 907 : height;
  } else {
    height = 907;
  }
  const width = Math.ceil(1.323 * height);
  return { height, width };
}
