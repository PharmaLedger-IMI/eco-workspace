import getSharedStorage from './SharedDBStorageService.js';
import DSUServiceAsync from './DSUServiceAsync.js';

export default class TrialsService extends DSUServiceAsync {
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

  async getTrial(keySSI) {
    const result = await this.getEntityAsync(keySSI);
    return result;
  }

  async createTrial(data) {
    const trial = await this.saveEntityAsync(data);
    await this.addTrialToDB({
      id: trial.id,
      keySSI: trial.uid,
      name: trial.name,
      status: trial.status,
      countries: trial.countries,
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
