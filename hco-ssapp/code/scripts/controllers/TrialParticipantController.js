import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "./services/CommunicationService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialParticipantController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel({econsents: []});
        let keySSI = this.history.win.history.state.state;
        this.initConsents(keySSI);

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    initConsents(keySSI) {
        this.TrialService.getEconsents(keySSI, (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.model.econsents = data.econsents;
        });
    }

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}