import { config as makeEnvs } from 'dotenv';
import PQueue from 'p-queue';
import download from 'download'
import { getProgressBar, getExtraModsData } from '../utils';

const GAME_VERSIONS = [
  '1.16',
  '1.16.1',
  '1.16.2',
  '1.16.3',
  '1.16.4',
  '1.16.5'
]

export const downloadMods = async () => {
  makeEnvs();

  const data = await getExtraModsData();
  const progress = getProgressBar();
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const files = Object.values(data).map((mod: { data: { displayName: string, latestFilesIndexes: any[] } }) => {
    const modData = mod.data;
    const latestFilesIndexes = modData.latestFilesIndexes;
    const versionFiles = latestFilesIndexes.find((file) => GAME_VERSIONS.includes(file.gameVersion))

    if (!versionFiles) {
      console.log('Not found for:');
      console.log(latestFilesIndexes);
    }

    return versionFiles;
  }).filter(file => !!file);

  const urls = files.map((file) => {
    const start = 'https://media.forgecdn.net/files/';
    const id = file.fileId.toString().slice(0, -3);
    const server = file.fileId.toString().slice(-3);

    if (server.startsWith('0')) {
      return `${start}${id}/${server.slice(1)}/${file.filename}`;
    } 

    return `${start}${id}/${server}/${file.filename}`;
  });

  console.log(`Got ${urls.length} urls...`);

  progress.start(urls.length, 0);
  urls.forEach((url) => {
    queue.add(async () => {
      console.log(`Downloading: ${url}`);
      await download(url, 'downloads');
      progress.increment();
    });
  });

  queue.start();
};
