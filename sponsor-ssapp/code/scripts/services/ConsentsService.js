import TrialsService from '../services/TrialsService.js';
export default class ConsentsService {
  TRIALS_PATH = '/trials';
  CONSENTS_PATH = '/consents';
  CONSENTS_LIST_FILENAME = 'consents.json';
  CONSENTS_DATA_FILENAME = 'data.json';

  constructor(DSUStorage) {
    this.DSUStorage = DSUStorage;
    this.trialsService = new TrialsService(this.DSUStorage);
  }

  async getTrialConsents(trialKeySSI) {
    const result = await this.readConsentsList(trialKeySSI);
    if (result && result.table) {
      return result.table.filter((x) => !x.deleted);
    } else return [];
  }

  async readConsentsList(trialKeySSI) {
    try {
      let folderList = await this.listFolders('/');
      if (folderList && Array.isArray(folderList) && folderList.includes(this.CONSENTS_PATH.substring(1))) {
        folderList = await this.listFolders(this.CONSENTS_PATH);
        if (folderList && Array.isArray(folderList) && folderList.includes(trialKeySSI)) {
          return await this.getItem(`${this.CONSENTS_PATH}/${trialKeySSI}/${this.CONSENTS_LIST_FILENAME}`);
        } else {
          return await this.createConsentList(trialKeySSI);
        }
      } else {
        return await this.createConsentList(trialKeySSI);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async createConsentList(trialKeySSI) {
    return await this.setItem(`${this.CONSENTS_PATH}/${trialKeySSI}/${this.CONSENTS_LIST_FILENAME}`, { table: [] });
  }

  async getConsent(trialKeySSI, consentKeySSI) {
    const result = await this.getItem(
      this.getDsuStoragePath(trialKeySSI, consentKeySSI) + '/' + this.CONSENTS_DATA_FILENAME
    );
    return result;
  }

  async createConsent(data, trialKeySSI) {
    const consentKeySSI = await this.createSSIAndMount(`${this.CONSENTS_PATH}/${trialKeySSI}`);
    const attachmentKeySSI = await this.uploadFile(
      this.getDsuStoragePath(trialKeySSI, consentKeySSI) + '/consent/' + data.file.name,
      data.file
    );
    data.keySSI = consentKeySSI;
    data.attachmentKeySSI = attachmentKeySSI;
    data.attachment = data.file.name;
    const consent = await this.setItem(this.getDsuStoragePath(trialKeySSI, consentKeySSI) + '/data.json', data);
    await this.addConsentToList(
      {
        id: data.id,
        keySSI: data.keySSI,
        name: data.name,
        version: data.version,
        versionDate: data.versionDate,
        type: data.type,
        attachment: data.attachment,
      },
      trialKeySSI
    );

    const list = await this.readConsentsList(trialKeySSI);
    if (list && list.table && list.table.length === 1) {
      await this.mountConsent(trialKeySSI, consentKeySSI);
    }
    return consent;
  }

  async deleteConsent(trialKeySSI, consentKeySSI) {
    await this.removeConsentFromList(trialKeySSI, consentKeySSI);
  }

  async removeConsentFromList(trialKeySSI, consentKeySSI) {
    const fileName = `${this.CONSENTS_PATH}/${trialKeySSI}/${this.CONSENTS_LIST_FILENAME}`;
    let consentList = await this.getItem(fileName);
    const consent = consentList.table.find((x) => x.keySSI === consentKeySSI);
    consent['deleted'] = true;
    const result = await this.setItem(fileName, consentList);
    return result;
  }

  async addConsentToList(data, trialKeySSI) {
    const fileName = `${this.CONSENTS_PATH}/${trialKeySSI}/${this.CONSENTS_LIST_FILENAME}`;
    let consentList = await this.getItem(fileName);
    consentList.table = [...consentList.table, data];
    const result = await this.setItem(fileName, consentList);
    return result;
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

  listFolders(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('listFolders', path, async (err, result) => {
        if (err) {
          console.log(err);
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }

  uploadFile(path, file) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.uploadFile(path, file, undefined, (err, keySSI) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(keySSI);
      });
    });
  }

  readFile(path) {
    return new Promise((resolve, reject) => {
      this.DSUStorage.call('readFile', path, async (err, result) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(result);
      });
    });
  }

  mountConsent(trialKeySSI, consentKeySSI) {
    return new Promise((resolve, reject) => {
      const path = this.TRIALS_PATH + '/' + trialKeySSI + '/' + 'consent';
      this.DSUStorage.call('mount', path, consentKeySSI, async (err, keySSI) => {
        if (err) {
          reject(new Error(err));
          return;
        }
        resolve(keySSI);
      });
    });
  }

  getDsuStoragePath(trialKeySSI, consentKeySSI) {
    return this.CONSENTS_PATH + '/' + trialKeySSI + '/' + consentKeySSI;
  }
}
