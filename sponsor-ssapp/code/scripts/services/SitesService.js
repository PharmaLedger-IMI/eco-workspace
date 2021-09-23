import getSharedStorage from './SharedDBStorageService.js';
const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;
import { siteStagesEnum, siteStatusesEnum } from '../constants/site.js';

export default class SitesService extends DSUService {
  SITES_TABLE = 'sites';
  SITES_PATH = '/sites';

  constructor(DSUStorage) {
    super('/sites');
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
    const status = await this.saveEntityAsync(
      {
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
      },
      this.getStatusPath(site.uid)
    );

    const site = await this.saveEntityAsync({
      ...data,
      statusKeySSI: status.uid,
      created: new Date().toISOString(),
      trialKeySSI,
    });

    await this.addSiteToDB(
      {
        ...data,
        keySSI: site.uid,
        statusKeySSI: status.uid,
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

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    const updatedStatusDSU = await this.updateEntityAsync({ ...statusDSU, status }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async updateSiteStage(trialKeySSI, siteKeySSI, stage) {
    const siteDSU = await this.getSite(siteKeySSI);
    const site = await this.getSiteFromDB(siteDSU.id, trialKeySSI);
    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), site.id, {
      ...site,
      stage,
    });

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    const updatedStatusDSU = await this.updateEntityAsync({ ...statusDSU, stage }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async changeSiteStage(stage, id, trialKeySSI) {
    const site = await this.getSiteFromDB(id, trialKeySSI);
    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), site.id, {
      ...site,
      stage,
    });

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    const updatedStatusDSU = await this.updateEntityAsync({ ...statusDSU, stage }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async updateSiteConsents(data, id, trialKeySSI) {
    const site = await this.getSiteFromDB(id, trialKeySSI);
    const existingConsent = site.consents.find((x) => x.id === data.id);
    if (existingConsent) {
      existingConsent.versions = data.versions;
      existingConsent.visits = data.visits || [];
    } else {
      site.consents = [...site.consents, data];
    }
    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), site.id, {
      ...site,
    });

    const siteDSU = await this.getEntityAsync(site.keySSI);
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, consents: site.consents });
    return updatedSiteDSU;
  }

  async deleteSite(id, trialKeySSI) {
    const selectedSite = await this.storageService.getRecord(this.getTableName(trialKeySSI), id);

    const updatedSite = await this.storageService.updateRecord(this.getTableName(trialKeySSI), selectedSite.id, {
      ...selectedSite,
      deleted: true,
    });

    return;
  }

  async addSiteToDB(data, trialKeySSI) {
    const newRecord = await this.storageService.insertRecord(this.getTableName(trialKeySSI), data.id, data);
    return newRecord;
  }

  getTableName(trialKeySSI) {
    return this.SITES_TABLE + '_' + trialKeySSI;
  }

  getStatusPath(siteKeySSI) {
    return this.SITES_PATH + '/' + siteKeySSI + '/' + 'status';
  }
}
