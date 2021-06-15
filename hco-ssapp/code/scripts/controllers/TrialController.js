const {WebcController} = WebCardinal.controllers;
import Constants from '../utils/Constants.js';
import TrialService from '../services/TrialService.js';
import TrialParticipantsService from '../services/TrialParticipantsService.js';
import CommunicationService from '../services/CommunicationService.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

let getInitModel = () => {
    return {
        trial: {},
        trialParticipants: [],
    };
};

export default class TrialController extends WebcController {

    constructor(...props) {
        super(...props);
        this.setModel({
            ...getInitModel(),
            trialSSI: this.history.win.history.state.state,
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
        this.TrialService.getTrial(keySSI, async (err, trial) => {
            if (err) {
                return console.log(err);
            }
            this.model.trial = trial;
            // debugger;
            // this.model.trialParticipants1 = await this.TrialParticipantRepository.filterAsync(`trialNumber == ${this.model.trial.id}`, 'asc', 30);
            // debugger;
            // this.model.trialParticipants2 = await this.TrialParticipantRepository.filterAsync([`__version >= 0`,`trialNumber == ${this.model.trial.id}`],'asc', 30);
            this.model.trialParticipants = (await this.TrialParticipantRepository.findAllAsync()).filter(tp => tp.trialNumber === this.model.trial.id);



        });
    }

    _attachHandlerNavigateToParticipant() {
        this.onTagEvent('navigate:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant', {
                trialSSI: this.model.trialSSI,
                tpUid: model.uid,
                trialParticipantNumber: model.number,
            });
        });
    }

    _attachHandlerAddTrialParticipant() {
        this.onTagEvent('add:tp', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showModalFromTemplate(
                'add-new-tp',
                (event) => {
                    const response = event.detail;
                    this.createTpDsu(response);
                    this._showFeedbackToast('Result', Constants.MESSAGES.HCO.FEEDBACK.SUCCESS.ADD_TRIAL_PARTICIPANT);
                },
                (event) => {
                    const response = event.detail;
                }
            ),
                {
                    controller: 'AddTrialParticipantController',
                    disableExpanding: false,
                    disableBackdropClosing: false,
                    title: 'Add Trial Participant',
                };
        });
    }


    async createTpDsu(tp) {
        tp.trialNumber = this.model.trial.id;
        tp.status = 'screened';
        let trialParticipant = await this.TrialParticipantRepository.createAsync(tp);
        this.model.trialParticipants.push(trialParticipant);
        this.sendMessageToPatient(
            'add-to-trial',
            this.model.trialSSI,
            trialParticipant.did,
            Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.ADD_TO_TRIAL
        );
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
