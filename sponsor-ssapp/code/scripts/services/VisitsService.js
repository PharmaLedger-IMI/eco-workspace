// eslint-disable-next-line no-undef
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;

export default class VisitsService extends DSUService {
  VISITS_TABLE = 'visits';

  constructor(DSUStorage) {
    super('/visits');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
  }

  async getTrialVisits(trialKeySSI) {
    const result = await this.storageService.getRecordAsync(this.VISITS_TABLE, trialKeySSI);
    if (result) {
      return result;
    } else return {};
  }

  async createTrialVisits(trialKeySSI) {
    const visits = await this.saveEntityAsync({
      visits: [],
    });
    await this.addVisitsToDB(trialKeySSI, {
      keySSI: visits.keySSI,
      uid: visits.uid,
      sReadSSI: visits.sReadSSI,
      visits: [],
    });
    return visits;
  }

  async updateTrialVisits(trialKeySSI, data, consentId) {
    const visitsDb = await this.getTrialVisits(trialKeySSI);
    const visitsDSU = await this.getEntityAsync(visitsDb.uid);
    let exists = visitsDb.visits.findIndex((x) => x.consentId === consentId);
    if (exists > -1) {
      visitsDb.visits[exists] = { ...visitsDb.visits[exists], data };
    } else {
      visitsDb.visits.push({
        consentId,
        data,
      });
    }

    const updatedVisitsDSU = await this.updateEntityAsync({ ...visitsDSU, visits: visitsDb.visits });

    await this.storageService.updateRecordAsync(this.VISITS_TABLE, trialKeySSI, {
      ...visitsDb,
    });

    return updatedVisitsDSU;
  }

  async addVisitsToDB(trialKeySSI, data) {
    const newRecord = await this.storageService.insertRecordAsync(this.VISITS_TABLE, trialKeySSI, data);
    return newRecord;
  }
}
