import TrialService from '../services/TrialService.js';


const ecoServices = require('eco-services');
const DateTimeService = ecoServices.DateTimeService;
const BaseRepository = ecoServices.BaseRepository;
const {WebcController} = WebCardinal.controllers;
let getInitModel = () => {
    return {
        econsent: {},
        versions: [],
    };
};
export default class EconsentVersionsController extends WebcController {
    constructor(...props) {
        super(...props);

        this.model.versions = [];
        this.setModel({});
        let receivedObject = this.history.win.history.state.state;
        this.model.trialSSI = receivedObject.trialSSI;
        this.model.econsentSSI = receivedObject.econsentSSI;
        this.model.tpDid = receivedObject.tpDid;
        this._initServices();
        this._initHandlers();
        this._initTrialAndConsent();
    }

    _initServices() {
        this.TrialService = new TrialService();
        this.EconsentsStatusRepository = BaseRepository.getInstance(BaseRepository.identities.PATIENT.ECOSESENT_STATUSES);
    }

    _initHandlers() {
        this._attachHandlerBack();
    }

    _initTrialAndConsent() {
        this.TrialService.getTrial(this.model.trialSSI, (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;
        });
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsent = data;

            this.model.versions = data.versions;
        });
    }


    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

    _attachHandlerView() {
        this.onTagEvent('consent:view', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.navigateToPageTag('econsent-sign', {
                trialSSI: this.model.trialSSI,
                econsentSSI: model.econsentSSI,
                ecoVersion: model.lastVersion,
                tpDid: this.model.tp.did,
                controlsShouldBeVisible: false
            });
        });
    }
}
