import TrialService from "../services/TrialService.js";
import TrialParticipantsService from "../services/TrialParticipantsService.js";
import CommunicationService from "../services/CommunicationService.js";
import DateTimeService from "../services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        econsents: []
    }
}

export default class TrialParticipantController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state
        });

        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initConsents(this.model.trialSSI);
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
    }

    _initHandlers() {
        this._attachHandlerNavigateToEconsentVersions();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initConsents(keySSI) {
        this.TrialService.getEconsents(keySSI, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsents = data.map(consent => {
                return {
                    ...consent,
                    versionDateAsString: DateTimeService.convertStringToLocaleDate(consent.versionDate)
                }
            });
        });
    }

    _attachHandlerNavigateToEconsentVersions() {
        this.onTagEvent('navigate:ec', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.navigateToPageTag('econsent-versions', {
                    trialSSI: this.model.trialSSI,
                    econsentSSI: model.keySSI
                });
            }
        )
    }

    _showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}