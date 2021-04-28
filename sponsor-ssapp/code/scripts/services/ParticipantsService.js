import TrialsService from '../services/TrialsService.js';
import ConsentsService from '../services/ConsentsService.js';
import { participantConsentStatusEnum, senderType } from '../constants/participant.js';

export default class ParticipantsService {
  PARTICIPANTS_PATH = '/participants';
  PARTICIPANT_LIST_FILENAME = 'participants.json';

  constructor(DSUStorage) {
    this.DSUStorage = DSUStorage;
    this.trialsService = new TrialsService(this.DSUStorage);
    this.consentsService = new ConsentsService(this.DSUStorage);
  }

  async getTrialParticipants(trialKeySSI) {
    const result = await this.readParticipantsList(trialKeySSI);
    if (result && result.table) {
      return result.table.filter((x) => !x.deleted);
    } else return [];
  }

  async readParticipantsList(trialKeySSI) {
    try {
      let folderList = await this.listFolders('/');
      if (folderList && Array.isArray(folderList) && folderList.includes(this.PARTICIPANTS_PATH.substring(1))) {
        folderList = await this.listFolders(this.PARTICIPANTS_PATH);
        if (folderList && Array.isArray(folderList) && folderList.includes(trialKeySSI)) {
          return await this.getItem(`${this.PARTICIPANTS_PATH}/${trialKeySSI}/${this.PARTICIPANT_LIST_FILENAME}`);
        } else {
          return await this.createParticipantList(trialKeySSI);
        }
      } else {
        return await this.createParticipantList(trialKeySSI);
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async createParticipantList(trialKeySSI) {
    return await this.setItem(`${this.PARTICIPANTS_PATH}/${trialKeySSI}/${this.PARTICIPANT_LIST_FILENAME}`, {
      table: [],
    });
  }

  async updateParticipant(data, trialKeySSI) {
    try {
      let folderList = await this.listFolders('/');
      if (folderList && Array.isArray(folderList) && folderList.includes(this.PARTICIPANTS_PATH.substring(1))) {
        folderList = await this.listFolders(this.PARTICIPANTS_PATH);
        if (folderList && Array.isArray(folderList) && folderList.includes(trialKeySSI)) {
          // return await this.getItem(`${this.PARTICIPANTS_PATH}/${trialKeySSI}/${this.PARTICIPANT_LIST_FILENAME}`);
        } else {
          await this.createParticipantList(trialKeySSI);
        }
      } else {
        await this.createParticipantList(trialKeySSI);
      }

      const consent = await this.consentsService.getConsent(data.trialSSI, data.consentSSI);

      if (!consent) {
        throw new Error('Consent not found!');
      }

      console.log('CONSENT FOUND:', consent);

      let list = await this.readParticipantsList(trialKeySSI);

      console.log('LIST:', list);

      if (list.table && list.table.length > 0 && list.table.find((x) => x.participantId === data.participantId)) {
        console.log('participant EXISTS!');
        let participant = list.table.find((x) => x.participantId === data.participantId);
        let newList = list.table.filter((x) => x.participantId !== data.participantId);

        // TODO: different and reset dates and status when consent changes
        participant = {
          ...participant,
          consentName: consent.name,
          consentVersion: consent.version,
          consentStatus: participantConsentStatusEnum.Consent,
          patientSignature: data.type === senderType.HCP ? data.operationDate : participant.patientSignature,
          doctorSignature: data.type === senderType.Patient ? data.operationDate : participant.doctorSignature,
        };

        await this.updateParticipantList([...newList, participant], trialKeySSI);
      } else {
        console.log('participant DOES NOT EXIST!');
        const model = {
          participantId: data.participantId,
          consentName: consent.name,
          consentVersion: consent.version,
          consentStatus: participantConsentStatusEnum.Consent,
          patientSignature: data.type === senderType.HCP ? data.operationDate : null,
          doctorSignature: data.type === senderType.Patient ? data.operationDate : null,
        };

        await this.addParticipantToList(model, trialKeySSI);
      }

      list = await this.readParticipantsList(trialKeySSI);

      return list;
    } catch (error) {
      console.log(error.message);
    }
  }

  async addParticipantToList(data, trialKeySSI) {
    const fileName = `${this.PARTICIPANTS_PATH}/${trialKeySSI}/${this.PARTICIPANT_LIST_FILENAME}`;
    let participantList = await this.getItem(fileName);
    participantList.table = [...participantList.table, data];
    const result = await this.setItem(fileName, participantList);
    return result;
  }

  async updateParticipantList(data, trialKeySSI) {
    const fileName = `${this.PARTICIPANTS_PATH}/${trialKeySSI}/${this.PARTICIPANT_LIST_FILENAME}`;
    let participantList = await this.getItem(fileName);
    participantList.table = [...data];
    const result = await this.setItem(fileName, participantList);
    console.log('RESULT!!!:', result);
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

  getDsuStoragePath(trialKeySSI) {
    return this.PARTICIPANTS_PATH + '/' + trialKeySSI + '/' + this.PARTICIPANT_LIST_FILENAME;
  }
}
