const { WebcController } = WebCardinal.controllers;
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import DateTimeService from '../services/DateTimeService.js';
import FileDownloader from '../utils/FileDownloader.js';
import Constants from '../utils/Constants.js';

const TEXT_MIME_TYPE = 'text/';

let getInitModel = () => {
  return {
    econsent: {},
  };
};

export default class EconsentSignController extends WebcController {
  constructor(...props) {
    super(...props);

    this.setModel({
      ...getInitModel(),
      ...this.history.win.history.state.state,
    });

    this._initServices(this.DSUStorage);
    this._initHandlers();
    this._initConsent();
  }

  _initServices(DSUStorage) {
    this.TrialService = new TrialService(DSUStorage);
    this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
    this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
  }

  _initHandlers() {
    this._attachHandlerEconsentSign();
    this.on('openFeedback', (e) => {
      this.feedbackEmitter = e.detail;
    });
  }

  _initConsent() {
    this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, econsent) => {
      if (err) {
        return console.log(err);
      }
      this.model.econsent = {
        ...econsent,
        versionDateAsString: DateTimeService.convertStringToLocaleDate(econsent.versionDate),
      };
      let attachment = econsent.attachment;
      this.FileDownloader = new FileDownloader(
        this._getEconsentFilePath(this.model.trialSSI, this.model.econsentSSI, attachment),
        attachment
      );
      this._downloadFile();
    });
  }

  sendMessageToSponsor(operation, shortMessage) {
    this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, {
      operation: operation,
      ssi: this.model.econsentSSI,
      useCaseSpecifics: {
        tpNumber: this.model.econsent.tpNumber,
        operationDate: DateTimeService.getCurrentDateAsISOString(),
        trialSSI: this.model.trialSSI,
      },
      shortDescription: shortMessage,
    });
  }

  _getEconsentFilePath(trialSSI, consentSSI, fileName) {
    return '/trials/' + trialSSI + '/consent/' + consentSSI + '/consent/' + fileName;
  }

  _attachHandlerEconsentSign() {
    this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const currentDate = new Date();
      this.model.econsent.hcoSign = {
        date: currentDate.toISOString(),
        toShowDate: currentDate.toLocaleDateString(),
      };
      this.TrialService.updateEconsent(this.model.trialSSI, this.model.econsent, (err, response) => {
        if (err) {
          return console.log(err);
        }
      });
      this.sendMessageToSponsor('sign-econsent', Constants.MESSAGES.HCO.COMMUNICATION.SPONSOR.SIGN_ECONSENT);
      this.navigateToPageTag('home');
    });
  }

  _downloadFile = () => {
    this.FileDownloader.downloadFile((downloadedFile) => {
      this.rawBlob = downloadedFile.rawBlob;
      this.mimeType = downloadedFile.contentType;
      this.blob = new Blob([this.rawBlob], {
        type: this.mimeType,
      });

      if (this.mimeType.indexOf(TEXT_MIME_TYPE) !== -1) {
        this._prepareTextEditorViewModel();
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

  _showFeedbackToast(title, message, alertType) {
    if (typeof this.feedbackEmitter === 'function') {
      this.feedbackEmitter(message, title, alertType);
    }
  }
}
