import CommunicationService from '../services/CommunicationService.js';
import TrialService from '../services/TrialService.js';
import NotificationsService from '../services/NotificationsService.js';
import DateTimeService from '../services/DateTimeService.js';
import EconsentsStatusRepository from "../repositories/EconsentsStatusRepository.js";
import TrialParticipantRepository from "../repositories/TrialParticipantRepository.js";

const {WebcController} = WebCardinal.controllers;

export default class HomeController extends WebcController {
    constructor(...props) {
        super(...props);
        this.setModel({});
        this._initServices(this.DSUStorage);
        this._initHandlers();
        this._initTrials();
        this._initTrialParticipant();
        this._handleMessages();
    }

    addMessageToNotificationDsu(message) {
        this.NotificationsService.saveNotification(
            {
                ...message.message,
                uid: message.message.ssi,
                viewed: false,
                startDate: DateTimeService.convertStringToLocaleDate(),
            },
            (err, data) => {
                if (err) {
                    return console.log(err);
                }
            }
        );
    }

    _initServices(DSUStorage) {
        this.TrialService = new TrialService(DSUStorage);
        this.NotificationsService = new NotificationsService(DSUStorage);
        this.EconsentsStatusRepository = EconsentsStatusRepository.getInstance(DSUStorage);
        this.TrialParticipantRepository = TrialParticipantRepository.getInstance(DSUStorage);
        this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.PATIENT_IDENTITY);
    }

    _initHandlers() {
        this._attachHandlerTrialClick();
        this._attachHandlerNotifications();
        this._attachHandlerSites();
    }

    _initTrials() {
        this.model.trials = [];
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
                case 'refresh-trial': {
                    this.TrialService.reMountTrial(data.message.ssi, (err, trial) => {
                        this.TrialService.getEconsents(trial.keySSI, (err, consents) => {
                            if (err) {
                                return console.log(err);
                            }
                            this._saveConsentsStatuses(consents);
                        });
                    });
                    break;
                }
                case 'add-to-trial' : {
                    this.addMessageToNotificationDsu(data);
                    this._saveTrialParticipantInfo(data.message.useCaseSpecifics);
                    this.TrialService.mountTrial(data.message.ssi, (err, trial) => {
                        if (err) {
                            return console.log(err);
                        }
                        trial.uid = trial.keySSI;
                        this.TrialService.updateTrial(
                            {
                                ...trial,
                                tpNumber: data.message.useCaseSpecifics.did,
                            },
                            (err, trial) => {
                                if (err) {
                                    return console.log(err);
                                }
                                this.model.trials.push(trial);
                                this.TrialService.getEconsents(trial.keySSI, (err, consents) => {
                                    if (err) {
                                        return console.log(err);
                                    }
                                    this._saveConsentsStatuses(consents);
                                });

                                console.log(trial);
                            }
                        );
                    });
                    break;
                }
                case 'update-tpNumber': {
                    // this.addMessageToNotificationDsu(data);
                    this._saveTrialParticipantInfo(data.message.useCaseSpecifics);
                    break;
                }
            }
        });
    }

    _attachHandlerTrialClick() {
        this.onTagEvent('home:trial', 'click', (trial, target, event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.navigateToPageTag('trial', {
                trialSSI: trial.keySSI,
                tpNumber: trial.tpNumber,
            });
        });
    }

    _attachHandlerSites() {
        this.onTagClick('home:site', (event) => {
            this.navigateToPageTag('site');
        });
    }

    _attachHandlerNotifications() {
        this.onTagClick('home:notifications', (event) => {
            this.navigateToPageTag('notifications');
        });
    }

    _saveConsentsStatuses(consents) {
        consents.forEach((consent, i) => {
            consent.actions = [];
            if (consent.type === 'Mandatory') {
                consent.actions.push({name: 'required'});
            }
            consent.foreignConsentId = consent.keySSI;
            this.EconsentsStatusRepository.create(consent, (err, data) => {
                if (err) {
                    return console.log(err);
                }
                console.log('database record' + data);
            })

        });
    }

    _initTrialParticipant() {
        this.model.tp = {};
        this.TrialParticipantRepository.findAll((err, data) => {
            if (err) {
                return console.log(err);
            }
            if (data && data.length > 0) {
                this.model.tp = data[0];
            }
        });
    }

    _saveTrialParticipantInfo(data) {
        let trialParticipant = {
            name: data.tpName, tpNumber: data.tpNumber, did: data.did
        }

        if (!this.model.tp||!this.model.tp.name) {
            this.TrialParticipantRepository.create(trialParticipant, (err, data) => {
                if (err) {
                    return console.log(err);
                }

            });
        } else {

            this.model.tp.tpNumber = trialParticipant.tpNumber;
            this.TrialParticipantRepository.update(this.model.tp.uid, this.model.tp, (err, data) => {
                if (err) {
                    return console.log(err);
                }
            });
        }

    }
}
