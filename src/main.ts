import { downloadMods } from './modules/download-mods';
// import { scrapModsData } from './modules/scrap-mods-data';

const main = async () => {
  // await scrapModsData();
  await downloadMods();
};

main();