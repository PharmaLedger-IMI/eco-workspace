import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "./services/CommunicationService.js";

const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {
    constructor(element, history) {
        super(element, history);

        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);

        this.setModel({trial: {}, trialParticipants: []});
        let keySSI = this.history.win.history.state.state;
        this.model.trialSSI = keySSI;
        this.initTrial(keySSI);

        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });

        this._attachHandlerAddTrialParticipant();
        this._attachHandlerNavigateToParticipant();
    }

    initTrial(keySSI) {
        this.TrialService.getTrial(keySSI, (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;
            this.TrialParticipantService.getTPS(trial.number, (err, data) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trialParticipants = data.tps;
            });
        });
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                debugger
                this.navigateToPageTag('trial-participant', this.model.trialSSI);
            }
        )
    }

    _attachHandlerAddTrialParticipant() {
        this.onTagEvent('add:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.showModalFromTemplate('add-new-tp', (event) => {
                        const response = event.detail;
                        this.createTpDsu(response);
                        this.showFeedbackToast('Result', 'Trial participant added successfully!', 'toast');
                    },
                    (event) => {
                        const response = event.detail;
                    }), {
                    controller: 'AddTrialParticipantController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Add Trial Participant',
                }
            }
        )
    }

    createTpDsu(tp) {
        tp.trialNumber = this.model.trial.number;
        tp.status = "enrolled";
        this.TrialParticipantService.saveTrialParticipant(tp, (err, tp) => {
            if (err) {
                this.showFeedbackToast('Result', 'ERROR: There was an issue creating the trial participant', 'toast');
                return console.log(err);
            }
            this.model.trialParticipants.push(tp);
            this.sendMessageToPatient("add-to-trial", this.keyssi, "you were added to trial");
        });

    }

    sendMessageToPatient(operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            shortDescription: shortMessage,
        });
    }

    showFeedbackToast(title, message, alertType) {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}