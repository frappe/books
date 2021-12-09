import fs from 'fs';
import { shell } from 'electron';

export default async function makeJSON(data, savePath) {
  fs.writeFile(savePath, data, (error) => {
    if (error) throw error;
    return shell.openPath(savePath);
  });
}
