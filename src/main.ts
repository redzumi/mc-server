import { config as makeEnvs } from 'dotenv';
import { getModsData, getApiClient, getProgressBar } from './utils';

const main = async () => {
  makeEnvs();

  const data = await getModsData();
  const apiClient = getApiClient();
  const progress = getProgressBar();

  console.log(data);
};

main();