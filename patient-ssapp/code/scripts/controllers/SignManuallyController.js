import TrialService from '../services/TrialService.js';
import FileDownloader from '../utils/FileDownloader.js';
import CommunicationService from '../services/CommunicationService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository";

const { WebcController } = WebCardinal.controllers;

const TEXT_MIME_TYPE = 'text/';

export default class SignManuallyController extends WebcController {
  attachment = {
    label: 'Select signed consent',

    listFiles: true,
    filesAppend: false,
    files: [],
  };

  constructor(...props) {
    super(...props);
    this.setModel({});
    this.model.econsent = {};
    this.model.status = { attachment: this.attachment };
    this._initServices(this.DSUStorage);
    this.model.historyData = this.history.win.history.state.state;
    this._initConsent();
    this._initHandlers();
  }

  _initServices(DSUStorage) {
    this.TrialService = new TrialService(DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.PATIENT_IDENTITY);
    this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
  }

  _initConsent() {
    this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
      if (err) {
        return console.log(err);
      }
      this.model.econsent = econsent;
      this.fileDownloader = new FileDownloader(
        this.getEconsentFilePath(this.model.historyData.trialuid, this.model.historyData.ecoId, econsent.attachment),
        econsent.attachment
      );
      this._downloadFile();
      this.EconsentsStatusRepository.findAll((err, data) => {
        if (err) {
          return console.error(err);
        }
        this.model.status = data.find((element) => element.foreignConsentId === this.model.historyData.ecoId);
      });
    });
  }

  _initHandlers() {
    this._attachHandlerSign();
    this._attachHandlerDownload();
    this._attachHandlerAddEconsentFile();
  }

  _finishProcess(event, response) {
    event.stopImmediatePropagation();
    this.responseCallback(undefined, response);
  }

  getEconsentFilePath(trialSSI, consentSSI, fileName) {
    return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
  }

  _attachHandlerSign() {
    this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.model.status.actions.push({ name: 'signed' });
      this._saveEconsent();
    });
  }

  _attachHandlerAddEconsentFile() {
    this.on('add-file', (event) => {
      console.log(event.data);
      if (event.data) this.file = event.data;
    });
  }

  _attachHandlerDownload() {
    this.onTagClick('econsent:download', (model, target, event) => {
      console.log('econsent:download');
      event.preventDefault();
      event.stopImmediatePropagation();
      this.fileDownloader.downloadFileToDevice({
        contentType: this.mimeType,
        rawBlob: this.rawBlob,
      });
    });
  }

  sendMessageToSponsorAndHCO(operation, ssi, shortMessage) {
    let sendObject = {
      operation: operation,
      ssi: ssi,
      useCaseSpecifics: {
        trialSSI: this.model.historyData.trialuid,
        tpNumber: this.model.historyData.tpNumber,
        tpDid: this.model.historyData.tpDid,
        version: this.model.historyData.ecoVersion,
        operationDate: new Date().toISOString(),
      },
      shortDescription: shortMessage,
    };
    this.CommunicationService.sendMessage(CommunicationService.identities.ECO.SPONSOR_IDENTITY, sendObject);
    this.CommunicationService.sendMessage(CommunicationService.identities.ECO.HCO_IDENTITY, sendObject);
  }

  _downloadFile = () => {
    this.fileDownloader.downloadFile((downloadedFile) => {
      this.rawBlob = downloadedFile.rawBlob;
      this.mimeType = downloadedFile.contentType;
      this.blob = new Blob([this.rawBlob], {
        type: this.mimeType,
      });
    });
  };

  _saveEconsent() {
    this.EconsentsStatusRepository.update(
      this.model.uid,
        {  ...this.model.status,
      },
      (err, data) => {
        if (err) {
          return console.log(err);
        }
        this._finishActionSave();
      }
    );
  }

  _finishActionSave() {
    this.navigateToPageTag('home');
    this.sendMessageToSponsorAndHCO('sign-econsent', this.model.econsent.keySSI, 'TP signed econsent ');
  }
}
