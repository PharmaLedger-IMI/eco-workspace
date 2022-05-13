// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import { siteStagesEnum, siteStatusesEnum } from '../constants/site.js';
import { trialStagesEnum } from '../constants/trial.js';
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

  async getSite(uid) {
    const result = await this.getEntityAsync(uid);
    return result;
  }

  async getSiteFromUid(trialKeySSI, siteUid) {
    const site = await this.storageService.filterAsync(this.getTableName(trialKeySSI), `did == ${siteUid}`);
    return site;
  }

  async getSiteFromDB(did, trialKeySSI) {
    const result = await this.storageService.getRecordAsync(this.getTableName(trialKeySSI), did);
    return result;
  }

  async createSite(data, id) {
    const trial = await this.trialsService.getTrialFromDB(id);
    const visits = await this.visitsService.getTrialVisits(trial.keySSI);

    const status = await this.saveEntityAsync(
      {
        stage: siteStagesEnum.Created,
        status: siteStatusesEnum.Active,
      },
      '/statuses'
    );

    const site = await this.saveEntityAsync({
      ...data,
      statusKeySSI: status.keySSI,
      visitsSReadSSI: visits.sReadSSI,
      created: new Date().toISOString(),
      trialName: trial.name,
      trialSponsor: trial.sponsor,
      trialId: trial.id,
      trialSReadSSI: trial.sReadSSI,
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
      trial.keySSI
    );
    return site;
  }

  async changeSiteStatus(status, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
      status,
    });

    const statusDSU = await this.getEntityAsync(site.statusUid, this.getStatusPath(site.uid));
    await this.updateEntityAsync({ ...statusDSU, status }, this.getStatusPath(site.uid));

    return updatedSite;
  }

  async updateSiteContact(model, did, trialKeySSI) {
    const siteDSU = await this.getSite(model.uid);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), did, {
      ...model,
    });
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, name: model.name });
    return updatedSite;
  }

  async updateSiteStage(siteKeySSI) {
    const siteDSU = await this.getSite(siteKeySSI);
    const trialDB = await this.trialsService.getTrialFromDB(siteDSU.trialId);
    const site = await this.getSiteFromDB(siteDSU.did, trialDB.keySSI);
    const statusDSU = await this.getEntityAsync(site.statusUid, this.getStatusPath(site.uid));
    debugger;
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialDB.keySSI), site.did, {
      ...site,
      stage: statusDSU.stage,
    });

    if (trialDB.stage === trialStagesEnum.Created) {
      await this.trialsService.changeTrialStage(trialStagesEnum.Recruiting, trialDB);
    }

    return updatedSite;
  }

  async changeSiteStage(stage, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const updatedSite = await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
      stage,
    });

    const statusDSU = await this.getEntityAsync(site.statusUid, this.getStatusPath(site.uid));
    await this.updateEntityAsync({ ...statusDSU, stage }, this.getStatusPath(site.uid));

    return updatedSite;
  }

  async updateSiteConsents(data, did, trialKeySSI) {
    const site = await this.getSiteFromDB(did, trialKeySSI);
    const existingConsent = site.consents.find((x) => x.trialConsentId === data.trialConsentId);
    if (existingConsent) {
      existingConsent.versions.push(data.versions[data.versions.length - 1]);
      // existingConsent.visits = data.visits || [];
    } else {
      site.consents = [...site.consents, data];
    }
    await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), site.did, {
      ...site,
    });

    const siteDSU = await this.getEntityAsync(site.uid);
    const updatedSiteDSU = await this.updateEntityAsync({ ...siteDSU, consents: site.consents });
    return updatedSiteDSU;
  }

  // async deleteSite(did, trialKeySSI) {
  //   const selectedSite = await this.storageService.getRecordAsync(this.getTableName(trialKeySSI), did);

  //   await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), selectedSite.did, {
  //     ...selectedSite,
  //     deleted: true,
  //   });

  //   return;
  // }

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
