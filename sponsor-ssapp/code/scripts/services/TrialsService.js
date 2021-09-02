import getSharedStorage from './SharedDBStorageService.js';
const ecoServices = require('eco-services');
const DSUService = ecoServices.DSUService;
import { trialStatusesEnum } from '../constants/trial.js';
import { trialStagesEnum } from '../constants/trial.js';

export default class TrialsService extends DSUService {
  TRIALS_TABLE = 'trials';

  constructor(DSUStorage) {
    super(DSUStorage, '/trials');
    this.DSUStorage = DSUStorage;
    this.storageService = getSharedStorage(DSUStorage);
  }

  async getTrials() {
    const result = await this.storageService.filter(this.TRIALS_TABLE);
    if (result) {
      return result.filter((x) => !x.deleted);
    } else return [];
  }

  /**
   *
   * @param {*} keySSI
   * @returns
   */

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
    await this.addTrialToDB({
      id: trial.id,
      keySSI: trial.uid,
      name: trial.name,
      status: trial.status,
      sponsor: trial.sponsor,
      did: trial.did,
      stage: trial.stage,
      created: trial.created,
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
