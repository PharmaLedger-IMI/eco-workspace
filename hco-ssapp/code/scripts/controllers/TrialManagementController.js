import Constants from "../utils/Constants.js";
import CommunicationService from '../services/CommunicationService.js';
import NotificationsService from '../services/NotificationsService.js';
import TrialService from '../services/TrialService.js';
import SharedStorage from '../services/SharedStorage.js';
import TrialRepository from '../repositories/TrialRepository.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';

const {WebcController} = WebCardinal.controllers;

let getInitModel = () => {
    return {
        title: 'HomePage',
        trials: [],
        trialsModel: {
            title: {
                name: 'trial',
                label: 'Trial',
                value: 'Trial1',
            },
            date: {
                name: 'date',
                label: 'Date',
                value: 'dd.mm.yyyy',
            },
            description: {
                name: 'description',
                label: 'Description',
                value: 'Loren ipsum test test test test test test 1 ',
            },
        },
    };
};

export default class TrialManagementController extends WebcController {
    constructor(...props) {
        super(...props);

        console.log('Constructor TM Controller');
        this.setModel(getInitModel());
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial();
    }

    addMessageToNotificationDsu(message) {
        this.NotificationsService.saveNotification(message.message, (err, notification) => {
            if (err) {
                return console.log(err);
            }
        });
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.NotificationsService = new NotificationsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.ECO.HCO_IDENTITY);
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.TrialRepository = TrialRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerTrialDetails();
        this._attachHandlerTrialParticipants();
        this._attachHandlerBack();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _initTrial() {

        this.TrialService.getTrials((err, data) => {
            if (err) {
                return console.error(err);
            }
            this.model.trials = data;
        });
    }


    sendMessageToPatient(operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.ECO.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            shortDescription: shortMessage,
        });
    }

    _attachHandlerTrialDetails() {
        this.onTagEvent('trials:details', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-details', model.keySSI);
        });
    }

    _attachHandlerTrialParticipants() {
        this.onTagEvent('trials:participants', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-participants', model.keySSI);
        });
    }

    _attachHandlerBack() {
        this.onTagEvent('back', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            window.history.back();
        });
    }

}
