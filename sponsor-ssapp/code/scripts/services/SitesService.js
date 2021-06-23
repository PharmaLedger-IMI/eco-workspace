import getSharedStorage from './SharedDBStorageService.js';
import DSUService from './DSUService.js';
import { siteStagesEnum, siteStatusesEnum } from '../constants/site.js';

export default class SitesService extends DSUService {
  SITES_TABLE = 'sites';

  constructor(DSUStorage) {
    super(DSUStorage, '/sites');
    this.DSUStorage = DSUStorage;
    this.storageService = getSharedStorage(DSUStorage);
  }

  async getSites(trialKeySSI) {
    console.log(trialKeySSI);
    const result = await this.storageService.filter(this.getTableName(trialKeySSI));
    console.log('RESULT:', result);
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  async getSite(id, trialKeySSI) {
    const result = await this.storageService.filter(this.getTableName(trialKeySSI), id);
    return result;
  }

  async createSite(data, trialKeySSI) {
    const site = await this.addSiteToDB(
      {
        ...data,
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
        created: new Date().toISOString(),
      },
      trialKeySSI
    );
    return site;
  }

  async deleteSite(id, trialKeySSI) {
    const selectedSite = await this.storageService.getRecord(this.getTableName(trialKeySSI), id);

    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), selectedSite.id, {
      ...selectedSite,
      deleted: true,
    });
  }

  async addSiteToDB(data, trialKeySSI) {
    const newRecord = await this.storageService.insertRecord(this.getTableName(trialKeySSI), data.id, data);
    return newRecord;
  }

  getTableName(trialKeySSI) {
    return this.SITES_TABLE + '_' + trialKeySSI;
  }
}
