import TrialService from '../services/TrialService.js';
import FileDownloader from '../utils/FileDownloader.js';
import EconsentService from '../services/EconsentService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';

const { WebcController } = WebCardinal.controllers;

export default class EconsentController extends WebcController {
  constructor(...props) {
    super(...props);
    this.setModel({});
    this._initServices(this.DSUStorage);
    this._initHandlers();
    this.model.econsent = {};
    this.model.historyData = this.history.win.history.state.state;
    this.model.status = { actions: [] };
    this._initEconsent();
  }

  _initServices(DSUStorage) {
    this.TrialService = new TrialService(DSUStorage);
    this.EconsentService = new EconsentService(DSUStorage);
  }

  _initHandlers() {
    this._attachHandlerReadEconsent();
    this._attachHandlerDownload();
    this._attachHandlerQuestion();
    this._attachHandlerVersions();
    this._attachHandlerWithdraw();
  }

  _initEconsent() {
    this.TrialService.getEconsent(this.model.historyData.trialuid, this.model.historyData.ecoId, (err, econsent) => {
      if (err) {
        return console.log(err);
      }
      this.model.econsent = econsent;
      this.fileDownloader = new FileDownloader(
        this.getEconsentFilePath(this.model.historyData.trialuid, this.model.historyData.ecoId, econsent.attachment),
        econsent.attachment
      );
      this.model.econsent.versionDate = new Date(econsent.versionDate).toLocaleDateString('sw');
      this._downloadFile();
      this.EconsentService.getEconsentsStatuses((err, data) => {
        if (err) {
          return console.error(err);
        }
        let status = data.find((element) => element.foreignConsentId === this.model.historyData.ecoId);
        if (status === undefined) {
          return console.log(`Status not found for econsendId ${this.model.historyData.ecoId}`);
        }
        status.actions = status.actions.map((action, index) => {
          return {
            ...action,
            index: index + 1,
          };
        });
        this.model.status = status;
        this.model.signed = ConsentStatusMapper.isSigned(this.model.status.actions);
        this.model.declined = ConsentStatusMapper.isDeclined(this.model.status.actions);
      });
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

  _attachHandlerReadEconsent() {
    this.onTagClick('econsent:read', (model, target, event) => {
      this.navigateToPageTag('sign-econsent', { ...this.model.historyData });
    });
  }

  _attachHandlerVersions() {
    this.on('econsent:versions', (event) => {
      console.log('econsent:versions');
    });
  }

  _attachHandlerQuestion() {
    this.on('econsent:question', (event) => {
      console.log('econsent:question');
    });
  }

  _attachHandlerWithdraw() {
    this.on('econsent:withdraw', (event) => {
      this.showModal('withdrawEconsent', {}, (err, response) => {
        if (err) {
          return console.log(err);
        }
        if (response) {
          this.model.status.actions.push({ name: 'withdraw' });
        }
        this.EconsentService.updateEconsent(this.model.status, (err, response) => {
          if (err) {
            return console.log(err);
          }
        });
      });
    });
  }

  getEconsentFilePath(trialSSI, consentSSI, fileName) {
    return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
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
}
