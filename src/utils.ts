import { readFile } from 'fs/promises';
import axios from 'axios';
import cliProgress from 'cli-progress';

const DATA_FILE_PATH = './data/mods.json';

export const getModsData = async () => {
  const dataFile = await readFile(DATA_FILE_PATH, 'utf8');
  const rawData = JSON.parse(dataFile) || {};
  const data = rawData.filter(link => !!link.modId);

  return data;
};

export const getApiClient = () => {
  const baseURL = 'https://api.curseforge.com/';
  const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.API_KEY };
  const apiClient = axios.create({ baseURL, headers });

  return apiClient;
};

export const getProgressBar = () => {
  const bar = new cliProgress.SingleBar({
    format: 'Scrap id: ' + ('{bar}') + '| {percentage}% || {value}/{total} mods',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  return bar;
};