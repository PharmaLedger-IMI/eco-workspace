import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "./services/CommunicationService.js";
import DateTimeService from "./services/DateTimeService.js";

const {WebcController} = WebCardinal.controllers;

export default class EconsentSignController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel({
            econsent: {},
            ...this.history.win.history.state.state
        });

        let econsentTA = {
            name: "econsent",
            required: true,
            value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        }

        this.model.econsentTa = econsentTA;

        this.initConsent();

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    initConsent() {
        this.TrialService.getEconsent(this.model.trialSSI, this.model.econsentSSI, (err, data) => {
            debugger
            if (err) {
                return console.log(err);
            }
            this.model.econsent = {
                ...data,
                versionDateAsString: DateTimeService.convertStringToLocaleDate(data.versionDate)
            };
            debugger
        });
    }


    _attachHandlerEconsentSign() {
        this.onTagEvent('econsent:sign', 'click', (model, target, event) => {
                debugger
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                this.navigateToPageTag('econsent-sign', {
                    trialSSI: this.model.trialSSI,
                    econsentSSI: this.model.econsentSSI
                });
            }
        )
    }

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }

    sendMessageToSponsor(operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.SPONSOR_IDENTITY, {
            operation: operation,
            ssi: ssi,
            shortDescription: shortMessage,
        });
    }
}