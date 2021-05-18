const {WebcController} = WebCardinal.controllers;
import Constants from "../utils/Constants.js";
import TrialService from "../services/TrialService.js";
import TrialParticipantsService from "../services/TrialParticipantsService.js";
import CommunicationService from '../services/CommunicationService.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: []
    }
}

export default class TrialController extends WebcController {
    constructor(element, history) {
        super(element, history);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state
        });
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial(this.model.trialSSI);
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.TrialParticipantService = new TrialParticipantsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerAddTrialParticipant();
        this._attachHandlerNavigateToParticipant();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initTrial(keySSI) {
        this.TrialService.getTrial(keySSI, (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;
            this.TrialParticipantRepository.findAll( (err, data) => {
                if (err) {
                    return console.log(err);
                }
                this.model.trialParticipants = data;
            });
        });
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
                event.preventDefault();
                event.stopImmediatePropagation();
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
                        this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ADD_TRIAL_PARTICIPANT);
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
        tp.status = "screened";
        this.TrialParticipantRepository.create(tp, (err, trialParticipant) => {
            if (err) {
                this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.ERROR.ADD_TRIAL_PARTICIPANT);
                return console.log(err);
            }
            this.model.trialParticipants.push(trialParticipant);
            this.sendMessageToPatient("add-to-trial", this.model.trialSSI, trialParticipant.number,
                Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.ADD_TO_TRIAL);
        });
    }

    sendMessageToPatient(operation, ssi, trialParticipantNumber, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            useCaseSpecifics: {
                tpNumber: trialParticipantNumber,
            },
            shortDescription: shortMessage,
        });
    }

    _showFeedbackToast(title, message, alertType = 'toast') {
        if (typeof this.feedbackEmitter === 'function') {
            this.feedbackEmitter(message, title, alertType);
        }
    }
}