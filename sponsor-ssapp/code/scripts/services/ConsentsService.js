import getSharedStorage from './SharedDBStorageService.js';
import DSUService from './DSUService.js';

export default class ConsentsService extends DSUService {
  CONSENTS_TABLE = 'consents';
  TRIALS_PATH = '/trials';

  constructor(DSUStorage) {
    super(DSUStorage, '/consents');
    this.storageService = getSharedStorage(DSUStorage);
    this.DSUStorage = DSUStorage;
  }

  async getTrialConsents(trialKeySSI) {
    let result = null;
    try {
      result = await this.storageService.getRecord(this.CONSENTS_TABLE, trialKeySSI);
    } catch (e) {
      result = undefined;
    }

    if (result && result.consents) {
      return result.consents.filter((x) => !x.deleted);
    } else return [];
  }

  async getConsent(consentKeySSI) {
    const result = await this.getEntityAsync(consentKeySSI);
    return result;
  }

  // TODO: use tablename + ssi for separate table for each trial consent this.CONSENTS_TABLE + '_' + trialKeySSI;

  // TODO: fix select components
  async createConsent(data, trialKeySSI) {
    const consent = await this.saveEntityAsync(data);
    const attachmentKeySSI = await this.uploadFile(
      '/consents/' + consent.uid + '/consent/' + data.versions[0].version,
      data.versions[0].file
    );
    consent.versions[0].attachmentKeySSI = attachmentKeySSI;
    consent.versions[0].attachment = data.versions[0].file.name;
    const updatedConsent = await this.updateEntityAsync(consent);
    await this.addConsentToDB(
      {
        id: data.id,
        keySSI: consent.uid,
        name: data.name,
        type: data.type,
        versions: [
          {
            version: data.versions[0].version,
            versionDate: data.versions[0].versionDate,
            attachment: data.versions[0].file.name,
          },
        ],
      },
      trialKeySSI
    );

    const consents = await this.getTrialConsents(trialKeySSI);
    await this.mountConsent(trialKeySSI, consent.uid);

    return consent;
  }

  async updateConsent(data, trialKeySSI, consentKeySSI) {
    const consent = await this.getConsent(consentKeySSI);
    const attachmentKeySSI = await this.uploadFile('/consents/' + consent.uid + '/consent/' + data.version, data.file);
    data.attachmentKeySSI = attachmentKeySSI;
    data.attachment = data.file.name;
    consent.versions.push(data);
    const updatedConsent = await this.updateEntityAsync(consent);
    await this.updateConsentToDB(consent, trialKeySSI);

    const consents = await this.getTrialConsents(trialKeySSI);

    await this.mountConsent(trialKeySSI, consent.uid);

    return consent;
  }

  async deleteConsent(trialKeySSI, consentKeySSI) {
    const trialConsents = await this.storageService.getRecord(this.CONSENTS_TABLE, trialKeySSI);
    let selectedConsent = trialConsents.consents.find((x) => x.keySSI === consentKeySSI);
    let idx = trialConsents.consents.indexOf(selectedConsent);

    selectedConsent = { ...selectedConsent, deleted: true };

    trialConsents.consents[idx] = selectedConsent;

    await this.storageService.updateRecord(this.CONSENTS_TABLE, trialKeySSI, trialConsents);

    return;
  }

  async addConsentToDB(data, trialKeySSI) {
    let trial = null;
    try {
      trial = await this.storageService.getRecord(this.CONSENTS_TABLE, trialKeySSI);
    } catch (e) {
      trial = undefined;
    }

    if (!trial) {
      const newRecord = await this.storageService.insertRecord(this.CONSENTS_TABLE, trialKeySSI, { consents: [data] });
      return newRecord;
    } else {
      const updatedTrial = await this.storageService.updateRecord(this.CONSENTS_TABLE, trialKeySSI, {
        ...trial,
        consents: [...trial.consents, data],
      });

      return updatedTrial;
    }
  }

  async updateConsentToDB(data, trialKeySSI) {
    const trial = await this.storageService.getRecord(this.CONSENTS_TABLE, trialKeySSI);

    const consentIdx = trial.consents.findIndex((x) => x.id === data.id);

    trial.consents[consentIdx] = data;

    const updatedTrial = await this.storageService.updateRecord(this.CONSENTS_TABLE, trialKeySSI, trial);

    return updatedTrial;
  }

  async mountConsent(trialKeySSI, consentKeySSI) {
    const path = this.TRIALS_PATH + '/' + trialKeySSI + '/' + 'consent';
    return await this.mountEntityAsync(consentKeySSI, path);
  }

  async unmountConsent(trialKeySSI, consentKeySSI) {
    const path = this.TRIALS_PATH + '/' + trialKeySSI + '/' + 'consent';
    return await this.unmountEntityAsync(consentKeySSI, path);
  }

  //TODO: do it in DSUService
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

  getDsuStoragePath(trialKeySSI, consentKeySSI) {
    return this.CONSENTS_PATH + '/' + trialKeySSI + '/' + consentKeySSI;
  }
}
