const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import SitesService from './SitesService.js';
import VisitsService from './VisitsService.js';
import TrialsService from './TrialsService.js';

export default class ConsentService extends DSUService {
  CONSENTS_TABLE = 'consents';
  SITES_PATH = '/sites';
  TRIALS_PATH = '/trials';

  constructor(DSUStorage) {
    super('/consents');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.siteService = new SitesService(DSUStorage);
    this.trialsService = new TrialsService(DSUStorage);
    this.visitsService = new VisitsService(DSUStorage);
    this.DSUStorage = DSUStorage;
  }

  async getTrialConsents(trialKeySSI) {
    let result = null;
    try {
      result = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, trialKeySSI);
    } catch (e) {
      result = undefined;
    }

    if (result && result.consents) {
      return result.consents.filter((x) => !x.deleted);
    } else return [];
  }

  async addSiteConsent(model, trialKeySSI, siteDSU) {
    const site = await this.siteService.getSiteFromDB(siteDSU.did, trialKeySSI);
    const path = this.getConsentPath(site.uid);
    const consent = await this.saveEntityAsync(model, path);
    const attachment = await this.uploadFile(
      `${path}${consent.uid}/versions/${model.versions[0].version.toString()}/${model.versions[0].file.name}`,
      model.versions[0].file
    );
    consent.versions[0].attachment = model.versions[0].file.name;
    const updatedConsentDSU = _.clone(consent);
    delete updatedConsentDSU.keySSI;
    delete updatedConsentDSU.sReadSSI;
    const updatedConsent = await this.updateEntityAsync(updatedConsentDSU, path);

    await this.addConsentToDB(
      {
        keySSI: consent.keySSI,
        uid: consent.uid,
        sReadSSI: consent.sReadSSI,
        name: model.name,
        type: model.type,
        trialConsentId: model.trialConsentId,
        trialConsentName: model.trialConsentName,
        versions: [
          {
            trialConsentVersion: model.trialConsentVersion,
            version: model.versions[0].version,
            versionDate: model.versions[0].versionDate,
            attachment: model.versions[0].file.name,
          },
        ],
      },
      site.keySSI
    );
    await this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);
    return consent;
  }

  async addSiteConsentVersion(model, trialKeySSI, siteDSU) {
    const site = await this.siteService.getSiteFromDB(siteDSU.did, trialKeySSI);
    const selectedSiteConsent = site.consents.find((x) => x.trialConsentId === model.trialConsentId);
    const path = this.getConsentPath(site.uid);
    const consentDSU = await this.getEntityAsync(selectedSiteConsent.uid, path);
    const attachment = await this.uploadFile(
      `${path}${consentDSU.uid}/versions/${model.versions[0].version.toString()}/${model.file.name}`,
      model.file
    );
    model.versions[0].attachment = model.file.name;
    consentDSU.versions.push(model.versions[0]);
    const updatedConsent = await this.updateEntityAsync(consentDSU, path);
    await this.updateConsentToDB(updatedConsent, site.keySSI);
    await this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);

    return updatedConsent;
  }

  // async deleteConsent(trialKeySSI, consentKeySSI) {
  //   const trialConsents = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, trialKeySSI);
  //   let selectedConsent = trialConsents.consents.find((x) => x.keySSI === consentKeySSI);
  //   let idx = trialConsents.consents.indexOf(selectedConsent);

  //   selectedConsent = { ...selectedConsent, deleted: true };

  //   trialConsents.consents[idx] = selectedConsent;

  //   await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, trialKeySSI, trialConsents);

  //   return;
  // }
  async createConsent(data, trialKeySSI, site = null) {
    if (site) {
      const path = this.getConsentPath(site.keySSI);
      const consent = await this.saveEntityAsync(data, path);
      const attachment = await this.uploadFile(
        `${path}${consent.uid}/versions/${data.versions[0].version}/${data.versions[0].file.name}`,
        data.versions[0].file
      );
      consent.versions[0].attachment = data.versions[0].file.name;
      const updatedConsent = await this.updateEntityAsync(consent, path);

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
        site.keySSI
      );
      await this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);
      const visits = await this.visitsService.getTrialVisits(trialKeySSI);
      if (visits.consents.indexOf(data.name) === -1) {
        visits.consents.push(data.name);
        await this.visitsService.updateTrialVisits(trialKeySSI, visits);
      }
      return consent;
    }
  }

  async updateConsent(data, trialKeySSI, site, consent) {
    const selectedSiteConsent = site.consents.find((x) => x.id === consent.id);
    const path = this.getConsentPath(site.keySSI);
    const consentDSU = await this.getEntityAsync(selectedSiteConsent.uid, path);
    const attachment = await this.uploadFile(
      `${path}${consentDSU.keySSI}/versions/${data.version}/${data.file.name}`,
      data.file
    );
    data.attachment = data.file.name;
    consentDSU.versions.push(data);

    const updatedConsentDSU = _.clone(consentDSU);
    delete updatedConsentDSU.keySSI;
    delete updatedConsentDSU.sReadSSI;
    const updatedConsent = await this.updateEntityAsync(updatedConsentDSU, path);
    await this.updateConsentToDB(updatedConsent, site.keySSI);
    await this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);

    return updatedConsent;
  }

  // async deleteConsent(trialKeySSI, consentKeySSI) {
  //   const trialConsents = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, trialKeySSI);
  //   let selectedConsent = trialConsents.consents.find((x) => x.keySSI === consentKeySSI);
  //   let idx = trialConsents.consents.indexOf(selectedConsent);

  //   selectedConsent = { ...selectedConsent, deleted: true };

  //   trialConsents.consents[idx] = selectedConsent;

  //   await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, trialKeySSI, trialConsents);

  //   return;
  // }

  async addConsentToDB(data, keySSI) {
    let record = null;
    try {
      record = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, keySSI);
    } catch (e) {
      record = undefined;
    }

    if (!record) {
      const newRecord = await this.storageService.insertRecordAsync(this.CONSENTS_TABLE, keySSI, { consents: [data] });
      return newRecord;
    } else {
      const updatedRecord = await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, keySSI, {
        ...record,
        consents: [...record.consents, data],
      });

      return updatedRecord;
    }
  }

  async updateConsentToDB(data, keySSI) {
    const record = await this.storageService.getRecordAsync(this.CONSENTS_TABLE, keySSI);

    let consentIdx = record.consents.findIndex((x) => {
      return x.id === data.id;
    });

    record.consents[consentIdx] = data;

    const updatedRecord = await this.storageService.updateRecordAsync(this.CONSENTS_TABLE, keySSI, record);

    return updatedRecord;
  }

  async updateBaseConsentVisits(visits, trialKeySSI, siteKeySSI) {
    const site = await this.siteService.getSite(siteKeySSI);
    const consents = site.consents;
    for (const consent of consents) {
      const tempVisits = visits.map((x) => ({
        ...x,
        procedures: x.procedures.filter((x) => x.consent.keySSI === consent.keySSI),
      }));

      consent.visits = tempVisits;
      const updatedConsent = await this.updateEntityAsync(consent);
      await this.updateConsentToDB(updatedConsent, site.keySSI);
      await this.siteService.updateSiteConsents(updatedConsent, site.did, trialKeySSI);
    }

    return;
  }

  getConsentPath(siteUid) {
    return `${this.SITES_PATH}/${siteUid}/consent/`;
  }

  async createTrialConsent(data, trialId) {
    const trial = await this.trialsService.getTrialFromDB(trialId);
    const path = this.getTrialConsentPath(trial.uid);
    const consent = await this.saveEntityAsync(data, path);
    const attachment = await this.uploadFile(
      `${path}${consent.uid}/versions/${data.versions[0].version}/${data.versions[0].file.name}`,
      data.versions[0].file
    );
    consent.versions[0].attachment = data.versions[0].file.name;

    const updatedConsentDSU = _.clone(consent);
    delete updatedConsentDSU.keySSI;
    delete updatedConsentDSU.sReadSSI;
    const updatedConsent = await this.updateEntityAsync(updatedConsentDSU, path);

    await this.addConsentToDB(
      {
        id: data.id,
        keySSI: consent.keySSI,
        uid: consent.uid,
        sReadSSI: consent.sReadSSI,
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
      trial.keySSI
    );

    await this.trialsService.updateTrialConsents(updatedConsent, trial.uid);

    // TODO: make all ids keySSIs so unique
    return consent;
  }

  async updateTrialConsent(data, trialId, site, consent) {
    const trial = await this.trialsService.getTrialFromDB(trialId);
    const path = this.getTrialConsentPath(trial.uid);
    const consentDSU = await this.getEntityAsync(consent.uid, path);
    const attachment = await this.uploadFile(
      `${path}${consentDSU.uid}/versions/${data.version}/${data.file.name}`,
      data.file
    );
    data.attachment = data.file.name;
    consentDSU.versions.push(data);
    const updatedConsent = await this.updateEntityAsync(consentDSU, path);
    await this.updateConsentToDB(updatedConsent, trial.keySSI);
    await this.trialsService.updateTrialConsents(updatedConsent, trial.uid);

    return updatedConsent;
  }

  getTrialConsentPath(trialUid) {
    return `${this.TRIALS_PATH}/${trialUid}/consent/`;
  }

  //TODO: do it in DSUService
  uploadFile(path, file) {
    let getFileContentAsBuffer = (file, callback) => {
      let fileReader = new FileReader();
      fileReader.onload = function (evt) {
        let arrayBuffer = fileReader.result;
        callback(undefined, arrayBuffer);
      };

      fileReader.readAsArrayBuffer(file);
    };

    return new Promise((resolve, reject) => {
      getFileContentAsBuffer(file, (err, arrayBuffer) => {
        if (err) {
          reject('Could not get file as a Buffer');
        }
        this.letDSUStorageInit().then(() => {
          this.DSUStorage.writeFile(path, $$.Buffer.from(arrayBuffer), undefined, (err, keySSI) => {
            if (err) {
              reject(new Error(err));
              return;
            }
            resolve();
          });
        });
      });
    });
  }
}
