import getSharedStorage from './SharedDBStorageService.js';
const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;
import { trialStatusesEnum } from '../constants/trial.js';
import { trialStagesEnum } from '../constants/trial.js';
import VisitsService from './VisitsService.js';

export default class TrialsService extends DSUService {
  TRIALS_TABLE = 'trials';

  constructor(DSUStorage) {
    super('/trials');
    this.storageService = getSharedStorage(DSUStorage);
    this.visitsService = new VisitsService(DSUStorage);
  }

  async getTrials() {
    const result = await this.storageService.filter(this.TRIALS_TABLE);
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  async getTrial(keySSI) {
    const result = await this.getEntityAsync(keySSI);
    return result;
  }

  async getTrialFromDB(id) {
    return await this.storageService.getRecord(this.TRIALS_TABLE, id);
  }

  async createTrial(data) {
    const trial = await this.saveEntityAsync({
      ...data,
      stage: trialStagesEnum.Created,
      status: trialStatusesEnum.Active,
      created: new Date().toISOString(),
    });
    const visits = this.visitsService.createTrialVisits(trial.uid, {});
    await this.addTrialToDB({
      id: trial.id,
      keySSI: trial.uid,
      name: trial.name,
      status: trial.status,
      sponsor: trial.sponsor,
      did: trial.did,
      stage: trial.stage,
      created: trial.created,
      visitsKeySSI: visits.uid,
    });
    return trial;
  }

  async deleteTrial(id) {
    const selectedTrial = await this.storageService.getRecord(this.TRIALS_TABLE, id);

    const updatedTrial = await this.storageService.updateRecord(this.TRIALS_TABLE, selectedTrial.id, {
      ...selectedTrial,
      deleted: true,
    });
  }

  async addTrialToDB(data) {
    const newRecord = await this.storageService.insertRecord(this.TRIALS_TABLE, data.id, data);
    return newRecord;
  }
}
