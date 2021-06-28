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
    const result = await this.storageService.filter(this.getTableName(trialKeySSI));
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  async getSite(keySSI) {
    const result = await this.getEntityAsync(keySSI);
    return result;
  }

  async getSiteFromDB(id, trialKeySSI) {
    const result = await this.storageService.getRecord(this.getTableName(trialKeySSI), id);
    return result;
  }

  async createSite(data, trialKeySSI) {
    debugger;
    const site = await this.saveEntityAsync({
      ...data,
      stage: siteStagesEnum.Created,
      status: siteStatusesEnum.Active,
      created: new Date().toISOString(),
      trialKeySSI,
    });

    await this.addSiteToDB(
      {
        ...data,
        keySSI: site.uid,
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
        created: new Date().toISOString(),
      },
      trialKeySSI
    );
    return site;
  }

  async changeSiteStatus(status, id, trialKeySSI) {
    const site = await this.getSiteFromDB(id, trialKeySSI);
    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), site.id, {
      ...site,
      status,
    });

    const siteDSU = await this.getEntityAsync(site.keySSI);
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, status });

    return updatedSite;
  }

  async changeSiteStage(stage, id) {
    const site = await this.getSiteFromDB(id, trialKeySSI);
    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), site.id, {
      ...site,
      stage,
    });

    const siteDSU = await this.getEntityAsync(site.keySSI);
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, stage });

    return updatedSite;
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
