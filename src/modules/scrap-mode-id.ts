import delay from 'delay';
import { config as makeEnvs } from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import PQueue from 'p-queue';
import { AxiosInstance } from 'axios';

import { getModsData, getApiClient, getProgressBar } from '../utils';
import { getRequestParams } from './utils';

const DATA_FILE_PATH = './data/mods.json';
const MODS_FILE_PATH = './data/links.txt';
const DELAY = 100;
const PAGE_SIZE = 20;

const getModId = async (apiClient: AxiosInstance, link: string, index: number, queue: PQueue, onDone) => {
  try {
    const params = getRequestParams(link, index);
    await delay(DELAY);

    const response = await apiClient.get('/v1/mods/search', { params });
    const currentMod = response.data.data.find(mod => mod?.links?.websiteUrl === link);
    const modId = currentMod?.id;

    if (response.data && !modId) {
      queue.add(async () => {
        await getModId(apiClient, link, index + PAGE_SIZE, queue, onDone)
      });

      return { link, modId };
    }

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

  const data = await getModsData();
  const apiClient = getApiClient();
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const mods = await readFile(MODS_FILE_PATH, 'utf8');
  const progress = getProgressBar();

  const rawLinks = mods.split('\n');
  const links = rawLinks
    .filter(link => {
      const mod = data.find(data => data.link === link);
      return !mod || !mod.modId;
    });

  if (links.length === 0) {
    return;
  }

  progress.start(links.length, 0);
  links.forEach(link => {
    queue.add(async () => {
      await getModId(apiClient, link, 0, queue, async (result) => {
        if (result.modId) {
          progress.increment();

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
