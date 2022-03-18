// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import { siteStagesEnum, siteStatusesEnum } from '../constants/site.js';
import VisitsService from './VisitsService.js';
import TrialsService from './TrialsService.js';
export default class SitesService extends DSUService {
  SITES_TABLE = 'sites';
  SITES_PATH = '/sites';

  constructor(DSUStorage) {
    super('/sites');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.visitsService = new VisitsService(DSUStorage);
    this.trialsService = new TrialsService(DSUStorage);
  }

  async getSites(trialKeySSI) {
    const result = await this.storageService.filterAsync(this.getTableName(trialKeySSI));
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  async getSite(keySSI) {
    const result = await this.getEntityAsync(keySSI);
    return result;
  }

  async getSiteFromDB(did, trialKeySSI) {
    const result = await this.storageService.getRecordAsync(this.getTableName(trialKeySSI), did);
    return result;
  }

  async createSite(data, trialKeySSI) {
    const trial = await this.trialsService.getTrial(trialKeySSI);
    const visits = await this.visitsService.getTrialVisits(trialKeySSI);

    const status = await this.saveEntityAsync(
      {
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
      },
      '/statuses'
    );

    debugger;

    const site = await this.saveEntityAsync({
      ...data,
      statusKeySSI: status.keySSI,
      visitsSReadSSI: visits.sReadSSI,
      created: new Date().toISOString(),
      trialName: trial.name,
      trialSponsor: trial.sponsor,
      trialId: trial.id,
    });

    await this.unmountEntityAsync(status.uid, '/statuses');
    await this.mountEntityAsync(status.keySSI, this.getStatusPath(site.uid));
    await this.mountEntityAsync(visits.keySSI, this.getVisitsPath(site.uid));

    await this.addSiteToDB(
      {
        ...data,
        keySSI: site.keySSI,
        uid: site.uid,
        sReadSSI: site.sReadSSI,
        statusKeySSI: status.keySSI,
        statusUid: status.uid,
        statusSReadSSI: status.sReadSSI,
        visitsKeySSI: visits.keySSI,
        visitsUid: visits.uid,
        visitsSReadSSI: visits.sReadSSI,
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
        created: new Date().toISOString(),
        trialName: trial.name,
        trialSponsor: trial.sponsor,
        trialId: trial.id,
      },
      trialKeySSI
    );
    return site;
  }

  async changeSiteStatus(status, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
      status,
    });

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    await this.updateEntityAsync({ ...statusDSU, status }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async updateSiteStage(trialKeySSI, siteKeySSI, stage) {
    const siteDSU = await this.getSite(siteKeySSI);
    const site = await this.getSiteFromDB(siteDSU.did, trialKeySSI);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
      stage,
    });

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    await this.updateEntityAsync({ ...statusDSU, stage }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async changeSiteStage(stage, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
      stage,
    });

    const statusDSU = await this.getEntityAsync(site.statusKeySSI, this.getStatusPath(site.keySSI));
    await this.updateEntityAsync({ ...statusDSU, stage }, this.getStatusPath(site.keySSI));

    return updatedSite;
  }

  async updateSiteConsents(data, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const existingConsent = site.consents.find((x) => x.keySSI === data.keySSI);
    if (existingConsent) {
      existingConsent.versions.push(data.versions[data.versions.length - 1]);
      // existingConsent.visits = data.visits || [];
    } else {
      site.consents = [...site.consents, data];
    }
    await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
    });

    const siteDSU = await this.getEntityAsync(site.keySSI);
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, consents: site.consents });
    return updatedSiteDSU;
  }

  async deleteSite(did, trialKeySSI) {
    const selectedSite = await this.storageService.getRecordAsync(this.getTableName(trialKeySSI), did);

    await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), selectedSite.did, {
      ...selectedSite,
      deleted: true,
    });

    return;
  }

  async addSiteToDB(data, trialKeySSI) {
    const newRecord = await this.storageService.insertRecordAsync(this.getTableName(trialKeySSI), data.did, data);
    return newRecord;
  }

  getTableName(trialKeySSI) {
    return this.SITES_TABLE + '_' + trialKeySSI;
  }

  getStatusPath(siteUid) {
    return this.SITES_PATH + '/' + siteUid + '/' + 'status';
  }

  getVisitsPath(siteUid) {
    return this.SITES_PATH + '/' + siteUid + '/' + 'visits';
  }
}
