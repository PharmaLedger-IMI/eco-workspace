import Constants from "../utils/Constants.js";
import CommunicationService from '../services/CommunicationService.js';
import NotificationsService from '../services/NotificationsService.js';
import TrialService from '../services/TrialService.js';
import SharedStorage from '../services/SharedStorage.js';
import TrialRepository from '../repositories/TrialRepository.js';
import TrialParticipantRepository from '../repositories/TrialParticipantRepository.js';
import NotificationsRepository from "../repositories/NotificationsRepository.js";

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

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);

        this.setModel(getInitModel());
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._handleMessages();
    }

    addMessageToNotificationDsu(message) {

        this.NotificationsRepository.create(message, (err, data) => {
            if (err) {
                return console.error(err);
            }
        });

    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.NotificationsService = new NotificationsService(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.NotificationsRepository = NotificationsRepository.getInstance(DSUStorage);
    }

    _initHandlers() {

        this._attachHandlerNotifications();
        this._attachHandlerPatients();
        this._attachHandlerTrialManagement();
        this.on('openFeedback', (e) => {
            this.feedbackEmitter = e.detail;
        });
    }

    _handleMessages() {
        this.CommunicationService.listenForMessages((err, data) => {
            if (err) {
                return console.error(err);
            }
            data = JSON.parse(data);
            switch (data.message.operation) {
                case 'add-trial': {
                    this.addMessageToNotificationDsu(data);
                    this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                        if (err) {
                            return console.log(err);
                        }

                    });
                    break;
                }
                case 'add-econsent-version': {
                    this.TrialService.mountTrial(data.message.ssi, () => {
                    });
                    this.sendMessageToPatient('refresh-trial', data.message.ssi,
                        Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
                    break;
                }
                case 'add-consent': {
                    this.TrialService.unmountTrial(data.message.ssi, (err, response) => {
                        this.TrialService.mountTrial(data.message.ssi, (err, response) => {
                        })
                    })
                    this.sendMessageToPatient('refresh-trial', data.message.ssi,
                        Constants.MESSAGES.HCO.COMMUNICATION.PATIENT.REFRESH_TRIAL);
                    break;
                }
                case 'delete-trial': {
                    break;
                }
                case 'update-econsent': {
                    this._updateEconsentWithDetails(data.message);
                    break;
                }
            }
        });
    }

    _updateEconsentWithDetails(message) {

        this.TrialService.getEconsent(message.useCaseSpecifics.trialSSI, message.ssi, (err, econsent) => {
            if (err) {
                return console.log(err);
            }
            let currentVersionIndex = econsent.versions.findIndex(eco => eco.version === message.useCaseSpecifics.version)
            if (currentVersionIndex === -1) {
                return console.log(`Version ${message.useCaseSpecifics.version} of the econsent ${message.ssi} does not exist.`)
            }
            let currentVersion = econsent.versions[currentVersionIndex]
            if (currentVersion.actions === undefined) {
                currentVersion.actions = [];
            }
            currentVersion.actions.push({
                ...message.useCaseSpecifics.action,
                tpNumber: message.useCaseSpecifics.tpNumber
            });
            let actionNeeded = 'No action required';
            switch (message.useCaseSpecifics.action.name) {
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

            this.TrialParticipantRepository.filter(`did == ${message.useCaseSpecifics.tpNumber}`, 'ascending', 30, (err, tps) => {
                if (tps && tps.length > 0) {
                    let tp = tps[0];
                    tp.actionNeeded = actionNeeded;
                    tp.tpSigned = true;
                    this.TrialParticipantRepository.update(tp.uid, tp, (err, trialParticipant) => {
                        if (err) {
                            return console.log(err);
                        }
                        console.log(trialParticipant);
                    });
                }
            });


            econsent.uid = econsent.keySSI;
            econsent.versions[currentVersionIndex] = currentVersion;
            this.TrialService.updateEconsent(message.useCaseSpecifics.trialSSI, econsent, (err, response) => {
                if (err) {
                    return console.log(err);
                }
            });
        });
    }

    sendMessageToPatient(operation, ssi, shortMessage) {
        this.CommunicationService.sendMessage(CommunicationService.identities.PATIENT_IDENTITY, {
            operation: operation,
            ssi: ssi,
            shortDescription: shortMessage,
        });
    }

    _attachHandlerTrialManagement() {
        this.onTagEvent('home:trials', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial-management');
        });
    }

    _attachHandlerPatients() {
        this.onTagEvent('home:patients', 'click', (model, target, event) => {

        });
    }

    _attachHandlerNotifications() {
        this.onTagEvent('home:notifications', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('notifications');
        });
    }
}
