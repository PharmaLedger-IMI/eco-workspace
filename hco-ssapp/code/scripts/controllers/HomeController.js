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

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);

        this.setModel(getInitModel());
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrial();
        this._handleMessages();
        this.testDatabase();
    }

    testDatabase() {
        // TEST DATABASE ONLY => TODO: REMOVE THIS

        let testObject = {
            someKey: 'someValue',
            rms: 'delivers',
        };

        this.StorageService.insertRecord('testTable', testObject, (err, obj) => {
            // if err is something like <Cannot read property 'originalMessage' of undefined> it means that this key already exist.
            console.log('StorageService.insertRecord', err, obj);
            this.StorageService.getRecord('testTable', obj.pk, (err, data) => {
                console.log('StorageService.getRecord', err, data);
            });
        });

        this.TrialRepository.create(testObject, (err, obj) => {
            let tempPK = obj.pk;
            // if err is something like <Cannot read property 'originalMessage' of undefined> it means that this key already exist.
            console.log('TrialRepository.create', err, obj);
            this.TrialRepository.findBy(tempPK, (err, data) => {
                console.log('TrialRepository.findBy', err, data);
            });

            this.TrialRepository.findByAsync(tempPK).then((result) =>
                console.log('this.TrialRepository.findByAsync#Promise', result)
            );

            (async () => {
                let result = await this.TrialRepository.findByAsync(tempPK);
                console.log('this.TrialRepository.findByAsync#await', result);
            })();
        });
        // END DATABASE TESTING
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
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.HCO_IDENTITY);
        this.StorageService = SharedStorage.getInstance(DSUStorage);
        this.TrialRepository = TrialRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
    }

    _initHandlers() {
        this._attachHandlerTrialDetails();
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
                        this.model.trials.push(trial);
                    });
                    break;
                }
                case 'add-econsent-version': {
                    this.TrialService.mountTrial(data.message.ssi, () => {});
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
            this.TrialParticipantRepository.findAll((err, data) => {
                if (err) {
                    return console.log(err);
                }
                let tpNumber = message.useCaseSpecifics.tpNumber;
                let tp = data.find((elem) => elem.number === tpNumber);
                if (tp === undefined) {
                    return console.log(`TP with number ${tpNumber} does not exist`);
                }
                tp.actionNeeded = actionNeeded;
                this.TrialParticipantRepository.update(tp.uid, tp, (err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                });
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

    _attachHandlerTrialDetails() {
        this.onTagEvent('home:trial', 'click', (model, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial', model.keySSI);
        });
    }
}
