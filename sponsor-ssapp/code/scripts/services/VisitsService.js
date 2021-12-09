import getSharedStorage from './SharedDBStorageService.js';
const commonServices = require('common-services');
const DSUService = commonServices.DSUService;

export default class VisitsService extends DSUService {
  VISITS_TABLE = 'visits';

  constructor(DSUStorage) {
    super('/visits');
    this.storageService = getSharedStorage(DSUStorage);
  }

  async getTrialVisits(trialKeySSI) {
    const result = await this.storageService.getRecord(this.VISITS_TABLE, trialKeySSI);
    if (result) {
      return result;
    } else return {};
  }

  async createTrialVisits(trialKeySSI) {
    const visits = await this.saveEntityAsync({
      visits: [],
      consents: [],
    });
    await this.addVisitsToDB(trialKeySSI, {
      keySSI: visits.uid,
      visits: [],
      consents: [],
    });
    return visits;
  }

  async updateTrialVisits(trialKeySSI, data) {
    const visits = await this.getTrialVisits(trialKeySSI);
    const visitsDSU = await this.getEntityAsync(visits.keySSI);
    console.log('visitsDSU: ', visitsDSU);
    const updatedVisitsDSU = await this.updateEntityAsync({ ...visitsDSU, visits: data });

    const updatedVisits = await this.storageService.updateRecord(this.VISITS_TABLE, trialKeySSI, {
      ...visits,
      consents: data.consents ? data.consents : visits.consents,
      visits: data.visits ? data.visits : visits.visits,
    });

    return updatedVisitsDSU;
  }

  async addVisitsToDB(trialKeySSI, data) {
    const newRecord = await this.storageService.insertRecord(this.VISITS_TABLE, trialKeySSI, data);
    return newRecord;
  }
}
