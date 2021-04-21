import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "./services/CommunicationService.js";
import DateTimeService from "./services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialParticipantController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel({econsents: []});
        this.model.trialSSI = this.history.win.history.state.state;
        this.initConsents(this.model.trialSSI);

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });

        this._attachHandlerNavigateToEconsentVersions();
    }

    initConsents(keySSI) {
        this.TrialService.getEconsents(keySSI, (err, data) => {
            debugger
            if (err) {
                return console.log(err);
            }
            this.model.econsents = data.econsents.map(consent => {
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

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}