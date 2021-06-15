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

export default class TrialParticipantsController extends WebcController {

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
        this._attachHandlerViewTrialParticipantDetails();
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
            let actions = await this._getEconsentActionsMappedByUser(keySSI);
            this.model.trialParticipants = await this._getTrialParticipantsMappedWithActionRequired(actions);
        });
    }

    async _getTrialParticipantsMappedWithActionRequired(actions) {
        return (await this.TrialParticipantRepository.findAllAsync())
            .filter(tp => tp.trialNumber === this.model.trial.id)
            .map(tp => {
                let tpActions = actions[tp.did];
                if (tpActions.length === 0) {
                    return {
                        ...tp,
                        actionNeeded: 'No action required'
                    }
                }
                let lastAction = tpActions[tpActions.length - 1];
                let actionNeeded = 'No action required';
                switch (lastAction.action.name) {
                    case 'withdraw': {
                        actionNeeded = 'TP Withdrawed';
                        break;
                    }
                    case 'withdraw-intention': {
                        actionNeeded = 'Reconsent required';
                        break;
                    }
                    case 'sign': {
                        actionNeeded = 'Acknowledgement required';
                        break;
                    }
                }
                return {
                    ...tp,
                    actionNeeded: actionNeeded
                }
            })
    }

    async _getEconsentActionsMappedByUser(keySSI) {
        let actions = {};
        (await this.TrialService.getEconsentsAsync(keySSI))
            .forEach(econsent => {
                econsent.versions.forEach(version => {
                    version.actions.forEach(action => {
                        if (actions[action.tpNumber] === undefined) {
                            actions[action.tpNumber] = []
                        }
                        actions[action.tpNumber].push({
                            econsent: {
                                uid: econsent.uid,
                                keySSI: econsent.keySSI,
                                name: econsent.name,
                                type: econsent.type,
                            },
                            version: {
                                attachmentKeySSI: version.attachmentKeySSI,
                                version: version.version,
                                versionDate: version.versionDate,
                            },
                            action: action
                        })
                    })
                })
            });
        return actions;
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
        this.onTagEvent('add:ts', 'click', (model, target, event) => {
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

    _attachHandlerViewTrialParticipantDetails() {
        this.onTagEvent('tp:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participant-details', {
                trialSSI: this.model.trialSSI,
                tpUid: model.uid
            });
        });
    }


    async createTpDsu(tp) {
        const currentDate = new Date();
        tp.trialNumber = this.model.trial.id;
        tp.status = 'screened';
        tp.enrolledDate = currentDate.toLocaleDateString();
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
