import ConsentsService from '../services/ConsentsService.js';
import { participantConsentStatusEnum, senderType } from '../constants/participant.js';
const commonServices = require('common-services');
const SharedStorage = commonServices.SharedStorage;
const DSUService = commonServices.DSUService;
import TrialsService from '../services/TrialsService.js';
import SitesService from '../services/SitesService.js';

export default class ParticipantsService extends DSUService {
  PARTICIPANTS_TABLE = 'participants';
  PARTICIPANTS_PATH = '/participants';
  PARTICIPANT_LIST_FILENAME = 'participants.json';

  constructor(DSUStorage) {
    super('/participants');
    this.storageService = SharedStorage.getSharedStorage(DSUStorage);
    this.consentsService = new ConsentsService(DSUStorage);
    this.trialsService = new TrialsService(DSUStorage);
    this.sitesService = new SitesService(DSUStorage);
  }

  // TODO: catch error only upper level and show pop up
  async getTrialParticipants(trialKeySSI) {
    try {
      let result = null;
      try {
        result = await this.storageService.filterAsync(this.getTableName(trialKeySSI));
      } catch (e) {
        result = undefined;
      }

      if (result && result.length > 0) {
        return result.filter((x) => !x.deleted);
      } else return [];
    } catch (error) {
      console.log(error.message);
    }
  }

  async updateParticipant(data, ssi, siteDid) {
    try {
      debugger;
      const trialUid = data.trialSSI;
      const tpDid = data.tpDid;
      const trialDSU = await this.trialsService.getTrial(trialUid);
      const trial = await this.trialsService.getTrialFromDB(trialDSU.id);
      const site = await this.sitesService.getSiteFromDB(siteDid, trial.keySSI);
      const participantDSU = await this.mountEntityAsync(ssi);
      console.log(trial);
      console.log(site);
      console.log(participantDSU);
      // let list = await this.getTrialParticipants(trialKeySSI);
      // let participantExists = await this.storageService.filterAsync(
      //   this.getTableName(trialKeySSI),
      //   `participantId == ${data.participantId}`
      // );
      // if (participantExists && participantExists.length === 1) {
      //   let participant = participantExists[0];
      //   participant = {
      //     ...participant,
      //     consentName: consent.name,
      //     consentVersion: data.version,
      //     consentStatus: participantConsentStatusEnum.Consent,
      //     patientSignature: data.type === senderType.Patient ? data.action.date : participant.patientSignature,
      //     doctorSignature: data.type === senderType.HCP ? data.action.date : participant.doctorSignature,
      //     // doctorSignature: data.type === senderType.HCP ? data.operationDate : participant.doctorSignature,
      //   };
      //   await this.storageService.updateRecordAsync(this.getTableName(trialKeySSI), data.participantId, participant);
      // } else {
      //   const model = {
      //     participantId: data.participantId,
      //     consentName: consent.name,
      //     consentVersion: data.version,
      //     consentStatus: participantConsentStatusEnum.Consent,
      //     patientSignature: data.type === senderType.Patient ? data.action.date : null,
      //     doctorSignature: data.type === senderType.HCP ? data.action.date : null,
      //     // doctorSignature: data.type === senderType.HCP ? data.operationDate : null,
      //   };
      //   await this.storageService.insertRecordAsync(this.getTableName(trialKeySSI), data.participantId, model);
      // }
      // list = await this.getTrialParticipants(trialKeySSI);
      // return list;
    } catch (error) {
      console.log(error.message);
    }
  }

  async addParticipant(ssi, sender) {
    try {
      const participantDSU = await this.mountEntityAsync(ssi);
      const trial = await this.trialsService.getTrialFromDB(participantDSU.trialId);
      const site = await this.sitesService.getSiteFromUid(trial.keySSI, sender);
      const newParticipant = await this.storageService.insertRecordAsync(
        this.getTableName(trial.keySSI, site.keySSI),
        participantDSU.did,
        participantDSU
      );
      console.log(newParticipant);

      return newParticipant;
    } catch (error) {
      console.log(error.message);
    }
  }

  getTableName(trialKeySSI, siteKeySSI) {
    return this.PARTICIPANTS_TABLE + '_' + trialKeySSI + '_' + siteKeySSI;
  }
}
