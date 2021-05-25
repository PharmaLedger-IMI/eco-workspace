import TrialService from '../services/TrialService.js';
import EconsentService from '../services/EconsentService.js';
import FileDownloader from '../utils/FileDownloader.js';
import CommunicationService from '../services/CommunicationService.js';
import ConsentStatusMapper from '../utils/ConsentStatusMapper.js';

const { WebcController } = WebCardinal.controllers;

const TEXT_MIME_TYPE = 'text/';

export default class ReadEconsentController extends WebcController {
  constructor(...props) {
    super(...props);
    this.setModel({});
    this.model.econsent = {};
    this._initServices(this.DSUStorage);
    this.model.historyData = this.history.win.history.state.state;
    this.model.required = {};
    this.model.declined = {};
    this.model.signed = {};
    this.model.withdraw = {};

    this._initConsent();
    this._initHandlers();
  }

  _initServices(DSUStorage) {
    this.TrialService = new TrialService(DSUStorage);
    this.EconsentService = new EconsentService(DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
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
      this.EconsentService.getEconsentsStatuses((err, data) => {
        if (err) {
          return console.error(err);
        }
        this.model.status = data.find((element) => element.foreignConsentId === this.model.historyData.ecoId);
        this.model.signed = ConsentStatusMapper.isSigned(this.model.status.actions);
        this.model.declined = ConsentStatusMapper.isDeclined(this.model.status.actions);
        this.model.required = ConsentStatusMapper.isRequired(this.model.status.actions);
        this.model.withdraw = ConsentStatusMapper.isWithdraw(this.model.status.actions);
        this.model.withdrawIntention = ConsentStatusMapper.isWithdrawIntention(this.model.status.actions);
      });
    });
  }

  _initHandlers() {
    this._attachHandlerDecline();
    this._attachHandlerSign();
    this._attachHandlerManuallySign();
    this._attachHandlerDownload();
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
      this._saveEconsent((err, data) => {
        if (err) {
          console.log(err);
        }
        this.sendMessageToSponsorAndHCO('sign', this.model.econsent.keySSI, 'TP signed econsent ');
        this._finishActionSave();
      });
    });
  }

  _attachHandlerDecline() {
    this.onTagEvent('econsent:withdraw', 'click', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.showModalFromTemplate(
        'withdraw-econsent',
        (event) => {
          const response = event.detail;
          let operation = 'withdraw';
          let message = 'TP withdraw consent.';
          if (response.withdraw) {
            this.model.status.actions.push({ name: 'withdraw' });
          } else if (response.withdrawIntention) {
            this.model.status.actions.push({ name: 'withdraw-intention' });
            operation = 'withdraw-intention';
            message = 'TP withdraw intention consent.';
          }
          this._saveEconsent((err, data) => {
            if (err) {
              console.log(err);
            }
            this.sendMessageToSponsorAndHCO(operation, this.model.econsent.keySSI, message);
            this._finishActionSave();
          });
        },
        (event) => {
          const response = event.detail;
        }
      ),
        {
          controller: 'WithdrawEconsent',
          disableExpanding: false,
          disableBackdropClosing: false,
          title: 'Decline Econsent',
        };
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

  _attachHandlerManuallySign() {
    this.onTagClick('manual:sign', (model, target, event) => {
      this.navigateToPageTag('signmanually-econsent', { ...this.model.historyData });
    });
  }

  sendMessageToSponsorAndHCO(action, ssi, shortMessage) {
    const currentDate = new Date();
    let sendObject = {
      operation: 'update-econsent',
      ssi: ssi,
      useCaseSpecifics: {
        trialSSI: this.model.historyData.trialuid,
        tpNumber: this.model.historyData.tpNumber,
        action: {
          name: action,
          date: currentDate.toISOString(),
          toShowDate: currentDate.toLocaleDateString(),
        },
      },
      shortDescription: shortMessage,
    };
    this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, sendObject);
    this.CommunicationService.sendMessage(CommunicationService.identities.HCO_IDENTITY, sendObject);
  }

  _downloadFile = () => {
    this.fileDownloader.downloadFile((downloadedFile) => {
      this.rawBlob = downloadedFile.rawBlob;
      this.mimeType = downloadedFile.contentType;
      this.blob = new Blob([this.rawBlob], {
        type: this.mimeType,
      });

      if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
        //this._prepareTextEditorViewModel();
      } else {
        this._displayFile();
      }
    });
  };

  _loadPdfOrTextFile = () => {
    this._loadBlob((base64Blob) => {
      const obj = document.createElement('object');
      obj.type = this.mimeType;
      obj.data = base64Blob;

      this._appendAsset(obj);
    });
  };

  _loadBlob = (callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(this.blob);
    reader.onloadend = function () {
      callback(reader.result);
    };
  };

  _appendAsset = (assetObject) => {
    let content = this.element.querySelector('.content');

    if (content) {
      content.append(assetObject);
    }
  };

  _displayFile = () => {
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      const file = new File([this.rawBlob], this.fileName);
      window.navigator.msSaveOrOpenBlob(file);
      this.feedbackController.setLoadingState(true);
      return;
    }

    window.URL = window.URL || window.webkitURL;
    const fileType = this.mimeType.split('/')[0];
    switch (fileType) {
      case 'image': {
        this._loadImageFile();
        break;
      }
      default: {
        this._loadPdfOrTextFile();
        break;
      }
    }
  };

  _saveEconsent(callback) {
    this.EconsentService.updateEconsent(
      {
        ...this.model.status,
      },
      callback
    );
  }

  _finishActionSave() {
    this.navigateToPageTag('home');
  }
}
