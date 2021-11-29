import axios, { AxiosInstance } from 'axios';
import delay from 'delay';
import { config as makeEnvs } from 'dotenv';
import { writeFile } from 'fs/promises';
import PQueue from 'p-queue';
import { getModsData, getApiClient, getProgressBar } from '../utils';

const DOWNLOADS_FILE_PATH = './data/downloads.json';
const DELAY = 100;

const getModFiles = async (apiClient: AxiosInstance, modId: number, queue: PQueue, onDone) => {
  try {
    // const params = { gameVersionTypeId: 70886 };
    const params = { gameVersion: '1.16.5' };
    await delay(DELAY);

    const resposne = await apiClient.get(`/v1/mods/${modId}/files`, { params });
    const files = resposne.data;

    onDone({ modId: modId, files });

    return files;
  } catch (err) {
    queue.add(async () => {
      await getModFiles(apiClient, modId, queue, onDone);
    });

    return;
  }
}

export const scrapDownloadUrls = async () => {
  makeEnvs();

  const data = await getModsData();
  const apiClient = getApiClient();
  const progress = getProgressBar();
  const queue = new PQueue({ concurrency: 1, autoStart: false });
  const downloadUrls = {};

  progress.start(data.length, 0);
  data.forEach((mod) => {
    queue.add(async () => {
      await getModFiles(apiClient, mod.modId, queue, async (result) => {
        progress.increment();
        downloadUrls[result.modId] = result.files;

        await writeFile(DOWNLOADS_FILE_PATH, JSON.stringify(downloadUrls), 'utf8')

        if (Object.keys(downloadUrls).length === data.length) {
          return;
        }
      });
    });
  });

  queue.start();
};
