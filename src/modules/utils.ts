export const getModeNameByLink = (link: string) => {
  const modName = link
    .replace('https://www.curseforge.com/minecraft/mc-mods/', '')
    .replace(/-+/gm, ' ')

  const modWords = modName.split(' ')
  modWords[0].replace('s', '');

  return modWords.join(' ');
};

export const getRequestParams = (link: string, index: number) => {
  const params = {
    gameId: 432,
    classId: 6,
    sortField: 'TotalDownloads',
    sortOrder: 'desc',
    searchFilter: getModeNameByLink(link),
    index
  };

  return params;
}