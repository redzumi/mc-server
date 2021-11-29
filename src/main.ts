import { config as makeEnvs } from 'dotenv';
import PQueue from 'p-queue';
import download from 'download'
import { getProgressBar, getDownloadsModData } from './utils';

const main = async () => {
  makeEnvs();

  const data = await getDownloadsModData();
  const progress = getProgressBar();
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const files = Object.values(data).map((files) => files[0]?.downloadUrl);

  progress.start(files.length, 0);
  files.forEach((url) => {
    queue.add(async () => {
      console.log(`Downloading: ${url}`);
      await download(url, 'downloads');
      progress.increment();
    });
  });

  queue.start();
  queue.on('completed', () => {
    process.exit();
  });
};

main();