import TrialService from "./services/TrialService.js";
import TrialParticipantsService from "./services/TrialParticipantsService.js";
import CommunicationService from "./services/CommunicationService.js";


const {WebcController} = WebCardinal.controllers;

export default class TrialController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.TrialService = new TrialService(this.DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(this.DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
        this.setModel({trial: {}, trialParticipants: []});
        this.keyssi = this.history.win.history.state.state;
        this.getTrial();


        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });

        this._attachHandlerAddTrialParticipant();
    }

    getTrial() {

        this.TrialService.getTrial(this.keyssi, (err, trial) => {
            if (err) {
                debugger;
                return console.log(err);
            }
            debugger;
            this.model.trial = trial;


            this.TrialParticipantService.getTPS(trial.number, (err, data) => {
                if (err) {
                    console.log(err);
                    debugger;
                    return;
                }

                console.log("All TPS " + data);
                debugger;
                this.model.trialParticipants = data.tps;
            });

        });

    }

    _attachHandlerAddTrialParticipant() {

        this.onTagEvent('add:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
                this.showModalFromTemplate('add-new-tp', (event) => {
                        const response = event.detail;
                        this.createTpDsu(event.detail);
                        this.showFeedbackToast('Result', 'Trial participant added successfully!', 'toast');
                        console.log(response);
                    },
                    (event) => {
                        const response = event.detail;

                        console.log(response);

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
            debugger;
            if (err) {
                console.log(err);
                this.showFeedbackToast('Result', 'ERROR: There was an issue creating the trial participant', 'toast');
                return;
            }
            console.log("New tp added " + tp);
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