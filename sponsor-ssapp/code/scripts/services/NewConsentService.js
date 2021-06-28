import getSharedStorage from './SharedDBStorageService.js';
import DSUService from './DSUService.js';

export default class NewConsentService extends DSUService {
  CONSENTS_TABLE = 'consents';
  SITES_PATH = '/sites';
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
  async createConsent(data, trialKeySSI, siteKeySSI = null) {
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
        uid: consent.uid,
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

    await this.mountConsent(trialKeySSI, consent.uid, false);

    if (siteKeySSI) {
      await this.addConsentToDB(
        {
          id: data.id,
          keySSI: consent.uid,
          name: data.name,
          type: data.type,
          uid: consent.uid,
          versions: [
            {
              version: data.versions[0].version,
              versionDate: data.versions[0].versionDate,
              attachment: data.versions[0].file.name,
            },
          ],
        },
        siteKeySSI
      );

      await this.mountConsent(siteKeySSI, consent.uid, true);
    }

    // TODO: make all ids keySSIs so unique
    return consent;
  }

  async updateConsent(data, trialKeySSI, siteKeySSI, consent) {
    const siteConsents = await this.getTrialConsents(siteKeySSI);
    console.log(JSON.stringify(consent, null, 2));

    if (consent.versions.length === 1) {
      const consentData = {
        id: consent.id,
        parentKeySSI: consent.KeySSI,
        name: consent.name,
        type: consent.type,
        versions: consent.versions,
      };
      const newConsent = await this.saveEntityAsync(consentData);

      // const attachmentKeySSI = await this.uploadFile(
      //   '/consents/' + consent.uid + '/consent/' + data.versions[0].version,
      //   data.versions[0].file
      // );
      // consent.versions[0].attachmentKeySSI = attachmentKeySSI;
      // consent.versions[0].attachment = data.versions[0].file.name;
      // const updatedConsent = await this.updateEntityAsync(consent);
    } else {
    }
    // const consent = await this.getConsent(consentKeySSI);
    // const attachmentKeySSI = await this.uploadFile('/consents/' + consent.uid + '/consent/' + data.version, data.file);
    // data.attachmentKeySSI = attachmentKeySSI;
    // data.attachment = data.file.name;
    // consent.versions.push(data);
    // const updatedConsent = await this.updateEntityAsync(consent);
    // await this.updateConsentToDB(consent, trialKeySSI);

    // await this.mountConsent(trialKeySSI, consent.uid);

    // return consent;
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

  async addConsentToDB(data, keySSI) {
    let record = null;
    try {
      record = await this.storageService.getRecord(this.CONSENTS_TABLE, keySSI);
    } catch (e) {
      record = undefined;
    }

    if (!record) {
      const newRecord = await this.storageService.insertRecord(this.CONSENTS_TABLE, keySSI, { consents: [data] });
      return newRecord;
    } else {
      const updatedRecord = await this.storageService.updateRecord(this.CONSENTS_TABLE, keySSI, {
        ...record,
        consents: [...record.consents, data],
      });

      return updatedRecord;
    }
  }

  async updateConsentToDB(data, keySSI) {
    const record = await this.storageService.getRecord(this.CONSENTS_TABLE, keySSI);

    const consentIdx = record.consents.findIndex((x) => x.id === data.id);

    record.consents[consentIdx] = data;

    const updatedRecord = await this.storageService.updateRecord(this.CONSENTS_TABLE, keySSI, record);

    return updatedRecord;
  }

  async updateBaseConsentVisits(visits, trialKeySSI) {
    const consents = await this.getTrialConsents(trialKeySSI);
    console.log('CONSENTS:', JSON.stringify(consents, null, 2));
    console.log('VISITS:', visits);

    for (const consent of consents) {
      const consentVisits = visits.filter((x) => x.consent.keySSI === consent.keySSI);
      if (consentVisits && consentVisits.length > 0) {
        consent.procedures = consentVisits;
        const updatedConsent = await this.updateEntityAsync(consent);
        await this.updateConsentToDB(consent, trialKeySSI);
      } else {
        consent.procedures = [];
        const updatedConsent = await this.updateEntityAsync(consent);
        await this.updateConsentToDB(consent, trialKeySSI);
      }
    }

    return;

    // const sampleData = [
    //   {
    //       "id": 0,
    //       "name": "12121",
    //       "consent": {
    //           "keySSI": "BBudGH6ySHG6GUHN8ogNrTWbbW5UisFSbmJ3xGNBqoQ6pkHRpWPArksc7TYYbpBPd5DzJxtuCAQDPWc8hamhgqET9",
    //           "id": "22",
    //           "name": "con 2"
    //       },
    //       "visits": [
    //           {
    //               "id": 0,
    //               "checked": true,
    //               "period": "2",
    //               "unit": "Week"
    //           },
    //           {
    //               "id": 1,
    //               "checked": true,
    //               "period": "1",
    //               "unit": "Day"
    //           }
    //       ]
    //   },
    //   {
    //       "id": 1,
    //       "name": "122112111",
    //       "consent": {
    //           "keySSI": "BBudGH6ySHG6GUHN8ogNrTWbL4rHscYLdB6H64GLEjEundddih97DPi9KYpn6aDY7D6XjfKBkKek3ifbeHsK2ushh",
    //           "id": "1",
    //           "name": "con 1"
    //       },
    //       "visits": [
    //           {
    //               "id": 0,
    //               "checked": false,
    //               "period": "2",
    //               "unit": "Day"
    //           },
    //           {
    //               "id": 1,
    //               "checked": true,
    //               "period": "2",
    //               "unit": "Day"
    //           }
    //       ]
    //   },
    //   {
    //       "id": 2,
    //       "name": "11111111",
    //       "consent": {
    //           "keySSI": "BBudGH6ySHG6GUHN8ogNrTWbbW5UisFSbmJ3xGNBqoQ6pkHRpWPArksc7TYYbpBPd5DzJxtuCAQDPWc8hamhgqET9",
    //           "id": "22",
    //           "name": "con 2"
    //       },
    //       "visits": [
    //           {
    //               "id": 0,
    //               "checked": true,
    //               "period": "2",
    //               "unit": "Day"
    //           },
    //           {
    //               "id": 1,
    //               "checked": true,
    //               "period": "2",
    //               "unit": "Day"
    //           }
    //       ]
    //   }
    // ]
  }

  async mountConsent(keySSI, consentKeySSI, isSiteConsent) {
    const path = (isSiteConsent ? this.SITES_PATH : this.TRIALS_PATH) + '/' + keySSI + '/' + 'consent';
    return await this.mountEntityAsync(consentKeySSI, path);
  }

  async unmountConsent(keySSI, consentKeySSI, isSiteConsent) {
    const path = (isSiteConsent ? this.SITES_PATH : this.TRIALS_PATH) + '/' + keySSI + '/' + 'consent';
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
}
