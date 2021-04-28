// import getSharedStorage from './SharedDBStorageService.js';
export default class TrialsService {
  TRIALS_PATH = '/trials';
  TRIALS_LIST_FILENAME = 'trials.json';
  TRIALS_LIST_PATH = this.TRIALS_PATH + '/' + this.TRIALS_LIST_FILENAME;

  constructor(DSUStorage) {
    this.DSUStorage = DSUStorage;
    // this.storageService = getSharedStorage(DSUStorage);
  }

  async getTrials() {
    const result = await this.readTrialList();
    if (result && result.table) {
      return result.table.filter((x) => !x.deleted);
    } else return [];
  }

  async getTrial(keySSI) {
    const result = await this.getItem(this.getDsuStoragePath(keySSI));
    return result;
  }

  async createTrial(data) {
    const keySSI = await this.createSSIAndMount(this.TRIALS_PATH);
    data.keySSI = keySSI;
    const trial = await this.setItem(this.getDsuStoragePath(data.keySSI), data);
    await this.addTrialToList({
      id: data.id,
      keySSI: data.keySSI,
      name: data.name,
      status: data.status,
      countries: data.countries,
    });
    return trial;
  }

  async deleteTrial(id) {
    await this.removeTrialFromList(id);
  }

  async removeTrialFromList(id) {
    const trialList = await this.getItem(this.TRIALS_LIST_PATH);
    const trial = trialList.table.find((x) => x.id === id);
    trial['deleted'] = true;
    const result = await this.setItem(this.TRIALS_LIST_PATH, trialList);
    return result;
  }

  async addTrialToList(data) {
    let trialList = await this.getItem(this.TRIALS_LIST_PATH);
    trialList.table = [...trialList.table, data];
    const result = await this.setItem(this.TRIALS_LIST_PATH, trialList);
    return result;
  }

  async createTrialList() {
    return await this.setItem(this.TRIALS_LIST_PATH, { table: [] });
  }

  async readTrialList() {
    try {
      const fileList = await this.listFiles(this.TRIALS_PATH);
      if (fileList.includes(this.TRIALS_LIST_FILENAME)) {
        return await this.getItem(this.TRIALS_LIST_PATH);
      } else {
        return await this.createTrialList();
      }
    } catch (error) {
      console.log(error);
    }
  }

  getItem(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.getItem(path, (err, content) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        let textDecoder = new TextDecoder('utf-8');
        let json = JSON.parse(textDecoder.decode(content));
        resolve(json);
      });
    });
  }

  setItem(path, content) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.setObject(path, content, async (err) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(content);
      });
    });
  }

  createSSIAndMount(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('createSSIAndMount', path, async (err, keySSI) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(keySSI);
      });
    });
  }

  listFiles(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('listFiles', path, async (err, result) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }

  getDsuStoragePath(keySSI) {
    return this.TRIALS_PATH + '/' + keySSI + '/data.json';
  }
}
