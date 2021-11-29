import axios, { AxiosInstance } from 'axios';
import delay from 'delay';
import { config as makeEnvs } from 'dotenv';
import { writeFile } from 'fs/promises';
import PQueue from 'p-queue';
import { getModsData, getApiClient, getProgressBar } from '../utils';

const MODS_DATA_FILE_PATH = './data/mods_data.json';
const DELAY = 100;

const getModData = async (apiClient: AxiosInstance, modId: number, queue: PQueue, onDone) => {
  try {
    await delay(DELAY);

    const resposne = await apiClient.get(`/v1/mods/${modId}`);
    const data = resposne.data;

    onDone({ modId: modId, data });

    return data;
  } catch (err) {
    queue.add(async () => {
      await getModData(apiClient, modId, queue, onDone);
    });

    return;
  }
}

export const scrapModsData = async () => {
  makeEnvs();

  const data = await getModsData();
  const apiClient = getApiClient();
  const progress = getProgressBar();
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const modsData = {};

  progress.start(data.length, 0);
  data.forEach((mod) => {
    queue.add(async () => {
      await getModData(apiClient, mod.modId, queue, async (result) => {
        progress.increment();
        modsData[result.modId] = result.data;

        await writeFile(MODS_DATA_FILE_PATH, JSON.stringify(modsData), 'utf8')

        if (Object.keys(modsData).length === data.length) {
          return;
        }
      });
    });
  });

  queue.start();
};
