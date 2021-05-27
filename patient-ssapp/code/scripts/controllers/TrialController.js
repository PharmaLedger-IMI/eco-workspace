import Constants from './Constants.js';
import TrialService from '../services/TrialService.js';
import EconsentService from '../services/EconsentService.js';

const { WebcController } = WebCardinal.controllers;

export default class TrialController extends WebcController {
  constructor(...props) {
    super(...props);

    this.setModel({});

    this.model.trial = {};
    this.model.econsents = [];
    this.model.tpStatus = [];
    let receivedObject = this.history.win.history.state.state;
    this.model.keyssi = receivedObject.trialSSI;
    this.model.tpNumber = receivedObject.tpNumber;
    this._initServices(this.DSUStorage);
    this._initTrial();
    this._initHandlers();
  }

  _initServices(DSUStorage) {
    this.TrialService = new TrialService(DSUStorage);
    this.EconsentService = new EconsentService(this.DSUStorage);
  }

  _initHandlers() {
    this._attachHandlerConsentClick();
    this._attachHandlerSiteClick();
  }

  _initTrial() {
    this.TrialService.getTrial(this.model.keyssi, (err, trial) => {
      if (err) {
        return console.log(err);
      }
      this.model.trial = trial;
      this.model.tpEconsents = [];
      this.model.trial.color = Constants.getColorByTrialStatus(this.model.trial.status);
      this.TrialService.getEconsents(trial.keySSI, (err, data) => {
        if (err) {
          return console.log(err);
        }

        this.model.econsents = data?.map(econsent => {
          return econsent.versions.length === 0 ? econsent : {
            ...econsent,
            ...econsent.versions.sort((a,b) => new Date(b.versionDate) - new Date(a.versionDate))[0]
          }
        })

        this.EconsentService.getEconsentsStatuses((err, data) => {
          if (err) {
            return console.error(err);
          }
          this._setTpStatus(data);
        });
      });
    });
  }

  _attachHandlerConsentClick() {
    this.onTagEvent('go-to-econsent', 'click', (model, target, event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.navigateToPageTag('econsent', {
        tpNumber: this.model.tpNumber,
        trialuid: this.model.keyssi,
        ecoId: model.uid,
        ecoVersion: model.version,
      });
    });
  }

  _attachHandlerSiteClick() {
    this.on('go-to-site', (event) => {
      this.navigateToPageByTag('site', event.data);
    });
  }

  _setTpStatus(consents) {
    consents.forEach((consent) => {
      if (consent.type === 'Mandatory') {
        this.model.tpStatus = consent.actions.map((action, index) => {
          return {
            ...action,
            index: index + 1,
          };
        });
      }
    });
  }
}
