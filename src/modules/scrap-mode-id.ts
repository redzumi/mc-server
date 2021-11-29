import delay from 'delay';
import { config as makeEnvs } from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import PQueue from 'p-queue';
import axios, { AxiosInstance } from 'axios';
import cliProgress from 'cli-progress';

const DATA_FILE_PATH = './data/mods.json';
const MODS_FILE_PATH = './data/links.txt';
const DELAY = 100;
const PAGE_SIZE = 20;

const PROGRESS = new cliProgress.SingleBar({
  format: 'Scrap id: ' + ('{bar}') + '| {percentage}% || {value}/{total} mods',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});


const getModId = async (apiClient: AxiosInstance, link: string, index: number, queue: PQueue, onDone) => {
  try {
    const modName = link
      .replace('https://www.curseforge.com/minecraft/mc-mods/', '')
      .replace(/-+/gm, ' ')

    const modWords = modName.split(' ')
    modWords[0].replace('s', '');

    const params = {
      gameId: 432,
      classId: 6,
      sortField: 'TotalDownloads',
      sortOrder: 'desc',
      searchFilter: modWords.join(' '),
      index
    };

    console.log(params);

    await delay(DELAY);
    const response = await apiClient.get('/v1/mods/search', { params });
    const currentMod = response.data.data.find(mod => mod?.links?.websiteUrl === link);

    console.log(currentMod);

    const modId = currentMod?.id;

    if (response.data && !modId) {
      queue.add(async () => {
        await getModId(apiClient, link, index + PAGE_SIZE, queue, onDone)
      });

      return { link, modId };
    }

    PROGRESS.increment();
    onDone({ link, modId });

    return { link, modId };
  } catch (err) {
    console.log(err.message);

    queue.add(async () => {
      await getModId(apiClient, link, index, queue, onDone)
    });

    return { error: true }
  }
}

// TODO: links from file
export const scrapModeIds = async () => {
  makeEnvs();

  const dataFile = await readFile(DATA_FILE_PATH, 'utf8');
  const rawData = JSON.parse(dataFile) || {};
  const data = rawData.filter(link => !!link.modId);

  const baseURL = 'https://api.curseforge.com/';
  const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.API_KEY };
  const apiClient = axios.create({ baseURL, headers });
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const mods = await readFile(MODS_FILE_PATH, 'utf8');

  const rawLinks = mods.split('\n');
  const links = rawLinks
    .filter(link => {
      const mod = data.find(data => data.link === link);
      return !mod || !mod.modId;
    });

  if (links.length === 0) {
    return;
  }

  PROGRESS.start(links.length, 0);
  links.forEach(link => {
    queue.add(async () => {
      await getModId(apiClient, link, 0, queue, async (result) => {
        if (result.modId) {
          data.push(result);
          writeFile(DATA_FILE_PATH, JSON.stringify(data), 'utf8')

          if (links.length === data.length) {
            return;
          }
        }
      });
    });
  });

  queue.start();
};
