import Bree from 'bree';
import path from 'path';
import main from 'main';

let bree: Bree;

export async function initScheduler(interval: string) {
  const jobsRoot = path.join(__dirname, '..', '..', 'jobs');

  if (bree) {
    await bree.stop();
  }

  bree = new Bree({
    root: jobsRoot,
    defaultExtension: 'ts',
    jobs: [
      {
        name: 'triggerErpNextSync',
        interval: interval,
        worker: {
          workerData: {
            useTsNode: true,
          },
        },
      },
    ],
    worker: {
      argv: ['--require', 'ts-node/register'],
    },
  });

  bree.on('worker created', () => {
    main.mainWindow?.webContents.send('trigger-erpnext-sync');
  });

  await bree.start();
}
